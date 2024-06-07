import { Zodios } from "@zodios/core";
import { apiData } from "./route/data";
import { apiSession } from "./route/session";
import { apiTool } from "./route/tool";
import { apiTrain } from "./route/train";
import { apiUpload } from "./route/upload";

export const apiClient = new Zodios("http://localhost:3000/api", [
  ...apiData,
  ...apiSession,
  ...apiTool,
  ...apiTrain,
  ...apiUpload,
]);
