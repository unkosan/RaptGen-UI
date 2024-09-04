from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Optional
import torch
from botorch.models import SingleTaskGP
from botorch.fit import fit_gpytorch_model
from botorch.acquisition import qExpectedImprovement
from botorch.optim import optimize_acqf
from gpytorch.mlls import ExactMarginalLogLikelihood
from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from uuid import uuid4
import datetime

from core import db
from core.db import (
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
    resolution: Optional[float] = 0.1


class BayesOptPayload(BaseModel):
    coords_x: List[float]  # shape(l)
    coords_y: List[float]  # shape(l)
    values: List[List[float]]  # multiple objective: shape(n, l)
    optimization_params: OptimizationParams
    distribution_params: DistributionParams


class AcquisitionData(BaseModel):
    coords_x: List[float]  # list of x-coordinates
    coords_y: List[float]  # list of y-coordinates
    values: List[float]  # list of values corresponding to the acquisition function


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
    ylim_start = request.distribution_params.ylim_start
    ylim_end = request.distribution_params.ylim_end
    resolution = request.distribution_params.resolution or 0.1

    # Combine coordinates into a single tensor
    train_X = torch.stack((coords_x, coords_y), dim=-1)
    train_Y = values.mean(dim=0).unsqueeze(
        -1
    )  # Assuming single objective for simplicity

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
        acquisition_data=db.AcquisitionData(
            coords_x=xvr[:, 0].tolist(),
            coords_y=yvr[:, 0].tolist(),
            values=acq_values.tolist(),
        ),
        query_data=db.QueryData(
            coords_x=candidates[:, 0].tolist(),
            coords_y=candidates[:, 1].tolist(),
        ),
    )

    return response


class PlotConfig(BaseModel):
    minimum_count: int
    show_training_data: bool
    show_bo_contour: bool


class OptimizationConfig(BaseModel):
    method_name: str
    target_column_name: str
    query_budget: int


class RegisteredTable(BaseModel):
    #         ids: string[],
    #         sequences: string[],
    #         target_column_names: string[],
    #         target_values: number[][],
    ids: List[str]
    sequences: List[str]
    target_column_names: List[str]
    target_values: List[List[float]]


class QueryTable(BaseModel):
    #     query_data: {
    #         sequences: string[],
    #         coords_x_original: number[],
    #         coords_y_original: number[],
    #     },
    sequences: List[str]
    coords_x_original: List[float]
    coords_y_original: List[float]


class AcquisitionMesh(BaseModel):
    #     acquisition_data: {
    #         coords_x: number[],
    #         coords_y: number[],
    #         values: number[],
    #     }
    coords_x: List[float]
    coords_y: List[float]
    values: List[float]


class SubmitBayesianOptimization(BaseModel):
    # {
    #     experiment_name: string?, (null もしくは "" の時 untitled という名前がつきます）
    #     VAE_model: string,
    #     plot_config: {
    #         minimum_count: number,
    #         show_training_data: boolean,
    #         show_bo_contour: boolean
    #     },
    #     optimization_params: {
    #         method_name: string,
    #         target_column_name: string,
    #         query_budget: number,
    #     },
    #     distribution_params: {
    #         xlim_start: number,
    #         xlim_end: number,
    #         ylim_start: number,
    #         ylim_end: number
    #     },
    #     registered_table: {
    #         ids: string[],　-> value_idと対応させる
    #         sequences: string[],
    #         target_column_names: string[],
    #         target_values: number[][],
    #     },
    #     query_data: {
    #         sequences: string[],
    #         coords_x_original: number[],
    #         coords_y_original: number[],
    #     },
    #     acquisition_mesh: {
    #         coords_x: number[],
    #         coords_y: number[],
    #         values: number[],
    #     }
    # }
    experiment_name: Optional[str] = None
    VAE_model: str
    plot_config: PlotConfig
    optimization_config: OptimizationConfig
    distribution_params: DistributionParams
    registered_table: RegisteredTable
    query_table: QueryTable
    acquisition_mesh: AcquisitionMesh


@router.post("/api/bayesopt/submit")
async def submit_bayesian_optimization(
    request: SubmitBayesianOptimization,
    session: Session = Depends(get_db_session),  # Use dependency injection for session
):
    """
    Submit a Bayesian optimization job with the given parameters.

    Parameters
    ----------
    request : SubmitBayesianOptimization
        The payload containing optimization parameters and data.

    Returns
    -------
    dict
        A dictionary containing the uuid of the submitted optimization result.
    """
    # add job to DB

    # create uuid
    optimization_id = str(uuid4())

    ## add experiment to DB --->
    experiment_name = (
        request.experiment_name if request.experiment_name is not None else "untitled"
    )

    # get datetime now in integer
    last_modified = datetime.datetime.now().timestamp()

    session.add(
        db.Experiments(
            uuid=optimization_id,
            name=experiment_name,
            VAE_model=request.VAE_model,
            minimum_count=request.plot_config.minimum_count,
            show_training_data=request.plot_config.show_training_data,
            show_bo_contour=request.plot_config.show_bo_contour,
            optimization_method_name=request.optimization_config.method_name,
            target_column_name=request.optimization_config.target_column_name,
            query_budget=request.optimization_config.query_budget,
            xlim_start=request.distribution_params.xlim_start,
            xlim_end=request.distribution_params.xlim_end,
            ylim_start=request.distribution_params.ylim_start,
            ylim_end=request.distribution_params.ylim_end,
            last_modified=last_modified,
        )
    )

    ## <--- add experiment to DB

    ## add registered values to DB --->

    # get id of RegisteredValues
    registered_values_id: int = session.query(
        func.coalesce(func.max(db.RegisteredValues.id) + 1, 0).label("id_max")
    ).scalar()

    # regisger target values
    #     registered_table: {
    #         ids: string[],
    #         sequences: string[],
    #         target_column_names: string[],
    #         target_values: number[][],
    #     },

    # get id for target values

    for sequence_id, squence, column_name, target_values in zip(
        request.registered_table.ids,
        request.registered_table.sequences,
        request.registered_table.target_column_names,
        request.registered_table.target_values,
    ):
        session.add(
            db.RegisteredValues(
                id=registered_values_id,
                value_id=sequence_id,
                experiment_uuid=optimization_id,
                sequence=squence,
                target_column_name=column_name,
            )
        )

        # add target values
        for target_value in target_values:
            session.add(
                db.TargetValues(
                    registered_values_id=registered_values_id,
                    value=target_value,
                )
            )

        registered_values_id += 1

    ## <--- add registered values to DB

    ## add query data to DB --->

    for sequence, x, y in zip(
        request.query_table.sequences,
        request.query_table.coords_x_original,
        request.query_table.coords_y_original,
    ):
        session.add(
            db.QueryData(
                experiment_uuid=optimization_id,
                sequence=sequence,
                coord_x_original=x,
                coord_y_original=y,
            )
        )

    ## <--- add query data to DB

    ## add acquisition data to DB --->

    for x, y, value in zip(
        request.acquisition_mesh.coords_x,
        request.acquisition_mesh.coords_y,
        request.acquisition_mesh.values,
    ):
        session.add(
            db.AcquisitionData(
                experiment_uuid=optimization_id,
                coord_x=x,
                coord_y=y,
                value=value,
            )
        )

    session.commit()

    return {"uuid": optimization_id}
