// tierlist.js - version complète corrigée

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

// Temp storage used when adding a pokemon from gallery: wait moves selection before final add
let pendingAdd = null;

function getBasePath() {
    return window.location.pathname.includes('PokemonUniteDraft') ? '/PokemonUniteDraft/' : './';
}

async function loadData() {
    try {
        const basePath = getBasePath();
        const [pResp, iResp, bResp] = await Promise.all([
            fetch(`${basePath}/data/mons.json`),
            fetch(`${basePath}/data/items.json`),
            fetch(`${basePath}/data/battle_items.json`)
        ]);
        if (!pResp.ok || !iResp.ok || !bResp.ok) throw new Error('Failed to fetch data files');
        pokemonData = await pResp.json();
        itemData = await iResp.json();
        battleItemData = await bResp.json();
    } catch (err) {
        console.error('Error loading JSON data:', err);
        const g = document.getElementById('gallery');
        if (g) g.innerHTML = '<p>Error: Could not load data. Check JSON files and paths.</p>';
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
    loadTabs();
    loadTierList(currentDraft);
    loadGallery('pokemon');
    setupEventListeners();
    // Accessibility: allow escape to close modals
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            hideMoveModal();
            hideTierModal();
        }
    });
});

/* -------------------------
   Rendering / UI functions
   ------------------------- */

function loadTabs() {
    const tabList = document.querySelector('.tab-list');
    if (!tabList) return;

    // Clear existing content
    tabList.innerHTML = '';

    // Create a button for each draft
    drafts.forEach(d => {
        const btn = document.createElement('button');
        btn.className = `tab ${d.id === currentDraft ? 'active' : ''}`;
        btn.dataset.tabId = d.id;
        btn.textContent = `Tierlist ${d.id}`;
        btn.setAttribute('data-lang', 'nav_tierlist_simulator');
        btn.addEventListener('click', () => switchTab(Number(btn.dataset.tabId)));
        tabList.appendChild(btn);
    });

    // Add the "Add tab" button
    const addBtn = document.createElement('button');
    addBtn.id = 'add-tab';
    addBtn.setAttribute('data-lang', 'add_draft');
    addBtn.textContent = '+ Add Tierlist';
    addBtn.addEventListener('click', addTab);
    tabList.appendChild(addBtn);
}

function addTab() {
    // compute a new unique id (max existing id + 1) to avoid collisions if drafts were deleted
    const maxId = drafts.reduce((m, d) => Math.max(m, d.id), 0);
    const newId = maxId + 1;

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

    currentDraft = newId;
    loadTabs();                // re-render tab list (will highlight the new tab)
    loadTierList(newId);       // create/render the new tierlist container
    loadGallery(currentCategory);
}


function loadTierList(draftId) {
    const basePath = getBasePath();
    const draft = drafts.find(d => d.id === draftId);
    if (!draft) return;

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

    draft.tiers.forEach((tier, index) => {
        const tierRow = document.createElement('div');
        tierRow.className = 'tier-row';
        tierRow.dataset.tierIndex = index;
        tierRow.innerHTML = `
            <div class="tier-header" style="background: ${tier.color}">${tier.name}</div>
            <div class="tier-items" data-tier-index="${index}"></div>
            <div class="tier-actions">
                <button class="settings-tier" aria-label="Tier Settings" data-lang="edit_tier">
                    <img src="${basePath}assets/icons/settings.png" alt="Settings" style="width:24px;height:24px;">
                </button>
            </div>
        `;
        const itemsContainer = tierRow.querySelector('.tier-items');

        // If tier empty, show a small placeholder to make it a valid drop target
        if (tier.items.length === 0) {
            // nothing to append but keep the container present
        }

        tier.items.forEach(item => {
            const tierItem = createTierItemElement(item, basePath);
            itemsContainer.appendChild(tierItem);
        });

        container.appendChild(tierRow);
    });

    const wrapper = document.getElementById('tierlist-wrapper');
    if (!wrapper) return;
    const existing = document.getElementById(`tierlist-${draftId}`);
    if (existing) existing.replaceWith(container); else wrapper.appendChild(container);

    // After DOM injected, (re)attach settings listeners for this draft
    setupTierEventListeners(draftId);
}

function createTierItemElement(item, basePath) {
    const tierItem = document.createElement('div');
    tierItem.className = 'tier-item';
    tierItem.dataset.name = item.name;
    tierItem.dataset.category = item.category;
    tierItem.draggable = true;
    tierItem.innerHTML = `
        <img src="${basePath}assets/${item.category}/${item.file}" alt="${item.name}">
        ${item.category === 'pokemon' && item.moves ? `<div class="moves">${item.moves.join(', ')}</div>` : ''}
    `;
    return tierItem;
}

function switchTab(tabId) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tierlist-container').forEach(c => c.classList.remove('active'));
    const newTab = document.querySelector(`.tab[data-tab-id="${tabId}"]`);
    const newContainer = document.getElementById(`tierlist-${tabId}`);
    if (newTab && newContainer) {
        newTab.classList.add('active');
        newContainer.classList.add('active');
        currentDraft = tabId;
        loadTierList(tabId);
    } else {
        console.warn('Tab or container not found for', tabId);
    }
}

function loadGallery(category) {
    currentCategory = category;
    const basePath = getBasePath();
    const gallery = document.getElementById('gallery');
    if (!gallery) return;
    gallery.innerHTML = '';

    let data = [];
    if (category === 'pokemon') data = pokemonData;
    else if (category === 'items') data = itemData;
    else if (category === 'battle_items') data = battleItemData;

    data.forEach(item => {
        const activeRole = document.querySelector('.filter-btn.active')?.dataset.role;
        if (category === 'pokemon' && activeRole && activeRole !== 'unknown' && item.role !== activeRole) return;

        const usageMap = category === 'pokemon' ? pokemonUsage : itemUsage;
        const count = usageMap.get(item.name) || 0;
        const maxUsage = category === 'pokemon' ? 4 : 1;
        if (count >= maxUsage) return;

        const img = document.createElement('img');
        img.src = `${basePath}assets/${category}/${item.file}`;
        img.alt = item.name;
        img.dataset.name = item.name;
        img.dataset.category = category;
        img.draggable = true;
        img.className = 'gallery-item';
        gallery.appendChild(img);
    });
}

/* -------------------------
   Drag & Drop logic
   ------------------------- */

function setupEventListeners() {
    // category tabs
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            document.querySelector('.pokemon-filters').style.display =
                tab.dataset.category === 'pokemon' ? 'flex' : 'none';
            loadGallery(tab.dataset.category);
        });
    });

    // filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            loadGallery('pokemon');
        });
    });

    // tier buttons (delegated)
    document.addEventListener('click', e => {
        if (e.target.id === 'add-tier') addTier(currentDraft);
        if (e.target.id === 'clear-draft') clearDraft(currentDraft);
    });

    // modal buttons (these elements exist in part 2 modal code - ensure present)
    const moveSave = document.getElementById('move-save');
    const moveCancel = document.getElementById('move-cancel');
    if (moveSave) moveSave.addEventListener('click', onMoveSave);
    if (moveCancel) moveCancel.addEventListener('click', hideMoveModal);

    const tierSave = document.getElementById('tier-save');
    const tierDelete = document.getElementById('tier-delete');
    const tierCancel = document.getElementById('tier-cancel');
    if (tierSave) tierSave.addEventListener('click', onTierSave);
    if (tierDelete) tierDelete.addEventListener('click', onTierDelete);
    if (tierCancel) tierCancel.addEventListener('click', hideTierModal);

    // DRAG START - delegate
    document.addEventListener('dragstart', e => {
        const galleryImg = e.target.closest('.gallery img, .gallery-item');
        const tierItem = e.target.closest('.tier-item');

        if (galleryImg) {
            // dragging from gallery
            const img = galleryImg.tagName === 'IMG' ? galleryImg : galleryImg.querySelector('img');
            const data = {
                name: img.dataset.name || img.alt,
                category: img.dataset.category || img.getAttribute('data-category') || currentCategory,
                fromTier: null
            };
            e.dataTransfer.setData('text/plain', JSON.stringify(data));
            e.dataTransfer.effectAllowed = 'copy';
            document.body.classList.add('dragging');
        } else if (tierItem) {
            // dragging from a tier
            const img = tierItem.querySelector('img');
            const fromTier = parseInt(tierItem.closest('.tier-row').dataset.tierIndex);
            const data = {
                name: tierItem.dataset.name || img.alt,
                category: tierItem.dataset.category || img.dataset.category,
                fromTier: fromTier,
                moves: (() => {
                    const draft = drafts.find(d => d.id === currentDraft);
                    const t = draft.tiers[fromTier];
                    if (!t) return [];
                    const it = t.items.find(i => i.name === (tierItem.dataset.name || img.alt));
                    return it?.moves || [];
                })()
            };
            e.dataTransfer.setData('text/plain', JSON.stringify(data));
            e.dataTransfer.effectAllowed = 'move';
            document.body.classList.add('dragging');
        } else {
            // not a draggable element
        }
    });

    // DRAG OVER - visual preview and allow drop on tier-items and gallery
    document.addEventListener('dragover', e => {
        e.preventDefault();
        const tier = e.target.closest('.tier-items');
        const gallery = e.target.closest('#gallery');
        // remove preview from others
        document.querySelectorAll('.tier-items').forEach(t => {
            if (t !== tier) t.classList.remove('drag-over');
        });
        if (tier) {
            tier.classList.add('drag-over');
            // show placeholder if empty or to indicate position
            ensurePreviewPlaceholder(tier);
        }
        if (gallery) {
            gallery.classList.add('gallery-drag-over');
        } else {
            document.querySelectorAll('#gallery').forEach(g => g.classList.remove('gallery-drag-over'));
        }
    });

    document.addEventListener('dragleave', e => {
        const tier = e.target.closest('.tier-items');
        if (tier) {
            // if leaving the whole tier-items area, remove preview
            const related = e.relatedTarget;
            // small tolerance: only remove if relatedTarget is not inside same tier
            if (!related || !related.closest || !related.closest('.tier-items') || related.closest('.tier-items') !== tier) {
                removePreviewPlaceholder(tier);
                tier.classList.remove('drag-over');
            }
        }
        const gallery = e.target.closest('#gallery');
        if (gallery) gallery.classList.remove('gallery-drag-over');
    });

    // DROP
    document.addEventListener('drop', e => {
        e.preventDefault();
        document.body.classList.remove('dragging');

        // remove all previews
        document.querySelectorAll('.tier-items').forEach(t => {
            t.classList.remove('drag-over');
            removePreviewPlaceholder(t);
        });
        document.querySelectorAll('#gallery').forEach(g => g.classList.remove('gallery-drag-over'));

        let dataStr = null;
        try {
            dataStr = e.dataTransfer.getData('text/plain');
        } catch (err) {
            console.error('No dataTransfer data:', err);
            return;
        }
        if (!dataStr) return;
        let data;
        try {
            data = JSON.parse(dataStr);
        } catch (err) {
            console.error('Failed to parse drag data', err);
            return;
        }

        const tierItems = e.target.closest('.tier-items');
        const gallery = e.target.closest('#gallery');
        const draft = drafts.find(d => d.id === currentDraft);
        const usageMap = data.category === 'pokemon' ? pokemonUsage : itemUsage;
        const maxUsage = data.category === 'pokemon' ? 4 : 1;

        // DROP ON TIER
        if (tierItems) {
            const tierIndex = parseInt(tierItems.dataset.tierIndex);

            // prevent duplicate
            if (draft.tiers[tierIndex].items.some(i => i.name === data.name)) return;

            // moving from another tier -> remove from origin tier but don't change usage counts
            if (data.fromTier !== null && data.fromTier !== tierIndex) {
                const origin = draft.tiers[data.fromTier];
                origin.items = origin.items.filter(i => i.name !== data.name);
                // find the full item data (file/moves) from stored lists or origin
                // we'll try to find in origin removed item via prior cached moves, but simplest is:
                // look up in pokemonData/itemData etc when re-adding below
            }

            // dragging from gallery (fromTier === null)
            if (data.fromTier === null) {
                const count = usageMap.get(data.name) || 0;
                if (count >= maxUsage) return;
                // when pokemon added from gallery, we must prompt moves selection BEFORE finalizing add
                if (data.category === 'pokemon') {
                    // set pending add and open modal; modal save will finalize addition
                    pendingAdd = { name: data.name, category: data.category, tierIndex: tierIndex };
                    showMoveModalForAdd(data.name, tierIndex);
                    // do not add now
                    return;
                } else {
                    // items: immediate add and increment usage
                    usageMap.set(data.name, (usageMap.get(data.name) || 0) + 1);
                    const src = data.category === 'pokemon' ? pokemonData : (data.category === 'items' ? itemData : battleItemData);
                    const itemFile = src.find(i => i.name === data.name)?.file;
                    if (!itemFile) return;
                    draft.tiers[tierIndex].items.push({ name: data.name, category: data.category, file: itemFile });
                    loadTierList(currentDraft);
                    loadGallery(currentCategory);
                    return;
                }
            } else {
                // moving from a tier into this tier (data.fromTier !== null)
                // we need to find the file/moves for the item: if it came from another tier, it should exist there before we removed it.
                // We'll try to search in all tiers or fallback to data sources
                let itemObj = null;
                for (const t of draft.tiers) {
                    const found = t.items.find(i => i.name === data.name);
                    if (found) { itemObj = found; break; }
                }
                // if not found (because we removed it from origin above), fallback to source lists
                if (!itemObj) {
                    const src = data.category === 'pokemon' ? pokemonData : (data.category === 'items' ? itemData : battleItemData);
                    const file = src.find(i => i.name === data.name)?.file;
                    itemObj = { name: data.name, category: data.category, file: file, moves: data.moves || [] };
                }
                // push a shallow clone
                draft.tiers[tierIndex].items.push(Object.assign({}, itemObj));
                loadTierList(currentDraft);
                loadGallery(currentCategory);
                return;
            }
        }

        // DROP ON GALLERY => interpret as "remove back to gallery" if from tier
        if (gallery) {
            if (data.fromTier !== null) {
                const origin = draft.tiers[data.fromTier];
                origin.items = origin.items.filter(i => i.name !== data.name);
                const usageMapLocal = data.category === 'pokemon' ? pokemonUsage : itemUsage;
                usageMapLocal.set(data.name, Math.max((usageMapLocal.get(data.name) || 1) - 1, 0));
                loadTierList(currentDraft);
                loadGallery(currentCategory);
            }
            return;
        }

        // DROP OUTSIDE any relevant container => removal if fromTier !== null
        const droppedOutside =
            !e.target.closest('.tierlist-container') &&
            !e.target.closest('#gallery') &&
            !e.target.closest('.pokemon-filters') &&
            !e.target.closest('.tab-list');

        if (droppedOutside && data.fromTier !== null) {
            const origin = draft.tiers[data.fromTier];
            origin.items = origin.items.filter(i => i.name !== data.name);
            const usageMapLocal = data.category === 'pokemon' ? pokemonUsage : itemUsage;
            usageMapLocal.set(data.name, Math.max((usageMapLocal.get(data.name) || 1) - 1, 0));
            loadTierList(currentDraft);
            loadGallery(currentCategory);
            return;
        }

        // otherwise ignore
    });
}

/* Preview placeholder helpers */
function ensurePreviewPlaceholder(tierElement) {
    if (!tierElement) return;
    if (!tierElement.querySelector('.preview-placeholder')) {
        const ph = document.createElement('div');
        ph.className = 'preview-placeholder';
        ph.style.width = '70px';
        ph.style.height = '70px';
        ph.style.border = '2px dashed rgba(255,255,255,0.2)';
        ph.style.borderRadius = '8px';
        ph.style.margin = '4px';
        ph.style.boxSizing = 'border-box';
        tierElement.appendChild(ph);
    }
}

function removePreviewPlaceholder(tierElement) {
    if (!tierElement) return;
    const ph = tierElement.querySelector('.preview-placeholder');
    if (ph) ph.remove();
}

/* -------------------------
   Modals & tier controls (move selection + tier edit)
   ------------------------- */

// show move modal when user drops a pokemon from gallery into a tier
function showMoveModalForAdd(pokemonName, tierIndex) {
    const modal = document.getElementById('move-modal');
    const movesContainer = document.getElementById('move-options');
    if (!modal || !movesContainer) return;

    movesContainer.innerHTML = '';
    const p = pokemonData.find(pp => pp.name === pokemonName);
    // if there's a "moves" array in mons.json, use it; otherwise fallback to two empty inputs
    if (p && Array.isArray(p.moves) && p.moves.length > 0) {
        p.moves.forEach((mv, idx) => {
            // allow checking/choosing — using checkboxes so user chooses from available moves
            const id = `move-${pokemonName}-${idx}`;
            const wrapper = document.createElement('div');
            wrapper.className = 'move-option';
            wrapper.innerHTML = `<label><input type="checkbox" id="${id}" value="${mv}"> ${mv}</label>`;
            movesContainer.appendChild(wrapper);
        });
    } else {
        // fallback: 2 inputs
        movesContainer.innerHTML = `
            <label>Move 1: <input type="text" id="move-input-1" placeholder="Move 1"></label>
            <label>Move 2: <input type="text" id="move-input-2" placeholder="Move 2"></label>
        `;
    }

    modal.dataset.pokemon = pokemonName;
    modal.dataset.tierIndex = tierIndex;
    modal.style.display = 'flex';
}

// hide modal helpers
function hideMoveModal() {
    const modal = document.getElementById('move-modal');
    if (modal) modal.style.display = 'none';
    pendingAdd = null;
}

function hideTierModal() {
    const modal = document.getElementById('tier-modal');
    if (modal) modal.style.display = 'none';
}

/* Called when pressing Save in move modal */
function onMoveSave() {
    const modal = document.getElementById('move-modal');
    if (!modal) return;
    const pokemonName = modal.dataset.pokemon;
    const tierIndex = parseInt(modal.dataset.tierIndex);

    // gather moves
    let moves = [];
    const movesContainer = document.getElementById('move-options');
    if (!movesContainer) movesContainer = null;
    if (movesContainer) {
        // check for checkboxes
        const checked = Array.from(movesContainer.querySelectorAll('input[type=checkbox]:checked'))
            .map(i => i.value);
        if (checked.length > 0) moves = checked;
        else {
            // try text inputs fallback
            const textVals = Array.from(movesContainer.querySelectorAll('input[type=text]'))
                .map(i => i.value.trim())
                .filter(v => v);
            moves = textVals;
        }
    }

    // finalize pending add
    if (pendingAdd && pendingAdd.name === pokemonName && pendingAdd.tierIndex === tierIndex) {
        const draft = drafts.find(d => d.id === currentDraft);
        const usageCount = pokemonUsage.get(pokemonName) || 0;
        if (usageCount >= 4) {
            // can't add
            pendingAdd = null;
            hideMoveModal();
            return;
        }
        pokemonUsage.set(pokemonName, usageCount + 1);
        const file = pokemonData.find(p => p.name === pokemonName)?.file;
        draft.tiers[tierIndex].items.push({ name: pokemonName, category: 'pokemon', file: file, moves: moves });
        pendingAdd = null;
        hideMoveModal();
        loadTierList(currentDraft);
        loadGallery(currentCategory);
    } else {
        // Possibly editing moves of an existing pokemon already in a tier (not from gallery)
        // find the pokemon in tiers by name and current modal dataset (if any)
        const draft = drafts.find(d => d.id === currentDraft);
        for (const tier of draft.tiers) {
            const it = tier.items.find(i => i.name === pokemonName && i.category === 'pokemon');
            if (it) {
                it.moves = moves;
                break;
            }
        }
        hideMoveModal();
        loadTierList(currentDraft);
    }
}

/* Tier modal open/save/delete handlers */

// we attach settings buttons in loadTierList via setupTierEventListeners
function setupTierEventListeners(draftId) {
    const container = document.getElementById(`tierlist-${draftId}`);
    if (!container) return;
    container.querySelectorAll('.settings-tier').forEach(btn => {
        btn.removeEventListener('click', onSettingsClick); // safe remove
        btn.addEventListener('click', onSettingsClick);
    });

    function onSettingsClick(e) {
        const tierRow = e.target.closest('.tier-row');
        if (!tierRow) return;
        const tierIndex = parseInt(tierRow.dataset.tierIndex);
        openTierModal(draftId, tierIndex);
    }
}

function openTierModal(draftId, tierIndex) {
    const draft = drafts.find(d => d.id === draftId);
    if (!draft) return;
    const tier = draft.tiers[tierIndex];
    const modal = document.getElementById('tier-modal');
    if (!modal) return;

    document.getElementById('tier-name').value = tier.name;
    document.getElementById('tier-color').value = tier.color || '#ffffff';
    modal.dataset.draftId = draftId;
    modal.dataset.tierIndex = tierIndex;
    modal.style.display = 'flex';
}

function onTierSave() {
    const modal = document.getElementById('tier-modal');
    if (!modal) return;
    const draftId = parseInt(modal.dataset.draftId);
    const tierIndex = parseInt(modal.dataset.tierIndex);
    const draft = drafts.find(d => d.id === draftId);
    if (!draft) return;
    const newName = document.getElementById('tier-name').value.trim() || `Tier ${tierIndex + 1}`;
    const newColor = document.getElementById('tier-color').value || draft.tiers[tierIndex].color;
    draft.tiers[tierIndex].name = newName;
    draft.tiers[tierIndex].color = newColor;
    modal.style.display = 'none';
    loadTierList(draftId);
}

function onTierDelete() {
    const modal = document.getElementById('tier-modal');
    if (!modal) return;
    const draftId = parseInt(modal.dataset.draftId);
    const tierIndex = parseInt(modal.dataset.tierIndex);
    deleteTier(draftId, tierIndex);
    modal.style.display = 'none';
}

/* -------------------------
   Tier management helpers
   ------------------------- */

function addTier(draftId) {
    const draft = drafts.find(d => d.id === draftId);
    if (!draft) return;
    draft.tiers.push({ name: `Tier ${draft.tiers.length + 1}`, color: '#95a5a6', items: [] });
    loadTierList(draftId);
}

function deleteTier(draftId, tierIndex) {
    const draft = drafts.find(d => d.id === draftId);
    if (!draft) return;
    const tier = draft.tiers[tierIndex];
    if (!tier) return;
    // decrement usages for items in this tier
    tier.items.forEach(item => {
        const map = item.category === 'pokemon' ? pokemonUsage : itemUsage;
        map.set(item.name, Math.max((map.get(item.name) || 1) - 1, 0));
    });
    draft.tiers.splice(tierIndex, 1);
    loadTierList(draftId);
    loadGallery(currentCategory);
}

function clearDraft(draftId) {
    const draft = drafts.find(d => d.id === draftId);
    if (!draft) return;
    draft.tiers.forEach(tier => {
        tier.items.forEach(item => {
            const map = item.category === 'pokemon' ? pokemonUsage : itemUsage;
            map.set(item.name, Math.max((map.get(item.name) || 1) - 1, 0));
        });
        tier.items = [];
    });
    loadTierList(draftId);
    loadGallery(currentCategory);
}

/* -------------------------
   Move-edit (editing moves of an already-placed Pokemon)
   ------------------------- */

// If user double-clicks a tier-item pokemon, open its moves modal for editing
document.addEventListener('dblclick', e => {
    const tierItem = e.target.closest('.tier-item');
    if (!tierItem) return;
    const category = tierItem.dataset.category;
    if (category !== 'pokemon') return;
    // find which tier it belongs to
    const tierRow = tierItem.closest('.tier-row');
    const tierIndex = parseInt(tierRow.dataset.tierIndex);
    const name = tierItem.dataset.name;
    // populate modal with current moves
    const modal = document.getElementById('move-modal');
    const movesContainer = document.getElementById('move-options');
    if (!modal || !movesContainer) return;
    movesContainer.innerHTML = '';
    // try to get available moves from mons.json
    const pDef = pokemonData.find(p => p.name === name);
    // if pokemon is already in tier, grab its moves to pre-check
    const draft = drafts.find(d => d.id === currentDraft);
    const placed = draft.tiers[tierIndex].items.find(i => i.name === name);
    const currentMoves = placed?.moves || [];

    if (pDef && Array.isArray(pDef.moves) && pDef.moves.length > 0) {
        pDef.moves.forEach((mv, idx) => {
            const id = `move-edit-${name}-${idx}`;
            const checked = currentMoves.includes(mv) ? 'checked' : '';
            const wrapper = document.createElement('div');
            wrapper.className = 'move-option';
            wrapper.innerHTML = `<label><input type="checkbox" id="${id}" value="${mv}" ${checked}> ${mv}</label>`;
            movesContainer.appendChild(wrapper);
        });
    } else {
        // fallback text inputs filled with current moves if any
        movesContainer.innerHTML = `
            <label>Move 1: <input type="text" id="move-input-1" value="${currentMoves[0] || ''}"></label>
            <label>Move 2: <input type="text" id="move-input-2" value="${currentMoves[1] || ''}"></label>
        `;
    }

    modal.dataset.pokemon = name;
    modal.dataset.tierIndex = tierIndex;
    modal.style.display = 'flex';
});

/* -------------------------
   Utility: add tab function (for multiple drafts)  
   ------------------------- */

function addTab() {
    // compute a new unique id (max existing id + 1) to avoid collisions if drafts were deleted
    const maxId = drafts.reduce((m, d) => Math.max(m, d.id), 0);
    const newId = maxId + 1;

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

    currentDraft = newId;
    loadTabs();                // re-render tab list (will highlight the new tab)
    loadTierList(newId);       // create/render the new tierlist container
    loadGallery(currentCategory);
}

/* -------------------------
   End of script
   ------------------------- */
