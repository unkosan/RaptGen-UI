import { PayloadAction, createSlice } from "@reduxjs/toolkit";

type SelexData = {
  totalLength: number;
  uniqueLength: number;
  matchedLength: number;
  uniqueRatio: number;
  sequences: string[];
  duplicates: number[];
  randomRegions: string[];
  adapterMatched: boolean[];
};

const selexDataSlice = createSlice({
  name: "selexData",
  initialState: {
    totalLength: NaN,
    uniqueLength: NaN,
    matchedLength: NaN,
    uniqueRatio: NaN,
    sequences: [] as string[],
    duplicates: [] as number[],
    randomRegions: [] as string[],
    adapterMatched: [] as boolean[],
  },
  reducers: {
    set: (state: SelexData, action: PayloadAction<SelexData>) => {
      return {
        ...state,
        totalLength: action.payload.totalLength,
        uniqueLength: action.payload.uniqueLength,
        matchedLength: action.payload.matchedLength,
        uniqueRatio: action.payload.uniqueRatio,
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
export type { SelexData };
