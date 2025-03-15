import { PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { apiClient } from "~/services/api-client";
import { RootState } from "./store";

interface SessionConfigState {
  sessionId: string; // uuid of the vae inference session
  vaeId: string; // uuid of the vae model
  gmmId: string; // uuid of the gmm model
  vaeName: string;
  gmmName: string;
}

const initialState: SessionConfigState = {
  sessionId: "",
  vaeId: "",
  gmmId: "",
  vaeName: "",
  gmmName: "",
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
  "sessionConfig2/setByVaeIdName",
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
        gmmId: currentState.sessionConfig.gmmId,
        gmmName: currentState.sessionConfig.gmmName,
      };
    } catch (error) {
      console.error(error);
      return initialState;
    }
  }
);

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
    builder.addCase(setSessionConfigByVaeIdName.fulfilled, (state, action) => {
      state.sessionId = action.payload.sessionId;
      state.vaeId = action.payload.vaeId;
      state.gmmId = action.payload.gmmId;
      state.vaeName = action.payload.vaeName;
      state.gmmName = action.payload.gmmName;
    });
  },
});

const sessionConfigReducer = sessionConfigSlice.reducer;

export default sessionConfigReducer;
export const { setSessionConfig, setGmmId } = sessionConfigSlice.actions;
export type { SessionConfigState };
export { setSessionConfigByVaeIdName };
