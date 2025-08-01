import { fetchCategories, postWork } from '../api.js';
import { modalManager } from './modal-manager.js';

let categories = [];

//  Initialisation des données pour le formulaire
async function initializeAddWorkData() {
    try {
        categories = await fetchCategories();
        console.log('Données formulaire initialisées:', categories);
        return categories;
    } catch (error) {
        console.error('Erreur lors de l\'initialisation des données formulaire:', error);
        return [];
    }
}

//  Ouverture de la modal ajout de travail
const openAddWorkModal = async function() {
    await modalManager.openModal('modal-add-work', async (modal) => {
        // S'assurer que les données sont chargées
        if (categories.length === 0) {
            await initializeAddWorkData();
        }
        
        // Charger le contenu du formulaire
        loadAddPhotoContent(modal);
        
        // Configurer les événements spécifiques au formulaire
        setupAddPhotoEvents(modal);
    });
}

//  Configuration des événements du formulaire
function setupAddPhotoEvents(modal) {
    const backBtn = modal.querySelector('#back-to-gallery');
    if (backBtn) {
        backBtn.addEventListener('click', async () => {
            // Import dynamique pour éviter les dépendances circulaires
            const { openGalleryModal } = await import('./gallery-modal.js');
            openGalleryModal({ preventDefault: () => {} });
        });
    }
    
    // Gestion de l'upload de fichier
    const fileInput = modal.querySelector('#photo-input');
    const uploadArea = modal.querySelector('#upload-area');
    const addPhotoBtn = modal.querySelector('.btn-choose-file');

    console.log('Éléments trouvés:', {
        fileInput: fileInput ? 'Oui' : 'Non',
        uploadArea: uploadArea ? 'Oui' : 'Non', 
        addPhotoBtn: addPhotoBtn ? 'Oui' : 'Non'
    });

    if (fileInput) {
        // Gestion du changement de fichier
        fileInput.addEventListener('change', handleFileSelect);
    }

    if (fileInput && addPhotoBtn) {
        // Clic sur le bouton déclenche l'input file
        addPhotoBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Clic sur le bouton d\'ajout de photo');
            fileInput.click(); // Clic sur l'input file caché
        });
    }
    
    // Optionnel : Clic sur toute la zone d'upload
    if (uploadArea && fileInput) {
        uploadArea.addEventListener('click', (e) => {
            // Si le clic vient du bouton, ne rien faire
            if (e.target.closest('.btn-choose-file')) {
                return;
            }
            e.preventDefault();
            console.log('Clic sur la zone d\'upload');
            fileInput.click();
        });
    }
    
    // Gestion de la soumission du formulaire
    const form = modal.querySelector('#add-photo-form');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
    
    // Validation en temps réel
    const titleInput = modal.querySelector('#title-input');
    const categorySelect = modal.querySelector('#category-select');
    
    [titleInput, categorySelect, fileInput].forEach(input => {
        if (input) {
            input.addEventListener('input', () => validateForm(modal));
            input.addEventListener('change', () => validateForm(modal));
        }
    });
}

//  Chargement du contenu du formulaire
function loadAddPhotoContent(modal) {
    // Charger les catégories
    const categorySelect = modal.querySelector('#category-select');
    if (categorySelect) {
        categorySelect.innerHTML = '<option value="">Sélectionner une catégorie</option>';
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
        
        // Réinitialiser l'affichage
        const imagePreview = modal.querySelector('#image-preview');
        const uploadArea = modal.querySelector('#upload-area');
        const previewImg = modal.querySelector('#preview-img');
        
        if (imagePreview) {
            imagePreview.style.display = 'none';
        }
        
        if (uploadArea) {
            uploadArea.style.display = 'block';
        }
        
        if (previewImg) {
            previewImg.src = '';
        }
        
        // Désactiver le bouton de soumission
        const submitBtn = modal.querySelector('.btn-validate');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.classList.add('disabled');
        }
    }
    
    // Validation initiale
    validateForm(modal);
}

//  Gestion de la sélection de fichier
function handleFileSelect(e) {
    console.log('Fichier sélectionné:', e.target.files[0]);
    
    const file = e.target.files[0];
    const modal = e.target.closest('.modal');
    
    // Utiliser les bons IDs selon votre template
    const imagePreview = modal.querySelector('#image-preview');
    const previewImg = modal.querySelector('#preview-img');
    const uploadArea = modal.querySelector('#upload-area');
    
    if (!file) return;
    
    // Validation du fichier
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 4 * 1024 * 1024; // 4MB
    
    if (!validTypes.includes(file.type)) {
        alert('Format non supporté. Veuillez choisir une image JPG ou PNG.');
        e.target.value = '';
        return;
    }
    
    if (file.size > maxSize) {
        alert('Fichier trop volumineux. Taille maximum : 4Mo.');
        e.target.value = '';
        return;
    }
    
    // Affichage de la prévisualisation
    const reader = new FileReader();
    reader.onload = function(event) {
        if (previewImg && imagePreview) {
            previewImg.src = event.target.result;
            imagePreview.style.display = 'block';
            
            // Masquer la zone d'upload par défaut
            if (uploadArea) {
                uploadArea.style.display = 'none';
            }
        }
        
        console.log('Image prévisualisée:', file.name);
        validateForm(modal);
    };
    
    reader.readAsDataURL(file);
}

//  Validation du formulaire
function validateForm(modal) {
    const fileInput = modal.querySelector('#photo-input');
    const titleInput = modal.querySelector('#title-input');
    const categorySelect = modal.querySelector('#category-select');
    const submitBtn = modal.querySelector('.btn-validate');
    
    if (!fileInput || !titleInput || !categorySelect || !submitBtn) {
        console.log('Éléments manquants pour la validation:', {
            fileInput: fileInput ? 'Oui' : 'Non',
            titleInput: titleInput ? 'Oui' : 'Non',
            categorySelect: categorySelect ? 'Oui' : 'Non',
            submitBtn: submitBtn ? 'Oui' : 'Non'
        });
        return false;
    }
    
    const hasFile = fileInput.files && fileInput.files.length > 0;
    const hasTitle = titleInput.value.trim().length > 0;
    const hasCategory = categorySelect.value !== '';
    
    const isValid = hasFile && hasTitle && hasCategory;
    
    console.log('État de validation:', { hasFile, hasTitle, hasCategory, isValid });
    
    submitBtn.disabled = !isValid;
    submitBtn.classList.toggle('disabled', !isValid);
    
    // Feedback visuel pour chaque champ
    updateFieldValidation(fileInput, hasFile);
    updateFieldValidation(titleInput, hasTitle);
    updateFieldValidation(categorySelect, hasCategory);
    
    return isValid;
}

function updateFieldValidation(field, isValid) {
    field.classList.toggle('valid', isValid);
    field.classList.toggle('invalid', !isValid && field.value !== '');
}

//  Gestion de la soumission du formulaire
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const modal = e.target.closest('.modal');
    const submitBtn = modal.querySelector('.btn-validate');
    const originalText = submitBtn.textContent;
    
    // Validation finale
    if (!validateForm(modal)) {
        alert('Veuillez remplir tous les champs requis.');
        return;
    }
    
    try {
        // Indication de chargement
        submitBtn.disabled = true;
        submitBtn.textContent = 'Ajout en cours...';
        
        // Préparer FormData avec les bons noms de champs selon l'API
        const formData = new FormData();
        const fileInput = modal.querySelector('#photo-input');
        const titleInput = modal.querySelector('#title-input');
        const categorySelect = modal.querySelector('#category-select');
        
        formData.append('image', fileInput.files[0]);
        formData.append('title', titleInput.value.trim());
        formData.append('category', parseInt(categorySelect.value));
        
        console.log('Données à envoyer:');
        console.log('- Image:', fileInput.files[0]);
        console.log('- Titre:', titleInput.value.trim());
        console.log('- Catégorie:', parseInt(categorySelect.value));
        
        // Envoyer à l'API
        const newWork = await postWork(formData);
        
        console.log('Nouvelle œuvre créée:', newWork);
        
        // Mettre à jour le cache des œuvres dans gallery-modal
        const { updateWorksCache } = await import('./gallery-modal.js');
        updateWorksCache(newWork);
        
        // Émettre un événement pour mettre à jour la galerie principale
        document.dispatchEvent(new CustomEvent('workAdded', { 
            detail: { work: newWork } 
        }));
        
        // Retourner à la galerie
        const { openGalleryModal } = await import('./gallery-modal.js');
        await openGalleryModal({ preventDefault: () => {} });
        
        // Message de succès
        showSuccessMessage('Œuvre ajoutée avec succès !');
        
    } catch (error) {
        console.error('Erreur lors de l\'ajout de l\'œuvre:', error);
        alert(`Erreur lors de l\'ajout: ${error.message}`);
    } finally {
        // Restaurer le bouton
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

//  Affichage d'un message de succès
function showSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 15px;
        border-radius: 5px;
        z-index: 10000;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    `;
    
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.remove();
    }, 3000);
}

// Initialiser les données au chargement du module
initializeAddWorkData();

// AJOUT DE L'EXPORT MANQUANT
export { openAddWorkModal, initializeAddWorkData };