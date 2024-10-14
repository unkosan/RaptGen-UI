from typing import Dict, List
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
from pydantic import BaseModel
import pickle
import torch
import numpy as np
from uuid import uuid4
import matplotlib.pyplot as plt
from io import BytesIO
import tempfile
import subprocess
from core.db import (
    ViewerVAE,
    get_db_session,
)
from core.algorithms import (
    CNN_PHMM_VAE,
    embed_sequences,
    get_most_probable_seq,
    draw_logo,
)

router = APIRouter()


class CPU_Unpickler(pickle.Unpickler):
    def find_class(self, module, name):
        if module == "torch.storage" and name == "_load_from_bytes":
            return lambda b: torch.load(BytesIO(b), map_location="cpu")
        else:
            return super().find_class(module, name)


sessions: Dict[str, CNN_PHMM_VAE] = dict()


class RequestCoordinates(BaseModel):
    session_uuid: str
    coords_x: List[float]
    coords_y: List[float]


class RequestSequences(BaseModel):
    session_uuid: str
    sequences: List[str]


@router.get("/api/session/start")
def start_session(
    vae_uuid: str,
    session: Session = Depends(get_db_session),
):
    # if VAE_name is empty, return an error
    vae_profile = session.query(ViewerVAE).where(ViewerVAE.uuid == vae_uuid).first()
    if vae_profile is None:
        raise HTTPException(status_code=404, detail="Item not found")

    # session id is a random number from 1000000 to 9999999
    global sessions
    while True:
        session_uuid: str = str(uuid4())
        if session_uuid not in sessions:
            break

    # construct model
    checkpoints_bytes: bytes = vae_profile.checkpoint  # type: ignore
    # with BytesIO(checkpoints_bytes) as f:
    #     state_dict = CPU_Unpickler(f).load()
    with BytesIO(checkpoints_bytes) as f:
        checkpoint = torch.load(f, map_location="cpu")
        model = CNN_PHMM_VAE(
            embed_size=2,
            motif_len=vae_profile.phmm_length,  # type: ignore
        )
        model.load_state_dict(checkpoint["model"])
    model.eval()

    # save model
    sessions[session_uuid] = model

    return {
        "uuid": session_uuid,
    }


@router.get("/api/session/end")
def end_session(session_uuid: str):
    popped = sessions.pop(session_uuid, None)

    if popped is None:
        raise HTTPException(status_code=404, detail="Item not found")

    return None


@router.post("/api/session/encode")
async def encode(request: RequestSequences):
    global sessions
    if request.session_uuid not in sessions.keys():
        raise HTTPException(status_code=404, detail="Item not found")

    if not len(request.sequences) > 0:
        raise HTTPException(status_code=400, detail="Invalid input")

    model = sessions[request.session_uuid]
    coords = embed_sequences(request.sequences, model)

    return {
        "coords_x": [float(coord[0]) for coord in coords],
        "coords_y": [float(coord[1]) for coord in coords],
    }


@router.post("/api/session/decode")
async def decode(request: RequestCoordinates):
    global sessions
    if request.session_uuid not in sessions.keys():
        raise HTTPException(status_code=404, detail="Item not found")

    if not len(request.coords_x) > 0 or not len(request.coords_y) > 0:
        raise HTTPException(status_code=400, detail="Invalid input")
    if not len(request.coords_x) == len(request.coords_y):
        raise HTTPException(status_code=400, detail="Invalid input")

    coords = np.array([request.coords_x, request.coords_y]).T

    model = sessions[request.session_uuid]
    seqs, _ = get_most_probable_seq(coords=list(coords), model=model)

    return {
        "sequences": seqs,
    }


@router.get("/api/session/status")
def get_session_status():
    global sessions
    return {
        "entries": list(sessions.keys()),
    }


@router.post(
    "/api/session/decode/weblogo",
    responses={200: {"content": {"image/png": {}}}},
    response_class=Response,
)
async def get_weblogo(request: RequestCoordinates):
    if request.session_uuid not in sessions.keys():
        raise HTTPException(status_code=404, detail="Item not found")

    if not len(request.coords_x) == 1 or not len(request.coords_y) == 1:
        raise HTTPException(status_code=400, detail="Invalid input")

    model = sessions[request.session_uuid]

    fig, ax = plt.subplots(1, 1, figsize=(10, 3), dpi=120)
    draw_logo(
        ax=ax,
        coord=np.array([request.coords_x[0], request.coords_y[0]]),
        model=model,
    )
    bytes_io = BytesIO()
    fig.savefig(bytes_io, format="png")
    bytes_io.seek(0)
    figdata = bytes_io.read()
    return Response(
        content=figdata,
        media_type="image/png",
    )


@router.get(
    "/api/tool/secondary-structure",
    responses={200: {"content": {"image/png": {}}}},
    response_class=Response,
)
async def get_secondary_structure(sequence: str):
    with tempfile.NamedTemporaryFile(
        "w+", suffix=".fasta"
    ) as tempf_fasta, tempfile.NamedTemporaryFile(
        "w+", suffix=".ps"
    ) as tempf_ps, tempfile.NamedTemporaryFile(
        "w+b", suffix=".png"
    ) as tempf_png:
        tempf_fasta.write(f">\n{sequence}")
        tempf_fasta.flush()
        subprocess.run(
            ["centroid_fold", tempf_fasta.name, "--postscript", tempf_ps.name],
            stdout=subprocess.PIPE,
        )
        subprocess.run(
            ["gs", "-o", tempf_png.name, "-sDEVICE=pngalpha", tempf_ps.name],
            stdout=subprocess.PIPE,
        )
        # encoded_ss = base64.b64encode(tempf_png.read())
        figdata: bytes = tempf_png.read()
    return Response(
        content=figdata,
        media_type="image/png",
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(router, host="0.0.0.0", port=7000, reload=True)
