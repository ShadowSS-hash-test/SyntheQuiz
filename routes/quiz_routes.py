from fastapi import APIRouter, Depends
from db.connectDB import get_db
import uuid
from controllers.quiz_controllers import (
    save_quiz,
    get_quiz_by_id,
    get_quizzes_by_user,
    get_quizzes_by_course,
    delete_quiz,
    SaveQuizRequest,
)


 
quiz_router = APIRouter(prefix="/quizzes", tags=["quizzes"])
 
 
@quiz_router.post("/", status_code=201)
async def create_quiz(payload: SaveQuizRequest, db=Depends(get_db)):
    return await save_quiz(payload, db)
 
 
@quiz_router.get("/user/{user_id}")
async def get_user_quizzes(user_id: uuid.UUID, db=Depends(get_db)):
    return await get_quizzes_by_user(user_id, db)
 
 
@quiz_router.get("/course/{course_id}")
async def get_course_quizzes(course_id: uuid.UUID, db=Depends(get_db)):
    return await get_quizzes_by_course(course_id, db)
 
 
@quiz_router.get("/{quiz_id}")
async def get_quiz(quiz_id: uuid.UUID, db=Depends(get_db)):
    return await get_quiz_by_id(quiz_id, db)
 
 
@quiz_router.delete("/{quiz_id}")
async def remove_quiz(quiz_id: uuid.UUID, db=Depends(get_db)):
    return await delete_quiz(quiz_id, db)
 