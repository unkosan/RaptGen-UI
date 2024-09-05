import enum
from sqlalchemy.orm import relationship, declarative_base, sessionmaker, scoped_session
from sqlalchemy.pool import NullPool
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Boolean,
    ForeignKey,
    LargeBinary,
    Enum,
    create_engine,
)


class JobType(enum.Enum):
    RaptGen = "RaptGen"
    RaptGenFreq = "RaptGen-Freq"
    RaptGenLogfreq = "RaptGen-Logfreq"
    RfamGen = "RfamGen"


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
    datetime_start : int
        start UNIX time of the child job
    datetime_laststop : int
        UNIX time when the child job suspended or finished for the last time
    duration_suspend : int
        duration for model to be suspended
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
    jobtype : str
        type of job, e.g. "RaptGen", "RaptGen-Freq", etc.
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
    datetime_start = Column(Integer)
    datetime_laststop = Column(Integer)
    duration_suspend = Column(Integer)
    status = Column(String, nullable=False)
    epochs_total = Column(Integer, nullable=False)
    epochs_current = Column(Integer)
    minimum_NLL = Column(Float)
    is_added_viewer_dataset = Column(Boolean, default=False)
    error_msg = Column(String)
    sequence_embeddings = relationship("SequenceEmbeddings", backref="child_job")
    training_losses = relationship("TrainingLosses", backref="child_job")
    jobtype = Column(Enum(JobType), nullable=False)
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


class PreprocessingParams(BaseSchema):
    """
    Inventory of preprocessing parameters. linked to parent jobs.

    Attributes
    ----------

    parent_uuid : str
        identifier of the parent job
    forward : str
        forward primer
    reverse : str
        reverse primer
    random_region_length : int
        length of the random region
    tolerance : int
        tolerance of the random region length
    minimum_count : int
        minimum count of the random region
    """

    __tablename__ = "preprocessing_params"

    parent_uuid = Column(
        String, ForeignKey("parent_jobs.uuid"), primary_key=True, nullable=False
    )
    forward = Column(String, nullable=False)
    reverse = Column(String, nullable=False)
    random_region_length = Column(Integer, nullable=False)
    tolerance = Column(Integer, nullable=False)
    minimum_count = Column(Integer, nullable=False)


class RaptGenParams(BaseSchema):
    """
    Inventory of RaptGen parameters. linked to child jobs.

    Attributes
    ----------

    child_uuid : str
        identifier of the child job
    model_length : int
        length of the pHMM model
    maximum_epochs : int
        maximum number of epochs to train
    match_forcing_duration : int
        duration of the match forcing
    beta_duration : int
        duration of the beta annealing
    early_stopping : int
        early stopping threshold
    match_cost : float
        cost of the match forcing
    seed : int
        random seed
    device : str
        device to use for training
    """

    __tablename__ = "raptgen_params"

    child_uuid = Column(
        String, ForeignKey("child_jobs.uuid"), primary_key=True, nullable=False
    )
    model_length = Column(Integer, nullable=False)
    epochs = Column(Integer, nullable=False)
    match_forcing_duration = Column(Integer, nullable=False)
    beta_duration = Column(Integer, nullable=False)
    early_stopping = Column(Integer, nullable=False)
    match_cost = Column(Float, nullable=False)
    seed_value = Column(Integer, nullable=False)
    device = Column(String, nullable=False)


class OptimizationMethod(enum.Enum):
    qEI = "qEI"


class Experiments(BaseSchema):
    __tablename__ = "experiments"
    uuid = Column(String, unique=True, primary_key=True)
    name = Column(String)
    VAE_model = Column(String)
    minimum_count = Column(Integer)
    show_training_data = Column(Boolean)
    show_bo_contour = Column(Boolean)
    optimization_method_name = Column(Enum(OptimizationMethod), nullable=False)
    target_column_name = Column(String)
    query_budget = Column(Integer)
    xlim_start = Column(Float)
    xlim_end = Column(Float)
    ylim_start = Column(Float)
    ylim_end = Column(Float)
    last_modified = Column(Integer)

    registered_values = relationship("RegisteredValues", backref="experiments")
    target_columns = relationship("TargetColumns", backref="experiments")
    target_values = relationship("TargetValues", backref="experiments")
    query_data = relationship("QueryData", backref="experiments")
    acquisition_data = relationship("AcquisitionData", backref="experiments")


class RegisteredValues(BaseSchema):
    __tablename__ = "registered_values"
    id = Column(
        Integer, primary_key=True, unique=True, autoincrement=True
    )  # ID for each registered value
    experiment_uuid = Column(String, ForeignKey("experiments.uuid"))
    value_id = Column(String)  # Registered value ID
    sequence = Column(String)  # Sequence information
    target_values = relationship("TargetValues", backref="registered_values")


class TargetColumns(BaseSchema):
    __tablename__ = "target_columns"
    id = Column(
        Integer, primary_key=True, unique=True, autoincrement=True
    )  # ID for each target column
    experiment_uuid = Column(String, ForeignKey("experiments.uuid"))
    column_name = Column(String)  # Target column name
    target_values = relationship("TargetValues", backref="target_columns")


class TargetValues(BaseSchema):
    __tablename__ = "target_values"
    id = Column(
        Integer, primary_key=True, unique=True, autoincrement=True
    )  # ID for each target value
    experiment_uuid = Column(String, ForeignKey("experiments.uuid"))
    registered_values_id = Column(Integer, ForeignKey("registered_values.id"))
    target_column_id = Column(Integer, ForeignKey("target_columns.id"))
    value = Column(Float)


class QueryData(BaseSchema):
    __tablename__ = "query_data"
    id = Column(
        Integer, primary_key=True, unique=True, autoincrement=True
    )  # ID for each query data entry
    experiment_uuid = Column(String, ForeignKey("experiments.uuid"))
    sequence = Column(String)  # Sequence information
    coord_x_original = Column(Float)  # Original X coordinate
    coord_y_original = Column(Float)  # Original Y coordinate


class AcquisitionData(BaseSchema):
    __tablename__ = "acquisition_data"
    id = Column(
        Integer, primary_key=True, unique=True, autoincrement=True
    )  # ID for each acquisition data entry
    experiment_uuid = Column(String, ForeignKey("experiments.uuid"))
    coord_x = Column(Float)  # X coordinate
    coord_y = Column(Float)  # Y coordinate
    value = Column(Float)  # Value corresponding to the coordinates


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
