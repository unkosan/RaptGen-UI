from contextlib import contextmanager
from pathlib import Path
import pytest

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session
import pytest_postgresql.factories as factories
from typing import List

from fastapi import FastAPI, Request, status
from fastapi.testclient import TestClient
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from mocks import (
    mock_gmm_db,
    mock_gmm_latent_df_data,
    GMMTest,
    GMM_C,
    DFData,
)
from tasks import celery
import pandas as pd
import numpy as np

from core.db import (
    BaseSchema,
    GMMJob,
    OptimalTrial,
    BIC,
    get_db_session,
)

from routers import gmm

test_app = FastAPI()
test_app.include_router(gmm.router)

client = TestClient(test_app)


def handler(request: Request, exc: Exception):
    print(exc)
    return JSONResponse(content={}, status_code=status.HTTP_422_UNPROCESSABLE_ENTITY)


test_app.add_exception_handler(RequestValidationError, handler)


def load_database(**kwargs):
    connection = f"postgresql+psycopg2://{kwargs['user']}:@{kwargs['host']}:{kwargs['port']}/{kwargs['dbname']}"
    engine = create_engine(connection)
    BaseSchema.metadata.create_all(engine)
    session = scoped_session(sessionmaker(bind=engine))

    # commit the session
    try:
        session.commit()
    except Exception as e:
        session.rollback()
        raise e
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


@pytest.fixture
def db_session(postgresql):
    connection = f"postgresql+psycopg2://{postgresql.info.user}:@{postgresql.info.host}:{postgresql.info.port}/{postgresql.info.dbname}"
    engine = create_engine(connection)
    session = scoped_session(sessionmaker(bind=engine))

    # override_dependencies of FastAPI app
    test_app.dependency_overrides[get_db_session] = lambda: session

    session.begin_nested()

    yield session
    # 'Base.metadata.drop_all(engine)' here specifically does not work. It is also not needed. If you leave out the session.close()
    # all the tests still run, but you get a warning/error at the end of the tests.

    session.rollback()
    session.close()


def mock_db(db_session, testcase: GMMTest):
    """add mock data to the database"""
    # DB data is written in the following format:

    # get the data
    mockgroups = [d for d in mock_gmm_db if testcase in d["tests"]]

    # add the data to the database
    for group in mockgroups:
        for d in group["data"][GMM_C.GMMJob]:
            db_session.add(GMMJob(**d))
        db_session.commit()

        for d in group["data"][GMM_C.OptimalTrial]:
            db_session.add(OptimalTrial(**d))
        for d in group["data"][GMM_C.BIC]:
            db_session.add(BIC(**d))

    db_session.commit()


@contextmanager
def mock_latent_df_data(testcase: GMMTest):
    # create temp DB data

    # get the data
    l_dfdata: List[DFData] = [
        datum
        for latent_data in mock_gmm_latent_df_data
        if testcase in latent_data.tests
        for datum in latent_data.data
    ]

    from tempfile import TemporaryDirectory

    with TemporaryDirectory() as temp_dir:
        # the data will be read like this
        # df = pd.read_pickle(
        #     DATA_PATH + "items/" + VAE_model_name + "/unique_seq_dataframe.pkl"
        # )
        # df = df[["Sequence", "Duplicates", "Without_Adapters", "coord_x", "coord_y"]]

        for df_data in l_dfdata:
            # create pandas df and save to pickled file
            df = pd.DataFrame(
                columns=[
                    "Sequence",
                    "Without_Adapters",
                    "coord_x",
                    "coord_y",
                    "Duplicates",
                ],
            )
            for row in df_data.data:
                new_row = pd.Series(
                    [
                        row.random_region,
                        row.random_region,
                        row.coord_x,
                        row.coord_y,
                        row.duplicates,
                    ],
                    index=df.columns,  # Ensure the Series has the same columns as the DataFrame
                )

                df = pd.concat([df, new_row.to_frame().T], ignore_index=True)

            if not Path(temp_dir + f"/items/{df_data.name}").exists():
                Path(temp_dir + f"/items/{df_data.name}").mkdir(
                    parents=True, exist_ok=True
                )

            df.to_pickle(
                temp_dir + f"/items/{df_data.name}/unique_seq_dataframe.pkl",
            )

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
            df_gmm.to_pickle(
                temp_dir + f"/items/{df_data.name}/best_gmm_dataframe.pkl",
            )

        yield temp_dir


def test_mock_df(db_session):
    with mock_latent_df_data(GMMTest.DATA_INSERT_SUCCESS) as mock_data_path:
        assert mock_data_path is not None
        assert Path(mock_data_path).exists()
        assert Path(
            mock_data_path + "/items/VAE_model_1/unique_seq_dataframe.pkl"
        ).exists()
        assert Path(
            mock_data_path + "/items/VAE_model_1/unique_seq_dataframe.pkl"
        ).is_file()
        assert (
            Path(mock_data_path + "/items/VAE_model_1/unique_seq_dataframe.pkl")
            .stat()
            .st_size
            > 0
        )

        # read mock data
        df = pd.read_pickle(
            mock_data_path + "/items/VAE_model_1/unique_seq_dataframe.pkl"
        )
        assert df is not None
        assert isinstance(df, pd.DataFrame)
        assert df.shape[0] == 10000
        assert df.shape[1] == 5
        assert df.columns.tolist() == [
            "Sequence",
            "Without_Adapters",
            "coord_x",
            "coord_y",
            "Duplicates",
        ]


def test_mock_db(db_session):
    mock_db(db_session, GMMTest.DB_INSERT_SUCCESS)

    # check if the data is in the database
    assert db_session.query(GMMJob).count() == 1
    assert db_session.query(GMMJob).first().datetime_start == 1609459200
    assert db_session.query(OptimalTrial).count() == 3
    assert db_session.query(OptimalTrial).first().n_components == 3
    assert db_session.query(OptimalTrial).first().n_trials_completed == 3
    assert db_session.query(OptimalTrial).first().n_trials_total == 3


# test list
## post api/gmm/jobs/submit
def test_enqueue_job(db_session, celery_worker):
    mock_db(db_session, GMMTest.POST_submit_success)
    with mock_latent_df_data(GMMTest.POST_submit_success) as temp_dir:
        response = client.post(
            "/api/gmm/jobs/submit",
            json={
                "target": "VAE_model_1",
                "name": "GMM Job n",
                "params": {
                    "minimum_n_components": 3,
                    "maximum_n_components": 5,
                    "step_size": 1,
                    "n_trials_per_component": 10,
                },
            },
            params={
                "datapath_prefix": temp_dir + "/",
            },
        )
        assert response.status_code == 200

        uuid = response.json()["uuid"]

        # check if the data is in the database
        assert db_session.query(GMMJob).count() == 1

        job = db_session.query(GMMJob).first()
        assert job.uuid == uuid
        assert job.target_VAE_model == "VAE_model_1"
        assert job.name == "GMM Job n"
        assert job.status.value == "pending"

        while job.status.value == "pending":
            db_session.refresh(job)
        assert job.status.value == "progress"
        while job.status.value == "progress":
            db_session.refresh(job)
        assert job.status.value == "success"

        ## check if right data is in the database
        assert db_session.query(OptimalTrial).count() == 3
        n_components = {3, 4, 5}
        for trial in db_session.query(OptimalTrial).all():
            assert trial.n_trials_completed == 10
            assert trial.n_trials_total == 10
            n_components.remove(trial.n_components)
        assert len(n_components) == 0
        assert db_session.query(BIC).count() == 30


## post api/gmm/jobs/search


def test_search_job_with_status(db_session):
    mock_db(db_session, GMMTest.POST_search_success)

    response = client.post(
        "/api/gmm/jobs/search",
        json={"status": ["success"]},
    )
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["status"] == "success"

    response = client.post(
        "/api/gmm/jobs/search",
        json={"status": ["progress"]},
    )
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["status"] == "progress"

    response = client.post(
        "/api/gmm/jobs/search",
        json={"status": ["pending"]},
    )
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["status"] == "pending"

    response = client.post(
        "/api/gmm/jobs/search",
        json={"status": ["failure"]},
    )
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["status"] == "failure"

    response = client.post(
        "/api/gmm/jobs/search",
        json={"status": ["suspend"]},
    )
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["status"] == "suspend"

    response = client.post("/api/gmm/jobs/search", json={})
    assert response.status_code == 200
    assert len(response.json()) == 5


def test_search_job_with_regex(db_session):
    mock_db(db_session, GMMTest.POST_search_success)

    response = client.post(
        "/api/gmm/jobs/search",
        json={"search_regex": r"test_job"},
    )
    assert response.status_code == 200
    assert len(response.json()) == 0

    response = client.post(
        "/api/gmm/jobs/search",
        json={"search_regex": r"test_[0-9]"},
    )
    assert response.status_code == 200
    assert len(response.json()) == 4

    response = client.post(
        "/api/gmm/jobs/search",
        json={"search_regex": r"test_[a-z]"},
    )
    assert response.status_code == 200
    assert len(response.json()) == 1


## get api/gmm/jobs/items/{uuid}
def test_get_job(db_session):
    mock_db(db_session, GMMTest.GET_items_uuid_success)

    with mock_latent_df_data(GMMTest.GET_items_uuid_success) as temp_dir:
        response = client.get(
            "/api/gmm/jobs/items/11111111-1111-1111-1111-111111111111",
            params={
                "n_components": 3,
                "datapath_prefix": temp_dir + "/",
            },
        )
        assert response.status_code == 200

        assert response.json()["uuid"] == "11111111-1111-1111-1111-111111111111"
        assert response.json()["name"] == "GMM Job 1"
        assert response.json()["status"] == "progress"
        assert response.json()["start"] == 1609459200
        assert response.json()["target"] == "VAE_model_1"
        assert response.json()["params"]["minimum_n_components"] == 3
        assert response.json()["current_states"]["n_components"] == 4
        means = response.json()["gmm"]["means"]
        covs = response.json()["gmm"]["covs"]
        assert np.array(means).shape == (3, 2)
        assert np.array(covs).shape == (3, 2, 2)
        assert response.json()["latent"]["random_regions"] is not None
        assert response.json()["latent"]["coords_x"] is not None
        assert response.json()["latent"]["coords_y"] is not None
        assert response.json()["latent"]["duplicates"] is not None
        assert response.json()["bic"]["n_components"] is not None
        assert response.json()["bic"]["bics"] is not None


## patch  api/gmm/jobs/items/{uuid}
def test_patch_job(db_session):
    mock_db(db_session, GMMTest.PATCH_items_uuid_success)

    response = client.patch(
        "/api/gmm/jobs/items/11111111-1111-1111-1111-111111111111",
        json={"target": "name", "value": "GMM Job f"},
    )
    assert response.status_code == 200

    assert db_session.query(GMMJob).first().name == "GMM Job f"


def test_delete_job(db_session):
    mock_db(db_session, GMMTest.DELETE_items_uuid_success)

    assert db_session.query(GMMJob).count() == 1
    assert db_session.query(OptimalTrial).count() == 3
    assert db_session.query(BIC).count() == 5

    response = client.delete(
        "/api/gmm/jobs/items/11111111-1111-1111-1111-111111111111",
    )
    assert response.status_code == 200

    assert db_session.query(GMMJob).count() == 0
    assert db_session.query(OptimalTrial).count() == 0
    assert db_session.query(BIC).count() == 0


## post   api/gmm/jobs/suspend
def test_suspend_job(db_session, celery_worker):
    mock_db(db_session, GMMTest.POST_suspend_success)
    with mock_latent_df_data(GMMTest.POST_suspend_success) as temp_dir:
        ## submit a job
        response = client.post(
            "/api/gmm/jobs/submit",
            json={
                "target": "VAE_model_1",
                "name": "GMM Job n",
                "params": {
                    "minimum_n_components": 3,
                    "maximum_n_components": 5,
                    "step_size": 1,
                    "n_trials_per_component": 10,
                },
            },
            params={
                "datapath_prefix": temp_dir + "/",
            },
        )
        assert response.status_code == 200
        assert db_session.query(GMMJob).count() == 1

        job = db_session.query(GMMJob).first()
        while job.status.value == "pending":
            db_session.refresh(job)

        if job.status.value != "progress":
            print("Oops, job is not in progress, cannot continue with the test")
            assert False

        ## suspend the job
        uuid = response.json()["uuid"]
        response = client.post(
            "/api/gmm/jobs/suspend",
            json={"uuid": uuid},
        )
        assert response.status_code == 200

        while job.status.value == "progress":
            db_session.refresh(job)

        assert job.status.value == "suspend"


## post   api/gmm/jobs/resume
def test_resume_job(db_session, celery_worker):
    mock_db(db_session, GMMTest.POST_resume_success)
    with mock_latent_df_data(GMMTest.POST_resume_success) as temp_dir:
        ## submit a job
        response = client.post(
            "/api/gmm/jobs/submit",
            json={
                "target": "VAE_model_1",
                "name": "GMM Job n",
                "params": {
                    "minimum_n_components": 3,
                    "maximum_n_components": 5,
                    "step_size": 1,
                    "n_trials_per_component": 10,
                },
            },
            params={
                "datapath_prefix": temp_dir + "/",
            },
        )
        job = db_session.query(GMMJob).first()
        while job.status.value == "pending":
            db_session.refresh(job)

        ## suspend the job
        client.post(
            "/api/gmm/jobs/suspend",
            json={"uuid": response.json()["uuid"]},
        )
        while job.status.value == "progress":
            db_session.refresh(job)

        ## resume the job
        response = client.post(
            "/api/gmm/jobs/resume",
            json={"uuid": response.json()["uuid"]},
            params={
                "datapath_prefix": temp_dir + "/",
            },
        )
        assert response.status_code == 200
        while job.status.value == "suspend":
            db_session.refresh(job)
        while job.status.value == "progress":
            db_session.refresh(job)

        assert job.status.value == "success"

        ## check if right data is in the database
        assert db_session.query(OptimalTrial).count() == 3
        n_components = {3, 4, 5}
        for trial in db_session.query(OptimalTrial).all():
            assert trial.n_trials_completed == 10
            assert trial.n_trials_total == 10
            n_components.remove(trial.n_components)
        assert len(n_components) == 0
        assert db_session.query(BIC).count() == 30


## post   api/gmm/jobs/publish
def test_publish_job(db_session, celery_worker):
    mock_db(db_session, GMMTest.POST_publish_success)
    with mock_latent_df_data(GMMTest.POST_publish_success) as temp_dir:
        ## submit a job
        response = client.post(
            "/api/gmm/jobs/submit",
            json={
                "target": "VAE_model_1",
                "name": "GMM Job n",
                "params": {
                    "minimum_n_components": 3,
                    "maximum_n_components": 3,
                    "step_size": 1,
                    "n_trials_per_component": 3,
                },
            },
            params={
                "datapath_prefix": temp_dir + "/",
            },
        )
        assert response.status_code == 200
        job = db_session.query(GMMJob).first()
        while job.status.value in {"pending", "progress"}:
            db_session.refresh(job)

        assert job.status.value == "success"

        ## publish the job
        response = client.post(
            "/api/gmm/jobs/publish",
            json={
                "uuid": response.json()["uuid"],
                "name": "test",
                "n_components": 3,
            },
            params={
                "datapath_prefix": temp_dir + "/",
            },
        )
        assert response.status_code == 200

        ## test if the data is in the database
        df = pd.read_pickle(temp_dir + "/items/VAE_model_1/best_gmm_dataframe.pkl")
        df = df.loc["test"]
        assert df["GMM_num_components"] == 3
