import { makeApi } from "@zodios/core";
import { z } from "zod";

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

export const apiSession = makeApi([
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
]);
