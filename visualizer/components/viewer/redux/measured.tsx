import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { combineReducers } from "redux";

type MeasuredDataElement = {
    ID: string;
    sequence: string;
    randomRegion: string;
    hue: string;
    coord_x: number;
    coord_y: number;
}

type MeasuredDataConfig = {
    show: boolean;
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

const measuredDataConfigSlice = createSlice({
    name: 'measuredDataConfig',
    initialState: {
        show: true,
    },
    reducers: {
        setMeasuredDataConfig: (state: MeasuredDataConfig, action: PayloadAction<MeasuredDataConfig>) => {
            return action.payload
        },
    }
})

const measuredDataReducer = combineReducers({
    data: measuredDataSlice.reducer,
    config: measuredDataConfigSlice.reducer,
})

export default measuredDataReducer
export const { setMeasuredData } = measuredDataSlice.actions
export const { setMeasuredDataConfig } = measuredDataConfigSlice.actions
export type { MeasuredDataElement, MeasuredDataConfig }