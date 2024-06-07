import { configureStore } from "@reduxjs/toolkit";

import graphConfigReducer from "./graph-config";
import sessionConfigReducer from "./session-config";
import vaeDataReducer from "./vae-data";
import gmmDataReducer from "./gmm-data";
import measuredDataReducer from "./measured-data";
import encodeDataReducer from "./encode-data";
import decodeDataReducer from "./decode-data";
import graphDataReducer from "./graph-data";

export const store = configureStore({
  reducer: {
    graphConfig: graphConfigReducer,
    sessionConfig: sessionConfigReducer,
    vaeData: vaeDataReducer,
    gmmData: gmmDataReducer,
    measuredData: measuredDataReducer,
    encodeData: encodeDataReducer,
    decodeData: decodeDataReducer,
    graphData: graphDataReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
