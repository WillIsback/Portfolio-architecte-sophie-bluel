export class BaseModal extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.isOpen = false;
        this.modalTitle = '';
        this.onBackClick = null;
        this.loadExternalCSS();
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    loadExternalCSS() {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = './assets/styles/components/modal.css';
        this.shadowRoot.appendChild(link);
    }

    render() {
        const container = document.createElement('div');
        container.className = 'modal-container';
        container.innerHTML = `
            <div class="modal-header">
                <button class="btn-back" type="button" title="Retour">
                    <i class="fa-solid fa-arrow-left"></i>
                </button>
                <h3 class="modal-title">${this.modalTitle}</h3>
                <button class="close-btn" type="button">&times;</button>
            </div>
            <div class="modal-body">
                <slot></slot>
            </div>
        `;

        this.shadowRoot.appendChild(container);
    }

    setupEventListeners() {
        const closeBtn = this.shadowRoot.querySelector('.close-btn');
        const backBtn = this.shadowRoot.querySelector('.btn-back');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        if (backBtn) {
            backBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.onBackClick) {
                    this.onBackClick();
                } else {
                    this.close();
                }
            });
        }

        this.addEventListener('click', (e) => {
            if (e.target === this) {
                this.close();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }

    setTitle(title) {
        this.modalTitle = title;
        const titleElement = this.shadowRoot.querySelector('.modal-title');
        if (titleElement) {
            titleElement.textContent = title;
        }
    }

    setBackCallback(callback) {
        this.onBackClick = callback;
    }

    open() {
        this.isOpen = true;
        this.setAttribute('open', '');
        document.body.style.overflow = 'hidden';
        this.dispatchEvent(new CustomEvent('modal:opened'));
    }

    close() {
        this.isOpen = false;
        this.removeAttribute('open');
        document.body.style.overflow = '';
        this.dispatchEvent(new CustomEvent('modal:closed'));

        setTimeout(() => {
            if (this.parentNode) {
                this.parentNode.removeChild(this);
            }
        }, 300);
    }
}

customElements.define('base-modal', BaseModal);