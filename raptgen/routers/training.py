import torch
from torch.utils.data import DataLoader
from fastapi import APIRouter, File, Form, Body, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from tasks import train_model
from sqlalchemy.orm import Session

from core.algorithms import CNN_PHMM_VAE
from core.db import (
    get_engine,
    get_session,
    ChildJob,
    ParentJob,
    SequenceEmbeddings,
    TrainingLosses,
)
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


@router.get("/api/train/device/process")
async def get_available_devices():
    """get available devices"""
    devices = ["CPU"]

    if torch.cuda.is_available():
        cuda_device_count = torch.cuda.device_count()
        devices.extend([f"CUDA:{i}" for i in range(cuda_device_count)])

    return devices


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


@router.post("/api/train/jobs/submit")
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


@router.get("/api/train/jobs/items/{parent_uuid}")
async def get_parent_job(
    parent_uuid: str,
    session: Session = Depends(get_db_session),  # Use dependency injection for session
):
    job = session.query(ParentJob).filter(ParentJob.uuid == parent_uuid).first()
    if job is None:
        raise HTTPException(
            status_code=422,
            detail=[
                {
                    "loc": ["body", "search_regex"],
                    "msg": "Job not found",
                    "type": "value_error",
                }
            ],
        )

    summary = {
        "indices": [],
        "statuses": [],
        "epochs_finished": [],
        "minimum_NLLs": [],
    }
    for child_job in job.child_jobs:
        summary["indices"].append(child_job.id)
        summary["statuses"].append(child_job.status)
        summary["epochs_finished"].append(child_job.epochs_current)
        summary["minimum_NLLs"].append(child_job.minimum_NLL)

    response = {
        "uuid": job.uuid,
        "name": job.name,
        "type": job.type,
        "status": job.status,
        "start": job.start,
        "duration": job.duration,
        "reiteration": job.reiteration,
        "params_training": job.params_training,
        "summary": summary,
    }
    return response


@router.get("/api/train/jobs/items/{parent_uuid}/{child_id}")
async def get_child_job(
    parent_uuid: str,
    child_id: int,
    session: Session = Depends(get_db_session),  # Use dependency injection for session
):
    child_job = (
        session.query(ChildJob)
        .filter(ChildJob.parent_uuid == parent_uuid, ChildJob.id == child_id)
        .first()
    )
    if child_job is None:
        raise HTTPException(
            status_code=422, detail="Child Job not found"
        )  # TODO: 404 is more appropriate than 422
    # Assuming similar fields to the parent job
    response = {
        "uuid": child_job.uuid,
        "id": child_job.id,
        "status": child_job.status,
        "start": child_job.start,
        "is_added_viewer_dataset": child_job.is_added_viewer_dataset,
    }

    if child_job.status == "failure":
        response["error_msg"] = child_job.error_msg
    if child_job.status in {"success", "progress", "suspend"}:
        embeddings = (
            session.query(SequenceEmbeddings)
            .filter(SequenceEmbeddings.child_uuid == child_job.uuid)
            .all()
        )

        # Initialize empty lists for each field in the latent structure
        random_regions = []
        coords_x = []
        coords_y = []
        duplicates = []

        # Populate the lists by iterating over the query results
        for embedding in embeddings:
            random_regions.append(embedding.random_region)
            coords_x.append(embedding.coord_x)
            coords_y.append(embedding.coord_y)
            duplicates.append(embedding.duplicate)

        # Construct the latent dictionary
        latent = {
            "random_regions": random_regions,
            "coords_x": coords_x,
            "coords_y": coords_y,
            "duplicates": duplicates,
        }
        response["latent"] = latent

        training_losses = (
            session.query(TrainingLosses)
            .filter(TrainingLosses.child_uuid == child_job.uuid)
            .order_by(TrainingLosses.epoch)
            .all()
        )
        # Initialize empty lists for each field in the latent structure
        train_loss = []
        test_loss = []
        test_recon = []
        test_kld = []

        # Populate the lists by iterating over the query results
        for training_loss in training_losses:
            train_loss.append(training_loss.train_loss)
            test_loss.append(training_loss.test_loss)
            test_recon.append(training_loss.test_recon)
            test_kld.append(training_loss.test_kld)

        # Construct the latent dictionary
        losses = {
            "train_loss": train_loss,
            "test_loss": test_loss,
            "test_recon": test_recon,
            "test_kld": test_kld,
        }

        response["losses"] = losses

    return response


class SearchPayload(BaseModel):
    status: Optional[List[str]] = None
    search_regex: Optional[str] = None
    is_multiple: Optional[bool] = None
    type: Optional[List[str]] = None


@router.post("/api/train/jobs/search")
async def search_jobs(
    request: SearchPayload,
    session: Session = Depends(get_db_session),  # Use dependency injection for session
):
    query = session.query(ParentJob)

    # if 'status' field is provided in the request
    if request.status is not None:
        query = query.filter(ParentJob.status.in_(request.status))

    # if 'search_regex' field is provided in the request
    if request.search_regex is not None:
        try:
            # check if the regex pattern is valid
            re.compile(request.search_regex)
            query = query.filter(ParentJob.name.op("REGEXP")(request.search_regex))
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
        query = query.filter(ParentJob.type.in_(request.type))

    # if 'is_multiple' field is provided in the request, we assume that this refers to whether a Job has multiple ChildJobs
    if request.is_multiple is not None:
        if request.is_multiple is True:
            query = query.filter(ParentJob.reiteration > 1)
        else:
            query = query.filter(ParentJob.reiteration == 1)

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
