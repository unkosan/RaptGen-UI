from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import random

app = FastAPI()

origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    df = pd.read_csv("./local/sampledata.csv")
    return {"message": "Hello World?"}

@app.get("/sample/sampledata")
async def sampledata():
    df = pd.read_csv("./local/sampledata_reduced.csv")
    return df.to_dict(orient="list")