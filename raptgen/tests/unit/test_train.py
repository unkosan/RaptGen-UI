import os
import pytest
from pytest import approx
from datetime import datetime
from collections import defaultdict

from fastapi import FastAPI
from fastapi.testclient import TestClient

from core.db import (
    Base,
    engine,
    get_session,
    ParentJob,
    ChildJob,
    SequenceEmbeddings,
    TrainingLosses,
)
from routers import training
from routers.training import get_db_session

from mocks import mock_children, mock_parents, mock_embeddings, mock_training_losses

# Set the TESTING environment variable
os.environ["TESTING"] = "1"

# FastAPIのアプリケーションをインポート（appの場所により修正が必要）
app = FastAPI()
app.include_router(training.router)

client = TestClient(app)


def test_get_available_devices():
    response = client.get("/api/train/device/process")

    assert response.status_code == 200
    assert "CPU" in response.json()

    # CUDAが利用可能な環境でテストを行う場合には以下を有効に
    # CUDAという文字列がいずれかのdeviceの中にあることをテスト
    # assert any("CUDA:" in device for device in response.json())


@pytest.fixture(scope="function", autouse=True)
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


def test_get_parent_job_info(override_dependencies):
    # Get a session
    session_generator = get_db_session()
    session = next(session_generator)  # Get the session object from the generator

    d = defaultdict(list)
    for child_job_info in mock_children:
        child_job = ChildJob(**child_job_info)
        d[child_job_info["parent_uuid"]].append(child_job)

    # Create a new parent job instance
    for parent_job in mock_parents:
        session.add(ParentJob(child_jobs=d[parent_job["uuid"]], **parent_job))

    session.commit()

    # Close the session
    session.close()

    # from mock_parents[0]["uuid"]
    parent_uuid = "465e884b-7657-47fa-b624-ed752864ae7a"
    response = client.get(f"/api/train/jobs/items/{parent_uuid}")
    assert response.status_code == 200
    assert response.json()["uuid"] == parent_uuid
    assert response.json()["start"] == 1609459200

    # 子ジョブが取得できているかを確認する
    assert response.json()["summary"]["indices"] == [0]
    assert response.json()["summary"]["minimum_NLLs"][0] == pytest.approx(0.01)

    # multiple child job : 465e884b-7657-47fa-b624-ed752864ae7d
    parent_uuid = "465e884b-7657-47fa-b624-ed752864ae7d"
    response = client.get(f"/api/train/jobs/items/{parent_uuid}")
    assert response.status_code == 200
    assert response.json()["uuid"] == parent_uuid

    # second value is None
    assert response.json()["summary"]["indices"] == [0, 1]
    assert response.json()["summary"]["minimum_NLLs"][0] == pytest.approx(0.05)
    assert response.json()["summary"]["minimum_NLLs"][1] is None

    # 存在しない場合にエラーが吐かれること
    response = client.get("/api/train/jobs/items/465e884b-7657-47fa-b624-1234567890ab")
    assert response.status_code == 422
    assert response.json()["detail"][0]["msg"] == "Job not found"

    # 存在しない場合にエラーが吐かれること
    response = client.get("/api/train/jobs/items/")
    assert response.status_code == 404


def test_get_child_job_info(override_dependencies):
    # Get a session
    session_generator = get_db_session()
    session = next(session_generator)  # Get the session object from the generator

    d = defaultdict(list)
    for child_job_info in mock_children:
        child_job = ChildJob(**child_job_info)
        d[child_job_info["parent_uuid"]].append(child_job)

    # Create a new parent job instance
    for parent_job in mock_parents:
        session.add(ParentJob(child_jobs=d[parent_job["uuid"]], **parent_job))

    for embeddings in mock_embeddings:
        session.add(SequenceEmbeddings(**embeddings))

    for training_losses in mock_training_losses:
        session.add(TrainingLosses(**training_losses))

    session.commit()

    # Close the session
    session.close()

    # from mock_parents[0]["uuid"]
    parent_uuid = "465e884b-7657-47fa-b624-ed752864ae7a"
    child_uuid = "22b3a0a0-5b7a-4b5a-8b0a-2b3a0a0b7a40"
    response = client.get(f"/api/train/jobs/items/{parent_uuid}/0")
    assert response.status_code == 200
    assert response.json()["uuid"] == child_uuid
    assert response.json()["status"] == "success"
    assert response.json()["start"] == 1609459200

    latent = response.json()["latent"]
    assert latent["random_regions"] == ["AAA"]
    assert latent["coords_x"] == approx([0.1])
    assert latent["coords_y"] == approx([0.2])
    assert latent["duplicates"] == [1]

    losses = response.json()["losses"]
    # "train_loss": 53.2,
    # "test_loss": 34.1,
    # "test_recon": 62.3,
    # "test_kld": 55.4,
    assert len(losses["train_loss"]) == 20
    assert losses["train_loss"][0] == approx(53.2)
    assert len(losses["test_loss"]) == 20
    assert losses["test_loss"][0] == approx(34.1)
    assert len(losses["test_recon"]) == 20
    assert losses["test_recon"][0] == approx(62.3)
    assert len(losses["test_kld"]) == 20
    assert losses["test_kld"][0] == approx(55.4)

    # failureの時にlossesがNoneになっていることを確認する
    # failureの時にlatentがNoneになっていることを確認する
    # failureの時にerror_msgが設定されていることを確認する
    parent_uuid = "465e884b-7657-47fa-b624-ed752864ae7d"
    child_uuid = "22b3a0a0-5b7a-4b5a-8b0a-2b3a0a0b7a45"
    response = client.get(f"/api/train/jobs/items/{parent_uuid}/1")
    assert response.status_code == 200
    assert response.json()["uuid"] == child_uuid
    assert response.json()["status"] == "failure"
    assert response.json().get("latent") is None
    assert response.json().get("losses") is None
    assert response.json().get("error_msg") == "error_message"

    # pendingの時にlossesがNoneになっていることを確認する
    # pendingの時にlatentがNoneになっていることを確認する
    # failure以外ではerror_msgが設定されていないことを確認する
    parent_uuid = "465e884b-7657-47fa-b624-ed752864ae80"
    child_uuid = "22b3a0a0-5b7a-4b5a-8b0a-2b3a0a0b7a48"
    response = client.get(f"/api/train/jobs/items/{parent_uuid}/1")
    assert response.status_code == 200
    assert response.json()["uuid"] == child_uuid
    assert response.json()["status"] == "pending"
    assert response.json().get("latent") is None
    assert response.json().get("losses") is None
    assert response.json().get("error_msg") is None

    # success, progress, suspendの時にlatentがNoneになっていないことを確認する
    # success, progress, suspendの時にlossesがNoneになっていないことを確認する
    # failure以外ではerror_msgが設定されていないことを確認する
    # successは上で確認済み
    parent_uuid = "465e884b-7657-47fa-b624-ed752864ae82"
    child_uuid = "22b3a0a0-5b7a-4b5a-8b0a-2b3a0a0b7a4b"
    response = client.get(f"/api/train/jobs/items/{parent_uuid}/1")
    assert response.status_code == 200
    assert response.json()["uuid"] == child_uuid
    assert response.json()["status"] == "progress"
    assert response.json().get("latent") is not None
    assert response.json().get("losses") is not None
    assert response.json().get("error_msg") is None

    parent_uuid = "465e884b-7657-47fa-b624-ed752864ae84"
    child_uuid = "465e884b-7657-47fa-b624-ed752864ae7c"
    response = client.get(f"/api/train/jobs/items/{parent_uuid}/1")
    assert response.status_code == 200
    assert response.json()["uuid"] == child_uuid
    assert response.json()["status"] == "suspend"
    assert response.json().get("latent") is not None
    assert response.json().get("losses") is not None
    assert response.json().get("error_msg") is None

    # 異常系
    parent_uuid = "465e884b-7657-47fa-b624-xxxxxxxxxxxx"
    response = client.get(f"/api/train/jobs/items/{parent_uuid}/0")
    assert response.status_code == 422

    parent_uuid = "465e884b-7657-47fa-b624-ed752864ae7a"
    response = client.get(f"/api/train/jobs/items/{parent_uuid}/99999999")
    assert response.status_code == 422


def test_search_job(override_dependencies):
    # search all jobs
    response = client.post("/api/train/jobs/search", json={})

    assert response.status_code == 200
    assert response.json() == list()


def test_search_job_with_status(override_dependencies):
    # Get a session
    session_generator = get_db_session()
    session = next(session_generator)  # Get the session object from the generator

    parent_job = ParentJob(
        uuid="465e884b-7657-47fa-b624-ed752864ae7a",
        name="test_name",
        type="RaptGen",
        status="success",
        start=int(
            datetime.strptime("2021-01-01 00:00:00", "%Y-%m-%d %H:%M:%S").timestamp()
        ),
        duration=60,
        reiteration=2,
        params_training={
            "num_epochs": 100,
            "batch_size": 100,
            "learning_rate": 0.001,
            "weight_decay": 0.0001,
            "num_workers": 4,
            "pin_memory": True,
            "device": "CPU",
        },
    )

    # Create a new child job instance
    child_job = ChildJob(
        id=0,
        uuid="29c738ec-0e81-4f58-9839-a5970c0ae524",
        parent_uuid=parent_job.uuid,
        # Add other attributes as needed
        start=int(
            datetime.strptime("2021-01-01 00:00:00", "%Y-%m-%d %H:%M:%S").timestamp()
        ),
        duration=60,
        status="success",
        epochs_total=100,
        epochs_current=100,
    )
    parent_job.child_jobs.append(child_job)

    child_job = ChildJob(
        id=1,
        uuid="8e8c472b-59a6-4399-9a5b-0d85e3772ea2",
        parent_uuid=parent_job.uuid,
        # Add other attributes as needed
        start=int(
            datetime.strptime("2021-01-01 00:00:00", "%Y-%m-%d %H:%M:%S").timestamp()
        ),
        duration=60,
        status="success",
        epochs_total=100,
        epochs_current=100,
    )
    parent_job.child_jobs.append(child_job)

    session.add(parent_job)
    session.commit()

    # Close the session
    session.close()

    # get success jobs
    response = client.post("/api/train/jobs/search", json={"status": ["success"]})
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["status"] == "success"

    # get failure jobs
    response = client.post("/api/train/jobs/search", json={"status": ["failure"]})
    assert response.status_code == 200
    assert len(response.json()) == 0

    # test regex
    response = client.post("/api/train/jobs/search", json={"search_regex": r"test_.*"})
    assert response.status_code == 200
    assert len(response.json()) == 1

    response = client.post("/api/train/jobs/search", json={"search_regex": r"test"})
    assert response.status_code == 200
    assert len(response.json()) == 1

    # invalid regex
    response = client.post("/api/train/jobs/search", json={"search_regex": r"*"})
    assert response.status_code == 422

    # is_multipleのテスト
    response = client.post("/api/train/jobs/search", json={"is_multiple": True})
    assert response.status_code == 200
    assert len(response.json()) == 1

    response = client.post("/api/train/jobs/search", json={"is_multiple": False})
    assert response.status_code == 200
    assert len(response.json()) == 0

    response = client.post("/api/train/jobs/search", json={"is_multiple": 2})
    assert response.status_code == 422

    # typeのテスト
    response = client.post("/api/train/jobs/search", json={"type": ["RaptGen"]})
    assert response.status_code == 200
    assert len(response.json()) == 1

    response = client.post("/api/train/jobs/search", json={"type": ["AptGen"]})
    assert response.status_code == 422


# def test_enqueue_job(override_dependencies):
#     response = client.post(
#         "/api/train/jobs/submit",
#         json={
#             "raptgen_model_type": "RaptGen",
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
#     response = client.post("/api/train/jobs/search", json={})  # get all jobs
#     job = response.json()
#     assert response.status_code == 200

#     assert any(task_id == job["task_id"] for job in response.json()["data"])
