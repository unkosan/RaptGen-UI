import { PayloadAction, createSlice } from "@reduxjs/toolkit";

type PreprocessingConfig = {
  isDirty: boolean;
  isValidParams: boolean;
  forwardAdapter: string;
  reverseAdapter: string;
  targetLength: number;
  tolerance: number;
  minCount: number;
};

const preprocessingConfigSlice = createSlice({
  name: "preprocessingConfig",
  initialState: {
    isDirty: false,
    isValidParams: false,
    forwardAdapter: "",
    reverseAdapter: "",
    targetLength: NaN,
    tolerance: NaN,
    minCount: NaN,
  },
  reducers: {
    set: (
      state: PreprocessingConfig,
      action: PayloadAction<PreprocessingConfig>
    ) => {
      return {
        ...state,
        isDirty: action.payload.isDirty,
        isValidParams: action.payload.isValidParams,
        forwardAdapter: action.payload.forwardAdapter,
        reverseAdapter: action.payload.reverseAdapter,
        targetLength: action.payload.targetLength,
        tolerance: action.payload.tolerance,
        minCount: action.payload.minCount,
      };
    },
  },
});

const preprocessingConfigReducer = preprocessingConfigSlice.reducer;

export default preprocessingConfigReducer;
export type { PreprocessingConfig };
