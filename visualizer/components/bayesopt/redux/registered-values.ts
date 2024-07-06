import { PayloadAction, createSlice } from "@reduxjs/toolkit";

type RegisteredValues = {
  randomRegion: string[]; // name of the region (length m)
  coordX: number[]; // x coordinate of the region (length m)
  coordY: number[]; // y coordinate of the region (length m)
  staged: boolean[]; // whether the region is staged (length m)
  columnNames: string[]; // (length n)
  sequenceIndex: number[]; // id of the data (length m x n)
  column: string[]; // name of the column (length m x n)
  value: number[]; // value of the column (length m x n)
};

const registeredValuesSlice = createSlice({
  name: "registeredValues",
  initialState: {
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
    set: (state: RegisteredValues, action: PayloadAction<RegisteredValues>) => {
      return action.payload;
    },
  },
});

const registeredValuesReducer = registeredValuesSlice.reducer;

export default registeredValuesReducer;
export type { RegisteredValues };
