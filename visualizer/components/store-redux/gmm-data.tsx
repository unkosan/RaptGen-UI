import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type GmmConfig = {
    gmmName: string;
    show: boolean;
    mus: number[][];
    covs: number[][][];
}

const gmmConfigSlice = createSlice({
    name: 'gmmConfig',
    initialState: {
        gmmName: '',
        show: false,
        mus: [] as number[][],
        covs: [] as number[][][],
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