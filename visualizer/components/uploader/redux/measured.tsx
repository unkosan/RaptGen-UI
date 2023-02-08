import { combineReducers, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { SelexDataElement } from "./vae";

type MeasuredDataElement = {
    ID: string;
    sequence: string;
    randomRegion: string;
    hue: string | number;
    coord_x: number;
    coord_y: number;
}

// Input data
type MeasuredConfigInput = {
    name: string;
    measuredFileName: string;
    measuredFileData: File | null;
}

// Vae data
type MeasuredConfigVaeData = {
    sessionId: number;
    vaeName: string;
}

const inputSlice = createSlice({
    name: 'input',
    initialState: {
        name: '',
        measuredFileName: '',
        measuredFileData: null as File | null,
    },
    reducers: {
        setMeasuredConfigInput: (state: MeasuredConfigInput, action: PayloadAction<MeasuredConfigInput>) => {
            return action.payload
        }
    },
})

const vaeDataSlice = createSlice({
    name: 'vaeData',
    initialState: {
        sessionId: 0,
        vaeName: '',
    },
    reducers: {
        setMeasuredConfigVaeData: (state: MeasuredConfigVaeData, action: PayloadAction<MeasuredConfigVaeData>) => {
            return action.payload
        }
    },
})

const selexDataSlice = createSlice({
    name: 'selexData',
    initialState: [] as SelexDataElement[],
    reducers: {
        setMeasuredConfigSelexData: (state: SelexDataElement[], action: PayloadAction<SelexDataElement[]>) => {
            return action.payload
        }
    }
})

const measuredDataReducer = combineReducers({
    input: inputSlice.reducer,
    vaeData: vaeDataSlice.reducer,
    selexData: selexDataSlice.reducer,
})

export default measuredDataReducer
export const {
    setMeasuredConfigInput,
    setMeasuredConfigVaeData,
    setMeasuredConfigSelexData,
} = {
    ...inputSlice.actions,
    ...vaeDataSlice.actions,
    ...selexDataSlice.actions
}

export type {
    MeasuredDataElement,
    MeasuredConfigInput,
}