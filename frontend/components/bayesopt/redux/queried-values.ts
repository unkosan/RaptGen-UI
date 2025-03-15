import { PayloadAction, createSlice } from "@reduxjs/toolkit";

interface QueriedValues {
  masterboxChecked: boolean;
  randomRegion: string[];
  coordX: number[];
  coordY: number[];
  coordOriginalX: number[];
  coordOriginalY: number[];
  staged: boolean[];
}

const queriedValuesSlice = createSlice({
  name: "queriedValues",
  initialState: {
    masterboxChecked: false,
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
