import { PayloadAction, createSlice } from "@reduxjs/toolkit";

type QueriedValues = {
  wholeSelected: boolean; // whether all values are selected by master checkbox.
  randomRegion: string[];
  coordX: number[];
  coordY: number[];
  coordOriginalX: number[];
  coordOriginalY: number[];
  staged: boolean[];
};

const queriedValuesSlice = createSlice({
  name: "queriedValues",
  initialState: {
    wholeSelected: false,
    randomRegion: [],
    coordX: [],
    coordY: [],
    coordOriginalX: [],
    coordOriginalY: [],
    staged: [],
  } as QueriedValues,
  reducers: {
    setQueriedValues: (
      state: QueriedValues,
      action: PayloadAction<QueriedValues>
    ) => {
      return action.payload;
    },
  },
});

const queriedValuesReducer = queriedValuesSlice.reducer;

export default queriedValuesReducer;
export type { QueriedValues };
export const { setQueriedValues } = queriedValuesSlice.actions;
