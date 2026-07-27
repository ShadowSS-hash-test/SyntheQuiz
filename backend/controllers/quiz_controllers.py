# controllers/quiz_controller.py
import json
import asyncpg
import uuid
from fastapi import HTTPException, status
from pydantic import BaseModel
from typing import Optional, Literal


# ============================================================
# REQUEST / RESPONSE SCHEMAS
# ============================================================

class QuestionPayload(BaseModel):
    """
    Represents a single question being saved.
    Sent by the frontend after the educator curates the generated questions.
    correct_answer is A-D for MCQ, T or F for true_false.
    explanation is optional — only present on plain_text quizzes.
    """
    question:       str
    question_type:  Literal["mcq", "true_false"]
    options:        dict[str, str]
    correct_answer: Literal["A", "B", "C", "D", "T", "F"]
    explanation:    Optional[str] = None


class SaveQuizRequest(BaseModel):
    """
    Full payload when educator clicks "Save Quiz".
    Already curated on the frontend — what arrives here is the final set.
    document_id is None for plain_text quizzes.
    """
    user_id:     uuid.UUID
    course_id:   Optional[uuid.UUID] = None
    document_id: Optional[uuid.UUID] = None
    quiz_type:   Literal["plain_text", "rag"]
    topic:       str
    difficulty:  Literal["easy", "medium", "hard"]
    questions:   list[QuestionPayload]


class QuestionResponse(BaseModel):
    question_id:    str
    quiz_id:        str
    question:       str
    question_type:  str
    options:        dict[str, str]
    correct_answer: str
    explanation:    Optional[str]


class QuizResponse(BaseModel):
    quiz_id:     str
    user_id:     str
    course_id:   Optional[str]
    document_id: Optional[str]
    quiz_type:   str
    topic:       str
    difficulty:  str
    created_at:  str
    questions:   list[QuestionResponse]


class QuizSummaryResponse(BaseModel):
    """
    Lightweight quiz listing — no questions included.
    Used for list endpoints so we don't over-fetch.
    """
    quiz_id:     str
    user_id:     str
    course_id:   Optional[str]
    document_id: Optional[str]
    quiz_type:   str
    topic:       str
    difficulty:  str
    created_at:  str


# ============================================================
# HELPERS
# ============================================================

def _format_question(row: asyncpg.Record) -> QuestionResponse:

    raw_options = row["options"]
    parsed_options = json.loads(raw_options) if isinstance(raw_options, str) else raw_options

    return QuestionResponse(
        question_id=str(row["question_id"]),
        quiz_id=str(row["quiz_id"]),
        question=row["question"],
        question_type=row["question_type"],
        options=parsed_options,         
        correct_answer=row["correct_answer"],
        explanation=row["explanation"],
    )


def _format_quiz_summary(row: asyncpg.Record) -> QuizSummaryResponse:
    return QuizSummaryResponse(
        quiz_id=str(row["quiz_id"]),
        user_id=str(row["user_id"]),
        course_id=str(row["course_id"]) if row["course_id"] else None,
        document_id=str(row["document_id"]) if row["document_id"] else None,
        quiz_type=row["quiz_type"],
        topic=row["topic"],
        difficulty=row["difficulty"],
        created_at=str(row["created_at"]),
    )


# ============================================================
# CONTROLLERS
# ============================================================

async def save_quiz(
    payload: SaveQuizRequest,
    db: asyncpg.Connection,
) -> QuizResponse:
    """
    Persists a curated quiz and all its questions in a single transaction.
    Curation already happened on the frontend — what arrives here is final.

    Uses a transaction so if question insertion fails partway through,
    the quiz record is also rolled back — no orphaned empty quizzes.
    """
    try:
        if not payload.questions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A quiz must have at least one question.",
            )

        # Verify user exists
        user_exists = await db.fetchval(
            "SELECT 1 FROM users WHERE user_id = $1",
            payload.user_id,
        )
        if not user_exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found.",
            )

        # Verify course exists if provided
        if payload.course_id:
            course_exists = await db.fetchval(
                "SELECT 1 FROM courses WHERE course_id = $1",
                payload.course_id,
            )
            if not course_exists:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Course not found.",
                )

        # Verify document exists if provided (RAG path)
        if payload.document_id:
            doc_exists = await db.fetchval(
                "SELECT 1 FROM documents WHERE document_id = $1",
                payload.document_id,
            )
            if not doc_exists:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Document not found.",
                )

        # Everything runs inside a transaction — quiz + all questions
        # are inserted atomically. If anything fails, both roll back.
        async with db.transaction():
            quiz_row = await db.fetchrow(
                """
                INSERT INTO quizzes
                    (user_id, course_id, document_id, quiz_type, topic, difficulty)
                VALUES ($1, $2, $3, $4::quiz_type, $5, $6::difficulty_type)
                RETURNING quiz_id, user_id, course_id, document_id,
                          quiz_type, topic, difficulty, created_at
                """,
                payload.user_id,
                payload.course_id,
                payload.document_id,
                payload.quiz_type,
                payload.topic,
                payload.difficulty,
            )

            quiz_id = quiz_row["quiz_id"]

            # Insert all questions, preserving position order
            question_rows = []
            for q in payload.questions:
                q_row = await db.fetchrow(
                    """
                    INSERT INTO quiz_questions
                        (quiz_id, question, question_type, options, correct_answer, explanation)
                    VALUES ($1, $2, $3::question_type, $4::jsonb, $5, $6)
                    RETURNING question_id, quiz_id, question, question_type,
                            options, correct_answer, explanation
                    """,
                    quiz_id,
                    q.question,
                    q.question_type,
                    json.dumps(q.options),
                    q.correct_answer,
                    q.explanation,
                )
                question_rows.append(q_row)

        return QuizResponse(
            quiz_id=str(quiz_row["quiz_id"]),
            user_id=str(quiz_row["user_id"]),
            course_id=str(quiz_row["course_id"]) if quiz_row["course_id"] else None,
            document_id=str(quiz_row["document_id"]) if quiz_row["document_id"] else None,
            quiz_type=quiz_row["quiz_type"],
            topic=quiz_row["topic"],
            difficulty=quiz_row["difficulty"],
            created_at=str(quiz_row["created_at"]),
            questions=[_format_question(r) for r in question_rows],
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in save_quiz controller: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while saving the quiz.",
        )


async def get_quiz_by_id(
    quiz_id: uuid.UUID,
    db: asyncpg.Connection,
) -> QuizResponse:
    """
    Fetches a quiz and all its questions by quiz UUID.
    Questions are returned in position order.
    """
    try:
        quiz_row = await db.fetchrow(
            """
            SELECT quiz_id, user_id, course_id, document_id,
                   quiz_type, topic, difficulty, created_at
            FROM quizzes
            WHERE quiz_id = $1
            """,
            quiz_id,
        )

        if not quiz_row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Quiz not found.",
            )

        question_rows = await db.fetch(
            """
            SELECT question_id, quiz_id, question, question_type,
                options, correct_answer, explanation
            FROM quiz_questions
            WHERE quiz_id = $1
            """,
            quiz_id,
)

        return QuizResponse(
            quiz_id=str(quiz_row["quiz_id"]),
            user_id=str(quiz_row["user_id"]),
            course_id=str(quiz_row["course_id"]) if quiz_row["course_id"] else None,
            document_id=str(quiz_row["document_id"]) if quiz_row["document_id"] else None,
            quiz_type=quiz_row["quiz_type"],
            topic=quiz_row["topic"],
            difficulty=quiz_row["difficulty"],
            created_at=str(quiz_row["created_at"]),
            questions=[_format_question(r) for r in question_rows],
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in get_quiz_by_id controller: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while fetching the quiz.",
        )


async def get_quizzes_by_user(
    user_id: uuid.UUID,
    db: asyncpg.Connection,
) -> list[QuizSummaryResponse]:
    """
    Returns all quizzes saved by a specific educator.
    Returns summaries only — no questions — to avoid over-fetching
    on list views. Use get_quiz_by_id for full question data.
    """
    try:
        rows = await db.fetch(
            """
            SELECT quiz_id, user_id, course_id, document_id,
                   quiz_type, topic, difficulty, created_at
            FROM quizzes
            WHERE user_id = $1
            ORDER BY created_at DESC
            """,
            user_id,
        )

        return [_format_quiz_summary(row) for row in rows]

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in get_quizzes_by_user controller: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while fetching quizzes.",
        )


async def get_quizzes_by_course(
    course_id: uuid.UUID,
    db: asyncpg.Connection,
) -> list[QuizSummaryResponse]:
    """
    Returns all quizzes linked to a specific course.
    Summaries only — call get_quiz_by_id for full question detail.
    """
    try:
        course_exists = await db.fetchval(
            "SELECT 1 FROM courses WHERE course_id = $1",
            course_id,
        )
        if not course_exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found.",
            )

        rows = await db.fetch(
            """
            SELECT quiz_id, user_id, course_id, document_id,
                   quiz_type, topic, difficulty, created_at
            FROM quizzes
            WHERE course_id = $1
            ORDER BY created_at DESC
            """,
            course_id,
        )

        return [_format_quiz_summary(row) for row in rows]

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in get_quizzes_by_course controller: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while fetching quizzes for this course.",
        )


async def delete_quiz(
    quiz_id: uuid.UUID,
    db: asyncpg.Connection,
) -> dict:
    """
    Deletes a quiz by UUID. Cascades to quiz_questions automatically
    via ON DELETE CASCADE in the schema.
    """
    try:
        result = await db.execute(
            "DELETE FROM quizzes WHERE quiz_id = $1",
            quiz_id,
        )

        rows_deleted = int(result.split()[-1])
        if rows_deleted == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Quiz not found.",
            )

        return {"message": "Quiz deleted successfully."}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in delete_quiz controller: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while deleting the quiz.",
        )