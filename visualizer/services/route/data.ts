import { makeApi } from "@zodios/core";
import { z } from "zod";

// API GET /data/VAE-model-names
export const requestGetVAEModelNames = z.void();
export const responseGetVAEModelNames = z.object({
  entries: z.array(
    z.object({
      name: z.string().nonempty(),
      uuid: z.string().uuid(),
    })
  ),
});

// API GET /data/GMM-model-names
export const requestGetGMMModelNames = z.void();
export const responseGetGMMModelNames = z.object({
  entries: z.array(
    z.object({
      name: z.string().nonempty(),
      uuid: z.string().uuid(),
    })
  ),
});

// API GET /data/measured-data-names
// export const requestGetMeasuredDataNames = z.void();
// export const responseGetMeasuredDataNames = z.union([
//   z.object({
//     status: z.enum(["success"]),
//     data: z.array(z.string().nonempty()),
//   }),
//   z.object({
//     status: z.enum(["error"]),
//   }),
// ]);

// API GET /data/VAE-model-parameters
export const requestGetVAEModelParameters = z.void();
export const responseGetVAEModelParameters = z.record(z.string(), z.any());

// API GET /data/GMM-model-parameters
export const requestGetGMMModelParameters = z.void();
export const responseGetGMMModelParameters = z.record(z.string(), z.any());

// API GET /data/selex-data
export const requestGetSelexData = z.void();
export const responseGetSelexData = z.object({
  random_regions: z.array(z.string().nonempty()),
  duplicates: z.array(z.number()),
  coord_x: z.array(z.number()),
  coord_y: z.array(z.number()),
});

// API GET /data/GMM-model
export const requestGetGMMModel = z.void();
export const responseGetGMMModel = z.object({
  means: z.array(z.array(z.number()).length(2)).nonempty(),
  covariances: z.array(z.array(z.array(z.number()).length(2)).length(2)),
});

// API GET /data/measured-data
// export const requestGetMeasuredData = z.void();
// export const responseGetMeasuredData = z.union([
//   z.object({
//     status: z.enum(["success"]),
//     data: z.object({
//       hue: z.array(z.string()),
//       ID: z.array(z.union([z.string(), z.number()]).transform(String)),
//       Sequence: z.array(z.string()),
//     }),
//   }),
//   z.object({
//     status: z.enum(["error"]),
//   }),
// ]);

// API DELETE /data/items/{vae_uuid}
export const requestDeleteItems = z.void();
export const responseDeleteItems = z.null();

// API PATCH /data/items/{vae_uuid}
export const requestPatchItems = z.object({
  target: z.string().nonempty(),
  data: z.any(),
});
export const responsePatchItems = z.null();

export const apiData = makeApi([
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
        name: "vae_uuid",
        description: "UUID of the VAE model",
        type: "Query",
        schema: z.string().uuid(),
      },
    ],
    response: responseGetGMMModelNames,
  },
  // {
  //   alias: "getMeasuredDataNames",
  //   method: "get",
  //   path: "/data/measured-data-names",
  //   description: "Get measured data names",
  //   response: responseGetMeasuredDataNames,
  // },
  {
    alias: "getVAEModelParameters",
    method: "get",
    path: "/data/VAE-model-parameters",
    description: "Get VAE model parameters",
    parameters: [
      {
        name: "vae_uuid",
        description: "UUID of the VAE model",
        type: "Query",
        schema: z.string().uuid(),
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
        name: "gmm_uuid",
        description: "UUID of the GMM model",
        type: "Query",
        schema: z.string().uuid(),
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
        name: "vae_uuid",
        description: "UUID of the VAE model",
        type: "Query",
        schema: z.string().uuid(),
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
        name: "gmm_uuid",
        description: "UUID of the GMM model",
        type: "Query",
        schema: z.string().uuid(),
      },
    ],
    response: responseGetGMMModel,
  },
  // {
  //   alias: "getMeasuredData",
  //   method: "get",
  //   path: "/data/measured-data",
  //   description: "Get measured data",
  //   parameters: [
  //     {
  //       name: "measured_data_name",
  //       description: "Measured data name",
  //       type: "Query",
  //       schema: z.string().nonempty(),
  //     },
  //   ],
  //   response: responseGetMeasuredData,
  // },
  {
    alias: "deleteVaeItems",
    method: "delete",
    path: "/data/items/{vae_uuid}",
    description: "Delete items",
    parameters: [
      {
        name: "vae_uuid",
        description: "UUID of the VAE model",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: responseDeleteItems,
  },
  {
    alias: "patchVaeItems",
    method: "patch",
    path: "/data/items/{vae_uuid}",
    description: "Patch items",
    parameters: [
      {
        name: "vae_uuid",
        description: "UUID of the VAE model",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: responsePatchItems,
  },
]);
