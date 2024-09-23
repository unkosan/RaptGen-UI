import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type ParamsValid = {
  vaeModelName: boolean;
  minNumComponents: boolean;
  maxNumComponents: boolean;
  stepSize: boolean;
  numTrials: boolean;
};

const paramsValidSlice = createSlice({
  name: "paramsValid",
  initialState: {
    vaeModelName: true,
    minNumComponents: true,
    maxNumComponents: true,
    stepSize: true,
    numTrials: true,
  },
  reducers: {
    set: (state: ParamsValid, action: PayloadAction<ParamsValid>) => {
      return action.payload;
    },
  },
});

const paramsReducer = paramsValidSlice.reducer;

export default paramsReducer;
export type { ParamsValid };
