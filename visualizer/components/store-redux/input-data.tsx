import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type InputDataElement = {
    key: string;
    id: string;
    seq: string;
    coord_x: number;
    coord_y: number;
    show: boolean;
    from: 'fasta' | 'manual';
    fasta_file: string | null;
}

const inputDataSlice = createSlice({
    name: 'inputData',
    initialState: [] as InputDataElement[],
    reducers: {
        setInputData: (state: InputDataElement[], action: PayloadAction<InputDataElement[]>) => {
            return action.payload
        }
    },
})

export default inputDataSlice.reducer
export const { setInputData } = inputDataSlice.actions
export type { InputDataElement }