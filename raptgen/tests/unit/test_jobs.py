import pytest
import pytest_postgresql.factories as factories

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session
from celery.contrib.abortable import AbortableAsyncResult
from time import sleep
import pandas as pd
import os
import numpy as np

from core.jobs import run_job_raptgen, ChildJobTask, initialize_job_raptgen
from core.db import (
    BaseSchema,
    ParentJob,
    ChildJob,
    SequenceData,
    PreprocessingParams,
    RaptGenParams,
)
from core.schemas import RaptGenTrainingParams
from tasks import celery


raptgen_parent_params = {
    "uuid": "8aab26d7-7657-47fa-b624-ed752864ae76",
    "name": "test_raptgen",
    "type": "RaptGen",
    "start": 1609459200,
    "duration": 0,
    "reiteration": 2,
}
raptgen_preprocessing_params = {
    "forward": "TGGG",
    "reverse": "CCCA",
    "random_region_length": 10,
    "tolerance": 1,
    "minimum_count": 1,
}
raptgen_training_params = {
    "model_length": 10,
    "epochs": 2,
    "match_forcing_duration": 1,
    "beta_duration": 1,
    "early_stopping": 1,
    "match_cost": 4,
    "seed_value": 1,
    "device": "CPU",
}
raptgen_child_params_1 = {
    "id": 0,
    "uuid": "8aab26d7-7657-47fa-b624-ed752864ae77",
    "parent_uuid": "8aab26d7-7657-47fa-b624-ed752864ae76",
    "status": "pending",
    "datetime_start": 1609459200,
    "datetime_laststop": 1609459330,
    "duration_suspend": 30,
    "epochs_total": 2,
    "epochs_current": 0,
    "minimum_NLL": 5000,
    "is_added_viewer_dataset": False,
    "jobtype": "RaptGen",
}
raptgen_child_params_2 = {
    "id": 1,
    "uuid": "8aab26d7-7657-47fa-b624-ed752864ae78",
    "parent_uuid": "8aab26d7-7657-47fa-b624-ed752864ae76",
    "status": "pending",
    "datetime_start": 1609459350,
    "datetime_laststop": 1609459380,
    "duration_suspend": 0,
    "epochs_total": 2,
    "epochs_current": 0,
    "minimum_NLL": 5000,
    "is_added_viewer_dataset": False,
    "jobtype": "RaptGen",
}

data_df = pd.read_csv(os.path.dirname(__file__) + "/mocks/test_train_mock_data.csv")
data = data_df.to_dict(orient="records")


def load_database(**kwargs):
    connection = f"postgresql+psycopg2://{kwargs['user']}:@{kwargs['host']}:{kwargs['port']}/{kwargs['dbname']}"
    engine = create_engine(connection)
    BaseSchema.metadata.create_all(engine)
    session = scoped_session(sessionmaker(bind=engine))

    # prepare the database
    session.add(ParentJob(**raptgen_parent_params))
    session.add(ChildJob(**raptgen_child_params_1))
    session.add(ChildJob(**raptgen_child_params_2))

    for d in data:
        session.add(SequenceData(**d))

    try:
        session.commit()
    except:
        session.rollback()
        raise
    finally:
        session.close()

    session.add(
        PreprocessingParams(
            **raptgen_preprocessing_params, parent_uuid=raptgen_parent_params["uuid"]
        )
    )
    session.add(
        RaptGenParams(
            **raptgen_training_params, child_uuid=raptgen_child_params_1["uuid"]
        )
    )
    session.add(
        RaptGenParams(
            **raptgen_training_params, child_uuid=raptgen_child_params_2["uuid"]
        )
    )

    try:
        session.commit()
    except:
        session.rollback()
        raise
    finally:
        session.close()


postgresql_proc = factories.postgresql_proc(load=[load_database])
postgresql = factories.postgresql(
    "postgresql_proc"
)  # still need to check if this is actually needed or not


@pytest.fixture(scope="session")
def celery_config():
    celery.conf.update(
        broker_url="redis://localhost:6379/0",
        result_backend="redis://localhost:6379/0",
        task_serializer="json",
        result_serializer="json",
        accept_content=["pickle", "json"],
        task_track_started=True,
        result_persistent=True,
    )
    return {
        "broker_url": "redis://localhost:6379/0",
        "result_backend": "redis://localhost:6379/0",
    }


@pytest.fixture
def db_session(postgresql):
    connection = f"postgresql+psycopg2://{postgresql.info.user}:@{postgresql.info.host}:{postgresql.info.port}/{postgresql.info.dbname}"
    engine = create_engine(connection)
    session = scoped_session(sessionmaker(bind=engine))

    session.begin_nested()

    yield session

    session.rollback()
    session.close()


def wrapper_db_session(db_session):
    yield db_session


@pytest.fixture
def eager_mode():
    celery.conf.update(
        task_always_eager=True,
        task_eager_propagates=False,
    )
    yield None
    celery.conf.update(
        task_always_eager=False,
        task_eager_propagates=False,
    )


@celery.task(bind=True)
def lightweight_job(
    self,
    arg1: int,
    arg2: str,
):
    print(f"arg1: {arg1}, arg2: {arg2}")
    print("task_id: ", self.request.id)
    return True


def test_job(celery_worker):
    assert lightweight_job.delay(
        arg1=1,
        arg2="test",
    ).get()


def test_job_raptgen_valid_train(db_session, celery_worker):
    url = db_session.get_bind().url.render_as_string(hide_password=False)

    params = RaptGenTrainingParams(
        model_length=10,
        epochs=2,
        match_forcing_duration=1,
        beta_duration=1,
        early_stopping=1,
        seed_value=1,
        match_cost=4,
        device="CPU",
    )

    uuid = initialize_job_raptgen(
        id=0,
        parent_uuid="8aab26d7-7657-47fa-b624-ed752864ae76",
        params=params,
        session=db_session,
    )
    uuid = str(uuid)

    asyncres: AbortableAsyncResult = run_job_raptgen.delay(
        child_uuid=uuid,
        database_url=url,
    )

    sleep(1)
    db_session.commit()
    if asyncres.ready():
        print("Task already finished, skipping for progress check")
    else:
        status = db_session.query(ChildJob).filter(ChildJob.uuid == uuid).first().status
        assert status == "progress"
    asyncres.wait()
    status = db_session.query(ChildJob).filter(ChildJob.uuid == uuid).first().status
    assert status == "success"


def test_job_raptgen_invalid_train(db_session, celery_worker, eager_mode):
    url = db_session.get_bind().url.render_as_string(hide_password=False)

    params = RaptGenTrainingParams(
        model_length=-1,
        epochs=2,
        match_forcing_duration=1,
        beta_duration=1,
        early_stopping=1,
        seed_value=1,
        match_cost=4,
        device="CPU",
    )

    uuid = initialize_job_raptgen(
        id=1,
        parent_uuid="8aab26d7-7657-47fa-b624-ed752864ae76",
        params=params,
        session=db_session,
    )
    uuid = str(uuid)

    try:
        asyncres: AbortableAsyncResult = run_job_raptgen.delay(
            child_uuid=uuid,
            is_resume=False,
            database_url=url,
        )
        db_session.commit()
        task_id = str(asyncres.id)
        asyncres.wait()
    except Exception as e:
        print("Exception: ", e)
        ChildJobTask.on_failure(
            ChildJobTask(),
            exc=e,
            task_id=task_id,
            args=[],
            kwargs={
                "child_uuid": uuid,
                "database_url": url,
                "is_resume": False,
            },
            einfo=None,
        )

    db_session.commit()
    job = db_session.query(ChildJob).filter(ChildJob.uuid == uuid).first()
    assert job.status == "failure"
    assert job.error_msg != ""


def test_job_raptgen_valid_retrain(db_session, celery_worker):
    url = db_session.get_bind().url.render_as_string(hide_password=False)

    params = RaptGenTrainingParams(
        model_length=10,
        epochs=5,
        match_forcing_duration=1,
        beta_duration=1,
        early_stopping=1,
        seed_value=1,
        match_cost=4,
        device="CPU",
    )

    uuid = initialize_job_raptgen(
        id=1,
        parent_uuid="8aab26d7-7657-47fa-b624-ed752864ae76",
        params=params,
        session=db_session,
    )
    uuid = str(uuid)

    asyncres: AbortableAsyncResult = run_job_raptgen.delay(
        child_uuid=uuid,
        database_url=url,
        is_resume=False,
    )

    # asyncres: AbortableAsyncResult = job_raptgen.delay(
    #     child_id=1,
    #     model_length=10,
    #     num_epochs=20,
    #     beta_threshold=0.1,
    #     force_matching_epochs=1,
    #     match_cost=4,
    #     early_stop_threshold=5,
    #     seed=1,
    #     device="CPU",
    #     parent_uuid="8aab26d7-7657-47fa-b624-ed752864ae76",
    #     resume_uuid=None,
    #     database_url=url,
    # )  # type: ignore

    # wait for the 1st epoch to finish
    while True:
        sleep(1)
        epoch = (
            db_session.query(ChildJob)
            .filter(ChildJob.uuid == uuid)
            .first()
            .epochs_current
        )
        if epoch >= 1:
            break

    if asyncres.ready():
        print("OMG. Task already finished!")
        exit(1)

    asyncres.abort()
    asyncres.wait()
    job_data = db_session.query(ChildJob).filter(ChildJob.uuid == uuid).first()
    assert job_data.status == "suspend"

    # asyncres2: AbortableAsyncResult = job_raptgen.delay(
    #     child_id=1,
    #     model_length=10,
    #     num_epochs=5,
    #     beta_threshold=0.1,
    #     force_matching_epochs=1,
    #     match_cost=4,
    #     early_stop_threshold=1,
    #     seed=1,
    #     device="CPU",
    #     parent_uuid="8aab26d7-7657-47fa-b624-ed752864ae76",
    #     resume_uuid=asyncres.id,
    #     database_url=url,
    # )  # type: ignore

    asyncres2: AbortableAsyncResult = run_job_raptgen.delay(
        child_uuid=uuid,
        database_url=url,
        is_resume=True,
    )

    db_session.commit()
    asyncres2.wait()
    job_data = db_session.query(ChildJob).filter(ChildJob.uuid == uuid).first()
    assert job_data.status == "success"
