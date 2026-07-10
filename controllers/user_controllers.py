# controllers/user_controller.py
 
import asyncio
import asyncpg
from fastapi import HTTPException, status
from pydantic import BaseModel, EmailStr
from typing import Literal
import bcrypt
import uuid
 
 
# ============================================================
# REQUEST / RESPONSE SCHEMAS
# ============================================================
 
class RegisterRequest(BaseModel):
    first_name: str
    last_name:  str
    email:      EmailStr
    password:   str
    user_type:  Literal["educator", "student"]
 
 
class UserResponse(BaseModel):
    user_id:    str
    first_name: str
    last_name:  str
    email:      str
    user_type:  str
    created_at: str
 
 
class LoginRequest(BaseModel):
    email:    EmailStr
    password: str
 
 
class UpdateUserRequest(BaseModel):
    first_name: str | None = None
    last_name:  str | None = None
 
 
# ============================================================
# HELPERS
# ============================================================
 
async def _hash_password(plain: str) -> str:
    """Hashes a password in a separate thread to prevent blocking the event loop."""
    def _hash():
        return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()
    return await asyncio.to_thread(_hash)
 
 
async def _verify_password(plain: str, hashed: str) -> bool:
    """Verifies a password in a separate thread to prevent blocking the event loop."""
    def _verify():
        return bcrypt.checkpw(plain.encode(), hashed.encode())
    return await asyncio.to_thread(_verify)
 
 
def _format_user(row: asyncpg.Record) -> UserResponse:
    """
    Converts a raw asyncpg record into a UserResponse.
    password_hash is deliberately excluded here — never return it.
    """
    return UserResponse(
        user_id=str(row["user_id"]),
        first_name=row["first_name"],
        last_name=row["last_name"],
        email=row["email"],
        user_type=row["user_type"],
        created_at=str(row["created_at"]),
    )
 
 
# ============================================================
# CONTROLLERS
# ============================================================
 
async def register_user(
    payload: RegisterRequest,
    db: asyncpg.Connection,
) -> UserResponse:
    """
    Creates a new user. Checks for duplicate email first,
    then hashes the password before storing.
    """
    try:
        existing = await db.fetchrow(
            "SELECT user_id FROM users WHERE email = $1",
            payload.email,
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists.",
            )
     
        # Await the async hash function
        password_hash = await _hash_password(payload.password)
     
        row = await db.fetchrow(
            """
            INSERT INTO users (first_name, last_name, email, password_hash, user_type)
            VALUES ($1, $2, $3, $4, $5::user_type)
            RETURNING user_id, first_name, last_name, email, user_type, created_at
            """,
            payload.first_name,
            payload.last_name,
            payload.email,
            password_hash,
            payload.user_type,
        )
     
        return _format_user(row)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in register_user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected internal server error occurred."
        )
 
 
async def login_user(
    payload: LoginRequest,
    db: asyncpg.Connection,
) -> UserResponse:
    """
    Verifies email + password. Returns user data on success.
    JWT token generation will be added here later — for now
    just returns the user object so routes can be tested end-to-end.
    """
    try:
        row = await db.fetchrow(
            """
            SELECT user_id, first_name, last_name, email,
                   password_hash, user_type, created_at
            FROM users
            WHERE email = $1
            """,
            payload.email,
        )
     
        if not row:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
            )
     
        # Await the async verify function
        if not await _verify_password(payload.password, row["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
            )
     
        return _format_user(row)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in login_user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected internal server error occurred."
        )
 
 
async def get_user_by_id(
    user_id: uuid.UUID, # FastAPI natively validates the UUID
    db: asyncpg.Connection,
) -> UserResponse:
    """
    Fetches a single user by their UUID.
    password_hash is never selected — not returned at any point.
    """
    try:
        row = await db.fetchrow(
            """
            SELECT user_id, first_name, last_name, email, user_type, created_at
            FROM users
            WHERE user_id = $1
            """,
            user_id, # Can pass directly now
        )
     
        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found.",
            )
     
        return _format_user(row)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in get_user_by_id: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected internal server error occurred."
        )
 
 
async def update_user(
    user_id: uuid.UUID, # FastAPI natively validates the UUID
    payload: UpdateUserRequest,
    db: asyncpg.Connection,
) -> UserResponse:
    """
    Partial update — only updates fields that are actually provided.
    Ignores None fields so you can update just first_name without
    touching last_name, or vice versa.
    """
    try:
        updates = {}
        if payload.first_name is not None:
            updates["first_name"] = payload.first_name
        if payload.last_name is not None:
            updates["last_name"] = payload.last_name
     
        if not updates:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields provided to update.",
            )
     
        set_clause = ", ".join(
            f"{col} = ${i + 1}" for i, col in enumerate(updates)
        )
        values = list(updates.values())
        values.append(user_id) # Can pass directly now
     
        row = await db.fetchrow(
            f"""
            UPDATE users
            SET {set_clause}
            WHERE user_id = ${len(values)}
            RETURNING user_id, first_name, last_name, email, user_type, created_at
            """,
            *values,
        )
     
        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found.",
            )
     
        return _format_user(row)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in update_user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected internal server error occurred."
        )
 
 
async def delete_user(
    user_id: uuid.UUID, # FastAPI natively validates the UUID
    db: asyncpg.Connection,
) -> dict:
    """
    Deletes a user by UUID. Cascades to their documents, quizzes,
    and document_chunks automatically via ON DELETE CASCADE in schema.
    """
    try:
        result = await db.execute(
            "DELETE FROM users WHERE user_id = $1",
            user_id, # Can pass directly now
        )
     
        rows_deleted = int(result.split()[-1])
        if rows_deleted == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found.",
            )
     
        return {"message": "User deleted successfully."}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in delete_user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected internal server error occurred."
        )