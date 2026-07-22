# controllers/user_controller.py
 
import asyncio
import asyncpg
from fastapi import HTTPException, status
from fastapi.responses import JSONResponse 
from pydantic import BaseModel, EmailStr
from typing import Literal
import bcrypt
import uuid
import jwt
from datetime import datetime, timedelta, timezone
import os

JWT_SECRET              = os.environ.get("JWT_SECRET")
JWT_ALGORITHM           = os.environ.get("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES  = int(os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", 15))
REFRESH_TOKEN_EXPIRE_DAYS    = int(os.environ.get("REFRESH_TOKEN_EXPIRE_DAYS", 7))
 
ACCESS_COOKIE_NAME  = "access_token"
REFRESH_COOKIE_NAME = "refresh_token"
 

 
 
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

def create_access_token(user_id: str, user_type: str) -> str:
    """
    Short-lived token (default 15 mins).
    Sent on every protected request via httpOnly cookie.
    """
    try:
        payload = {
            "user_id":   user_id,
            "user_type": user_type,
            "type":      "access",
            "exp":       datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
            "iat":       datetime.now(timezone.utc)
            
        }
        return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    except Exception as e:
        print(f"Error in create_access_token: {e}")
        raise


def create_refresh_token(user_id: str, user_type: str) -> str:
    """
    Long-lived token (default 7 days).
    Only used on the /auth/refresh endpoint to issue a new access token.
    Never used for any other request.
    """
    try:
        payload = {
            "user_id":   user_id,
            "user_type": user_type,
            "type":      "refresh",
            "exp":       datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
            "iat":       datetime.now(timezone.utc)
            
        }
        return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    except Exception as e:
        print(f"Error in create_refresh_token: {e}")
        raise
 

def set_auth_cookies(response: JSONResponse, user_id: str, user_type: str) -> JSONResponse:
    """
    Issues both tokens and sets them as httpOnly cookies on the response.
    Call this in your login controller and your refresh endpoint.
 
    httpOnly=True  — JS cannot read the cookie (XSS protection)
    samesite=lax   — Cookie not sent on cross-site POST (CSRF protection)
    secure=False   — Set True in production (requires HTTPS)
    """
    try:
        access_token  = create_access_token(user_id, user_type)
        refresh_token = create_refresh_token(user_id, user_type)
 
        response.set_cookie(
            key=ACCESS_COOKIE_NAME,
            value=access_token,
            httponly=True,
            samesite="lax",
            secure=False,  # TODO: set True in production
            max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )
        response.set_cookie(
            key=REFRESH_COOKIE_NAME,
            value=refresh_token,
            httponly=True,
            samesite="lax",
            secure=False,  # TODO: set True in production
            max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        )
        return response
    except Exception as e:
        print(f"Error in set_auth_cookies: {e}")
        raise
 
def clear_auth_cookies(response: JSONResponse) -> JSONResponse:
    """
    Clears both auth cookies. Call this in your logout endpoint.
    """
    response.delete_cookie(ACCESS_COOKIE_NAME)
    response.delete_cookie(REFRESH_COOKIE_NAME)
    return response


 
# ============================================================
# CONTROLLERS
# ============================================================
 

async def register_user(
    payload: RegisterRequest,
    db: asyncpg.Connection,
) -> JSONResponse:
    """
    Creates a new user. Checks for duplicate email first,
    then hashes the password before storing. Returns JSON + Auth Cookies.
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
     
        # Format the user data
        user_data = _format_user(row)
        
        # Create the JSONResponse
        response = JSONResponse(
            status_code=status.HTTP_201_CREATED,
            content={
                "message": "Registration successful", 
                "user": user_data.model_dump() # use .dict() if on Pydantic v1
            }
        )
        
        # Attach cookies and return
        return set_auth_cookies(response, user_data.user_id, user_data.user_type)
        
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
) -> JSONResponse:
    """
    Verifies email + password. Returns JSON payload + Auth Cookies on success.
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
     
        # Format the user data
        user_data = _format_user(row)
        
        # Create the JSONResponse
        response = JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "message": "Login successful", 
                "user": user_data.model_dump() # use .dict() if on Pydantic v1
            }
        )
        
        # Attach cookies and return
        return set_auth_cookies(response, user_data.user_id, user_data.user_type)
        
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