import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type Params = {
  gmmName: string;
  vaeId: string;
  minNumComponents: number;
  maxNumComponents: number;
  stepSize: number;
  numTrials: number;
};

const paramsSlice = createSlice({
  name: "params",
  initialState: {
    gmmName: "",
    vaeId: "",
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
