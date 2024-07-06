import { PayloadAction, createSlice } from "@reduxjs/toolkit";

type GraphConfig = {
  vaeName: string;
  minCount: number;

  showSelex: boolean;
  showAcquisition: boolean;
};

const graphConfigSlice = createSlice({
  name: "graphConfig",
  initialState: {
    vaeName: "",
    minCount: 5,
    showSelex: true,
    showAcquisition: true,
  },
  reducers: {
    set: (state: GraphConfig, action: PayloadAction<GraphConfig>) => {
      return action.payload;
    },
  },
});

const graphConfigReducer = graphConfigSlice.reducer;

export default graphConfigReducer;
export type { GraphConfig };
