import { PayloadAction, createSlice } from "@reduxjs/toolkit";

type PageConfig = {
  pseudoRoute: string; // "/selex" or "/train"
};

const pageConfigSlice = createSlice({
  name: "pageConfig",
  initialState: {
    pseudoRoute: "/selex",
  },
  reducers: {
    setRoute: (state: PageConfig, action: PayloadAction<string>) => {
      return {
        ...state,
        pseudoRoute: action.payload,
      };
    },
  },
});

const pageConfigReducer = pageConfigSlice.reducer;

export default pageConfigReducer;
export type { PageConfig };
