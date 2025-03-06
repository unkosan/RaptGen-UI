import { configureStore } from "@reduxjs/toolkit";

import paramsReducer from "./params";
import paramsValidReducer from "./paramsValid";
import graphConfigReducer from "./graphConfig";

export const store = configureStore({
  reducer: {
    params: paramsReducer,
    paramsValid: paramsValidReducer,
    graphConfig: graphConfigReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
