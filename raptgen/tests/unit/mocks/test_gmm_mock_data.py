"""
This module contains mock data for the tests of the GMMJob and Trial modules.
"""

from enum import Enum


class C:  # as "Constants"
    # GMMJob table
    GMMJob = "GMMJob"
    id = "id"
    uuid = "uuid"
    name = "name"
    status = "status"
    target_VAE_uuid = "target_VAE_uuid"
    minimum_n_components = "minimum_n_components"
    maximum_n_components = "maximum_n_components"
    step_size = "step_size"
    n_trials_per_component = "n_trials_per_component"
    datetime_start = "datetime_start"
    datetime_laststop = "datetime_laststop"
    duration_suspend = "duration_suspend"
    n_component_current = "n_component_current"
    worker_uuid = "worker_uuid"
    error_msg = "error_msg"

    # Trial table
    OptimalTrial = "OptimalTrial"
    gmm_job_id = "gmm_job_id"
    n_trials_completed = "n_trials_completed"
    n_trials_total = "n_trials_total"
    n_components = "n_components"
    means = "means"
    covariances = "covariances"
    BIC = "BIC"

    # ViewerVAE table
    ViewerVAE = "ViewerVAE"
    uuid = "uuid"
    name = "name"
    checkpoint = "checkpoint"

    # ViewerSequenceEmbeddings table
    ViewerSequenceEmbeddings = "ViewerSequenceEmbeddings"
    vae_uuid = "vae_uuid"
    random_region = "random_region"
    coord_x = "coord_x"
    coord_y = "coord_y"
    duplicate = "duplicate"


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
        "tests": {
            GMMTest.DB_INSERT_SUCCESS,
            GMMTest.DATA_INSERT_SUCCESS,
            GMMTest.GET_items_uuid_success,
            GMMTest.PATCH_items_uuid_success,
            GMMTest.DELETE_items_uuid_success,
        },
        "data": {
            C.GMMJob: [
                {
                    C.uuid: "11111111-1111-1111-1111-111111111111",
                    C.target_VAE_uuid: "11111111-1111-1111-1111-111111111111",
                    C.minimum_n_components: 3,
                    C.maximum_n_components: 5,
                    C.step_size: 1,
                    C.n_trials_per_component: 3,
                    C.status: "progress",
                    C.name: "GMM Job 1",
                    C.datetime_start: 1609459200,  # 2021-01-01 00:00:00
                    C.datetime_laststop: 1609469200,
                    C.duration_suspend: 3600,
                    C.n_component_current: 4,
                    C.worker_uuid: "11111111-1111-1111-1111-222222222222",
                    C.error_msg: None,
                },
            ],
            C.OptimalTrial: [
                {
                    C.gmm_job_id: "11111111-1111-1111-1111-111111111111",
                    C.n_components: 3,
                    C.n_trials_completed: 3,
                    C.n_trials_total: 3,
                    C.means: [[0.1, 0.2], [0.3, 0.4], [0.5, 0.6]],
                    C.covariances: [
                        [[0.1, 0.0], [0.0, 0.1]],
                        [[0.2, 0.0], [0.0, 0.2]],
                        [[0.3, 0.0], [0.0, 0.3]],
                    ],
                    C.BIC: 123.45,
                },
                {
                    C.gmm_job_id: "11111111-1111-1111-1111-111111111111",
                    C.n_components: 4,
                    C.n_trials_completed: 3,
                    C.n_trials_total: 2,
                    C.means: [[0.2, 0.3], [0.4, 0.5], [0.6, 0.7], [0.8, 0.9]],
                    C.covariances: [
                        [[0.2, 0.0], [0.0, 0.2]],
                        [[0.3, 0.0], [0.0, 0.3]],
                        [[0.4, 0.0], [0.0, 0.4]],
                        [[0.5, 0.0], [0.0, 0.5]],
                    ],
                    C.BIC: 234.56,
                },
                {
                    C.gmm_job_id: "11111111-1111-1111-1111-111111111111",
                    C.n_components: 5,
                    C.n_trials_completed: 0,
                    C.n_trials_total: 3,
                    C.means: None,
                    C.covariances: None,
                    C.BIC: float("inf"),
                },
            ],
            C.BIC: [
                {
                    C.id: 0,
                    C.gmm_job_id: "11111111-1111-1111-1111-111111111111",
                    C.n_components: 3,
                    C.BIC: 123.45,
                },
                {
                    C.id: 1,
                    C.gmm_job_id: "11111111-1111-1111-1111-111111111111",
                    C.n_components: 3,
                    C.BIC: 123.46,
                },
                {
                    C.id: 2,
                    C.gmm_job_id: "11111111-1111-1111-1111-111111111111",
                    C.n_components: 3,
                    C.BIC: 123.47,
                },
                {
                    C.id: 3,
                    C.gmm_job_id: "11111111-1111-1111-1111-111111111111",
                    C.n_components: 4,
                    C.BIC: 234.56,
                },
                {
                    C.id: 4,
                    C.gmm_job_id: "11111111-1111-1111-1111-111111111111",
                    C.n_components: 4,
                    C.BIC: 234.57,
                },
            ],
        },
    },
    {
        "tests": {
            GMMTest.POST_search_success,
        },
        "data": {
            C.GMMJob: [
                {
                    C.uuid: "11111111-1111-1111-1111-111111111111",
                    C.target_VAE_uuid: "11111111-1111-1111-1111-111111111111",
                    C.minimum_n_components: 3,
                    C.maximum_n_components: 3,
                    C.step_size: 1,
                    C.n_trials_per_component: 3,
                    C.status: "success",
                    C.name: "test_1",
                    C.datetime_start: 1609459200,  # 2021-01-01 00:00:00
                    C.datetime_laststop: 1609469200,
                    C.duration_suspend: 3600,
                    C.n_component_current: 3,
                    C.worker_uuid: "11111111-1111-1111-1111-1234567890ab",
                    C.error_msg: None,
                },
                {
                    C.uuid: "22222222-2222-2222-2222-222222222222",
                    C.target_VAE_uuid: "11111111-1111-1111-1111-111111111111",
                    C.minimum_n_components: 3,
                    C.maximum_n_components: 3,
                    C.step_size: 1,
                    C.n_trials_per_component: 3,
                    C.status: "failure",
                    C.name: "test_2",
                    C.datetime_start: 1609459200,  # 2021-01-01 00:00:00
                    C.datetime_laststop: 1609469200,
                    C.duration_suspend: 3600,
                    C.n_component_current: 3,
                    C.worker_uuid: "22222222-2222-2222-2222-1234567890ab",
                    C.error_msg: "Job failed",
                },
                {
                    C.uuid: "33333333-3333-3333-3333-333333333333",
                    C.target_VAE_uuid: "11111111-1111-1111-1111-111111111111",
                    C.minimum_n_components: 3,
                    C.maximum_n_components: 3,
                    C.step_size: 1,
                    C.n_trials_per_component: 3,
                    C.status: "progress",
                    C.name: "test_3",
                    C.datetime_start: 1609459200,  # 2021-01-01 00:00:00
                    C.datetime_laststop: 1609469200,
                    C.duration_suspend: 3600,
                    C.n_component_current: 3,
                    C.worker_uuid: "33333333-3333-3333-3333-1234567890ab",
                    C.error_msg: None,
                },
                {
                    C.uuid: "44444444-4444-4444-4444-444444444444",
                    C.target_VAE_uuid: "11111111-1111-1111-1111-111111111111",
                    C.minimum_n_components: 3,
                    C.maximum_n_components: 3,
                    C.step_size: 1,
                    C.n_trials_per_component: 3,
                    C.status: "suspend",
                    C.name: "test_4",
                    C.datetime_start: 1609459200,  # 2021-01-01 00:00:00
                    C.datetime_laststop: 1609469200,
                    C.duration_suspend: 3600,
                    C.n_component_current: 3,
                    C.worker_uuid: "44444444-4444-4444-4444-1234567890ab",
                    C.error_msg: None,
                },
                {
                    C.uuid: "55555555-5555-5555-5555-555555555555",
                    C.target_VAE_uuid: "11111111-1111-1111-1111-111111111111",
                    C.minimum_n_components: 3,
                    C.maximum_n_components: 3,
                    C.step_size: 1,
                    C.n_trials_per_component: 3,
                    C.status: "pending",
                    C.name: "test_n",
                    C.datetime_start: 1609459200,  # 2021-01-01 00:00:00
                    C.datetime_laststop: 1609469200,
                    C.duration_suspend: 3600,
                    C.n_component_current: 3,
                    C.worker_uuid: "55555555-5555-5555-5555-1234567890ab",
                    C.error_msg: None,
                },
            ],
            C.OptimalTrial: [
                {
                    C.gmm_job_id: "11111111-1111-1111-1111-111111111111",
                    C.n_components: 3,
                    C.n_trials_completed: 3,
                    C.n_trials_total: 3,
                    C.means: [[0.1, 0.2], [0.3, 0.4], [0.5, 0.6]],
                    C.covariances: [
                        [[0.1, 0.0], [0.0, 0.1]],
                        [[0.2, 0.0], [0.0, 0.2]],
                        [[0.3, 0.0], [0.0, 0.3]],
                    ],
                    C.BIC: 111.01,
                },
                {
                    C.gmm_job_id: "22222222-2222-2222-2222-222222222222",
                    C.n_components: 3,
                    C.n_trials_completed: 0,
                    C.n_trials_total: 3,
                    C.means: None,
                    C.covariances: None,
                    C.BIC: float("inf"),
                },
                {
                    C.gmm_job_id: "33333333-3333-3333-3333-333333333333",
                    C.n_components: 3,
                    C.n_trials_completed: 2,
                    C.n_trials_total: 3,
                    C.means: [[0.1, 0.2], [0.3, 0.4], [0.5, 0.6]],
                    C.covariances: [
                        [[0.1, 0.0], [0.0, 0.1]],
                        [[0.2, 0.0], [0.0, 0.2]],
                        [[0.3, 0.0], [0.0, 0.3]],
                    ],
                    C.BIC: 222.01,
                },
                {
                    C.gmm_job_id: "44444444-4444-4444-4444-444444444444",
                    C.n_components: 3,
                    C.n_trials_completed: 1,
                    C.n_trials_total: 3,
                    C.means: [[0.1, 0.2], [0.3, 0.4], [0.5, 0.6]],
                    C.covariances: [
                        [[0.1, 0.0], [0.0, 0.1]],
                        [[0.2, 0.0], [0.0, 0.2]],
                        [[0.3, 0.0], [0.0, 0.3]],
                    ],
                    C.BIC: 333.01,
                },
                {
                    C.gmm_job_id: "55555555-5555-5555-5555-555555555555",
                    C.n_components: 3,
                    C.n_trials_completed: 0,
                    C.n_trials_total: 3,
                    C.means: None,
                    C.covariances: None,
                    C.BIC: float("inf"),
                },
            ],
            C.BIC: [
                {
                    C.id: 0,
                    C.gmm_job_id: "11111111-1111-1111-1111-111111111111",
                    C.n_components: 3,
                    C.BIC: 111.01,
                },
                {
                    C.id: 1,
                    C.gmm_job_id: "11111111-1111-1111-1111-111111111111",
                    C.n_components: 3,
                    C.BIC: 111.02,
                },
                {
                    C.id: 2,
                    C.gmm_job_id: "11111111-1111-1111-1111-111111111111",
                    C.n_components: 3,
                    C.BIC: 111.03,
                },
                {
                    C.id: 3,
                    C.gmm_job_id: "33333333-3333-3333-3333-333333333333",
                    C.n_components: 3,
                    C.BIC: 222.01,
                },
                {
                    C.id: 4,
                    C.gmm_job_id: "33333333-3333-3333-3333-333333333333",
                    C.n_components: 3,
                    C.BIC: 222.02,
                },
                {
                    C.id: 5,
                    C.gmm_job_id: "44444444-4444-4444-4444-444444444444",
                    C.n_components: 3,
                    C.BIC: 333.01,
                },
            ],
        },
    },
]


mock_vae_db = [
    {
        "tests": {
            GMMTest.DB_INSERT_SUCCESS,
            GMMTest.DATA_INSERT_SUCCESS,
            GMMTest.GET_items_uuid_success,
            GMMTest.PATCH_items_uuid_success,
            GMMTest.DELETE_items_uuid_success,
            GMMTest.POST_submit_success,
            GMMTest.POST_search_success,
            GMMTest.POST_suspend_success,
            GMMTest.POST_resume_success,
            GMMTest.POST_publish_success,
        },
        "data": {
            C.ViewerVAE: [
                {
                    C.uuid: "11111111-1111-1111-1111-111111111111",
                    C.name: "VAE_model_1",
                    C.checkpoint: b"checkpoint_1",
                },
            ],
            C.ViewerSequenceEmbeddings: [
                {
                    C.vae_uuid: "11111111-1111-1111-1111-111111111111",
                    C.random_region: "ACGU",
                    C.coord_x: 0.1,
                    C.coord_y: 0.2,
                    C.duplicate: 1,
                },
                {
                    C.vae_uuid: "11111111-1111-1111-1111-111111111111",
                    C.random_region: "ACGU",
                    C.coord_x: 0.3,
                    C.coord_y: 0.4,
                    C.duplicate: 2,
                },
                {
                    C.vae_uuid: "11111111-1111-1111-1111-111111111111",
                    C.random_region: "ACGU",
                    C.coord_x: 0.5,
                    C.coord_y: 0.6,
                    C.duplicate: 3,
                },
                {
                    C.vae_uuid: "11111111-1111-1111-1111-111111111111",
                    C.random_region: "ACGU",
                    C.coord_x: 0.7,
                    C.coord_y: 0.8,
                    C.duplicate: 4,
                },
                {
                    C.vae_uuid: "11111111-1111-1111-1111-111111111111",
                    C.random_region: "ACGU",
                    C.coord_x: 0.9,
                    C.coord_y: 1.0,
                    C.duplicate: 5,
                },
            ],
        },
    },
]
