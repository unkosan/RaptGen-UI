import torch
from fastapi import APIRouter, File, Form

router = APIRouter()


@router.get("/train/device/process")
async def get_available_devices():
    devices = ["CPU"]

    if torch.cuda.is_available():
        cuda_device_count = torch.cuda.device_count()
        devices.extend([f"CUDA:{i}" for i in range(cuda_device_count)])

    return {"devices": devices}
