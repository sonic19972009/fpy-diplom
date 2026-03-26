import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
    createPublicLink,
    deleteFile,
    getFiles,
    renameFile,
    updateFileComment,
    uploadFile,
} from '../../api/files';

export const fetchFiles = createAsyncThunk(
    'files/fetchFiles',
    async (userId = null, { rejectWithValue }) => {
        try {
            return await getFiles(userId);
        } catch (error) {
            return rejectWithValue(error.data || { error: 'Ошибка загрузки файлов.' });
        }
    },
);

export const uploadFileThunk = createAsyncThunk(
    'files/upload',
    async ({ file, comment }, { rejectWithValue }) => {
        try {
            return await uploadFile(file, comment);
        } catch (error) {
            return rejectWithValue(error.data || { error: 'Ошибка загрузки файла.' });
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
            return rejectWithValue(error.data || { error: 'Ошибка удаления файла.' });
        }
    },
);

export const renameFileThunk = createAsyncThunk(
    'files/rename',
    async ({ fileId, originalName }, { rejectWithValue }) => {
        try {
            const response = await renameFile(fileId, originalName);
            return response.file;
        } catch (error) {
            return rejectWithValue(error.data || { error: 'Ошибка переименования файла.' });
        }
    },
);

export const updateFileCommentThunk = createAsyncThunk(
    'files/updateComment',
    async ({ fileId, comment }, { rejectWithValue }) => {
        try {
            const response = await updateFileComment(fileId, comment);
            return response.file;
        } catch (error) {
            return rejectWithValue(error.data || { error: 'Ошибка обновления комментария.' });
        }
    },
);

export const createPublicLinkThunk = createAsyncThunk(
    'files/createPublicLink',
    async (fileId, { rejectWithValue }) => {
        try {
            const response = await createPublicLink(fileId);
            return {
                fileId,
                public_token: response.public_token,
                public_url: response.public_url,
            };
        } catch (error) {
            return rejectWithValue(error.data || { error: 'Ошибка создания публичной ссылки.' });
        }
    },
);

const initialState = {
    items: [],
    isLoading: false,
    error: null,
};

const updateFileInState = (state, updatedFile) => {
    state.items = state.items.map((file) =>
        file.id === updatedFile.id ? { ...file, ...updatedFile } : file,
    );
};

const filesSlice = createSlice({
    name: 'files',
    initialState,
    reducers: {
        clearFilesError(state) {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchFiles.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchFiles.fulfilled, (state, action) => {
                state.isLoading = false;
                state.items = action.payload.files || [];
            })
            .addCase(fetchFiles.rejected, (state, action) => {
                state.isLoading = false;
                state.items = [];
                state.error = action.payload;
            })

            .addCase(uploadFileThunk.pending, (state) => {
                state.error = null;
            })
            .addCase(uploadFileThunk.fulfilled, (state, action) => {
                state.items.unshift(action.payload.file);
            })
            .addCase(uploadFileThunk.rejected, (state, action) => {
                state.error = action.payload;
            })

            .addCase(deleteFileThunk.fulfilled, (state, action) => {
                state.items = state.items.filter((file) => file.id !== action.payload);
            })

            .addCase(renameFileThunk.fulfilled, (state, action) => {
                updateFileInState(state, action.payload);
            })

            .addCase(updateFileCommentThunk.fulfilled, (state, action) => {
                updateFileInState(state, action.payload);
            })

            .addCase(createPublicLinkThunk.fulfilled, (state, action) => {
                state.items = state.items.map((file) =>
                    file.id === action.payload.fileId
                        ? {
                              ...file,
                              public_token: action.payload.public_token,
                              public_url: action.payload.public_url,
                          }
                        : file,
                );
            });
    },
});

export const { clearFilesError } = filesSlice.actions;
export default filesSlice.reducer;