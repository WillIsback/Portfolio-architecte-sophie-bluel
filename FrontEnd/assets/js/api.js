// Configuration du cache
const CACHE_CONFIG = {
    WORKS_KEY: 'cached_works',
    CATEGORIES_KEY: 'cached_categories',
    EXPIRY_TIME: 5 * 60 * 1000 // 5 minutes
}

// ***************** Utilitaires de cache *****************
function getCachedData(key) {
    try {
        const cached = localStorage.getItem(key);
        if (!cached) return null;
        
        const data = JSON.parse(cached);
        const now = new Date().getTime();
        
        // Vérifier si les données ont expiré
        if (now - data.timestamp > CACHE_CONFIG.EXPIRY_TIME) {
            localStorage.removeItem(key);
            return null;
        }
        
        console.log(`Données récupérées du cache: ${key}`);
        return data.content;
    } catch (error) {
        console.error('Erreur lors de la lecture du cache:', error);
        localStorage.removeItem(key);
        return null;
    }
}

function setCachedData(key, data) {
    try {
        const cacheObject = {
            content: data,
            timestamp: new Date().getTime()
        };
        localStorage.setItem(key, JSON.stringify(cacheObject));
        console.log(`Données sauvegardées en cache: ${key}`);
    } catch (error) {
        console.error('Erreur lors de la sauvegarde en cache:', error);
    }
}

function invalidateCache() {
    localStorage.removeItem(CACHE_CONFIG.WORKS_KEY);
    localStorage.removeItem(CACHE_CONFIG.CATEGORIES_KEY);
    console.log('Cache invalidé');
}

// ***************** GET request to fetch works and categories *****************
async function getCategories() {
    // 1. Vérifier le cache d'abord
    const cachedCategories = getCachedData(CACHE_CONFIG.CATEGORIES_KEY);
    if (cachedCategories) {
        return cachedCategories;
    }

    // 2. Si pas en cache, faire la requête API
    try {
        console.log('Récupération des catégories depuis l\'API...');
        const response = await fetch('http://localhost:5678/api/categories', {
            method: 'GET',
            headers: {
                'accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(data);
        
        // 3. Sauvegarder en cache
        setCachedData(CACHE_CONFIG.CATEGORIES_KEY, data);
        
        return data;
    } catch (error) {
        console.error('Erreur api/categories:', error);
        throw error;
    }
}

async function getWorkData() {
    // 1. Vérifier le cache d'abord
    const cachedWorks = getCachedData(CACHE_CONFIG.WORKS_KEY);
    if (cachedWorks) {
        return cachedWorks;
    }

    // 2. Si pas en cache, faire la requête API
    try {
        console.log('Récupération des works depuis l\'API...');
        const response = await fetch('http://localhost:5678/api/works', {
            method: 'GET',
            headers: {
                'accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(data);
        
        // 3. Sauvegarder en cache
        setCachedData(CACHE_CONFIG.WORKS_KEY, data);
        
        return data;
    } catch (error) {
        console.error('Erreur api/works:', error);
        throw error;
    }
}



// ***************** POST request to fetch login and new works *****************
async function postLogin(credentials) {
    try {
        const response = await fetch('http://localhost:5678/api/users/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(credentials)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(data);
        return data;
    } catch (error) {
        console.error('Erreur api/users/login:', error);
        throw error;
    }
}

async function postNewWork(workData) {
    try {
        const response = await fetch('http://localhost:5678/api/works', { // Correction: 'workss' -> 'works'
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(workData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(data);
        
        // IMPORTANT: Invalider le cache après ajout
        invalidateCache();
        
        return data;
    } catch (error) {
        console.error('Erreur api/works:', error);
        throw error;
    }
}

// ***************** DELETE request to fetch old works *****************
async function deleteWork(workId) {
    try {
        const response = await fetch(`http://localhost:5678/api/works/${workId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': '*/*'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        console.log(`Work with ID ${workId} deleted successfully.`);
        
        // IMPORTANT: Invalider le cache après suppression
        invalidateCache();
        
    } catch (error) {
        console.error('Erreur api/works:', error);
        throw error;
    }
}

export { getCategories, getWorkData, postLogin, postNewWork, deleteWork }; // Export functions for use in other modules