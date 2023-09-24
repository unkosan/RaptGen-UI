import torch
from torch.utils.data import DataLoader
from fastapi import APIRouter, File, Form, Body, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from tasks import train_model
from sqlalchemy.orm import Session

from core.algorithms import CNN_PHMM_VAE
from core.db import get_engine, get_session, ChildJob, Job
from fastapi import Depends
import re


def get_db_session():
    """Dependency to get the database session"""
    session = get_session()
    try:
        yield session
    finally:
        session.close()


router = APIRouter()


@router.get("/train/device/process")
async def get_available_devices():
    """get available devices"""
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
    raptgen_model_type: str = Field(..., pattern="RaptGen|RaptGen-freq|RaptGen-logfreq")
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

    task = train_model.delay(payload.model_dump())

    # TODO: 残りの変数の設定
    return {"status": "success", "data": {"task_id": task.id}}


@router.get("/train/jobs/items/{parent_uuid}")
async def get_parent_job(parent_uuid: str):
    session = get_session()
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
    session = get_session()
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


class SearchPayload(BaseModel):
    status: Optional[List[str]] = None
    search_regex: Optional[str] = None
    is_multiple: Optional[bool] = None
    type: Optional[List[str]] = None


@router.post("/train/jobs/search")
async def search_jobs(
    request: SearchPayload,
    session: Session = Depends(get_db_session),  # Use dependency injection for session
):
    query = session.query(Job)

    # if 'status' field is provided in the request
    if request.status is not None:
        query = query.filter(Job.status.in_(request.status))

    # if 'search_regex' field is provided in the request
    if request.search_regex is not None:
        try:
            # check if the regex pattern is valid
            re.compile(request.search_regex)
            query = query.filter(Job.name.op("REGEXP")(request.search_regex))
        except re.error:
            raise HTTPException(
                status_code=422,
                detail=[
                    {
                        "loc": ["body", "search_regex"],
                        "msg": f"Invalid regex pattern: {request.search_regex}",
                        "type": "value_error",
                    }
                ],
            )

    # if 'type' field is provided in the request
    if request.type is not None:
        if not set(request.type).issubset(
            {"RaptGen", "RaptGen-freq", "RaptGen-logfreq"}
        ):
            raise HTTPException(
                status_code=422,
                detail=[
                    {
                        "loc": ["body", "type"],
                        "msg": "model type must be one of: 'RaptGen', 'RaptGen-freq' or 'RaptGen-logfreq'",
                        "type": "value_error",
                    }
                ],
            )
        query = query.filter(Job.type.in_(request.type))

    # if 'is_multiple' field is provided in the request, we assume that this refers to whether a Job has multiple ChildJobs
    if request.is_multiple is not None:
        if request.is_multiple is True:
            query = query.filter(Job.reiteration > 1)
        else:
            query = query.filter(Job.reiteration == 1)

    results = query.all()

    response = []
    for job in results:
        series = []
        for child_job in job.child_jobs:
            series_item = {
                "item_id": child_job.id,
                "item_start": child_job.start,
                "item_duration": child_job.duration,
                "item_status": child_job.status,
                "item_epochs_total": child_job.epochs_total,
                "item_epochs_current": child_job.epochs_current,
            }
            series.append(series_item)

        response.append(
            {
                "uuid": job.uuid,
                "name": job.name,
                "type": job.type,
                "status": job.status,
                "start": job.start,
                "duration": job.duration,
                "reiteration": job.reiteration,
                "series": series,
            }
        )

    return response
