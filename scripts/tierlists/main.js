import state from './state.js';
import { loadData } from './dataLoader.js';
import { loadTabs, loadTierList } from './tierlist.js';
import { loadGallery } from './gallery.js';
import { setupDragDrop } from './dragdrop.js';
import { hideMoveModal, hideTierModal, onMoveSave, onTierSave, onTierDelete } from './modals.js';

document.addEventListener('DOMContentLoaded', async () => {
    await loadData();

    loadTabs();
    loadTierList(state.currentDraft);
    loadGallery('pokemon');
    setupDragDrop();
    setupStaticListeners();
});

function setupStaticListeners() {
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const cat = tab.dataset.category;
            const filtersEl = document.querySelector('.pokemon-filters');
            if (filtersEl) filtersEl.style.display = cat === 'pokemon' ? 'flex' : 'none';
            loadGallery(cat);
        });
    });

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            loadGallery('pokemon');
        });
    });

    const searchInput = document.getElementById('gallery-search');
    if (searchInput) {
        searchInput.addEventListener('input', e => {
            state.gallerySearchQuery = e.target.value.trim().toLowerCase();
            loadGallery(state.currentCategory);
        });
    }

    document.getElementById('move-save')  ?.addEventListener('click', onMoveSave);
    document.getElementById('move-cancel')?.addEventListener('click', hideMoveModal);

    document.getElementById('tier-save')  ?.addEventListener('click', onTierSave);
    document.getElementById('tier-delete')?.addEventListener('click', onTierDelete);
    document.getElementById('tier-cancel')?.addEventListener('click', hideTierModal);

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') { hideMoveModal(); hideTierModal(); }
    });

    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', e => {
            if (e.target === modal) { hideMoveModal(); hideTierModal(); }
        });
    });
}
