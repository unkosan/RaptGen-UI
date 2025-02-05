import { Action, ThunkAction, configureStore } from "@reduxjs/toolkit";

import graphConfigReducer from "./graph-config";
import sessionConfigReducer from "./session-config";
import vaeDataReducer from "./vae-data";
import registeredValuesReducer from "./registered-values";
import queriedValuesReducer from "./queried-values";
import bayesoptConfigReducer from "./bayesopt-config";
import experimentsListReducer from "./expeiments-list";
import acquisitionValuesReducer from "./acquisition-values";
import isDirtyReducer from "./is-dirty";
import isLoadingReducer from "./is-loading";

export const store = configureStore({
  reducer: {
    graphConfig: graphConfigReducer,
    sessionConfig: sessionConfigReducer,
    vaeData: vaeDataReducer,
    registeredValues: registeredValuesReducer,
    queriedValues: queriedValuesReducer,
    bayesoptConfig: bayesoptConfigReducer,
    experimentsData: experimentsListReducer,
    acquisitionValues: acquisitionValuesReducer,
    isDirty: isDirtyReducer,
    isLoading: isLoadingReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
// export type AppDispatch = typeof store.dispatch;
// export type AppThunk = ThunkAction<void, RootState, unknown, Action<string>>;
