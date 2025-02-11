import { PayloadAction, createSlice } from "@reduxjs/toolkit";

type BayesoptConfig = {
  optimizationType: string;
  targetColumn: string;
  queryBudget: number;
};

const bayesoptConfigSlice = createSlice({
  name: "bayesoptConfig",
  initialState: {
    optimizationType: "qEI",
    targetColumn: "",
    queryBudget: 0,
  },
  reducers: {
    setBayesoptConfig: (
      state: BayesoptConfig,
      action: PayloadAction<BayesoptConfig>
    ) => {
      return {
        ...state,
        ...action.payload,
      };
    },
  },
});

const bayesoptConfigReducer = bayesoptConfigSlice.reducer;

export default bayesoptConfigReducer;
export type { BayesoptConfig };
export const { setBayesoptConfig } = bayesoptConfigSlice.actions;
