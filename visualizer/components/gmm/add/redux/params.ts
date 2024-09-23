import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type Params = {
  vaeModelName: string;
  gmmName: string;
  minNumComponents: number;
  maxNumComponents: number;
  stepSize: number;
  numTrials: number;
};

const paramsSlice = createSlice({
  name: "params",
  initialState: {
    vaeModelName: "RAPT1",
    gmmName: "",
    minNumComponents: 5,
    maxNumComponents: 15,
    stepSize: 1,
    numTrials: 10,
  },
  reducers: {
    set: (state: Params, action: PayloadAction<Params>) => {
      return action.payload;
    },
  },
});

const paramsReducer = paramsSlice.reducer;

export default paramsReducer;
export type { Params };
