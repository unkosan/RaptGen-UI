from typing import Optional

import time
import pandas as pd
import torch
from torch.utils.data import TensorDataset, DataLoader
from uuid import uuid4
from io import BytesIO
from celery.contrib.abortable import AbortableTask, AbortableAsyncResult
from celery.result import allow_join_result

from sqlalchemy.orm import Session, scoped_session
from uuid import UUID

from core.db import (
    ParentJob,
    ChildJob,
    SequenceEmbeddings,
    TrainingLosses,
    SequenceData,
    get_db_session,
)
from core.algorithms import profile_hmm_vae_loss, CNN_PHMM_VAE
from core.preprocessing import ID_encode
from core.schemas import RaptGenTrainingParams
from tasks import celery
from threading import Semaphore

# Use a semaphore to limit the number of concurrent jobs
if torch.cuda.is_available():
    semaphore_dict = {
        "CPU": Semaphore(value=2),
    } | {f"CUDA:{i}": Semaphore(value=2) for i in range(torch.cuda.device_count())}
else:
    semaphore_dict = {
        "CPU": Semaphore(value=2),
    }


class ChildJobTask(AbortableTask):

    def on_success(self, retval, task_id, args, kwargs):
        super().on_success(retval, task_id, args, kwargs)
        database_url: str = kwargs["database_url"]
        session = get_db_session(database_url).__next__()
        if session is None:
            raise ValueError("ChildJobTask: Database session is not found.")

        job = session.query(ChildJob).filter(ChildJob.worker_uuid == task_id).first()
        if job is None:
            raise ValueError(
                f"ChildJobTask: Task {task_id} does not exist on the database."
            )
        parent = (
            session.query(ParentJob).filter(ParentJob.uuid == job.parent_uuid).first()
        )
        if parent is None:
            raise ValueError(
                f"ChildJobTask: Parent job {job.parent_uuid} does not exist on the database."
            )
        sublings = (
            session.query(ChildJob)
            .filter(ChildJob.parent_uuid == job.parent_uuid)
            .all()
        )
        if len(sublings) == 0:
            raise ValueError(
                f"ChildJobTask: Parent job {job.parent_uuid} does not have any child jobs."
            )

        for subling in sublings:
            print(
                f"ChildJobTask: Child job {subling.uuid} has status {subling.status}."
            )

        if any([subling.status in {"pending", "progress"} for subling in sublings]):
            parent.status = "progress"  # type: ignore
        elif any([subling.status in {"suspend"} for subling in sublings]):
            # 2 cases:
            if job.status == "suspend":  # type: ignore
                # 1. aborted this task and others are already finished
                parent.status = "suspend"  # type: ignore
            else:
                # 2. succeeded this task but other tasks remains in queue
                parent.status = "progress"  # type: ignore
        else:
            parent.status = "success"  # type: ignore

        session.commit()

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        super().on_failure(exc, task_id, args, kwargs, einfo)
        database_url: str = kwargs["database_url"]
        session = get_db_session(database_url).__next__()
        if session is None:
            raise ValueError("ChildJobTask: Database session is not found.")

        job = session.query(ChildJob).filter(ChildJob.worker_uuid == task_id).first()
        if job is None:
            raise ValueError(
                f"ChildJobTask: Task {task_id} does not exist on the database."
            )
        job.status = "failure"  # type: ignore

        parent = (
            session.query(ParentJob).filter(ParentJob.uuid == job.parent_uuid).first()
        )
        if parent is None:
            raise ValueError(
                f"ChildJobTask: Parent job {job.parent_uuid} does not exist on the database."
            )
        sublings = (
            session.query(ChildJob)
            .filter(ChildJob.parent_uuid == job.parent_uuid)
            .all()
        )
        if len(sublings) == 0:
            raise ValueError(
                f"ChildJobTask: Parent job {job.parent_uuid} does not have any child jobs."
            )

        if any([subling.status in {"pending", "progress"} for subling in sublings]):
            parent.status = "progress"  # type: ignore
        elif any([subling.status in {"suspend"} for subling in sublings]):
            # 2 cases:
            if job.status == "suspend":  # type: ignore
                # 1. aborted this task and others are already finished
                parent.status = "suspend"  # type: ignore
            else:
                # 2. succeeded this task but other tasks remains in queue
                parent.status = "progress"  # type: ignore
        elif any([subling.status in {"success"} for subling in sublings]):
            parent.status = "success"  # type: ignore
        else:
            parent.status = "failure"  # type: ignore

        job.error_msg = str(exc)  # type: ignore
        session.commit()

    @classmethod
    def update_status_to_progress(cls, session: Session, child_uuid: str, task_id: str):

        job = session.query(ChildJob).filter(ChildJob.uuid == child_uuid).first()
        if job is None:
            raise ValueError(
                f"ChildJobTask: Task {task_id} does not exist on the database."
            )
        job.status = "progress"  # type: ignore

        parent = (
            session.query(ParentJob).filter(ParentJob.uuid == job.parent_uuid).first()
        )
        if parent is None:
            raise ValueError(
                f"ChildJobTask: Parent job {job.parent_uuid} does not exist on the database."
            )
        parent.status = "progress"  # type: ignore

        session.commit()

    def delay(self, *args, **kwargs):
        database_url: str = kwargs["database_url"]
        session = get_db_session(database_url).__next__()
        if session is None:
            raise ValueError("ChildJobTask: Database session is not found.")

        child_uuid = kwargs["child_uuid"]
        job = session.query(ChildJob).filter(ChildJob.uuid == child_uuid).first()
        if job is None:
            raise ValueError(
                f"ChildJobTask: ChildJob {child_uuid} does not exist on the database."
            )

        uuid = str(uuid4())
        job.worker_uuid = uuid  # type: ignore
        session.commit()

        print(f"ChildJobTask: Running task {uuid} for child job {child_uuid}.")

        return self.apply_async(args, kwargs, task_id=uuid)


@celery.task(bind=True, base=ChildJobTask)
def run_job_raptgen(
    self: ChildJobTask,
    child_uuid: str,
    training_params: dict,
    is_resume: bool = False,
    database_url: str = "postgresql+psycopg2://postgres:postgres@db:5432/raptgen",
):
    """
    Run the RaptGen model.

    Parameters
    ----------
    child_uuid : str
        child job identifier to run or resume
    training_params : dict
        training parameters
    is_resume : bool
        flag to indicate if the job is resumed
    database_url : str
        database URL to connect
    """
    # test if the params are valid
    # RaptGenTrainingParams(**training_params)

    with semaphore_dict[training_params["device"]]:

        print(f"Running RaptGen model for child job {child_uuid}.")
        # get the database session
        session = get_db_session(database_url).__next__()

        # update the status of the child job to progress
        ChildJobTask.update_status_to_progress(session, child_uuid, self.request.id)  # type: ignore

        child_job = session.query(ChildJob).filter(ChildJob.uuid == child_uuid).first()
        if child_job is None:
            raise ValueError(
                f"Child job {child_uuid} does not exist. Initialize the job first."
            )

        # process the data from SequenceData
        sequence_records = (
            session.query(SequenceData)
            .filter(SequenceData.parent_uuid == child_job.parent_uuid)
            .all()
        )

        sequence_records_df = pd.DataFrame(
            [
                {
                    "seq_id": record.seq_id,
                    "random_region": record.random_region,
                    "duplicate": record.duplicate,
                    "is_training_data": record.is_training_data,
                    "encoded_id": ID_encode(record.random_region),
                }
                for record in sequence_records
            ]
        )
        sequence_records_df = sequence_records_df.sample(
            frac=1, random_state=training_params["seed_value"]
        )
        train_df = sequence_records_df[sequence_records_df["is_training_data"]]
        test_df = sequence_records_df[~sequence_records_df["is_training_data"]]

        train_ids_ls = train_df["encoded_id"].to_list()
        train_ids = torch.tensor(
            train_ids_ls, device="cpu"
        )  # avoid deadlock on GPU by sending to CPU
        train_dataloader = DataLoader(
            TensorDataset(train_ids),
            batch_size=min(len(train_df), 512),
            shuffle=False,
        )
        test_ids_ls = test_df["encoded_id"].to_list()
        test_ids = torch.tensor(
            test_ids_ls, device="cpu"
        )  # avoid deadlock on GPU by sending to CPU
        test_dataloader = DataLoader(
            TensorDataset(test_ids),
            batch_size=min(len(train_df), 512),
            shuffle=False,
        )

        # prepare the model
        model = CNN_PHMM_VAE(
            motif_len=training_params["model_length"],
            embed_size=2,
        )
        optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)

        patience: float = 0
        current_epoch: int = 0
        min_loss: float = float("inf")

        device_t = torch.device(training_params["device"].lower())

        # if resume_uuid is not None, load the model and optimizer states from the checkpoint
        if is_resume:
            current_epoch = child_job.epochs_current  # type: ignore
            if current_epoch != 0:  # type: ignore
                min_loss_record = (
                    session.query(TrainingLosses)
                    .filter(TrainingLosses.child_uuid == child_uuid)
                    .order_by(TrainingLosses.test_loss)
                    .first()
                )
                min_loss_epoch: int = min_loss_record.epoch  # type: ignore
                patience = current_epoch - min_loss_epoch
                min_loss = min_loss_record.test_loss  # type: ignore

                current_checkpoint_binary: bytes = child_job.current_checkpoint  # type: ignore
                with BytesIO(current_checkpoint_binary) as f:
                    current_checkpoint = torch.load(f)
                    model.load_state_dict(current_checkpoint["model"])
                    optimizer.load_state_dict(current_checkpoint["optimizer"])

        model.to(device_t)
        model.train()

        print(
            f"Training RaptGen model for task_id {self.request.id}. With abort flag {self.is_aborted()}."
        )

        for epoch in range(current_epoch, training_params["epochs"]):
            if self.is_aborted():
                child_job.status = "suspend"  # type: ignore
                session.commit()
                return False

            if epoch < training_params["beta_duration"]:
                beta = epoch / training_params["beta_duration"]
            else:
                beta = 1
            use_force_matching = epoch < training_params["match_forcing_duration"]

            train_loss: float = 0
            test_kld: float = 0
            test_ce: float = 0

            for (batch,) in train_dataloader:
                batch = batch.to(device_t)
                optimizer.zero_grad()

                (transition_probs, emission_probs), mus, logvars = model(batch)

                loss = profile_hmm_vae_loss(
                    batch_input=batch,
                    transition_probs=transition_probs,
                    emission_probs=emission_probs,
                    mus=mus,
                    logvars=logvars,
                    beta=beta,
                    force_matching=use_force_matching,
                    match_cost=(
                        1
                        + training_params["match_cost"]
                        * (1 - epoch / training_params["match_forcing_duration"])
                        if use_force_matching
                        else 1
                    ),
                )

                loss.backward()

                train_loss += loss.item() * int(batch.shape[0])
                # 損失関数はバッチ内で平均している。バッチ要素数をかけてバッチ毎の総損失量を計算。

                optimizer.step()

            train_loss /= len(train_dataloader.dataset)  # type: ignore
            # train_loss は dataset を構成する塩基配列（各データ点）の平均損失値になる。

            if train_loss == torch.nan:
                raise ValueError("Training loss is not a number.")

            with torch.no_grad():
                for (batch,) in test_dataloader:
                    batch = batch.to(device_t)

                    (transition_probs, emission_probs), mus, logvars = model(batch)
                    ce, kld = profile_hmm_vae_loss(
                        batch_input=batch,
                        transition_probs=transition_probs,
                        emission_probs=emission_probs,
                        mus=mus,
                        logvars=logvars,
                        split_ce_kld=True,
                    )
                    test_ce += ce.item() * batch.shape[0]
                    test_kld += kld.item() * batch.shape[0]

                test_loss = test_kld + test_ce

            if test_loss == torch.nan:
                raise ValueError("Test loss is not a number.")

            session.add(
                TrainingLosses(
                    child_uuid=child_uuid,
                    epoch=epoch,
                    test_loss=test_loss,
                    test_recon=test_ce,
                    test_kld=test_kld,
                    train_loss=train_loss,
                )
            )

            with BytesIO() as f:
                torch.save(
                    {
                        "model": model.state_dict(),
                        "optimizer": optimizer.state_dict(),
                    },
                    f,
                )
                f.seek(0)
                current_checkpoint_binary = f.read()
            child_job.current_checkpoint = current_checkpoint_binary  # type: ignore

            # when the lowest test loss is found, update the optimal checkpoint and embeddings
            if test_loss < min_loss:
                min_loss = test_loss
                child_job.minimum_NLL = min_loss  # type: ignore

                patience = 0

                train_coords_list = []
                test_coords_list = []
                with torch.no_grad():
                    for (batch,) in train_dataloader:
                        batch = batch.to(device_t)
                        _, latent_codes, _ = model(batch)
                        train_coords_list.append(latent_codes)
                    for (batch,) in test_dataloader:
                        batch = batch.to(device_t)
                        _, latent_codes, _ = model(batch)
                        test_coords_list.append(latent_codes)
                    train_coords = torch.cat(train_coords_list, dim=0)
                    test_coords = torch.cat(test_coords_list, dim=0)
                train_df["coord_x"] = train_coords[:, 0].cpu().numpy().tolist()
                train_df["coord_y"] = train_coords[:, 1].cpu().numpy().tolist()
                test_df["coord_x"] = test_coords[:, 0].cpu().numpy().tolist()
                test_df["coord_y"] = test_coords[:, 1].cpu().numpy().tolist()

                embeddings_df = pd.concat([train_df, test_df], ignore_index=True)
                embeddings_df = embeddings_df.drop(
                    columns=["encoded_id", "is_training_data"]
                )
                embeddings_df["child_uuid"] = child_uuid
                embeddings_dict = embeddings_df.to_dict(orient="records")
                # delete(SequenceEmbeddings).where(SequenceEmbeddings.child_uuid == task_id)
                session.query(SequenceEmbeddings).filter(
                    SequenceEmbeddings.child_uuid == child_uuid
                ).delete()
                session.commit()
                session.bulk_insert_mappings(SequenceEmbeddings, embeddings_dict)  # type: ignore

                child_job.optimal_checkpoint = current_checkpoint_binary  # type: ignore

            print(f"Epoch {epoch + 1}: Train Loss {train_loss}, Test Loss {test_loss}")

            # update the child job entry
            child_job.epochs_current = epoch + 1  # type: ignore

            session.commit()

            # early stopping
            if patience >= training_params["early_stopping"]:
                break

        # update the child job entry
        child_job.status = "success"  # type: ignore
        session.commit()

    return True


def initialize_job_raptgen(
    session: Session,
    parent_uuid: str,
    id: int,
    params: RaptGenTrainingParams,
) -> UUID:
    """
    Initialize the database entry for the RaptGen job.

    Parameters
    ----------
        session : Session
            database session
        parent_uuid : str
            parent job identifier
        id : int
            child job identifier
        params : RaptGenTrainingParams
            training parameters

    Returns
    -------
        UUID
            child job identifier
    """
    uuid = uuid4()
    session.add(
        ChildJob(
            id=id,
            uuid=str(uuid),
            parent_uuid=parent_uuid,
            worker_uuid=None,
            start=int(time.time()),
            duration=0,
            status="pending",
            epochs_total=params.epochs,
            epochs_current=0,
            minimum_NLL=float("inf"),
            is_added_viewer_dataset=False,
            current_checkpoint=None,
            optimal_checkpoint=None,
        )
    )
    session.commit()
    return uuid


# map/chunk does not invoke before_start and on_success/on_failure hooks
# so we need to pack the tasks into a single task
# c.f. https://github.com/celery/celery/issues/7585
@celery.task(bind=True, base=AbortableTask)
def manage_jobs_raptgen(
    self: AbortableTask,
    parent_uuid: str,
    training_params: dict,
    is_resume: bool = False,
    database_url: str = "postgresql+psycopg2://postgres:postgres@db:5432/raptgen",
):
    """
    Manage the RaptGen jobs.

    Parameters
    ----------
    parent_uuid : str
        parent job identifier
    training_params : dict
        training parameters
    is_resume : bool
        flag to indicate if the job is resumed
    database_url : str
        database URL to connect
    """
    session = get_db_session(database_url).__next__()

    print(f"Managing RaptGen jobs for parent job {self.request.id}.")

    # if the params are valid, the following line will not raise an error
    training_params_t = RaptGenTrainingParams(**training_params)

    parent_job = session.query(ParentJob).filter(ParentJob.uuid == parent_uuid).first()
    if parent_job is None:
        raise ValueError(f"Parent job {parent_uuid} does not exist.")

    uuids = []
    for i in range(parent_job.reiteration):  # type: ignore
        uuid = initialize_job_raptgen(
            session=session,  # type: ignore
            parent_uuid=parent_uuid,
            id=i,
            params=training_params_t,
        )
        uuids.append(str(uuid))

    for uuid in uuids:
        res: AbortableAsyncResult = run_job_raptgen.delay(
            child_uuid=uuid,
            training_params=training_params,
            is_resume=is_resume,
            database_url=database_url,
        )
        with allow_join_result():
            res.wait()
