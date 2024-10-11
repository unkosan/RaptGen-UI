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
from sqlalchemy.dialects import postgresql


class JobType(enum.Enum):
    RaptGen = "RaptGen"
    RaptGenFreq = "RaptGen-Freq"
    RaptGenLogfreq = "RaptGen-Logfreq"
    RfamGen = "RfamGen"


class JobStatus(enum.Enum):
    success = "success"
    failure = "failure"
    progress = "progress"
    suspend = "suspend"
    pending = "pending"


class OptimizationMethod(enum.Enum):
    qEI = "qEI"


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


class ViewerVAE(BaseSchema):
    """
    Table of meta-info and training data of the VAE models.

    Attributes
    ----------
    id : int
        zero-indexed identifier, represents the order of the VAE models
    uuid : str
        identifier of the VAE model
    create_timestamp : str
        timestamp of the VAE model creation
    name : str
        name of the VAE model
    device : str
        device used for training
    seed : int
        random seed for training
    forward_adapter : str
        forward primer for preprocessing (tokens allowed: A, C, G, T, U)
    reverse_adapter : str
        reverse primer for preprocessing (tokens allowed: A, C, G, T, U)
    random_region_length_standard : int
        standard length of the random region, used for screening on preprocessing
    random_region_length_tolerance : int
        tolerance of the random region length, used for screening on preprocessing
    minimum_count : int
        minimum count of the random region, used for screening on preprocessing
    epochs : int
        number of epochs to train
    epochs_beta_weighting : int
        number of epochs for beta annealing
    epochs_match_forcing : int
        number of epochs for match forcing on phmm model match state
    epochs_early_stopping : int
        number of epochs for early stopping
    match_cost : float
        cost of the match forcing
    phmm_length : int
        length of the pHMM model
    checkpoint : bytes
        checkpoint of the VAE model, needed for inference
    """

    __tablename__ = "viewer_vae"

    id = Column(Integer, primary_key=True, unique=True, autoincrement=True)
    uuid = Column(String, unique=True, nullable=False)

    # metadata
    create_timestamp = Column(String)
    name = Column(String, nullable=False)
    device = Column(String)
    seed = Column(Integer)

    # preprocessing
    forward_adapter = Column(String)
    reverse_adapter = Column(String)
    random_region_length_standard = Column(Integer)
    random_region_length_tolerance = Column(Integer)
    minimum_count = Column(Integer)

    # training
    epochs = Column(Integer)
    epochs_beta_weighting = Column(Integer)
    epochs_match_forcing = Column(Integer)
    epochs_early_stopping = Column(Integer)

    match_cost = Column(Float)
    phmm_length = Column(Integer)

    # training data
    checkpoint = Column(LargeBinary, nullable=False)


class ViewerGMM(BaseSchema):
    """
    Table of meta-info and training data of the GMM models.

    Attributes
    ----------
    id : int
        zero-indexed identifier, represents the order of the GMM models
    uuid : str
        identifier of the GMM model
    vae_uuid : str
        identifier of the VAE model, linked to ViewerVAE table
    name : str
        name of the GMM model
    seed : int
        random seed for training
    n_components : int
        number of components
    means : list
        mean coordinates of the Gaussian Mixtures
    covariances : list
        covariance of the Gaussian Mixtures
    """

    __tablename__ = "viewer_gmm"

    id = Column(Integer, primary_key=True, unique=True, autoincrement=True)
    uuid = Column(String, unique=True, nullable=False)
    vae_uuid = Column(
        String,
        ForeignKey(
            "viewer_vae.uuid",
            onupdate="CASCADE",
            ondelete="CASCADE",
        ),
    )

    # metadata
    name = Column(String, nullable=False)
    seed = Column(Integer)

    # training data
    n_components = Column(Integer, nullable=False)  # Number of components
    means = Column(
        postgresql.ARRAY(Float, dimensions=2), nullable=False
    )  # Means of the GMM
    covariances = Column(
        postgresql.ARRAY(Float, dimensions=3), nullable=False
    )  # Covariance of the GMM


class ViewerSequenceEmbeddings(BaseSchema):
    """
    Sequence embeddings of the viewer models.

    Attributes
    ----------
    id : int
        zero-indexed identifier, represents the order of the sequence embeddings
    vae_uuid : str
        identifier of the VAE model, linked to ViewerVAE table
    random_region : str
        random region of the sequence
    coord_x : float
        x-coordinate of the sequence embeddings
    coord_y : float
        y-coordinate of the sequence embeddings
    duplicate : int
        number of duplicates of the sequence on selex data
    """

    __tablename__ = "viewer_sequence_data"

    id = Column(Integer, primary_key=True, unique=True, autoincrement=True)
    vae_uuid = Column(
        String,
        ForeignKey(
            "viewer_vae.uuid",
            onupdate="CASCADE",
            ondelete="CASCADE",
        ),
    )

    random_region = Column(String, nullable=False)
    coord_x = Column(Float, nullable=False)
    coord_y = Column(Float, nullable=False)
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
        String,
        ForeignKey("child_jobs.uuid"),
        primary_key=True,
        nullable=False,
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


class Experiments(BaseSchema):
    """
    Retains the information of the Bayesian optimization experiments.

    Attributes
    ----------
    uuid : str
        identifier of the experiment
    name : str
        name of the experiment
    VAE_uuid : str
        identifier of the VAE model, linked to ViewerVAE table
    minimum_count : int
        minimum count threshold on graph configurations
    show_training_data : bool
        flag to indicate whether to show training data on the graph
    show_bo_contour : bool
        flag to indicate whether to show acquisition contour on the graph
    optimization_method_name : str
        name of the optimization method
    target_column_name : str
        column name of the target values for the optimization
    query_budget : int
        query budget for the optimization
    xlim_min : float
        minimum x-axis limit
    xlim_max : float
        maximum x-axis limit
    ylim_min : float
        minimum y-axis limit
    ylim_max : float
        maximum y-axis limit
    last_modified : int
        UNIX time of the last modification
    """

    __tablename__ = "experiments"
    uuid = Column(String, unique=True, primary_key=True)
    name = Column(String)
    VAE_uuid = Column(
        String,
        ForeignKey(
            "viewer_vae.uuid",
            ondelete="CASCADE",
            onupdate="CASCADE",
        ),
    )
    minimum_count = Column(Integer)
    show_training_data = Column(Boolean)
    show_bo_contour = Column(Boolean)
    optimization_method_name = Column(Enum(OptimizationMethod), nullable=False)
    target_column_name = Column(String)
    query_budget = Column(Integer)
    xlim_min = Column(Float)
    xlim_max = Column(Float)
    ylim_min = Column(Float)
    ylim_max = Column(Float)
    last_modified = Column(Integer)

    registered_values = relationship("RegisteredValues", backref="experiments")
    target_columns = relationship("TargetColumns", backref="experiments")
    target_values = relationship("TargetValues", backref="experiments")
    query_data = relationship("QueryData", backref="experiments")
    acquisition_data = relationship("AcquisitionData", backref="experiments")


class RegisteredValues(BaseSchema):
    """
    Registered tables for the Bayesian optimization experiments.
    This table is used to store the id and sequence of each row.

    Attributes
    ----------
    id : int
        identifier
    experiment_uuid : str
        associated experiment identifier
    value_id : str
        identifier string of the record, this is specified by the user
    sequence : str
        sequence information of the record
    """

    __tablename__ = "registered_values"
    id = Column(
        Integer, primary_key=True, unique=True, autoincrement=True
    )  # ID for each registered value
    experiment_uuid = Column(
        String, ForeignKey("experiments.uuid", ondelete="CASCADE", onupdate="CASCADE")
    )
    value_id = Column(String)  # Registered value ID
    sequence = Column(String)  # Sequence information
    target_values = relationship("TargetValues", backref="registered_values")


class TargetColumns(BaseSchema):
    """
    Registered tables for the Bayesian optimization experiments.
    This table is used to store the column names.

    Attributes
    ----------
    id : int
        identifier
    experiment_uuid : str
        associated experiment identifier
    column_name : str
        column name
    """

    __tablename__ = "target_columns"
    id = Column(
        Integer, primary_key=True, unique=True, autoincrement=True
    )  # ID for each target column
    experiment_uuid = Column(
        String, ForeignKey("experiments.uuid", ondelete="CASCADE", onupdate="CASCADE")
    )
    column_name = Column(String)  # Target column name
    target_values = relationship("TargetValues", backref="target_columns")


class TargetValues(BaseSchema):
    """
    Registered tables for the Bayesian optimization experiments.
    This table is used to store the table contents other than the id and sequence.

    Attributes
    ----------
    id : int
        identifier
    experiment_uuid : str
        associated experiment identifier
    registered_values_id : int
        which row the value is associated with, linked to RegisteredValues
    target_column_id : int
        which column the value is associated with, linked to TargetColumns
    value : float (or null)
        the value
    """

    __tablename__ = "target_values"
    id = Column(
        Integer, primary_key=True, unique=True, autoincrement=True
    )  # ID for each target value
    experiment_uuid = Column(
        String, ForeignKey("experiments.uuid", ondelete="CASCADE", onupdate="CASCADE")
    )
    registered_values_id = Column(Integer, ForeignKey("registered_values.id"))
    target_column_id = Column(Integer, ForeignKey("target_columns.id"))
    value = Column(Float, nullable=True)


class QueryData(BaseSchema):
    """
    Query table for the Bayesian optimization experiments.

    Attributes
    ----------
    id : int
        identifier
    experiment_uuid : str
        associated experiment identifier
    sequence : str
        sequence information
    coord_x_original : float
        original X coordinate, just after the bayesian optimization
    coord_y_original : float
        original Y coordinate, just after the bayesian optimization
    """

    __tablename__ = "query_data"
    id = Column(
        Integer, primary_key=True, unique=True, autoincrement=True
    )  # ID for each query data entry
    experiment_uuid = Column(
        String, ForeignKey("experiments.uuid", ondelete="CASCADE", onupdate="CASCADE")
    )
    sequence = Column(String)  # Sequence information
    coord_x_original = Column(Float)  # Original X coordinate
    coord_y_original = Column(Float)  # Original Y coordinate


class AcquisitionData(BaseSchema):
    """
    Acquisition meshgrid data for the Bayesian optimization experiments.

    Attributes
    ----------
    id : int
        identifier
    experiment_uuid : str
        associated experiment identifier
    coord_x : float
        X coordinate
    coord_y : float
        Y coordinate
    value : float
        acquisiton value corresponding to the coordinates
    """

    __tablename__ = "acquisition_data"
    id = Column(
        Integer, primary_key=True, unique=True, autoincrement=True
    )  # ID for each acquisition data entry
    experiment_uuid = Column(
        String, ForeignKey("experiments.uuid", ondelete="CASCADE", onupdate="CASCADE")
    )
    coord_x = Column(Float)  # X coordinate
    coord_y = Column(Float)  # Y coordinate
    value = Column(Float)  # Value corresponding to the coordinates


class GMMJob(BaseSchema):
    """
    Table of meta-info of GMM jobs

    Attributes
    ----------
    uuid : str
        identifier of the GMM job
    name : str
        name of the GMM job
    status : str
        status of the GMM job
    target_VAE_uuid : str
        identifier of the associated VAE model
    minimum_n_components : int
        minimum number of components
    maximum_n_components : int
        maximum number of components
    step_size : int
        step size of n_components
    n_trials_per_component : int
        number of trials per component
    datetime_start : int
        start time of the GMM job
    datetime_laststop : int
        last stop time of the GMM job
    duration_suspend : int
        duration for the model to be suspended
    n_component_current : int
        current number of components
    worker_uuid : str
        identifier of the job running in the worker
    error_msg : str
        error message if the job fails
    """

    __tablename__ = "gmm_jobs"
    uuid = Column(
        String, unique=True, primary_key=True, nullable=False
    )  # UUID for each GMM job
    name = Column(String)  # Name of the GMM job
    status = Column(Enum(JobStatus), nullable=False)
    target_VAE_uuid = Column(
        String,
        ForeignKey(
            "viewer_vae.uuid",
            ondelete="CASCADE",
            onupdate="CASCADE",
        ),
    )  # Target VAE UUID

    minimum_n_components = Column(Integer)  # Minimum number of components
    maximum_n_components = Column(Integer)  # Maximum number of components
    step_size = Column(Integer)  # Step size
    n_trials_per_component = Column(Integer)  # Number of trials per component

    datetime_start = Column(Integer)
    datetime_laststop = Column(Integer)
    duration_suspend = Column(Integer)

    n_component_current = Column(Integer)

    worker_uuid = Column(String)  # Worker UUID
    error_msg = Column(String)  # Error message

    # Relationships to Trial
    trials = relationship(
        "OptimalTrial",
        backref="gmm_jobs",
    )


class OptimalTrial(BaseSchema):
    """
    Table of optimal trials on each of n_components. Linked to GMMJob.

    Attributes
    ----------
    id : int
        identifier of the optimal trial
    gmm_job_id : str
        identifier of the associated GMM job
    n_components : int
        number of components
    n_trials_completed : int
        number of trials completed
    n_trials_total : int
        number of trials
    means : list
        mean coordinates of the Gaussian Mixtures
    covariances : list
        covariance of the Gaussian Mixtures
    BIC : float
        Bayesian Information Criterion (BIC)
    """

    __tablename__ = "optimal_trials"
    id = Column(Integer, primary_key=True, unique=True, autoincrement=True)
    gmm_job_id = Column(
        String, ForeignKey(GMMJob.uuid, ondelete="CASCADE", onupdate="CASCADE")
    )
    n_components = Column(Integer, nullable=False)  # Number of components

    n_trials_completed = Column(Integer)  # Number of trials completed
    n_trials_total = Column(Integer)  # Number of trials

    means = Column(postgresql.ARRAY(Float, dimensions=2))  # Means of the GMM
    covariances = Column(postgresql.ARRAY(Float, dimensions=3))  # Covariance of the GMM
    BIC = Column(Float)  # Bayesian Information Criterion (BIC)


class BIC(BaseSchema):
    """
    Inventory of BIC values for all GMM trials. Linked to GMMJob.

    Attributes
    ----------
    id : int
        identifier of the BIC value
    gmm_job_id : str
        identifier of the associated GMM job
    n_components : int
        number of components
    BIC : float
        Bayesian Information Criterion (BIC)
    """

    __tablename__ = "bics"
    id = Column(Integer, primary_key=True, unique=True, autoincrement=True)
    gmm_job_id = Column(
        String, ForeignKey(GMMJob.uuid, ondelete="CASCADE", onupdate="CASCADE")
    )
    n_components = Column(Integer, nullable=False)
    BIC = Column(Float, nullable=False)


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
