export class Filters {
    constructor(container) {
        this.container = container;
        this.categories = [];
        this.activeFilter = 0;
        this.onFilterChange = null;
    }

    setCategories(categories) {
        this.categories = [...categories]; // Copie defensive
        this.render();
    }

    onFilterChanged(callback) {
        this.onFilterChange = callback;
    }

    render() {
        if (!this.container) return;

        this.container.innerHTML = '';

        // Bouton "Tous"
        const allButton = this.createFilterButton('Tous', 0, this.activeFilter === 0);
        this.container.appendChild(allButton);

        // Boutons par categorie
        this.categories.forEach(category => {
            const button = this.createFilterButton(
                category.name,
                category.id,
                this.activeFilter === category.id
            );
            this.container.appendChild(button);
        });
    }

    createFilterButton(text, categoryId, isActive = false) {
        const button = document.createElement('button');
        button.textContent = text;
        button.classList.add('filter-btn');
        button.dataset.categoryId = categoryId;

        if (isActive) {
            button.classList.add('active');
        }

        button.addEventListener('click', () => {
            this.setActiveFilter(categoryId);
        });

        return button;
    }

    setActiveFilter(categoryId) {
        this.activeFilter = categoryId;

        // Mettre a jour l'apparence des boutons
        this.container.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active',
                parseInt(btn.dataset.categoryId) === categoryId
            );
        });

        // Notifier le changement
        if (this.onFilterChange) {
            this.onFilterChange(categoryId);
        }
    }

    destroy() {
        if (this.container) {
            this.container.innerHTML = '';
        }
        this.categories = [];
        this.onFilterChange = null;
    }
}