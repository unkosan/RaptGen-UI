import { PayloadAction, createSlice } from "@reduxjs/toolkit";

type SessionConfig = {
  sessionId: number;
};

const sessionConfigSlice = createSlice({
  name: "sessionConfig",
  initialState: {
    sessionId: 0,
  },
  reducers: {
    setSessionId: (state: SessionConfig, action: PayloadAction<number>) => {
      return {
        ...state,
        sessionId: action.payload,
      };
    },
  },
});

const sessionConfigReducer = sessionConfigSlice.reducer;

export default sessionConfigReducer;
export type { SessionConfig };
