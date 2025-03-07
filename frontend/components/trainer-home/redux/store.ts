import { configureStore } from "@reduxjs/toolkit";

import graphConfigReducer from "./graph-config";

export const store = configureStore({
  reducer: {
    graphConfig: graphConfigReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
