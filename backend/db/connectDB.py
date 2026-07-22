# db/database.py
import os
import asyncpg
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ['DB_URL']


db_pool = None

async def init_db_pool():
    """Initializes the connection pool on server startup"""
    global db_pool
  
    db_pool = await asyncpg.create_pool(dsn=DATABASE_URL, min_size=5, max_size=20)
    print("Database connection pool initialized")

async def close_db_pool():
    """Closes the connection pool on server shutdown"""
    global db_pool
    if db_pool:
        await db_pool.close()
        print("Database connection pool closed")

# Dependency for FastAPI routes
async def get_db():
    """Yields a single connection from the pool for a request lifetime"""
    global db_pool
    if db_pool is None:
        raise RuntimeError("Database pool is not initialized.")
    
    # Acquire a single connection from the pool
    async with db_pool.acquire() as connection:
        # Start a transaction block automatically
        async with connection.transaction():
            try:
                yield connection
                # If the route finishes with no errors, transaction auto-commits
                print("Transaction committed successfully")
            except Exception:
                # If any exception occurs inside the route, transaction auto-rollbacks
                print("Error occurred! Transaction rolled back.")
                raise