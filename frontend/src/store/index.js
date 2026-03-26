import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import filesReducer from './slices/filesSlice';
import usersReducer from './slices/usersSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        files: filesReducer,
        users: usersReducer,
    },
});