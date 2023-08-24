import { rest } from "msw";
import { dataHandlers } from "./route/data";
import { sessionHandlers } from "./route/session";
import { toolsHandlers } from "./route/tools";

export const mockURL = (path: string) => {
  return `http://localhost:8000/api${path}`;
};

export const handlers = [...dataHandlers, ...sessionHandlers, ...toolsHandlers];
