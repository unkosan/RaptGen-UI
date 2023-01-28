import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type DecodeDataElement = {
    key: string;
    id: string;
    seq: string;
    coord_x: number;
    coord_y: number;
    show: boolean;
}

const decodeDataSlice = createSlice({
    name: 'decodeData',
    initialState: [] as DecodeDataElement[],
    reducers: {
        setDecodeData: (state: DecodeDataElement[], action: PayloadAction<DecodeDataElement[]>) => {
            return action.payload
        }
    },
})

export default decodeDataSlice.reducer
export const { setDecodeData } = decodeDataSlice.actions
export type { DecodeDataElement }