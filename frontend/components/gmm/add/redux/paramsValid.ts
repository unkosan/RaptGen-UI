import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type ParamsValid = {
  gmmName: boolean;
  vaeId: boolean;
  minNumComponents: boolean;
  maxNumComponents: boolean;
  stepSize: boolean;
  numTrials: boolean;
};

const paramsValidSlice = createSlice({
  name: "paramsValid",
  initialState: {
    gmmName: false,
    vaeId: false,
    minNumComponents: true,
    maxNumComponents: true,
    stepSize: true,
    numTrials: true,
  },
  reducers: {
    setParamsValid: (
      state: ParamsValid,
      action: PayloadAction<ParamsValid>
    ) => {
      return action.payload;
    },
  },
});

const paramsReducer = paramsValidSlice.reducer;

export default paramsReducer;
export type { ParamsValid };
export const { setParamsValid } = paramsValidSlice.actions;
