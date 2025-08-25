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

        // Configuration des headers conditionnelle
        const headers = {};

        // Ne pas ajouter Content-Type si c'est du FormData
        if (!(options.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        }

        // Ajouter les headers d'auth et personnalisés
        Object.assign(headers, this.getAuthHeaders(), options.headers || {});

        const config = {
            ...options,
            headers
        };

        try {
            console.log('API Request:', { url, method: config.method, headers });

            const response = await fetch(url, config);

            console.log('API Response status:', response.status);
            console.log('API Response headers:', Object.fromEntries(response.headers.entries()));

            // Gestion spécifique pour DELETE
            if (config.method === 'DELETE' && response.status === 204) {
                return { ok: true, status: 204 };
            }

            if (!response.ok) {
                let errorMessage = `HTTP error! status: ${response.status}`;

                try {
                    const errorText = await response.text();
                    console.log('Error response text:', errorText);

                    if (errorText) {
                        try {
                            const errorData = JSON.parse(errorText);
                            errorMessage += ` - ${JSON.stringify(errorData)}`;
                        } catch (parseError) {
                            errorMessage += ` - ${errorText}`;
                        }
                    }
                } catch (readError) {
                    console.warn('Could not read error response:', readError);
                }

                throw new Error(errorMessage);
            }

            // Vérifier le Content-Type de la réponse
            const contentType = response.headers.get('content-type');
            console.log('Response content-type:', contentType);

            if (contentType && contentType.includes('application/json')) {
                const responseText = await response.text();
                console.log('Response text:', responseText);

                if (responseText.trim() === '') {
                    console.warn('Empty JSON response');
                    return {};
                }

                try {
                    return JSON.parse(responseText);
                } catch (parseError) {
                    console.error('JSON parse error:', parseError);
                    console.error('Response text was:', responseText);
                    throw new Error(`Invalid JSON response: ${parseError.message}`);
                }
            }

            // Pour les réponses non-JSON
            return response;

        } catch (error) {
            console.error('API request failed:', {
                url,
                method: config.method,
                error: error.message
            });
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
        if (!workId || isNaN(workId)) {
            throw new Error('ID de work invalide');
        }

        const response = await this.request(`${CONFIG.ENDPOINTS.WORKS}/${workId}`, {
            method: 'DELETE'
        });

        // Vérifier explicitement le statut de la réponse
        if (response && !response.ok) {
            throw new Error(`Échec de la suppression: ${response.status} ${response.statusText}`);
        }

        return true;
    }

    async addWork(formData) {
        if (!formData) {
            throw new Error('FormData manquant');
        }

        // Pour FormData, ne pas définir Content-Type (le navigateur le fait automatiquement)
        const headers = {
            ...this.getAuthHeaders()
            // Pas de Content-Type pour FormData
        };

        try {
            const response = await this.request(CONFIG.ENDPOINTS.WORKS, {
                method: 'POST',
                headers,
                body: formData
            });

            console.log('Add work response:', response);
            return response;
        } catch (error) {
            console.error('API addWork error:', error);
            throw new Error(`Failed to add work: ${error.message}`);
        }
    }
}

export const apiService = new ApiService();