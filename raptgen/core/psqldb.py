from typing import Literal, Optional, List, Any, Dict

from raptgen.tasks import celery

from sqlalchemy.orm import sessionmaker, relationship, declarative_base
from sqlalchemy.sql import func
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
engine = create_engine(
    "postgresql://postgres:postgres@db:5432"
)
session = sessionmaker(bind=engine)()


# define schemas for the database
BaseSchema = declarative_base()
BaseSchema.metadata.create_all(engine) 

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
    parent_uuid = Column(String, ForeignKey("parent_jobs.uuid"), primary_key=True, nullable=False)
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

    child_uuid = Column(String, ForeignKey("child_jobs.uuid"), primary_key=True, nullable=False)
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

    child_uuid = Column(String, ForeignKey("child_jobs.uuid"), primary_key=True, nullable=False)
    epoch = Column(Integer, primary_key=True, nullable=False)

    train_loss = Column(Float)
    test_loss = Column(Float)
    test_recon = Column(Float)
    test_kld = Column(Float)


# implements accessors for the database
def read_jobs_data(
    table: Literal["parent_jobs", "child_jobs", "sequence_embeddings", "training_losses"],
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
            data = session.query(ParentJob).all()
        else:
            data = session.query(ParentJob).filter(ParentJob.uuid == uuid).all()
        session.commit()
        
        # if any modification is found, update the database
        for d in data:
            res = celery.AsyncResult(d.uuid)
            if res is None:
                continue # skip if the job is not found
            status = str(res.status)
            if status != d.status:
                d.status = status
        session.commit()
    
    elif table == "child_jobs":
        if uuid is None:
            data = session.query(ChildJob).all()
        else:
            data = session.query(ChildJob).filter(ChildJob.uuid == uuid).all()
        session.commit()
        # child jobs does not use redis, so no need to update the database

    elif table == "sequence_embeddings":
        if uuid is None:
            data = session.query(SequenceEmbeddings).all()
        else:
            data = session.query(SequenceEmbeddings).filter(SequenceEmbeddings.child_uuid == uuid).all()
        session.commit()

    elif table == "training_losses":
        if uuid is None:
            data = session.query(TrainingLosses).all()
        else:
            data = session.query(TrainingLosses).filter(TrainingLosses.child_uuid == uuid).all()
        session.commit()

    else:
        raise ValueError("Table name is not valid")

    return data


def commit_jobs_data(
    table: Literal["parent_jobs", "child_jobs", "sequence_embeddings", "training_losses"],
    method: Literal["add", "update", "delete"],
    uuid: str,
    data: Optional[Dict[str, Any]] = None,
) -> None:
    """
    Commit the data to the database

    Parameters
    ----------
    table: str
        table name to commit the data to
    method: str
        method to commit the data, either "add", "update", or "delete"
    uuid: str
        identifier of the job, either parent or child job
    data: dict
        value to commit to the table
    """

    if method == "add":
        if data is None:
            raise ValueError("Data must be provided for add method")
        
        if table == "parent_jobs":
            parent_job = ParentJob(**data)
            session.add(parent_job)
        elif table == "child_jobs":
            child_job = ChildJob(**data)
            session.add(child_job)
        elif table == "sequence_embeddings":
            sequence_embedding = SequenceEmbeddings(**data)
            session.add(sequence_embedding)
        elif table == "training_losses":
            training_loss = TrainingLosses(**data)
            session.add(training_loss)
        else:
            raise ValueError("Table name is not valid")
        
    elif method == "update":
        if data is None:
            raise ValueError("Data must be provided for update method")
        if table == "parent_jobs":
            data = ParentJob(data)
            session.query(ParentJob).filter(ParentJob.uuid == uuid).update(data)
        elif table == "child_jobs":
            data = ChildJob(data)
            session.query(ChildJob).filter(ChildJob.uuid == uuid).update(data)
        elif table == "sequence_embeddings":
            data = SequenceEmbeddings(data)
            session.query(SequenceEmbeddings).filter(SequenceEmbeddings.child_uuid == uuid).update(data)
        elif table == "training_losses":
            data = TrainingLosses(data)
            session.query(TrainingLosses).filter(TrainingLosses.child_uuid == uuid).update(data)
        else:
            raise ValueError("Table name is not valid")
        
    elif method == "delete":
        if table == "parent_jobs":
            session.query(ParentJob).filter(ParentJob.uuid == uuid).delete()
        elif table == "child_jobs":
            session.query(ChildJob).filter(ChildJob.uuid == uuid).delete()
        elif table == "sequence_embeddings":
            session.query(SequenceEmbeddings).filter(SequenceEmbeddings.child_uuid == uuid).delete()
        elif table == "training_losses":
            session.query(TrainingLosses).filter(TrainingLosses.child_uuid == uuid).delete()
        else:
            raise ValueError("Table name is not valid")

    session.commit()

    return

    
def commit_jobs_batch_data(
    table: Literal["child_jobs", "sequence_embeddings", "training_losses"],
    method: Literal["add", "delete"],
    uuid: str,
    data: Optional[List[Dict[str, Any]]] = None,
) -> None:
    """
    Commit the data to the database

    Parameters
    ----------
    table : str
        table name to commit the data to
    method: str
        method to commit the data, either "add", "update", or "delete"
    uuid : str
        identifier of the job, either parent or child job
    data : list
        list of data to commit to the table
    """

    if method == "add":
        if data == [] or data is None:
            raise ValueError("Data must be provided for add method")
        if table == "sequence_embeddings":
            for d in data:
                sequence_embedding = SequenceEmbeddings(**d)
                session.add(sequence_embedding)
        elif table == "training_losses":
            raise NotImplementedError("Batch add is not supported for training losses")
        elif table == "child_jobs":
            raise NotImplementedError("Batch add is not supported for child jobs")
        else:
            raise ValueError("Table name is not valid")
        
    elif method == "delete":
        if table == "sequence_embeddings":
            session.query(SequenceEmbeddings).filter(SequenceEmbeddings.child_uuid == uuid).delete()
        elif table == "training_losses":
            session.query(TrainingLosses).filter(TrainingLosses.child_uuid == uuid).delete()
        elif table == "child_jobs":
            session.query(ChildJob).filter(ChildJob.parent_uuid == uuid).delete()
        else:
            raise ValueError("Table name is not valid")
    
    session.commit()

    return