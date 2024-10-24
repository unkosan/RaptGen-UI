import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface SelectedPointsState {
  series: string[];
  coordsX: number[];
  coordsY: number[];
  randomRegions: string[];
  duplicates: number[];
}

const initialState: SelectedPointsState = {
  series: [],
  coordsX: [],
  coordsY: [],
  randomRegions: [],
  duplicates: [],
};

const selectedPointsSlice = createSlice({
  name: "selectedPoints",
  initialState,
  reducers: {
    setSelectedPoints: (state, action: PayloadAction<SelectedPointsState>) => {
      return action.payload;
    },
  },
});

const selectedPointsReducer = selectedPointsSlice.reducer;
export const { setSelectedPoints } = selectedPointsSlice.actions;
export type { SelectedPointsState };
export default selectedPointsReducer;
