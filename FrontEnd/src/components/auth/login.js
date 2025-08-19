import { apiService } from '../../services/api.js';
import { EVENTS } from '../../utils/constants.js';

export class LoginForm {
    constructor(formElement, authService) {
        this.form = formElement;
        this.authService = authService;
        this.isSubmitting = false;
        this.init();
    }

    init() {
        if (!this.form) {
            console.error('Login form not found');
            return;
        }

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.form.addEventListener('submit', this.handleSubmit.bind(this));
    }

    async handleSubmit(event) {
        event.preventDefault();

        if (this.isSubmitting) return;

        this.isSubmitting = true;
        this.clearErrors();

        try {
            const formData = new FormData(this.form);
            const credentials = {
                email: formData.get('email'),
                password: formData.get('password')
            };

            // Validation basique
            if (!this.validateCredentials(credentials)) {
                return;
            }

            // Tentative de connexion
            const response = await apiService.login(credentials);

            if (response && response.token) {
                // Connexion reussie
                this.authService.login(response.token);
                // La redirection se fera via l'event AUTH_CHANGED
            } else {
                this.showError('Reponse invalide du serveur');
            }

        } catch (error) {
            console.error('Login failed:', error);
            this.showError('Erreur dans l\'identifiant ou le mot de passe');
        } finally {
            this.isSubmitting = false;
        }
    }

    validateCredentials(credentials) {
        if (!credentials.email || !credentials.password) {
            this.showError('Veuillez remplir tous les champs');
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(credentials.email)) {
            this.showError('Format d\'email invalide');
            return false;
        }

        return true;
    }

    showError(message) {
        this.clearErrors();

        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        errorElement.style.color = 'red';
        errorElement.style.marginTop = '10px';

        this.form.appendChild(errorElement);
    }

    clearErrors() {
        const existingErrors = this.form.querySelectorAll('.error-message');
        existingErrors.forEach(error => error.remove());
    }

    destroy() {
        this.clearErrors();
        this.form = null;
        this.authService = null;
    }
}