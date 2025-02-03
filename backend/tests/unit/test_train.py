import pytest
from pytest import approx
from collections import defaultdict

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session
import pytest_postgresql.factories as factories

from fastapi import FastAPI
from fastapi.testclient import TestClient
from mocks import (
    mock_children,
    mock_parents,
    mock_embeddings,
    mock_training_losses,
    mock_params_preprocessing,
    mock_params_raptgen,
)
from tasks import celery

from core.db import (
    BaseSchema,
    ParentJob,
    ChildJob,
    SequenceEmbeddings,
    TrainingLosses,
    SequenceData,
    RaptGenParams,
    PreprocessingParams,
    ViewerVAE,
    get_db_session,
)

from routers import training

test_app = FastAPI()
test_app.include_router(training.router)

client = TestClient(test_app)


def load_database(**kwargs):
    connection = f"postgresql+psycopg2://{kwargs['user']}:@{kwargs['host']}:{kwargs['port']}/{kwargs['dbname']}"
    engine = create_engine(connection)
    BaseSchema.metadata.create_all(engine)
    session = scoped_session(sessionmaker(bind=engine))
    # add things to session

    # prepare the database
    parent_to_children = defaultdict(list)
    for child in mock_children:
        child_job = ChildJob(**child, jobtype="RaptGen")
        parent_to_children[child["parent_uuid"]].append(child_job)
    for parent in mock_parents:
        parent_job = ParentJob(**parent)
        session.add(parent_job)
        session.add_all(parent_to_children[parent["uuid"]])
    for embeddings in mock_embeddings:
        session.add(SequenceEmbeddings(**embeddings))
    for training_losses in mock_training_losses:
        session.add(TrainingLosses(**training_losses))

    try:
        session.commit()
    except Exception as e:
        session.rollback()
        raise e
    finally:
        session.close()

    for parent in mock_parents:
        session.add(
            PreprocessingParams(
                **mock_params_preprocessing, parent_uuid=parent.get("uuid")
            )
        )

    for child in mock_children:
        session.add(RaptGenParams(**mock_params_raptgen, child_uuid=child.get("uuid")))


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


def test_get_available_devices():
    response = client.get("/api/train/device/process")

    assert response.status_code == 200
    assert "CPU" in response.json()

    # CUDAが利用可能な環境でテストを行う場合には以下を有効に
    # CUDAという文字列がいずれかのdeviceの中にあることをテスト
    # assert any("CUDA:" in device for device in response.json())


def test_get_parent_job_info(db_session):
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


def test_update_parent_job(db_session):
    """
    Test the update API for parent jobs `PATCH /api/train/jobs/items/{uuid}`
    """
    # the target of the update API
    parent_uuid = "465e884b-7657-47fa-b624-ed752864ae7a"

    # valid update
    res_valid_1 = client.patch(
        f"/api/train/jobs/items/{parent_uuid}",
        json={
            "target": "name",
            "value": "updated_value",
        },
    )
    res_valid_1_get = client.get(f"/api/train/jobs/items/{parent_uuid}")
    assert res_valid_1_get.json()["name"] == "updated_value"
    assert res_valid_1.status_code == 200

    # invalid update
    res_invalid_1 = client.patch(
        f"/api/train/jobs/items/{parent_uuid}",
        json={
            "target": "invalid_target",
            "value": "updated_value",
        },
    )
    assert res_invalid_1.status_code == 422

    res_invalid_2 = client.patch(
        f"/api/train/jobs/items/{parent_uuid}",
        json={
            "target": "name",
            "value": 123,
        },
    )
    assert res_invalid_2.status_code == 422

    return


def test_get_child_job_info(db_session):
    parent_uuid = "465e884b-7657-47fa-b624-ed752864ae7a"
    child_uuid = "22b3a0a0-5b7a-4b5a-8b0a-2b3a0a0b7a40"
    response = client.get(f"/api/train/jobs/items/{parent_uuid}/0")
    assert response.status_code == 200
    assert response.json()["uuid"] == child_uuid
    assert response.json()["status"] == "success"
    assert response.json()["datetime_start"] == 1609459200
    assert response.json()["epochs_total"] == 100
    assert response.json().get("epochs_current") is None

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
    assert response.json().get("epochs_current") is None
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
    assert response.json().get("epochs_current") is None
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
    assert response.json().get("epochs_current") is not None
    assert response.json().get("error_msg") is None

    parent_uuid = "465e884b-7657-47fa-b624-ed752864ae84"
    child_uuid = "465e884b-7657-47fa-b624-ed752864ae7c"
    response = client.get(f"/api/train/jobs/items/{parent_uuid}/1")
    assert response.status_code == 200
    assert response.json()["uuid"] == child_uuid
    assert response.json()["status"] == "suspend"
    assert response.json().get("latent") is not None
    assert response.json().get("losses") is not None
    assert response.json().get("epochs_current") is not None
    assert response.json().get("error_msg") is None

    # 異常系
    parent_uuid = "465e884b-7657-47fa-b624-xxxxxxxxxxxx"
    response = client.get(f"/api/train/jobs/items/{parent_uuid}/0")
    assert response.status_code == 422

    parent_uuid = "465e884b-7657-47fa-b624-ed752864ae7a"
    response = client.get(f"/api/train/jobs/items/{parent_uuid}/99999999")
    assert response.status_code == 422


def test_search_job_with_status(db_session):
    # get success jobs
    response = client.post("/api/train/jobs/search", json={"status": ["success"]})
    assert response.status_code == 200
    assert len(response.json()) == 2
    assert response.json()[0]["status"] == "success"

    # get failure jobs
    response = client.post("/api/train/jobs/search", json={"status": ["failure"]})
    assert response.status_code == 200
    assert len(response.json()) == 2

    # invalid regex
    response = client.post(
        "/api/train/jobs/search", json={"search_regex": {"test": "test"}}
    )
    assert response.status_code == 422

    # test regex
    response = client.post("/api/train/jobs/search", json={"search_regex": r"test_.*"})
    assert response.status_code == 200
    assert len(response.json()) == 9

    response = client.post("/api/train/jobs/search", json={"search_regex": r"test"})
    assert response.status_code == 200
    assert len(response.json()) == 10

    # is_multipleのテスト
    response = client.post("/api/train/jobs/search", json={"is_multiple": True})
    assert response.status_code == 200
    assert len(response.json()) == 5

    response = client.post("/api/train/jobs/search", json={"is_multiple": False})
    assert response.status_code == 200
    assert len(response.json()) == 5

    response = client.post(
        "/api/train/jobs/search", json={"is_multiple": 2}
    )  # not boolean
    assert response.status_code == 422

    # typeのテスト
    response = client.post("/api/train/jobs/search", json={"type": ["RaptGen"]})
    assert response.status_code == 200
    assert len(response.json()) == 10

    response = client.post("/api/train/jobs/search", json={"type": ["AptGen"]})
    assert response.status_code == 422


def test_enqueue_job(db_session, celery_worker):
    response = client.post(
        "/api/train/jobs/submit",
        json={
            "type": "RaptGen",
            "name": "test",
            "params_preprocessing": {
                "forward": "A",
                "reverse": "T",
                "random_region_length": 5,
                "tolerance": 0,
                "minimum_count": 1,
            },
            "random_regions": [  # ATAcgのモチーフが存在していることのテスト
                "ATGAG",
                "ATGCG",
                "ATGGG",
                "ATGTG",
                "ATGCA",
                "ATGCG",
                "ATGCT",
                "ATGCC",
            ]
            * 100,
            "duplicates": [2] * 800,
            "reiteration": 2,
            "params_training": {
                "model_length": 5,
                "epochs": 2,
                "match_forcing_duration": 1,
                "beta_duration": 1,
                "early_stopping": 1,
                "seed_value": 10,
                "match_cost": 10,
                "device": "CPU",
            },
        },
    )

    assert response.status_code == 200

    # check if the job is enqueued
    parent_uuid = response.json()["uuid"]
    parent_job = (
        db_session.query(ParentJob).filter(ParentJob.uuid == parent_uuid).first()
    )

    db_session.commit()

    assert parent_job.name == "test"
    assert parent_job.type == "RaptGen"

    while parent_job.status in {"pending", "progress"}:
        db_session.refresh(parent_job)
    assert parent_job.status == "success"

    return parent_uuid


def test_suspend_job(db_session, celery_worker):
    response = client.post(
        "/api/train/jobs/submit",
        json={
            "type": "RaptGen",
            "name": "test",
            "params_preprocessing": {
                "forward": "A",
                "reverse": "T",
                "random_region_length": 5,
                "tolerance": 0,
                "minimum_count": 1,
            },
            "random_regions": [  # ATAcgのモチーフが存在していることのテスト
                "ATGAG",
                "ATGCG",
                "ATGGG",
                "ATGTG",
                "ATGCA",
                "ATGCG",
                "ATGCT",
                "ATGCC",
            ]
            * 100,
            "duplicates": [2] * 800,
            "reiteration": 2,
            "params_training": {
                "model_length": 5,
                "epochs": 2,
                "match_forcing_duration": 1,
                "beta_duration": 1,
                "early_stopping": 1,
                "seed_value": 10,
                "match_cost": 10,
                "device": "CPU",
            },
        },
    )

    # check if the job is enqueued
    parent_uuid: str = response.json()["uuid"]
    parent_job = (
        db_session.query(ParentJob).filter(ParentJob.uuid == parent_uuid).first()
    )
    child_jobs = (
        db_session.query(ChildJob).filter(ChildJob.parent_uuid == parent_uuid).all()
    )

    db_session.commit()
    while parent_job.status in {"pending"}:
        db_session.refresh(parent_job)
    assert parent_job.status == "progress"

    response = client.post("/api/train/jobs/suspend", json={"uuid": parent_uuid})

    assert response.status_code == 200

    while parent_job.status in {"progress"}:
        db_session.refresh(parent_job)
        for child_job in child_jobs:
            db_session.refresh(child_job)
    assert parent_job.status == "suspend"
    assert all([child_job.status == "suspend" for child_job in child_jobs])

    return parent_uuid


def test_resume_job(db_session, celery_worker):
    parent_uuid = test_suspend_job(db_session, celery_worker)
    parent_job = (
        db_session.query(ParentJob).filter(ParentJob.uuid == parent_uuid).first()
    )
    child_jobs = (
        db_session.query(ChildJob).filter(ChildJob.parent_uuid == parent_uuid).all()
    )

    response = client.post("/api/train/jobs/resume", json={"uuid": parent_uuid})

    assert response.status_code == 200

    while parent_job.status in {"suspend"}:
        db_session.refresh(parent_job)
        for child_job in child_jobs:
            db_session.refresh(child_job)
    assert parent_job.status == "progress"

    while parent_job.status in {"progress"}:
        db_session.refresh(parent_job)
        for child_job in child_jobs:
            db_session.refresh(child_job)

    for child_job in child_jobs:
        assert child_job.status == "success"
    assert parent_job.status == "success"

    return None


def test_delete_job(db_session, celery_worker):
    parent_uuid = test_suspend_job(db_session, celery_worker)
    response = client.delete(f"/api/train/jobs/items/{parent_uuid}")

    assert response.status_code == 200

    db_session.commit()

    res = db_session.query(ParentJob).filter(ParentJob.uuid == parent_uuid).first()
    assert res is None

    res = db_session.query(ChildJob).filter(ChildJob.parent_uuid == parent_uuid).all()
    assert len(res) == 0

    res = (
        db_session.query(SequenceData)
        .filter(SequenceData.parent_uuid == parent_uuid)
        .all()
    )
    assert len(res) == 0

    return None


def test_publish_parent_job(db_session, celery_worker):
    parent_uuid = test_enqueue_job(db_session, celery_worker)
    print(f"parent_uuid: {parent_uuid}")
    response = client.post(
        "/api/train/jobs/publish",
        json={
            "uuid": parent_uuid,
            "multi": 0,
            "name": "test",
        },
    )
    assert response.status_code == 200

    vae_entry = db_session.query(ViewerVAE).filter(ViewerVAE.name == "test").first()
    assert vae_entry is not None
