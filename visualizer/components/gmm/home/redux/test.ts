import { PayloadAction, createSlice } from "@reduxjs/toolkit";

type SimpleParams = {
  value: number;
};

const simpleParamsSlice = createSlice({
  name: "simpleParams",
  initialState: {
    value: 0,
  },
  reducers: {
    set: (state: SimpleParams, action: PayloadAction<SimpleParams>) => {
      return action.payload;
    },
  },
});

const simpleParamsReducer = simpleParamsSlice.reducer;

export default simpleParamsReducer;
export type { SimpleParams };
