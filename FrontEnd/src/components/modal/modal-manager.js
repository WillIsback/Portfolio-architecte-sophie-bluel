import { GalleryModal } from './gallery-modal.js';
import { AddWorkModal } from './add-work-modal.js';

export class ModalManager {
    constructor() {
        this.activeModal = null;
        this.modalStack = [];
    }

    static instance = null;

    static getInstance() {
        if (!ModalManager.instance) {
            ModalManager.instance = new ModalManager();
        }
        return ModalManager.instance;
    }

    createModal(type, ...args) {
        const modalFactories = {
            gallery: (works, callbacks) => new GalleryModal(works, callbacks),
            addWork: (categories, callbacks) => new AddWorkModal(categories, callbacks)
        };

        const factory = modalFactories[type];
        if (!factory) {
            throw new Error(`Unknown modal type: ${type}`);
        }

        return factory(...args);
    }

    async openModal(type, ...args) {
        try {
            if (this.activeModal) {
                this.modalStack.push(this.activeModal);
                this.activeModal.close();
            }

            const modal = this.createModal(type, ...args);
            this.activeModal = modal;

            modal.addEventListener('modal:closed', () => {
                this.activeModal = null;
                if (this.modalStack.length > 0) {
                    const previousModal = this.modalStack.pop();
                    this.activeModal = previousModal;
                }
            });

            document.body.appendChild(modal);

            await new Promise(resolve => {
                requestAnimationFrame(() => {
                    modal.open();
                    resolve();
                });
            });

        } catch (error) {
            console.error('Failed to open modal:', error);
        }
    }

    openGalleryModal(works, callbacks = {}) {
        return this.openModal('gallery', works, callbacks);
    }

    openAddWorkModal(categories, callbacks = {}) {
        return this.openModal('addWork', categories, callbacks);
    }

    closeCurrentModal() {
        if (this.activeModal) {
            this.activeModal.close();
        }
    }

    closeAllModals() {
        this.modalStack.forEach(modal => modal.close());
        this.modalStack = [];
        this.closeCurrentModal();
    }
}