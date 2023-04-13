import { PayloadAction, createSlice } from "@reduxjs/toolkit";

type GraphConfig = {
  vaeName: string;
  gmmName: string;
  measuredName: string;

  minCount: number;
  tolerance: number;
  randomRegionLength: number;

  showMeasured: boolean;
  showGmm: boolean;
  showDecoded: boolean;
  showEncoded: boolean;

  showDecodeGrid: boolean;
};

const graphConfigSlice = createSlice({
  name: "graphConfig",
  initialState: {
    vaeName: "",
    gmmName: "",
    measuredName: "",
    minCount: 5,
    tolerance: 0,
    randomRegionLength: 0,
    showMeasured: true,
    showGmm: true,
    showEncoded: true,
    showDecoded: false,
    showDecodeGrid: false,
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
