import { CONFIG } from '../../../config/config.js';
import { SELECTORS, EVENTS, CLASSES } from '../../utils/constants.js';

export class AdminManager extends EventTarget {
    constructor(authService) {
        super();
        this.authService = authService;
        this.adminBanner = null;
        this.editButtons = [];

        this.init();
    }

    init() {
        if (!this.authService) {
            console.error('AdminManager: AuthService is required');
            return;
        }

        // Ecouter les changements d'authentification
        this.authService.addEventListener(EVENTS.AUTH_CHANGED, (event) => {
            this.handleAuthChange(event.detail);
        });

        // Verifier l'etat initial
        this.handleAuthChange({ isLoggedIn: this.authService.isLoggedIn });
    }

    handleAuthChange(detail) {
        if (detail.isLoggedIn) {
            this.enableAdminMode();
        } else {
            this.disableAdminMode();
        }
    }

    enableAdminMode() {
        console.log('AdminManager: Enabling admin mode');

        // Creer le bandeau administrateur
        this.createAdminBanner();

        // Ajouter les boutons d'edition
        this.addEditButtons();

        // Masquer les filtres en mode admin
        this.toggleFilters(false);

        // Mettre a jour le lien de connexion
        this.updateLoginLink();
    }

    disableAdminMode() {
        console.log('AdminManager: Disabling admin mode');

        // Supprimer le bandeau admin
        this.removeAdminBanner();

        // Supprimer les boutons d'edition
        this.removeEditButtons();

        // Reafficher les filtres
        this.toggleFilters(true);

        // Mettre a jour le lien de connexion
        this.updateLoginLink();
    }

    createAdminBanner() {
        // Verifier si le bandeau existe deja
        if (this.adminBanner || document.querySelector('.admin-banner')) {
            return;
        }

        this.adminBanner = document.createElement('div');
        this.adminBanner.className = 'admin-banner';
        this.adminBanner.innerHTML = `
            <div class="admin-banner-content">
                <i class="fa-regular fa-pen-to-square"></i>
                <span>Mode edition</span>
            </div>
        `;

        // Ajouter l'event listener pour ouvrir la modale
        this.adminBanner.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('openGalleryModal'));
        });

        // Inserer le bandeau au debut du body
        document.body.insertBefore(this.adminBanner, document.body.firstChild);

        // Ajuster le padding du contenu principal
        const mainContainer = document.querySelector('.main-container');
        if (mainContainer) {
            mainContainer.style.paddingTop = '60px';
        }
    }

    removeAdminBanner() {
        if (this.adminBanner) {
            this.adminBanner.remove();
            this.adminBanner = null;
        }

        // Supprimer aussi les bandeaux existants
        const existingBanners = document.querySelectorAll('.admin-banner');
        existingBanners.forEach(banner => banner.remove());

        // Remettre le padding normal
        const mainContainer = document.querySelector('.main-container');
        if (mainContainer) {
            mainContainer.style.paddingTop = '';
        }
    }

    addEditButtons() {
        // Bouton modifier pour la section portfolio
        const portfolioTitle = document.querySelector('#portfolio h2');
        if (portfolioTitle && !portfolioTitle.querySelector('.edit-btn')) {
            const editButton = document.createElement('button');
            editButton.className = 'edit-btn';
            editButton.innerHTML = '<i class="fa-regular fa-pen-to-square"></i> modifier';

            editButton.addEventListener('click', () => {
                this.dispatchEvent(new CustomEvent('openGalleryModal'));
            });

            portfolioTitle.appendChild(editButton);
            this.editButtons.push(editButton);
        }

        // Ajouter d'autres boutons d'edition si necessaire
        const introSection = document.querySelector('#introduction');
        if (introSection && !introSection.querySelector('.edit-btn')) {
            const editButton = document.createElement('button');
            editButton.className = 'edit-btn';
            editButton.innerHTML = '<i class="fa-regular fa-pen-to-square"></i> modifier';

            const article = introSection.querySelector('article');
            if (article) {
                article.appendChild(editButton);
                this.editButtons.push(editButton);
            }
        }
    }

    removeEditButtons() {
        // Supprimer tous les boutons d'edition stockes
        this.editButtons.forEach(button => {
            if (button.parentNode) {
                button.parentNode.removeChild(button);
            }
        });
        this.editButtons = [];

        // Supprimer aussi les boutons existants dans le DOM
        const existingButtons = document.querySelectorAll('.edit-btn, .delete-btn');
        existingButtons.forEach(button => button.remove());
    }

    toggleFilters(show) {
        const filters = document.querySelector(SELECTORS.FILTERS);
        if (filters) {
            filters.style.display = show ? 'flex' : 'none';
        }
    }

    updateLoginLink() {
        const loginLink = document.querySelector(SELECTORS.LOGIN_LINK);
        if (!loginLink) return;

        // Nettoyer les anciens event listeners
        const newLoginLink = loginLink.cloneNode(true);
        loginLink.parentNode.replaceChild(newLoginLink, loginLink);

        if (this.authService.isLoggedIn) {
            newLoginLink.textContent = 'logout';
            newLoginLink.href = '#';

            newLoginLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        } else {
            newLoginLink.textContent = 'login';
            newLoginLink.href = './pages/login.html';
        }
    }

    logout() {
        console.log('AdminManager: Logging out');

        if (this.authService) {
            this.authService.logout();
        }

        // Redirection vers la page d'accueil
        const currentPath = window.location.pathname;
        if (currentPath.includes('login.html')) {
            window.location.href = '../index.html';
        } else {
            window.location.reload();
        }
    }

    isAuthenticated() {
        return this.authService ? this.authService.isLoggedIn : false;
    }

    getToken() {
        return localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN);
    }

    destroy() {
        this.disableAdminMode();
        this.authService = null;
        this.editButtons = [];
    }
}

// Export des fonctions pour compatibilite avec l'ancien code
export function checkAdminMode() {
    const token = localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN);
    return !!token;
}

export function isAuthenticated() {
    return checkAdminMode();
}

export function logout() {
    localStorage.removeItem(CONFIG.STORAGE_KEYS.TOKEN);
    localStorage.removeItem(CONFIG.STORAGE_KEYS.USER);
}