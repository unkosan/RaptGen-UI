import { PayloadAction, createSlice } from "@reduxjs/toolkit";

type PageConfig = {
  modelType: string; // needed for future implementation of multiple model types (layout could change)
  experimentName: string; // experiment name does not depend on model type
};

const pageConfigSlice = createSlice({
  name: "pageConfig",
  initialState: {
    modelType: "RaptGen",
    experimentName: "",
  },
  reducers: {
    setModelType: (state: PageConfig, action: PayloadAction<string>) => {
      return {
        ...state,
        modelType: action.payload,
      };
    },
    setExperimentName: (state: PageConfig, action: PayloadAction<string>) => {
      return {
        ...state,
        experimentName: action.payload,
      };
    },
  },
});

const pageConfigReducer = pageConfigSlice.reducer;

export default pageConfigReducer;
export type { PageConfig };
