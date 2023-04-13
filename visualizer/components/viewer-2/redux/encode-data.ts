// redux-thunk を使うと複雑になるので、encode, decode API への問い合わせは呼び出し元で行う。
import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import updateArray from "../../common/update-array";

type EncodeDataEntry = {
  key: number;
  id: string;
  sequence: string;
  randomRegion: string;
  coordX: number;
  coordY: number;
  isSelected: boolean;
  isShown: boolean;
  category: "fasta" | "manual";
  seriesName: string;
};

const encodeDataSlice = createSlice({
  name: "encodeData",
  initialState: [] as EncodeDataEntry[],
  reducers: {
    setAll: (
      state: EncodeDataEntry[],
      action: PayloadAction<EncodeDataEntry[]>
    ) => {
      return action.payload;
    },
    add: (
      state: EncodeDataEntry[],
      action: PayloadAction<EncodeDataEntry | EncodeDataEntry[]>
    ) => {
      const payload = Array.isArray(action.payload)
        ? action.payload
        : [action.payload];
      return updateArray("add", state, payload);
    },
    update: (
      state: EncodeDataEntry[],
      action: PayloadAction<EncodeDataEntry | EncodeDataEntry[]>
    ) => {
      const payload = Array.isArray(action.payload)
        ? action.payload
        : [action.payload];
      return updateArray("update", state, payload);
    },
    remove: (
      state: EncodeDataEntry[],
      action: PayloadAction<EncodeDataEntry | EncodeDataEntry[]>
    ) => {
      const payload = Array.isArray(action.payload)
        ? action.payload
        : [action.payload];
      return updateArray("remove", state, payload);
    },
  },
});

const encodeDataReducer = encodeDataSlice.reducer;

export default encodeDataReducer;
export type { EncodeDataEntry };
