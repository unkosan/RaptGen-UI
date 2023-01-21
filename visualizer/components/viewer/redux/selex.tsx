import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { combineReducers } from "@reduxjs/toolkit";

type SelexDataElement = {
    sequence: string;
    randomRegion: string;
    duplicates: number;
    coord_x: number;
    coord_y: number;
}

type VaeConfig = {
    vaeName: string;
    sessionId: number;
}

type SelexConfig = {
    forwardAdapter: string;
    reverseAdapter: string;
    minCount: number;
    randomRegionLength: number;
    tolerance: number;
}

const selexDataSlice = createSlice({
    name: 'selexData',
    initialState: [] as SelexDataElement[],
    reducers: {
        setSelexData: (state: SelexDataElement[], action: PayloadAction<SelexDataElement[]>) => {
            return action.payload
        },
    }
})

const vaeConfigSlice = createSlice({
    name: 'vaeConfig',
    initialState: {
        vaeName: '',
        sessionId: 0,
    },
    reducers: {
        setVaeConfig: (state: VaeConfig, action: PayloadAction<VaeConfig>) => {
            return action.payload
        },
    }
})

const selexConfigSlice = createSlice({
    name: 'selexConfig',
    initialState: {
        forwardAdapter: '',
        reverseAdapter: '',
        minCount: 5,
        randomRegionLength: 0,
        tolerance: 0,
    },
    reducers: {
        setSelexConfig: (state: SelexConfig, action: PayloadAction<SelexConfig>) => {
            return action.payload
        },
        setMinCount: (state: SelexConfig, action: PayloadAction<number>) => {
            let newState: SelexConfig = { ...state };
            newState.minCount = action.payload;
            return newState;
        },
    },
})

const selexReducer = combineReducers({
    selexData: selexDataSlice.reducer,
    vaeConfig: vaeConfigSlice.reducer,
    selexConfig: selexConfigSlice.reducer,
})

export default selexReducer
export const { setSelexData } = selexDataSlice.actions
export const { setVaeConfig } = vaeConfigSlice.actions
export const { setSelexConfig, setMinCount } = selexConfigSlice.actions

export type { SelexDataElement, VaeConfig, SelexConfig }