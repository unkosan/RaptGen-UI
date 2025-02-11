import { PayloadAction, createSlice } from "@reduxjs/toolkit";

type RegisteredValues = {
  wholeSelected: boolean; // whether all values are selected by master checkbox
  id: string[]; // id of the data (length m)
  randomRegion: string[]; // name of the region (length m)
  coordX: number[]; // x coordinate of the region (length m)
  coordY: number[]; // y coordinate of the region (length m)
  staged: boolean[]; // whether the region is staged (length m)
  columnNames: string[]; // (length n)
  sequenceIndex: number[]; // id of the data (length m x n)
  column: string[]; // name of the column (length m x n)
  value: (number | null)[]; // value of the column (length m x n)
};

const registeredValuesSlice = createSlice({
  name: "registeredValues",
  initialState: {
    wholeSelected: false,
    id: [],
    randomRegion: [],
    coordX: [],
    coordY: [],
    staged: [],
    columnNames: [],
    sequenceIndex: [],
    column: [],
    value: [],
  } as RegisteredValues,
  reducers: {
    setRegisteredValues: (
      state: RegisteredValues,
      action: PayloadAction<RegisteredValues>
    ) => {
      return action.payload;
    },
  },
});

const registeredValuesReducer = registeredValuesSlice.reducer;

export default registeredValuesReducer;
export type { RegisteredValues };
export const { setRegisteredValues } = registeredValuesSlice.actions;
