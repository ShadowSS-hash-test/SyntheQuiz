# controllers/rag_controller.py

import os
import uuid
import json
import asyncio
import asyncpg
from fastapi import HTTPException, status
from pydantic import BaseModel, Field
from typing import Literal, Optional

from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings

from util.DocumentLoader import load_document
from util.config import (
    EMBEDDING_BATCH_SIZE,
    EMBEDDING_BATCH_DELAY_SECONDS,
    CHUNK_SIZE,
    CHUNK_OVERLAP,
    RETRIEVAL_TOP_K,
)

# ============================================================
# INITIALIZE MODELS
# ============================================================

model = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0.3,
    max_tokens=None,
    timeout=None,
    max_retries=2,
)

embeddings_model = GoogleGenerativeAIEmbeddings(model="gemini-embedding-001")


# ============================================================
# PYDANTIC STRUCTURED OUTPUT SCHEMAS
# ============================================================

class QuizQuestion(BaseModel):
    """Matches QuestionPayload in quiz_controller.py perfectly."""
    question: str
    question_type: Literal["mcq", "true_false"]
    options: dict[str, str] = Field(
        description="Keys must be A, B, C, D for mcq. T and F only for true_false."
    )
    correct_answer: Literal["A", "B", "C", "D", "T", "F"] = Field(
        description="The key of the correct option."
    )
    explanation: Optional[str] = Field(
        default=None, 
        description="Why the correct answer is right. Required for plain_text, optional for RAG."
    )


class Quiz(BaseModel):
    questions: list[QuizQuestion]


# (Optional: You can actually just reuse QuizQuestion for RAG now 
# since explanation is Optional, but if you want strict separation:)
class RAGQuizQuestion(BaseModel):
    question: str
    question_type: Literal["mcq", "true_false"]
    options: dict[str, str] = Field(
        description="Keys must be A, B, C, D for mcq. T and F only for true_false."
    )
    correct_answer: Literal["A", "B", "C", "D", "T", "F"] = Field(
        description="The key of the correct option."
    )


class RAGQuiz(BaseModel):
    questions: list[RAGQuizQuestion]


# ============================================================
# SYSTEM PROMPTS
# ============================================================

QUIZ_SYSTEM_PROMPT = """
You are an expert quiz generator. Your job is to generate high-quality quiz questions based on the given topic, difficulty, and question type.

RULES:
- Generate exactly the number of questions requested. No more, no less.
- Return ONLY a valid JSON array matching the schema. No markdown, no backticks, no preamble.
- Every question must have exactly these fields: question, question_type, options, correct_answer, explanation.
- For "mcq" question_type, always provide exactly 4 options labeled A, B, C, D. The correct_answer must be A, B, C, or D.
- For "true_false" question_type, options must be exactly {"T": "True", "F": "False"}. The correct_answer must be "T" or "F".
- Explanation must clearly state why the correct answer is right.
- All questions must be factually accurate. Never guess or hallucinate facts.
- Questions must match the requested difficulty strictly:
    easy → basic recall, straightforward concepts
    medium → application of concepts, some reasoning required
    hard → edge cases, deep understanding, tricky distinctions

DIFFICULTY CONSISTENCY:
- If difficulty is "easy", do not sneak in hard questions.
- If difficulty is "hard", do not pad with easy questions.
"""

RAG_QUIZ_SYSTEM_PROMPT = """
You are an expert quiz generator. Generate quiz questions using ONLY the
information in the provided CONTEXT below. The context comes directly from
a document the educator uploaded - your questions must be grounded in it,
not in your own general knowledge.

RULES:
- Generate exactly the number of questions requested. No more, no less.
- Every question must have exactly these fields: question, question_type, options, correct_answer.
- For "mcq" question_type, always provide exactly 4 options labeled A, B, C, D. The correct_answer must be A, B, C, or D.
- For "true_false" question_type, options must be exactly {"T": "True", "F": "False"}. The correct_answer must be "T" or "F".
- Base every question strictly on the CONTEXT. Do not introduce facts that aren't supported by it.
- If the CONTEXT does not genuinely cover the requested topic, return an empty questions list.

EXAM-STYLE QUESTION INDEPENDENCE (CRITICAL):
- Write questions exactly as they would appear on a standard, standalone, closed-book exam. 
- The student reading the question has NOT seen your context document.
- NEVER mention document structure, formatting, or locations (e.g., do NOT use phrases like "According to Step 2", "In the first paragraph", "Based on the table", "According to the context").
- Frame the question entirely around the factual concept itself.

EXAMPLES OF WHAT TO AVOID VS WHAT TO WRITE:
* BAD: "According to Step 2, what is done with the selected starting vertex for traversal?"
* GOOD: "What is done with the selected starting vertex when initiating a graph traversal?"

* BAD: "Based on the diagram in the text, what structure implements BFS?"
* GOOD: "Which data structure is typically used to implement a BFS traversal?"

DIFFICULTY:
- Questions must match the requested difficulty strictly:
    easy → basic recall
    medium → application of concepts
    hard → edge cases, tricky distinctions
"""
# ============================================================
# DOCUMENT INGESTION & PGVECTOR HELPERS
# ============================================================

def chunk_documents(
    documents: list[Document],
    document_id: str,
    user_id: str,
    chunk_size: int = CHUNK_SIZE,
    chunk_overlap: int = CHUNK_OVERLAP,
) -> list[Document]:
    """Splits loaded text sequences down into overlapping context chunks."""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    chunks = splitter.split_documents(documents)

    for chunk in chunks:
        chunk.metadata["document_id"] = document_id
        chunk.metadata["user_id"] = user_id

    return chunks


async def initialize_document(
    file_path: str, 
    user_id: uuid.UUID, 
    course_id: Optional[uuid.UUID], 
    db: asyncpg.Connection
) -> str:
    """
    Loads, tracks, chunks, embeds, and saves document vectors into PostgreSQL pgvector.
    Runs inside a transaction block to prevent partial storage states.
    """
    try:
        document = load_document(file_path)
        filename = os.path.basename(file_path)
        
        async with db.transaction():
            # 1. Track parent record in the documents table
            doc_row = await db.fetchrow(
                """
                INSERT INTO documents (user_id, course_id, filename)
                VALUES ($1, $2, $3)
                RETURNING document_id
                """,
                user_id,
                course_id,
                filename
            )
            document_id = str(doc_row["document_id"])
            
            # 2. Form split boundaries
            chunks = chunk_documents(document, document_id, str(user_id))
            
            # 3. Generate & stream out text elements in batches safely
            for i in range(0, len(chunks), EMBEDDING_BATCH_SIZE):
                batch = chunks[i : i + EMBEDDING_BATCH_SIZE]
                texts = [c.page_content for c in batch]
                
                # Fetch vector list from Langchain Google Embeddings API
                embeddings = await asyncio.to_thread(embeddings_model.embed_documents, texts)
                
                for chunk, embedding in zip(batch, embeddings):
                    # Format standard numeric float array to match pgvector's string parser standard
                    vector_str = str(embedding)
                    
                    await db.execute(
                        """
                        INSERT INTO document_chunks (document_id, user_id, content, embedding, metadata)
                        VALUES ($1, $2, $3, $4::vector, $5::jsonb)
                        """,
                        uuid.UUID(document_id),
                        user_id,
                        chunk.page_content,
                        vector_str,
                        json.dumps(chunk.metadata)
                    )
                
                # Respect rate limits
                if (i + EMBEDDING_BATCH_SIZE) < len(chunks):
                    await asyncio.sleep(EMBEDDING_BATCH_DELAY_SECONDS)
                    
        return document_id

    except Exception as e:
        print(f"Error in initialize_document: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to ingest document resources cleanly: {str(e)}",
        )


async def retrieve_relevant_chunks(
    query: str,
    user_id: uuid.UUID,
    document_id: Optional[uuid.UUID] = None,
    k: int = RETRIEVAL_TOP_K,
    db: asyncpg.Connection = None
) -> list[str]:
    """
    Natively performs cosine-similarity search using the pgvector `<=>` operator.
    Returns all retrieved chunks up to the limit k.
    """
    try:
        # Compute vector representations for the incoming search text
        query_embedding = await asyncio.to_thread(embeddings_model.embed_query, query)
        vector_str = str(query_embedding)

        if document_id:
            rows = await db.fetch(
                """
                SELECT content
                FROM document_chunks
                WHERE user_id = $2 AND document_id = $3
                ORDER BY embedding::halfvec(3072) <=> $1::halfvec(3072)
                LIMIT $4
                """,
                vector_str,
                user_id,
                document_id,
                k
            )
        else:
            rows = await db.fetch(
                """
                SELECT content
                FROM document_chunks
                WHERE user_id = $2
                ORDER BY embedding::halfvec(3072) <=> $1::halfvec(3072)
                LIMIT $3
                """,
                vector_str,
                user_id,
                k
            )

        # Map rows directly to a list of strings
        return [row["content"] for row in rows]

    except Exception as e:
        print(f"Error inside retrieve_relevant_chunks: {e}")
        return []

# ============================================================
# GENERATION ENDPOINTS
# ============================================================

async def generate_quiz_without_notes(
    num_questions: int, 
    difficulty: str, 
    question_type: str, 
    topic: str
) -> list[QuizQuestion]:
    """Generates generic topic quizzes purely leveraging raw model knowledge parameters."""
    try:
        structured_model = model.with_structured_output(Quiz)
        user_message = f"Generate {num_questions} {difficulty} {question_type} questions about: {topic}"
        messages = [("system", QUIZ_SYSTEM_PROMPT), ("human", user_message)]
        
        response = await structured_model.ainvoke(messages)
        return response.questions
    except Exception as e:
        print(f"Error in generate_quiz_without_notes: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate standard text quiz questions.",
        )


async def generate_quiz_from_document(
    document_id: uuid.UUID,
    user_id: uuid.UUID,
    topic: str,
    num_questions: int,
    difficulty: str,
    question_type: str,
    db: asyncpg.Connection
) -> list[RAGQuizQuestion]:
    """Retrieves document chunks from pgvector and generates grounded context questions."""
    try:
        relevant_chunks = await retrieve_relevant_chunks(
            query=topic, user_id=user_id, document_id=document_id, db=db
        )


        if not relevant_chunks:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No relevant content found in the uploaded document for this topic."
            )

        context = "\n\n---\n\n".join(relevant_chunks)
        structured_model = model.with_structured_output(RAGQuiz)

        user_message = f"CONTEXT:\n{context}\n\nGenerate {num_questions} {difficulty} {question_type} questions about: {topic}\nBase the questions strictly on the CONTEXT above."
        messages = [
            ("system", RAG_QUIZ_SYSTEM_PROMPT),
            ("human", user_message),
        ]

        response = await structured_model.ainvoke(messages)

        if not response.questions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"The following topic is not covered in this document: '{topic}'"
            )

        return response.questions

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in generate_quiz_from_document: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An expected failure occurred generating RAG document items.",
        )