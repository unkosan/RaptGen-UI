import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import updateArray from "../../common/update-array";

type VaeDataEntry = {
  key: number;
  sequence: string;
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
