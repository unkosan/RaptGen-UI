import { combineReducers, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { SelexDataElement } from "./vae";

// Input data
type GmmConfigInput = {
    vaeFileName: string;
    gmmFileName: string;
    gmmFile: File | null;
    modelName: string;
}

// parameters on GMM
type GmmConfigParams = {
    numComponents: number;
    weights: number[];
    means: number[][];
    covariances: number[][][];
}

// other configures (not required for submission)
type GmmConfigOther = {
    seed: number | null;
    modelType: string | null;
}

const inputSlice = createSlice({
    name: 'input',
    initialState: {
        vaeFileName: '',
        gmmFileName: '',
        gmmFile: null as File | null,
        modelName: '',
    },
    reducers: {
        setGmmInput: (state: GmmConfigInput, action: PayloadAction<GmmConfigInput>) => {
            return action.payload
        }
    }
});

const paramsSlice = createSlice({
    name: 'params',
    initialState: {
        numComponents: 0,
        weights: [] as number[],
        means: [] as number[][],
        covariances: [] as number[][][],
    },
    reducers: {
        setGmmParams: (state: GmmConfigParams, action: PayloadAction<GmmConfigParams>) => {
            return action.payload
        }
    }
});

const dataSlice = createSlice({
    name: 'selexData',
    initialState: [] as SelexDataElement[],
    reducers: {
        setGmmSelexData: (state: SelexDataElement[], action: PayloadAction<SelexDataElement[]>) => {
            return action.payload
        }
    }
})

const otherSlice = createSlice({
    name: 'other',
    initialState: {
        seed: null as number | null,
        modelType: null as string | null,
    },
    reducers: {
        setGmmOther: (state: GmmConfigOther, action: PayloadAction<GmmConfigOther>) => {
            return action.payload
        }
    }
});

const gmmConfigReducer = combineReducers({
    input: inputSlice.reducer,
    params: paramsSlice.reducer,
    selexData: dataSlice.reducer,
    other: otherSlice.reducer,
});

export default gmmConfigReducer;
export const {
    setGmmInput,
    setGmmParams,
    setGmmSelexData,
    setGmmOther,
} = { 
    ...inputSlice.actions, 
    ...paramsSlice.actions, 
    ...dataSlice.actions, 
    ...otherSlice.actions 
};

export type {
    GmmConfigInput,
    GmmConfigParams,
    GmmConfigOther,
}