# controllers/course_controller.py

import asyncpg
from fastapi import HTTPException, status
from pydantic import BaseModel
import uuid
from typing import List, Optional



class CreateCourseRequest(BaseModel):
    course_name: str
    course_coordinator: uuid.UUID


class CourseResponse(BaseModel):
    course_id: str
    course_name: str
    course_coordinator: str
    created_at: str


class UpdateCourseRequest(BaseModel):
    course_name: Optional[str] = None
    course_coordinator: Optional[uuid.UUID] = None


class EnrolledUserResponse(BaseModel):
    user_id: str
    first_name: str
    last_name: str
    email: str



def _format_course(row: asyncpg.Record) -> CourseResponse:
    """
    Converts a raw asyncpg record into a CourseResponse.
    """
    return CourseResponse(
        course_id=str(row["course_id"]),
        course_name=row["course_name"],
        course_coordinator=str(row["course_coordinator"]),
        created_at=str(row["created_at"]),
    )


async def get_courses_by_coordinator(
    coordinator_id: uuid.UUID,
    db: asyncpg.Connection,
) -> List[CourseResponse]:
    """
    Fetches all courses managed by a specific coordinator.
    """
    try:
        rows = await db.fetch(
            """
            SELECT course_id, course_name, course_coordinator, created_at
            FROM courses
            WHERE course_coordinator = $1
            ORDER BY created_at DESC
            """,
            coordinator_id,
        )
        return [_format_course(row) for row in rows]
        
    except Exception as e:
        print(f"Error in get_courses_by_coordinator: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected internal server error occurred."
        )



async def create_course(
    payload: CreateCourseRequest,
    db: asyncpg.Connection,
) -> CourseResponse:
    """
    Creates a new course.
    """
    try:
        # Check if the coordinator exists
        coordinator_exists = await db.fetchval(
            "SELECT 1 FROM users WHERE user_id = $1",
            payload.course_coordinator
        )
        if not coordinator_exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Provided course_coordinator (user_id) does not exist."
            )

        row = await db.fetchrow(
            """
            INSERT INTO courses (course_name, course_coordinator)
            VALUES ($1, $2)
            RETURNING course_id, course_name, course_coordinator, created_at
            """,
            payload.course_name,
            payload.course_coordinator,
        )
        
        return _format_course(row)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in create_course: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected internal server error occurred."
        )


async def get_course_by_id(
    course_id: uuid.UUID,
    db: asyncpg.Connection,
) -> CourseResponse:
    """
    Fetches a single course by its UUID.
    """
    try:
        row = await db.fetchrow(
            """
            SELECT course_id, course_name, course_coordinator, created_at
            FROM courses
            WHERE course_id = $1
            """,
            course_id,
        )
        
        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found.",
            )
            
        return _format_course(row)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in get_course_by_id: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected internal server error occurred."
        )


async def update_course(
    course_id: uuid.UUID,
    payload: UpdateCourseRequest,
    db: asyncpg.Connection,
) -> CourseResponse:
    """
    Partially updates a course (name or coordinator).
    """
    try:
        updates = {}
        if payload.course_name is not None:
            updates["course_name"] = payload.course_name
        if payload.course_coordinator is not None:
            # Verify the new coordinator exists before updating
            coordinator_exists = await db.fetchval(
                "SELECT 1 FROM users WHERE user_id = $1",
                payload.course_coordinator
            )
            if not coordinator_exists:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Provided course_coordinator (user_id) does not exist."
                )
            updates["course_coordinator"] = payload.course_coordinator
            
        if not updates:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields provided to update.",
            )
            
        set_clause = ", ".join(
            f"{col} = ${i + 1}" for i, col in enumerate(updates)
        )
        values = list(updates.values())
        values.append(course_id)
        
        row = await db.fetchrow(
            f"""
            UPDATE courses
            SET {set_clause}
            WHERE course_id = ${len(values)}
            RETURNING course_id, course_name, course_coordinator, created_at
            """,
            *values,
        )
        
        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found.",
            )
            
        return _format_course(row)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in update_course: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected internal server error occurred."
        )


async def delete_course(
    course_id: uuid.UUID,
    db: asyncpg.Connection,
) -> dict:
    """
    Deletes a course by UUID. Cascades to enrollments, documents, 
    and quizzes automatically via ON DELETE CASCADE / SET NULL in schema.
    """
    try:
        result = await db.execute(
            "DELETE FROM courses WHERE course_id = $1",
            course_id,
        )
        
        rows_deleted = int(result.split()[-1])
        if rows_deleted == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found.",
            )
            
        return {"message": "Course deleted successfully."}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in delete_course: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected internal server error occurred."
        )

