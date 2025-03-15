import { configureStore } from "@reduxjs/toolkit";

import pageConfigReducer from "./page-config";
import preprocessingConfigReducer from "./preprocessing-config";
import selexDataReducer from "./selex-data";
import trainConfigReducer from "./train-config";

export const store = configureStore({
  reducer: {
    pageConfig: pageConfigReducer,
    preprocessingConfig: preprocessingConfigReducer,
    selexData: selexDataReducer,
    trainConfig: trainConfigReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
