from typing import Optional

import time
import pandas as pd
from uuid import uuid4
from io import BytesIO
from celery.contrib.abortable import AbortableTask

from sqlalchemy.orm import Session, scoped_session

from core.db import (
    GMMJob,
    OptimalTrial,
    BIC,
    get_db_session,
)
from tasks import celery
from threading import Semaphore
from routers.data import DATA_PATH
import numpy as np
from sklearn.mixture import GaussianMixture


semaphore = Semaphore(value=2)


class GMMJobTask(AbortableTask):

    def on_success(self, retval, task_id, args, kwargs):
        super().on_success(retval, task_id, args, kwargs)

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        super().on_failure(exc, task_id, args, kwargs, einfo)
        database_url: str = kwargs["database_url"]
        session = get_db_session(database_url).__next__()
        if session is None:
            raise ValueError("GMMJobTask: Could not get database session")

        job = session.query(GMMJob).filter(GMMJob.worker_uuid == task_id).first()
        if job is None:
            raise ValueError(f"GMMJobTask: Task {task_id} not found in database")

        job.status = "failure"  # type: ignore
        job.error_msg = str(exc)  # type: ignore

        session.commit()

    def delay(self, *args, **kwargs):
        database_url: str = kwargs["database_url"]
        session = get_db_session(database_url).__next__()
        if session is None:
            raise ValueError("GMMJobTask: Could not get database session")

        job_uuid = kwargs["uuid"]
        job = session.query(GMMJob).filter(GMMJob.uuid == job_uuid).first()
        if job is None:
            raise ValueError(f"GMMJobTask: Task {job_uuid} not found in database")

        worker_uuid = str(uuid4())
        job.worker_uuid = worker_uuid  # type: ignore
        session.commit()

        print(f"GMMJobTask: Running task {worker_uuid} for job {job_uuid}")

        return self.apply_async(args, kwargs, task_id=worker_uuid)


@celery.task(bind=True, base=GMMJobTask)
def run_job_gmm(
    self: GMMJobTask,
    uuid: str,
    is_resume: bool = False,
    database_url: str = "postgresql+psycopg2://postgres:postgres@db:5432/raptgen",
    datapath_prefix: str = DATA_PATH,
):
    """
    Run the GMM job.

    Parameters
    ----------
    uuid : str
        The UUID of the GMM job.
    is_resume : bool
        flag to indicate if the job is a resume job.
    database_url : str
        The database URL.
    """
    # get the database session
    session = get_db_session(database_url).__next__()

    job_db = session.query(GMMJob).filter(GMMJob.uuid == uuid).first()
    if job_db is None:
        raise ValueError(f"Job {uuid} not found in database. Initialize the job first.")

    optimal_trial_dbs = (
        session.query(OptimalTrial)
        .filter(OptimalTrial.gmm_job_id == uuid)
        .order_by(OptimalTrial.n_components)
        .all()
    )
    if len(optimal_trial_dbs) == 0:
        raise ValueError(f"Job {uuid} has no trials. Initialize the job first.")

    print(f"Waiting for the semaphore for job {uuid}")

    with semaphore:

        print(f"Running GMM job {uuid}")

        job_db.status = "progress"  # type: ignore
        session.commit()

        df = pd.read_pickle(
            datapath_prefix + "items/" + job_db.target_VAE_model + "/unique_seq_dataframe.pkl"  # type: ignore
        )
        x = df["coord_x"].to_numpy()
        y = df["coord_y"].to_numpy()
        coords = np.array([x, y]).T

        for optimal_trial_db in optimal_trial_dbs:
            if optimal_trial_db.n_trials_completed >= optimal_trial_db.n_trials_total:  # type: ignore
                continue

            n_components: int = optimal_trial_db.n_components  # type: ignore
            n_trials_completed: int = optimal_trial_db.n_trials_completed  # type: ignore
            n_trials_per_component: int = optimal_trial_db.n_trials_total  # type: ignore
            minimum_bic: float = optimal_trial_db.BIC  # type: ignore

            print(f"Running GMM job {uuid} with {n_components} components")

            job_db.n_component_current = n_components  # type: ignore
            session.commit()

            # run the GMM
            for _ in range(n_trials_completed, n_trials_per_component):
                if self.is_aborted():
                    print(f"Aborting GMM job {uuid}")
                    job_db.status = "suspend"  # type: ignore
                    session.commit()
                    return False

                gmm = GaussianMixture(n_components=n_components)
                gmm.fit(coords)
                bic = gmm.bic(coords)
                session.add(
                    BIC(
                        gmm_job_id=uuid,
                        n_components=n_components,
                        BIC=bic,
                    )
                )

                if bic < minimum_bic:
                    optimal_trial_db.means = np.array(gmm.means_).tolist()
                    optimal_trial_db.covariances = np.array(gmm.covariances_).tolist()
                    optimal_trial_db.BIC = bic  # type: ignore

                optimal_trial_db.n_trials_completed += 1  # type: ignore
                session.commit()

        job_db.status = "success"  # type: ignore
        session.commit()

    return True


def initialize_job_gmm(
    session: Session,
    name: str,
    target_VAE_model: str,
    minimum_n_components: int,
    maximum_n_components: int,
    step_size: int,
    n_trials_per_component: int,
) -> str:
    """
    Initialize the GMM job.
    This function adds entries for tthe jobs and the optimal trials to the database.

    Parameters
    ----------
    session : Session
        The database session.
    job_uuid : str
        The UUID of the GMM job.
    name : str
        The name of the job.
    target_VAE_model : str
        The target VAE model.
    minimum_n_components : int
        The minimum number of components.
    maximum_n_components : int
        The maximum number of components.
    step_size : int
        The step size.
    n_trials_per_component : int
        The number of trials per component.

    Returns
    -------
    job_uuid : str
        The UUID of the job.
    """
    job_uuid = str(uuid4())
    job_db = GMMJob(
        uuid=job_uuid,
        name=name,
        status="pending",
        target_VAE_model=target_VAE_model,
        minimum_n_components=minimum_n_components,
        maximum_n_components=maximum_n_components,
        step_size=step_size,
        n_trials_per_component=n_trials_per_component,
        datetime_start=int(time.time()),
        datetime_laststop=None,
        duration_suspend=0,
        n_component_current=minimum_n_components,
        worker_uuid=None,
        error_msg=None,
    )

    session.add(job_db)

    n_component = minimum_n_components
    while n_component <= maximum_n_components:
        optimal_trial_db = OptimalTrial(
            gmm_job_id=job_uuid,
            n_trials_completed=0,
            n_trials_total=n_trials_per_component,
            n_components=n_component,
            means=[[0, 0] for _ in range(n_component)],
            covariances=[[[1, 0], [0, 1]] for _ in range(n_component)],
            BIC=float("inf"),
        )
        session.add(optimal_trial_db)
        n_component += step_size

    session.commit()

    return job_uuid
