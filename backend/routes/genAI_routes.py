import os
import uuid
import shutil
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, status
import asyncpg
from db.connectDB import get_db
from pydantic import BaseModel, Field
from controllers.genAI_controllers import (initialize_document,  generate_quiz_without_notes, generate_quiz_from_document)
from util.config import ALLOWED_FILE_TYPES
from middleware.authCheck import (verify_educator,verify_user_token)


TEMP_UPLOAD_DIR = "./temp_uploads"
os.makedirs(TEMP_UPLOAD_DIR, exist_ok=True)


class GenerateStandardQuizRequest(BaseModel):
    topic: str
    num_questions: int = Field(default=5, ge=1, le=20)
    difficulty: str = Field(description="easy, medium, or hard")
    question_type: str = Field(description="mcq or true_false")

class GenerateRAGQuizRequest(BaseModel):
    document_id: uuid.UUID
    user_id: uuid.UUID
    topic: str
    num_questions: int = Field(default=5, ge=1, le=20)
    difficulty: str = Field(description="easy, medium, or hard")
    question_type: str = Field(description="mcq or true_false")
    
from middleware.authCheck import (verify_educator,verify_user_token)


genAI_router = APIRouter(prefix="/quiz", tags=["Documents"],dependencies=[Depends(verify_user_token)])

@genAI_router.post("/upload_document")
async def upload_document_endpoint(
    file: UploadFile = File(...),
    user_id: uuid.UUID = Form(...),
    course_id: uuid.UUID = Form(None),
    custom_name: str = Form(None), # Added custom_name
    db: asyncpg.Connection = Depends(get_db)  
):
    # 1. Validate file extension early
    extension = os.path.splitext(file.filename)[1].lower()
    if extension not in ALLOWED_FILE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type: {extension}. Allowed types: {ALLOWED_FILE_TYPES}"
        )

    # Determine final filename (fallback to original file name if custom is empty)
    final_filename = custom_name.strip() if custom_name and custom_name.strip() else file.filename

    # 2. Generate a secure temporary file path
    temp_filename = f"{uuid.uuid4()}{extension}"
    temp_file_path = os.path.join(TEMP_UPLOAD_DIR, temp_filename)

    try:
        # 3. Save the uploaded file to disk synchronously
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 4. Pass the physical file path AND the custom filename to your controller
        document_id = await initialize_document(
            file_path=temp_file_path,
            user_id=user_id,
            course_id=course_id,
            filename=final_filename, # ADD THIS PARAMETER
            db=db
        )

        return {
            "document_id": document_id,
            "filename": final_filename,
            "message": "Document processed and stored in vector database successfully."
        }

    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process document: {str(e)}"
        )

    finally:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)


@genAI_router.post("/generate/standard")
async def api_generate_standard_quiz(payload: GenerateStandardQuizRequest):
    """
    Generates a quiz purely from the LLM's internal knowledge without a document.
    """
    questions = await generate_quiz_without_notes(
        num_questions=payload.num_questions,
        difficulty=payload.difficulty,
        question_type=payload.question_type,
        topic=payload.topic
    )
    return {"questions": questions}


@genAI_router.post("/generate/document")
async def api_generate_document_quiz(
    payload: GenerateRAGQuizRequest, 
    db: asyncpg.Connection = Depends(get_db)
):
    """
    Generates a quiz based on specific context retrieved from an uploaded document.
    """
    questions = await generate_quiz_from_document(
        document_id=payload.document_id,
        user_id=payload.user_id,
        topic=payload.topic,
        num_questions=payload.num_questions,
        difficulty=payload.difficulty,
        question_type=payload.question_type,
        db=db
    )
    return {"questions": questions}