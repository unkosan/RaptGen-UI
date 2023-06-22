import { rest } from "msw";
import { trainHandlers } from "./route/train";

export const mockURL = (path: string) => {
  return `http://localhost:8000/api${path}`;
};

export const handlers = [...trainHandlers];
