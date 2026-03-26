import { apiClient } from './client';

export function getFiles(userId = null) {
    const query = userId ? `?user_id=${userId}` : '';
    return apiClient.get(`/files/${query}`);
}

export function uploadFile(file, comment) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('comment', comment || '');

    return apiClient.post('/files/upload/', formData);
}

export function deleteFile(fileId) {
    return apiClient.delete(`/files/${fileId}/`);
}

export function renameFile(fileId, originalName) {
    return apiClient.patch(`/files/${fileId}/rename/`, {
        original_name: originalName,
    });
}

export function updateFileComment(fileId, comment) {
    return apiClient.patch(`/files/${fileId}/comment/`, {
        comment,
    });
}

export function createPublicLink(fileId) {
    return apiClient.post(`/files/${fileId}/public-link/`, {});
}

export function downloadFile(fileId) {
    window.open(`/api/files/${fileId}/download/`, '_blank');
}