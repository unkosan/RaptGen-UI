import { PayloadAction, createSlice } from "@reduxjs/toolkit";

interface LossData {
  trainLoss: number[];
  testLoss: number[];
  testKldLoss: number[];
  testReconLoss: number[];
}

const lossDataSlice = createSlice({
  name: "lossData",
  initialState: {
    trainLoss: [] as number[],
    testLoss: [] as number[],
    testKldLoss: [] as number[],
    testReconLoss: [] as number[],
  },
  reducers: {
    setLossData: (state: LossData, action: PayloadAction<LossData>) => {
      return {
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
export const { setLossData } = lossDataSlice.actions;
export type { LossData };
