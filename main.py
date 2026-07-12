# main.py
import os
from fastapi import FastAPI
from contextlib import asynccontextmanager
from routes  import (user_router, course_router, quiz_router,genAI_router)



from db import connectDB

async def init_tables():
   
    schema_path = os.path.join("db", "schema.sql")
    
    if not os.path.exists(schema_path):
        print(f"Schema file not found at {schema_path}, skipping table initialization.")
        return

    with open(schema_path, "r") as f:
        schema_sql = f.read()

  
    async with connectDB.db_pool.acquire() as conn:
        print("Executing schema script to initialize tables...")
        await conn.execute(schema_sql)
        print("connectDB tables initialized successfully!")

@asynccontextmanager
async def lifespan(app: FastAPI):
  
    await connectDB.init_db_pool()
    
    await init_tables()
    
    yield
    
  
    await connectDB.close_db_pool()

app = FastAPI(lifespan=lifespan)

app.include_router(user_router)
app.include_router(course_router)
app.include_router(quiz_router)
app.include_router(genAI_router)


@app.get("/")
async def root():
    return {"message": "SyntheQuiz API is active and tables are synced!"} 