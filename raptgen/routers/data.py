from fastapi import APIRouter

router = APIRouter()

import os
from sklearn.mixture import GaussianMixture
import pandas as pd

# DATA_PATH = "/app/local/down/data/"
DATA_PATH = "/app/data/"


@router.get("/api/data/VAE-model-names")
async def get_VAE_model_names():
    df = pd.read_pickle(DATA_PATH + "/profile_dataframe.pkl")
    return {"status": "success", "data": df.index.tolist()}


@router.get("/api/data/GMM-model-names")
async def get_GMM_models_names(VAE_model_name: str):
    if VAE_model_name == "":
        return {"status": "error"}

    df = pd.read_pickle(
        DATA_PATH + "items/" + VAE_model_name + "/best_gmm_dataframe.pkl"
    )
    return {
        "status": "success",
        "data": df.index.tolist(),
    }


@router.get("/api/data/GMM-model")
async def get_GMM_model_parameters(
    VAE_model_name: str,
    GMM_model_name: str,
):
    if VAE_model_name == "":
        return {"status": "error"}
    if GMM_model_name == "":
        return {"status": "error"}

    df = pd.read_pickle(
        DATA_PATH + "items/" + VAE_model_name + "/best_gmm_dataframe.pkl"
    )
    model: GaussianMixture = df.loc[GMM_model_name, "GMM_optimal_model"]

    return {
        "status": "success",
        "data": {
            "weights": model.weights_.tolist(),
            "means": model.means_.tolist(),
            "covariances": model.covariances_.tolist(),
        },
    }


@router.get("/api/data/selex-data")
async def get_selex_data(VAE_model_name: str):
    if VAE_model_name == "":
        return {"status": "error"}

    df = pd.read_pickle(
        DATA_PATH + "items/" + VAE_model_name + "/unique_seq_dataframe.pkl"
    )
    df = df[["Sequence", "Duplicates", "Without_Adapters", "coord_x", "coord_y"]]
    return {
        "status": "success",
        "data": df.to_dict(orient="list"),
    }


@router.get("/api/data/measured-data-names")
async def get_measured_data_names():
    names = os.listdir(DATA_PATH + "measured_values/")
    return {
        "status": "success",
        "data": names,
    }


@router.get("/api/data/measured-data")
async def get_measured_data(measured_data_name: str):
    if measured_data_name == "":
        return {"status": "error"}

    df = pd.read_csv(DATA_PATH + "measured_values/" + measured_data_name)
    subset_df = df[["hue", "ID", "Sequence"]]
    return {"status": "success", "data": subset_df.to_dict(orient="list")}


@router.get("/api/data/GMM-model-parameters")
async def get_GMM_model_config(
    VAE_model_name: str,
    GMM_model_name: str,
):
    if VAE_model_name == "":
        return {"status": "error"}
    if GMM_model_name == "":
        return {"status": "error"}

    df = pd.read_pickle(
        DATA_PATH + "items/" + VAE_model_name + "/best_gmm_dataframe.pkl"
    )
    params: pd.Series = df.loc[GMM_model_name].drop("GMM_optimal_model")
    return {
        "status": "success",
        "data": params.to_dict(),
    }


@router.get("/api/data/VAE-model-parameters")
async def get_VAE_model_config(VAE_model_name: str):
    if VAE_model_name == "":
        return {"status": "error"}

    df = pd.read_pickle(DATA_PATH + "/profile_dataframe.pkl")
    params: pd.Series = df.loc[VAE_model_name]
    return {
        "status": "success",
        "data": params.to_dict(),
    }
