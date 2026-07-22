import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import BaseModel, Field
from typing import Literal
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from config import EMBEDDING_BATCH_SIZE, EMBEDDING_BATCH_DELAY_SECONDS,CHUNK_SIZE, CHUNK_OVERLAP, CHROMA_DB_PATH,RETRIEVAL_TOP_K
import time
from langchain_chroma import Chroma
from DocumentLoader import load_document
import uuid
import asyncio


load_dotenv()

if os.environ['GOOGLE_API_KEY']:
    print("API key loaded")


class QuizQuestion(BaseModel):
    id: int
    question: str
    type: Literal["mcq", "true_false"]
    options: dict[str, str] = Field(
        description="Keys must be A, B, C, D for mcq. A and B only for true_false."
    )
    correct_answer: Literal["A", "B", "C", "D"] = Field(
        description="The letter of the correct option only"
    )
    explanation: str = Field(
        description="Why the correct answer is right"
    )


class Quiz(BaseModel):
    questions: list[QuizQuestion]


model = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0.3,  
    max_tokens=None,
    timeout=None,
    max_retries=2,
   
)


class RAGQuizQuestion(BaseModel):
    id: int
    question: str
    type: Literal["mcq", "true_false"]
    options: dict[str, str] = Field(
        description="Keys must be A, B, C, D for mcq. A and B only for true_false."
    )
    correct_answer: Literal["A", "B", "C", "D"] = Field(
        description="The letter of the correct option only"
    )

 
 
class RAGQuiz(BaseModel):
    questions: list[RAGQuizQuestion]

embeddings_model = GoogleGenerativeAIEmbeddings(model="gemini-embedding-001")

QUIZ_SYSTEM_PROMPT = """
You are an expert quiz generator. Your job is to generate high-quality quiz questions based on the given topic, difficulty, and question type.

RULES:
- Generate exactly the number of questions requested. No more, no less.
- Return ONLY a valid JSON array. No markdown, no backticks, no explanation, no preamble.
- Every question must have exactly these fields: id, question, type, options, correct_answer, explanation, difficulty.
- For MCQ questions, always provide exactly 4 options labeled A, B, C, D.
- For true_false questions, options must be exactly {"A": "True", "B": "False"}.
- correct_answer must always be the letter only: "A", "B", "C", or "D".
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


def generate_quiz_without_Notes(num_questions:int, difficulty:str, question_type:str, topic:str):

    structured_model = model.with_structured_output(Quiz)

    user_message = f"Generate {num_questions} {difficulty} {question_type} questions about: {topic}"
    messages = [( "system",QUIZ_SYSTEM_PROMPT), ("human", user_message)]
    response = structured_model.invoke(messages)
    return response.questions
    


def chunk_documents(
    documents: list[Document],
    document_id : str,
    user_id:str,
    chunk_size: int = CHUNK_SIZE,
    chunk_overlap: int = CHUNK_OVERLAP,
    
) -> list[Document]:
    """
    Split loaded documents into smaller overlapping chunks for embedding.
 
    RecursiveCharacterTextSplitter tries paragraph breaks first, then sentences,
    then words - falling back to raw character cuts only as a last resort.
    This keeps chunks semantically coherent rather than cutting mid-sentence.
 
    Overlap ensures content near a chunk boundary still has surrounding
    context in at least one chunk.
    """
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



def Add_to_Chroma_DB(
    chunks: list[Document],
    collection_name: str = "documents",
):
    """
    Stores pre-computed embeddings into ChromaDB alongside their
    original text and metadata (document_id, user_id).

    Takes `chunks` (for text + metadata) and `embeddings` (the vectors
    already computed via embed_chunks_safely) separately, since Chroma
    needs both to store and later retrieve/filter correctly.
    """
    texts = [chunk.page_content for chunk in chunks]
    metadatas = [chunk.metadata for chunk in chunks]

    vectorstore = get_vectorstore(collection_name)

  
    for i in range(0, len(chunks), EMBEDDING_BATCH_SIZE):
        batch = chunks[i : i + EMBEDDING_BATCH_SIZE]
        vectorstore.add_documents(batch)

        is_last_batch = (i + EMBEDDING_BATCH_SIZE) >= len(chunks)
        if not is_last_batch:
            time.sleep(EMBEDDING_BATCH_DELAY_SECONDS)

   


def get_vectorstore(collection_name: str = "documents") -> Chroma:
    """
    Returns a Chroma instance connected to the persisted collection.
    Safe to call this anywhere, anytime - whether the collection
    already has data or is brand new, this always points to the
    same underlying storage on disk.
    """
    return Chroma(
        collection_name=collection_name,
        embedding_function=embeddings_model,
        persist_directory=CHROMA_DB_PATH,
    )


def retrieve_relevant_chunks(
    query: str,
    user_id: str,
    document_id: str | None = None,
    k: int = RETRIEVAL_TOP_K,
    collection_name: str = "documents",
    score_threshold: float = 0.5
) -> list[Document]:
    vectorstore = get_vectorstore(collection_name)

    if document_id:
        filter_dict = {
            "$and": [
                {"user_id": user_id},
                {"document_id": document_id}
            ]
        }
    else:
        filter_dict = {"user_id": user_id}   # single condition, no $and needed
    results = vectorstore.similarity_search_with_score(
        query=query,
        k=k,
        filter=filter_dict
    )
    
    # Manually filter out chunks that fall below your threshold
    valid_chunks = []
    for doc, score in results:
        if score >= score_threshold:
            valid_chunks.append(doc)
            
    return valid_chunks
async def generate_quiz_from_document(
    document_id: str,
    user_id:str,
    topic: str,
    num_questions: int,
    difficulty: str,
    question_type: str,
) -> list[QuizQuestion]:
    """
    Generates quiz questions grounded in a previously uploaded document.
 
    1. Retrieves the most relevant chunks for `topic` from that specific document
    2. Feeds those chunks as context into the same structured-output LLM call
       pattern used by the plain-text quiz generator
    """


    RAG_QUIZ_SYSTEM_PROMPT = """
You are an expert quiz generator. Generate quiz questions using ONLY the
information in the provided CONTEXT below. The context comes directly from
a document the educator uploaded - your questions must be grounded in it,
not in your own general knowledge.
 
RULES:
- Generate exactly the number of questions requested. No more, no less.
- Every question must have exactly these fields: id, question, type, options, correct_answer.
- For MCQ questions, always provide exactly 4 options labeled A, B, C, D.
- For true_false questions, options must be exactly {"A": "True", "B": "False"}.
- correct_answer must always be the letter only: "A", "B", "C", or "D".
- Base every question strictly on the CONTEXT. Do not introduce facts that
  aren't supported by it.
- If the CONTEXT does not genuinely cover the requested topic, return an
  empty questions list. Do not generate weak or tangentially-related
  questions just to satisfy the requested count - an empty result is
  better than questions not actually grounded in the topic.
 
QUESTION INDEPENDENCE:
- Each question must be fully self-contained and understandable WITHOUT
  access to the source document.
- Do NOT reference "the context," "the algorithm states," "according to
  the document," "the steps," or any structural labels from the source
  material.
- Phrase questions as if testing general knowledge of the topic, even
  though the underlying facts came from the uploaded document.
 
DIFFICULTY:
- Questions must match the requested difficulty strictly:
    easy → basic recall, straightforward concepts
    medium → application of concepts, some reasoning required
    hard → edge cases, deep understanding, tricky distinctions
- If difficulty is "easy", do not sneak in hard questions.
- If difficulty is "hard", do not pad with easy questions.
"""

    relevant_chunks = retrieve_relevant_chunks(query=topic, user_id=user_id, document_id=document_id)

    if not relevant_chunks:
        raise ValueError(
            "No relevant content found in the uploaded document for this topic."
        )
 
    context = "\n\n---\n\n".join(chunk.page_content for chunk in relevant_chunks)
    print(context)
 
    structured_model = model.with_structured_output(RAGQuiz)
 
    user_message = f"""
CONTEXT:
{context}
 
Generate {num_questions} {difficulty} {question_type} questions about: {topic}
Base the questions strictly on the CONTEXT above.
"""
 
    messages = [
        ("system", RAG_QUIZ_SYSTEM_PROMPT),
        ("human", user_message),
    ]
 
    response = await structured_model.ainvoke(messages)

    if not response.questions:
        raise ValueError(
            f"The following topic is not covered in this document: '{topic}'"
        )
    

    return response.questions


def InitializeDocument(document_name:str, user_id: str) ->str:
 document = load_document(document_name)
 document_id = str(uuid.uuid4())
 chunks = chunk_documents(document,document_id,user_id)
 Add_to_Chroma_DB(chunks)
 return document_id




async def main():
    user_id = "abc_123"
    print("Initializing document..")
    document_id =  InitializeDocument("content.pdf", user_id)
    print("Docment initialized, Generating questions...")
    questions = await generate_quiz_from_document(document_id, user_id,"BFS", 5, "hard", "mcq")
    print("Here are the questions: ")
    for q in questions:
        print(q.model_dump_json(indent=2))



asyncio.run(main())



