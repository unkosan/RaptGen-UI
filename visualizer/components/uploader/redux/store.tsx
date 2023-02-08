import { configureStore, PayloadAction } from "@reduxjs/toolkit"
import { createSlice } from "@reduxjs/toolkit"

import vaeConfigReducer from "./vae"
import measuredDataReducer from "./measured"
import gmmConfigReducer from "./gmm"

const uploadTypeSlice = createSlice({
    name: 'uploadType',
    initialState: 'vae' as 'vae' | 'gmm' | 'measured',
    reducers: {
        setUploadType: (state: 'vae' | 'gmm' | 'measured', action: PayloadAction<'vae' | 'gmm' | 'measured'>) => {
            return action.payload
        }
    },
})

type PseudoRoutes = '/'
    | '/vae'
    | '/vae/encode'
    | '/vae/submit'
    | '/gmm'
    | '/measured-values'


const pseudoRouteSlice = createSlice({
    name: 'pseudoRoute',
    initialState: '/' as PseudoRoutes,
    reducers: {
        setPseudoRoute: (state: PseudoRoutes, action: PayloadAction<PseudoRoutes>) => {
            return action.payload
        }
    }
});

export const store = configureStore({
    reducer: {
        uploadType: uploadTypeSlice.reducer,
        pseudoRoutes: pseudoRouteSlice.reducer,
        vaeData: vaeConfigReducer,
        measuredData: measuredDataReducer,
        gmmData: gmmConfigReducer,
    }
});

export const { 
    setUploadType,
    setPseudoRoute,
} = { 
    ...uploadTypeSlice.actions,
    ...pseudoRouteSlice.actions,
}
export type RootState = ReturnType<typeof store.getState>
export type { PseudoRoutes }