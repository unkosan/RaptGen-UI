import { rest } from "msw";
import { trainHandlers } from "./route/train";
// import { dataHandlers } from "./route/data";
// import { sessionHandlers } from "./route/session";
// import { toolsHandlers } from "./route/tools";

export const mockURL = (path: string) => {
  return `http://localhost:8000/api${path}`;
};

export const handlers = [
  ...trainHandlers,
  // ...dataHandlers,
  // ...sessionHandlers,
  // ...toolsHandlers,
  // Not needed for now
];
