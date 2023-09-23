from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import random
from pydantic import BaseModel
from typing import List
from sqlalchemy import Column, Integer, String, DateTime, create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(), logging.FileHandler("app.log")],
)
logger = logging.getLogger(__name__)


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


@app.on_event("startup")
def startup_event():
    logger.info("startup_event")
    # Create the database tables
    Base.metadata.create_all(engine)


@app.get("/")
async def root():
    df = pd.read_csv("./local/sampledata.csv")
    return {"message": "Hello World?"}


@app.get("/dev/sample/selex")
async def sampledata():
    df = pd.read_csv("./local/sampledata_reduced.csv")
    return df.to_dict(orient="list")
    # return df.to_dict()


@app.get("/dev/sample/seq")
async def sampleseq():
    return {
        "seq": ["AUG", "GAC", "CCG", "ATT"],
    }


@app.get("/dev/sample/VAEmodels")
async def sampleVAE():
    return {
        "entries": [
            "VAEmodel1",
            "VAEmodel2",
            "VAEmodel3",
        ]
    }


class VAEname(BaseModel):
    VAE_name: str


@app.get("/dev/sample/GMMmodels")
async def sampleGMM(VAE_name: str = ""):
    return {
        "entries": [
            f"GMMmodel1_{VAE_name}",
            f"GMMmodel2_{VAE_name}",
            f"GMMmodel3_{VAE_name}",
        ],
    }


@app.get("/dev/sample/measuredData")
async def sample_measured():
    return {
        "entries": [
            "measured data 1",
            "measured data 2",
            "measured data 3",
        ]
    }


@app.get("/dev/sample/measured")
async def measured_sample():
    df = pd.read_csv("./local/report_all.csv")
    result = list()
    for hue, subset_df in df.groupby("hue"):
        subset_df = subset_df[["ID", "Sequence"]]
        result.append({"hue": hue, "data": subset_df.to_dict(orient="list")})
    return result


class SeqContainer(BaseModel):
    seq: List[str]
    session_ID: int


class Sequence(BaseModel):
    seq: str


model_dict = dict()
model_dict.update(
    {
        0: "okok",
        42: "test",
    }
)

import numpy as np


@app.post("/dev/sample/encode")
async def encode_sample(seq_container: SeqContainer):
    seqs = seq_container.seq
    global model_dict
    model = model_dict[seq_container.session_ID]

    # result = model(seqs)
    result = {
        "coord_x": np.random.normal(0, 1, len(seqs)).tolist(),
        "coord_y": np.random.normal(0, 1, len(seqs)).tolist(),
    }

    return result


@app.get("/dev/sample/sessionId/")
async def make_session_ID():
    return {"session_ID": 41}


class SessionID(BaseModel):
    session_ID: int


@app.post("/dev/sample/sessionId/kill")
async def kill_session(session_ID: SessionID):
    print(f"Killed session {session_ID.session_ID}")
    return {"message": "killed successfully"}


@app.get("/dev/sample/selex-config")
async def selex_config():
    return {
        "forward_adapter": "GGGACCGAGTGTTCAGC",
        "reverse_adapter": "GAGCTTGCACGTCGA",
        "tolerance": 0,
        "min_count": 4,
        "random_region_length": 10,
    }


@app.post("/dev/apitest/post")
async def post_test(seq: Sequence):
    print(f"Received: {seq.seq}")
    return {
        # "res": "ok",
        "message": f"Received {seq.seq}",
    }


from celery.signals import task_success
from datetime import datetime


class TaskInfo(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True)
    task_id = Column(String)
    status = Column(String)
    result = Column(String)
    time_started = Column(DateTime)
    time_finished = Column(DateTime)
    # Add other fields as necessary


@task_success.connect
def handle_task_success(sender=None, result=None, **kwargs):
    task = sender
    session = Session()

    # Create a new task object
    new_task = TaskInfo(
        task_id=task.request.id,
        status=task.AsyncResult(task.request.id).status,
        result=str(result),  # Convert result to string before storing in SQLite
        time_started=datetime.utcfromtimestamp(task.request.started),
        time_finished=datetime.utcnow(),  # Mark as finished now
    )

    # Add and commit the new task
    session.add(new_task)
    session.commit()

    session.close()
