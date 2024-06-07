import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type MeasuredDataElement = {
    ID: string;
    sequence: string;
    randomRegion: string;
    hue: string;
    coord_x: number;
    coord_y: number;
}

const measuredDataSlice = createSlice({
    name: 'measuredData',
    initialState: [] as MeasuredDataElement[],
    reducers: {
        setMeasuredData: (state: MeasuredDataElement[], action: PayloadAction<MeasuredDataElement[]>) => {
            return action.payload
        }
    },
})

export default measuredDataSlice.reducer
export const { setMeasuredData } = measuredDataSlice.actions
export type { MeasuredDataElement }