# middlewares/auth_middleware.py
import os
import jwt
from fastapi import Request, HTTPException, status, Depends

JWT_SECRET = os.environ.get("JWT_SECRET")
JWT_ALGORITHM = os.environ.get("JWT_ALGORITHM", "HS256")
ACCESS_COOKIE_NAME = "access_token"

async def verify_user_token(request: Request) -> dict:
    """
    Middleware to verify if the user is logged in.
    Reads the access_token from cookies, decodes it, and returns the payload.
    """
    token = request.cookies.get(ACCESS_COOKIE_NAME)
    
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated. No access token found."
        )

    try:
        # Decode the token
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        # Verify it's an access token, not a refresh token
        if payload.get("type") != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type."
            )
            
        return payload

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired. Please refresh or log in again."
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token."
        )


async def verify_educator(user_payload: dict = Depends(verify_user_token)) -> dict:
    """
    Middleware to verify if the logged-in user is an educator.
    Automatically runs `verify_user_token` first.
    """
    if user_payload.get("user_type") != "educator":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Educator privileges required."
        )
        
    return user_payload