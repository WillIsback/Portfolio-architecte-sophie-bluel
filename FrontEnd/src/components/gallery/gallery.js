import { EVENTS } from '../../utils/constants.js';

export class Gallery extends EventTarget {
    constructor(container) {
        super();
        this.container = container;
        this.works = [];
        this.currentFilter = 0;
    }

    setWorks(works) {
        this.works = [...works]; // Copie defensive
        this.render();
    }

    filterByCategory(categoryId) {
        this.currentFilter = categoryId;
        this.render();
    }

    render() {
        if (!this.container) return;

        this.container.innerHTML = '';

        const filteredWorks = this.currentFilter === 0
            ? this.works
            : this.works.filter(work => work.categoryId === this.currentFilter);

        const fragment = document.createDocumentFragment();
        filteredWorks.forEach(work => {
            const figure = this.createWorkElement(work);
            fragment.appendChild(figure);
        });

        this.container.appendChild(fragment);
    }

    createWorkElement(work) {
        const figure = document.createElement('figure');
        figure.dataset.workId = work.id;

        const img = document.createElement('img');
        img.src = work.imageUrl;
        img.alt = work.title;
        img.loading = 'lazy';

        const figcaption = document.createElement('figcaption');
        figcaption.textContent = work.title;

        figure.appendChild(img);
        figure.appendChild(figcaption);

        return figure;
    }

    removeWork(workId) {
        this.works = this.works.filter(work => work.id !== workId);
        this.render();
        this.dispatchEvent(new CustomEvent(EVENTS.WORK_DELETED, {
            detail: { workId }
        }));
    }

    addWork(work) {
        this.works = [...this.works, work]; // Immutabilite
        this.render();
        this.dispatchEvent(new CustomEvent(EVENTS.WORK_ADDED, {
            detail: { work }
        }));
    }

    destroy() {
        if (this.container) {
            this.container.innerHTML = '';
        }
        this.works = [];
    }
}