from fastapi import APIRouter
router = APIRouter()

import os
import random
import pickle
import torch
import io
import numpy as np
import pandas as pd
from typing import Dict, List, Tuple
from pydantic import BaseModel

from core.algorithms import CNN_PHMM_VAE, embed_sequences, get_most_probable_seq, draw_logo

class CPU_Unpickler(pickle.Unpickler):
    def find_class(self, module, name):
        if module == 'torch.storage' and name == '_load_from_bytes':
            return lambda b: torch.load(io.BytesIO(b), map_location='cpu')
        else: return super().find_class(module, name)

sessions: Dict[int, CNN_PHMM_VAE] = dict()
DATA_PATH = "/app/local/down/data/"

class Coords(BaseModel):
    coord_x: float
    coord_y: float

class CoordsData(BaseModel):
    session_id: int
    coords: List[Coords]

class SeqsData(BaseModel):
    session_id: int
    sequences: List[str]

@router.post("/api/session/encode/no-id-test")
async def noid_encode(seqs_data: SeqsData):
    seqs_dict = seqs_data.dict()
    seqs: List[str] = seqs_dict["data"]

    vae_list = os.listdir(DATA_PATH + "items/")
    vae_name = vae_list[0]

    df = pd.read_pickle(DATA_PATH + "/profile_dataframe.pkl")
    model_len = df.loc[vae_name, "pHMM_VAE_model_length"]
    
    with open(DATA_PATH + "items/" + vae_list[0] + "/VAE_model.pkl", "rb") as f:
        state_dict = CPU_Unpickler(f).load()
    
    model = CNN_PHMM_VAE(embed_size=2, motif_len=model_len)
    model.load_state_dict(state_dict)
    model.eval()

    coords = embed_sequences(seqs, model)
    
    return {
        "status": "success",
        "data": [
            { "coord_x": float(coord[0]), "coord_y": float(coord[1]) }
            for coord in coords
        ],
    }

@router.post("/api/session/decode/no-id-test")
async def noid_decode(coords_data: CoordsData):
    coords_dict = coords_data.dict()
    coords_list = [
        [coord["coord_x"], coord["coord_y"]]
        for coord in coords_dict["data"]
    ]
    coords = np.array(coords_list)

    vae_list = os.listdir(DATA_PATH + "items/")
    vae_name = vae_list[0]

    df = pd.read_pickle(DATA_PATH + "/profile_dataframe.pkl")
    model_len = df.loc[vae_name, "pHMM_VAE_model_length"]
    
    with open(DATA_PATH + "items/" + vae_list[0] + "/VAE_model.pkl", "rb") as f:
        state_dict = CPU_Unpickler(f).load()
    
    model = CNN_PHMM_VAE(embed_size=2, motif_len=model_len)
    model.load_state_dict(state_dict)
    model.eval()

    seqs, _ = get_most_probable_seq(
        coords = list(coords),
        model = model
    ) 

    return {
        "status": "success",
        "data": seqs,
    }



@router.get("/api/session/start")
def start_session(VAE_name: str = ""):
    # if VAE_name is empty, return an error
    if VAE_name == "":
        return {
            "status": "error",
            "session_id": 0
        }

    # session id is a random number from 1000000 to 9999999
    global sessions
    session_id: int
    while True:
        session_id = random.randint(1000000, 9999999)
        if session_id not in sessions:
            break
    
    # construct model
    with open(DATA_PATH + "items/" + VAE_name + "/VAE_model.pkl", "rb") as f:
        state_dict = CPU_Unpickler(f).load()
    model_len = int(state_dict['decoder.emission.2.weight'].shape[0] / 4)
    model = CNN_PHMM_VAE(embed_size=2, motif_len=model_len)
    model.load_state_dict(state_dict)
    model.eval()

    # save model
    sessions[session_id] = model

    return {
        "status": "success",
        "data": session_id
    }

@router.get("/api/session/end")
def end_session(session_id: int = 0):
    if session_id == 0:
        return {
            "status": "error"
        }
    else:
        global sessions
        if session_id in sessions.keys():
            del sessions[session_id]
            return {
                "status": "success"
            }
        else:
            return {
                "status": "error"
            }

@router.post("/api/session/encode")
async def encode(seqs_data: SeqsData):
    seqs_dict = seqs_data.dict()
    seqs: List[str] = seqs_dict["sequences"]
    session_ID: int = seqs_dict["session_id"]

    if session_ID == 0:
        return {
            "status": "error"
        }

    global sessions
    if not session_ID in sessions.keys() or not len(seqs) > 0:
        return {
            "status": "error"
        }

    model = sessions[session_ID]
    coords = embed_sequences(seqs, model)

    return {
        "status": "success",
        "data": [
            { "coord_x": float(coord[0]), "coord_y": float(coord[1]) }
            for coord in coords
        ],
    }

@router.post("/api/session/decode")
async def decode(coords_data: CoordsData):
    coords_dict = coords_data.dict()
    coords_list = [
        [coord["coord_x"], coord["coord_y"]]
        for coord in coords_dict["coords"]
    ]
    coords = np.array(coords_list)
    
    session_ID: int = coords_dict["session_id"]

    if session_ID == 0:
        return {
            "status": "error"
        }

    global sessions
    if not session_ID in sessions.keys() or not len(coords) > 0:
        return {
            "status": "error"
        }

    model = sessions[session_ID]
    seqs, _ = get_most_probable_seq(
        coords = list(coords),
        model = model
    )

    return {
        "status": "success",
        "data": seqs,
    }

@router.get("/api/session/status")
def get_session_status():
    global sessions
    return {
        "status": "success",
        "data": list(sessions.keys())
    }
from fastapi.responses import Response
import matplotlib.pyplot as plt
from io import BytesIO
import tempfile
import subprocess

@router.post(
    "/api/session/decode/weblogo",
    responses = {
        200: { "content": {"image/png": {}} }
    },
    response_class=Response
)
async def get_weblogo(coords_data: CoordsData):
    coords_dict = coords_data.dict()
    coord = np.array([
        coords_dict["data"][0]["coord_x"],
        coords_dict["data"][0]["coord_y"]
    ])
    session_id = coords_data.session_id
    model = sessions[session_id]

    fig, ax = plt.subplots(1,1,figsize=(10,3), dpi=120)
    draw_logo(
        ax = ax,
        coord = coord,
        model = model,
    )
    bytes_io = BytesIO()
    fig.savefig(bytes_io, format="png")
    figdata = bytes_io.read()
    return Response(
        content = figdata,
        media_type = "image/png",
    )
    
@router.get(
    "/api/tool/second-structure",
    responses = {
        200: { "content": {"image/png": {}} }
    },
    response_class=Response
)
def get_secondary_structure(sequence: str):
    with tempfile.NamedTemporaryFile("w+", suffix=".fasta") as tempf_fasta, \
         tempfile.NamedTemporaryFile("w+", suffix=".ps") as tempf_ps, \
         tempfile.NamedTemporaryFile("w+b", suffix=".png") as tempf_png:
        tempf_fasta.write(f">\n{sequence}")
        tempf_fasta.flush()
        subprocess.run(["centroid_fold", tempf_fasta.name, "--postscript", tempf_ps.name], stdout=subprocess.PIPE)
        subprocess.run(["gs", "-o", tempf_png.name, "-sDEVICE=pngalpha", tempf_ps.name], stdout=subprocess.PIPE)
        # encoded_ss = base64.b64encode(tempf_png.read())
        figdata: bytes = tempf_png.read()
    return Response(
        content = figdata,
        media_type = "image/png",
    )
    
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(router, host="0.0.0.0", port=7000, reload=True)