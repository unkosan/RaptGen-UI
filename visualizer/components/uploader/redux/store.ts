import { configureStore } from "@reduxjs/toolkit";

import vaeDataReducer from "./vae-data";
import gmmDataReducer from "./gmm-data";
import measuredDataReducer from "./measured-data";
import uploadConfigReducer from "./upload-config";
import vaeConfigReducer from "./vae-config";

export const store = configureStore({
  reducer: {
    uploadConfig: uploadConfigReducer,
    vaeConfig: vaeConfigReducer,
    vaeData: vaeDataReducer,
    gmmData: gmmDataReducer,
    measuredData: measuredDataReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
