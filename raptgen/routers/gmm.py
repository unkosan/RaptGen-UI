from typing import List, Optional, Literal
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from core.db import GMMJob, OptimalTrial, BIC
import re
from fastapi import HTTPException
from core.gmmjobs import initialize_job_gmm, run_job_gmm
import pandas as pd
from time import time
from celery.contrib.abortable import AbortableAsyncResult
from tasks import celery

from routers.data import DATA_PATH

from core.db import get_db_session, JobStatus
from sklearn.mixture import GaussianMixture
import numpy as np


router = APIRouter()


class GMMParams(BaseModel):
    minimum_n_components: int
    maximum_n_components: int
    step_size: int
    n_trials_per_component: int


class SubmitGMMJobPayload(BaseModel):
    target: str
    name: str
    params: GMMParams


@router.post("/api/gmm/jobs/submit")
async def submit_gmm_job(
    request: SubmitGMMJobPayload,
    datapath_prefix: Optional[str] = DATA_PATH,
    db: Session = Depends(get_db_session),
):
    job_uuid = initialize_job_gmm(
        session=db,
        name=request.name,
        target_VAE_model=request.target,
        minimum_n_components=request.params.minimum_n_components,
        maximum_n_components=request.params.maximum_n_components,
        step_size=request.params.step_size,
        n_trials_per_component=request.params.n_trials_per_component,
    )

    database_url = db.get_bind().engine.url.render_as_string(hide_password=False)

    run_job_gmm.delay(
        uuid=job_uuid,
        is_resume=False,
        datapath_prefix=datapath_prefix,
        database_url=database_url,
    )

    return {
        "uuid": job_uuid,
    }


class SearchGMMJobsPayload(BaseModel):
    status: Optional[List[str]] = None
    search_regex: Optional[str] = None


@router.post("/api/gmm/jobs/search")
async def search_gmm_jobs(
    request: SearchGMMJobsPayload, db: Session = Depends(get_db_session)
):
    query = db.query(GMMJob)

    # Filter by status
    if request.status is not None:
        query = query.filter(GMMJob.status.in_(request.status))

    # Filter by search_regex
    if request.search_regex is not None:
        try:
            re.compile(request.search_regex)
            query = query.filter(GMMJob.name.op("~")(request.search_regex))
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

    results = query.all()

    response = []
    for job in results:
        trials = (
            db.query(OptimalTrial).filter(OptimalTrial.gmm_job_id == job.uuid).all()
        )

        trials_total = 0
        trials_current = 0

        for trial in trials:
            trials_total += trial.n_trials_total
            trials_current += trial.n_trials_completed

        if job.status.value == "pending":
            duration = 0
        elif job.status.value == "progress":
            duration = int(time()) - job.datetime_start - job.duration_suspend
        else:
            if job.datetime_laststop is None:
                duration = int(time()) - job.datetime_start - job.duration_suspend
            else:
                duration = (
                    job.datetime_laststop - job.datetime_start - job.duration_suspend
                )

        response.append(
            {
                "uuid": job.uuid,
                "name": job.name,
                "status": job.status,
                "start": job.datetime_start,
                "duration": duration,
                "trials_total": trials_total,
                "trials_current": trials_current,
            }
        )

    return response


@router.get("/api/gmm/jobs/items/{uuid}")
async def get_gmm_job(
    uuid: str,
    n_components: Optional[int] = None,
    datapath_prefix: Optional[str] = DATA_PATH,
    db: Session = Depends(get_db_session),
):
    job = db.query(GMMJob).filter(GMMJob.uuid == uuid).first()
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.status.value == "pending":
        duration = 0
    elif job.status.value == "progress":
        duration = int(time()) - job.datetime_start - job.duration_suspend
    else:
        duration = job.datetime_laststop - job.datetime_start - job.duration_suspend

    response = {
        "uuid": job.uuid,
        "name": job.name,
        "status": job.status.value,
        "start": job.datetime_start,
        "duration": duration,
        "target": job.target_VAE_model,
        "params": {
            "minimum_n_components": job.minimum_n_components,
            "maximum_n_components": job.maximum_n_components,
            "step_size": job.step_size,
            "n_trials_per_component": job.n_trials_per_component,
        },
    }

    optimal_trial = (
        db.query(OptimalTrial)
        .filter(OptimalTrial.gmm_job_id == job.uuid)
        .order_by(OptimalTrial.BIC.asc())
        .first()
    )
    if n_components is None:
        requested_trial = optimal_trial
    else:
        requested_trial = (
            db.query(OptimalTrial)
            .filter(
                OptimalTrial.gmm_job_id == job.uuid,
                OptimalTrial.n_components == n_components,
            )
            .first()
        )

    if optimal_trial is None:
        raise HTTPException(status_code=404, detail="Optimal trial not found")
    if requested_trial is None:
        raise HTTPException(status_code=404, detail="Requested trial not found")

    if job.status in [JobStatus.suspend, JobStatus.progress]:
        response["current_states"] = {
            "n_components": job.n_component_current,
            "trial": requested_trial.n_trials_completed,
        }

    if job.status in [JobStatus.suspend, JobStatus.progress, JobStatus.success]:
        df = pd.read_pickle(
            datapath_prefix + "items/" + job.target_VAE_model + "/unique_seq_dataframe.pkl"  # type: ignore
        )
        duplicates = df["Duplicates"].to_list()
        coords_x = df["coord_x"].to_list()
        coords_y = df["coord_y"].to_list()
        random_regions = df["Without_Adapters"].to_list()

        bics_entries = db.query(BIC).filter(BIC.gmm_job_id == job.uuid).all()
        bics: List[float] = [entry.BIC for entry in bics_entries]  # type: ignore
        hues: List[int] = [entry.n_components for entry in bics_entries]  # type: ignore

        response["gmm"] = {
            "current_n_components": requested_trial.n_components,
            "optimal_n_components": optimal_trial.n_components,
            "means": requested_trial.means,
            "covs": requested_trial.covariances,
        }
        response["latent"] = {
            "random_regions": random_regions,
            "coords_x": coords_x,
            "coords_y": coords_y,
            "duplicates": duplicates,
        }
        response["bic"] = {
            "n_components": hues,
            "bics": bics,
        }
    if job.status == JobStatus.failure:  # type: ignore
        response["error"] = job.error_msg

    return response


class UpdateGMMJobPayload(BaseModel):
    target: Optional[Literal["name"]]
    value: str


@router.patch("/api/gmm/jobs/items/{uuid}")
async def update_gmm_job(
    uuid: str,
    request: UpdateGMMJobPayload,
    db: Session = Depends(get_db_session),
):
    job = db.query(GMMJob).filter(GMMJob.uuid == uuid).first()
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")

    if request.target not in ["name"]:
        raise HTTPException(status_code=422, detail="Invalid target")

    if request.target == "name":
        if isinstance(request.value, str):
            setattr(job, request.target, request.value)
            db.commit()
            return None
        else:
            raise HTTPException(status_code=422, detail="Invalid value")

    raise Exception(f"Not implemented: {request.target}")


@router.delete("/api/gmm/jobs/items/{uuid}")
async def delete_gmm_job(uuid: str, db: Session = Depends(get_db_session)):
    job = db.query(GMMJob).filter(GMMJob.uuid == uuid).first()
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.status == "progress":  # type: ignore
        await suspend_gmm_job(SuspendGMMJobPayload(uuid=uuid), db)

    for trial in db.query(OptimalTrial).filter(OptimalTrial.gmm_job_id == uuid).all():
        db.delete(trial)

    for bic in db.query(BIC).filter(BIC.gmm_job_id == uuid).all():
        db.delete(bic)

    db.delete(job)
    db.commit()

    return None


class SuspendGMMJobPayload(BaseModel):
    uuid: str


@router.post("/api/gmm/jobs/suspend")
async def suspend_gmm_job(
    request: SuspendGMMJobPayload, db: Session = Depends(get_db_session)
):
    job = db.query(GMMJob).filter(GMMJob.uuid == request.uuid).first()
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.status.value != "progress":  # type: ignore
        raise HTTPException(status_code=422, detail="Job is not in progress")

    AbortableAsyncResult(job.worker_uuid, app=celery).abort()

    while job.status.value == "progress":
        db.refresh(job)
        # wait for the task to be aborted

    return None


class ResumeGMMJobPayload(BaseModel):
    uuid: str


@router.post("/api/gmm/jobs/resume")
async def resume_gmm_job(
    request: ResumeGMMJobPayload,
    datapath_prefix: Optional[str] = DATA_PATH,
    db: Session = Depends(get_db_session),
):
    database_url = db.get_bind().engine.url.render_as_string(hide_password=False)

    run_job_gmm.delay(
        uuid=request.uuid,
        is_resume=True,
        datapath_prefix=datapath_prefix,
        database_url=database_url,
    )

    job = db.query(GMMJob).filter(GMMJob.uuid == request.uuid).first()
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")

    while job.status.value == "suspend":
        db.refresh(job)
        # wait for the task to be resumed

    return None


class PublishGMMJobPayload(BaseModel):
    uuid: str
    n_components: int
    name: str


@router.post("/api/gmm/jobs/publish")
async def publish_gmm_job(
    request: PublishGMMJobPayload,
    datapath_prefix: Optional[str] = DATA_PATH,
    db: Session = Depends(get_db_session),
):
    job = db.query(GMMJob).filter(GMMJob.uuid == request.uuid).first()
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.status.value != "success":
        raise HTTPException(status_code=422, detail="Job is not in success state")

    if request.name == "":
        raise HTTPException(status_code=422, detail="Name cannot be empty")

    optimalTrial = (
        db.query(OptimalTrial)
        .filter(
            OptimalTrial.gmm_job_id == request.uuid,
            OptimalTrial.n_components == request.n_components,
        )
        .first()
    )
    if optimalTrial is None:
        raise HTTPException(status_code=404, detail="Optimal trial not found")

    # construct GMM model
    mixture = GaussianMixture(
        n_components=optimalTrial.n_components,  # type: ignore
        covariance_type="full",
    )
    mixture.converged_ = True
    mixture.weights_ = (
        np.ones(optimalTrial.n_components) / optimalTrial.n_components  # type: ignore
    )
    mixture.means_ = np.array(optimalTrial.means)
    mixture.covariances_ = np.array(optimalTrial.covariances)

    # construct dataframe
    df_gmm = pd.DataFrame(
        {
            "GMM_num_components": [request.n_components],
            "GMM_seed": [None],
            "GMM_model_type": ["GaussianMixture"],
            "GMM_optimal_model": [mixture],
        },
        index=[request.name],
    )
    df_gmm.index.name = "name"

    # append to existing dataframe
    df = pd.read_pickle(
        datapath_prefix + "items/" + job.target_VAE_model + "/best_gmm_dataframe.pkl"  # type: ignore
    )
    df = pd.concat([df, df_gmm])
    df.to_pickle(
        datapath_prefix + "items/" + job.target_VAE_model + "/best_gmm_dataframe.pkl"  # type: ignore
    )

    return None
