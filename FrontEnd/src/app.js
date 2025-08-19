import { apiService } from './services/api.js';
import { AuthService } from './services/auth-service.js';
import { AdminManager } from './components/auth/admin.js';
import { Gallery } from './components/gallery/gallery.js';
import { Filters } from './components/filters/filter.js';
import { ModalManager } from './components/modal/modal-manager.js';
import { Navigation } from './utils/navigation.js';
import { SELECTORS, EVENTS } from './utils/constants.js';
import { ModalService } from './services/modal-service.js';

class App {
    constructor() {
        this.authService = null;
        this.adminManager = null;
        this.modalManager = null;
        this.gallery = null;
        this.filters = null;
        this.navigation = null;
        this.loginComponent = null;
        this.ModalService = null;
        this.works = [];
        this.categories = [];
        this.isDestroyed = false;
        this.currentPage = this.detectCurrentPage();

        console.log('App: Initialized with page:', this.currentPage);
    }

    detectCurrentPage() {
        const path = window.location.pathname;
        if (path.includes('login.html')) {
            return 'login';
        }
        return 'home';
    }

    async init() {
        console.log('App: Starting initialization');

        try {
            // Initialisation de la navigation
            this.navigation = new Navigation();

            // Initialisation des services
            this.authService = new AuthService();

            // Initialisation du gestionnaire admin
            this.adminManager = new AdminManager(this.authService);

            // Initialiser le service modal
            this.modalService = new ModalService();

            // Ecouter les changements d'etat des modals
            this.modalService.onModalStateChange((state) => {
                console.log('Modal state changed:', state);
            });

            // Ecouter les events du gestionnaire admin
            this.adminManager.addEventListener('openGalleryModal', () => {
                this.openGalleryModal();
            });

            if (this.currentPage === 'login') {
                await this.initLoginPage();
            } else {
                await this.initHomePage();
            }

            console.log('App: Initialization completed');

        } catch (error) {
            console.error('App: Failed to initialize:', error);
        }
    }

    openGalleryModal() {
        if (!this.modalService) {
            console.error('App: ModalService not initialized');
            return;
        }

        this.modalService.openGalleryModal(this.works, {
            onDelete: this.handleDeleteWork.bind(this),
            onAdd: this.handleAddWork.bind(this)
        });
    }

    async initLoginPage() {
        console.log('App: Initializing login page');

        try {
            const { LoginForm } = await import('./components/auth/login.js');
            const loginForm = document.querySelector('#login-form');

            console.log('App: Login form element found:', !!loginForm);

            if (loginForm) {
                this.loginComponent = new LoginForm(loginForm, this.authService);
                console.log('App: LoginForm component created');
            } else {
                console.error('App: Login form element not found');
            }
        } catch (error) {
            console.error('App: Error initializing login page:', error);
        }
    }

    async initHomePage() {
        console.log('App: Initializing home page');

        this.modalManager = new ModalManager();

        // Chargement des donnees
        await this.loadData();

        // Initialisation des composants
        this.initComponents();

        // Configuration des event listeners
        this.setupEventListeners();
    }

    async loadData() {
        try {
            const [works, categories] = await Promise.all([
                apiService.getWorks(),
                apiService.getCategories()
            ]);

            this.works = works;
            this.categories = categories;

            console.log('App: Data loaded', {
                works: this.works.length,
                categories: this.categories.length
            });
        } catch (error) {
            console.error('App: Failed to load data:', error);
            this.works = [];
            this.categories = [];
        }
    }

    initComponents() {
        const galleryContainer = document.querySelector(SELECTORS.GALLERY);
        const filtersContainer = document.querySelector(SELECTORS.FILTERS);

        if (galleryContainer) {
            this.gallery = new Gallery(galleryContainer);
            this.gallery.setWorks(this.works);
        }

        // Les filtres sont maintenant geres par AdminManager
        if (filtersContainer && !this.authService.isLoggedIn) {
            this.filters = new Filters(filtersContainer);
            this.filters.setCategories(this.categories);
            this.filters.onFilterChanged((categoryId) => {
                if (this.gallery) {
                    this.gallery.filterByCategory(categoryId);
                }
            });
        }
    }

    setupEventListeners() {
        // Les boutons d'edition sont maintenant geres par AdminManager

        // Nettoyage lors de la fermeture de la page
        window.addEventListener('beforeunload', () => {
            this.destroy();
        });
    }

    openGalleryModal() {
        if (this.modalManager) {
            this.modalManager.openGalleryModal(this.works, {
                onDelete: this.handleDeleteWork.bind(this),
                onAdd: this.handleAddWork.bind(this)
            });
        }
    }

    async handleDeleteWork(workId) {
        try {
            await apiService.deleteWork(workId);
            this.works = this.works.filter(work => work.id !== workId);

            if (this.gallery) {
                this.gallery.removeWork(workId);
            }
        } catch (error) {
            console.error('Failed to delete work:', error);
            alert('Erreur lors de la suppression');
        }
    }

    async handleAddWork(workData) {
        try {
            const newWork = await apiService.addWork(workData);
            this.works = [...this.works, newWork];

            if (this.gallery) {
                this.gallery.addWork(newWork);
            }

            return newWork;
        } catch (error) {
            console.error('Failed to add work:', error);
            throw error;
        }
    }

    destroyComponents() {
        if (this.gallery) {
            this.gallery.destroy();
            this.gallery = null;
        }

        if (this.filters) {
            this.filters.destroy();
            this.filters = null;
        }
    }

    destroy() {
        if (this.isDestroyed) return;

        this.destroyComponents();

        if (this.modalManager) {
            this.modalManager.destroy();
            this.modalManager = null;
        }

        if (this.loginComponent) {
            this.loginComponent.destroy();
            this.loginComponent = null;
        }

        if (this.adminManager) {
            this.adminManager.destroy();
            this.adminManager = null;
        }

        this.authService = null;
        this.navigation = null;
        this.works = [];
        this.categories = [];
        this.isDestroyed = true;
    }
}

// Initialisation de l'application
let appInstance = null;

document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM loaded, initializing app');

    if (!appInstance) {
        appInstance = new App();
        await appInstance.init();
    }
});

// Nettoyage global
window.addEventListener('beforeunload', () => {
    if (appInstance) {
        appInstance.destroy();
        appInstance = null;
    }
});