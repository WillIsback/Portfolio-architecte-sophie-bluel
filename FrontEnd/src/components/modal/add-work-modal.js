import { BaseModal } from './base-modal.js';
import { apiService } from '../../services/api.js';

export class AddWorkModal extends BaseModal {
    constructor(categories = [], callbacks = {}) {
        super();
        this.categories = categories;
        this.callbacks = callbacks;
        this.selectedFile = null;
        this.isSubmitting = false;
        this.className = 'modal-overlay add-work-modal';
        this.modalTitle = 'Ajout photo';
    }

    connectedCallback() {
        super.connectedCallback();
        this.setBackCallback(() => {
            if (this.callbacks.onBack) {
                this.callbacks.onBack();
            } else {
                this.close();
            }
        });
        this.populateForm();
    }

    populateForm() {
        const formContainer = document.createElement('div');
        formContainer.innerHTML = this.renderFormContent();
        this.appendChild(formContainer);

        this.setupFormEvents();
    }

    renderFormContent() {
        const categoryOptions = this.categories.map(category =>
            `<option value="${category.id}">${category.name}</option>`
        ).join('');

        return `
            <form id="add-photo-form" enctype="multipart/form-data">
                <div class="upload-section">
                    <div id="upload-area" class="upload-area">
                        <i class="fa-regular fa-image upload-icon"></i>
                        <button type="button" class="btn-choose-file">+ Ajouter photo</button>
                        <p class="upload-info">jpg, png : 4mo max</p>
                    </div>
                    <div id="image-preview" class="image-preview hidden">
                        <img id="preview-img" src="" alt="Aperçu de l'image">
                    </div>
                    <input type="file" id="photo-input" name="image" accept="image/jpeg,image/jpg,image/png" style="display: none;">
                </div>

                <div class="form-group">
                    <label for="title-input">Titre</label>
                    <input type="text" id="title-input" name="title" required>
                </div>

                <div class="form-group">
                    <label for="category-select">Catégorie</label>
                    <select id="category-select" name="category" required>
                        <option value="">Sélectionner une catégorie</option>
                        ${categoryOptions}
                    </select>
                </div>

                <hr class="separator">

                <button type="submit" class="btn-validate" disabled>
                    Valider
                </button>
            </form>
        `;
    }

    setupFormEvents() {
        const fileInput = this.querySelector('#photo-input');
        const uploadArea = this.querySelector('#upload-area');
        const chooseFileBtn = this.querySelector('.btn-choose-file');
        const form = this.querySelector('#add-photo-form');
        const titleInput = this.querySelector('#title-input');
        const categorySelect = this.querySelector('#category-select');

        this.bindFileUpload(fileInput, uploadArea, chooseFileBtn);
        this.bindFormValidation([titleInput, categorySelect, fileInput]);
        this.bindFormSubmission(form);
    }

    bindFileUpload(fileInput, uploadArea, chooseFileBtn) {
        if (chooseFileBtn && fileInput) {
            chooseFileBtn.addEventListener('click', (e) => {
                e.preventDefault();
                fileInput.click();
            });
        }

        if (uploadArea && fileInput) {
            uploadArea.addEventListener('click', (e) => {
                if (!e.target.closest('.btn-choose-file')) {
                    e.preventDefault();
                    fileInput.click();
                }
            });

            this.setupDragAndDrop(uploadArea, fileInput);
        }

        if (fileInput) {
            fileInput.addEventListener('change', this.handleFileSelect.bind(this));
        }
    }

    setupDragAndDrop(uploadArea, fileInput) {
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');

            const files = e.dataTransfer.files;
            if (files.length > 0) {
                fileInput.files = files;
                this.handleFileSelect({ target: fileInput });
            }
        });
    }

    bindFormValidation(inputs) {
        inputs.forEach(input => {
            if (input) {
                input.addEventListener('input', () => this.validateForm());
                input.addEventListener('change', () => this.validateForm());
            }
        });
    }

    bindFormSubmission(form) {
        if (form) {
            form.addEventListener('submit', this.handleFormSubmit.bind(this));
        }
    }

    handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) {
            this.selectedFile = null;
            this.hidePreview();
            this.validateForm();
            return;
        }

        if (!this.validateFile(file)) {
            event.target.value = '';
            this.selectedFile = null;
            this.hidePreview();
            this.validateForm();
            return;
        }

        this.selectedFile = file;
        this.showPreview(file);
        this.validateForm();
    }

    validateFile(file) {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        const maxSize = 4 * 1024 * 1024;

        if (!validTypes.includes(file.type)) {
            alert('Format non supporté. Veuillez choisir une image JPG ou PNG.');
            return false;
        }

        if (file.size > maxSize) {
            alert('Fichier trop volumineux. Taille maximum : 4Mo.');
            return false;
        }

        return true;
    }

    showPreview(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const imagePreview = this.querySelector('#image-preview');
            const previewImg = this.querySelector('#preview-img');
            const uploadArea = this.querySelector('#upload-area');

            if (previewImg && imagePreview) {
                previewImg.src = e.target.result;
                imagePreview.classList.remove('hidden');
            }

            if (uploadArea) {
                uploadArea.classList.add('hidden');
            }
        };
        reader.readAsDataURL(file);
    }

    hidePreview() {
        const imagePreview = this.querySelector('#image-preview');
        const previewImg = this.querySelector('#preview-img');
        const uploadArea = this.querySelector('#upload-area');

        if (imagePreview) {
            imagePreview.classList.add('hidden');
        }

        if (previewImg) {
            previewImg.src = '';
        }

        if (uploadArea) {
            uploadArea.classList.remove('hidden');
        }
    }

    validateForm() {
        const titleInput = this.querySelector('#title-input');
        const categorySelect = this.querySelector('#category-select');
        const submitBtn = this.querySelector('.btn-validate');

        if (!titleInput || !categorySelect || !submitBtn) {
            return false;
        }

        const hasFile = this.selectedFile !== null;
        const hasTitle = titleInput.value.trim().length > 0;
        const hasCategory = categorySelect.value !== '';

        const isValid = hasFile && hasTitle && hasCategory;
        submitBtn.disabled = !isValid;

        if (isValid) {
            submitBtn.classList.remove('disabled');
        } else {
            submitBtn.classList.add('disabled');
        }

        return isValid;
    }

    async handleFormSubmit(event) {
        event.preventDefault();

        if (this.isSubmitting || !this.validateForm()) {
            return;
        }

        const submitBtn = this.querySelector('.btn-validate');
        const originalText = submitBtn.textContent;

        this.setLoadingState(true, submitBtn, 'Ajout en cours...');

        try {
            const formData = this.buildFormData();
            const newWork = await apiService.addWork(formData);

            if (this.callbacks.onAdd) {
                await this.callbacks.onAdd(newWork);
            }

            this.dispatchEvent(new CustomEvent('work:added', {
                detail: { work: newWork },
                bubbles: true
            }));

            setTimeout(() => {
                if (this.callbacks.onBack) {
                    this.callbacks.onBack();
                } else {
                    this.close();
                }
            }, 300);

            console.log('Work added successfully:', newWork);

        } catch (error) {
            console.error('Failed to add work:', error);
            const errorMessage = error.message || 'Erreur inconnue lors de l\'ajout';
            alert(`Erreur lors de l'ajout: ${errorMessage}`);
        } finally {
            this.setLoadingState(false, submitBtn, originalText);
        }
    }

    buildFormData() {
        const titleInput = this.querySelector('#title-input');
        const categorySelect = this.querySelector('#category-select');

        if (!this.selectedFile || !titleInput || !categorySelect) {
            throw new Error('Données du formulaire incomplètes');
        }

        const formData = new FormData();
        formData.append('image', this.selectedFile);
        formData.append('title', titleInput.value.trim());
        formData.append('category', parseInt(categorySelect.value));

        return formData;
    }

    setLoadingState(isLoading, button, text) {
        this.isSubmitting = isLoading;

        if (button) {
            button.disabled = isLoading;
            button.textContent = text;

            if (isLoading) {
                button.classList.add('loading');
            } else {
                button.classList.remove('loading');
            }
        }
    }

    resetForm() {
        const form = this.querySelector('#add-photo-form');
        const imagePreview = this.querySelector('#image-preview');
        const uploadArea = this.querySelector('#upload-area');
        const previewImg = this.querySelector('#preview-img');

        if (form) {
            form.reset();
        }

        if (imagePreview) {
            imagePreview.classList.add('hidden');
        }

        if (uploadArea) {
            uploadArea.classList.remove('hidden');
        }

        if (previewImg) {
            previewImg.src = '';
        }

        this.selectedFile = null;
        this.validateForm();
    }

    disconnectedCallback() {
        this.resetForm();
        super.disconnectedCallback && super.disconnectedCallback();
    }
}

customElements.define('add-work-modal', AddWorkModal);