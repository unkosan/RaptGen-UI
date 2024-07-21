import { PayloadAction, createSlice } from "@reduxjs/toolkit";

type SessionConfig = {
  sessionId: number;
  vaeName: string;
};

const sessionConfigSlice = createSlice({
  name: "sessionConfig",
  initialState: {
    sessionId: 0,
    vaeName: "",
  },
  reducers: {
    set: (state: SessionConfig, action: PayloadAction<SessionConfig>) => {
      console.log("set session id", action.payload);
      return {
        ...state,
        sessionId: action.payload.sessionId,
        vaeName: action.payload.vaeName,
      };
    },
  },
});

const sessionConfigReducer = sessionConfigSlice.reducer;

export default sessionConfigReducer;
export type { SessionConfig };
