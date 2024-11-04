import { PayloadAction, createSlice } from "@reduxjs/toolkit";

interface PageConfigState {
  modelType: "RaptGen"; // needed for future implementation of multiple model types (layout could change)
  experimentName: string; // experiment name does not depend on model type
}

const pageConfigSlice = createSlice({
  name: "pageConfig",
  initialState: {
    modelType: "RaptGen" as const,
    experimentName: "",
  },
  reducers: {
    setPageConfig: (
      state: PageConfigState,
      action: PayloadAction<PageConfigState>
    ) => {
      if (action.payload.modelType === "RaptGen") {
        return {
          modelType: "RaptGen" as const,
          experimentName: action.payload.experimentName,
        };
      } else {
        throw new Error("Unsupported model type");
      }
    },
  },
});

const pageConfigReducer = pageConfigSlice.reducer;

export default pageConfigReducer;
export type { PageConfigState };
export const { setPageConfig } = pageConfigSlice.actions;
