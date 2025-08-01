import { fetchWorks, fetchCategories, deleteWork, postWork } from './api.js';

let works = [];
let categories = [];
let currentModal = null;

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
        
        // Fermeture par bouton close
        const closeBtn = this.currentModal.querySelector('.close');
        closeBtn?.addEventListener('click', () => this.closeModal());
        
        // Fermeture par clic sur le fond
        this.currentModal.addEventListener('click', (e) => {
            if (e.target === this.currentModal) {
                this.closeModal();
            }
        });
        
        // Empêcher la fermeture sur le contenu
        const modalContent = this.currentModal.querySelector('.modal-content');
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
        // Ici vous pouvez avoir votre ancien code de création de modal
        // ou une version simplifiée
    }
}

//  Instance globale du gestionnaire
const modalManager = new ModalManager();

//  Initialisation des données
async function initializeData() {
    try {
        works = await fetchWorks();
        categories = await fetchCategories();
        console.log('Données initialisées:', { works, categories });
    } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
        return false;
    }
    return true;
}

//  Ouverture de la modal galerie
const openGalleryModal = async function(e) {
    e.preventDefault();
    
    await modalManager.openModal('modal-gallery', async (modal) => {
        // S'assurer que les données sont chargées
        if (works.length === 0) {
            await initializeData();
        }
        
        // Charger le contenu de la galerie
        loadGalleryContent(modal);
        
        // Configurer les événements spécifiques à la galerie
        setupGalleryEvents(modal);
    });
}

//  Ouverture de la modal ajout photo
const openAddPhotoModal = async function() {
    await modalManager.openModal('modal-add-photo', async (modal) => {
        // S'assurer que les données sont chargées
        if (categories.length === 0) {
            await initializeData();
        }
        
        // Charger le contenu du formulaire
        loadAddPhotoContent(modal);
        
        // Configurer les événements spécifiques au formulaire
        setupAddPhotoEvents(modal);
    });
}

//  Chargement du contenu de la galerie
function loadGalleryContent(modal) {
    const galleryContainer = modal.querySelector('#modal-gallery-grid');
    if (!galleryContainer) return;
    
    galleryContainer.innerHTML = generateGalleryHTML();
    
    // Ajouter les événements de suppression
    const deleteButtons = galleryContainer.querySelectorAll('.delete-work-btn');
    deleteButtons.forEach(btn => {
        btn.addEventListener('click', handleDeleteWork);
    });
}

//  Configuration des événements de la galerie
function setupGalleryEvents(modal) {
    const addBtn = modal.querySelector('#btn-switch-to-add');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            openAddPhotoModal();
        });
    }
}

//  Configuration des événements du formulaire
function setupAddPhotoEvents(modal) {
    const backBtn = modal.querySelector('#back-to-gallery');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            openGalleryModal({ preventDefault: () => {} });
        });
    }
    
    // ... Autres événements du formulaire
}

//  Chargement du contenu du formulaire
function loadAddPhotoContent(modal) {
    const categorySelect = modal.querySelector('#category-select');
    if (categorySelect) {
        categorySelect.innerHTML = '<option value=""></option>';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categorySelect.appendChild(option);
        });
    }
    
    // Réinitialiser le formulaire
    const form = modal.querySelector('#add-photo-form');
    if (form) {
        form.reset();
        // ... autres réinitialisations
    }
}

//  Génération du HTML de la galerie 
function generateGalleryHTML() {
    if (!works || works.length === 0) {
        return '<p class="no-works">Aucune œuvre disponible</p>';
    }
    
    return works.map(work => `
        <div class="modal-work-item" data-id="${work.id}">
            <div class="work-image-container">
                <img src="${work.imageUrl}" alt="${work.title}">
                <button class="delete-work-btn" data-id="${work.id}" title="Supprimer ${work.title}">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>
        </div>
    `).join('');
}

//  Gestionnaire de suppression 
async function handleDeleteWork(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const workId = parseInt(e.currentTarget.dataset.id);
    const work = works.find(w => w.id === workId);
    
    if (!work) return;
    
    if (confirm(`Êtes-vous sûr de vouloir supprimer "${work.title}" ?`)) {
        try {
            await deleteWork(workId);
            works = works.filter(w => w.id !== workId);
            
            // Recharger la galerie dans la modal actuelle
            if (modalManager.currentModal) {
                loadGalleryContent(modalManager.currentModal);
            }
            
            // Émettre un événement pour mettre à jour la galerie principale
            document.dispatchEvent(new CustomEvent('workDeleted', { detail: { workId } }));
            
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            alert('Erreur lors de la suppression de l\'œuvre');
        }
    }
}

// Initialiser les données au chargement
initializeData();

export { openGalleryModal as openModal, modalManager };