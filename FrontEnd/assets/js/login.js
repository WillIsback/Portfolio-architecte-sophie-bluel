import { postLogin } from "./api.js";

const loginForm = document.getElementById("login-form");
const CACHE_CONFIG = {
    EXPIRY_TIME: 60 * 60 * 1000 // 5 minutes
}

if (loginForm) {
    loginForm.onsubmit = function (event) {
        event.preventDefault(); // Prevent the default form submission

        const emailInput = document.getElementById("email");
        const passwordInput = document.getElementById("password");

        // Regex pour valider email et mot de passe
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{3,}$/; 

        let valid = true;
        let errors = [];

        if (!emailRegex.test(emailInput.value)) {
            valid = false;
            errors.push("L'email doit être valide.");
        }   

        if (!passwordRegex.test(passwordInput.value)) {
            valid = false;
            errors.push("Le mot de passe doit contenir au moins 3 caractères, une majuscule et un chiffre.");
        }
        if (!valid) {
            displayError(errors.join('\n'));
            return;
        }

        // Si les validations passent, on envoie les données
        postLogin({
            email: emailInput.value,
            password: passwordInput.value
        })
        .then(data => {
            // ✅ 'data' contient directement {userId: 1, token: "..."}
            // PAS d'objet Response avec .status !
            if (data && data.token) {
                console.log("Connexion réussie !", data);
                
                const cacheObject = {
                    content: data,
                    timestamp: new Date().getTime()
                };
                localStorage.setItem('login', JSON.stringify(cacheObject));

                window.location.href = "../../index.html";
            } else {
                console.error("Échec de la connexion : Pas de token reçu");
            }
        })
        .catch(error => {
            // ✅ Correction : 'error' au lieu de 'response.status'
            console.error("Erreur réseau ou serveur :", error);
        });
    };
}
function displayError(message, type ='error') {
    // Nettoyer les erreurs précédentes
    const lastError = document.querySelector('.error-message');
    if (lastError) {
        lastError.remove();
    }

    // Créer le conteneur du message d'erreur
    const errorDiv = document.createElement('div');
    errorDiv.className = `error-message ${type}`;
    errorDiv.textContent = message;
    loginForm.insertBefore(errorDiv, loginForm.firstChild);

}


function getLoginCache() {
    try {
        const key = 'login';
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

function isLoggedIn() {
    const loginCacheData = getLoginCache();
    return !!(loginCacheData && loginCacheData.token);
}


export { isLoggedIn };