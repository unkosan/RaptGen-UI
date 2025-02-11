import { PayloadAction, createSlice } from "@reduxjs/toolkit";

type AcquisitionValues = {
  acquisitionValues: number[];
  coordX: number[];
  coordY: number[];
};

const acquisitionValuesSlice = createSlice({
  name: "acquisitionValues",
  initialState: {
    acquisitionValues: [],
    coordX: [],
    coordY: [],
  } as AcquisitionValues,
  reducers: {
    setAcquisitionValues: (
      state: AcquisitionValues,
      action: PayloadAction<AcquisitionValues>
    ) => {
      return action.payload;
    },
  },
});

const acquisitionValuesReducer = acquisitionValuesSlice.reducer;

export default acquisitionValuesReducer;
export type { AcquisitionValues };
export const { setAcquisitionValues } = acquisitionValuesSlice.actions;
