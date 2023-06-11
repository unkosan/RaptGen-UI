import { configureStore } from "@reduxjs/toolkit";

import pageConfigReducer from "./page-config";

export const store = configureStore({
  reducer: {
    pageConfig: pageConfigReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
