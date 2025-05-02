import { trainHandlers } from "./route/train";
import { dataHandlers } from "./route/data";
import { sessionHandlers } from "./route/session";
import { toolsHandlers } from "./route/tools";
import { bayesoptHandlers } from "./route/bayesopt";
import { gmmHandlers } from "./route/gmm";

export const mockURL = (path: string) => {
  return `http://localhost:18042/api${path}`;
};

export const handlers = [
  ...trainHandlers,
  ...dataHandlers,
  ...sessionHandlers,
  ...toolsHandlers,
  ...bayesoptHandlers,
  ...gmmHandlers,
  // Not needed for now
];
