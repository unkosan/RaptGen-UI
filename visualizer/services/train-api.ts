import { Zodios } from "@zodios/core";
import { z } from "zod";

// API POST /train/device/process
// export const paramGetDevices = z.void();
export const requestGetDevices = z.void();
export const responseGetDevices = z.array(z.string());

// API POST /train/jobs/submit
// export const paramPostSubmitJob = z.void();
export const requestPostSubmitJob = z.object({
  type: z.enum(["RaptGen", "RaptGen-freq", "RaptGen-logfreq"]),
  name: z.string().nonempty(),
  params_preprocessing: z.object({
    forward: z.string(),
    reverse: z.string(),
    random_region_length: z.number().int().min(1),
    tolerance: z.number().int().min(0),
    minimum_count: z.number().int().min(1),
  }),
  random_regions: z.array(z.string().nonempty()),
  duplicates: z.array(z.number().int().min(1)),
  reiteration: z.number().int().min(1),
  params_training: z.record(z.string(), z.any()),
});
export const responsePostSubmitJob = z.null();

// API POST /train/jobs/search
// export const paramPostSearchJobs = z.void();
export const requestPostSearchJobs = z.object({
  status: z.optional(
    z.array(z.enum(["success", "failure", "progress", "pending", "suspend"]))
  ),
  search_regex: z.optional(z.string()),
  is_multiple: z.optional(z.boolean()),
  type: z.optional(
    z.array(z.enum(["RaptGen", "RaptGen-freq", "RaptGen-logfreq"]))
  ),
});
export const responsePostSearchJobs = z.array(
  z.object({
    uuid: z.string().uuid(),
    name: z.string().nonempty(),
    type: z.enum(["RaptGen", "RaptGen-freq", "RaptGen-logfreq"]),
    status: z.enum(["success", "failure", "progress", "pending", "suspend"]),
    start: z.number().int().min(0),
    duration: z.number().int().min(0),
    reiteration: z.number().int().min(1),
    series: z.array(
      z.object({
        item_id: z.number().int().min(0),
        item_start: z.number().int().min(0),
        item_duration: z.number().int().min(0),
        item_status: z.enum([
          "success",
          "failure",
          "progress",
          "pending",
          "suspend",
        ]),
        item_epochs_total: z.number().int().min(0),
        item_epochs_current: z.number().int().min(0),
      })
    ),
  })
);

// API GET train/jobs/items/{parent_uuid}
// export const paramGetItem = z.object({
//   parent_uuid: z.string().uuid(),
// });
export const requestGetItem = z.void();
export const responseGetItem = z.object({
  uuid: z.string().uuid(),
  name: z.string().nonempty(),
  type: z.enum(["RaptGen", "RaptGen-freq", "RaptGen-logfreq"]),
  status: z.enum(["success", "failure", "progress", "pending", "suspend"]),
  start: z.number().int().min(0),
  duration: z.number().int().min(0),
  reiteration: z.number().int().min(1),
  params_training: z.record(z.string(), z.any()),
  summary: z.object({
    indices: z.array(z.number().int().min(0)),
    statuses: z.array(
      z.enum(["success", "failure", "progress", "pending", "suspend"])
    ),
    epochs_finished: z.array(z.number().int().min(0)),
    minimum_NLLs: z.array(z.number().min(0)),
  }),
});

// API GET train/jobs/items/{parent_uuid}/{child_id}
// export const paramGetItemChild = z.void();
export const requestGetItemChild = z.object({
  parent_uuid: z.string().uuid(),
  child_id: z.number().int().min(0),
});
export const responseGetItemChild = z.union([
  z.object({
    uuid: z.string().uuid(),
    id: z.number().int().min(0),
    status: z.enum(["success", "progress", "suspend"]),
    start: z.number().int().min(0),
    duration: z.number().int().min(0),
    latent: z.object({
      random_regions: z.array(z.string().nonempty()),
      coords_x: z.array(z.number()),
      coords_y: z.array(z.number()),
      duplicates: z.array(z.number().int().min(1)),
    }),
    losses: z.object({
      train_loss: z.array(z.number()),
      test_los: z.array(z.number()),
      test_recon: z.array(z.number()),
      test_kld: z.array(z.number()),
    }),
  }),
  z.object({
    uuid: z.string().uuid(),
    id: z.number().int().min(0),
    status: z.enum(["failure"]),
    start: z.number().int().min(0),
    duration: z.number().int().min(0),
    error_msg: z.string(),
  }),
  z.object({
    uuid: z.string().uuid(),
    id: z.number().int().min(0),
    status: z.enum(["pending"]),
    start: z.number().int().min(0),
    duration: z.number().int().min(0),
  }),
]);

// API DELETE train/jobs/items/{parent_uuid}
// export const paramDeleteItem = z.object({
//   parent_uuid: z.string().uuid(),
// });
export const requestDeleteItem = z.void();
export const responseDeleteItem = z.null();

// API POST train/jobs/kill
// export const paramPostKill = z.void();
export const requestPostKill = z.object({
  uuid: z.string().uuid(),
});
export const responsePostKill = z.null();

// API POST train/jobs/suspend
// export const paramPostSuspend = z.void();
export const requestPostSuspend = z.object({
  uuid: z.string().uuid(),
});
export const responsePostSuspend = z.null();

// API POST train/jobs/resume
// export const paramPostResume = z.void();
export const requestPostResume = z.object({
  uuid: z.string().uuid(),
});
export const responsePostResume = z.null();

// API POST train/jobs/publish
// export const paramPostPublish = z.void();
export const requestPostPublish = z.object({
  uuid: z.string().uuid(),
});
export const responsePostPublish = z.null();

export const apiClient = new Zodios("http://localhost:3000/api", [
  {
    alias: "hello",
    method: "get",
    path: "/",
    description: "Hello world",
    response: z.object({
      message: z.string(),
    }),
  },
  {
    alias: "getDevices",
    method: "get",
    path: "/train/device/process",
    description: "Get available devices",
    response: responseGetDevices,
  },
  {
    alias: "postSubmitJob",
    method: "post",
    path: "/train/jobs/submit",
    description: "Submit a job",
    parameters: [
      {
        name: "request",
        description: "Request body",
        type: "Body",
        schema: requestPostSubmitJob,
      },
    ],
    response: responsePostSubmitJob,
  },
  {
    alias: "postSearchJobs",
    method: "post",
    path: "/train/jobs/search",
    description: "Search jobs",
    parameters: [
      {
        name: "request",
        description: "Request body",
        type: "Body",
        schema: requestPostSearchJobs,
      },
    ],
    response: responsePostSearchJobs,
  },
  {
    alias: "getItem",
    method: "get",
    path: "/train/jobs/items/:parent_uuid",
    description: "Get info of a job",
    parameters: [
      {
        name: "parent_uuid",
        description: "UUID of the job",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: responseGetItem,
  },
  {
    alias: "getChildItem",
    method: "get",
    path: "/train/jobs/items/:parent_uuid/:child_id",
    description: "Get info of children jobs",
    parameters: [
      {
        name: "parent_uuid",
        description: "UUID of the job",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "child_id",
        description: "ID of the child job",
        type: "Path",
        schema: z
          .number()
          .int()
          .min(0)
          .transform((v) => String(v))
          .pipe(z.string()),
      },
    ],
    response: responseGetItemChild,
  },
  {
    alias: "deleteItem",
    method: "delete",
    path: "/train/jobs/items/:parent_uuid",
    description: "Delete a job",
    parameters: [
      {
        name: "parent_uuid",
        description: "UUID of the job",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: responseDeleteItem,
  },
  {
    alias: "postKill",
    method: "post",
    path: "/train/jobs/kill",
    description: "Kill a job",
    parameters: [
      {
        name: "request",
        description: "Request body",
        type: "Body",
        schema: requestPostKill,
      },
    ],
    response: responsePostKill,
  },
  {
    alias: "postSuspend",
    method: "post",
    path: "/train/jobs/suspend",
    description: "Suspend a job",
    parameters: [
      {
        name: "request",
        description: "Request body",
        type: "Body",
        schema: requestPostSuspend,
      },
    ],
    response: responsePostSuspend,
  },
  {
    alias: "postResume",
    method: "post",
    path: "/train/jobs/resume",
    description: "Resume a job",
    parameters: [
      {
        name: "request",
        description: "Request body",
        type: "Body",
        schema: requestPostResume,
      },
    ],
    response: responsePostResume,
  },
  {
    alias: "postPublish",
    method: "post",
    path: "/train/jobs/publish",
    description: "Publish a job",
    parameters: [
      {
        name: "request",
        description: "Request body",
        type: "Body",
        schema: requestPostPublish,
      },
    ],
    response: responsePostPublish,
  },
]);
