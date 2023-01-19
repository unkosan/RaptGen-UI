from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import random
from pydantic import BaseModel
from typing import List, Dict, Set
import os

app = FastAPI()

origins = [
    "http://localhost:3000",
    "http://localhost:8000",
    # "*", # for testing
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/")
async def root():
    return {
        "message": "OK"
    }

global sessions: Dict[int, ] = dict()
global DATA_PATH: str = "/app/local/down/data/"

@app.get("/api/session/start")
async def start_session(
    VAE_name: str = "",
):
    if VAE_name == "":
        return {
            "session_id": 0
        }
    
    # iterate over ./local/down/date/items/ and return a list of all items
    vae_list = os.listdir(DATA_PATH)
    


    session_id: int
    while True:
        session_id = random.randint(1000000, 9999999)
        if session_id not in sessions:
            break
    sessions.add(session_id)

    return {
        "session_id": session_id
    }
    