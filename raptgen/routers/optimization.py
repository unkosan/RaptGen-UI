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

class BayesOptPayload(BaseModel):
    coords_x: List[float]
    coords_y: List[float]
    values: List[List[float]]
    optimization_params: dict
    distribution_params: dict

class BayesOptResponse(BaseModel):
    acquisition_data: dict
    query_data: dict

@router.post("/api/bayesopt/run", response_model=BayesOptResponse)
async def run_bayesian_optimization(
    request: BayesOptPayload,
    session: Session = Depends(get_db_session)
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
    method_name = request.optimization_params['method_name']
    query_budget = request.optimization_params['query_budget'][0]
    xlim_start = request.distribution_params['xlim_start']
    xlim_end = request.distribution_params['xlim_end']
    ylim_start = request.distribution_params['ylim_start']
    ylim_end = request.distribution_params['ylim_end']
    resolution = request.distribution_params.get('resolution', 0.1)

    # Combine coordinates into a single tensor
    train_X = torch.stack((coords_x, coords_y), dim=-1)
    train_Y = values.mean(dim=0).unsqueeze(-1)  # Assuming single objective for simplicity

    # Fit a Gaussian Process model
    model = SingleTaskGP(train_X, train_Y)
    mll = ExactMarginalLogLikelihood(model.likelihood, model)
    fit_gpytorch_model(mll)

    # Set up the acquisition function
    acq_func = qExpectedImprovement(model, best_f=train_Y.max())

    # Define the bounds for optimization
    bounds = torch.tensor([[xlim_start, ylim_start], [xlim_end, ylim_end]])

    # Optimize the acquisition function
    candidates, _ = optimize_acqf(
        acq_function=acq_func,
        bounds=bounds,
        q=query_budget,
        num_restarts=5,
        raw_samples=20,
    )

    # Calculate acquisition function values for the candidates
    acq_values = acq_func(candidates)

    # Prepare the response
    response = BayesOptResponse(
        acquisition_data={
            "coords_x": candidates[:, 0].tolist(),
            "coords_y": candidates[:, 1].tolist(),
            "values": acq_values.tolist(),
        },
        query_data={
            "coords_x": candidates[:, 0].tolist(),
            "coords_y": candidates[:, 1].tolist(),
        }
    )

    return response
