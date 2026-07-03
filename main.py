from fastapi import FastAPI
from db import get_db


app = FastAPI()

get_db()


@app.get("/")
def read_root():
    return {"Hello": "World"}