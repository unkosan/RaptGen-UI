import { makeApi } from "@zodios/core";
import { z } from "zod";

// API GET /session/start
export const requestGetStartSession = z.void();
export const responseGetStartSession = z.object({
  uuid: z.string().uuid(),
});

// API GET /session/end
export const requestGetEndSession = z.void();
export const responseGetEndSession = z.null();

// API GET /session/status
export const requestGetSessionStatus = z.void();
export const responseGetSessionStatus = z.object({
  entries: z.array(z.string().uuid()),
});

// API POST /session/encode
export const requestPostEncode = z.object({
  session_uuid: z.string().uuid(),
  sequences: z.array(z.string().regex(/^[AUTCG]+$/i)).nonempty(),
});
export const responsePostEncode = z.object({
  coords_x: z.array(z.number()),
  coords_y: z.array(z.number()),
});

// API POST /session/decode
export const requestPostDecode = z.object({
  session_uuid: z.string().uuid(),
  coords_x: z.array(z.number()).nonempty(),
  coords_y: z.array(z.number()).nonempty(),
});
export const responsePostDecode = z.object({
  sequences: z.array(z.string()).nonempty(),
});

// API POST /session/decode/weblogo (return image)
export const requestPostWeblogo = z.object({
  session_uuid: z.string().uuid(),
  coords_x: z.array(z.number()).length(1),
  coords_y: z.array(z.number()).length(1),
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
        name: "vae_uuid",
        description: "UUID of the VAE model",
        type: "Query",
        schema: z.string().uuid(),
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
        name: "session_uuid",
        description: "Session ID",
        type: "Query",
        schema: z.string().uuid(),
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
