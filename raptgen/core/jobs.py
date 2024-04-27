from typing import Optional

import time
import pandas as pd
import torch
from torch.utils.data import TensorDataset, DataLoader
from uuid import uuid4
from io import BytesIO
from celery.contrib.abortable import AbortableTask

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
from tasks import celery


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

        if any([subling.status == "pending" for subling in sublings]):
            parent.status = "progress"  # type: ignore
        elif any([subling.status == "suspend" for subling in sublings]):
            parent.status = "suspend"  # type: ignore
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

        if any([subling.status == "pending" for subling in sublings]):
            parent.status = "progress"  # type: ignore
        elif any([subling.status == "suspend" for subling in sublings]):
            parent.status = "suspend"  # type: ignore
        elif any([subling.status == "success" for subling in sublings]):
            parent.status = "success"  # type: ignore
        else:
            parent.status = "failure"  # type: ignore

        job.error_msg = str(exc)  # type: ignore

    def before_start(self, task_id, args, kwargs):
        super().before_start(task_id, args, kwargs)
        database_url: str = kwargs["database_url"]
        session = get_db_session(database_url).__next__()
        if session is None:
            raise ValueError("ChildJobTask: Database session is not found.")

        job = session.query(ChildJob).filter(ChildJob.worker_uuid == task_id).first()
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

        task_id = str(uuid4())
        if "resume_uuid" in kwargs and kwargs["resume_uuid"] is not None:
            child = (
                session.query(ChildJob)
                .filter(ChildJob.uuid == kwargs["resume_uuid"])
                .first()
            )
            child.worker_uuid = task_id  # type: ignore
        else:
            session.add(
                ChildJob(
                    id=kwargs["child_id"],
                    uuid=task_id,
                    parent_uuid=kwargs["parent_uuid"],
                    worker_uuid=task_id,
                    start=int(time.time()),
                    duration=None,
                    status="pending",
                    epochs_total=kwargs["num_epochs"],
                    epochs_current=0,
                    minimum_NLL=float("inf"),
                    is_added_viewer_dataset=False,
                    current_checkpoint=None,
                    optimal_checkpoint=None,
                )
            )

        session.commit()
        return super().apply_async(task_id=task_id, args=args, kwargs=kwargs)


@celery.task(bind=True, base=ChildJobTask)
def job_raptgen(
    self: AbortableTask,
    child_id: int,
    model_length: int,
    num_epochs: int,
    beta_threshold: int,
    force_matching_epochs: int,
    match_cost: float,
    early_stop_threshold: int,
    seed: int,
    device: str,
    parent_uuid: str,
    resume_uuid: Optional[str] = None,
    database_url: str = "postgresql+psycopg2://postgres:postgres@db:5432/raptgen",
):
    """
    Run the RaptGen model.

    Parameters
    ----------
    child_id : int
        identifier of the child job
    model_length : int
        length of the pHMM model
    num_epochs : int
        max number of epochs for training
    beta_threshold : int
        beta value for the scheduled annealing
    force_matching_epochs : int
        number of epochs to force matching
    match_cost : float
        cost of the matching
    early_stop_threshold : int
        threshold for early stopping
    seed : int
        random seed
    device : str
        device to run the model
    parent_uuid : str
        parent job identifier
    resume_uuid : str
        if not None, resume training from this child job identifier
    database_url : str
        database URL to connect
    """
    device_t = torch.device(device.lower())
    # get the database session
    session = get_db_session(database_url).__next__()

    # check if the child job exists
    if resume_uuid is not None:
        child_job = session.query(ChildJob).filter(ChildJob.uuid == resume_uuid).first()
        if child_job is None:
            raise ValueError(f"Child job {resume_uuid} does not exist.")
    else:
        child_job = (
            session.query(ChildJob).filter(ChildJob.uuid == self.request.id).first()
        )
        if child_job is None:
            raise ValueError(
                "Child job does not exist. Maybe adding the child job failed."
            )
    child_uuid = child_job.uuid

    # process the data from SequenceData
    sequence_records = (
        session.query(SequenceData)
        .filter(SequenceData.parent_uuid == parent_uuid)
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
    sequence_records_df = sequence_records_df.sample(frac=1, random_state=seed)
    train_df = sequence_records_df[sequence_records_df["is_training_data"]]
    test_df = sequence_records_df[~sequence_records_df["is_training_data"]]

    train_ids = torch.tensor(train_df["encoded_id"].tolist(), dtype=torch.long)
    train_dataloader = DataLoader(
        TensorDataset(train_ids), batch_size=512, shuffle=False
    )
    test_ids = torch.tensor(test_df["encoded_id"].tolist(), dtype=torch.long)
    test_dataloader = DataLoader(TensorDataset(test_ids), batch_size=512, shuffle=False)

    # prepare the model
    model = CNN_PHMM_VAE(
        motif_len=model_length,
        embed_size=2,
    )
    optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)

    patience: float = 0
    current_epoch: int = 0
    min_loss: float = float("inf")

    # if resume_uuid is not None, load the model and optimizer states from the checkpoint
    if resume_uuid is not None:
        current_epoch = child_job.epochs_current  # type: ignore
        if current_epoch != 0:  # type: ignore
            min_loss_record = (
                session.query(TrainingLosses)
                .filter(TrainingLosses.child_uuid == resume_uuid)
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

    for epoch in range(current_epoch, num_epochs):
        if self.is_aborted():
            child_job.status = "suspend"  # type: ignore
            session.commit()
            return False

        if epoch < beta_threshold:
            beta = epoch / beta_threshold
        else:
            beta = 1
        use_force_matching = epoch < force_matching_epochs

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
                    1 + match_cost * (1 - epoch / force_matching_epochs)
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

        # update the child job entry
        child_job.epochs_current = epoch + 1  # type: ignore

        session.commit()

        # early stopping
        if patience >= early_stop_threshold:
            break

    # update the child job entry
    child_job.status = "success"  # type: ignore
    session.commit()

    return True
