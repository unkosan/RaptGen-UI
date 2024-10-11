import { PayloadAction, createSlice } from "@reduxjs/toolkit";

type SessionConfig = {
  sessionId: string;
  vaeId: string;
  gmmId: string;
  manualEncodeCount: number;
  manualDecodeCount: number;
  forwardAdapter: string;
  reverseAdapter: string;
};

const sessionConfigSlice = createSlice({
  name: "sessionConfig",
  initialState: {
    sessionId: "",
    vaeId: "",
    gmmId: "",
    manualEncodeCount: 0,
    manualDecodeCount: 1,
    forwardAdapter: "",
    reverseAdapter: "",
  },
  reducers: {
    set: (state: SessionConfig, action: PayloadAction<SessionConfig>) => {
      return action.payload;
    },
    // setSessionId: (state: SessionConfig, action: PayloadAction<string>) => {
    //   return {
    //     ...state,
    //     sessionId: action.payload,
    //   };
    // },
    // setVaeId: (state: SessionConfig, action: PayloadAction<string>) => {
    //   return {
    //     ...state,
    //     vaeId: action.payload,
    //   };
    // },
    // setGmmId: (state: SessionConfig, action: PayloadAction<string>) => {
    //   return {
    //     ...state,
    //     gmmId: action.payload,
    //   };
    // },
    resetEncodeCount: (state: SessionConfig, action: PayloadAction<null>) => {
      return {
        ...state,
        manualEncodeCount: 0,
      };
    },
    incrementEncodeCount: (
      state: SessionConfig,
      action: PayloadAction<null>
    ) => {
      return {
        ...state,
        manualEncodeCount: state.manualEncodeCount + 1,
      };
    },
    resetDecodeCount: (state: SessionConfig, action: PayloadAction<null>) => {
      return {
        ...state,
        manualDecodeCount: 0,
      };
    },
    incrementDecodeCount: (
      state: SessionConfig,
      action: PayloadAction<null>
    ) => {
      return {
        ...state,
        manualDecodeCount: state.manualDecodeCount + 1,
      };
    },
    setAdapters: (
      state: SessionConfig,
      action: PayloadAction<{ forwardAdapter: string; reverseAdapter: string }>
    ) => {
      return {
        ...state,
        forwardAdapter: action.payload.forwardAdapter,
        reverseAdapter: action.payload.reverseAdapter,
      };
    },
  },
});

const sessionConfigReducer = sessionConfigSlice.reducer;

export default sessionConfigReducer;
export type { SessionConfig };
