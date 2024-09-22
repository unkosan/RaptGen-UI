import { makeApi } from "@zodios/core";
import { z } from "zod";

// API POST /gmm/jobs/submit
export const requestPostGMMJobsSubmit = z.object({
  target: z.string(),
  params: z.object({
    minimum_n_components: z.number().int().min(1),
    maximum_n_components: z.number().int().min(1),
    step_size: z.number().int().min(1),
    n_trials: z.number().int().min(1),
  }),
});
export const responsePostGMMJobsSubmit = z.object({
  uuid: z.string().uuid(),
});

// API POST /gmm/jobs/search
export const requestPostGMMJobsSearch = z.object({
  status: z
    .array(z.enum(["success", "failure", "progress", "pending", "suspend"]))
    .optional(),
  search_regex: z.string().optional(),
});
export const responsePostGMMJobsSearch = z.array(
  z.object({
    uuid: z.string().uuid(),
    name: z.string(),
    status: z.enum(["success", "failure", "progress", "pending", "suspend"]),
    start: z.number().int(),
    duration: z.number().int(),
    trials_total: z.number().int(),
    trials_current: z.number().int(),
  })
);

// API GET /gmm/jobs/items/{uuid}
export const requestGetGMMJobsItems = z.null();
export const responseGetGMMJobsItems = z.union([
  z.object({
    uuid: z.string().uuid(),
    name: z.string().nonempty(),
    status: z.enum(["pending"]),
    start: z.number().int(),
    duration: z.number().int(),
    target: z.string(),
    params: z.object({
      minimum_n_components: z.number().int(),
      maximum_n_components: z.number().int(),
      step_size: z.number().int(),
      n_trials: z.number().int(),
    }),
  }),
  z.object({
    uuid: z.string().uuid(),
    name: z.string().nonempty(),
    status: z.enum(["failure"]),
    start: z.number().int(),
    duration: z.number().int(),
    target: z.string(),
    params: z.object({
      minimum_n_components: z.number().int(),
      maximum_n_components: z.number().int(),
      step_size: z.number().int(),
      n_trials: z.number().int(),
    }),
    error_msg: z.string(),
  }),
  z.object({
    uuid: z.string().uuid(),
    name: z.string().nonempty(),
    status: z.enum(["success"]),
    start: z.number().int(),
    duration: z.number().int(),
    target: z.string(),
    params: z.object({
      minimum_n_components: z.number().int(),
      maximum_n_components: z.number().int(),
      step_size: z.number().int(),
      n_trials: z.number().int(),
    }),
    gmm: z.object({
      current_n_components: z.number().int(),
      optimal_n_components: z.number().int(),
      means: z.array(z.array(z.number())),
      covs: z.array(z.array(z.array(z.number()))),
    }),
    latent: z.object({
      random_regions: z.array(z.string().nonempty()),
      coords_x: z.array(z.number()),
      coords_y: z.array(z.number()),
      duplicates: z.array(z.number()),
    }),
    bic: z.object({
      hue: z.array(z.number()),
      bic: z.array(z.number()),
    }),
  }),
  z.object({
    uuid: z.string().uuid(),
    name: z.string().nonempty(),
    status: z.enum(["progress", "suspend"]),
    start: z.number().int(),
    duration: z.number().int(),
    target: z.string(),
    params: z.object({
      minimum_n_components: z.number().int(),
      maximum_n_components: z.number().int(),
      step_size: z.number().int(),
      n_trials: z.number().int(),
    }),
    current_states: z.object({
      n_components: z.number().int(),
      trial: z.number().int(),
    }),
    gmm: z.object({
      current_n_components: z.number().int(),
      optimal_n_components: z.number().int(),
      means: z.array(z.array(z.number())),
      covs: z.array(z.array(z.array(z.number()))),
    }),
    latent: z.object({
      random_regions: z.array(z.string().nonempty()),
      coords_x: z.array(z.number()),
      coords_y: z.array(z.number()),
      duplicates: z.array(z.number()),
    }),
    bic: z.object({
      hue: z.array(z.number()),
      bic: z.array(z.number()),
    }),
  }),
]);

// API PATCH /gmm/jobs/items/{uuid}
export const requestPatchGMMJobsItems = z.object({
  target: z.enum(["target"]),
  value: z.string().nonempty(),
});
export const responsePatchGMMJobsItems = z.null();

// API DELETE /gmm/jobs/items/{uuid}
export const requestDeleteGMMJobsItems = z.null();
export const responseDeleteGMMJobsItems = z.null();

// API POST /gmm/jobs/suspend
export const requestPostGMMJobsSuspension = z.object({
  uuid: z.string().uuid(),
});
export const responsePostGMMJobsSuspension = z.null();

// API POST /gmm/jobs/resume
export const requestPostGMMJobsResume = z.object({
  uuid: z.string().uuid(),
});
export const responsePostGMMJobsResume = z.null();

// API POST /gmm/jobs/publish
export const requestPostGMMJobsPublish = z.object({
  uuid: z.string().uuid(),
  name: z.string().nonempty(),
});
export const responsePostGMMJobsPublish = z.null();

export const apiGMM = makeApi([
  {
    alias: "submitGMMJobs",
    method: "post",
    path: "/gmm/jobs/submit",
    description: "Submit GMM jobs",
    parameters: [
      {
        name: "request",
        description: "Request body",
        type: "Body",
        schema: requestPostGMMJobsSubmit,
      },
    ],
    response: responsePostGMMJobsSubmit,
  },
  {
    alias: "searchGMMJobs",
    method: "post",
    path: "/gmm/jobs/search",
    description: "Search GMM jobs",
    parameters: [
      {
        name: "request",
        description: "Request body",
        type: "Body",
        schema: requestPostGMMJobsSearch,
      },
    ],
    response: responsePostGMMJobsSearch,
  },
  {
    alias: "getGMMJobs",
    method: "get",
    path: "/gmm/jobs/items/:uuid",
    description: "Get GMM jobs",
    parameters: [
      {
        name: "uuid",
        description: "Job UUID",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "n_components",
        description: "Number of components",
        type: "Query",
        schema: z.number().int().optional(),
      },
    ],
    response: responseGetGMMJobsItems,
  },
  {
    alias: "updateGMMJobs",
    method: "patch",
    path: "/gmm/jobs/items/:uuid",
    description: "Update GMM jobs",
    parameters: [
      {
        name: "uuid",
        description: "Job UUID",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "request",
        description: "Request body",
        type: "Body",
        schema: requestPatchGMMJobsItems,
      },
    ],
    response: responsePatchGMMJobsItems,
  },
  {
    alias: "deleteGMMJobs",
    method: "delete",
    path: "/gmm/jobs/items/:uuid",
    description: "Delete GMM jobs",
    parameters: [
      {
        name: "uuid",
        description: "Job UUID",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: responseDeleteGMMJobsItems,
  },
  {
    alias: "suspendGMMJobs",
    method: "post",
    path: "/gmm/jobs/suspend",
    description: "Suspend GMM jobs",
    parameters: [
      {
        name: "request",
        description: "Request body",
        type: "Body",
        schema: requestPostGMMJobsSuspension,
      },
    ],
    response: responsePostGMMJobsSuspension,
  },
  {
    alias: "resumeGMMJobs",
    method: "post",
    path: "/gmm/jobs/resume",
    description: "Resume GMM jobs",
    parameters: [
      {
        name: "request",
        description: "Request body",
        type: "Body",
        schema: requestPostGMMJobsResume,
      },
    ],
    response: responsePostGMMJobsResume,
  },
  {
    alias: "publishGMMJobs",
    method: "post",
    path: "/gmm/jobs/publish",
    description: "Publish GMM jobs",
    parameters: [
      {
        name: "request",
        description: "Request body",
        type: "Body",
        schema: requestPostGMMJobsPublish,
      },
    ],
    response: responsePostGMMJobsPublish,
  },
]);
