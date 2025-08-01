import { fetchWorks, deleteWork } from '../api.js';
import { modalManager } from './modal-manager.js';

let works = [];

//  Initialisation des données pour la galerie
async function initializeGalleryData() {
    try {
        works = await fetchWorks();
        console.log('Données galerie initialisées:', works);
        return works;
    } catch (error) {
        console.error('Erreur lors de l\'initialisation des données galerie:', error);
        return [];
    }
}

//  Ouverture de la modal galerie
const openGalleryModal = async function(e) {
    if (e && e.preventDefault) {
        e.preventDefault();
    }
    
    await modalManager.openModal('modal-gallery', async (modal) => {
        // S'assurer que les données sont chargées
        if (works.length === 0) {
            await initializeGalleryData();
        }
        
        // Charger le contenu de la galerie
        loadGalleryContent(modal);
        
        // Configurer les événements spécifiques à la galerie
        setupGalleryEvents(modal);
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
        addBtn.addEventListener('click', async () => {
            // Import dynamique pour éviter les dépendances circulaires
            const { openAddWorkModal } = await import('./add-work-modal.js');
            openAddWorkModal();
        });
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
    
    console.log(`Tentative de suppression - ID: ${workId}, Work trouvé:`, work);
    
    if (!work) {
        console.error("Œuvre non trouvée dans le cache local");
        return;
    }
    
    if (confirm(`Êtes-vous sûr de vouloir supprimer "${work.title}" ?`)) {
        try {
            console.log(`Suppression de l'œuvre ID ${workId}`);
            const result = await deleteWork(workId);
            console.log("Résultat de la suppression:", result);
            
            // Mettre à jour le cache local
            works = works.filter(w => w.id !== workId);
            
            // Recharger la galerie dans la modal actuelle
            if (modalManager.currentModal) {
                loadGalleryContent(modalManager.currentModal);
            }
            
            // Émettre un événement pour mettre à jour la galerie principale
            document.dispatchEvent(new CustomEvent('workDeleted', { detail: { workId } }));
            
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            alert(`Erreur lors de la suppression de l'œuvre: ${error.message}`);
        }
    }
}

// Fonction pour mettre à jour la liste des œuvres (appelée depuis add-work-modal)
function updateWorksCache(newWork) {
    works.push(newWork);
    
    // Recharger la galerie si elle est ouverte
    if (modalManager.currentModal && modalManager.currentModal.querySelector('#modal-gallery-grid')) {
        loadGalleryContent(modalManager.currentModal);
    }
}

// Initialiser les données au chargement du module
initializeGalleryData();

export { openGalleryModal, updateWorksCache, initializeGalleryData };