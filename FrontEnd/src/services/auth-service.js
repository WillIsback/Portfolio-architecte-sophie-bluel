import { CONFIG } from '../../config/config.js';
import { SELECTORS, EVENTS } from '../utils/constants.js';

export class AuthService extends EventTarget {
    constructor() {
        super();
        this.isLoggedIn = false;
        this.checkAuthStatus();
    }

    checkAuthStatus() {
        const token = localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN);
        const wasLoggedIn = this.isLoggedIn;
        this.isLoggedIn = !!token;

        if (wasLoggedIn !== this.isLoggedIn) {
            this.dispatchEvent(new CustomEvent(EVENTS.AUTH_CHANGED, {
                detail: { isLoggedIn: this.isLoggedIn }
            }));
        }

        this.updateUI();
    }

    login(token) {
        localStorage.setItem(CONFIG.STORAGE_KEYS.TOKEN, token);
        this.isLoggedIn = true;
        this.updateUI();
        this.dispatchEvent(new CustomEvent(EVENTS.AUTH_CHANGED, {
            detail: { isLoggedIn: true }
        }));
        window.location.href = '../index.html';
    }

    logout() {
        localStorage.removeItem(CONFIG.STORAGE_KEYS.TOKEN);
        this.isLoggedIn = false;
        this.updateUI();
        this.dispatchEvent(new CustomEvent(EVENTS.AUTH_CHANGED, {
            detail: { isLoggedIn: false }
        }));
        window.location.href = '../index.html';
    }

    updateUI() {
        const adminElements = document.querySelectorAll(SELECTORS.ADMIN_ELEMENTS);
        const filters = document.querySelector(SELECTORS.FILTERS);
        const loginLink = document.querySelector(SELECTORS.LOGIN_LINK);

        adminElements.forEach(element => {
            if (element) {
                element.style.display = this.isLoggedIn ? 'block' : 'none';
            }
        });

        if (filters) {
            filters.style.display = this.isLoggedIn ? 'none' : 'flex';
        }

        if (loginLink) {
            loginLink.textContent = this.isLoggedIn ? 'logout' : 'login';
            loginLink.href = this.isLoggedIn ? '#' : 'pages/login.html';

            // Nettoyer les anciens event listeners
            const newLoginLink = loginLink.cloneNode(true);
            loginLink.parentNode.replaceChild(newLoginLink, loginLink);

            if (this.isLoggedIn) {
                newLoginLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.logout();
                });
            }
        }
    }
}