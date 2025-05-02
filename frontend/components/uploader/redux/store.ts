import { configureStore } from "@reduxjs/toolkit";

import vaeDataReducer from "./vae-data";
import gmmConfigReducer from "./gmm-config";
import measuredDataReducer from "./measured-data";
import uploadConfigReducer from "./upload-config";
import vaeConfigReducer from "./vae-config";

export const store = configureStore({
  reducer: {
    uploadConfig: uploadConfigReducer,
    vaeConfig: vaeConfigReducer,
    vaeData: vaeDataReducer,
    gmmConfig: gmmConfigReducer,
    measuredData: measuredDataReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
