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
    set: (
      state: MeasuredDataEntry[],
      action: PayloadAction<MeasuredDataEntry[]>
    ) => {
      return action.payload;
    },
  },
});

const measuredDataReducer = measuredDataSlice.reducer;

export default measuredDataReducer;
export type { MeasuredDataEntry };
