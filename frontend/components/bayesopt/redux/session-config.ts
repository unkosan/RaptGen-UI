import { PayloadAction, createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { apiClient } from "~/services/api-client";
import { RootState } from "./store";

interface SessionConfigState {
  sessionId: string; // UUID of the session
  vaeId: string; // UUID of the VAE model
  vaeName: string; // Name of the VAE model
}

const initialState: SessionConfigState = {
  sessionId: "",
  vaeId: "",
  vaeName: "",
};

const setSessionConfigByVaeIdName = createAsyncThunk<
  SessionConfigState,
  {
    vaeId: string;
    vaeName?: string;
  },
  {
    state: RootState;
  }
>(
  "sessionConfig/setByVaeIdName",
  async (
    vaeConfig: {
      vaeId: string;
      vaeName?: string;
    },
    thunkAPI
  ) => {
    const currentState: RootState = thunkAPI.getState();

    try {
      let newSessionId = "";
      if (vaeConfig.vaeId) {
        const resStart = await apiClient.startSession({
          queries: {
            vae_uuid: vaeConfig.vaeId,
          },
        });
        newSessionId = resStart.uuid;
      }

      if (currentState.sessionConfig.sessionId) {
        await apiClient.endSession({
          queries: {
            session_uuid: currentState.sessionConfig.sessionId,
          },
        });
      }

      return {
        sessionId: newSessionId,
        vaeId: vaeConfig.vaeId,
        vaeName: vaeConfig.vaeName || "",
      };
    } catch (error) {
      console.error(error);
      return initialState;
    }
  }
);

const sessionConfigSlice = createSlice({
  name: "sessionConfig",
  initialState,
  reducers: {
    setSessionConfig: (state, action: PayloadAction<SessionConfigState>) => {
      return action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(setSessionConfigByVaeIdName.fulfilled, (state, action) => {
      state.sessionId = action.payload.sessionId;
      state.vaeId = action.payload.vaeId;
      state.vaeName = action.payload.vaeName;
    });
  },
});

const sessionConfigReducer = sessionConfigSlice.reducer;

export default sessionConfigReducer;
export const { setSessionConfig } = sessionConfigSlice.actions;
export type { SessionConfigState };
export { setSessionConfigByVaeIdName };
