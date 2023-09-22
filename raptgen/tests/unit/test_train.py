from routers import training

from fastapi import FastAPI
from fastapi.testclient import TestClient
import pytest

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


def test_enqueue_job():
    response = client.post(
        "/train/jobs/submit",
        json={
            "model_type": "RaptGen",
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
            ],
            "duplicates": [],
            "reiteration": 1,
            "params_training": {
                "num_epochs": 100,
                "batch_size": 100,
                "learning_rate": 0.001,
                "weight_decay": 0.0001,
                "num_workers": 4,
                "pin_memory": True,
                "device": "CPU",
            },
        },
    )

    assert response.status_code == 200

    # check if the job is enqueued
    task_id = response.json()["data"]["task_id"]
    response = client.post("/train/jobs/search", json={})  # get all jobs

    assert response.status_code == 200
    assert any(task_id == job["task_id"] for job in response.json()["data"])
