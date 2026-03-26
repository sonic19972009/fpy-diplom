import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { deleteUser, getUsers, updateUser } from '../../api/users';

export const fetchUsers = createAsyncThunk(
    'users/fetch',
    async (_, { rejectWithValue }) => {
        try {
            return await getUsers();
        } catch (error) {
            return rejectWithValue(error.data);
        }
    },
);

export const deleteUserThunk = createAsyncThunk(
    'users/delete',
    async (userId, { rejectWithValue }) => {
        try {
            await deleteUser(userId);
            return userId;
        } catch (error) {
            return rejectWithValue(error.data);
        }
    },
);

export const toggleAdminThunk = createAsyncThunk(
    'users/toggleAdmin',
    async ({ userId, is_admin }, { rejectWithValue }) => {
        try {
            const response = await updateUser(userId, { is_admin });
            return response.user;
        } catch (error) {
            return rejectWithValue(error.data);
        }
    },
);

const usersSlice = createSlice({
    name: 'users',
    initialState: {
        items: [],
        isLoading: false,
        error: null,
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchUsers.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(fetchUsers.fulfilled, (state, action) => {
                state.isLoading = false;
                state.items = action.payload.users || [];
            })
            .addCase(fetchUsers.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            .addCase(deleteUserThunk.fulfilled, (state, action) => {
                state.items = state.items.filter((u) => u.id !== action.payload);
            })

            .addCase(toggleAdminThunk.fulfilled, (state, action) => {
                state.items = state.items.map((u) =>
                    u.id === action.payload.id ? action.payload : u,
                );
            });
    },
});

export default usersSlice.reducer;