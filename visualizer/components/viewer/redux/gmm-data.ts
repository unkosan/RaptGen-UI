import { PayloadAction, createSlice } from "@reduxjs/toolkit";

type GmmData = {
  means: number[][];
  covariances: number[][][];
  decodedSequences: string[];
  isShown: boolean[];
};

const gmmDataSlice = createSlice({
  name: "gmmData",
  initialState: {
    means: [] as number[][],
    covariances: [] as number[][][],
    decodedSequences: [] as string[],
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
