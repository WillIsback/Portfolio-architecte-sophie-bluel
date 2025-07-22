import { getWorkData, getCategories, postLogin, postNewWork, deleteWork } from './api.js';
import { checkAdminMode } from './admin.js';



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
        const works = await getWorkData();
        if (works) {
        generateWorks(works);
        }
        const categories = await getCategories();
        if (categories) {
        generateCategoriesFilters(categories, works);
        }   

        checkAdminMode();
    

    } catch (error) {
        console.error('Erreur:', error);
    }


});

