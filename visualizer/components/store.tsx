import { configureStore } from '@reduxjs/toolkit';
import { combineReducers } from 'redux';

import inputDataReducer from './store-redux/input-data';
import selexReducer from './store-redux/selex-data';
import measuredDataReducer from './store-redux/measured-data';

export const store = configureStore({
    reducer: {
        selexData: selexReducer,
        measuredData: measuredDataReducer,
        inputData: inputDataReducer,
    }
});

export type RootState = ReturnType<typeof store.getState>