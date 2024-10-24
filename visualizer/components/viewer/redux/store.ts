import { configureStore } from "@reduxjs/toolkit";

import graphConfigReducer from "./graph-config";
import sessionConfigReducer from "./session-config";
import vaeDataReducer from "./vae-data";
import gmmDataReducer from "./gmm-data";
import measuredDataReducer from "./measured-data";
import encodeDataReducer from "./encode-data";
import decodeDataReducer from "./decode-data";
import graphDataReducer from "./graph-data";
import sessionConfigReducer2 from "./session-config2";
import graphConfigReducer2 from "./graph-config2";
import InteractionDataReducer from "./interaction-data";
import selectedPointsReducer from "./graph-data2";

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
    sessionConfig2: sessionConfigReducer2,
    graphConfig2: graphConfigReducer2,
    selectedPoints: selectedPointsReducer,
    interactionData: InteractionDataReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
