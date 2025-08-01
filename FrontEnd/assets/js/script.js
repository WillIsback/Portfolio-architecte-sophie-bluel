import { fetchWorks, fetchCategories, postLogin, postWork, deleteWork, getCategoriesNameList, getWorkTitleList } from './api.js';
import { checkAdminMode } from './admin.js';

// Variables globales pour stocker les données
let globalWorks = [];
let globalCategories = [];

function generateWorks(works) {
    const gallery = document.querySelector('.gallery');
    gallery.innerHTML = ''; 
    works.forEach(work => {
        const figure = document.createElement('figure');
        figure.setAttribute('data-id', work.id);
        
        const img = document.createElement('img');
        img.src = work.imageUrl;
        img.alt = work.title;
        
        const figcaption = document.createElement('figcaption');
        figcaption.textContent = work.title;

        figure.appendChild(img);
        figure.appendChild(figcaption);
        gallery.appendChild(figure);
    });
}

function generateCategoriesFilters(categories, works) {
    const filters = document.querySelector('.filters');
    filters.innerHTML = ''; 
    const allFilter = document.createElement('li');
    const spanFilter = document.createElement('span');
    allFilter.classList.add('active');
    allFilter.setAttribute('data-filter', '*');
    spanFilter.textContent = 'Tous';
    allFilter.appendChild(spanFilter);
    filters.appendChild(allFilter);

    categories.forEach(category => {
        const filterItem = document.createElement('li');
        const filterItemspan = document.createElement('span');
        filterItem.setAttribute('data-filter', `.${category.name}`);
        filterItemspan.textContent = category.name;
        filterItem.appendChild(filterItemspan);
        filters.appendChild(filterItem);
    });

    // Add click event to filter items
    filters.addEventListener('click', (event) => {
        if (event.target.tagName === 'LI') {
            const filterValue = event.target.getAttribute('data-filter');
            const activeFilter = filters.querySelector('.active');
            if (activeFilter) {
                activeFilter.classList.remove('active');
            }
            event.target.classList.add('active');

            // Filter works based on the selected category
            const filteredWorks = works.filter(work => 
                filterValue === '*' || work.category.name === filterValue.slice(1)
            );
            generateWorks(filteredWorks);
        }
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    try{
        const works = await fetchWorks();
        if (works) {
        generateWorks(works);
        }
        const categories = await fetchCategories();
        if (categories) {
        generateCategoriesFilters(categories, works);
        }   

        checkAdminMode();
        // Écouter les événements de suppression et d'ajout d'œuvres
        document.addEventListener('workDeleted', handleWorkDeleted);
        document.addEventListener('workAdded', handleWorkAdded);

    } catch (error) {
        console.error('Erreur:', error);
    }


});

// Fonction pour gérer l'ajout d'une nouvelle œuvre
function handleWorkAdded(event) {
    const { work } = event.detail;
    console.log(`Nouvelle œuvre ajoutée détectée:`, work);
    
    // Ajouter la nouvelle œuvre au cache local
    globalWorks.push(work);
    
    // Recharger la galerie
    const activeFilter = document.querySelector('.filters .active');
    const currentFilter = activeFilter ? activeFilter.getAttribute('data-filter') : '*';
    
    const filteredWorks = globalWorks.filter(w => 
        currentFilter === '*' || w.category.name === currentFilter.slice(1)
    );
    
    generateWorks(filteredWorks);
    
    console.log(`Galerie principale mise à jour. ${globalWorks.length} œuvres au total.`);
}

// Fonction pour gérer la suppression d'une œuvre
function handleWorkDeleted(event) {
    const { workId } = event.detail;
    console.log(`Œuvre supprimée détectée - ID: ${workId}`);
    
    // Supprimer l'œuvre du cache local
    globalWorks = globalWorks.filter(work => work.id !== workId);
    
    // Recharger la galerie avec les œuvres restantes
    const activeFilter = document.querySelector('.filters .active');
    const currentFilter = activeFilter ? activeFilter.getAttribute('data-filter') : '*';
    
    const filteredWorks = globalWorks.filter(work => 
        currentFilter === '*' || work.category.name === currentFilter.slice(1)
    );
    
    generateWorks(filteredWorks);
    
    console.log(`Galerie principale mise à jour. ${globalWorks.length} œuvres restantes.`);
}
