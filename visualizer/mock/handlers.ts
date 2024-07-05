import { trainHandlers } from "./route/train";
import { dataHandlers } from "./route/data";
import { sessionHandlers } from "./route/session";
import { toolsHandlers } from "./route/tools";
import { bayesoptHandlers } from "./route/bayesopt";

export const mockURL = (path: string) => {
  return `http://localhost:3000/api${path}`;
};

export const handlers = [
  ...trainHandlers,
  ...dataHandlers,
  ...sessionHandlers,
  ...toolsHandlers,
  ...bayesoptHandlers,
  // Not needed for now
];
