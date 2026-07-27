from fastapi import APIRouter, Depends, HTTPException, status
import uuid
from db.connectDB import get_db
from controllers.document_controllers import (
    get_documents_by_user,
    delete_document
)
from middleware.authCheck import verify_user_token

document_router = APIRouter(prefix="/documents", tags=["documents"])

@document_router.get("/")
async def get_all_documents(
    current_user: dict = Depends(verify_user_token), 
    db = Depends(get_db)
):
    """
    Retrieves all documents for the currently authenticated user.
    """
    try:
        # Cast string user_id from token payload to UUID for asyncpg compatibility
        user_id_str = current_user.get("user_id") or current_user.get("id")
        user_id = uuid.UUID(str(user_id_str)) 
        
        return await get_documents_by_user(user_id, db)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Invalid UUID format in token."
        )

@document_router.delete("/{document_id}")
async def delete(
    document_id: uuid.UUID, 
    current_user: dict = Depends(verify_user_token),
    db = Depends(get_db)
):
    """
    Deletes a specific document.
    """
    try:
        user_id_str = current_user.get("user_id") or current_user.get("id")
        user_id = uuid.UUID(str(user_id_str))
        
        return await delete_document(document_id, user_id, db)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Invalid UUID format in token."
        )