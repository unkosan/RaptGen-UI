import pytest
import pytest_postgresql.factories as factories

import pytest_redis.factories.proc as redis_factories
import pytest_redis.factories.client as redis_client
from collections import defaultdict

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session

from celery.contrib.abortable import AbortableAsyncResult
from time import sleep
from celery.states import STARTED

from typing import (
    List,
    Dict,
    Any,
    Union,
    Tuple,
    Optional,
    Sequence,
    NamedTuple,
    Callable,
)

from core.db import (
    BaseSchema,
    ParentJob,
    ChildJob,
    SequenceEmbeddings,
    TrainingLosses,
    SequenceData,
)
from mocks import mock_children, mock_parents, mock_embeddings, mock_training_losses


from core.jobs import job_raptgen
import pandas as pd

from tasks import celery

raptgen_parent_params = {
    "uuid": "8aab26d7-7657-47fa-b624-ed752864ae76",
    "name": "test_raptgen",
    "type": "RaptGen",
    "start": 1620000000,
    "duration": 0,
    "reiteration": 2,
    "params_training": {
        "model_length": 15,
        "epochs": 2,
        "match_forcing_duration": 1,
        "beta_duration": 1,
        "early_stop_threshold": 2,
        "seed_value": 1,
        "device": "CPU",
    },
}
raptgen_child_params_1 = {
    "id": 0,
    "uuid": "8aab26d7-7657-47fa-b624-ed752864ae77",
    "parent_uuid": "8aab26d7-7657-47fa-b624-ed752864ae76",
    "status": "pending",
    "start": 1620000000,
    "duration": 0,
    "epochs_total": 2,
    "epochs_current": 0,
    "minimum_NLL": 5000,
    "is_added_viewer_dataset": False,
}
raptgen_child_params_2 = {
    "id": 1,
    "uuid": "8aab26d7-7657-47fa-b624-ed752864ae78",
    "parent_uuid": "8aab26d7-7657-47fa-b624-ed752864ae76",
    "status": "pending",
    "start": 1620000000,
    "duration": 0,
    "epochs_total": 2,
    "epochs_current": 0,
    "minimum_NLL": 5000,
    "is_added_viewer_dataset": False,
}

data_df = pd.read_csv(
    "/Users/admin/workspace/RaptGen-UI-3/raptgen/tests/unit/mocks/test_train_mock_data.csv"
)
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
    session.commit()

    for d in data:
        session.add(SequenceData(**d))

    session.commit()
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

    asyncres: AbortableAsyncResult = job_raptgen.delay(
        child_id=1,
        model_length=10,
        num_epochs=2,
        beta_threshold=0.1,
        force_matching_epochs=1,
        match_cost=4,
        early_stop_threshold=1,
        seed=1,
        device="CPU",
        parent_uuid="8aab26d7-7657-47fa-b624-ed752864ae76",
        resume_uuid=None,
        database_url=url,
    )  # type: ignore

    sleep(1)
    task_id = asyncres.id
    status = db_session.query(ChildJob).filter(ChildJob.uuid == task_id).first().status
    assert status == "progress"
    asyncres.wait()
    status = db_session.query(ChildJob).filter(ChildJob.uuid == task_id).first().status
    assert status == "success"


# def test_job_raptgen_valid_retrain(db_session, celery_worker):
#     url = db_session.get_bind().url.render_as_string(hide_password=False)

#     asyncres: AbortableAsyncResult = job_raptgen.delay(
#         child_id=1,
#         model_length=10,
#         num_epochs=20,
#         beta_threshold=0.1,
#         force_matching_epochs=1,
#         match_cost=4,
#         early_stop_threshold=5,
#         seed=1,
#         device="CPU",
#         parent_uuid="8aab26d7-7657-47fa-b624-ed752864ae76",
#         resume_uuid=None,
#         database_url=url,
#     )  # type: ignore

#     # wait for the 1st epoch to finish
#     sleep(1)
#     status = (
#         db_session.query(ChildJob).filter(ChildJob.uuid == asyncres.id).first().status
#     )
#     assert status == "progress"
#     while True:
#         sleep(1)
#         epoch = (
#             db_session.query(ChildJob)
#             .filter(ChildJob.uuid == asyncres.id)
#             .first()
#             .epochs_current
#         )
#         if epoch >= 1:
#             break

#     asyncres.abort()
#     asyncres.wait()
#     job_data = db_session.query(ChildJob).filter(ChildJob.uuid == asyncres.id).first()
#     assert job_data.status == "suspend"

# resume_uuid = asyncres.id
# print(f"Resuming the job with uuid: {resume_uuid}")
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
#     resume_uuid=resume_uuid,
#     database_url=url,
# )  # type: ignore

# asyncres2.wait()
# assert (
#     db_session.query(ChildJob).filter(ChildJob.uuid == resume_uuid).first().status
#     == "success"
# )
