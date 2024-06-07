// redux-thunk を使うと複雑になるので、encode, decode API への問い合わせは呼び出し元で行う。
import { PayloadAction, createSlice } from "@reduxjs/toolkit";

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
    set: (
      state: EncodeDataEntry[],
      action: PayloadAction<EncodeDataEntry[]>
    ) => {
      return action.payload;
    },
  },
});

const encodeDataReducer = encodeDataSlice.reducer;

export default encodeDataReducer;
export type { EncodeDataEntry };
