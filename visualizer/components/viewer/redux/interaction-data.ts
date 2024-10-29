import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface InteractionDataState {
  encoded: {
    ids: string[];
    coordsX: number[];
    coordsY: number[];
    randomRegions: string[];
    shown: boolean[];
  };
  decoded: {
    ids: string[];
    coordsX: number[];
    coordsY: number[];
    randomRegions: string[];
    shown: boolean[];
  };
  decodeGrid: {
    coordX: number;
    coordY: number;
    randomRegion: string;
  };
}

const initialState: InteractionDataState = {
  encoded: {
    ids: [],
    coordsX: [],
    coordsY: [],
    randomRegions: [],
    shown: [],
  },
  decoded: {
    ids: [],
    coordsX: [],
    coordsY: [],
    randomRegions: [],
    shown: [],
  },
  decodeGrid: {
    coordX: 0,
    coordY: 0,
    randomRegion: "",
  },
};

const InteractionDataSlice = createSlice({
  name: "interactionData",
  initialState,
  reducers: {
    setEncoded: (
      state,
      action: PayloadAction<InteractionDataState["encoded"]>
    ) => {
      console.log("setEncoded");
      console.log(action.payload);
      return {
        ...state,
        encoded: action.payload,
      };
    },
    setDecoded: (
      state,
      action: PayloadAction<InteractionDataState["decoded"]>
    ) => {
      return {
        ...state,
        decoded: action.payload,
      };
    },
    setDecodeGrid: (
      state,
      action: PayloadAction<InteractionDataState["decodeGrid"]>
    ) => {
      return {
        ...state,
        decodeGrid: action.payload,
      };
    },
  },
});

const InteractionDataReducer = InteractionDataSlice.reducer;
export const { setEncoded, setDecoded, setDecodeGrid } =
  InteractionDataSlice.actions;
export type { InteractionDataState };
export default InteractionDataReducer;
