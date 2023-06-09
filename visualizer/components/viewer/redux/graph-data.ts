import { PayloadAction, createSlice } from "@reduxjs/toolkit";

type GraphDataEntry = {
  key: number;
  uid: string;
  hue: string;
  x: number;
  y: number;
};

const graphDataSlice = createSlice({
  name: "graphData",
  initialState: [] as GraphDataEntry[],
  reducers: {
    set: (state: GraphDataEntry[], action: PayloadAction<GraphDataEntry[]>) => {
      return action.payload;
    },
  },
});

const graphDataReducer = graphDataSlice.reducer;

export default graphDataReducer;
export type { GraphDataEntry };
