import state from './state.js';
import { getUsageMap } from './usage.js';
import { loadTabs, loadTierList } from './tierlist.js';
import { loadGallery } from './gallery.js';

export function addTab() {
    const maxId = state.drafts.reduce((m, d) => Math.max(m, d.id), 0);
    const newId = maxId + 1;
    state.drafts.push({
        id: newId,
        tiers: [
            { name: 'S', color: '#e74c3c', items: [] },
            { name: 'A', color: '#3498db', items: [] },
            { name: 'B', color: '#2ecc71', items: [] },
            { name: 'C', color: '#f1c40f', items: [] },
            { name: 'D', color: '#9b59b6', items: [] }
        ]
    });
    state.currentDraft = newId;
    loadTabs();
    loadTierList(newId);
    loadGallery(state.currentCategory);
}

export function addTier(draftId) {
    const draft = state.drafts.find(d => d.id === draftId);
    if (!draft) return;
    draft.tiers.push({ name: `Tier ${draft.tiers.length + 1}`, color: '#95a5a6', items: [] });
    loadTierList(draftId);
}

export function deleteTier(draftId, tierIndex) {
    const draft = state.drafts.find(d => d.id === draftId);
    if (!draft) return;
    const tier  = draft.tiers[tierIndex];
    if (!tier) return;
    tier.items.forEach(item => {
        const map = getUsageMap(item.category);
        map.set(item.name, Math.max((map.get(item.name) || 1) - 1, 0));
    });
    draft.tiers.splice(tierIndex, 1);
    loadTierList(draftId);
    loadGallery(state.currentCategory);
}

export function clearDraft(draftId) {
    const draft = state.drafts.find(d => d.id === draftId);
    if (!draft) return;
    draft.tiers.forEach(tier => {
        tier.items.forEach(item => {
            const map = getUsageMap(item.category);
            map.set(item.name, Math.max((map.get(item.name) || 1) - 1, 0));
        });
        tier.items = [];
    });
    loadTierList(draftId);
    loadGallery(state.currentCategory);
}
