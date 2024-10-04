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
