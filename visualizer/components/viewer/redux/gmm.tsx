import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type GmmConfig = {
    gmmName: string;
    show: boolean;
    weights: number[];
    means: number[][];
    covariances: number[][][];
}

const gmmConfigSlice = createSlice({
    name: 'gmmConfig',
    initialState: {
        gmmName: '',
        show: false,
        weights: [] as number[],
        means: [] as number[][],
        covariances: [] as number[][][],
    },
    reducers: {
        setGmmConfig: (state: GmmConfig, action: PayloadAction<GmmConfig>) => {
            return action.payload
        },
        setGmmShow: (state: GmmConfig, action: PayloadAction<boolean>) => {
            let newState: GmmConfig = { ...state };
            newState.show = action.payload;
        },
    }
});

export default gmmConfigSlice.reducer
export const { setGmmConfig, setGmmShow } = gmmConfigSlice.actions
export type { GmmConfig }