import { configureStore } from '@reduxjs/toolkit';
import { combineReducers } from 'redux';

import inputDataReducer from './input';
import selexReducer from './selex';
import measuredDataReducer from './measured';

export const store = configureStore({
    reducer: {
        selexData: selexReducer,
        measuredData: measuredDataReducer,
        inputData: inputDataReducer,
    }
});

export type RootState = ReturnType<typeof store.getState>