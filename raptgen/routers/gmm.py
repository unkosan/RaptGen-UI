from typing import Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from routers.data import DATA_PATH

from core.gmmjobs import initialize_job_gmm, run_job_gmm
from core.db import (
    get_db_session,
)

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
    pass


@router.post("/api/gmm/jobs/search")
async def search_gmm_jobs(
    request: SearchGMMJobsPayload, db: Session = Depends(get_db_session)
):
    pass


class GetGMMJobPayload(BaseModel):
    pass


@router.get("/api/gmm/jobs/items/{uuid}")
async def get_gmm_job(
    uuid: str, request: GetGMMJobPayload, db: Session = Depends(get_db_session)
):
    pass


class UpdateGMMJobPayload(BaseModel):
    pass


@router.patch("/api/gmm/jobs/items/{uuid}")
async def update_gmm_job(
    uuid: str, request: UpdateGMMJobPayload, db: Session = Depends(get_db_session)
):
    pass


@router.delete("/api/gmm/jobs/items/{uuid}")
async def delete_gmm_job(uuid: str, db: Session = Depends(get_db_session)):
    pass


class SuspendGMMJobPayload(BaseModel):
    pass


@router.post("/api/gmm/jobs/suspend")
async def suspend_gmm_job(
    request: SuspendGMMJobPayload, db: Session = Depends(get_db_session)
):
    pass


class ResumeGMMJobPayload(BaseModel):
    pass


@router.post("/api/gmm/jobs/resume")
async def resume_gmm_job(
    request: ResumeGMMJobPayload, db: Session = Depends(get_db_session)
):
    pass
