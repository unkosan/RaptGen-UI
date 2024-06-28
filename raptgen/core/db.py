from sqlalchemy.orm import relationship, declarative_base, sessionmaker, scoped_session
from sqlalchemy.pool import NullPool
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
    start = Column(Integer)
    duration = Column(Integer)
    reiteration = Column(Integer)
    params_preprocessing = Column(JSON)
    params_training = Column(JSON)
    child_jobs = relationship("ChildJob", backref="job")
    worker_uuid = Column(String)


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
    worker_uuid : str
        identifier of the worker, needed for suspending/resuming the child job
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

    id = Column(Integer, nullable=False)
    uuid = Column(String, unique=True, primary_key=True, nullable=False)
    parent_uuid = Column(String, ForeignKey("parent_jobs.uuid"), nullable=False)
    worker_uuid = Column(String)
    start = Column(Integer)
    duration = Column(Integer)
    status = Column(String, nullable=False)
    epochs_total = Column(Integer, nullable=False)
    epochs_current = Column(Integer)
    minimum_NLL = Column(Float)
    is_added_viewer_dataset = Column(Boolean, default=False)
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
    random_region = Column(String, nullable=False)
    coord_x = Column(Float)
    coord_y = Column(Float)
    duplicate = Column(Integer, nullable=False)


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


class SequenceData(BaseSchema):
    """
    Inventory of sequence data. linked to parent jobs.

    Attributes
    ----------
    parent_uuid : str
        identifier of the parent job
    seq_id : int
        identifier of the sequence
    random_region : str
        random region of the sequence
    duplicate : int
        number of duplicates of the sequence
    is_training_data : bool
        flag to indicate if the sequence is training data
    """

    __tablename__ = "sequence_data"

    parent_uuid = Column(
        String, ForeignKey("parent_jobs.uuid"), primary_key=True, nullable=False
    )
    seq_id = Column(Integer, primary_key=True, nullable=False)
    random_region = Column(String, nullable=False)
    duplicate = Column(Integer, nullable=False)
    is_training_data = Column(Boolean, nullable=False)


def get_db_session(
    url: str = "postgresql+psycopg2://postgres:postgres@db:5432/raptgen",
):
    """
    Get the database session.
    This function is used for production.

    Parameters
    ----------
    url : str
        database URL to connect. Default is "postgresql+psycopg2://postgres:postgres@db:5432/raptgen"

    Yield
    -----
    session : Session
        database session
    """
    print(f"Connecting to database: {url}")

    # create engine
    engine = create_engine(url, poolclass=NullPool)

    # create tables
    BaseSchema.metadata.create_all(engine)

    # create session
    session = scoped_session(sessionmaker(bind=engine))
    try:
        yield session
    finally:
        session.close()

    # dispose engine
    engine.dispose()

    print("Database connection closed.")
