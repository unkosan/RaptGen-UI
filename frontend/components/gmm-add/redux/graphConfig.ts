import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface GraphConfig {
  minCount: number;
}

const initialState: GraphConfig = {
  minCount: 5,
};

const graphConfigSlice = createSlice({
  name: "graphConfig",
  initialState,
  reducers: {
    setGraphConfig: (state, action: PayloadAction<GraphConfig>) => {
      return action.payload;
    },
  },
});

const graphConfigReducer = graphConfigSlice.reducer;

export default graphConfigReducer;
export type { GraphConfig };
export const { setGraphConfig } = graphConfigSlice.actions;
