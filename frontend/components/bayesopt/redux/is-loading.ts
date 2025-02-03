import { PayloadAction, createSlice } from "@reduxjs/toolkit";

// If the isLoading state is true, the bo app is loading data.
const isLoadingSlice = createSlice({
  name: "isLoading",
  initialState: true,
  reducers: {
    set: (state: boolean, action: PayloadAction<boolean>) => {
      return action.payload;
    },
  },
});

const isLoadingReducer = isLoadingSlice.reducer;

export default isLoadingReducer;
