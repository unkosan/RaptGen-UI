from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
import numpy as np

router = APIRouter()

import os
from sklearn.mixture import GaussianMixture
import pandas as pd
from core.db import (
    ViewerProfiles,
    ViewerGMM,
    ViewerSequenceEmbeddings,
    get_db_session,
)

DATA_PATH = "/app/data/"


@router.get("/api/data/VAE-model-names")
async def get_VAE_model_names(
    session: Session = Depends(get_db_session),
):
    result = session.query(ViewerProfiles).all()
    data = [
        {
            "name": item.name,
            "uuid": item.uuid,
        }
        for item in result
    ]

    return {
        "status": "success",
        "data": data,
    }


@router.get("/api/data/GMM-model-names")
# async def get_GMM_models_names(VAE_model_name: str):
async def get_GMM_models_names(
    vae_uuid: str,
    session: Session = Depends(get_db_session),
):
    result = session.query(ViewerGMM).where(ViewerGMM.profile_uuid == vae_uuid).all()
    data = [
        {
            "name": item.name,
            "uuid": item.uuid,
        }
        for item in result
    ]

    return {
        "status": "success",
        "data": data,
    }


@router.get("/api/data/GMM-model")
async def get_GMM_model_parameters(
    gmm_uuid: str,
    session: Session = Depends(get_db_session),
):
    result = session.query(ViewerGMM).where(ViewerGMM.uuid == gmm_uuid).first()
    if result is None:
        return {"status": "error"}

    means = np.array(result.means).tolist()
    covariances = np.array(result.covariances).tolist()

    return {
        "status": "success",
        "data": {
            "means": means,
            "covariances": covariances,
        },
    }


@router.get("/api/data/selex-data")
async def get_selex_data(
    vae_uuid: str,
    session: Session = Depends(get_db_session),
):
    result = (
        session.query(ViewerSequenceEmbeddings)
        .where(ViewerSequenceEmbeddings.profile_uuid == vae_uuid)
        .all()
    )
    if len(result) == 0:
        return {"status": "error"}

    data = {
        "random_regions": [item.random_region for item in result],
        "duplicates": [item.duplicate for item in result],
        "coord_x": [item.coord_x for item in result],
        "coord_y": [item.coord_y for item in result],
    }

    return {
        "status": "success",
        "data": data,
    }


# measured data system is not used as of now
# @router.get("/api/data/measured-data-names")
# async def get_measured_data_names():
#     names = os.listdir(DATA_PATH + "measured_values/")
#     return {
#         "status": "success",
#         "data": names,
#     }


# @router.get("/api/data/measured-data")
# async def get_measured_data(measured_data_name: str):
#     if measured_data_name == "":
#         return {"status": "error"}

#     df = pd.read_csv(DATA_PATH + "measured_values/" + measured_data_name)
#     subset_df = df[["hue", "ID", "Sequence"]]
#     return {"status": "success", "data": subset_df.to_dict(orient="list")}


@router.get("/api/data/GMM-model-parameters")
async def get_GMM_model_config(
    gmm_uuid: str,
    session: Session = Depends(get_db_session),
):
    result = session.query(ViewerGMM).where(ViewerGMM.uuid == gmm_uuid).first()
    if result is None:
        return {"status": "error"}

    data = {
        "name": result.name,
        "seed": result.seed,
        "n_components": result.n_components,
    }

    return {
        "status": "success",
        "data": data,
    }


@router.get("/api/data/VAE-model-parameters")
async def get_VAE_model_config(
    vae_uuid: str,
    session: Session = Depends(get_db_session),
):
    result = (
        session.query(ViewerProfiles).where(ViewerProfiles.uuid == vae_uuid).first()
    )
    if result is None:
        return {"status": "error"}

    data = {
        # metadata
        "created_at": result.create_timestamp,
        "name": result.name,
        "device": result.device,
        "seed": result.seed,
        # preprocessing
        "forward_adapter": result.forward_adapter,
        "reverse_adapter": result.reverse_adapter,
        "random_region_length_standard": result.random_region_length_standard,
        "random_region_length_tolerance": result.random_region_length_tolerance,
        "minimum_count": result.minimum_count,
        # training
        "epochs": result.epochs,
        "epochs_beta_weighting": result.epochs_beta_weighting,
        "epochs_match_forcing": result.epochs_match_forcing,
        "epochs_early_stopping": result.epochs_early_stopping,
        "match_cost": result.match_cost,
        "phmm_length": result.phmm_length,
    }

    return {
        "status": "success",
        "data": data,
    }
