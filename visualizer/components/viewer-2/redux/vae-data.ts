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
    setAll: (state: VaeDataEntry[], action: PayloadAction<VaeDataEntry[]>) => {
      return action.payload;
    },
    add: (
      state: VaeDataEntry[],
      action: PayloadAction<VaeDataEntry | VaeDataEntry[]>
    ) => {
      const payload = Array.isArray(action.payload)
        ? action.payload
        : [action.payload];
      return updateArray("add", state, payload);
    },
    update: (
      state: VaeDataEntry[],
      action: PayloadAction<VaeDataEntry | VaeDataEntry[]>
    ) => {
      const payload = Array.isArray(action.payload)
        ? action.payload
        : [action.payload];
      return updateArray("update", state, payload);
    },
    remove: (
      state: VaeDataEntry[],
      action: PayloadAction<VaeDataEntry | VaeDataEntry[]>
    ) => {
      const payload = Array.isArray(action.payload)
        ? action.payload
        : [action.payload];
      return updateArray("remove", state, payload);
    },
  },
});

const vaeDataReducer = vaeDataSlice.reducer;

export default vaeDataReducer;
export type { VaeDataEntry };
