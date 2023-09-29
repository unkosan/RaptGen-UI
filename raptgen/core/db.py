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
from sqlalchemy.orm import sessionmaker, relationship, declarative_base
from sqlalchemy.sql import func

import os

# Check if we are in testing mode
IS_TESTING = os.environ.get("TESTING")

# Use a temporary database for testing
DATABASE_URL = (
    "sqlite:///data/test_tasks.db" if IS_TESTING else "sqlite:///data/tasks.db"
)


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
    # params_preprocessing = Column(JSON)
    params_training = Column(JSON)
    child_jobs = relationship("ChildJob", backref="job")


class ChildJob(Base):
    """Table of meta-info on Child-Jobs"""

    __tablename__ = "child_jobs"

    # identifier
    id = Column(Integer, primary_key=True)  # zero-indexed
    uuid = Column(String, unique=True)
    parent_uuid = Column(String, ForeignKey("parent_jobs.uuid"), primary_key=True)

    start = Column(Integer, default=func.now())
    duration = Column(Integer)
    status = Column(String)
    epochs_total = Column(Integer)
    epochs_current = Column(Integer)
    # TODO: epoch_recently_finished=100,
    # TODO: 0-index か　1-index かきめる
    minimum_NLL = Column(Float)


class SequenceEmbeddings(Base):
    """Job result per ChildJob"""

    __tablename__ = "job_results"

    # identifier
    child_uuid = Column(
        String, ForeignKey("child_jobs.uuid"), unique=True, primary_key=True
    )
    seq_id = Column(Integer, primary_key=True)

    random_region = Column(String)
    coord_x = Column(Float)
    coord_y = Column(Float)
    duplicate = Column(Integer)


class TrainingLosses(Base):
    __tablename__ = "training_losses"

    child_uuid = Column(
        String, ForeignKey("child_jobs.uuid"), unique=True, primary_key=True
    )
    epoch = Column(Integer, primary_key=True)  # [TODO]: 0-indexed or 1-indexed?
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
