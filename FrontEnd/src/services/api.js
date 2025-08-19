import { CONFIG } from '../../config/config.js';

class ApiService {
    constructor() {
        this.baseURL = CONFIG.API_BASE_URL;
    }

    getAuthHeaders() {
        const token = localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN);
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...this.getAuthHeaders(),
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, config);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }

            return response;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    async getWorks() {
        return this.request(CONFIG.ENDPOINTS.WORKS);
    }

    async getCategories() {
        return this.request(CONFIG.ENDPOINTS.CATEGORIES);
    }

    async login(credentials) {
        return this.request(CONFIG.ENDPOINTS.LOGIN, {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
    }

    async deleteWork(workId) {
        await this.request(`${CONFIG.ENDPOINTS.WORKS}/${workId}`, {
            method: 'DELETE'
        });
        return true;
    }

    async addWork(formData) {
        const token = localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN);
        const response = await fetch(`${this.baseURL}${CONFIG.ENDPOINTS.WORKS}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to add work: ${errorText}`);
        }

        return response.json();
    }
}

export const apiService = new ApiService();