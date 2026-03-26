import { apiClient } from './client';

export function getFiles() {
    return apiClient.get('/files/');
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

export function downloadFile(fileId) {
    window.open(`/api/files/${fileId}/download/`, '_blank');
}