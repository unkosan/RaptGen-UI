import torch
from fastapi import APIRouter, File, Form, Body, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

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


@router.get("/api/train/jobs/items/{parent_uuid}")
async def get_parent_job(
    parent_uuid: str,
    session: Session = Depends(get_db_session),  # Use dependency injection for session
):
    """
    Retrieve detailed information about a specific parent job based on its UUID.

    Parameters
    ----------
    parent_uuid : str
        The UUID of the parent job.
    session : Session, optional
        The database session, by default uses dependency injection to get the session.

    Returns
    -------
    dict
        A dictionary containing detailed information about the parent job. This includes:
        - uuid: The UUID of the parent job.
        - name: The name of the parent job.
        - type: The type of the parent job.
        - status: The status of the parent job.
        - start: The start time of the parent job.
        - duration: The duration of the parent job.
        - reiteration: The reiteration count of the parent job.
        - params_training: The training parameters of the parent job.
        - summary: A summary of all child jobs associated with the parent job.

    Raises
    ------
    HTTPException
        If the parent job is not found in the database.

    Notes
    -----
    The summary includes indices, statuses, epochs finished, and minimum NLLs of all child jobs.
    """
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
    """
    Retrieve detailed information about a specific child job based on its parent UUID and child ID.

    Parameters
    ----------
    parent_uuid : str
        The UUID of the parent job.
    child_id : int
        The ID of the child job.
    session : Session, optional
        The database session, by default uses dependency injection to get the session.

    Returns
    -------
    dict
        A dictionary containing detailed information about the child job. This includes:
        - uuid: The UUID of the child job.
        - id: The ID of the child job.
        - status: The status of the child job.
        - start: The start time of the child job.
        - is_added_viewer_dataset: Boolean indicating if the viewer dataset was added.
        - error_msg: Error message if the status is 'failure'.
        - latent: Dictionary containing embedding details if the status is 'success', 'progress', or 'suspend'.
        - losses: Dictionary containing training loss details if the status is 'success', 'progress', or 'suspend'.
        - epochs_current: the number of finished epochs of the child job. (that is, zero-indexed value)
        - epochs_total: Total epochs of the child job.

    Raises
    ------
    HTTPException
        If the child job is not found in the database.

    Notes
    -----
    TODO: Consider changing the status code 422 to 404 for "Child Job not found".
    """
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
        "epochs_total": child_job.epochs_total,
    }

    if child_job.status in {"suspend", "progress"}:
        response["epochs_current"] = child_job.epochs_current
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


class UpdateParentJobPayload(BaseModel):
    target: str
    value: Any


@router.patch("/api/train/jobs/items/{parent_uuid}")
async def update_parent_job(
    parent_uuid: str,
    request: UpdateParentJobPayload,
    session: Session = Depends(get_db_session),  # Use dependency injection for session
) -> dict:
    """
    Update the property of a parent job based on its UUID.

    Parameters
    ----------
    parent_uuid : str
        The UUID of the parent job.
    request : UpdateParentJobPayload
        The request body containing the target property and its value.
    session : Session, optional
        The database session, by default uses dependency injection to get the session.

    Returns
    -------
    None
        The response is an empty dictionary.
    """
    job = session.query(ParentJob).filter(ParentJob.uuid == parent_uuid).first()
    if job is None:
        raise HTTPException(
            status_code=422,
            detail=[
                {
                    "loc": ["path", "parent_uuid"],
                    "msg": "Job not found",
                    "type": "value_error",
                }
            ],
        )

    if request.target not in {"name"}:
        raise HTTPException(
            status_code=422,
            detail=[
                {
                    "loc": ["body", "target"],
                    "msg": "Invalid target",
                    "type": "value_error",
                }
            ],
        )

    if request.target == "name":
        if not isinstance(request.value, str) or len(request.value) == 0:
            raise HTTPException(
                status_code=422,
                detail=[
                    {
                        "loc": ["body", "value"],
                        "msg": "Invalid value",
                        "type": "value_error",
                    }
                ],
            )
        else:
            setattr(job, request.target, request.value)
            session.commit()
            return {}

    raise Exception(f"Not implemented target {request.target}")
