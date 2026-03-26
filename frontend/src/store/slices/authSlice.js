import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import {
    getCurrentUser,
    loginUser,
    logoutUser,
    registerUser,
} from '../../api/auth';

export const fetchCurrentUser = createAsyncThunk(
    'auth/fetchCurrentUser',
    async (_, { rejectWithValue }) => {
        try {
            const response = await getCurrentUser();
            return response.user;
        } catch (error) {
            return rejectWithValue(error.data || { error: 'Не удалось получить пользователя.' });
        }
    },
);

export const loginThunk = createAsyncThunk(
    'auth/login',
    async (payload, { rejectWithValue }) => {
        try {
            const response = await loginUser(payload);
            return response.user;
        } catch (error) {
            return rejectWithValue(error.data || { error: 'Ошибка входа.' });
        }
    },
);

export const registerThunk = createAsyncThunk(
    'auth/register',
    async (payload, { rejectWithValue }) => {
        try {
            const response = await registerUser(payload);
            return response.user;
        } catch (error) {
            return rejectWithValue(error.data || { error: 'Ошибка регистрации.' });
        }
    },
);

export const logoutThunk = createAsyncThunk(
    'auth/logout',
    async (_, { rejectWithValue }) => {
        try {
            await logoutUser();
            return null;
        } catch (error) {
            return rejectWithValue(error.data || { error: 'Ошибка выхода.' });
        }
    },
);

const initialState = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    isAuthChecked: false,
    error: null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        clearAuthError(state) {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchCurrentUser.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchCurrentUser.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isAuthChecked = true;
                state.user = action.payload;
                state.isAuthenticated = true;
            })
            .addCase(fetchCurrentUser.rejected, (state) => {
                state.isLoading = false;
                state.isAuthChecked = true;
                state.user = null;
                state.isAuthenticated = false;
            })

            .addCase(loginThunk.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(loginThunk.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isAuthChecked = true;
                state.user = action.payload;
                state.isAuthenticated = true;
            })
            .addCase(loginThunk.rejected, (state, action) => {
                state.isLoading = false;
                state.isAuthChecked = true;
                state.error = action.payload;
            })

            .addCase(registerThunk.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(registerThunk.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isAuthChecked = true;
                state.user = action.payload;
                state.isAuthenticated = true;
            })
            .addCase(registerThunk.rejected, (state, action) => {
                state.isLoading = false;
                state.isAuthChecked = true;
                state.error = action.payload;
            })

            .addCase(logoutThunk.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(logoutThunk.fulfilled, (state) => {
                state.isLoading = false;
                state.isAuthChecked = true;
                state.user = null;
                state.isAuthenticated = false;
            })
            .addCase(logoutThunk.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            });
    },
});

export const { clearAuthError } = authSlice.actions;
export default authSlice.reducer;