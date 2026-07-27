# routers/course_router.py
from fastapi import APIRouter, Depends
import uuid
from db.connectDB import get_db
from controllers.course_controllers import (
    create_course, 
    get_course_by_id, 
    update_course, 
    delete_course,
    get_courses_by_coordinator,
    CreateCourseRequest, 
    UpdateCourseRequest,
)

from middleware.authCheck import verify_user_token

course_router = APIRouter(prefix="/courses", tags=["courses"])

@course_router.get("/getAllCourses")
async def get_all_courses(
    current_user: dict = Depends(verify_user_token), 
    db = Depends(get_db)
):
    coordinator_id = current_user["user_id"] 
    return await get_courses_by_coordinator(coordinator_id, db)

@course_router.post("/", status_code=201)
async def create(
    payload: CreateCourseRequest, 
    current_user: dict = Depends(verify_user_token), 
    db = Depends(get_db)
):
    return await create_course(payload, db)

@course_router.get("/{course_id}")
async def get_course(
    course_id: uuid.UUID, 
    current_user: dict = Depends(verify_user_token), 
    db = Depends(get_db)
):
    return await get_course_by_id(course_id, db)

@course_router.patch("/{course_id}")
async def update(
    course_id: uuid.UUID, 
    payload: UpdateCourseRequest, 
    current_user: dict = Depends(verify_user_token),
    db = Depends(get_db)
):
    return await update_course(course_id, payload, db)

@course_router.delete("/{course_id}")
async def delete(
    course_id: uuid.UUID, 
    current_user: dict = Depends(verify_user_token),
    db = Depends(get_db)
):
    return await delete_course(course_id, db)