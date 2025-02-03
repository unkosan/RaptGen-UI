import { PayloadAction, createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import { apiClient } from "~/services/api-client";
// import { RootState } from "./store";

type SessionConfig = {
  vaeId: string; // UUID of the VAE model
  sessionId: string; // UUID of the session
};

const sessionConfigSlice = createSlice({
  name: "sessionConfig",
  initialState: {
    vaeId: "",
    sessionId: "",
  },
  reducers: {
    set: (state: SessionConfig, action: PayloadAction<SessionConfig>) => {
      return action.payload;
    },
    //   extraReducers: (builder) => {
    //     builder.addCase(fetchSessionIdThunk.fulfilled, (state, action) => {
    //       state.vaeId = action.payload.vaeId;
    //       state.sessionId = action.payload.sessionId;
    //     });
    //     builder.addCase(fetchSessionIdThunk.rejected, (state) => {
    //       console.log("Failed to start session");
    //       state.vaeId = "";
    //       state.sessionId = "";
    //     });
  },
});

// use thunk to dispatch async actions
// const fetchSessionIdThunk = createAsyncThunk(
//   "sessionConfig/setByVaeId",
//   async (vaeId: string, { getState }) => {
//     const state = getState() as RootState;
//     if (state.sessionConfig.sessionId !== "") {
//       await apiClient.endSession({
//         queries: {
//           session_id: state.sessionConfig.sessionId,
//         },
//       });
//     }

//     const res = await apiClient.startSession({
//       queries: {
//         vae_uuid: vaeId,
//       },
//     });

//     return {
//       vaeId: vaeId,
//       sessionId: res.uuid,
//     };
//   }
// );

const sessionConfigReducer = sessionConfigSlice.reducer;

export default sessionConfigReducer;
// export { fetchSessionIdThunk };
export type { SessionConfig };
