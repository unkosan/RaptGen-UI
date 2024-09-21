"""
This module contains mock data for the tests of the GMMJob and Trial modules.
"""

from dataclasses import dataclass
from typing import List
from enum import Enum


class C:  # as "Constants"
    # GMMJob table
    GMMJob = "GMMJob"
    id = "id"
    uuid = "uuid"
    target_VAE_model = "target_VAE_model"
    minimum_n_components = "minimum_n_components"
    maximum_n_components = "maximum_n_components"
    step_size = "step_size"
    n_trials_per_component = "n_trials_per_component"
    status = "status"
    name = "name"
    start = "start"
    duration = "duration"
    trials_total = "trials_total"
    trials_current = "trials_current"
    optimal_trial_id = "optimal_trial_id"
    current_trial_id = "current_trial_id"

    # Trial table
    Trial = "Trial"
    gmm_job_id = "gmm_job_id"
    trials_total = "trials_total"
    current_trial_id = "current_trial_id"
    current_trial_id_per_component = "current_trial_id_per_component"
    n_components = "n_components"
    means = "means"
    covariances = "covariances"
    BIC = "BIC"

    # SequenceEmbeddings DF
    random_region = "random_region"
    coord_x = "coord_x"
    coord_y = "coord_y"
    duplicates = "duplicates"


class GMMTest(Enum):
    DB_INSERT_SUCCESS = "DB_INSERT_SUCCESS"
    DF_INSERT_SUCCESS = "DF_INSERT_SUCCESS"
    DATA_INSERT_SUCCESS = "DATA_INSERT_SUCCESS"

    POST_submit_success = "POST_submit_success"
    POST_submit_failure = "POST_submit_failure"
    POST_search_success = "POST_search_success"
    POST_search_failure = "POST_search_failure"
    GET_items_uuid_success = "GET_items_uuid_success"
    GET_items_uuid_failure = "GET_items_uuid_failure"
    PATCH_items_uuid_success = "PATCH_items_uuid_success"
    PATCH_items_uuid_failure = "PATCH_items_uuid_failure"
    DELETE_items_uuid_success = "DELETE_items_uuid_success"
    DELETE_items_uuid_failure = "DELETE_items_uuid_failure"
    POST_suspend_success = "POST_suspend_success"
    POST_suspend_failure = "POST_suspend_failure"
    POST_resume_success = "POST_resume_success"
    POST_resume_failure = "POST_resume_failure"
    POST_publish_success = "POST_publish_success"
    POST_publish_failure = "POST_publish_failure"


mock_gmm_db = [
    {
        "tests": {GMMTest.DB_INSERT_SUCCESS, GMMTest.DATA_INSERT_SUCCESS},
        "data": {
            C.GMMJob: [
                {
                    C.id: 1,
                    C.uuid: "11111111-1111-1111-1111-111111111111",
                    C.target_VAE_model: "VAE_model_1",
                    C.minimum_n_components: 3,
                    C.maximum_n_components: 5,
                    C.step_size: 1,
                    C.n_trials_per_component: 1,
                    C.status: "progress",
                    C.name: "GMM Job 1",
                    C.start: 1609459200,  # 2021-01-01 00:00:00
                    C.duration: 3600,
                    C.trials_total: 3,
                    C.trials_current: 2,
                    C.optimal_trial_id: -1,
                    C.current_trial_id: 2,
                },
            ],
            C.Trial: [
                {
                    C.id: 1,
                    C.gmm_job_id: "11111111-1111-1111-1111-111111111111",
                    C.trials_total: 3,
                    C.current_trial_id: 1,
                    C.current_trial_id_per_component: 1,
                    C.n_components: 3,
                    C.means: [[0.1, 0.2], [0.3, 0.4], [0.5, 0.6]],
                    C.covariances: [
                        [[0.1, 0.0], [0.0, 0.1]],
                        [[0.2, 0.0], [0.0, 0.2]],
                        [[0.3, 0.0], [0.0, 0.3]],
                    ],
                    C.BIC: 123.45,
                },
                {
                    C.id: 2,
                    C.gmm_job_id: "11111111-1111-1111-1111-111111111111",
                    C.trials_total: 3,
                    C.current_trial_id: 2,
                    C.current_trial_id_per_component: 1,
                    C.n_components: 4,
                    C.means: [[0.2, 0.3], [0.4, 0.5], [0.6, 0.7], [0.8, 0.9]],
                    C.covariances: [
                        [[0.2, 0.0], [0.0, 0.2]],
                        [[0.3, 0.0], [0.0, 0.3]],
                        [[0.4, 0.0], [0.0, 0.4]],
                        [[0.5, 0.0], [0.0, 0.5]],
                    ],
                    C.BIC: 234.56,
                },
            ],
        },
    }
]


@dataclass
class SequenceEmbedding:
    random_region: str
    coord_x: float
    coord_y: float
    duplicates: int


@dataclass
class DFData:
    name: str
    data: List[SequenceEmbedding]


@dataclass
class LatentData:
    tests: set[GMMTest]
    data: List[DFData]


mock_gmm_latent_df_data = [
    LatentData(
        tests={GMMTest.DF_INSERT_SUCCESS, GMMTest.DATA_INSERT_SUCCESS},
        data=[
            DFData(
                name="VAE_model_1",
                data=[
                    SequenceEmbedding(
                        random_region="AAAA",
                        coord_x=0.1,
                        coord_y=0.2,
                        duplicates=1,
                    ),
                    SequenceEmbedding(
                        random_region="AAAC",
                        coord_x=0.3,
                        coord_y=0.4,
                        duplicates=2,
                    ),
                    SequenceEmbedding(
                        random_region="AACC",
                        coord_x=0.5,
                        coord_y=0.6,
                        duplicates=3,
                    ),
                ],
            ),
        ],
    ),
]
