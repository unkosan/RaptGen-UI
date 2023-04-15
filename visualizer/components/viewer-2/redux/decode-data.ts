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
  initialState: [
    {
      key: 0,
      id: "grid",
      sequence: "",
      randomRegion: "",
      coordX: 0,
      coordY: 0,
      isSelected: false,
      isShown: true,
      category: "manual",
      seriesName: "grid",
    },
  ] as DecodeDataEntry[],
  reducers: {
    set: (
      state: DecodeDataEntry[],
      action: PayloadAction<DecodeDataEntry[]>
    ) => {
      return action.payload;
    },
  },
});

const decodeDataReducer = decodeDataSlice.reducer;

export default decodeDataReducer;
export type { DecodeDataEntry };
