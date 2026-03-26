import { apiClient } from './client';

export function getUsers() {
    return apiClient.get('/users/');
}

export function deleteUser(userId) {
    return apiClient.delete(`/users/${userId}/delete/`);
}

export function updateUser(userId, data) {
    return apiClient.patch(`/users/${userId}/`, data);
}