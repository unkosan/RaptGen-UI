import { PayloadAction, createSlice } from "@reduxjs/toolkit";

type PreprocessingConfig = {
  isDirty: boolean;
  forwardAdapter?: string;
  reverseAdapter?: string;
  targetLength?: number;
  tolerance?: number;
  minCount?: number;
};

const preprocessingConfigSlice = createSlice({
  name: "preprocessingConfig",
  initialState: {
    isDirty: false,
    forwardAdapter: undefined as string | undefined,
    reverseAdapter: undefined as string | undefined,
    targetLength: undefined as number | undefined,
    tolerance: undefined as number | undefined,
    minCount: undefined as number | undefined,
  },
  reducers: {
    set: (
      state: PreprocessingConfig,
      action: PayloadAction<PreprocessingConfig>
    ) => {
      return {
        ...state,
        isDirty: action.payload.isDirty,
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
