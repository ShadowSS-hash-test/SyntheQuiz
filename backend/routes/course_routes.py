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
    UpdateCourseRequest,
    get_user_courses,
)

from middleware.authCheck import (verify_educator,verify_user_token)

course_router = APIRouter(prefix="/courses", tags=["courses"])

@course_router.post("/", status_code=201,dependencies=[Depends(verify_user_token)])
async def create(payload: CreateCourseRequest, db=Depends(get_db)):
    return await create_course(payload, db)

@course_router.get("/{course_id}",dependencies=[Depends(verify_user_token)])
async def get_course(course_id: uuid.UUID, db=Depends(get_db)):
    return await get_course_by_id(course_id, db)

@course_router.patch("/{course_id}",dependencies=[Depends(verify_user_token)])
async def update(course_id: uuid.UUID, payload: UpdateCourseRequest, db=Depends(get_db)):
    return await update_course(course_id, payload, db)

@course_router.delete("/{course_id}",dependencies=[Depends(verify_user_token)])
async def delete(course_id: uuid.UUID, db=Depends(get_db)):
    return await delete_course(course_id, db)

@course_router.post("/{course_id}/enroll/{user_id}", status_code=201,dependencies=[Depends(verify_user_token)])
async def enroll(course_id: uuid.UUID, user_id: uuid.UUID, db=Depends(get_db)):
    return await enroll_user(course_id, user_id, db)

@course_router.delete("/{course_id}/enroll/{user_id}",dependencies=[Depends(verify_user_token)])
async def unenroll(course_id: uuid.UUID, user_id: uuid.UUID, db=Depends(get_db)):
    return await unenroll_user(course_id, user_id, db)

@course_router.get("/{course_id}/users",dependencies=[Depends(verify_user_token)])
async def get_users(course_id: uuid.UUID, db=Depends(get_db)):
    return await get_enrolled_users(course_id, db)

@course_router.get("/users/{user_id}/courses", dependencies=[Depends(verify_user_token)])
async def get_courses_for_user(user_id: uuid.UUID, db = Depends(get_db)):
    """
    Get all courses the user is currently enrolled in. 
    Requires the user to be authenticated.
    """
    return await get_user_courses(user_id, db)