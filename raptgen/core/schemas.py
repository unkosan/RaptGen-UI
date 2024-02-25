from pydantic import BaseModel, Field
from typing import List, Union, Dict, Literal, Any


class PreprocessingParams(BaseModel):
    forward: str
    reverse: str
    random_region_length: int
    tolerance: int
    minimum_count: int


class RaptGenTrainingParams(BaseModel):
    model_length: int
    epochs: int
    match_forcing_duration: int
    beta_duration: int
    early_stopping: int
    seed_value: int
    match_cost: int
    device: str


class BaseRaptGenModel(BaseModel):
    type: str
    name: str
    params_preprocessing: PreprocessingParams
    random_regions: List[str]
    duplicates: List[int]
    reiteration: int


class RaptGenModel(BaseRaptGenModel):
    type: Literal["RaptGen"]
    params_training: RaptGenTrainingParams


class RaptGenFreqModel(BaseRaptGenModel):
    type: Literal["RaptGen-freq", "RaptGen-logfreq"]
    params_training: Dict[str, Any]  # allowing any key with any value
