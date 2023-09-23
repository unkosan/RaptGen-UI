from routers import training

from fastapi import FastAPI
from fastapi.testclient import TestClient

import os
import pytest
from core.db import Base, engine, get_session
from routers.training import get_db_session

# Set the TESTING environment variable
os.environ["TESTING"] = "1"

# FastAPIのアプリケーションをインポート（appの場所により修正が必要）
app = FastAPI()
app.include_router(training.router)

client = TestClient(app)


def test_get_available_devices():
    response = client.get("/train/device/process")

    assert response.status_code == 200
    assert "devices" in response.json()

    devices = response.json()["devices"]

    # 以下は一例で、実際の環境によって異なります
    # CPUは必ず含まれるべき
    assert "CPU" in devices

    # CUDAが利用可能な環境でテストを行う場合には以下を有効に
    # assert any("CUDA:" in device for device in devices)


@pytest.fixture(scope="module", autouse=True)
def setup_database():
    # Create tables for testing
    Base.metadata.create_all(engine)
    yield
    # Drop tables after tests
    Base.metadata.drop_all(engine)


@pytest.fixture
def test_session():
    """Create a session for testing that rolls back changes"""
    session = get_session()
    session.begin_nested()  # Start a nested transaction
    yield session
    session.rollback()  # Rollback the nested transaction
    session.close()


@pytest.fixture
def override_dependencies(test_session):  # Add test_session as an argument
    def _get_test_session():
        return test_session

    app.dependency_overrides[get_db_session] = _get_test_session
    yield
    app.dependency_overrides.pop(get_db_session, None)


def test_search_job(override_dependencies):
    # search all jobs
    response = client.post("/train/jobs/search", json={})

    assert response.status_code == 200

    # 以下は一例で、実際の環境によって異なります
    assert response.json() == list()


# def test_enqueue_job():
#     response = client.post(
#         "/train/jobs/submit",
#         json={
#             "model_type": "RaptGen",
#             "name": "test",
#             "params_preprocessing": {
#                 "forward": "A",
#                 "reverse": "T",
#                 "random_region_length": 5,
#                 "tolerance": 0,
#                 "minimum_count": 1,
#             },
#             "random_regions": [  # ATAcgのモチーフが存在していることのテスト
#                 "ATGAG",
#                 "ATGCG",
#                 "ATGGG",
#                 "ATGTG",
#                 "ATGCA",
#                 "ATGCG",
#                 "ATGCT",
#                 "ATGCC",
#             ],
#             "duplicates": [],
#             "reiteration": 1,
#             "params_training": {
#                 "num_epochs": 100,
#                 "batch_size": 100,
#                 "learning_rate": 0.001,
#                 "weight_decay": 0.0001,
#                 "num_workers": 4,
#                 "pin_memory": True,
#                 "device": "CPU",
#             },
#         },
#     )

#     assert response.status_code == 200

#     # check if the job is enqueued
#     task_id = response.json()["data"]["task_id"]
#     response = client.post("/train/jobs/search", json={})  # get all jobs

#     assert response.status_code == 200
#     assert any(task_id == job["task_id"] for job in response.json()["data"])
