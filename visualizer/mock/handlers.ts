import { rest } from "msw";
import { dataHandlers } from "./route/data";
import { sessionHandlers } from "./route/session";

export const mockURL = (path: string) => {
  return `http://localhost:8000/api${path}`;
};

export const handlers = [...dataHandlers, ...sessionHandlers];
