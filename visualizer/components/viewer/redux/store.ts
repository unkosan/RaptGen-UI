import { configureStore } from "@reduxjs/toolkit";

// import measuredDataReducer from "./measured-data";
import sessionConfigReducer from "./session-config";
import graphConfigReducer from "./graph-config";
import InteractionDataReducer from "./interaction-data";
import selectedPointsReducer from "./selected-points";

export const store = configureStore({
  reducer: {
    // measuredData: measuredDataReducer,
    sessionConfig: sessionConfigReducer,
    graphConfig: graphConfigReducer,
    selectedPoints: selectedPointsReducer,
    interactionData: InteractionDataReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
