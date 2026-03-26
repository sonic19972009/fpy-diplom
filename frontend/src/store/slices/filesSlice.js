import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getFiles, uploadFile, deleteFile } from '../../api/files';

export const fetchFiles = createAsyncThunk(
    'files/fetchFiles',
    async (_, { rejectWithValue }) => {
        try {
            return await getFiles();
        } catch (error) {
            return rejectWithValue(error.data);
        }
    },
);

export const uploadFileThunk = createAsyncThunk(
    'files/upload',
    async ({ file, comment }, { rejectWithValue }) => {
        try {
            return await uploadFile(file, comment);
        } catch (error) {
            return rejectWithValue(error.data);
        }
    },
);

export const deleteFileThunk = createAsyncThunk(
    'files/delete',
    async (fileId, { rejectWithValue }) => {
        try {
            await deleteFile(fileId);
            return fileId;
        } catch (error) {
            return rejectWithValue(error.data);
        }
    },
);

const filesSlice = createSlice({
    name: 'files',
    initialState: {
        items: [],
        isLoading: false,
        error: null,
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchFiles.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(fetchFiles.fulfilled, (state, action) => {
                state.isLoading = false;
                state.items = action.payload.files || [];
            })
            .addCase(fetchFiles.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            .addCase(uploadFileThunk.fulfilled, (state, action) => {
                state.items.unshift(action.payload.file);
            })

            .addCase(deleteFileThunk.fulfilled, (state, action) => {
                state.items = state.items.filter((f) => f.id !== action.payload);
            });
    },
});

export default filesSlice.reducer;