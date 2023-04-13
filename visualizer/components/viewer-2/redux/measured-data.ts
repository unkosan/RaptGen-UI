import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import updateArray from "../../common/update-array";

type MeasuredDataEntry = {
  key: number;
  id: string;
  sequence: string;
  randomRegion: string;
  coordX: number;
  coordY: number;
  bindValue: number;
  isSelected: boolean;
  isShown: boolean;
  seriesName: string;
};

const measuredDataSlice = createSlice({
  name: "measuredData",
  initialState: [] as MeasuredDataEntry[],
  reducers: {
    setAll: (
      state: MeasuredDataEntry[],
      action: PayloadAction<MeasuredDataEntry[]>
    ) => {
      return action.payload;
    },
    add: (
      state: MeasuredDataEntry[],
      action: PayloadAction<MeasuredDataEntry | MeasuredDataEntry[]>
    ) => {
      const payload = Array.isArray(action.payload)
        ? action.payload
        : [action.payload];
      return updateArray("add", state, payload);
    },
    update: (
      state: MeasuredDataEntry[],
      action: PayloadAction<MeasuredDataEntry | MeasuredDataEntry[]>
    ) => {
      const payload = Array.isArray(action.payload)
        ? action.payload
        : [action.payload];
      return updateArray("update", state, payload);
    },
    remove: (
      state: MeasuredDataEntry[],
      action: PayloadAction<MeasuredDataEntry | MeasuredDataEntry[]>
    ) => {
      const payload = Array.isArray(action.payload)
        ? action.payload
        : [action.payload];
      return updateArray("remove", state, payload);
    },
  },
});

const measuredDataReducer = measuredDataSlice.reducer;

export default measuredDataReducer;
export type { MeasuredDataEntry };
