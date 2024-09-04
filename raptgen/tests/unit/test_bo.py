import pytest
from pytest import approx
from collections import defaultdict

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session
import pytest_postgresql.factories as factories

from fastapi import FastAPI
from fastapi.testclient import TestClient
from tasks import celery

from core.db import (
    BaseSchema,
    Experiments,
    RegisteredValues,
    QueryData,
    AcquisitionData,
    get_db_session,
)

from routers import optimization

test_app = FastAPI()
test_app.include_router(optimization.router)

client = TestClient(test_app)


from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


def handler(request: Request, exc: RequestValidationError):
    print(exc)
    return JSONResponse(content={}, status_code=status.HTTP_422_UNPROCESSABLE_ENTITY)


test_app.add_exception_handler(RequestValidationError, handler)


def load_database(**kwargs):
    connection = f"postgresql+psycopg2://{kwargs['user']}:@{kwargs['host']}:{kwargs['port']}/{kwargs['dbname']}"
    engine = create_engine(connection)
    BaseSchema.metadata.create_all(engine)
    session = scoped_session(sessionmaker(bind=engine))
    # add things to session

    # prepare the database
    # parent_to_children = defaultdict(list)
    # for child in mock_children:
    #     child_job = ChildJob(**child, jobtype="RaptGen")
    #     parent_to_children[child["parent_uuid"]].append(child_job)
    # for parent in mock_parents:
    #     parent_job = ParentJob(**parent)
    #     session.add(parent_job)
    #     session.add_all(parent_to_children[parent["uuid"]])
    # for embeddings in mock_embeddings:
    #     session.add(SequenceEmbeddings(**embeddings))
    # for training_losses in mock_training_losses:
    #     session.add(TrainingLosses(**training_losses))
    # for parent in mock_parents:
    #     session.add(
    #         PreprocessingParams(
    #             **mock_params_preprocessing, parent_uuid=parent.get("uuid")
    #         )
    #     )

    # for child in mock_children:
    #     session.add(RaptGenParams(**mock_params_raptgen, child_uuid=child.get("uuid")))

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


def mock_db(db_session, testcase: BOTest):
    """add mock data to the database"""
    # DB data is written in the following format:

    # # itemsAPI mock data for the BO module
    # mock_bo_db = [
    #     {
    #         "tests": {
    #             BOTest.POST_run_success,
    #             BOTest.POST_run_failure,
    #             BOTest.GET_items_all_success_no_data,  # This is a test for the case where all items are deleted.
    #             BOTest.POST_submit_success,
    #             BOTest.POST_submit_failure,
    #         },
    #         "data": {
    #             C.Experiments: [],
    #             C.RegisteredValues: [],
    #             C.QueryData: [],
    #             C.AcquisitionData: [],
    #         },
    #     },
    #  ... ]

    # get the data
    data = [d for d in mock_bo_db if testcase in d["tests"]][0]["data"]

    # add the data to the database
    for d in data[C.Experiments]:
        db_session.add(Experiments(**d))

    for d in data[C.RegisteredValues]:
        db_session.add(RegisteredValues(**d))

    for d in data[C.QueryData]:
        db_session.add(QueryData(**d))

    for d in data[C.AcquisitionData]:
        db_session.add(AcquisitionData(**d))

    db_session.commit()
def test_submit_bo_result(db_session):
    mock_db(db_session, BOTest.POST_submit_success)

    # create a new experiment
    # {
    #     experiment_name: string?, (null もしくは "" の時 untitled という名前がつきます）
    #     VAE_model: string,
    #     plot_config: {
    #         minimum_count: number,
    #         show_training_data: boolean,
    #         show_bo_contour: boolean
    #     },
    #     optimization_params: {
    #         method_name: string,x
    #         target_column_name: string,
    #         query_budget: number,
    #     },
    #     distribution_params: {
    #         xlim_start: number,
    #         xlim_end: number,
    #         ylim_start: number,
    #         ylim_end: number
    #     },
    #     registered_values: {
    #         ids: string[],
    #         sequences: string[],
    #         target_column_names: string[],
    #         target_values: number[][],
    #     },
    #     query_data: {
    #         sequences: string[],
    #         coords_x_original: number[],
    #         coords_y_original: number[],
    #     },
    #     acquisition_data: {
    #         coords_x: number[],
    #         coords_y: number[],
    #         values: number[],
    #     }
    # }
    response = client.post(
        "/api/bayesopt/submit",
        json={
            "experiment_name": "test_experiment",
            "VAE_model": "test_model",
            "plot_config": {
                "minimum_count": 2,
                "show_training_data": True,
                "show_bo_contour": True,
            },
            "optimization_config": {
                "method_name": "qEI",
                "target_column_name": "target",
                "query_budget": 10,
            },
            "distribution_params": {
                "xlim_start": 0,
                "xlim_end": 1,
                "ylim_start": 0,
                "ylim_end": 1,
            },
            "registered_table": {
                "ids": ["0"],
                "sequences": ["CCC"],
                "target_column_names": ["target"],
                "target_values": [[0.5]],
            },
            "query_table": {
                "sequences": ["AAA"],
                "coords_x_original": [0],
                "coords_y_original": [1],
            },
            "acquisition_mesh": {
                "coords_x": [2],
                "coords_y": [3],
                "values": [4],
            },
        },
    )
    assert response.status_code == 200

    # check if the experiment was added to the database
    uuid = response.json()["uuid"]
    experiment = db_session.query(Experiments).filter_by(uuid=uuid).first()

    db_session.commit()

    assert experiment is not None
    assert experiment.name == "test_experiment"
    assert experiment.VAE_model == "test_model"

    # check query data
    assert experiment.query_data is not None
    assert experiment.query_data[0].sequence == "AAA"

    # check acquisition data
    assert experiment.acquisition_data is not None
    assert 1.99 < experiment.acquisition_data[0].coord_x < 2.01
    assert 2.99 < experiment.acquisition_data[0].coord_y < 3.01


def test_submit_bo_result_multi_sequence(db_session):
    mock_db(db_session, BOTest.POST_submit_success)
    # create a new experiment
    # {
    #     experiment_name: string?, (null もしくは "" の時 untitled という名前がつきます）
    #     VAE_model: string,
    #     plot_config: {
    #         minimum_count: number,
    #         show_training_data: boolean,
    #         show_bo_contour: boolean
    #     },
    #     optimization_params: {
    #         method_name: string,x
    #         target_column_name: string,
    #         query_budget: number,
    #     },
    #     distribution_params: {
    #         xlim_start: number,
    #         xlim_end: number,
    #         ylim_start: number,
    #         ylim_end: number
    #     },
    #     registered_values: {
    #         ids: string[],
    #         sequences: string[],
    #         target_column_names: string[],
    #         target_values: number[][],
    #     },
    #     query_data: {
    #         sequences: string[],
    #         coords_x_original: number[],
    #         coords_y_original: number[],
    #     },
    #     acquisition_data: {
    #         coords_x: number[],
    #         coords_y: number[],
    #         values: number[],
    #     }
    # }
    response = client.post(
        "/api/bayesopt/submit",
        json={
            "experiment_name": "test_experiment_2",
            "VAE_model": "test_model_2",
            "plot_config": {
                "minimum_count": 2,
                "show_training_data": True,
                "show_bo_contour": True,
            },
            "optimization_config": {
                "method_name": "qEI",
                "target_column_name": "target",
                "query_budget": 10,
            },
            "distribution_params": {
                "xlim_start": 0,
                "xlim_end": 1,
                "ylim_start": 0,
                "ylim_end": 1,
            },
            "registered_table": {
                "ids": ["0", "1"],
                "sequences": ["CCC", "AAA"],
                "target_column_names": ["vsA", "vsB"],
                "target_values": [[0.5, 0.2], [0.3, 0.4]],
            },
            "query_table": {
                "sequences": ["GGG", "TTT"],
                "coords_x_original": [0, 3],
                "coords_y_original": [1, 5],
            },
            "acquisition_mesh": {
                "coords_x": [2, 2, 3, 3],
                "coords_y": [3, 4, 3, 4],
                "values": [4, 0.3, -0.2, 100],
            },
        },
    )
    assert response.status_code == 200

    # check if the experiment was added to the database
    uuid = response.json()["uuid"]
    experiment = db_session.query(Experiments).filter_by(uuid=uuid).first()

    db_session.commit()

    assert experiment is not None
    assert experiment.name == "test_experiment_2"
    assert experiment.VAE_model == "test_model_2"

    # check registered data
    assert experiment.registered_values is not None
    assert [r.sequence for r in experiment.registered_values] == ["CCC", "AAA"]
    assert [r.target_column_name for r in experiment.registered_values] == [
        "vsA",
        "vsB",
    ]

    # check query data
    assert experiment.query_data is not None
    assert [q.sequence for q in experiment.query_data] == ["GGG", "TTT"]
    assert [q.coord_x_original for q in experiment.query_data] == [0, 3]
    assert [q.coord_y_original for q in experiment.query_data] == [1, 5]

    # check acquisition data
    assert experiment.acquisition_data is not None
    assert 1.99 < experiment.acquisition_data[0].coord_x < 2.01
    assert 2.99 < experiment.acquisition_data[0].coord_y < 3.01
