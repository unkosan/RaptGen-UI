from pathlib import Path
from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Float,
    JSON,
    Boolean,
    ForeignKey,
    create_engine,
    or_,
)
from sqlalchemy.orm import sessionmaker, relationship, declarative_base, Session
from sqlalchemy.sql import func

import os

# Check if we are in testing mode
IS_TESTING = bool(os.environ.get("TESTING"))

# get the root directory of the project
BASE_DIR = Path(__file__).parent.parent
TEST_DB_PATH = BASE_DIR / "data" / "test_tasks.db"
PROD_DB_PATH = BASE_DIR / "data" / "tasks.db"

# Use a temporary database for testing
DATABASE_URL = (
    f"sqlite:///{TEST_DB_PATH}" if IS_TESTING else f"sqlite:///{PROD_DB_PATH}"
)
if not PROD_DB_PATH.exists():
    PROD_DB_PATH.touch()
if IS_TESTING and not TEST_DB_PATH.exists():
    TEST_DB_PATH.touch()

# Create the SQLite database and session
engine = create_engine(DATABASE_URL)

Base = declarative_base()
Base.metadata.create_all(engine)


class ParentJob(Base):
    """Table of meta-info on Jobs"""

    __tablename__ = "parent_jobs"

    # identifier
    uuid = Column(String, unique=True, primary_key=True)

    name = Column(String)
    type = Column(String)
    status = Column(String)
    start = Column(Integer, default=func.now())
    duration = Column(
        Integer
    )  # this could be calculated as difference between start and end times
    reiteration = Column(Integer)
    params_preprocessing = Column(JSON)
    params_training = Column(JSON)
    child_jobs = relationship("ChildJob", backref="job")


class ChildJob(Base):
    """Table of meta-info on Child-Jobs"""

    __tablename__ = "child_jobs"

    # identifier
    id = Column(Integer, primary_key=True, nullable=False)  # zero-indexed
    uuid = Column(String, unique=True, nullable=False)
    parent_uuid = Column(
        String, ForeignKey("parent_jobs.uuid"), primary_key=True, nullable=False
    )

    start = Column(Integer, default=func.now())
    duration = Column(Integer)
    status = Column(String, nullable=False)
    epochs_total = Column(Integer, nullable=False)
    epochs_current = Column(Integer)  # zero-indexed
    # TODO: epoch_recently_finished=100,
    minimum_NLL = Column(Float)
    is_added_viewer_dataset = Column(Boolean, default=False, nullable=False)
    error_msg = Column(String)


class SequenceEmbeddings(Base):
    """Job result per ChildJob"""

    __tablename__ = "sequence_embeddings"

    # identifier
    child_uuid = Column(
        String, ForeignKey("child_jobs.uuid"), primary_key=True, nullable=False
    )
    seq_id = Column(Integer, primary_key=True, nullable=False)

    random_region = Column(String)
    coord_x = Column(Float)
    coord_y = Column(Float)
    duplicate = Column(Integer)


class TrainingLosses(Base):
    __tablename__ = "training_losses"

    child_uuid = Column(
        String, ForeignKey("child_jobs.uuid"), primary_key=True, nullable=False
    )
    epoch = Column(
        Integer, primary_key=True, nullable=False
    )  # [TODO]: 0-indexed or 1-indexed?
    train_loss = Column(Float)
    test_loss = Column(Float)
    test_recon = Column(Float)
    test_kld = Column(Float)


def get_engine():
    """Get the database engine"""
    return engine


def get_session():
    """Get the database session"""
    Session = sessionmaker(bind=engine)
    return Session()


def update_parent_job_status_based_on_children_jobs(session: Session, uuid: str):
    with Session() as session:
        parent_job = session.query(ParentJob).filter(ParentJob.uuid == uuid).first()
        children_jobs = (
            session.query(ChildJob).filter(ChildJob.parent_uuid == uuid).all()
        )
        status = "SUCCESS"
        for child in children_jobs:
            if child.status == "FAILURE":
                status = "FAILURE"
                break
            elif child.status == "PENDING":
                status = "PENDING"
        parent_job.status = status
        session.commit()
