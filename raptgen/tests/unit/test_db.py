import pytest
import pytest_postgresql.factories as factories

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session

from typing import List, Dict, Any, Union, Tuple, Optional, Sequence, NamedTuple
from collections import namedtuple
from datetime import datetime

from core.psqldb import BaseSchema, ParentJob, ChildJob, JobDatabaseService


def load_database(**kwargs):
    connection = f"postgresql+psycopg2://{kwargs['user']}:@{kwargs['host']}:{kwargs['port']}/{kwargs['dbname']}"
    engine = create_engine(connection)
    BaseSchema.metadata.create_all(engine)
    session = scoped_session(sessionmaker(bind=engine))
    # add things to session
    session.commit()


postgresql_proc = factories.postgresql_proc(load=[load_database])
postgresql = factories.postgresql(
    "postgresql_proc"
)  # still need to check if this is actually needed or not


@pytest.fixture
def db_session(postgresql):
    connection = f"postgresql+psycopg2://{postgresql.info.user}:@{postgresql.info.host}:{postgresql.info.port}/{postgresql.info.dbname}"
    engine = create_engine(connection)

    session = scoped_session(sessionmaker(bind=engine))

    yield session
    # 'Base.metadata.drop_all(engine)' here specifically does not work. It is also not needed. If you leave out the session.close()
    # all the tests still run, but you get a warning/error at the end of the tests.
    session.close()


## mock for celery.AsyncResult
uuids_dict = {
    "PENDING": "88888888-7657-47fa-b624-ed752864ae70",
    "STARTED": "88888888-7657-47fa-b624-ed752864ae71",
    "RETRY": "88888888-7657-47fa-b624-ed752864ae72",
    "FAILURE": "88888888-7657-47fa-b624-ed752864ae73",
    "SUCCESS": "88888888-7657-47fa-b624-ed752864ae74",
    "REVOKED": "88888888-7657-47fa-b624-ed752864ae75",
}
child_uuids = [
    "88888888-7657-47fa-b624-ed752864ae76",
    "88888888-7657-47fa-b624-ed752864ae77",
    "88888888-7657-47fa-b624-ed752864ae78",
    "88888888-7657-47fa-b624-ed752864ae79",
    "88888888-7657-47fa-b624-ed752864ae80",
]

## common params for parent and child jobs
common_kwargs_parent = {
    "name": "test_name",
    "type": "RaptGen",
    "start": int(
        datetime.strptime("2021-01-01 00:00:00", "%Y-%m-%d %H:%M:%S").timestamp()
    ),
    "duration": 60,
    "reiteration": 2,
    "params_training": {
        "num_epochs": 100,
        "batch_size": 100,
        "learning_rate": 0.001,
        "weight_decay": 0.0001,
        "num_workers": 4,
        "pin_memory": True,
        "device": "CPU",
    },
}
common_kwargs_child = {
    "start": 0,
    "duration": 0,
    "epochs_total": 100,
    "epochs_current": 0,
    "minimum_NLL": 0.0,
    "is_added_viewer_dataset": False,
    "error_msg": None,
    "current_checkpoint": b"",
    "optimal_checkpoint": b"",
}


@pytest.fixture
def mock_async_result(mocker):
    reversed_uuids = {v: k for k, v in uuids_dict.items()}
    mocker.patch(
        "tasks.celery.AsyncResult",
        side_effect=lambda uuid: namedtuple("AsyncResult", ["status"])(
            reversed_uuids[uuid]
        ),
    )
    yield


def test_initialize_parent_job(db_session):
    print("test_initialize_parent_job")
    service = JobDatabaseService(db_session)

    service.initialize_job(
        parent=ParentJob(
            uuid=uuids_dict["PENDING"], status="pending", **common_kwargs_parent
        ),
        children=[
            ChildJob(
                id=i,
                uuid=child_uuids[i],
                parent_uuid=uuids_dict["PENDING"],
                status="pending",
                **common_kwargs_child,
            )
            for i in range(5)
        ],
    )

    parent = db_session.query(ParentJob).filter_by(uuid=uuids_dict["PENDING"]).first()
    children = (
        db_session.query(ChildJob).filter_by(parent_uuid=uuids_dict["PENDING"]).all()
    )

    assert len(children) == 5

    for param in common_kwargs_parent:
        assert getattr(parent, param) == common_kwargs_parent[param]
    assert getattr(parent, "uuid") == uuids_dict["PENDING"]
    assert getattr(parent, "status") == "pending"

    for i, child in enumerate(children):
        for param in common_kwargs_child:
            assert getattr(child, param) == common_kwargs_child[param]

        assert child.id == i
        assert child.uuid == child_uuids[i]
        assert child.parent_uuid == uuids_dict["PENDING"]
        assert child.status == "pending"


def test_get_data_by_uuid(mock_async_result, db_session):
    """
    Test get_data method by uuid.

    At the time of retrieval, the parent job is started but database has not been updated.
    """
    service = JobDatabaseService(db_session)

    service.initialize_job(
        parent=ParentJob(
            uuid=uuids_dict["STARTED"], status="pending", **common_kwargs_parent
        ),
        children=[
            ChildJob(
                id=i,
                uuid=child_uuids[i],
                parent_uuid=uuids_dict["STARTED"],
                status="pending",
                **common_kwargs_child,
            )
            for i in range(0, 5)
        ],
    )

    # get parent job
    parent: ParentJob = service.get_data(
        table="parent_jobs", uuid=uuids_dict["STARTED"]
    )[0]

    for param in common_kwargs_parent:
        assert getattr(parent, param) == common_kwargs_parent[param]
    assert getattr(parent, "uuid") == uuids_dict["STARTED"]
    assert getattr(parent, "status") == "progress"

    # get child job
    child: ChildJob = service.get_data(table="child_jobs", uuid=child_uuids[0])[0]

    for param in common_kwargs_child:
        assert getattr(child, param) == common_kwargs_child[param]
    assert getattr(child, "uuid") == child_uuids[0]
    assert getattr(child, "status") == "pending"


def test_update_parent_job(
    db_session,
):
    """
    Test update_parent_job method.

    At the time of retrieval, the parent job is started but database has not been updated.
    """
    service = JobDatabaseService(db_session)

    service.initialize_job(
        parent=ParentJob(
            uuid=uuids_dict["STARTED"], status="pending", **common_kwargs_parent
        ),
        children=[
            ChildJob(
                id=i,
                uuid=child_uuids[i],
                parent_uuid=uuids_dict["STARTED"],
                status="progress" if i == 0 else "pending",
                **common_kwargs_child,
            )
            for i in range(0, 5)
        ],
    )

    service.update_parent_job(
        parent_uuid=uuids_dict["STARTED"],
        patch={
            "status": "suspend",
            "epoch_current": 50,
        },
    )

    parent: ParentJob = service.get_data(
        table="parent_jobs", uuid=uuids_dict["STARTED"]
    )[0]

    assert getattr(parent, "epoch_current") == 50
    assert getattr(parent, "status") == "suspend"
