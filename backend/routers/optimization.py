from collections import defaultdict
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Union
import torch
from botorch.models import SingleTaskGP
from botorch.fit import fit_gpytorch_model
from botorch.acquisition import qExpectedImprovement
from botorch.optim import optimize_acqf
from gpytorch.mlls import ExactMarginalLogLikelihood
from sqlalchemy.orm import Session
from sqlalchemy import func

from uuid import uuid4
import datetime

from core import db
from core.db import (
    get_db_session,
)

router = APIRouter()


class OptimizationArgs(BaseModel):
    method_name: str  # e.g., 'qEI'
    query_budget: int  # (>1)


class DistributionArgs(BaseModel):
    xlim_min: float
    xlim_max: float
    ylim_min: float
    ylim_max: float
    resolution: Optional[float] = 0.1


class DistributionConfig(BaseModel):
    xlim_min: float
    xlim_max: float
    ylim_min: float
    ylim_max: float


class BayesOptPayload(BaseModel):
    coords_x: List[float]  # shape(l)
    coords_y: List[float]  # shape(l)
    values: List[List[float]]  # multiple objective: shape(n, l)
    optimization_args: OptimizationArgs
    distribution_args: DistributionArgs


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
    method_name = request.optimization_args.method_name
    query_budget = request.optimization_args.query_budget
    xlim_min = request.distribution_args.xlim_min
    xlim_max = request.distribution_args.xlim_max
    ylim_min = request.distribution_args.ylim_min
    ylim_max = request.distribution_args.ylim_max
    resolution = request.distribution_args.resolution or 0.1

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
    bounds = torch.tensor([[xlim_min, ylim_min], [xlim_max, ylim_max]])

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
    xn = int((xlim_max - xlim_min) / resolution)
    yn = int((ylim_max - ylim_min) / resolution)

    xv, yv = torch.meshgrid(
        torch.linspace(xlim_min, xlim_max, xn),
        torch.linspace(ylim_min, ylim_max, yn),
        indexing="xy",
    )
    xvr = xv.reshape(xn * yn, 1)
    yvr = yv.reshape(xn * yn, 1)

    # Prepare the acquisition positions
    acq_pos = torch.stack([xvr, yvr], -1)
    acq_values = acq_func(acq_pos).detach()

    # Prepare the response
    response = BayesOptResponse(
        acquisition_data=AcquisitionData(
            coords_x=xvr[:, 0].tolist(),
            coords_y=yvr[:, 0].tolist(),
            values=acq_values.tolist(),
        ),
        query_data=QueryData(
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


class RegisteredValuesTable(BaseModel):
    #         ids: string[],
    #         sequences: string[],
    #         target_column_names: string[],
    #         target_values: (number | null)[][],
    ids: List[str]
    sequences: List[str]
    target_column_names: List[str]
    target_values: List[List[Union[float, None]]]


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
    #     VAE_uuid: string,
    #     plot_config: {
    #         minimum_count: number,
    #         show_training_data: boolean,
    #         show_bo_contour: boolean
    #     },
    #     optimization_args: {
    #         method_name: string,
    #         target_column_name: string,
    #         query_budget: number,
    #     },
    #     distribution_config: {
    #         xlim_min: number,
    #         xlim_max: number,
    #         ylim_min: number,
    #         ylim_max: number
    #     },
    #     registered_values_table: {
    #         ids: string[],　-> value_idと対応させる
    #         sequences: string[],
    #         target_column_names: string[],
    #         target_values: (number | null)[][],
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
    VAE_uuid: str
    plot_config: PlotConfig
    optimization_config: OptimizationConfig
    distribution_config: DistributionConfig
    registered_values_table: RegisteredValuesTable
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
            VAE_uuid=request.VAE_uuid,
            minimum_count=request.plot_config.minimum_count,
            show_training_data=request.plot_config.show_training_data,
            show_bo_contour=request.plot_config.show_bo_contour,
            optimization_method_name=request.optimization_config.method_name,
            target_column_name=request.optimization_config.target_column_name,
            query_budget=request.optimization_config.query_budget,
            xlim_min=request.distribution_config.xlim_min,
            xlim_max=request.distribution_config.xlim_max,
            ylim_min=request.distribution_config.ylim_min,
            ylim_max=request.distribution_config.ylim_max,
            last_modified=last_modified,
        )
    )

    ## <--- add experiment to DB

    ## add registered values to DB --->

    # get id of RegisteredValues
    registered_values_id: int = session.query(
        func.coalesce(func.max(db.RegisteredValues.id) + 1, 0)
    ).scalar()
    registered_values_ids = []
    # regisger target values
    #     registered_values_table: {
    #         ids: string[],
    #         sequences: string[],
    #         target_column_names: string[],
    #         target_values: number[][],
    #     },

    # get id for target values

    for sequence_id, squence in zip(
        request.registered_values_table.ids,
        request.registered_values_table.sequences,
    ):
        registered_values_ids.append(registered_values_id)
        session.add(
            db.RegisteredValues(
                id=registered_values_id,
                experiment_uuid=optimization_id,
                value_id=sequence_id,
                sequence=squence,
            )
        )
        registered_values_id += 1

    # get id for target columns
    target_column_id: int = session.query(
        func.coalesce(func.max(db.TargetColumns.id) + 1, 0)
    ).scalar()
    target_column_ids = []

    for column_name in request.registered_values_table.target_column_names:
        target_column_ids.append(target_column_id)
        session.add(
            db.TargetColumns(
                id=target_column_id,
                experiment_uuid=optimization_id,
                column_name=column_name,
            )
        )
        target_column_id += 1

    # add target_values
    for tc_i, target_column_id in enumerate(target_column_ids):
        for rv_i, registered_values_id in enumerate(registered_values_ids):
            session.add(
                db.TargetValues(
                    experiment_uuid=optimization_id,
                    registered_values_id=registered_values_id,
                    target_column_id=target_column_id,
                    value=request.registered_values_table.target_values[rv_i][tc_i],
                )
            )

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


@router.get("/api/bayesopt/items")
async def get_experiment_items(
    session: Session = Depends(get_db_session),
):
    # get all experiment
    experiments = session.query(db.Experiments).all()

    # return uuids, names, and last_modified
    return [
        {
            "uuid": experiment.uuid,
            "name": experiment.name,
            "last_modified": experiment.last_modified,
        }
        for experiment in experiments
    ]


class ExperimentItem(BaseModel):
    experiment_name: str
    VAE_uuid: str
    VAE_name: str
    plot_config: PlotConfig
    optimization_config: OptimizationConfig
    distribution_config: DistributionConfig
    registered_values_table: RegisteredValuesTable
    query_table: QueryTable
    acquisition_mesh: AcquisitionMesh


@router.get("/api/bayesopt/items/{experiment_uuid}", response_model=ExperimentItem)
async def get_experiment_item(
    experiment_uuid: str,
    session: Session = Depends(get_db_session),
):
    # get experiment
    experiment = (
        session.query(db.Experiments)
        .filter(db.Experiments.uuid == experiment_uuid)
        .one_or_none()
    )
    if experiment is None:
        raise HTTPException(
            status_code=404, detail=f"Experiment with uuid {experiment_uuid} not found"
        )

    # get registered values
    registered_values = (
        session.query(db.RegisteredValues)
        .filter(db.RegisteredValues.experiment_uuid == experiment_uuid)
        .order_by(db.RegisteredValues.id)
        .all()
    )

    # get target columns
    target_columns = (
        session.query(db.TargetColumns)
        .filter(db.TargetColumns.experiment_uuid == experiment_uuid)
        # sort by id
        .order_by(db.TargetColumns.id)
        .all()
    )

    # get target values
    target_values = (
        session.query(db.TargetValues)
        .filter(db.TargetValues.experiment_uuid == experiment_uuid)
        .order_by(db.TargetValues.id)
        .all()
    )

    # create a List[List[float]] from the query result
    # the outer list is for each target column id,
    # and the inner list is for each registered value id
    d = defaultdict(dict)
    for tv in target_values:
        d[tv.registered_values_id][tv.target_column_id] = tv.value
    target_values_out = [
        [d[rv.id][tc.id] for tc in target_columns] for rv in registered_values
    ]

    # get query data
    query_data = experiment.query_data

    # get acquisition data
    acquisition_data = experiment.acquisition_data

    session.commit()

    # get VAE_name
    vae_entry = (
        session.query(db.ViewerVAE)
        .filter(db.ViewerVAE.uuid == experiment.VAE_uuid)
        .first()
    )
    if vae_entry is None:
        raise HTTPException(
            status_code=404, detail=f"Item not found: {experiment.VAE_uuid}"
        )

    return ExperimentItem(
        experiment_name=experiment.name,  # type: ignore
        VAE_uuid=experiment.VAE_uuid,  # type: ignore
        VAE_name=vae_entry.name,  # type: ignore
        plot_config=PlotConfig(
            minimum_count=experiment.minimum_count,  # type: ignore
            show_training_data=experiment.show_training_data,  # type: ignore
            show_bo_contour=experiment.show_bo_contour,  # type: ignore
        ),
        optimization_config=OptimizationConfig(
            method_name=experiment.optimization_method_name.value,  # type: ignore
            target_column_name=experiment.target_column_name,  # type: ignore
            query_budget=experiment.query_budget,  # type: ignore
        ),
        distribution_config=DistributionConfig(
            xlim_min=experiment.xlim_min,  # type: ignore
            xlim_max=experiment.xlim_max,  # type: ignore
            ylim_min=experiment.ylim_min,  # type: ignore
            ylim_max=experiment.ylim_max,  # type: ignore
        ),
        registered_values_table=RegisteredValuesTable(
            ids=[rv.value_id for rv in registered_values],  # type: ignore
            sequences=[rv.sequence for rv in registered_values],  # type: ignore
            target_column_names=[tc.column_name for tc in target_columns],  # type: ignore
            target_values=target_values_out,  # type: ignore
        ),
        query_table=QueryTable(
            sequences=[qd.sequence for qd in query_data],  # type: ignore
            coords_x_original=[qd.coord_x_original for qd in query_data],  # type: ignore # type: ignore
            coords_y_original=[qd.coord_y_original for qd in query_data],  # type: ignore
        ),
        acquisition_mesh=AcquisitionMesh(
            coords_x=[ad.coord_x for ad in acquisition_data],  # type: ignore
            coords_y=[ad.coord_y for ad in acquisition_data],  # type: ignore
            values=[ad.value for ad in acquisition_data],  # type: ignore
        ),
    )


@router.put("/api/bayesopt/items/{experiment_uuid}")
async def update_experiment_item(
    experiment_uuid: str,
    request: SubmitBayesianOptimization,
    session: Session = Depends(get_db_session),
):
    # check if the experiment uuid exists
    if (
        session.query(db.Experiments)
        .filter(db.Experiments.uuid == experiment_uuid)
        .one_or_none()
        is None
    ):
        raise HTTPException(
            status_code=404, detail=f"Experiment with uuid {experiment_uuid} not found"
        )

    # call delete API then call submit API
    await delete_experiment_item(experiment_uuid, session)
    response = await submit_bayesian_optimization(request, session)

    new_uuid = response["uuid"]

    # Update Experiments
    session.query(db.Experiments).filter(db.Experiments.uuid == new_uuid).update(
        {db.Experiments.uuid: experiment_uuid}
    )

    session.commit()


class PatchExperimentItem(BaseModel):
    target: str
    value: str


@router.patch("/api/bayesopt/items/{experiment_uuid}")
async def patch_experiment_item(
    experiment_uuid: str,
    request: dict,
    session: Session = Depends(get_db_session),
):
    # only target="experiment_name" is supported
    if request["target"] == "experiment_name":
        # type-check
        if db.Experiments.name.type.python_type is not type(request["value"]):
            raise HTTPException(
                status_code=422,
                detail=f"Type mismatch: {type(request['value'])} != {db.Experiments.name.type.python_type}",
            )

        session.query(db.Experiments).filter(
            db.Experiments.uuid == experiment_uuid
        ).update({db.Experiments.name: request["value"]})
        session.commit()
    else:
        raise HTTPException(
            status_code=422, detail=f"Unknown target: {request['target']}"
        )


@router.delete("/api/bayesopt/items/{experiment_uuid}")
async def delete_experiment_item(
    experiment_uuid: str,
    session: Session = Depends(get_db_session),
):
    # check if the uuid exists
    if (
        session.query(db.Experiments)
        .filter(db.Experiments.uuid == experiment_uuid)
        .one_or_none()
        is None
    ):
        raise HTTPException(
            status_code=404, detail=f"Experiment with uuid {experiment_uuid} not found"
        )

    # ondelete="CASCADE" is set in the database schema,
    # so the related rows in other tables will be deleted automatically
    session.query(db.Experiments).filter(
        db.Experiments.uuid == experiment_uuid
    ).delete()

    session.commit()
