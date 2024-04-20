from typing import Literal, Optional, List, Any, Dict
import numpy as np

from tasks import celery

from sqlalchemy.orm import sessionmaker, relationship, declarative_base, Session
from sqlalchemy.sql import func
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    JSON,
    Boolean,
    ForeignKey,
    LargeBinary,
    create_engine,
)

# create a postgres engine and its session
# define schemas for the database
BaseSchema = declarative_base()


class ParentJob(BaseSchema):
    """
    Table of meta-info on Jobs

    Attributes
    ----------
    uuid : str
        identifier
    name : str
        name of the parent job
    type : str
        type of job, e.g. "RaptGen", "RaptGen-Freq", etc.
    status : str
        status of the parent job, e.g. "success", "failure", "progress", etc.
    start : int
        start time of the parent job
    duration : int
        overall duration of the parent job, interval is not included
    reiteration : int
        number of reiterations of the child jobs
    params_training : dict
        common parameters for training the child jobs
    params_preprocessing : dict
        parameters for preprocessing the data
    child_jobs : list
        list of child jobs
    """

    __tablename__ = "parent_jobs"

    uuid = Column(String, unique=True, primary_key=True)
    name = Column(String)
    type = Column(String)
    status = Column(String)
    start = Column(Integer, default=func.now())
    duration = Column(Integer)
    reiteration = Column(Integer)
    params_preprocessing = Column(JSON)
    params_training = Column(JSON)
    child_jobs = relationship("ChildJob", backref="job")


class ChildJob(BaseSchema):
    """
    Table of meta-info on Child-Jobs

    Attributes
    ----------

    id : int
        zero-indexed identifier, represents the order of the child jobs
    uuid : str
        identifier of the child job
    parent_uuid : str
        identifier of the parent job
    start : int
        start time of the child job
    duration : int
        duration of the child job, interval is not included
    status : str
        status of the child job, e.g. "success", "failure", "progress", etc.
    epochs_total : int
        max number of epochs to train (this may be different from the actual epochs)
    epochs_currnet : int
        current epoch of the child job, zero-indexed
    minimum_NLL : float
        minimum negative log-likelihood (NLL) of the child job, calculated as ELBO
    is_added_viewer_dataset : bool
        flag to indicate if the child job has added the viewer dataset
    error_msg : str
        error message if the child job fails
    sequence_embeddings : list
        list of sequence embeddings for the child job, updated when the child job reaches the optimal NLL
    training_losses: list
        list of training losses for the child job
    current_checkpoint: bytes
        the latest checkpoint of the child job, needed for resuming the training
    optimal_checkpoint: bytes
        the latest optimal checkpoint of the child job, updated when the child job updates the minimal NLL
    """

    __tablename__ = "child_jobs"

    id = Column(Integer, primary_key=True, nullable=False)
    uuid = Column(String, unique=True, nullable=False)
    parent_uuid = Column(
        String, ForeignKey("parent_jobs.uuid"), primary_key=True, nullable=False
    )
    start = Column(Integer, default=func.now())
    duration = Column(Integer)
    status = Column(String, nullable=False)
    epochs_total = Column(Integer, nullable=False)
    epochs_current = Column(Integer)
    minimum_NLL = Column(Float)
    is_added_viewer_dataset = Column(Boolean, default=False, nullable=False)
    error_msg = Column(String)
    sequence_embeddings = relationship("SequenceEmbeddings", backref="child_job")
    training_losses = relationship("TrainingLosses", backref="child_job")
    current_checkpoint = Column(LargeBinary)
    optimal_checkpoint = Column(LargeBinary)


class SequenceEmbeddings(BaseSchema):
    """
    Latent embeddings of the sequences. Required for visualization.

    Attributes
    ----------
    child_uuid : str
        identifier of the child job
    seq_id : int
        identifier of the sequence embeddings
    random_region : str
        random region of the sequence embeddings
    coord_x : float
        x-coordinate of the sequence embeddings
    coord_y : float
        y-coordinate of the sequence embeddings
    duplicate : int
        number of duplicates of the sequence embeddings
    """

    __tablename__ = "sequence_embeddings"

    child_uuid = Column(
        String, ForeignKey("child_jobs.uuid"), primary_key=True, nullable=False
    )
    seq_id = Column(Integer, primary_key=True, nullable=False)
    random_region = Column(String)
    coord_x = Column(Float)
    coord_y = Column(Float)
    duplicate = Column(Integer)


class TrainingLosses(BaseSchema):
    """
    Training losses of the child jobs. Required for visualization.

    Attributes
    ----------
    child_uuid : str
        identifier of the child job
    epoch : int
        epoch of the training losses
    train_loss : float
        training loss of the child job
    test_loss : float
        test loss of the child job
    test_recon : float
        test reconstruction loss of the child job
    test_kld : float
        test Kullback-Leibler divergence (KLD) of the child job
    """

    __tablename__ = "training_losses"

    child_uuid = Column(
        String, ForeignKey("child_jobs.uuid"), primary_key=True, nullable=False
    )
    epoch = Column(Integer, primary_key=True, nullable=False)

    train_loss = Column(Float)
    test_loss = Column(Float)
    test_recon = Column(Float)
    test_kld = Column(Float)


class JobDatabaseService:
    """
    JobDatabaseService
    ==================

    Handles the database for the training jobs.

    Attributes
    ----------
    session: sqlalchemy.orm.session.Session
        if not provided, create a new session

    Methods
    -------
    read_jobs_data(table: str, uuid: Optional[str] = None)
        Read the data from the database

    """

    def __init__(self, session: Optional[Session] = None):
        if session is None:
            engine = create_engine("postgresql://postgres:postgres@db:5432")
            session = sessionmaker(bind=engine)()
        self.session = session

    # implements accessors for the database
    def get_data(
        self,
        table: Literal[
            "parent_jobs", "child_jobs", "sequence_embeddings", "training_losses"
        ],
        uuid: Optional[str] = None,
    ):
        """
        Read the data from the database

        if the database is not consistent with the redis database, update the database
        if query is not found, return None

        Parameters
        ----------
        table : str
            table name to read the data from
        uuid : str
            identifier of the job, either parent or child job
            when not provided, return all the data from the table
        """

        if table == "parent_jobs":
            # read data
            if uuid is None:
                data = self.session.query(ParentJob).all()
            else:
                data = (
                    self.session.query(ParentJob).filter(ParentJob.uuid == uuid).all()
                )
            self.session.commit()

            # if any modification is found, update the database
            for d in data:
                res = celery.AsyncResult(d.uuid)
                if res is None:
                    continue  # skip if the job is not found
                redis_status = str(res.status)
                # print(redis_status)
                allowed_pairs = {
                    "PENDING": ["pending"],
                    "STARTED": ["progress"],
                    "SUCCESS": ["success", "suspend"],
                    "FAILURE": ["failure"],
                    "RETRY": ["pending"],
                }
                if d.status not in allowed_pairs[redis_status]:
                    d.status = allowed_pairs[redis_status][0]

            self.session.commit()

        elif table == "child_jobs":
            if uuid is None:
                data = self.session.query(ChildJob).all()
            else:
                data = self.session.query(ChildJob).filter_by(uuid=uuid).all()
                print(data)
            self.session.commit()
            # child jobs does not use redis, so no need to update the database

        elif table == "sequence_embeddings":
            if uuid is None:
                data = self.session.query(SequenceEmbeddings).all()
            else:
                data = (
                    self.session.query(SequenceEmbeddings)
                    .filter(SequenceEmbeddings.child_uuid == uuid)
                    .all()
                )
            self.session.commit()

        elif table == "training_losses":
            if uuid is None:
                data = self.session.query(TrainingLosses).all()
            else:
                data = (
                    self.session.query(TrainingLosses)
                    .filter(TrainingLosses.child_uuid == uuid)
                    .all()
                )
            self.session.commit()

        else:
            raise ValueError("Table name is not valid")

        return data

    def initialize_job(
        self,
        parent: ParentJob,
        children: List[ChildJob],
    ):
        """
        Add the parent job to the database

        Parameters
        ----------
        parent : ParentJob
            parent job data to add to the database
        children : List[ChildJob]
        """
        self.session.add(parent)
        self.session.add_all(children)
        self.session.commit()
        return

    def update_parent_job(
        self,
        parent_uuid: str,
        patch: Dict[str, Any],
    ) -> None:
        """
        Update the parent job in the database

        Parameters
        ----------
        parent_uuid : str
            identifier of the parent job
        data : dict
            data to update the parent job
        """
        self.session.query(ParentJob).filter_by(uuid=parent_uuid).update(patch)
        self.session.commit()
        return

    def update_child_job(
        self,
        child_uuid: str,
        patch: Dict[str, Any],
    ) -> None:
        """
        Update the child job in the database

        Parameters
        ----------
        child_uuid : str
            identifier of the child job
        data : dict
            data to update the child job
        """
        self.session.query(ChildJob).filter(ChildJob.uuid == child_uuid).update(patch)
        self.session.commit()
        return

    def update_sequence_embeddings(
        self,
    ) -> None:
        """
        Update the sequence embeddings in the database

        Parameters
        ----------
        child_uuid : str
            identifier of the child job
        data : dict
            data to update the sequence embeddings
        """
        assert new_latents.shape[1] == 2, "The shape of the new latents must be (n, 2)"
        self.session.query(SequenceEmbeddings).filter(
            SequenceEmbeddings.child_uuid == child_uuid
        ).delete()
        self.session.add_all(
            [
                SequenceEmbeddings(
                    child_uuid=child_uuid,
                    seq_id=i,
                    coord_x=x,
                    coord_y=y,
                )
                for i, (x, y) in enumerate(new_latents)
            ]
        )
        self.session.add_all([SequenceEmbeddings(**d) for d in new_latents])
        self.session.commit()
        return

    def add_training_losses(
        self,
        child_uuid: str,
        epoch: int,
        train_loss: float,
        test_loss: float,
        test_recon: float,
        test_kld: float,
    ):
        """
        Add the training losses to the database

        Parameters
        ----------
        child_uuid : str
            identifier of the child job
        epoch : int
            epoch of the training losses
        train_loss : float
            training loss of the child job
        test_loss : float
            test loss of the child job
        test_recon : float
            test reconstruction loss of the child job
        test_kld : float
            test Kullback-Leibler divergence (KLD) of the child job
        """
        self.session.add(
            TrainingLosses(
                child_uuid=child_uuid,
                epoch=epoch,
                train_loss=train_loss,
                test_loss=test_loss,
                test_recon=test_recon,
                test_kld=test_kld,
            )
        )
        self.session.commit()
        return

    def delete_job(
        self,
        parent_uuid: str,
    ):
        """
        Delete the parent job from the database

        Parameters
        ----------
        parent_uuid : str
            identifier of the parent job
        """
        self.session.query(ParentJob).filter(ParentJob.uuid == parent_uuid).delete()
        child_jobs = (
            self.session.query(ChildJob)
            .filter(ChildJob.parent_uuid == parent_uuid)
            .all()
        )
        for child_job in child_jobs:
            self.session.query(SequenceEmbeddings).filter(
                SequenceEmbeddings.child_uuid == child_job.uuid
            ).delete()
            self.session.query(TrainingLosses).filter(
                TrainingLosses.child_uuid == child_job.uuid
            ).delete()
            self.session.query(ChildJob).filter(
                ChildJob.uuid == child_job.uuid
            ).delete()
        self.session.commit()
        return


async def get_db_handler():
    """
    Get the database handler
    """
    engine = create_engine("postgresql://postgres:postgres@db:5432")
    session = sessionmaker(bind=engine)()
    db = JobDatabaseService(session)
    BaseSchema.metadata.create_all(engine)
    try:
        yield db
        db.session.commit()
    except SQLAlchemyError as e:
        db.session.rollback()
        raise e
    finally:
        db.session.close()
        engine.dispose()
    return
