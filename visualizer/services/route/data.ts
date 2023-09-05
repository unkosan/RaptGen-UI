import { makeApi } from "@zodios/core";
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
      ID: z.array(z.union([z.string(), z.number()]).transform(String)),
      Sequence: z.array(z.string()),
    }),
  }),
  z.object({
    status: z.enum(["error"]),
  }),
]);

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
]);
