import { configureStore } from "@reduxjs/toolkit";
import simpleParamsReducer from "./test";

export const store = configureStore({
  reducer: {
    simpleParams: simpleParamsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
