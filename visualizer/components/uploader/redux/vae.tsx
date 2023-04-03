import { combineReducers, createSlice, PayloadAction } from "@reduxjs/toolkit";

type SelexDataElement = {
    sequence: string;
    randomRegion: string;
    duplicates: number;
    coord_x: number;
    coord_y: number;
}

// Input data
type VaeConfigInput = {
    vaeHash: string;
    selexHash: string;
    modelName: string;
    targetLength: number;
    forwardAdapter: string;
    reverseAdapter: string;
    uniqueSeqs: string[];
    duplicates: number[];
    adapterMask: boolean[];
}

// The number of filtered sequences
type VaeConfigNumbers = {
    allEntries: number;
    uniqueEntries: number;
    uniqueEntriesWithAdapters: number;
}

// for progress bar
type VaeConfigProgress = {
    id: string;
    state: 'IDLE' | 'PENDING' | 'PROGRESS' | 'SUCCESS' | 'FAILURE';
    value: number;
}

// other configures (not required for submission)
type VaeConfigOther = {
    timeStamp: string | null;
    tolerance: number | null;
    minCount: number | null;
    trainEpochs: number | null;
    betaWeightDuration: number | null;
    matchForcingDuration: number | null;
    matchForcingCost: number | null;
    earlyStopEpochs: number | null;
    seed: number | null;
    numWorkers: number | null;
    isPinMemory: boolean | null;
}

const inputSlice = createSlice({
    name: 'input',
    initialState: {
        vaeHash: '',
        selexHash: '',
        modelName: '',
        targetLength: 0,
        forwardAdapter: '',
        reverseAdapter: '',
        uniqueSeqs: [] as string[],
        duplicates: [] as number[],
        adapterMask: [] as boolean[],
    },
    reducers: {
        setVaeInput: (state: VaeConfigInput, action: PayloadAction<VaeConfigInput>) => {
            return action.payload
        }
    }
})

const numbersSlice = createSlice({
    name: 'numbers',
    initialState: {
        allEntries: 0,
        uniqueEntries: 0,
        uniqueEntriesWithAdapters: 0,
    },
    reducers: {
        setVaeNumbers: (state: VaeConfigNumbers, action: PayloadAction<VaeConfigNumbers>) => {
            return action.payload
        }
    }
})

const progressSlice = createSlice({
    name: 'progress',
    initialState: {
        id: '',
        state: 'IDLE' as 'IDLE' | 'PENDING' | 'PROGRESS' | 'SUCCESS' | 'FAILURE',
        value: 0,
    },
    reducers: {
        setVaeProgress: (state: VaeConfigProgress, action: PayloadAction<VaeConfigProgress>) => {
            return action.payload
        }
    }
})

const dataSlice = createSlice({
    name: 'selexData',
    initialState: [] as SelexDataElement[],
    reducers: {
        setSelexData: (state: SelexDataElement[], action: PayloadAction<SelexDataElement[]>) => {
            return action.payload
        }
    }
})

const otherSlice = createSlice({
    name: 'other',
    initialState: {
        timeStamp: null as string | null,
        tolerance: null as number | null,
        minCount: null as number | null,
        trainEpochs: null as number | null,
        betaWeightDuration: null as number | null,
        matchForcingDuration: null as number | null,
        matchForcingCost: null as number | null,
        earlyStopEpochs: null as number | null,
        seed: null as number | null,
        numWorkers: null as number | null,
        isPinMemory: null as boolean | null,
    },
    reducers: {
        setVaeOther: (state: VaeConfigOther, action: PayloadAction<VaeConfigOther>) => {
            return action.payload
        }
    }
})

const vaeConfigReducer = combineReducers({
    input: inputSlice.reducer,
    numbers: numbersSlice.reducer,
    progress: progressSlice.reducer,
    selexData: dataSlice.reducer,
    other: otherSlice.reducer,
})

export default vaeConfigReducer
export const { 
    setVaeInput, 
    setVaeNumbers, 
    setVaeProgress, 
    setSelexData,
    setVaeOther 
} = { 
    ...inputSlice.actions, 
    ...numbersSlice.actions, 
    ...progressSlice.actions, 
    ...dataSlice.actions,
    ...otherSlice.actions 
}

export type { 
    SelexDataElement, 
    VaeConfigInput, 
    VaeConfigNumbers, 
    VaeConfigProgress, 
    VaeConfigOther
}