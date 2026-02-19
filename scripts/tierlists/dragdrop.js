import state from './state.js';
import { getUsageMap, getMaxUsage } from './usage.js';
import { loadTierList } from './tierlist.js';
import { loadGallery } from './gallery.js';
import { showMoveModal } from './modals.js';

let dragPayload = null;

export function setupDragDrop() {
    document.addEventListener('dragstart', e => {
        const galleryImg = e.target.closest('#gallery img, #gallery .gallery-item');
        const tierItem   = e.target.closest('.tier-item');

        if (galleryImg) {
            dragPayload = {
                name:     galleryImg.dataset.name || galleryImg.alt,
                category: galleryImg.dataset.category || state.currentCategory,
                fromTier: null,
            };
            e.dataTransfer.effectAllowed = 'copy';
            e.dataTransfer.setData('text/plain', JSON.stringify(dragPayload));
            galleryImg.classList.add('dragging');

        } else if (tierItem) {
            const fromTier = parseInt(tierItem.closest('.tier-row').dataset.tierIndex);
            const draft    = state.drafts.find(d => d.id === state.currentDraft);
            const stored   = draft?.tiers[fromTier]?.items.find(i => i.name === tierItem.dataset.name);
            dragPayload = {
                name:     tierItem.dataset.name,
                category: tierItem.dataset.category,
                fromTier,
                snapshot: stored ? { ...stored } : null,
            };
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', JSON.stringify(dragPayload));
            tierItem.classList.add('dragging');
        }
        document.body.classList.add('is-dragging');
    });

    document.addEventListener('dragend', () => {
        document.body.classList.remove('is-dragging');
        document.querySelectorAll('.dragging').forEach(el => el.classList.remove('dragging'));
        document.querySelectorAll('.tier-items').forEach(t => {
            t.classList.remove('drag-over');
            t.querySelector('.preview-placeholder')?.remove();
        });
        document.getElementById('remove-zone')?.classList.remove('active');
    });

    document.addEventListener('dragover', e => {
        e.preventDefault();
        const tierZone   = e.target.closest('.tier-items');
        const removeZone = e.target.closest('#remove-zone');

        document.querySelectorAll('.tier-items.drag-over').forEach(t => {
            if (t !== tierZone) {
                t.classList.remove('drag-over');
                t.querySelector('.preview-placeholder')?.remove();
            }
        });

        if (tierZone) {
            tierZone.classList.add('drag-over');
            if (!tierZone.querySelector('.preview-placeholder')) {
                const ph      = document.createElement('div');
                ph.className  = 'preview-placeholder';
                tierZone.appendChild(ph);
            }
        }

        if (removeZone && dragPayload?.fromTier !== null) {
            removeZone.classList.add('active');
        } else {
            document.getElementById('remove-zone')?.classList.remove('active');
        }
    });

    document.addEventListener('dragleave', e => {
        const tierZone = e.target.closest('.tier-items');
        if (tierZone) {
            const related = e.relatedTarget;
            if (!related?.closest('.tier-items') || related.closest('.tier-items') !== tierZone) {
                tierZone.classList.remove('drag-over');
                tierZone.querySelector('.preview-placeholder')?.remove();
            }
        }
        const removeZone = e.target.closest('#remove-zone');
        if (removeZone && !e.relatedTarget?.closest('#remove-zone')) {
            removeZone.classList.remove('active');
        }
    });

    document.addEventListener('drop', e => {
        e.preventDefault();
        document.querySelectorAll('.tier-items').forEach(t => {
            t.classList.remove('drag-over');
            t.querySelector('.preview-placeholder')?.remove();
        });
        document.getElementById('remove-zone')?.classList.remove('active');

        if (!dragPayload) return;

        const tierZone   = e.target.closest('.tier-items');
        const removeZone = e.target.closest('#remove-zone');
        const gallery    = e.target.closest('#gallery');
        const draft      = state.drafts.find(d => d.id === state.currentDraft);
        if (!draft) return;

        if (tierZone) {
            const tierIndex  = parseInt(tierZone.dataset.tierIndex);
            const targetTier = draft.tiers[tierIndex];

            if (dragPayload.fromTier !== null) {
                if (dragPayload.fromTier !== tierIndex) {
                    const origin = draft.tiers[dragPayload.fromTier];
                    if (origin) origin.items = origin.items.filter(i => i.name !== dragPayload.name);
                    const item = dragPayload.snapshot || { name: dragPayload.name, category: dragPayload.category };
                    targetTier.items.push({ ...item });
                    loadTierList(state.currentDraft);
                    loadGallery(state.currentCategory);
                }
                dragPayload = null;
                return;
            }

            const usageMap = getUsageMap(dragPayload.category);
            if ((usageMap.get(dragPayload.name) || 0) >= getMaxUsage(dragPayload.category)) {
                dragPayload = null; return;
            }

            if (dragPayload.category === 'pokemon') {
                if (state.tierlistMode !== 'simple') {
                    state.pendingAdd = { name: dragPayload.name, category: dragPayload.category, tierIndex };
                    showMoveModal(dragPayload.name, tierIndex, false);
                    dragPayload = null;
                    return;
                }
                usageMap.set(dragPayload.name, (usageMap.get(dragPayload.name) || 0) + 1);
                const file = state.pokemonData.find(p => p.name === dragPayload.name)?.file;
                targetTier.items.push({ name: dragPayload.name, category: 'pokemon', file, move1: '', move2: '', passive: '', unite: '' });

            } else {
                usageMap.set(dragPayload.name, (usageMap.get(dragPayload.name) || 0) + 1);
                const src  = dragPayload.category === 'items' ? state.itemData : state.battleItemData;
                const file = src.find(i => i.name === dragPayload.name)?.file;
                targetTier.items.push({ name: dragPayload.name, category: dragPayload.category, file });
            }

            dragPayload = null;
            loadTierList(state.currentDraft);
            loadGallery(state.currentCategory);
            return;
        }

        if ((removeZone || gallery) && dragPayload?.fromTier !== null) {
            const origin = draft.tiers[dragPayload.fromTier];
            if (origin) {
                origin.items = origin.items.filter(i => i.name !== dragPayload.name);
                const map = getUsageMap(dragPayload.category);
                map.set(dragPayload.name, Math.max((map.get(dragPayload.name) || 1) - 1, 0));
            }
            dragPayload = null;
            loadTierList(state.currentDraft);
            loadGallery(state.currentCategory);
        }
        dragPayload = null;
    });
}
