import { PayloadAction, createSlice } from "@reduxjs/toolkit";

type SelexData = {
  sequences: string[];
  duplicates: number[];
  randomRegions: string[];
  adapterMatched: boolean[];
};

const selexDataSlice = createSlice({
  name: "selexData",
  initialState: {
    sequences: [] as string[],
    duplicates: [] as number[],
    randomRegions: [] as string[],
    adapterMatched: [] as boolean[],
  },
  reducers: {
    set: (state: SelexData, action: PayloadAction<SelexData>) => {
      return {
        ...state,
        sequences: action.payload.sequences,
        duplicates: action.payload.duplicates,
        randomRegions: action.payload.randomRegions,
        adapterMatched: action.payload.adapterMatched,
      };
    },
  },
});

const selexDataReducer = selexDataSlice.reducer;

export default selexDataReducer;
export const { set: setSelexData } = selexDataSlice.actions;
export type { SelexData };
