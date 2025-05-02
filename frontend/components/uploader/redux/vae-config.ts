import { PayloadAction, createSlice } from "@reduxjs/toolkit";

type VaeConfig = {
  encodeUUID: string;
  requiredParams: {
    modelName: string;
    targetLength: number;
    forwardAdapter: string;
    reverseAdapter: string;
  };
  optionalParams: {
    [key: string]: string;
  };
  sequenceData: {
    totalLength: number; // total length of all entry on SELEX file
    uniqueLength: number; // the number of unique sequences on SELEX file
    matchedLength: number; // the number of sequences that have adapters
    sequences: string[]; // unique sequences
    duplicates: number[]; // the number of duplicates of each unique sequence
    randomRegions: string[]; // random regions of unique sequences (if unique seq doesn't have adapters, it will be empty string)
    adapterMatched: boolean[]; // true if the sequence has adapters
  };
  showMinCount: number;
};

const vaeConfigSlice = createSlice({
  name: "vaeConfig",
  initialState: {
    encodeUUID: "",
    requiredParams: {
      modelName: "",
      targetLength: 0,
      forwardAdapter: "",
      reverseAdapter: "",
    },
    optionalParams: {} as { [key: string]: string },
    sequenceData: {
      totalLength: NaN,
      uniqueLength: NaN,
      matchedLength: NaN,
      sequences: [] as string[],
      duplicates: [] as number[],
      randomRegions: [] as string[],
      adapterMatched: [] as boolean[],
    },
    showMinCount: 1,
  },
  reducers: {
    setUUID: (state: VaeConfig, action: PayloadAction<string>) => {
      return {
        ...state,
        encodeUUID: action.payload,
      };
    },
    setRequiredParams: (
      state: VaeConfig,
      action: PayloadAction<VaeConfig["requiredParams"]>
    ) => {
      return {
        ...state,
        requiredParams: action.payload,
      };
    },
    setOptionalParams: (
      state: VaeConfig,
      action: PayloadAction<VaeConfig["optionalParams"]>
    ) => {
      return {
        ...state,
        optionalParams: action.payload,
      };
    },
    setData: (
      state: VaeConfig,
      action: PayloadAction<VaeConfig["sequenceData"]>
    ) => {
      return {
        ...state,
        sequenceData: action.payload,
      };
    },
    setShowMinCount: (state: VaeConfig, action: PayloadAction<number>) => {
      return {
        ...state,
        showMinCount: action.payload,
      };
    },
  },
});

const vaeConfigReducer = vaeConfigSlice.reducer;

export default vaeConfigReducer;
export type { VaeConfig };
