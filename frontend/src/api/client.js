const API_BASE_URL = '/api';

async function request(path, options = {}) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        credentials: 'include',
        headers: {
            ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
            ...(options.headers || {}),
        },
        ...options,
    });

    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json')
        ? await response.json()
        : await response.text();

    if (!response.ok) {
        const error = new Error('Request failed');
        error.status = response.status;
        error.data = data;
        throw error;
    }

    return data;
}

export const apiClient = {
    get(path) {
        return request(path, { method: 'GET' });
    },

    post(path, body) {
        return request(path, {
            method: 'POST',
            body: body instanceof FormData ? body : JSON.stringify(body),
        });
    },

    patch(path, body) {
        return request(path, {
            method: 'PATCH',
            body: JSON.stringify(body),
        });
    },

    delete(path) {
        return request(path, { method: 'DELETE' });
    },
};