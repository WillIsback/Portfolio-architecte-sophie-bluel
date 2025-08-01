//  Cache pour les templates
const templateCache = new Map();

//  Chargeur de templates avec cache
async function loadTemplate(templateName) {
    // Vérifier le cache d'abord
    if (templateCache.has(templateName)) {
        return templateCache.get(templateName);
    }
    
    try {
        const response = await fetch(`./assets/templates/${templateName}.html`);
        if (!response.ok) {
            throw new Error(`Template ${templateName} non trouvé: ${response.status}`);
        }
        
        const html = await response.text();
        
        // Mettre en cache
        templateCache.set(templateName, html);
        
        return html;
    } catch (error) {
        console.error(`Erreur lors du chargement du template ${templateName}:`, error);
        throw error;
    }
}

//  Gestionnaire de modals avec templates
class ModalManager {
    constructor() {
        this.currentModal = null;
        this.modalContainer = null;
    }
    
    // Créer un conteneur pour les modals si nécessaire
    ensureModalContainer() {
        if (!this.modalContainer) {
            this.modalContainer = document.createElement('div');
            this.modalContainer.id = 'modal-container';
            document.body.appendChild(this.modalContainer);
        }
    }
    
    // Ouvrir une modal depuis un template
    async openModal(templateName, initCallback = null) {
        try {
            // Fermer toute modal existante
            this.closeModal();
            
            // S'assurer que le conteneur existe
            this.ensureModalContainer();
            
            // Charger le template
            const templateHTML = await loadTemplate(templateName);
            
            // Insérer dans le conteneur
            this.modalContainer.innerHTML = templateHTML;
            this.currentModal = this.modalContainer.querySelector('.modal');
            
            if (!this.currentModal) {
                throw new Error('Élément modal non trouvé dans le template');
            }
            
            // Initialiser le contenu si une fonction est fournie
            if (initCallback) {
                await initCallback(this.currentModal);
            }
            
            // Afficher la modal
            this.showModal();
            
            // Configurer les événements communs
            this.setupCommonEvents();
            
        } catch (error) {
            console.error('Erreur lors de l\'ouverture de la modal:', error);
            // Fallback : créer la modal en JavaScript
            this.createFallbackModal(templateName);
        }
    }
    
    showModal() {
        if (!this.currentModal) return;
        
        this.currentModal.style.display = 'flex';
        this.currentModal.removeAttribute('aria-hidden');
        this.currentModal.setAttribute('aria-modal', 'true');
        document.body.style.overflow = 'hidden';
    }
    
    closeModal() {
        if (!this.currentModal) return;
        
        this.currentModal.style.display = 'none';
        this.currentModal.removeAttribute('aria-modal');
        this.currentModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        
        // Nettoyer les événements
        document.removeEventListener('keydown', this.handleEscapeKey);
        
        // Vider le conteneur
        if (this.modalContainer) {
            this.modalContainer.innerHTML = '';
        }
        
        this.currentModal = null;
    }
    
    setupCommonEvents() {
        if (!this.currentModal) return;
        
        // Debug : vérifier les boutons de fermeture disponibles
        console.log('Recherche des boutons de fermeture...');
        const allCloseElements = this.currentModal.querySelectorAll('[class*="close"], [class*="Close"], .fa-xmark, .fa-times, .fa-close');
        console.log('Éléments de fermeture trouvés:', allCloseElements);
        
        // Fermeture par bouton close - version robuste
        const closeSelectors = ['.close', '.modal-close', '.btn-close', '.close-modal', '.fa-xmark', '.fa-times', '[data-close="modal"]'];
        
        closeSelectors.forEach(selector => {
            const closeBtn = this.currentModal.querySelector(selector);
            if (closeBtn) {
                closeBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.closeModal();
                });
            }
        });
        
        // Fermeture par clic sur le fond
        this.currentModal.addEventListener('click', (e) => {
            if (e.target === this.currentModal) {
                this.closeModal();
            }
        });
        
        // Empêcher la fermeture sur le contenu
        const modalContent = this.currentModal.querySelector('.modal-content, .modal-wrapper, .modal-dialog');
        modalContent?.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        
        // Fermeture par échap
        this.handleEscapeKey = (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        };
        document.addEventListener('keydown', this.handleEscapeKey);
    }
    
    // Fallback en cas d'erreur de chargement
    createFallbackModal(templateName) {
        console.warn(`Utilisation du fallback pour ${templateName}`);
        // Version simplifiée ou ancien code de création de modal
    }
}

//  Instance globale du gestionnaire
const modalManager = new ModalManager();

export { modalManager, loadTemplate };