import { configureStore } from "@reduxjs/toolkit";

import lossDataReducer from "./loss-data";
import latentDataReducer from "./latent-data";

export const store = configureStore({
  reducer: {
    lossData: lossDataReducer,
    latentData: latentDataReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
