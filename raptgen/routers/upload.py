from fastapi import APIRouter, File, Form

router = APIRouter()

import os
from io import BytesIO
import pickle
from typing import List, Optional, Tuple, Dict, Any, OrderedDict
from pydantic import BaseModel
from core.preprocessing import calc_target_length, estimate_adapters
from core.algorithms import CNN_PHMM_VAE
from datetime import datetime
import torch
import pandas as pd
import numpy as np


DATA_PATH = "/app/data/"


class CPU_Unpickler(pickle.Unpickler):
    def find_class(self, module, name):
        if module == "torch.storage" and name == "_load_from_bytes":
            return lambda b: torch.load(BytesIO(b), map_location="cpu")
        else:
            return super().find_class(module, name)


class RequestEstimateLength(BaseModel):
    sequences: List[str]


@router.post("/api/upload/estimate-target-length")
# async def estimate_target_length(sequences: List[str]):
async def estimate_target_length(estimate_length_data: RequestEstimateLength):
    sequences = estimate_length_data.sequences
    if len(sequences) == 0:
        return {"status": "error"}

    target_length = calc_target_length(sequences)
    return {"status": "success", "data": {"target_length": target_length}}


class RequestEstimateAdapters(BaseModel):
    sequences: List[str]
    target_length: int


@router.post("/api/upload/estimate-adapters")
async def estimate_forward_reverse_adapters(
    estimate_adapters_data: RequestEstimateAdapters,
):
    sequences = estimate_adapters_data.sequences
    target_length = estimate_adapters_data.target_length
    if len(sequences) == 0:
        return {"status": "error"}

    adapters = estimate_adapters(raw_reads=sequences, target_length=target_length)

    return {
        "status": "success",
        "data": {"forward_adapter": adapters[0], "reverse_adapter": adapters[1]},
    }


@router.post("/api/upload/upload-vae")
async def upload_vae(
    model: bytes = File(...),
    model_name: str = Form(...),
    sequences: List[str] = Form(...),
    forward_adapter: str = Form(...),
    reverse_adapter: str = Form(...),
    target_length: int = Form(...),
    coord_x: List[str] = Form(...),
    coord_y: List[str] = Form(...),
    duplicates: List[str] = Form(...),
    # Optional
    published_time: Optional[str] = Form(None),
    experiment_name: Optional[str] = Form(None),
    round_name: Optional[str] = Form(None),
    tolerance: Optional[int] = Form(None),
    minimum_count: Optional[int] = Form(None),
    epochs: Optional[int] = Form(None),
    beta_weighting_epochs: Optional[int] = Form(None),
    match_forcing_epochs: Optional[int] = Form(None),
    match_cost: Optional[float] = Form(None),
    early_stopping_patience: Optional[int] = Form(None),
    CUDA_num_threads: Optional[int] = Form(None),
    CUDA_pin_memory: Optional[bool] = Form(None),
    seed: Optional[int] = Form(None),
):
    # split list
    if len(sequences) == 1:
        sequences = [seq.strip() for seq in sequences[0].split(",")]

    # List[int] = Form() does not work. receive as List[str] instead.
    # https://github.com/tiangolo/fastapi/issues/3532
    if len(coord_x) == 1:
        coord_x_float = [float(string) for string in str(coord_x[0]).split(",")]
    else:
        coord_x_float = [float(coord_x[0])]
    if len(coord_y) == 1:
        coord_y_float = [float(string) for string in str(coord_y[0]).split(",")]
    else:
        coord_y_float = [float(coord_y[0])]
    if len(duplicates) == 1:
        duplicates_int = [int(string) for string in str(duplicates[0]).split(",")]
    else:
        duplicates_int = [int(duplicates[0])]

    # Check for valid inputs
    if len(sequences) == 0:
        return {"status": "error"}
    if model_name == "":
        return {"status": "error"}
    if (
        len(sequences) != len(coord_x_float)
        or len(sequences) != len(coord_y_float)
        or len(sequences) != len(duplicates_int)
    ):
        return {"status": "error"}

    # validate pHMM-VAE model
    result = _validate_pHMM_model(BytesIO(model))
    if result["status"] == "error":
        return result
    motif_length: int = result["data"]["motif_len"]

    # Get random region of sequences
    random_regions: List[str] = []
    for seq in sequences:
        if reverse_adapter == "":
            random_region = seq[len(forward_adapter) :]
        else:
            random_region = seq[len(forward_adapter) : -len(reverse_adapter)]
        if len(random_region) == 0:
            return {"status": "error"}
        random_regions.append(random_region)

    # Timestamp if not provided
    if published_time == None:
        published_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Upload config data to profile dataframe
    config_data = {
        "published_time": published_time,
        "experiment": experiment_name,
        "round": round_name,
        "fwd_adapter": forward_adapter,
        "rev_adapter": reverse_adapter,
        "target_length": target_length,
        "filtering_standard_length": target_length
        - len(forward_adapter)
        - len(reverse_adapter),
        "filtering_tolerance": tolerance,
        "filtering_method": "default",
        "minimum_count": minimum_count,
        "embedding_dim": 2,
        "epochs": epochs,
        "beta_weight_epochs": beta_weighting_epochs,
        "match_forcing_epochs": match_forcing_epochs,
        "match_cost": match_cost,
        "early_stopping_epochs": early_stopping_patience,
        "CUDA_num_workers": CUDA_num_threads,
        "CUDA_pin_memory": CUDA_pin_memory,
        "pHMM_VAE_model_length": motif_length,
        "pHMM_VAE_seed": seed,
    }
    new_entry_df = pd.DataFrame(config_data, index=[model_name])
    new_entry_df.index.name = "name"
    profile_df: pd.DataFrame = pd.read_pickle(DATA_PATH + "profile_dataframe.pkl")
    if model_name in profile_df.index:
        return {"status": "error", "message": "Model name already exists"}
    profile_df = pd.concat([profile_df, new_entry_df])
    profile_df.to_pickle(DATA_PATH + "profile_dataframe.pkl")

    # Upload sequences to database
    seq_df = pd.DataFrame(
        {
            "Sequence": sequences,
            "Duplicates": duplicates_int,
            "Without_Adapters": random_regions,
            "coord_x": coord_x_float,
            "coord_y": coord_y_float,
        }
    )
    model_path = DATA_PATH + "/items/" + model_name
    if os.path.exists(model_path):
        return {"status": "error", "message": "Model name already exists"}
    os.mkdir(model_path)
    pickle.dump(seq_df, open(model_path + "/unique_seq_dataframe.pkl", "wb"))

    # Upload model to database
    with open(model_path + "/VAE_model.pkl", "wb") as f:
        f.write(model)

    # upload gmm dataframe to database
    gmm_df = pd.DataFrame(
        columns=[
            "GMM_num_components",
            "GMM_seed",
            "GMM_optimal_model",
            "GMM_model_type",
        ]
    ).astype(
        {
            "GMM_num_components": "int64",
            "GMM_seed": "int64",
            "GMM_optimal_model": "object",
            "GMM_model_type": "object",
        }
    )
    gmm_df.index.name = "name"
    pickle.dump(gmm_df, open(model_path + "/best_gmm_dataframe.pkl", "wb"))

    return {
        "status": "success",
    }


@router.post("/api/upload/validate-pHMM-model")
async def validate_pHMM_model(state_dict: bytes = File(...)):
    result = _validate_pHMM_model(BytesIO(state_dict))
    if result["status"] == "error":
        return result
    else:
        return {
            "status": "success",
        }


def _validate_pHMM_model(pickle_state_dict: BytesIO) -> Dict[str, Any]:
    try:
        state_dict = CPU_Unpickler(pickle_state_dict).load()
    except:
        return {"status": "error", "message": "Not a valid pickle file"}

    try:
        motif_len = int(state_dict["decoder.emission.2.weight"].shape[0] / 4)
        embed_dim = state_dict["decoder.fc1.0.weight"].shape[1]
        model = CNN_PHMM_VAE(motif_len=motif_len, embed_size=embed_dim)
        model.load_state_dict(state_dict)
        assert embed_dim == 2
    except:
        return {"status": "error", "message": "Invalid state dict file"}

    return {
        "status": "success",
        "data": {"model": model, "motif_len": motif_len, "embed_dim": embed_dim},
    }


from sklearn.mixture import GaussianMixture


@router.post("/api/upload/validate-GMM-model")
async def validate_GMM_model(gmm_data: bytes = File(...)):
    result = _validate_GMM_model(BytesIO(gmm_data))
    if result["status"] == "error":
        return result
    else:
        gmm: GaussianMixture = result["model"]
        return {
            "status": "success",
            "data": {
                "num_components": np.array(gmm.weights_).shape[0],
                "weights": np.array(gmm.weights_).tolist(),
                "means": np.array(gmm.means_).tolist(),
                "covariances": np.array(gmm.covariances_).tolist(),
            },
        }


def _validate_GMM_model(pickle_gmm: BytesIO) -> Dict[str, Any]:
    try:
        gmm = CPU_Unpickler(pickle_gmm).load()
    except:
        return {"status": "error", "message": "Not a valid pickle file"}

    if not isinstance(gmm, GaussianMixture):
        return {"status": "error", "message": "Not a sklearn GMM file"}

    return {
        "status": "success",
        "model": gmm,
    }


from tasks import batch_encode, celery
from fastapi import Form


@router.post("/api/upload/batch-encode")
async def launch_batch_encode(
    state_dict: bytes = File(...), seqs: List[str] = Form(...)
):
    # validate seqs and model
    result = _validate_pHMM_model(BytesIO(state_dict))
    if result["status"] == "error":
        return result
    model: CNN_PHMM_VAE = result["data"]["model"]

    if len(seqs) == 1:
        seqs = [seq.strip() for seq in seqs[0].split(",")]

    # Launch celery task
    task = batch_encode.delay(seqs, state_dict)  # CNN_PHMM_VAE is not sharable
    return {
        "status": "success",
        "data": {
            "task_id": task.id,
        },
    }


@router.post("/api/upload/batch-encode/kill")
async def kill_batch_encode(task_id: str):
    task = celery.AsyncResult(task_id)
    task.revoke(terminate=True)
    return {
        "state": "success",
    }


@router.get("/api/upload/batch-encode")
async def get_batch_encode_status(task_id: str):
    task = celery.AsyncResult(task_id)
    print(task.info)
    if task.state == "PENDING":
        state = task.state
        status = "Pending..."
        result = [[]]
    elif task.state == "PROGRESS":
        info: Dict = task.info
        state = task.state
        status = f"{info['current']}, {info['total']}"
        result = info["result"].tolist()
    elif task.state == "SUCCESS":
        state = task.state
        status = "Finished successfully"
        result = task.info.tolist()
    else:
        state = task.state
        status = "Something Bad Happened"
        result = str(task.info)
    return {
        "state": state,
        "status": status,
        "result": result,
    }


@router.post("/api/upload/upload-gmm")
async def upload(
    model: bytes = File(...),
    VAE_model_name: str = Form(...),
    GMM_model_name: str = Form(...),
    seed: Optional[int] = Form(None),
    model_type: Optional[str] = Form(None),
    num_components: Optional[int] = Form(None),
):
    # validate seqs and model
    result = _validate_GMM_model(BytesIO(model))
    if result["status"] == "error":
        return result
    gmm: GaussianMixture = result["model"]

    data_df = pd.DataFrame(
        {
            "GMM_num_components": [num_components],
            "GMM_seed": [seed],
            "GMM_optimal_model": [gmm],
            "GMM_model_type": [model_type],
        }
    )
    data_df.index.name = GMM_model_name

    # upload df
    print(data_df.head(5))
    print(VAE_model_name)

    return {"status": "success"}
