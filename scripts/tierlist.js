// tierlist.js
let drafts = [{
    id: 1,
    tiers: [
        { name: 'S', color: '#e74c3c', items: [] },
        { name: 'A', color: '#3498db', items: [] },
        { name: 'B', color: '#2ecc71', items: [] },
        { name: 'C', color: '#f1c40f', items: [] },
        { name: 'D', color: '#9b59b6', items: [] }
    ]
}];
let currentDraft = 1;
let currentCategory = 'pokemon';
let pokemonUsage = new Map();
let itemUsage = new Map();
let pokemonData = [];
let itemData = [];
let battleItemData = [];

async function loadData() {
    try {
        const [pokemonResponse, itemResponse, battleItemResponse] = await Promise.all([
            fetch('mons.json'),
            fetch('items.json'),
            fetch('battle_items.json')
        ]);
        pokemonData = await pokemonResponse.json();
        itemData = await itemResponse.json();
        battleItemData = await battleItemResponse.json();
    } catch (error) {
        console.error('Error loading JSON data:', error);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
    loadTabs();
    loadTierList(1);
    loadGallery('pokemon');
    setupEventListeners();
});

function loadTabs() {
    const tabList = document.querySelector('.tab-list');
    tabList.innerHTML = '<button class="tab active" data-tab-id="1" data-lang="nav_draft_simulator">Tierlist 1</button><button id="add-tab" data-lang="add_draft">+ Add Tierlist</button>';
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => switchTab(parseInt(tab.dataset.tabId)));
    });
    document.getElementById('add-tab').addEventListener('click', addTab);
}

function loadTierList(draftId) {
    const container = document.createElement('div');
    container.className = `tierlist-container ${draftId === currentDraft ? 'active' : ''}`;
    container.id = `tierlist-${draftId}`;
    const controls = document.createElement('div');
    controls.className = 'tier-controls';
    controls.innerHTML = `
        <button id="add-tier" data-lang="add_tier">Add Tier</button>
        <button id="clear-draft" class="clear-draft" data-lang="clear_draft">Clear Draft</button>
    `;
    container.appendChild(controls);

    const draft = drafts.find(d => d.id === draftId);
    draft.tiers.forEach((tier, index) => {
        const tierRow = document.createElement('div');
        tierRow.className = 'tier-row';
        tierRow.dataset.tierIndex = index;
        tierRow.innerHTML = `
            <div class="tier-header" style="background: ${tier.color}">${tier.name}</div>
            <div class="tier-items"></div>
            <div class="tier-actions">
                <button class="settings-tier" aria-label="Tier Settings" data-lang="edit_tier">
                    <svg viewBox="0 0 24 24">
                        <path d="M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.06-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.49.49 0 0 0-.48-.41h-3.84a.49.49 0 0 0-.48.41l-.36 2.54c-.59.24-1.13.56-1.62.94l-2.39-.96a.49.49 0 0 0-.59.22L2.8 9.45a.49.49 0 0 0 .12.61l2.03 1.58c-.04.3-.06.61-.06.94s.02.64.06.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32a.49.49 0 0 0 .59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54a.49.49 0 0 0 .48.41h3.84a.49.49 0 0 0 .48-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96a.49.49 0 0 0 .59-.22l1.92-3.32a.49.49 0 0 0-.12-.61l-2.03-1.58zM12 15.6c-1.99 0-3.6-1.61-3.6-3.6s1.61-3.6 3.6-3.6 3.6 1.61 3.6 3.6-1.61 3.6-3.6 3.6z"/>
                    </svg>
                </button>
            </div>
        `;
        tier.items.forEach(item => {
            const tierItem = document.createElement('div');
            tierItem.className = 'tier-item';
            tierItem.dataset.name = item.name;
            tierItem.dataset.category = item.category;
            tierItem.draggable = true;
            tierItem.innerHTML = `
                <img src="assets/${item.category}/${item.file}" alt="${item.name}">
                ${item.category === 'pokemon' && item.moves ? `<div class="moves">${item.moves.join(', ')}</div>` : ''}
            `;
            tierRow.querySelector('.tier-items').appendChild(tierItem);
        });
        container.appendChild(tierRow);
    });

    const wrapper = document.getElementById('tierlist-wrapper');
    const existingContainer = document.getElementById(`tierlist-${draftId}`);
    if (existingContainer) {
        existingContainer.replaceWith(container);
    } else {
        wrapper.appendChild(container);
    }
    setupTierEventListeners(draftId);
}

function switchTab(tabId) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tierlist-container').forEach(container => container.classList.remove('active'));
    const newTab = document.querySelector(`.tab[data-tab-id="${tabId}"]`);
    const newContainer = document.getElementById(`tierlist-${tabId}`);
    if (newTab && newContainer) {
        newTab.classList.add('active');
        newContainer.classList.add('active');
        currentDraft = tabId;
        loadTierList(tabId);
    } else {
        console.error(`Tab or container for draft ${tabId} not found`);
    }
}

function addTab() {
    const newId = drafts.length + 1;
    drafts.push({
        id: newId,
        tiers: [
            { name: 'S', color: '#e74c3c', items: [] },
            { name: 'A', color: '#3498db', items: [] },
            { name: 'B', color: '#2ecc71', items: [] },
            { name: 'C', color: '#f1c40f', items: [] },
            { name: 'D', color: '#9b59b6', items: [] }
        ]
    });
    const tabList = document.querySelector('.tab-list');
    const newTab = document.createElement('button');
    newTab.className = 'tab';
    newTab.dataset.tabId = newId;
    newTab.dataset.lang = 'nav_draft_simulator';
    newTab.textContent = `Tierlist ${newId}`;
    tabList.insertBefore(newTab, document.getElementById('add-tab'));
    newTab.addEventListener('click', () => switchTab(newId));
    loadTierList(newId);
    switchTab(newId);
}

function clearDraft(draftId) {
    const draft = drafts.find(d => d.id === draftId);
    draft.tiers.forEach(tier => {
        tier.items.forEach(item => {
            const usageMap = item.category === 'pokemon' ? pokemonUsage : itemUsage;
            usageMap.set(item.name, 0);
        });
        tier.items = [];
    });
    draft.tiers = [
        { name: 'S', color: '#e74c3c', items: [] },
        { name: 'A', color: '#3498db', items: [] },
        { name: 'B', color: '#2ecc71', items: [] },
        { name: 'C', color: '#f1c40f', items: [] },
        { name: 'D', color: '#9b59b6', items: [] }
    ];
    loadTierList(draftId);
    loadGallery(currentCategory);
}

function loadGallery(category) {
    currentCategory = category;
    const gallery = document.getElementById('gallery');
    gallery.innerHTML = '';
    let data = [];
    if (category === 'pokemon') data = pokemonData;
    else if (category === 'items') data = itemData;
    else if (category === 'battle_items') data = battleItemData;

    data.forEach(item => {
        if (category === 'pokemon' && document.querySelector('.filter-btn.active')?.dataset.role !== 'unknown' && item.role !== document.querySelector('.filter-btn.active')?.dataset.role) return;
        const count = category === 'pokemon' ? pokemonUsage.get(item.name) || 0 : itemUsage.get(item.name) || 0;
        if (category === 'pokemon' && count >= 4) return;
        if (category !== 'pokemon' && count >= 1) return;
        const img = document.createElement('img');
        img.src = `assets/${category}/${item.file}`;
        img.alt = item.name;
        img.dataset.name = item.name;
        img.dataset.category = category;
        img.className = count >= (category === 'pokemon' ? 4 : 1) ? 'used' : '';
        img.draggable = true;
        gallery.appendChild(img);
    });
}

function setupEventListeners() {
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            document.querySelector('.pokemon-filters').style.display = tab.dataset.category === 'pokemon' ? 'flex' : 'none';
            loadGallery(tab.dataset.category);
        });
    });

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            loadGallery('pokemon');
        });
    });

    document.addEventListener('click', (e) => {
        if (e.target.id === 'add-tier') {
            addTier(currentDraft);
        } else if (e.target.id === 'clear-draft') {
            clearDraft(currentDraft);
        }
    });

    document.getElementById('save-moves').addEventListener('click', saveMoves);
    document.getElementById('close-modal').addEventListener('click', () => document.getElementById('move-modal').style.display = 'none');
    document.getElementById('save-tier').addEventListener('click', saveTier);
    document.getElementById('delete-tier').addEventListener('click', deleteTier);
    document.getElementById('close-tier-modal').addEventListener('click', () => document.getElementById('tier-modal').style.display = 'none');

    document.addEventListener('dragstart', e => {
        if (e.target.tagName === 'IMG' || e.target.classList.contains('tier-item')) {
            e.dataTransfer.setData('text/plain', JSON.stringify({
                name: e.target.dataset.name || e.target.querySelector('img').alt,
                category: e.target.dataset.category,
                fromTier: e.target.classList.contains('tier-item') ? parseInt(e.target.closest('.tier-row').dataset.tierIndex) : null,
                moves: e.target.classList.contains('tier-item') && e.target.dataset.category === 'pokemon' ? 
                    (drafts.find(d => d.id === currentDraft).tiers[parseInt(e.target.closest('.tier-row').dataset.tierIndex)]
                        .items.find(item => item.name === (e.target.dataset.name || e.target.querySelector('img').alt))?.moves || []) 
                    : null
            }));
        }
    });

    document.addEventListener('dragover', e => e.preventDefault());

    document.addEventListener('drop', e => {
        e.preventDefault();
        const data = JSON.parse(e.dataTransfer.getData('text/plain'));
        const draft = drafts.find(d => d.id === currentDraft);

        if (e.target.closest('.tier-items')) {
            const tierIndex = parseInt(e.target.closest('.tier-row').dataset.tierIndex);

            // Vérifier si l'item existe déjà dans le tier cible (éviter les doublons)
            if (draft.tiers[tierIndex].items.some(item => item.name === data.name)) {
                return; // Ne pas ajouter si l'item est déjà dans le tier
            }

            // Supprimer l'item de son tier d'origine si nécessaire
            if (data.fromTier !== null) {
                draft.tiers[data.fromTier].items = draft.tiers[data.fromTier].items.filter(item => item.name !== data.name);
            }

            // Vérifier la limite d'utilisation
            const usageMap = data.category === 'pokemon' ? pokemonUsage : itemUsage;
            const maxUsage = data.category === 'pokemon' ? 4 : 1;
            const count = usageMap.get(data.name) || 0;

            // Si l'item vient de la galerie (fromTier === null), vérifier la limite
            if (data.fromTier === null && count >= maxUsage) {
                return; // Ne pas ajouter si la limite est atteinte
            }

            // Ajouter l'item au nouveau tier
            const itemDataSource = data.category === 'pokemon' ? pokemonData : (data.category === 'items' ? itemData : battleItemData);
            const item = {
                name: data.name,
                category: data.category,
                file: itemDataSource.find(i => i.name === data.name).file
            };

            // Si c'est un Pokémon, inclure les mouvements (existants ou nouveaux)
            if (data.category === 'pokemon') {
                if (data.fromTier !== null && data.moves && data.moves.length > 0) {
                    // Conserver les mouvements existants si l'item vient d'un autre tier
                    item.moves = data.moves;
                    draft.tiers[tierIndex].items.push(item);
                    loadTierList(currentDraft);
                    loadGallery(currentCategory);
                } else {
                    // Afficher la modale pour sélectionner les mouvements si l'item vient de la galerie
                    showMoveModal(data.name, data.category, tierIndex);
                }
            } else {
                // Pour les items ou objets de combat, ajouter directement
                draft.tiers[tierIndex].items.push(item);
                if (data.fromTier === null) {
                    // Mettre à jour le compteur uniquement si l'item vient de la galerie
                    usageMap.set(data.name, count + 1);
                }
                loadTierList(currentDraft);
                loadGallery(currentCategory);
            }
        } else if (!e.target.closest('.tierlist-container') && !e.target.closest('.gallery')) {
            // Si droppé en dehors, supprimer de la tier list et remettre dans la galerie
            if (data.fromTier !== null) {
                draft.tiers[data.fromTier].items = draft.tiers[data.fromTier].items.filter(item => item.name !== data.name);
                const usageMap = data.category === 'pokemon' ? pokemonUsage : itemUsage;
                usageMap.set(data.name, (usageMap.get(data.name) || 0) - 1);
                loadTierList(currentDraft);
                loadGallery(currentCategory);
            }
        }
    });
}

function setupTierEventListeners(draftId) {
    document.querySelectorAll(`#tierlist-${draftId} .settings-tier`).forEach(btn => {
        btn.addEventListener('click', () => {
            const tierIndex = parseInt(btn.closest('.tier-row').dataset.tierIndex);
            const draft = drafts.find(d => d.id === draftId);
            const tier = draft.tiers[tierIndex];
            document.getElementById('tier-name').value = tier.name;
            document.getElementById('tier-color').value = tier.color;
            document.getElementById('tier-modal').dataset.tierIndex = tierIndex;
            document.getElementById('tier-modal').dataset.draftId = draftId;
            document.getElementById('tier-modal').style.display = 'flex';
        });
    });
}

function addTier(draftId) {
    const draft = drafts.find(d => d.id === draftId);
    draft.tiers.push({ name: `Tier ${draft.tiers.length + 1}`, color: '#e74c3c', items: [] });
    loadTierList(draftId);
}

function showMoveModal(name, category, tierIndex) {
    document.getElementById('modal-pokemon-name').textContent = name;
    document.getElementById('move-modal').dataset.tierIndex = tierIndex;
    document.getElementById('move-modal').dataset.name = name;
    document.getElementById('move-modal').dataset.category = category;
    document.getElementById('move-modal').style.display = 'flex';
}

function saveMoves() {
    const tierIndex = parseInt(document.getElementById('move-modal').dataset.tierIndex);
    const name = document.getElementById('move-modal').dataset.name;
    const category = document.getElementById('move-modal').dataset.category;
    const move1 = document.getElementById('move1').value;
    const move2 = document.getElementById('move2').value;
    const draft = drafts.find(d => d.id === currentDraft);
    draft.tiers[tierIndex].items.push({
        name,
        category,
        file: pokemonData.find(p => p.name === name).file,
        moves: [move1, move2]
    });
    pokemonUsage.set(name, (pokemonUsage.get(name) || 0) + 1);
    loadTierList(currentDraft);
    loadGallery(currentCategory);
    document.getElementById('move-modal').style.display = 'none';
}

function saveTier() {
    const tierIndex = parseInt(document.getElementById('tier-modal').dataset.tierIndex);
    const draftId = parseInt(document.getElementById('tier-modal').dataset.draftId);
    const draft = drafts.find(d => d.id === draftId);
    draft.tiers[tierIndex].name = document.getElementById('tier-name').value;
    draft.tiers[tierIndex].color = document.getElementById('tier-color').value;
    loadTierList(draftId);
    document.getElementById('tier-modal').style.display = 'none';
}

function deleteTier() {
    const tierIndex = parseInt(document.getElementById('tier-modal').dataset.tierIndex);
    const draftId = parseInt(document.getElementById('tier-modal').dataset.draftId);
    const draft = drafts.find(d => d.id === draftId);
    draft.tiers[tierIndex].items.forEach(item => {
        const usageMap = item.category === 'pokemon' ? pokemonUsage : itemUsage;
        usageMap.set(item.name, (usageMap.get(item.name) || 0) - 1);
    });
    draft.tiers.splice(tierIndex, 1);
    loadTierList(draftId);
    loadGallery(currentCategory);
    document.getElementById('tier-modal').style.display = 'none';
}