import { PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { apiClient } from "~/services/api-client";
import { RootState } from "./store";

interface SessionConfigState {
  sessionId: string; // uuid of the vae inference session
  vaeId: string; // uuid of the vae model
  gmmId: string; // uuid of the gmm model
}

const initialState: SessionConfigState = {
  sessionId: "",
  vaeId: "",
  gmmId: "",
};

const setSessionConfigByVaeId = createAsyncThunk<
  SessionConfigState,
  string,
  {
    state: RootState;
  }
>("sessionConfig2/setByVaeId", async (vaeId: string, thunkAPI) => {
  const currentState: RootState = thunkAPI.getState();

  try {
    let newSessionId = "";
    if (vaeId !== "") {
      const resStart = await apiClient.startSession({
        queries: {
          vae_uuid: vaeId,
        },
      });
      newSessionId = resStart.uuid;
    }

    if (currentState.sessionConfig2.sessionId !== "") {
      await apiClient.endSession({
        queries: {
          session_uuid: currentState.sessionConfig2.sessionId,
        },
      });
    }

    return {
      sessionId: newSessionId,
      vaeId: vaeId,
      gmmId: "",
    };
  } catch (error) {
    console.error(error);
    return initialState;
  }
});

const sessionConfigSlice = createSlice({
  name: "sessionConfig2",
  initialState,
  reducers: {
    setSessionConfig: (state, action: PayloadAction<SessionConfigState>) => {
      return action.payload;
    },
    setGmmId: (state, action: PayloadAction<string>) => {
      state.gmmId = action.payload;
      return state;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(setSessionConfigByVaeId.fulfilled, (state, action) => {
      state.sessionId = action.payload.sessionId;
      state.vaeId = action.payload.vaeId;
      state.gmmId = action.payload.gmmId;
    });
  },
});

const sessionConfigReducer2 = sessionConfigSlice.reducer;

export default sessionConfigReducer2;
export const { setSessionConfig, setGmmId } = sessionConfigSlice.actions;
export type { SessionConfigState };
export { setSessionConfigByVaeId };
