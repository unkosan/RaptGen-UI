from celery import Celery, current_task, Task
from typing import List, Tuple, Dict, Any, OrderedDict, Optional
from core.algorithms import CNN_PHMM_VAE, embed_sequences

import time
import numpy as np
import pickle
import torch
from io import BytesIO


class CPU_Unpickler(pickle.Unpickler):
    def find_class(self, module, name):
        if module == "torch.storage" and name == "_load_from_bytes":
            return lambda b: torch.load(BytesIO(b), map_location="cpu")
        else:
            return super().find_class(module, name)


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


celery = Celery(
    __name__,
    broker="redis://redis:6379/0",
    backend="redis://redis:6379/0",
)

celery.conf.update(
    task_serializer="pickle",
    result_serializer="pickle",
    accept_content=["json", "pickle"],
)


@celery.task(bind=True)
def batch_encode(self: Task, seqs: List[str], state_dict_pkl: bytes):
    res = _validate_pHMM_model(BytesIO(state_dict_pkl))
    model = res["data"]["model"]
    self.update_state(
        state="PROGRESS",
        meta={
            "current": 0,
            "total": len(seqs),
        },
    )
    coord_list = []

    count: int = 0
    chunk_size = len(seqs) // 100

    while count < len(seqs):
        chunk = seqs[count : count + chunk_size]
        arr = embed_sequences(chunk, model)
        coord_list = coord_list + list(arr)
        self.update_state(
            state="PROGRESS",
            meta={
                "current": count + chunk_size,
                "total": len(seqs),
                "result": np.array([[]]),
            },
        )

        count = count + chunk_size

    return np.array(coord_list)
