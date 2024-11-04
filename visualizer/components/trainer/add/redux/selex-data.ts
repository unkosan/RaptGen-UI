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
  sequenceFilterCount: number;
  duplicateFilterCount: number;
  uniqueRatio: number;
  randomRegions: string[];
  duplicatesFiltered: number[];
}

const selexDataSlice = createSlice({
  name: "selexData",
  initialState: {
    isDirty: false,
    totalCount: NaN,
    uniqueCount: NaN,
    sequenceFilterCount: NaN,
    duplicateFilterCount: NaN,
    uniqueRatio: NaN,
    sequences: [] as string[],
    duplicates: [] as number[],
    randomRegions: [] as string[],
    duplicatesFiltered: [] as number[],
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

      const sequenceFilterMask = sequences.map((seq) => {
        return (
          seq.startsWith(forwardAdapter) &&
          seq.endsWith(reverseAdapter) &&
          seq.length >= targetLength - tolerance &&
          seq.length <= targetLength + tolerance
        );
      });
      const sequenceFilterCount = sum(sequenceFilterMask);

      const duplicateFilterMask = duplicates.map((dup) => {
        return dup >= minCount;
      });
      const duplicateFilterCount = sum(duplicateFilterMask);

      const uniqueRatio =
        sum(sequenceFilterMask && duplicateFilterMask) / sequenceFilterCount;

      const randomRegions = sequences
        .filter((seq, index) => {
          return sequenceFilterMask[index] && duplicateFilterMask[index];
        })
        .map((seq) => {
          return seq.slice(
            forwardAdapter.length,
            seq.length - reverseAdapter.length
          );
        });

      const duplicatesFiltered = duplicates.filter(
        (_, index) => sequenceFilterMask[index] && duplicateFilterMask[index]
      );

      return {
        ...state,
        totalCount,
        uniqueCount,
        sequenceFilterCount,
        duplicateFilterCount,
        uniqueRatio,
        randomRegions,
        duplicatesFiltered,
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
