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
