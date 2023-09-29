import { PayloadAction, createSlice } from "@reduxjs/toolkit";

type GmmConfig = {
  gmmData: {
    weights: number[];
    means: number[][];
    covariances: number[][][];
  };
  requiredParams: {
    modelName: string;
  };
  optionalParams: {
    [key: string]: string;
  };
};

const gmmConfigSlice = createSlice({
  name: "gmmConfig",
  initialState: {
    requiredParams: {
      modelName: "",
    },
    optionalParams: {} as { [key: string]: string },
    gmmData: {
      weights: [] as number[],
      means: [] as number[][],
      covariances: [] as number[][][],
    },
  },
  reducers: {
    setData: (
      state: GmmConfig,
      action: PayloadAction<GmmConfig["gmmData"]>
    ) => {
      // return action.payload;
      return {
        ...state,
        gmmData: action.payload,
      };
    },
    setRequiredParams: (
      state: GmmConfig,
      action: PayloadAction<GmmConfig["requiredParams"]>
    ) => {
      return {
        ...state,
        requiredParams: action.payload,
      };
    },
    setOptionalParams: (
      state: GmmConfig,
      action: PayloadAction<GmmConfig["optionalParams"]>
    ) => {
      return {
        ...state,
        optionalParams: action.payload,
      };
    },
  },
});

const gmmConfigReducer = gmmConfigSlice.reducer;

export default gmmConfigReducer;
export type { GmmConfig };
