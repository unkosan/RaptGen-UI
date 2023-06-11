import { PayloadAction, createSlice } from "@reduxjs/toolkit";

type PageConfig = {
  pseudoRoute: string; // "/selex" or "/train"
  modelType: string; // needed for future implementation of multiple model types (layout could change)
};

const pageConfigSlice = createSlice({
  name: "pageConfig",
  initialState: {
    pseudoRoute: "/selex",
    modelType: "RaptGen",
  },
  reducers: {
    setPseudoRoute: (state: PageConfig, action: PayloadAction<string>) => {
      return {
        ...state,
        pseudoRoute: action.payload,
      };
    },
    setModelType: (state: PageConfig, action: PayloadAction<string>) => {
      return {
        ...state,
        modelType: action.payload,
      };
    },
  },
});

const pageConfigReducer = pageConfigSlice.reducer;

export default pageConfigReducer;
export type { PageConfig };
