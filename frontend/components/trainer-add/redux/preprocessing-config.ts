import { PayloadAction, createSlice } from "@reduxjs/toolkit";

// maybe this should be integrated into selex-data.ts

interface PreprocessingConfigState {
  forwardAdapter: string;
  reverseAdapter: string;
  targetLength: number;
  tolerance: number;
  minCount: number;
}

interface PreprocessingConfigStateWithFlags extends PreprocessingConfigState {
  isDirty: boolean;
  isValidParams: boolean;
}

const preprocessingConfigSlice = createSlice({
  name: "preprocessingConfig",
  initialState: {
    isDirty: false,
    isValidParams: false,
    forwardAdapter: "",
    reverseAdapter: "",
    targetLength: NaN,
    tolerance: 0,
    minCount: 1,
  },
  reducers: {
    setPreprocessingConfig: (
      state: PreprocessingConfigStateWithFlags,
      action: PayloadAction<PreprocessingConfigState>
    ) => {
      const {
        forwardAdapter,
        reverseAdapter,
        targetLength,
        tolerance,
        minCount,
      } = action.payload;

      const isValidParams =
        forwardAdapter.length >= 0 &&
        reverseAdapter.length >= 0 &&
        targetLength > 0 &&
        tolerance >= 0 &&
        minCount >= 1;

      return {
        isDirty: true,
        isValidParams,
        forwardAdapter,
        reverseAdapter,
        targetLength,
        tolerance,
        minCount,
      };
    },
    clearPreprocessingDirty: (state: PreprocessingConfigStateWithFlags) => {
      return {
        ...state,
        isDirty: false,
      };
    },
  },
});

const preprocessingConfigReducer = preprocessingConfigSlice.reducer;

export default preprocessingConfigReducer;
export type { PreprocessingConfigState };
export const { setPreprocessingConfig, clearPreprocessingDirty } =
  preprocessingConfigSlice.actions;
