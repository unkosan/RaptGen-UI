import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { PreprocessingConfigState } from "./preprocessing-config";
import { sum } from "lodash";

interface SelexDataState {
  sequences: string[];
  duplicates: number[];
}

interface SelexDataStateWithProcessedResult extends SelexDataState {
  isDirty: boolean;
  totalCount: number;
  uniqueCount: number;
  validSequenceCount: number;
  duplicateFilteredCount: number;
  uniqueRatio: number;
  validRandomRegions: string[];
  validDuplicates: number[];
  filteredRandomRegions: string[];
  filteredDuplicates: number[];
}

const selexDataSlice = createSlice({
  name: "selexData",
  initialState: {
    isDirty: false,
    totalCount: NaN,
    uniqueCount: NaN,
    validSequenceCount: NaN, // uniquified and filtered
    duplicateFilteredCount: NaN, // uniquified and filtered
    uniqueRatio: NaN,
    sequences: [] as string[],
    duplicates: [] as number[],
    validRandomRegions: [] as string[],
    validDuplicates: [] as number[],
    filteredRandomRegions: [] as string[],
    filteredDuplicates: [] as number[],
  },
  reducers: {
    setSelexDataState: (
      state: SelexDataStateWithProcessedResult,
      action: PayloadAction<SelexDataState>
    ) => {
      const sequences = action.payload.sequences.map((seq) =>
        seq.toUpperCase().replace(/T/g, "U")
      );
      const duplicates = action.payload.duplicates;
      return {
        ...state,
        sequences,
        duplicates,
        isDirty: true,
      };
    },
    preprocessSelexData: (
      state: SelexDataStateWithProcessedResult,
      action: PayloadAction<PreprocessingConfigState>
    ) => {
      const { sequences, duplicates } = state;
      const {
        forwardAdapter,
        reverseAdapter,
        targetLength,
        tolerance,
        minCount,
      } = action.payload;

      const totalCount = sum(duplicates);
      const uniqueCount = sequences.length;

      const validSequenceMask = sequences.map((seq) => {
        return (
          seq.startsWith(forwardAdapter) &&
          seq.endsWith(reverseAdapter) &&
          seq.length >= targetLength - tolerance &&
          seq.length <= targetLength + tolerance
        );
      });
      const validSequenceCount = sum(validSequenceMask);
      const validRandomRegions = sequences.filter((_, index) => {
        return validSequenceMask[index];
      });
      const validDuplicates = duplicates.filter((_, index) => {
        return validSequenceMask[index];
      });
      const uniqueRatio =
        validSequenceCount /
        sum(duplicates.filter((_, index) => validSequenceMask[index]));

      const duplicateFilterMask = validSequenceMask.map(
        (valid, index) => valid && duplicates[index] >= minCount
      );
      const duplicateFilteredCount = sum(duplicateFilterMask);
      const filteredRandomRegions = sequences
        .filter((_, index) => duplicateFilterMask[index])
        .map((seq) =>
          seq.slice(forwardAdapter.length, seq.length - reverseAdapter.length)
        );
      const filteredDuplicates = duplicates.filter(
        (_, index) => duplicateFilterMask[index]
      );

      return {
        ...state,
        totalCount,
        uniqueCount,
        validSequenceCount,
        duplicateFilteredCount,
        uniqueRatio,
        validRandomRegions,
        validDuplicates,
        filteredRandomRegions,
        filteredDuplicates,
        isDirty: false,
      };
    },
  },
});

const selexDataReducer = selexDataSlice.reducer;

export default selexDataReducer;
export type { SelexDataState };
export const { preprocessSelexData, setSelexDataState } =
  selexDataSlice.actions;
