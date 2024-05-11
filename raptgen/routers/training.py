import torch
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from core.schemas import RaptGenFreqModel, RaptGenModel
from sqlalchemy.orm import Session
import re
from typing import List, Optional, Union
from pydantic import BaseModel
from uuid import uuid4

from typing import List, Any, Optional, Tuple
from tasks import celery
import pandas as pd
from sqlalchemy import func
from io import BytesIO
import pickle
import os


from core.db import (
    ParentJob,
    ChildJob,
    SequenceEmbeddings,
    TrainingLosses,
    SequenceData,
    get_db_session,
)
from core.jobs import initialize_job_raptgen, run_job_raptgen, ChildJobTask
from celery.contrib.abortable import AbortableAsyncResult

DATA_PATH = "/app/data/"

router = APIRouter()


@router.get("/api/train/device/process")
async def get_available_devices():
    """
    Get available devices for training.

    Returns
    -------
    devices : List[str]
        list of available devices
    """

    devices = ["CPU"]  # default device

    if torch.cuda.is_available():
        cuda_device_count = torch.cuda.device_count()
        devices += [f"CUDA:{i}" for i in range(cuda_device_count)]

    return devices


@router.get("/api/train/jobs/items/{parent_uuid}")
async def get_parent_job(
    parent_uuid: str,
    session: Session = Depends(get_db_session),
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
        - params_preprocessing: The preprocessing parameters of the parent job.
        - summary: A summary of all child jobs associated with the parent job.

    Raises
    ------
    HTTPException
        If the parent job is not found in the database.

    Notes
    -----
    The summary includes indices, statuses, epochs finished, and minimum NLLs of all child jobs.
    """
    parent_job = session.query(ParentJob).filter(ParentJob.uuid == parent_uuid).first()
    if parent_job is None:
        raise HTTPException(
            status_code=422,  # TODO: 404 is more suited, but 422 is used for consistency
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
    for child_job in parent_job.child_jobs:
        summary["indices"].append(child_job.id)
        summary["statuses"].append(child_job.status)
        summary["epochs_finished"].append(child_job.epochs_current)
        summary["minimum_NLLs"].append(child_job.minimum_NLL)

    response = {
        "uuid": parent_job.uuid,
        "name": parent_job.name,
        "type": parent_job.type,
        "status": parent_job.status,
        "start": parent_job.start,
        "duration": parent_job.duration,
        "reiteration": parent_job.reiteration,
        "params_training": parent_job.params_training,
        "params_preprocessing": parent_job.params_preprocessing,
        "summary": summary,
    }
    return response


@router.get("/api/train/jobs/items/{parent_uuid}/{child_id}")
async def get_child_job(
    parent_uuid: str,
    child_id: int,
    session: Session = Depends(get_db_session),
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
    if child_job.status in {"failure"}:
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
    session: Session = Depends(get_db_session),
):
    """
    Search for jobs based on the given parameters.

    Parameters
    ----------
    request : SearchPayload
        The search parameters.
        status: List of statuses to filter the jobs.
        search_regex: Regular expression to filter the jobs.
        is_multiple: Boolean to filter reiteration > 2.
        type: List of types (RaptGen, RaptGen-freq, etc.) to filter the jobs.
    session : Session, optional
        The database session, by default uses dependency injection to get the session.
    """

    query = session.query(ParentJob)

    # Filter by status
    if request.status is not None:
        query = query.filter(ParentJob.status.in_(request.status))

    # Filter by search_regex
    if request.search_regex is not None:
        try:
            re.compile(request.search_regex)
            query = query.filter(ParentJob.name.op("~")(request.search_regex))
        except re.error:
            raise HTTPException(
                status_code=422,
                detail=[
                    {
                        "loc": ["body", "search_regex"],
                        "msg": "Invalid regular expression",
                        "type": "value_error",
                    }
                ],
            )

    # Filter by type
    if request.type:
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

    # Filter by is_multiple
    if request.is_multiple is not None:
        if request.is_multiple:
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


class JobSubmissionResponse(BaseModel):
    uuid: str


@router.post("/api/train/jobs/submit", response_model=JobSubmissionResponse)
async def run_parent_job(
    request_param: Union[RaptGenModel, RaptGenFreqModel],
    session: Session = Depends(get_db_session),  # Use dependency injection for session
):
    # なんでget_db_session()を使わないんだっけ？
    if isinstance(request_param, RaptGenModel):
        parent_id = str(uuid4())
        session.add(
            ParentJob(
                uuid=parent_id,
                name=request_param.name,
                type=request_param.type,
                status="pending",
                start=0,
                duration=0,
                reiteration=request_param.reiteration,
                params_training=request_param.params_training.dict(),
                params_preprocessing=request_param.params_preprocessing.dict(),
                worker_uuid=parent_id,
            )
        )
        num_entries = len(request_param.random_regions)
        for i, seq in enumerate(request_param.random_regions):
            session.add(
                SequenceData(
                    seq_id=i,
                    parent_uuid=parent_id,
                    random_region=seq,
                    is_training_data=i < num_entries * 0.8,
                    duplicate=1,
                )
            )
        session.commit()

        # database_url = session.bind.url.__to_string__(hide_password=False)  # type: ignore
        database_url = session.get_bind().engine.url.render_as_string(
            hide_password=False
        )

        uuids: List[str] = []
        for i in range(request_param.reiteration):
            uuid = initialize_job_raptgen(
                session=session,
                parent_uuid=parent_id,
                id=i,
                params=request_param.params_training,
            )
            uuids.append(str(uuid))

        for uuid in uuids:
            run_job_raptgen.delay(
                child_uuid=uuid,
                training_params=request_param.params_training.dict(),
                is_resume=False,
                database_url=database_url,
            )

        return JobSubmissionResponse(uuid=parent_id)

    elif isinstance(request_param, RaptGenFreqModel):
        raise HTTPException(
            status_code=422,
            detail=[
                {
                    "loc": ["body", "type"],
                    "msg": "RaptGenFreqModel is not supported for now",
                    "type": "value_error",
                }
            ],
        )
    else:
        raise HTTPException(
            status_code=422,
            detail=[
                {
                    "loc": ["body", "type"],
                    "msg": "Invalid model type",
                    "type": "value_error",
                }
            ],
        )


class UpdateParentJobPayload(BaseModel):
    target: str
    value: Any


@router.patch("/api/train/jobs/items/{parent_uuid}")
async def update_parent_job(
    parent_uuid: str,
    request: UpdateParentJobPayload,
    session: Session = Depends(get_db_session),  # Use dependency injection for session
):
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
    parent_job = session.query(ParentJob).filter(ParentJob.uuid == parent_uuid).first()
    if parent_job is None:
        raise HTTPException(
            status_code=422,  # TODO: 404 is more appropriate than 422, but it's not consistent
            detail=[
                {
                    "loc": ["path", "parent_uuid"],
                    "msg": f"Job {parent_uuid} not found",
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
        if isinstance(request.value, str) and len(request.value) > 0:
            setattr(parent_job, request.target, request.value)
            session.commit()
            return {}
        else:
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

    # for future targets, raise an exception
    raise Exception(f"Not implemented target {request.target}")


class OperationPayload(BaseModel):
    uuid: str


@router.post("/api/train/jobs/suspend")
async def suspend_parent_job(
    request: OperationPayload,
    session: Session = Depends(get_db_session),
):
    """
    Suspend a parent job based on its UUID.

    Parameters
    ----------
    request : OperationPayload
        The request body containing the UUID of the parent job.
    session : Session, optional
        The database session, by default uses dependency injection to get the session.

    Returns
    -------
    None
        The response is an empty dictionary.
    """
    parent_job = session.query(ParentJob).filter(ParentJob.uuid == request.uuid).first()
    if parent_job is None:
        raise HTTPException(
            status_code=422,
            detail=[
                {
                    "loc": ["body", "uuid"],
                    "msg": f"Job {request.uuid} not found",
                    "type": "value_error",
                }
            ],
        )

    if parent_job.status != "progress":  # type: ignore
        raise HTTPException(
            status_code=422,
            detail=[
                {
                    "loc": ["body", "uuid"],
                    "msg": "Job is not in progress",
                    "type": "value_error",
                }
            ],
        )

    child_jobs = (
        session.query(ChildJob).filter(ChildJob.parent_uuid == request.uuid).all()
    )
    session.commit()

    for child_job in child_jobs:
        if child_job.status in {"pending", "progress"}:
            print(f"Aborting task_id {child_job.worker_uuid}")
            uuid: str = child_job.worker_uuid  # type: ignore
            AbortableAsyncResult(uuid, app=celery).abort()

    return None


@router.post("/api/train/jobs/resume")
async def resume_parent_job(
    request: OperationPayload,
    session: Session = Depends(get_db_session),
):
    """
    Resume a parent job based on its UUID.

    Parameters
    ----------
    request : OperationPayload
        The request body containing the UUID of the parent job.
    session : Session, optional
        The database session, by default uses dependency injection to get the session.

    Returns
    -------
    None
        The response is an empty dictionary.
    """
    parent_job = session.query(ParentJob).filter(ParentJob.uuid == request.uuid).first()
    if parent_job is None:
        raise HTTPException(
            status_code=422,
            detail=[
                {
                    "loc": ["body", "uuid"],
                    "msg": f"Job {request.uuid} not found",
                    "type": "value_error",
                }
            ],
        )

    if parent_job.status != "suspend":  # type: ignore
        raise HTTPException(
            status_code=422,
            detail=[
                {
                    "loc": ["body", "uuid"],
                    "msg": f"Job {request.uuid} is not suspended",
                    "type": "value_error",
                }
            ],
        )

    child_jobs = (
        session.query(ChildJob).filter(ChildJob.parent_uuid == request.uuid).all()
    )

    for child_job in child_jobs:
        if child_job.status == "suspend":  # type: ignore
            run_job_raptgen.delay(
                child_uuid=child_job.uuid,
                training_params=parent_job.params_training,
                is_resume=True,
                database_url=session.get_bind().engine.url.render_as_string(
                    hide_password=False
                ),
            )

    return None


@router.delete("/api/train/jobs/items/{parent_uuid}")
async def delete_parent_job(
    parent_uuid: str,
    session: Session = Depends(get_db_session),
):
    """
    Delete a parent job based on its UUID.

    Parameters
    ----------
    parent_uuid : str
        The UUID of the parent job.
    session : Session, optional
        The database session, by default uses dependency injection to get the session.

    Returns
    -------
    None
        The response is an empty dictionary.
    """
    parent_job = session.query(ParentJob).filter(ParentJob.uuid == parent_uuid).first()
    if parent_job is None:
        raise HTTPException(
            status_code=422,  # TODO: 404 is more appropriate than 422
            detail=[
                {
                    "loc": ["body", "uuid"],
                    "msg": f"Job {parent_uuid} not found",
                    "type": "value_error",
                }
            ],
        )

    if parent_job.status == "progress":  # type: ignore
        await suspend_parent_job(OperationPayload(uuid=parent_uuid), session=session)

    child_jobs = session.query(ChildJob).filter(ChildJob.parent_uuid == parent_uuid)
    for child_job in child_jobs:
        session.query(SequenceEmbeddings).filter(
            SequenceEmbeddings.child_uuid == child_job.uuid
        ).delete()
        session.query(TrainingLosses).filter(
            TrainingLosses.child_uuid == child_job.uuid
        ).delete()

    session.query(SequenceData).filter(SequenceData.parent_uuid == parent_uuid).delete()
    child_jobs.delete()

    session.delete(parent_job)
    session.commit()

    return None


@router.post("/api/train/jobs/publish")
async def publish_parent_job(
    request: OperationPayload,
    session: Session = Depends(get_db_session),
    debug: bool = False,
):
    """
    Publish a parent job based on its UUID.

    Parameters
    ----------
    request : OperationPayload
        The request body containing the UUID of the parent job.
    is_debug: bool, optional
        Debug mode. Disables the actual publishing of the job, by default False

    Returns
    -------
    None
        The response is an empty dictionary.
    """
    print("Publishing parent job")
    parent_job = session.query(ParentJob).filter(ParentJob.uuid == request.uuid).first()
    if parent_job is None:
        raise HTTPException(
            status_code=422,
            detail=[
                {
                    "loc": ["body", "uuid"],
                    "msg": "Job not found",
                    "type": "value_error",
                }
            ],
        )

    if parent_job.status != "success":  # type: ignore
        raise HTTPException(
            status_code=422,
            detail=[
                {
                    "loc": ["body", "uuid"],
                    "msg": "Job is not successful",
                    "type": "value_error",
                }
            ],
        )

    optimal_model_record = (
        session.query(ChildJob)
        .with_entities(
            ChildJob.uuid.label("uuid"),
            func.min(TrainingLosses.test_loss).label("score"),
        )
        .join(TrainingLosses)
        .filter(ChildJob.parent_uuid == request.uuid)
        .group_by(ChildJob.uuid)
        .order_by("score")
        .first()
    )
    if optimal_model_record is None:
        raise HTTPException(
            status_code=422,
            detail=[
                {
                    "loc": ["body", "uuid"],
                    "msg": "No optimal model found",
                    "type": "value_error",
                }
            ],
        )
    uuid: str = optimal_model_record.uuid

    df_profile: pd.DataFrame = pd.read_pickle(DATA_PATH + "profile_dataframe.pkl")
    df_profile = pd.concat(
        [
            df_profile,
            pd.DataFrame(
                {
                    "published_time": pd.Timestamp.now().strftime("%Y/%m/%d"),
                    "name": str(parent_job.name),
                    "round": None,
                    "fwd_adapter": parent_job.params_preprocessing["forward"],
                    "rev_adapter": parent_job.params_preprocessing["reverse"],
                    "filtering_method": None,
                    "minimum_count": parent_job.params_preprocessing["minimum_count"],
                    "embedding_dim": 2,
                    "epochs": parent_job.params_training["epochs"],
                    "beta_weight_epochs": parent_job.params_training["beta_duration"],
                    "match_forcing_epochs": parent_job.params_training[
                        "match_forcing_duration"
                    ],
                    "match_cost": parent_job.params_training["match_cost"],
                    "early_stopping_epochs": parent_job.params_training[
                        "early_stopping"
                    ],
                    "CUDA_num_workers": None,
                    "CUDA_pin_memory": None,
                    "pHMM_VAE_model_length": parent_job.params_training["model_length"],
                    "pHMM_VAE_seed": parent_job.params_training["seed_value"],
                },
                index=[len(df_profile)],
            ),
        ],
        ignore_index=True,
    )

    fwd_adapter: str = parent_job.params_preprocessing["forward"]  # type: ignore
    rev_adapter: str = parent_job.params_preprocessing["reverse"]  # type: ignore
    df_embeddings: pd.DataFrame = pd.read_sql(
        f"""
        SELECT 
            CONCAT('{fwd_adapter}', random_region, '{rev_adapter}') AS Sequence, 
            duplicate AS Duplicates, 
            random_region AS Without_Adapters, 
            coord_x, 
            coord_y 
        FROM sequence_embeddings
        WHERE child_uuid = '{uuid}';
        """,
        session.get_bind(),
    )

    model_binary: bytes = session.query(ChildJob).filter(ChildJob.uuid == uuid).first().optimal_checkpoint  # type: ignore
    state_dict_map = torch.load(BytesIO(model_binary))
    state_dict = state_dict_map["model"]

    df_gmm = pd.DataFrame(
        {
            "GMM_num_components": [],
            "GMM_seed": [],
            "GMM_optimal_model": [],
            "GMM_model_type": [],
        },
    ).astype(
        {
            "GMM_num_components": int,
            "GMM_seed": int,
            "GMM_model_type": str,
            "GMM_optimal_model": "object",
        }
    )
    df_gmm.index.name = "name"

    if not debug:
        os.makedirs(DATA_PATH + "items/" + str(parent_job.name), exist_ok=True)
        # df_profile.to_pickle(DATA_PATH + "/profile_dataframe.pkl")
        df_embeddings.to_pickle(
            DATA_PATH + "items/" + str(parent_job.name) + "/unique_seq_dataframe.pkl"
        )
        df_gmm.to_pickle(
            DATA_PATH + "items/" + str(parent_job.name) + "/best_gmm_dataframe.pkl"
        )
        pickle.dump(
            state_dict,
            open(DATA_PATH + "items/" + str(parent_job.name) + "/VAE_model.pkl", "wb"),
        )
    else:
        print(df_profile)
        print(df_embeddings)
        print(df_gmm)

    return None
