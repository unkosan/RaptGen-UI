import { makeApi } from "@zodios/core";
import { z } from "zod";

// API GET /tool/secondary-structure

export const requestGetSecondaryStructureImage = z.void();
export const responseGetSecondaryStructureImage = z.string();

export const apiTool = makeApi([
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
