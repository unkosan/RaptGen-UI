import { configureStore } from "@reduxjs/toolkit";

import paramsReducer from "./params";
import paramsValidReducer from "./paramsValid";

export const store = configureStore({
  reducer: {
    params: paramsReducer,
    paramsValid: paramsValidReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
