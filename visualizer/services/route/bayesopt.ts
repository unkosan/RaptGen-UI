import { makeApi } from "@zodios/core";
import { z } from "zod";

export const experimentState = z.object({
  experiment_name: z.string().optional(),
  VAE_model: z.string(),
  plot_config: z.object({
    minimum_count: z.number().int().min(1),
    show_training_data: z.boolean(),
    show_bo_contour: z.boolean(),
  }),
  optimization_params: z.object({
    method_name: z.literal("qEI"),
    target_column_name: z.string(),
    query_budget: z.number().int().min(1),
  }),
  distribution_params: z.object({
    xlim_start: z.number(),
    xlim_end: z.number(),
    ylim_start: z.number(),
    ylim_end: z.number(),
  }),
  registered_values: z.object({
    sequences: z.array(z.string()),
    target_column_names: z.array(z.string()),
    target_values: z.array(z.array(z.union([z.null(), z.number()]))),
  }),
  query_data: z.object({
    sequences: z.array(z.string()),
    coords_x_original: z.array(z.number()),
    coords_y_original: z.array(z.number()),
  }),
  acquisition_data: z.object({
    coords_x: z.array(z.number()),
    coords_y: z.array(z.number()),
    values: z.array(z.number()),
  }),
});

// API POST /bayesopt/run
export const requestPostBayesoptRun = z.object({
  coords_x: z.array(z.number()).nonempty(),
  coords_y: z.array(z.number()).nonempty(),
  values: z.array(z.array(z.number()).nonempty()).nonempty(),
  optimization_params: z.object({
    method_name: z.literal("qEI"),
    query_budget: z.number().int().min(1),
  }),
  distribution_params: z.object({
    xlim_start: z.number(),
    xlim_end: z.number(),
    ylim_start: z.number(),
    ylim_end: z.number(),
    resolution: z.number().int().min(1).optional(),
  }),
});
export const responsePostBayesoptRun = z.object({
  acquisition_data: z.object({
    coords_x: z.array(z.number()).nonempty(),
    coords_y: z.array(z.number()).nonempty(),
    values: z.array(z.number()).nonempty(),
  }),
  query_data: z.object({
    coords_x: z.array(z.number()),
    coords_y: z.array(z.number()),
  }),
});

// API GET /api/bayesopt/items
// export const requestGetBayesoptItems = z.null();
export const responseGetBayesoptItems = z.array(
  z.object({
    uuid: z.string().uuid(),
    name: z.string().nonempty(),
    last_modified: z.number().int(),
  })
);

// API GET /api/bayesopt/items/{uuid}
// export const requestGetBayesoptItem = z.null();
export const responseGetBayesoptItem = experimentState;

// API PUT /api/bayesopt/items/{uuid}
export const requestPutBayesoptItem = experimentState;
export const responsePutBayesoptItem = z.null();

// API PATCH /api/bayesopt/items/{uuid}
export const requestPatchBayesoptItem = z.object({
  target: z.literal("experiment_name"),
  value: z.string().nonempty(),
});
export const responsePatchBayesoptItem = z.null();

// API DELETE /api/bayesopt/items/{uuid}
export const requestDeleteBayesoptItem = z.null();
export const responseDeleteBayesoptItem = z.null();

// API POST /api/bayesopt/submit
export const requestPostBayesoptSubmit = experimentState;
export const responsePostBayesoptSubmit = z.object({
  uuid: z.string().uuid(),
});

// API
export const apiBayesopt = makeApi([
  {
    alias: "runBayesopt",
    method: "post",
    path: "/bayesopt/run",
    description: "Run Bayesian optimization",
    parameters: [
      {
        name: "body",
        description: "Request body",
        type: "Body",
        schema: requestPostBayesoptRun,
      },
    ],
    response: responsePostBayesoptRun,
  },
  {
    alias: "listExperiments",
    method: "get",
    path: "/bayesopt/items",
    description: "List experiments for Bayesian optimization",
    response: responseGetBayesoptItems,
  },
  {
    alias: "getExperiment",
    method: "get",
    path: "/bayesopt/items/:uuid",
    description: "Get experiment for Bayesian optimization",
    parameters: [
      {
        name: "uuid",
        description: "Experiment UUID",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: responseGetBayesoptItem,
  },
  {
    alias: "updateExperiment",
    method: "put",
    path: "/bayesopt/items/:uuid",
    description: "Update state of experiment for Bayesian optimization",
    parameters: [
      {
        name: "uuid",
        description: "Experiment UUID",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "request",
        description: "Request body",
        type: "Body",
        schema: requestPutBayesoptItem,
      },
    ],
    response: responsePutBayesoptItem,
  },
  {
    alias: "patchExperiment",
    method: "patch",
    path: "/bayesopt/items/:uuid",
    description: "Patch state of experiment for Bayesian optimization",
    parameters: [
      {
        name: "uuid",
        description: "Experiment UUID",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "request",
        description: "Request body",
        type: "Body",
        schema: requestPatchBayesoptItem,
      },
    ],
    response: responsePatchBayesoptItem,
  },
  {
    alias: "deleteExperiment",
    method: "delete",
    path: "/bayesopt/items/:uuid",
    description: "Delete experiment for Bayesian optimization",
    parameters: [
      {
        name: "uuid",
        description: "Experiment UUID",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: responseDeleteBayesoptItem,
  },
  {
    alias: "submitExperiment",
    method: "post",
    path: "/bayesopt/submit",
    description: "Submit data as new experiment for Bayesian optimization",
    parameters: [
      {
        name: "request",
        description: "Request body",
        type: "Body",
        schema: requestPostBayesoptSubmit,
      },
    ],
    response: responsePostBayesoptSubmit,
  },
]);
