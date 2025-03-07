import { PayloadAction, createSlice } from "@reduxjs/toolkit";

interface GraphConfigState {
  minCount: number;
  showGMM: boolean;
}

const initialState: GraphConfigState = {
  minCount: 5,
  showGMM: true,
};

const graphConfigSlice = createSlice({
  name: "graphConfig2",
  initialState,
  reducers: {
    setGraphConfig: (state, action: PayloadAction<GraphConfigState>) => {
      return action.payload;
    },
  },
});

const graphConfigReducer = graphConfigSlice.reducer;
export const { setGraphConfig } = graphConfigSlice.actions;
export type { GraphConfigState };
export default graphConfigReducer;
