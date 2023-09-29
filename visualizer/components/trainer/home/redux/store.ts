import { configureStore } from "@reduxjs/toolkit";

import pageConfigReducer from "./page-config";
import lossDataReducer from "./loss-data";
import latentDataReducer from "./latent-data";

export const store = configureStore({
  reducer: {
    pageConfig: pageConfigReducer,
    lossData: lossDataReducer,
    latentData: latentDataReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
