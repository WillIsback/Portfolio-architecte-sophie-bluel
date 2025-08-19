import { ModalManager } from '../components/modal/modal-manager.js';
import { useModal } from '../hooks/use-modal.js';

export class ModalService {
    constructor() {
        this.modalManager = ModalManager.getInstance();
        this.modalHook = useModal();
        this.setupGlobalEvents();
    }

    setupGlobalEvents() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modalHook.isOpen) {
                this.modalManager.closeCurrentModal();
            }
        });

        document.addEventListener('work:deleted', (e) => {
            console.log('Work deleted globally:', e.detail.workId);
        });

        document.addEventListener('work:added', (e) => {
            console.log('Work added globally:', e.detail.work);
        });
    }

    async openGalleryModal(works, callbacks = {}) {
        return this.modalManager.openGalleryModal(works, callbacks);
    }

    async openAddWorkModal(categories, callbacks = {}) {
        return this.modalManager.openAddWorkModal(categories, callbacks);
    }

    closeModal() {
        this.modalManager.closeCurrentModal();
    }

    onModalStateChange(callback) {
        return this.modalHook.subscribe(callback);
    }
}