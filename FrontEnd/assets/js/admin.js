import { isAuthenticated, logout } from "./api.js";   
import { openGalleryModal } from "./modal/gallery-modal.js";

const loginLink = document.getElementById('login-link');

// ***************** Mode Administrateur *****************

function checkAdminMode() {
    if (isAuthenticated()) {
        enableAdminMode();
        updateLoginLink();
        console.log("Mode administrateur activé.");
    } else {
        disableAdminMode();
        console.log("Mode administrateur désactivé.");
    }
}

function enableAdminMode() {
    // Créer le bandeau administrateur
    createAdminBanner();
    
    // Ajouter les boutons d'édition
    addEditButtons();
    
    // Masquer les filtres en mode admin
    const filters = document.querySelector('.filters');
    if (filters) {
        filters.style.display = 'none';
    }
}


function disableAdminMode() {
    // Supprimer le bandeau admin
    const adminBanner = document.querySelector('.admin-banner');
    if (adminBanner) {
        adminBanner.remove();
    }
    
    // Supprimer les boutons d'édition
    document.querySelectorAll('.edit-btn, .delete-btn').forEach(btn => btn.remove());
    
    // Réafficher les filtres
    const filters = document.querySelector('.filters');
    if (filters) {
        filters.style.display = 'flex';
    }
}

function createAdminBanner() {
    // Vérifier si le bandeau existe déjà
    if (document.querySelector('.admin-banner')) return;
    
    const banner = document.createElement('div');
    banner.className = 'admin-banner';
    banner.innerHTML = `
        <div class="admin-banner-content">
            <i class="fa-regular fa-pen-to-square"></i>
            <span>Mode édition</span>
        </div>
    `;
    banner.addEventListener('click', openGalleryModal);
    document.body.insertBefore(banner, document.body.firstChild);
}

function addEditButtons() {
    // Bouton modifier pour la section portfolio
    const portfolioTitle = document.querySelector('#portfolio h2');
    if (portfolioTitle && !portfolioTitle.querySelector('.edit-btn')) {
        const editBtn = document.createElement('button');
        editBtn.className = 'edit-btn';
        editBtn.innerHTML = '<i class="fa-regular fa-pen-to-square"></i> modifier';
        editBtn.addEventListener('click', openGalleryModal);
        
        const editContainer = document.createElement('div');
        editContainer.className = 'title-edit-container';
        editContainer.appendChild(portfolioTitle.cloneNode(true));
        editContainer.appendChild(editBtn);
        
        portfolioTitle.parentNode.replaceChild(editContainer, portfolioTitle);
    }
}


function updateLoginLink() {
    if (loginLink) {
        loginLink.textContent = 'logout';
        loginLink.href = '#';
        loginLink.addEventListener('click', logout_reload);
    }
}
function logout_reload() {
    logout(); // Appel de la fonction logout pour effacer les données d'authentification
    disableAdminMode();
    loginLink.textContent = 'login';
    location.reload();
    console.log(isAuthenticated);
}

// ***************** Événement login link modifié *****************
loginLink.addEventListener('click', async () => {
    // Si déjà connecté, ne pas rediriger
    if (isAuthenticated) {
        return; // Le logout est géré par updateLoginLink()
    } else {
        console.log('Aucune donnée de connexion trouvée, redirection vers la page de connexion.');
        window.location.href = "./assets/pages/login.html";
    }
});

export { checkAdminMode }; // Exporter la fonction pour l'utiliser dans d'autres fichiers