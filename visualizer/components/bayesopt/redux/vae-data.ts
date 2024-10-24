import { PayloadAction, createSlice } from "@reduxjs/toolkit";

type VaeDataEntry = {
  key: number;
  randomRegion: string;
  duplicates: number;
  coordX: number;
  coordY: number;
  isSelected: boolean;
  isShown: boolean;
};

const vaeDataSlice = createSlice({
  name: "vaeData",
  initialState: [] as VaeDataEntry[],
  reducers: {
    set: (state: VaeDataEntry[], action: PayloadAction<VaeDataEntry[]>) => {
      return action.payload;
    },
  },
});

const vaeDataReducer = vaeDataSlice.reducer;

export default vaeDataReducer;
export type { VaeDataEntry };
