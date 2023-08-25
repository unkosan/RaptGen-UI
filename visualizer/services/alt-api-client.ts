import { Zodios } from "@zodios/core";
import { z } from "zod";

// API GET /data/VAE-model-names
export const requestGetVAEModelNames = z.void();
export const responseGetVAEModelNames = z.union([
  z.object({
    status: z.enum(["success"]),
    data: z.array(z.string().nonempty()),
  }),
  z.object({
    status: z.enum(["error"]),
  }),
]);

// API GET /data/GMM-model-names
export const requestGetGMMModelNames = z.void();
export const responseGetGMMModelNames = z.union([
  z.object({
    status: z.enum(["success"]),
    data: z.array(z.string().nonempty()),
  }),
  z.object({
    status: z.enum(["error"]),
  }),
]);

// API GET /data/measured-data-names
export const requestGetMeasuredDataNames = z.void();
export const responseGetMeasuredDataNames = z.union([
  z.object({
    status: z.enum(["success"]),
    data: z.array(z.string().nonempty()),
  }),
  z.object({
    status: z.enum(["error"]),
  }),
]);

// API GET /data/VAE-model-parameters
export const requestGetVAEModelParameters = z.void();
export const responseGetVAEModelParameters = z.union([
  z.object({
    status: z.enum(["success"]),
    data: z.record(z.string(), z.any()),
  }),
  z.object({
    status: z.enum(["error"]),
  }),
]);

// API GET /data/GMM-model-parameters
export const requestGetGMMModelParameters = z.void();
export const responseGetGMMModelParameters = z.union([
  z.object({
    status: z.enum(["success"]),
    data: z.record(z.string(), z.any()),
  }),
  z.object({
    status: z.enum(["error"]),
  }),
]);

// API GET /data/selex-data
export const requestGetSelexData = z.void();
export const responseGetSelexData = z.union([
  z.object({
    status: z.enum(["success"]),
    data: z.object({
      Sequence: z.array(z.string().nonempty()),
      Duplicates: z.array(z.number()),
      Without_Adapters: z.array(z.string().nonempty()),
      coord_x: z.array(z.number()),
      coord_y: z.array(z.number()),
    }),
  }),
  z.object({
    status: z.enum(["error"]),
  }),
]);

// API GET /data/GMM-model
export const requestGetGMMModel = z.void();
export const responseGetGMMModel = z.union([
  z.object({
    status: z.enum(["success"]),
    data: z.object({
      weights: z.array(z.number()).nonempty(),
      means: z.array(z.array(z.number()).length(2)).nonempty(),
      covariances: z.array(z.array(z.array(z.number()).length(2)).length(2)),
    }),
  }),
  z.object({
    status: z.enum(["error"]),
  }),
]);

// API GET /data/measured-data
export const requestGetMeasuredData = z.void();
export const responseGetMeasuredData = z.union([
  z.object({
    status: z.enum(["success"]),
    data: z.object({
      hue: z.array(z.string()),
      ID: z.array(z.number()),
      Sequence: z.array(z.string()),
    }),
  }),
  z.object({
    status: z.enum(["error"]),
  }),
]);

// SESSION API

// API GET /session/start
export const requestGetStartSession = z.void();
export const responseGetStartSession = z.union([
  z.object({
    status: z.enum(["success"]),
    data: z.number(),
  }),
  z.object({
    status: z.enum(["error"]),
  }),
]);

// API GET /session/end
export const requestGetEndSession = z.void();
export const responseGetEndSession = z.object({
  status: z.enum(["success", "error"]),
});

// API GET /session/status
export const requestGetSessionStatus = z.void();
export const responseGetSessionStatus = z.union([
  z.object({
    status: z.enum(["success"]),
    data: z.array(z.number()),
  }),
  z.object({
    status: z.enum(["error"]),
  }),
]);

// API POST /session/encode
export const requestPostEncode = z.object({
  session_id: z.number().int(),
  sequences: z.array(z.string().regex(/^[AUTCG]+$/i)).nonempty(),
});
export const responsePostEncode = z.union([
  z.object({
    status: z.enum(["success"]),
    data: z.array(
      z.object({
        coord_x: z.number(),
        coord_y: z.number(),
      })
    ),
  }),
  z.object({
    status: z.enum(["error"]),
  }),
]);

// API POST /session/decode
export const requestPostDecode = z.object({
  session_id: z.number().int(),
  coords: z
    .array(
      z.object({
        coord_x: z.number(),
        coord_y: z.number(),
      })
    )
    .nonempty(),
});
export const responsePostDecode = z.union([
  z.object({
    status: z.enum(["success"]),
    data: z.array(z.string()),
  }),
  z.object({
    status: z.enum(["error"]),
  }),
]);

// API POST /session/decode/weblogo (return image)
export const requestPostWeblogo = z.object({
  session_id: z.number().int(),
  coords: z
    .array(
      z.object({
        coord_x: z.number(),
        coord_y: z.number(),
      })
    )
    .nonempty(),
});
export const responsePostWeblogo = z.string().nonempty();

// API POST /upload/estimate-target-length
export const requestPostEstimateTargetLength = z.object({
  sequences: z.array(z.string().regex(/^[AUTCG]+$/i)).nonempty(),
});
export const responsePostEstimateTargetLength = z.union([
  z.object({
    status: z.enum(["success"]),
    data: z.number(),
  }),
  z.object({
    status: z.enum(["error"]),
  }),
]);

// API POST /upload/estimate-adapters
export const requestPostEstimateAdapters = z.object({
  sequences: z.array(z.string().regex(/^[AUTCG]+$/i)).nonempty(),
  target_length: z.number().int().min(1),
});
export const responsePostEstimateAdapters = z.union([
  z.object({
    status: z.enum(["success"]),
    data: z.array(
      z.object({
        forward_adapter: z.string(),
        reverse_adapter: z.string(),
      })
    ),
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
export const responsePostValidateGMMModel = z.object({
  status: z.enum(["success", "error"]),
});

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

// TOOLS API

export const requestGetSecondaryStructureImage = z.void();
export const responseGetSecondaryStructureImage = z.string();

// API
export const altApiClient = new Zodios("http://localhost:8000/api", [
  {
    alias: "hello",
    method: "get",
    path: "/",
    description: "Hello world",
    request: z.void(),
    response: z.object({
      message: z.string(),
    }),
  },
  {
    alias: "getVAEModelNames",
    method: "get",
    path: "/data/VAE-model-names",
    description: "Get VAE model names",
    response: responseGetVAEModelNames,
  },
  {
    alias: "getGMMModelNames",
    method: "get",
    path: "/data/GMM-model-names",
    description: "Get GMM model names",
    parameters: [
      {
        name: "VAE_model_name",
        description: "VAE model name",
        type: "Query",
        schema: z.string().nonempty(),
      },
    ],
    response: responseGetGMMModelNames,
  },
  {
    alias: "getMeasuredDataNames",
    method: "get",
    path: "/data/measured-data-names",
    description: "Get measured data names",
    response: responseGetMeasuredDataNames,
  },
  {
    alias: "getVAEModelParameters",
    method: "get",
    path: "/data/VAE-model-parameters",
    description: "Get VAE model parameters",
    parameters: [
      {
        name: "VAE_model_name",
        description: "VAE model name",
        type: "Query",
        schema: z.string().nonempty(),
      },
    ],
    response: responseGetVAEModelParameters,
  },
  {
    alias: "getGMMModelParameters",
    method: "get",
    path: "/data/GMM-model-parameters",
    description: "Get GMM model parameters",
    parameters: [
      {
        name: "VAE_model_name",
        description: "VAE model name",
        type: "Query",
        schema: z.string().nonempty(),
      },
      {
        name: "GMM_model_name",
        description: "GMM model name",
        type: "Query",
        schema: z.string().nonempty(),
      },
    ],
    response: responseGetGMMModelParameters,
  },
  {
    alias: "getSelexData",
    method: "get",
    path: "/data/selex-data",
    description: "Get selex data",
    parameters: [
      {
        name: "VAE_model_name",
        description: "VAE model name",
        type: "Query",
        schema: z.string().nonempty(),
      },
    ],
    response: responseGetSelexData,
  },
  {
    alias: "getGMMModel",
    method: "get",
    path: "/data/GMM-model",
    description: "Get GMM model",
    parameters: [
      {
        name: "VAE_model_name",
        description: "VAE model name",
        type: "Query",
        schema: z.string().nonempty(),
      },
      {
        name: "GMM_model_name",
        description: "GMM model name",
        type: "Query",
        schema: z.string().nonempty(),
      },
    ],
    response: responseGetGMMModel,
  },
  {
    alias: "getMeasuredData",
    method: "get",
    path: "/data/measured-data",
    description: "Get measured data",
    parameters: [
      {
        name: "measured_data_name",
        description: "Measured data name",
        type: "Query",
        schema: z.string().nonempty(),
      },
    ],
    response: responseGetMeasuredData,
  },
  {
    alias: "startSession",
    method: "get",
    path: "/session/start",
    description: "Start session",
    parameters: [
      {
        name: "VAE_name",
        description: "VAE model name",
        type: "Query",
        schema: z.string().nonempty(),
      },
    ],
    response: responseGetStartSession,
  },
  {
    alias: "endSession",
    method: "get",
    path: "/session/end",
    description: "End session",
    parameters: [
      {
        name: "session_id",
        description: "Session ID",
        type: "Query",
        schema: z.number().int(),
      },
    ],
    response: responseGetEndSession,
  },
  {
    alias: "getSessionStatus",
    method: "get",
    path: "/session/status",
    description: "Get session status",
    response: responseGetSessionStatus,
  },
  {
    alias: "encode",
    method: "post",
    path: "/session/encode",
    description: "Encode sequences",
    parameters: [
      {
        name: "request",
        description: "Request body",
        type: "Body",
        schema: requestPostEncode,
      },
    ],
    response: responsePostEncode,
  },
  {
    alias: "decode",
    method: "post",
    path: "/session/decode",
    description: "Decode coordinates",
    parameters: [
      {
        name: "request",
        description: "Request body",
        type: "Body",
        schema: requestPostDecode,
      },
    ],
    response: responsePostDecode,
  },
  {
    alias: "getWeblogo",
    method: "post",
    path: "/session/decode/weblogo",
    description: "Get weblogo",
    parameters: [
      {
        name: "request",
        description: "Request body",
        type: "Body",
        schema: requestPostWeblogo,
      },
    ],
    response: responsePostWeblogo,
  },
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
  {
    alias: "getSecondaryStructureImage",
    method: "get",
    path: "/tool/secondary-structure",
    description: "Get secondary structure image",
    parameters: [
      {
        name: "sequence",
        description: "Sequence",
        type: "Query",
        schema: z.string().nonempty(),
      },
    ],
    response: responseGetSecondaryStructureImage,
  },
]);
