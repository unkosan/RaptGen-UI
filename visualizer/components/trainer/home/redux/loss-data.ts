import { PayloadAction, createSlice } from "@reduxjs/toolkit";

type LossData = {
  trainLoss: number[];
  testLoss: number[];
  testKldLoss: number[];
  testReconLoss: number[];
};

const lossDataSlice = createSlice({
  name: "lossData",
  initialState: {
    trainLoss: [] as number[],
    testLoss: [] as number[],
    testKldLoss: [] as number[],
    testReconLoss: [] as number[],
  },
  reducers: {
    set: (state: LossData, action: PayloadAction<LossData>) => {
      return {
        ...state,
        trainLoss: action.payload.trainLoss,
        testLoss: action.payload.testLoss,
        testKldLoss: action.payload.testKldLoss,
        testReconLoss: action.payload.testReconLoss,
      };
    },
  },
});

const lossDataReducer = lossDataSlice.reducer;

export default lossDataReducer;
export type { LossData };
