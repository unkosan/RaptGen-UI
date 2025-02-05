import { Zodios } from "@zodios/core";
import { apiData } from "./route/data";
import { apiSession } from "./route/session";
import { apiTool } from "./route/tool";
import { apiTrain } from "./route/train";
import { apiUpload } from "./route/upload";
import { apiBayesopt } from "./route/bayesopt";
import { apiGMM } from "./route/gmm";

export const apiClient = new Zodios("http://localhost:18042/api", [
  ...apiData,
  ...apiSession,
  ...apiTool,
  ...apiTrain,
  ...apiUpload,
  ...apiBayesopt,
  ...apiGMM,
]);
