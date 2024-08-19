from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Optional
import torch
from botorch.models import SingleTaskGP
from botorch.fit import fit_gpytorch_model
from botorch.acquisition import qExpectedImprovement
from botorch.optim import optimize_acqf
from gpytorch.mlls import ExactMarginalLogLikelihood


from core.db import (
    ParentJob,
    ChildJob,
    SequenceEmbeddings,
    TrainingLosses,
    SequenceData,
    PreprocessingParams,
    RaptGenParams,
    get_db_session,
)

router = APIRouter()

class OptimizationParams(BaseModel):
    method_name: str  # e.g., 'qEI'
    query_budget: List[int]  # should be a list of numbers (>1)

class DistributionParams(BaseModel):
    xlim_start: float
    xlim_end: float
    ylim_start: float
    ylim_end: float
    resolution: Optional[float] = 0.1  # optional field

class BayesOptPayload(BaseModel):
    coords_x: List[float]  # shape(l)
    coords_y: List[float]  # shape(l)
    values: List[List[float]]  # multiple objective: shape(n, l)
    optimization_params: OptimizationParams
    distribution_params: DistributionParams
class AcquisitionData(BaseModel):
    coords_x: List[float]  # list of x-coordinates
    coords_y: List[float]  # list of y-coordinates
    values: List[float]     # list of values corresponding to the acquisition function

class QueryData(BaseModel):
    coords_x: List[float]  # list of candidate x-coordinates
    coords_y: List[float]  # list of candidate y-coordinates

class BayesOptResponse(BaseModel):
    acquisition_data: AcquisitionData
    query_data: QueryData

@router.post("/api/bayesopt/run", response_model=BayesOptResponse)
async def run_bayesian_optimization(
    request: BayesOptPayload,
):
    """
    Run Bayesian optimization with the given parameters.

    Parameters
    ----------
    request : BayesOptPayload
        The payload containing optimization parameters and data.
    session : Session
        Database session (not used in this function but kept for consistency).

    Returns
    -------
    BayesOptResponse
        The response containing acquisition data and query data.
    """
    # Extract data from the request
    coords_x = torch.tensor(request.coords_x)
    coords_y = torch.tensor(request.coords_y)
    values = torch.tensor(request.values)
    method_name = request.optimization_params.method_name
    query_budget = request.optimization_params.query_budget[0]
    xlim_start = request.distribution_params.xlim_start
    xlim_end = request.distribution_params.xlim_end
    xlim_end = request.distribution_params.xlim_end
    ylim_start = request.distribution_params.ylim_start
    ylim_end = request.distribution_params.ylim_end
    resolution = request.distribution_params.resolution

    # Combine coordinates into a single tensor
    train_X = torch.stack((coords_x, coords_y), dim=-1)
    train_Y = values.mean(dim=0).unsqueeze(-1)  # Assuming single objective for simplicity

    # Fit a Gaussian Process model
    model = SingleTaskGP(train_X, train_Y)
    mll = ExactMarginalLogLikelihood(model.likelihood, model)
    fit_gpytorch_model(mll)

    # Set up the acquisition function
    if method_name == "qEI":
        acq_func = qExpectedImprovement(model, best_f=train_Y.max())
    else:
        raise ValueError(f"Unknown method name: {method_name}")

    # Define the bounds for optimization
    bounds = torch.tensor([[xlim_start, ylim_start], [xlim_end, ylim_end]])

    # Optimize the acquisition function
    candidates, _ = optimize_acqf(
        acq_function=acq_func,
        bounds=bounds,
        q=query_budget,
        num_restarts=5,
        raw_samples=20,
        sequential=True,
    )

    # Generate the acquisition data
    xn = int((xlim_end - xlim_start) / resolution)
    yn = int((ylim_end - ylim_start) / resolution)

    xv, yv = torch.meshgrid(
        torch.linspace(xlim_start, xlim_end, xn),
        torch.linspace(ylim_start, ylim_end, yn),
        indexing="xy",
    )
    xvr = xv.reshape(xn * yn, 1)
    yvr = yv.reshape(xn * yn, 1)

    # Prepare the acquisition positions
    acq_pos = torch.stack([xvr, yvr], -1)
    acq_values = acq_func(acq_pos).detach()

    # Prepare the response
    response = BayesOptResponse(
        acquisition_data={
            "coords_x": xvr[:,0].tolist(),
            "coords_y": yvr[:,0].tolist(),
            "values": acq_values.tolist(),
        },
        query_data={
            "coords_x": candidates[:, 0].tolist(),
            "coords_y": candidates[:, 1].tolist(),
        }
    )

    return response
