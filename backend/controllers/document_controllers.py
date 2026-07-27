import asyncpg
from fastapi import HTTPException, status
from pydantic import BaseModel
import uuid
from typing import List, Optional


class DocumentResponse(BaseModel):
    document_id: str
    filename: str
    user_id: str
    course_id: Optional[str] = None
    created_at: str


def _format_document(row: asyncpg.Record) -> DocumentResponse:
    """
    Converts a raw asyncpg record into a DocumentResponse.
    Maps 'uploaded_at' from DB to 'created_at' in the Pydantic response model.
    """
    return DocumentResponse(
        document_id=str(row["document_id"]),
        filename=row["filename"],
        user_id=str(row["user_id"]),
        course_id=str(row["course_id"]) if row.get("course_id") else None,
        created_at=str(row["uploaded_at"]),
    )


async def get_documents_by_user(
    user_id: uuid.UUID,
    db: asyncpg.Connection,
) -> List[DocumentResponse]:
    """
    Fetches all documents uploaded by a specific user using uploaded_at.
    """
    try:
        rows = await db.fetch(
            """
            SELECT document_id, filename, user_id, course_id, uploaded_at
            FROM documents
            WHERE user_id = $1
            ORDER BY uploaded_at DESC
            """,
            user_id,
        )
        return [_format_document(row) for row in rows]
        
    except Exception as e:
        print(f"Error in get_documents_by_user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected internal server error occurred."
        )


async def delete_document(
    document_id: uuid.UUID,
    user_id: uuid.UUID,
    db: asyncpg.Connection,
) -> dict:
    """
    Deletes a document by UUID if the user owns it.
    """
    try:
        result = await db.execute(
            """
            DELETE FROM documents 
            WHERE document_id = $1 AND user_id = $2
            """,
            document_id,
            user_id
        )
        
        rows_deleted = int(result.split()[-1])
        if rows_deleted == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found or you do not have permission to delete it.",
            )
            
        return {"message": "Document deleted successfully."}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in delete_document: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected internal server error occurred."
        )