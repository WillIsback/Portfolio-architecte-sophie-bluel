import { BaseModal } from './base-modal.js';
import { apiService } from '../../services/api.js';

export class GalleryModal extends BaseModal {
    constructor(works = [], callbacks = {}) {
        super();
        this.works = works;
        this.callbacks = callbacks;
        this.className = 'modal-overlay gallery-modal';
        this.modalTitle = 'Galerie photo';
    }

    connectedCallback() {
        super.connectedCallback();
        this.populateGallery();
    }

    populateGallery() {
        const galleryContainer = document.createElement('div');
        galleryContainer.innerHTML = this.renderGalleryContent();
        this.appendChild(galleryContainer);

        this.attachGalleryEvents();
    }

    renderGalleryContent() {
        const worksGrid = this.works.map(work => `
            <div class="work-item" data-id="${work.id}">
                <div class="work-image-container">
                    <img src="${work.imageUrl}" alt="${work.title}" loading="lazy">
                    <button class="delete-btn" data-id="${work.id}" type="button" title="Supprimer ${work.title}">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
                <p class="work-title">${work.title}</p>
            </div>
        `).join('');

        return `
            <div class="gallery-grid">
                ${this.works.length > 0 ? worksGrid : '<p class="no-works">Aucune oeuvre disponible</p>'}
            </div>
            <hr class="separator">
            <button class="btn-primary" type="button">
                Ajouter une photo
            </button>
        `;
    }

    attachGalleryEvents() {
        const deleteButtons = this.querySelectorAll('.delete-btn');
        deleteButtons.forEach(btn => {
            btn.addEventListener('click', this.handleDelete.bind(this));
        });

        const addButton = this.querySelector('.btn-primary');
        if (addButton) {
            addButton.addEventListener('click', this.handleAddWork.bind(this));
        }
    }

    async handleDelete(event) {
        event.preventDefault();
        event.stopPropagation();

        const workId = parseInt(event.currentTarget.dataset.id);
        const work = this.works.find(w => w.id === workId);

        if (!work) {
            console.error('Work not found:', workId);
            return;
        }

        if (!confirm(`Êtes-vous sûr de vouloir supprimer "${work.title}" ?`)) {
            return;
        }

        const deleteBtn = event.currentTarget;
        deleteBtn.disabled = true;

        try {
            await apiService.deleteWork(workId);

            this.works = this.works.filter(w => w.id !== workId);

            const workElement = event.currentTarget.closest('.work-item');
            if (workElement) {
                workElement.style.opacity = '0';
                workElement.style.transform = 'scale(0.8)';

                setTimeout(() => {
                    workElement.remove();

                    if (this.works.length === 0) {
                        const galleryGrid = this.querySelector('.gallery-grid');
                        if (galleryGrid) {
                            galleryGrid.innerHTML = '<p class="no-works">Aucune œuvre disponible</p>';
                        }
                    }
                }, 200);
            }

            if (this.callbacks.onDelete) {
                this.callbacks.onDelete(workId);
            }

            this.dispatchEvent(new CustomEvent('work:deleted', {
                detail: { workId },
                bubbles: true
            }));

            console.log(`Work ${workId} deleted successfully`);

        } catch (error) {
            console.error('Failed to delete work:', error);
            const errorMessage = error.message || 'Erreur inconnue lors de la suppression';
            alert(`Erreur lors de la suppression: ${errorMessage}`);
            deleteBtn.disabled = false;
        }
    }

    async handleAddWork() {
        try {
            const categories = await apiService.getCategories();
            this.close();

            const { AddWorkModal } = await import('./add-work-modal.js');

            const addModal = new AddWorkModal(categories, {
                onAdd: this.callbacks.onAdd,
                onBack: () => {
                    const newGalleryModal = new GalleryModal(this.works, this.callbacks);
                    document.body.appendChild(newGalleryModal);
                    newGalleryModal.open();
                }
            });

            document.body.appendChild(addModal);
            addModal.open();

        } catch (error) {
            console.error('Failed to open add work modal:', error);
            alert('Erreur lors de l\'ouverture du formulaire d\'ajout');
        }
    }

    refreshGallery() {
        const galleryContainer = this.querySelector('.gallery-grid').parentElement;
        if (galleryContainer) {
            galleryContainer.innerHTML = this.renderGalleryContent();
            this.attachGalleryEvents();
        }
    }

    addWork(newWork) {
        this.works.push(newWork);
        this.refreshGallery();
    }
}

customElements.define('gallery-modal', GalleryModal);