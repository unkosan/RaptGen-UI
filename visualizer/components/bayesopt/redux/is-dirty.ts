import { PayloadAction, createSlice } from "@reduxjs/toolkit";

const isDirtySlice = createSlice({
  name: "isDirty",
  initialState: false,
  reducers: {
    set: (state: boolean, action: PayloadAction<boolean>) => {
      return action.payload;
    },
  },
});

const isDirtyReducer = isDirtySlice.reducer;

export default isDirtyReducer;
