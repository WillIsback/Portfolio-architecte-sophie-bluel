// filepath: /home/wderue/formation_OC/projet_3/Portfolio-architecte-sophie-bluel/FrontEnd/src/utils/navigation.js
export class Navigation {
    constructor() {
        this.init();
    }

    init() {
        // Gestion du scroll automatique au chargement de la page
        this.handleInitialHash();

        // Gestion des clics sur les liens de navigation
        this.setupNavigationLinks();
    }

    handleInitialHash() {
        // Attendre que la page soit completement chargee
        window.addEventListener('load', () => {
            const hash = window.location.hash;
            if (hash) {
                setTimeout(() => {
                    this.scrollToSection(hash);
                }, 100);
            }
        });
    }

    setupNavigationLinks() {
        // Selectionner tous les liens de navigation interne
        const navLinks = document.querySelectorAll('a[href^="#"]');

        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href');
                this.scrollToSection(targetId);

                // Mettre a jour l'URL sans recharger la page
                history.pushState(null, null, targetId);
            });
        });
    }

    scrollToSection(targetId) {
        const targetElement = document.querySelector(targetId);

        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }
}