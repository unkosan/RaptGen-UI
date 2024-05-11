import { makeApi } from "@zodios/core";
import { z } from "zod";

// API POST /upload/estimate-target-length
export const requestPostEstimateTargetLength = z.object({
  sequences: z.array(z.string().regex(/^[AUTCG]*$/i)).nonempty(),
});
export const responsePostEstimateTargetLength = z.union([
  z.object({
    status: z.enum(["success"]),
    data: z.object({
      target_length: z.number(),
    }),
  }),
  z.object({
    status: z.enum(["error"]),
  }),
]);

// API POST /upload/estimate-adapters
export const requestPostEstimateAdapters = z.object({
  sequences: z.array(z.string().regex(/^[AUTCG]*$/i)).nonempty(),
  target_length: z.number().int().min(1),
});
export const responsePostEstimateAdapters = z.union([
  z.object({
    status: z.enum(["success"]),
    data: z.object({
      forward_adapter: z.string(),
      reverse_adapter: z.string(),
    }),
  }),
  z.object({
    status: z.enum(["error"]),
  }),
]);

// API POST /upload/validate-pHMM-model
export const requestPostValidatepHMMModel = z.object({
  state_dict: z.instanceof(Blob),
});
export const responsePostValidatepHMMModel = z.object({
  status: z.enum(["success", "error"]),
});

// API POST /upload/validate-GMM-model
export const requestPostValidateGMMModel = z.object({
  gmm_data: z.instanceof(Blob),
});
export const responsePostValidateGMMModel = z.union([
  z.object({
    status: z.enum(["success"]),
    data: z.object({
      num_components: z.number(),
      weights: z.array(z.number()),
      means: z.array(z.array(z.number())),
      covariances: z.array(z.array(z.array(z.number()))),
    }),
  }),
  z.object({
    status: z.enum(["error"]),
    message: z.string(),
  }),
]);

// API POST /upload/upload-vae
export const requestPostUploadVAE = z.object({
  // required
  model: z.instanceof(Blob),
  model_name: z.string(),
  target_length: z.number().transform(String),
  forward_adapter: z.string(),
  reverse_adapter: z.string(),
  sequences: z.array(z.string()).transform((strArray) => strArray.join(",")),
  coord_x: z.array(z.number()).transform((numArray) => numArray.join(",")),
  coord_y: z.array(z.number()).transform((numArray) => numArray.join(",")),
  duplicates: z
    .array(z.number().int().min(1))
    .transform((numArray) => numArray.join(",")),
  // optional
  published_time: z.string().datetime().optional(),
  experiment_name: z.string().nonempty().optional(),
  round_name: z.string().nonempty().optional(),
  tolerance: z.number().int().min(0).transform(String).optional(),
  minimum_count: z.number().int().min(1).transform(String).optional(),
  epochs: z.number().int().min(1).transform(String).optional(),
  beta_weighting_epochs: z.number().int().min(0).transform(String).optional(),
  match_forcing_epochs: z.number().int().min(0).transform(String).optional(),
  match_cost: z.number().transform(String).optional(),
  early_stopping_patience: z.number().transform(String).optional(),
  CUDA_num_threads: z.number().int().min(0).transform(String).optional(),
  CUDA_pin_memory: z.boolean().optional(),
  seed: z.number().transform(String).optional(),
});
export const responsePostUploadVAE = z.object({
  status: z.enum(["success", "error"]),
});

// API POST /upload/upload-gmm
export const requestPostUploadGMM = z.object({
  // required
  model: z.instanceof(Blob),
  VAE_model_name: z.string().nonempty(),
  GMM_model_name: z.string().nonempty(),
  // optional
  seed: z.number().transform(String).optional(),
  model_type: z.string().optional(),
  num_components: z.number().int().min(0).transform(String).optional(),
});
export const responsePostUploadGMM = z.object({
  status: z.enum(["success", "error"]),
});

// API GET /upload/batch-encode
export const requestGetBatchEncode = z.void();
export const responseGetBatchEncode = z.union([
  z.object({
    state: z.enum(["PENDING"]),
    status: z.string(),
    result: z.array(z.array(z.any())),
  }),
  z.object({
    state: z.enum(["PROGRESS"]),
    status: z.string(),
    result: z.array(z.array(z.any())),
  }),
  z.object({
    state: z.enum(["SUCCESS"]),
    status: z.string(),
    result: z.array(z.array(z.any())),
  }),
  z.object({
    state: z.enum(["FAILURE"]),
    status: z.string(),
    result: z.array(z.array(z.any())),
  }),
]);

// API POST /upload/batch-encode
export const requestPostBatchEncode = z.object({
  state_dict: z.instanceof(Blob),
  seqs: z
    .array(z.string().regex(/^[AUTCG]+$/i))
    .transform((strArray) => strArray.join(",")),
});
export const responsePostBatchEncode = z.union([
  z.object({
    status: z.enum(["success"]),
    data: z.object({
      task_id: z.string().uuid(),
    }),
  }),
  z.object({
    status: z.enum(["error"]),
  }),
]);

// API POST /api/upload/batch-encode/kill
export const requestPostBatchEncodeKill = z.void();
export const responsePostBatchEncodeKill = z.object({
  state: z.enum(["success", "error"]),
});

export const apiUpload = makeApi([
  {
    alias: "estimateTargetLength",
    method: "post",
    path: "/upload/estimate-target-length",
    description: "Estimate target length",
    parameters: [
      {
        name: "request",
        description: "Request body",
        type: "Body",
        schema: requestPostEstimateTargetLength,
      },
    ],
    response: responsePostEstimateTargetLength,
  },
  {
    alias: "estimateAdapters",
    method: "post",
    path: "/upload/estimate-adapters",
    description: "Estimate adapters",
    parameters: [
      {
        name: "request",
        description: "Request body",
        type: "Body",
        schema: requestPostEstimateAdapters,
      },
    ],
    response: responsePostEstimateAdapters,
  },
  {
    alias: "validatepHMMModel",
    method: "post",
    path: "/upload/validate-pHMM-model",
    description: "Validate pHMM model",
    requestFormat: "form-data",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: requestPostValidatepHMMModel,
      },
    ],
    response: responsePostValidatepHMMModel,
  },
  {
    alias: "validateGMMModel",
    method: "post",
    path: "/upload/validate-GMM-model",
    description: "Validate GMM model",
    requestFormat: "form-data",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: requestPostValidateGMMModel,
      },
    ],
    response: responsePostValidateGMMModel,
  },
  {
    alias: "uploadVAE",
    method: "post",
    path: "/upload/upload-vae",
    description: "Upload VAE",
    requestFormat: "form-data",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: requestPostUploadVAE,
      },
    ],
    response: responsePostUploadVAE,
  },
  {
    alias: "uploadGMM",
    method: "post",
    path: "/upload/upload-gmm",
    description: "Upload GMM",
    requestFormat: "form-data",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: requestPostUploadGMM,
      },
    ],
    response: responsePostUploadGMM,
  },
  {
    alias: "getBatchEncodeStatus",
    method: "get",
    path: "/upload/batch-encode",
    description: "Batch encode sequences (GET current status)",
    parameters: [
      {
        name: "task_id",
        description: "Task ID",
        type: "Query",
        schema: z.string().uuid(),
      },
    ],
    response: responseGetBatchEncode,
  },
  {
    alias: "batchEncode",
    method: "post",
    path: "/upload/batch-encode",
    description: "Batch encode sequences",
    requestFormat: "form-data",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: requestPostBatchEncode,
      },
    ],
    response: responsePostBatchEncode,
  },
  {
    alias: "batchEncodeKill",
    method: "post",
    path: "/upload/batch-encode/kill",
    description: "Kill batch encode task",
    parameters: [
      {
        name: "task_id",
        description: "Task ID",
        type: "Query",
        schema: z.string().uuid(),
      },
    ],
    response: responsePostBatchEncodeKill,
  },
]);
