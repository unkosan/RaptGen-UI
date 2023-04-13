import { PayloadAction, createSlice } from "@reduxjs/toolkit";

type GmmData = {
  weights: number[];
  means: number[][];
  covariances: number[][][];
  isShown: boolean[];
};

const gmmDataSlice = createSlice({
  name: "gmmData",
  initialState: {
    weights: [] as number[],
    means: [] as number[][],
    covariances: [] as number[][][],
    isShown: [] as boolean[],
  },
  reducers: {
    set: (state: GmmData, action: PayloadAction<GmmData>) => {
      return action.payload;
    },
  },
});

const gmmDataReducer = gmmDataSlice.reducer;

export default gmmDataReducer;
export type { GmmData };
