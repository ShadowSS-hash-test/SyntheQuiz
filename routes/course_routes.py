# routers/course_router.py
from fastapi import APIRouter, Depends
import uuid
from db.connectDB import get_db
from controllers.course_controllers import (
    create_course, 
    get_course_by_id, 
    update_course, 
    delete_course,
    enroll_user,
    unenroll_user,
    get_enrolled_users,
    CreateCourseRequest, 
    UpdateCourseRequest
)

course_router = APIRouter(prefix="/courses", tags=["courses"])

@course_router.post("/", status_code=201)
async def create(payload: CreateCourseRequest, db=Depends(get_db)):
    return await create_course(payload, db)

@course_router.get("/{course_id}")
async def get_course(course_id: uuid.UUID, db=Depends(get_db)):
    return await get_course_by_id(course_id, db)

@course_router.patch("/{course_id}")
async def update(course_id: uuid.UUID, payload: UpdateCourseRequest, db=Depends(get_db)):
    return await update_course(course_id, payload, db)

@course_router.delete("/{course_id}")
async def delete(course_id: uuid.UUID, db=Depends(get_db)):
    return await delete_course(course_id, db)

@course_router.post("/{course_id}/enroll/{user_id}", status_code=201)
async def enroll(course_id: uuid.UUID, user_id: uuid.UUID, db=Depends(get_db)):
    return await enroll_user(course_id, user_id, db)

@course_router.delete("/{course_id}/enroll/{user_id}")
async def unenroll(course_id: uuid.UUID, user_id: uuid.UUID, db=Depends(get_db)):
    return await unenroll_user(course_id, user_id, db)

@course_router.get("/{course_id}/users")
async def get_users(course_id: uuid.UUID, db=Depends(get_db)):
    return await get_enrolled_users(course_id, db)