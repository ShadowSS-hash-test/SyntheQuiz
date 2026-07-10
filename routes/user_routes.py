# routers/user_router.py
from fastapi import APIRouter, Depends
from db.connectDB import get_db
from controllers.user_controllers import (
    register_user, login_user, get_user_by_id,
    update_user, delete_user,
    RegisterRequest, LoginRequest, UpdateUserRequest
)

user_router = APIRouter(prefix="/users", tags=["users"])

@user_router.post("/register", status_code=201)
async def register(payload: RegisterRequest, db=Depends(get_db)):
    return await register_user(payload, db)

@user_router.post("/login")
async def login(payload: LoginRequest, db=Depends(get_db)):
    return await login_user(payload, db)

@user_router.get("/{user_id}")
async def get_user(user_id: str, db=Depends(get_db)):
    return await get_user_by_id(user_id, db)

@user_router.patch("/{user_id}")
async def update(user_id: str, payload: UpdateUserRequest, db=Depends(get_db)):
    return await update_user(user_id, payload, db)

@user_router.delete("/{user_id}")
async def delete(user_id: str, db=Depends(get_db)):
    return await delete_user(user_id, db)