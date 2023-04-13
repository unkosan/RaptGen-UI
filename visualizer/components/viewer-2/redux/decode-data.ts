// redux-thunk を使うと複雑になるので、encode, decode API への問い合わせは呼び出し元で行う。
import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import updateArray from "../../common/update-array";

type DecodeDataEntry = {
  key: number;
  id: string;
  sequence: string;
  randomRegion: string;
  coordX: number;
  coordY: number;
  isSelected: boolean;
  isShown: boolean;
  category: "manual";
  seriesName: string;
};

const decodeDataSlice = createSlice({
  name: "decodeData",
  initialState: [] as DecodeDataEntry[],
  reducers: {
    setAll: (
      state: DecodeDataEntry[],
      action: PayloadAction<DecodeDataEntry[]>
    ) => {
      return action.payload;
    },
    add: (
      state: DecodeDataEntry[],
      action: PayloadAction<DecodeDataEntry | DecodeDataEntry[]>
    ) => {
      const payload = Array.isArray(action.payload)
        ? action.payload
        : [action.payload];
      return updateArray("add", state, payload);
    },
    update: (
      state: DecodeDataEntry[],
      action: PayloadAction<DecodeDataEntry | DecodeDataEntry[]>
    ) => {
      const payload = Array.isArray(action.payload)
        ? action.payload
        : [action.payload];
      return updateArray("update", state, payload);
    },
    remove: (
      state: DecodeDataEntry[],
      action: PayloadAction<DecodeDataEntry | DecodeDataEntry[]>
    ) => {
      const payload = Array.isArray(action.payload)
        ? action.payload
        : [action.payload];
      return updateArray("remove", state, payload);
    },
  },
});

const decodeDataReducer = decodeDataSlice.reducer;

export default decodeDataReducer;
export type { DecodeDataEntry };
