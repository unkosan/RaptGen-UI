from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session


from core.db import (
    get_db_session,
)

router = APIRouter()


class SubmitGMMJobPayload(BaseModel):
    pass


@router.post("/api/gmm/jobs/submit")
async def submit_gmm_job(
    request: SubmitGMMJobPayload, db: Session = Depends(get_db_session)
):
    pass


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
