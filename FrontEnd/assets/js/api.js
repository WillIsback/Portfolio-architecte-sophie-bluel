/**
 * Ce scripts javascript est utilisé pour gérér les appels API du backend. A l'aide de la documentation disponiible depuis le swagger http://localhost:5678/api-docs
 * Tout d'abord on va mettre en place la gestion du cache à l'aide de la librairie local storage pour éviter de faire des appels API inutiles.
 * Ensuite on va créer des fonctions pour chaque appel API nécessaire à l'application en découpant les appels par type (GET, POST, DELETE).
 * Mettre en place une structure pour la gestion des erreurs et des réponses.
 * Pour finir des fonctions getMonObjetUtilitaire avec une fonction lambda pour le mapping des données.
 */


/** Gestion du cache des données API */
const apiCACHE = {
    works: {
        data: null,
        timestamp: null,
        refreshTime: 5 * 60 * 1000, // 5 minutes
    },
    categories: {
        data: null,
        timestamp: null,
        refreshTime: 5 * 60 * 1000, // 5 minutes
    },
    auth: {
        get token() {
            return localStorage.getItem('auth_token');
        },
        set token(value) {
            if (value) {
                localStorage.setItem('auth_token', value);
            } else {
                localStorage.removeItem('auth_token');
            }
        },
        get userId() {
            return localStorage.getItem('auth_userId');
        },
        set userId(value) {
            if (value) {
                localStorage.setItem('auth_userId', value);
            } else {
                localStorage.removeItem('auth_userId');
            }
        },
        get timestamp() {
            return localStorage.getItem('auth_timestamp');
        },
        set timestamp(value) {
            if (value) {
                localStorage.setItem('auth_timestamp', value);
            } else {
                localStorage.removeItem('auth_timestamp');
            }
        },
        refreshTime: 120 * 60 * 1000, // 120 minutes
    }
};

/** Structure de gestion des messages erreurs des Response.status */
const apiERRORS = {
    400: "Requête invalide",
    401: "Non autorisé",
    404: "Ressource non trouvée",
    500: "Erreur interne du serveur",
};


const apiURL = "http://localhost:5678/api";

/** Vérifier si l'utilisateur est authentifié */
function isAuthenticated() {
    return isCacheValid(apiCACHE.auth);
}

/** Déconnecter l'utilisateur */
function logout() {
    apiCACHE.auth.token = null;
    apiCACHE.auth.userId = null;
    apiCACHE.auth.timestamp = null;
}

/** Utilitaire pour verifier la validité du cache */
function isCacheValid(cache) {
    if (cache === apiCACHE.auth) {
        const timestamp = parseInt(cache.timestamp);
        return cache.token && timestamp && (Date.now() < timestamp + cache.refreshTime);
    }
    return cache.data && (Date.now() < cache.timestamp + cache.refreshTime);
}

/** FETCH GET */
async function fetchWorks() {
    try {
        if (isCacheValid(apiCACHE.works)) {
            console.log("Utilisation du cache pour récupérer les œuvres");
            return apiCACHE.works.data;
        }
        console.log("Récupération des œuvres depuis l'API");
        const response = await fetch(`${apiURL}/works`);
        if (!response.ok) {
            throw new Error(apiERRORS[response.status] || "Erreur inconnue");
        }
        const data = await response.json();
        // Mise à jour du cache
        apiCACHE.works.data = data;
        apiCACHE.works.timestamp = Date.now();
        return data;
    } catch (error) {
        console.error("Erreur lors de la récupération des œuvres :", error);
        throw new Error(apiERRORS[error.status] || "Erreur inconnue");
    }
}

async function fetchCategories() {
    try {
        if (isCacheValid(apiCACHE.categories)) {
            console.log("Utilisation du cache pour récupérer les catégories");
            return apiCACHE.categories.data;
        }
        console.log("Récupération des catégories depuis l'API");
        const response = await fetch(`${apiURL}/categories`);
        if (!response.ok) {
            throw new Error(apiERRORS[response.status] || "Erreur inconnue");
        }
        const data = await response.json();
        // Mise à jour du cache
        apiCACHE.categories.data = data;
        apiCACHE.categories.timestamp = Date.now();
        return data;
    } catch (error) {
        console.error("Erreur lors de la récupération des catégories :", error);
        throw new Error(apiERRORS[error.status] || "Erreur inconnue");
    }
}

/** FETCH POST */
async function postLogin(credentials) {
    try {
        // Vérification du cache d'authentification
        if (isCacheValid(apiCACHE.auth)) {
            console.log("Utilisation du cache pour la connexion");
            return {
                token: apiCACHE.auth.token,
                userId: apiCACHE.auth.userId
            };
        }
        console.log("Connexion à l'API avec les identifiants fournis");
        // Vérification des identifiants
        if (!credentials || !credentials.email || !credentials.password) {
            throw new Error("Identifiants manquants");
        }
        const response = await fetch(`${apiURL}/users/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
        });
        if (!response.ok) {
            throw new Error(apiERRORS[response.status] || "Erreur inconnue");
        }
        const data = await response.json();
        // Mise à jour du cache d'authentification
        apiCACHE.auth.token = data.token;
        apiCACHE.auth.userId = data.userId;
        apiCACHE.auth.timestamp = Date.now();
        return data;
    } catch (error) {
        console.error("Erreur lors de la connexion :", error);
        throw new Error(apiERRORS[error.status] || "Erreur inconnue");
    }
}
async function postWork(workData) {
    try {
        // Vérification du cache d'authentification
        if (!apiCACHE.auth.token) {
            throw new Error("Utilisateur non authentifié");
        }
        
        console.log("Envoi des données de l'œuvre à l'API");
        
        const headers = {
            'Authorization': `Bearer ${apiCACHE.auth.token}`
        };
        
        // Si c'est un FormData, ne pas définir Content-Type (laissé automatique pour multipart)
        if (!(workData instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
            workData = JSON.stringify(workData);
        }
        
        const response = await fetch(`${apiURL}/works`, {
            method: 'POST',
            headers: headers,
            body: workData,
        });
        
        if (!response.ok) {
            throw new Error(apiERRORS[response.status] || "Erreur inconnue");
        }
        
        const data = await response.json();
        
        // Mettre à jour le cache des œuvres
        if (apiCACHE.works.data) {
            apiCACHE.works.data.push(data);
        }
        
        return data;
    } catch (error) {
        console.error("Erreur lors de l'envoi de l'œuvre :", error);
        throw new Error(apiERRORS[error.status] || "Erreur inconnue");
    }
}

/** FETCH DELETE */
async function deleteWork(workId) {
    try {
        // Vérification du cache d'authentification
        if (!apiCACHE.auth.token) {
            throw new Error("Utilisateur non authentifié");
        }
        
        console.log(`Suppression de l'œuvre avec l'ID ${workId}`);
        console.log(`Token disponible: ${apiCACHE.auth.token ? 'Oui' : 'Non'}`);
        console.log(`URL de l'appel: ${apiURL}/works/${workId}`);
        
        const response = await fetch(`${apiURL}/works/${workId}`, {
            method: 'DELETE',
            headers: {
                'accept': `*/*`,
                'Authorization': `Bearer ${apiCACHE.auth.token}`,
            },
        });
        
        console.log(`Status de la réponse: ${response.status}`);
        console.log(`Response OK: ${response.ok}`);
        
        // Essayer de lire le body de la réponse pour plus d'infos
        const responseText = await response.text();
        console.log(`Body de la réponse: ${responseText}`);
        
        if (!response.ok) {
            throw new Error(`${response.status}: ${apiERRORS[response.status] || "Erreur inconnue"} - ${responseText}`);
        }
        
        return { message: "Œuvre supprimée avec succès" };
    } catch (error) {
        console.error("Erreur lors de la suppression de l'œuvre :", error);
        console.error("Type d'erreur:", typeof error);
        console.error("Message d'erreur:", error.message);
        console.error("Stack trace:", error.stack);
        throw error; // Relancer l'erreur originale au lieu d'en créer une nouvelle
    }
}



/** Utilitaire fonction lambda pour le tri et le filtrage des œuvres */
function getWorkTitleList(works) {
    return works.map(work => work.title);
}

function getCategoriesNameList(categories){
    return categories.map(category => category.name)
}

export { fetchWorks, fetchCategories, postLogin, postWork, deleteWork, getCategoriesNameList, getWorkTitleList, isAuthenticated, logout}