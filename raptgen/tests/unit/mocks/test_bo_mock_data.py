"""
This module contains mock data for the tests of the BO module.
"""

from enum import Enum


class C:  # as "Constants"
    Experiments = "Experiments"
    uuid = "uuid"
    name = "name"
    VAE_model = "VAE_model"
    minimum_count = "minimum_count"
    show_training_data = "show_training_data"
    show_bo_contour = "show_bo_contour"
    optimization_method_name = "optimization_method_name"
    target_column_name = "target_column_name"
    query_budget = "query_budget"
    xlim_min = "xlim_min"
    xlim_max = "xlim_max"
    ylim_min = "ylim_min"
    ylim_max = "ylim_max"
    last_modified = "last_modified"

    ## [DB] RegisteredValues
    RegisteredValues = "RegisteredValues"
    experiment_uuid = "experiment_uuid"
    id = "id"
    value_id = "value_id"
    sequence = "sequence"
    # target_column_name is already defined

    ## [DB] TargetColumns
    TargetColumns = "TargetColumns"
    # id is already defined
    # experiment_uuid is already defined
    column_name = "column_name"

    ## [DB] TargetValues
    TargetValues = "TargetValues"
    # id is already defined
    # experiment_uuid is already defined
    registered_values_id = "registered_values_id"
    target_column_id = "target_column_id"
    value = "value"

    ## [DB] QueryData
    QueryData = "QueryData"
    # experiment_uuid is already defined
    # id is already defined
    # sequence is already defined
    coord_x_original = "coord_x_original"
    coord_y_original = "coord_y_original"

    ## [DB] AcquisitionData
    AcquisitionData = "AcquisitionData"
    # experiment_uuid is already defined
    # id is already defined
    coord_x = "coord_x"
    coord_y = "coord_y"
    # value is already defined


class BOTest(Enum):
    # test the POST run API.
    # POST_run_success => if all parameters are valid, the function should return a success message.
    # POST_run_failure => if any parameter is invalid, the function should return a failure message.
    POST_run_success = "POST_run_success"
    POST_run_failure = "POST_run_failure"

    # test the GET items API with no uuid specification.
    # GET_items_all_success_single_data => if there is only one item in the database, the function should return that item.
    # GET_items_all_success_multiple_data => if there are multiple items in the database, the function should return all items.
    # GET_items_all_success_no_data => if there are no items in the database, the function should return empty list.
    GET_items_all_success_single_data = "GET_items_all_success_single_data"
    GET_items_all_success_multiple_data = "GET_items_all_success_multiple_data"
    GET_items_all_success_no_data = "GET_items_all_success_no_data"

    # test the GET-items API with uuid specification.
    # GET_items_success => if the uuid is valid, the function should return the item with that uuid.
    # GET_items_failure => if the uuid is invalid, the function should return a failure message.
    GET_items_success = "GET_items_success"
    GET_items_failure = "GET_items_failure"

    # test the PUT items API.
    # PUT_items_success => if the uuid and the payload is valid, the function should update the item with that uuid.
    # PUT_items_failure_uuid_invalid => if the uuid is invalid, the function should return a failure message.
    # PUT_items_failure_payload_invalid => if the payload is invalid, the function should return a failure message.
    PUT_items_success = "PUT_items_success"
    PUT_items_failure_uuid_invalid = "PUT_items_failure_uuid_invalid"
    PUT_items_failure_payload_invalid = "PUT_items_failure_payload_invalid"

    # test the PATCH items API. the patch API only supports updating experiment name for now.
    # PATCH_items_success => if the uuid and the payload is valid, the function should update the item with that uuid.
    # PATCH_items_failure_invalid_target => if the target is invalid, the function should return a failure message.
    # PATCH_items_failure_invalid_value_type => if the value type is invalid; not string, the function should return a failure message.
    PATCH_items_success = "PATCH_items_success"
    PATCH_items_failure_invalid_target = "PATCH_items_failure_invalid_target"
    PATCH_items_failure_invalid_value_type = "PATCH_items_failure_invalid_value_type"

    # test the DELETE items API.
    # DELETE_items_success => if the uuid is valid, the function should delete the item with that uuid.
    # DELETE_items_failure => if the uuid is invalid, the function should return a failure message.
    DELETE_items_success = "DELETE_items_success"
    DELETE_items_failure = "DELETE_items_failure"

    # test the POST submit API.
    # POST_submit_success => if all parameters are valid, the function should return a uuid.
    # POST_submit_failure => if any parameter is invalid, the function should return a failure message.
    POST_submit_success = "POST_submit_success"
    POST_submit_failure = "POST_submit_failure"


mock_bo_db = [
    # itemsAPI mock data for the BO module
    {
        "tests": {
            BOTest.POST_run_success,
            BOTest.POST_run_failure,
            BOTest.GET_items_all_success_no_data,  # This is a test for the case where all items are deleted.
            BOTest.POST_submit_success,
            BOTest.POST_submit_failure,
        },
        "data": {
            C.Experiments: [],
            C.RegisteredValues: [],
            C.TargetValues: [],
            C.TargetColumns: [],
            C.QueryData: [],
            C.AcquisitionData: [],
        },
    },
    {
        "tests": {
            BOTest.GET_items_all_success_multiple_data,
            BOTest.GET_items_success,
            BOTest.GET_items_failure,
            BOTest.PUT_items_success,
            BOTest.PUT_items_failure_uuid_invalid,
            BOTest.PUT_items_failure_payload_invalid,
            BOTest.PATCH_items_success,
            BOTest.PATCH_items_failure_invalid_target,
            BOTest.PATCH_items_failure_invalid_value_type,
            BOTest.DELETE_items_success,
            BOTest.DELETE_items_failure,
        },
        "data": {
            C.Experiments: [
                {
                    C.uuid: "00000000-0000-0000-0000-000000000000",
                    C.name: "multiple_data",
                    C.VAE_model: "test_VAE",
                    C.minimum_count: 2,
                    C.show_training_data: True,
                    C.show_bo_contour: True,
                    C.optimization_method_name: "qEI",
                    C.target_column_name: "target",
                    C.query_budget: 10,
                    C.xlim_min: 0,
                    C.xlim_max: 1,
                    C.ylim_min: 0,
                    C.ylim_max: 1,
                    C.last_modified: 1609459200,  # 2021-01-01 00:00:00
                },
                {
                    C.uuid: "00000000-0000-0000-0000-000000000001",
                    C.name: "multiple_data_2",
                    C.VAE_model: "test_VAE_2",
                    C.minimum_count: 2,
                    C.show_training_data: True,
                    C.show_bo_contour: True,
                    C.optimization_method_name: "qEI",
                    C.target_column_name: "target",
                    C.query_budget: 10,
                    C.xlim_min: 0,
                    C.xlim_max: 1,
                    C.ylim_min: 0,
                    C.ylim_max: 1,
                    C.last_modified: 1609459300,  # 2021-01-01 00:15:00
                },
            ],
            C.RegisteredValues: [
                {
                    C.id: 0,
                    C.experiment_uuid: "00000000-0000-0000-0000-000000000000",
                    C.value_id: 0,
                    C.sequence: "AAAAAAAAAA",
                },
                {
                    C.id: 1,
                    C.experiment_uuid: "00000000-0000-0000-0000-000000000000",
                    C.value_id: 1,
                    C.sequence: "AAAAAAAAAC",
                },
                {
                    C.id: 2,
                    C.experiment_uuid: "00000000-0000-0000-0000-000000000001",
                    C.value_id: 0,
                    C.sequence: "AAAAAAAAAG",
                },
                {
                    C.id: 3,
                    C.experiment_uuid: "00000000-0000-0000-0000-000000000001",
                    C.value_id: 1,
                    C.sequence: "AAAAAAAAAT",
                },
            ],
            C.TargetColumns: [
                {
                    C.id: 0,
                    C.experiment_uuid: "00000000-0000-0000-0000-000000000000",
                    C.column_name: "target",
                },
                {
                    C.id: 1,
                    C.experiment_uuid: "00000000-0000-0000-0000-000000000001",
                    C.column_name: "target",
                },
            ],
            C.TargetValues: [
                {
                    C.id: 0,
                    C.experiment_uuid: "00000000-0000-0000-0000-000000000000",
                    C.registered_values_id: 0,
                    C.target_column_id: 0,
                    C.value: 0.3,
                },
                {
                    C.id: 1,
                    C.experiment_uuid: "00000000-0000-0000-0000-000000000000",
                    C.registered_values_id: 1,
                    C.target_column_id: 0,
                    C.value: 0.5,
                },
                {
                    C.id: 2,
                    C.experiment_uuid: "00000000-0000-0000-0000-000000000001",
                    C.registered_values_id: 2,
                    C.target_column_id: 1,
                    C.value: 0.2,
                },
                {
                    C.id: 3,
                    C.experiment_uuid: "00000000-0000-0000-0000-000000000001",
                    C.registered_values_id: 3,
                    C.target_column_id: 1,
                    C.value: 0.4,
                },
            ],
            C.QueryData: [
                {
                    C.id: 0,
                    C.experiment_uuid: "00000000-0000-0000-0000-000000000000",
                    C.sequence: "AAAAAAAACA",
                    C.coord_x_original: 0.1,
                    C.coord_y_original: 0.2,
                },
                {
                    C.id: 1,
                    C.experiment_uuid: "00000000-0000-0000-0000-000000000000",
                    C.sequence: "AAAAAAAACC",
                    C.coord_x_original: 0.3,
                    C.coord_y_original: 0.4,
                },
                {
                    C.id: 2,
                    C.experiment_uuid: "00000000-0000-0000-0000-000000000001",
                    C.sequence: "AAAAAAAACG",
                    C.coord_x_original: 0.1,
                    C.coord_y_original: 0.2,
                },
                {
                    C.id: 3,
                    C.experiment_uuid: "00000000-0000-0000-0000-000000000001",
                    C.sequence: "AAAAAAAACT",
                    C.coord_x_original: 0.3,
                    C.coord_y_original: 0.4,
                },
            ],
            C.AcquisitionData: [
                {
                    C.id: 0,
                    C.experiment_uuid: "00000000-0000-0000-0000-000000000000",
                    C.coord_x: 0.1,
                    C.coord_y: 0.2,
                    C.value: 0.3,
                },
                {
                    C.id: 1,
                    C.experiment_uuid: "00000000-0000-0000-0000-000000000000",
                    C.coord_x: 0.3,
                    C.coord_y: 0.4,
                    C.value: 0.5,
                },
                {
                    C.id: 2,
                    C.experiment_uuid: "00000000-0000-0000-0000-000000000001",
                    C.coord_x: 0.1,
                    C.coord_y: 0.2,
                    C.value: 0.3,
                },
                {
                    C.id: 3,
                    C.experiment_uuid: "00000000-0000-0000-0000-000000000001",
                    C.coord_x: 0.3,
                    C.coord_y: 0.4,
                    C.value: 0.5,
                },
            ],
        },
    },
    {
        "tests": {BOTest.GET_items_all_success_single_data},
        "data": {
            C.Experiments: [
                {
                    C.uuid: "00000000-0000-0000-0000-000000000002",
                    C.name: "single_data_test",
                    C.VAE_model: "test_VAE",
                    C.minimum_count: 2,
                    C.show_training_data: True,
                    C.show_bo_contour: True,
                    C.optimization_method_name: "qEI",
                    C.target_column_name: "target",
                    C.query_budget: 10,
                    C.xlim_min: 0,
                    C.xlim_max: 1,
                    C.ylim_min: 0,
                    C.ylim_max: 1,
                    C.last_modified: 1609459200,  # 2021-01-01 00:00:00
                },
            ],
            C.RegisteredValues: [
                {
                    C.id: 0,
                    C.experiment_uuid: "00000000-0000-0000-0000-000000000002",
                    C.value_id: 0,
                    C.sequence: "GAAAAAAAAG",
                },
                {
                    C.id: 1,
                    C.experiment_uuid: "00000000-0000-0000-0000-000000000002",
                    C.value_id: 1,
                    C.sequence: "GAAAAAAAAT",
                },
            ],
            C.TargetColumns: [
                {
                    C.id: 0,
                    C.experiment_uuid: "00000000-0000-0000-0000-000000000002",
                    C.column_name: "target",
                },
            ],
            C.TargetValues: [
                {
                    C.id: 0,
                    C.registered_values_id: 0,
                    C.target_column_id: 0,
                    C.value: 0.3,
                },
                {
                    C.id: 1,
                    C.registered_values_id: 1,
                    C.target_column_id: 0,
                    C.value: 0.5,
                },
            ],
            C.QueryData: [
                {
                    C.id: 0,
                    C.experiment_uuid: "00000000-0000-0000-0000-000000000002",
                    C.sequence: "GAAAAAAACG",
                    C.coord_x_original: 0.1,
                    C.coord_y_original: 0.2,
                },
                {
                    C.id: 1,
                    C.experiment_uuid: "00000000-0000-0000-0000-000000000002",
                    C.sequence: "GAAAAAAACT",
                    C.coord_x_original: 0.3,
                    C.coord_y_original: 0.4,
                },
            ],
            C.AcquisitionData: [
                {
                    C.id: 0,
                    C.experiment_uuid: "00000000-0000-0000-0000-000000000002",
                    C.coord_x: 0.1,
                    C.coord_y: 0.2,
                    C.value: 0.3,
                },
                {
                    C.id: 1,
                    C.experiment_uuid: "00000000-0000-0000-0000-000000000002",
                    C.coord_x: 0.3,
                    C.coord_y: 0.4,
                    C.value: 0.5,
                },
            ],
        },
    },
]
