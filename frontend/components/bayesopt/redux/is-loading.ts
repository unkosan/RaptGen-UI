import { PayloadAction, createSlice } from "@reduxjs/toolkit";

// If the isLoading state is true, the bo app is loading data.
const isLoadingSlice = createSlice({
  name: "isLoading",
  initialState: true,
  reducers: {
    setIsLoading: (state: boolean, action: PayloadAction<boolean>) => {
      return action.payload;
    },
  },
});

const isLoadingReducer = isLoadingSlice.reducer;

export default isLoadingReducer;
export const { setIsLoading } = isLoadingSlice.actions;
