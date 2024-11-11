import { PayloadAction, createSlice } from "@reduxjs/toolkit";

interface SelexDataState {
  randomRegions: string[];
  duplicates: number[];
}

const selexDataSlice = createSlice({
  name: "selexData",
  initialState: {
    randomRegions: [] as string[],
    duplicates: [] as number[],
  },
  reducers: {
    setSelexData: (
      state: SelexDataState,
      action: PayloadAction<SelexDataState>
    ) => {
      return {
        randomRegions: action.payload.randomRegions,
        duplicates: action.payload.duplicates,
      };
    },
  },
});

const selexDataReducer = selexDataSlice.reducer;

export default selexDataReducer;
export const { setSelexData } = selexDataSlice.actions;
export type { SelexDataState };
