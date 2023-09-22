import torch
from torch.utils.data import DataLoader
from fastapi import APIRouter, File, Form, Body, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional


from tasks import train_model

from core.algorithms import CNN_PHMM_VAE

from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Float,
    JSON,
    Boolean,
    ForeignKey,
    create_engine,
    or_,
)
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func


# Create the SQLite database and session
engine = create_engine("sqlite:////dbdata/tasks.db")
Session = sessionmaker(bind=engine)

Base = declarative_base()
Base.metadata.create_all(engine)

router = APIRouter()


@router.get("/train/device/process")
async def get_available_devices():
    devices = ["CPU"]

    if torch.cuda.is_available():
        cuda_device_count = torch.cuda.device_count()
        devices.extend([f"CUDA:{i}" for i in range(cuda_device_count)])

    return {"devices": devices}


class PreprocessingParams(BaseModel):
    forward: str
    reverse: str
    random_region_length: int
    tolerance: int
    minimum_count: int


class TrainingJobPayload(BaseModel):
    model_type: str = Field(..., pattern="RaptGen|RpatGen-freq|RaptGen-logfreq")
    name: str
    params_preprocessing: PreprocessingParams
    random_regions: List[str]
    duplicates: List[int]
    reiteration: int
    params_training: Dict[str, Any]


@router.post("/train/jobs/submit")
async def submit_training_job(payload: TrainingJobPayload = Body(...)):
    """enqueue training job"""
    # num_epochs: int = TrainingJobPayload.params_training.get("num_epochs") | 100

    # model = CNN_PHMM_VAE()

    # # split random_regions into train and test
    # train_ratio = 0.8
    # train_size = int(len(TrainingJobPayload.random_regions) * train_ratio)
    # test_size = len(TrainingJobPayload.random_regions) - train_size
    # train_dataset, test_dataset = torch.utils.data.random_split(
    #     TrainingJobPayload.random_regions, [train_size, test_size]
    # )

    # train_loader = DataLoader(
    #     dataset=train_dataset,
    #     # batch_size=batch_size, # TODO: batch size
    #     shuffle=True,
    #     pin_memory=True,
    # )

    # test_loader = DataLoader(
    #     dataset=test_dataset,
    #     # batch_size=batch_size, # TODO: batch size
    #     shuffle=True,
    #     pin_memory=True,
    # )

    task = train_model.delay(payload.dict())

    # TODO: 残りの変数の設定
    return {"status": "success", "data": {"task_id": task.id}}


class SearchPayload(BaseModel):
    status: Optional[List[str]]
    search_regex: Optional[str]
    is_multiple: Optional[bool]
    type: Optional[List[str]]


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True)
    uuid = Column(String, unique=True)
    name = Column(String)
    type = Column(String)
    status = Column(String)
    start = Column(DateTime, default=func.now())
    duration = Column(
        Integer
    )  # this could be calculated as difference between start and end times
    reiteration = Column(Integer)
    params_training = Column(JSON)
    summary = Column(JSON)
    child_jobs = relationship("ChildJob", backref="job")


class ChildJob(Base):
    __tablename__ = "child_jobs"

    id = Column(Integer, primary_key=True)
    uuid = Column(String, unique=True)
    parent_uuid = Column(String, ForeignKey("jobs.uuid"))
    # other fields as per the requirements


@router.get("/train/jobs/items/{parent_uuid}")
async def get_parent_job(parent_uuid: str):
    session = Session()
    job = session.query(Job).filter(Job.uuid == parent_uuid).first()
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")

    response = {
        "uuid": job.uuid,
        "name": job.name,
        "type": job.type,
        "status": job.status,
        "start": job.start.timestamp(),
        "duration": job.duration,
        "reiteration": job.reiteration,
        "params_training": job.params_training,
        "summary": job.summary,
    }
    session.close()
    return response


@router.get("/train/jobs/items/{parent_uuid}/{child_id}")
async def get_child_job(parent_uuid: str, child_id: int):
    session = Session()
    child_job = (
        session.query(ChildJob)
        .filter(ChildJob.parent_uuid == parent_uuid, ChildJob.id == child_id)
        .first()
    )
    if child_job is None:
        raise HTTPException(status_code=404, detail="Child Job not found")
    # Assuming similar fields to the parent job
    response = {
        "uuid": child_job.uuid,
        "name": child_job.name,
        "type": child_job.type,
        "status": child_job.status,
        "start": child_job.start.timestamp(),
        "duration": child_job.duration,
        "reiteration": child_job.reiteration,
        "params_training": child_job.params_training,
        "summary": child_job.summary,
    }
    session.close()
    return response


@router.post("/train/jobs/search")
async def search_jobs(
    status: Optional[List[str]] = None,
    search_regex: Optional[str] = None,
    is_multiple: Optional[bool] = None,
    type: Optional[List[str]] = None,
):
    session = Session()

    query = session.query(Job)

    # if 'status' field is provided in the request
    if status is not None:
        query = query.filter(Job.status.in_(status))

    # if 'search_regex' field is provided in the request
    if search_regex is not None:
        query = query.filter(Job.name.op("REGEXP")(search_regex))

    # if 'type' field is provided in the request
    if type is not None:
        query = query.filter(Job.type.in_(type))

    # if 'is_multiple' field is provided in the request, we assume that this refers to whether a Job has multiple ChildJobs
    if is_multiple is not None:
        if is_multiple:
            query = query.filter(Job.child_jobs.any())
        else:
            query = query.filter(~Job.child_jobs.any())

    results = query.all()

    response = []
    for job in results:
        response.append(
            {
                "uuid": job.uuid,
                "name": job.name,
                "type": job.type,
                "status": job.status,
                "start": job.start.timestamp(),
                "duration": job.duration,
                "reiteration": job.reiteration,
                "params_training": job.params_training,
                "summary": job.summary,
            }
        )

    session.close()

    return response
