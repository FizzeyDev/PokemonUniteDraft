import state from './state.js';
import { getBasePath, getPokeDetail } from './dataLoader.js';
import { recalcUsage } from './usage.js';
import { loadGallery } from './gallery.js';
import { openTierModal } from './modals.js';
import { addTier, clearDraft } from './actions.js';

const MODES = [
    { key: 'simple',  label: 'Simple'     },
    { key: 'moves',   label: 'Move Combo' },
    { key: 'passive', label: 'Passif'     },
    { key: 'unite',   label: 'Unite Move' },
];

export function loadTabs() {
    const tabList = document.querySelector('.tab-list');
    if (!tabList) return;
    tabList.innerHTML = '';

    state.drafts.forEach(d => {
        const btn = document.createElement('button');
        btn.className = `tab ${d.id === state.currentDraft ? 'active' : ''}`;
        btn.dataset.tabId = d.id;
        btn.textContent = `Tierlist ${d.id}`;
        btn.addEventListener('click', () => switchTab(Number(btn.dataset.tabId)));
        tabList.appendChild(btn);
    });

    const addBtn = document.createElement('button');
    addBtn.id = 'add-tab';
    addBtn.textContent = '+ Add Tierlist';
    addBtn.addEventListener('click', () => import('./actions.js').then(m => m.addTab()));
    tabList.appendChild(addBtn);
}

export function switchTab(tabId) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tierlist-container').forEach(c => c.classList.remove('active'));

    const newTab = document.querySelector(`.tab[data-tab-id="${tabId}"]`);
    const newContainer = document.getElementById(`tierlist-${tabId}`);
    if (newTab && newContainer) {
        newTab.classList.add('active');
        newContainer.classList.add('active');
        state.currentDraft = tabId;
        recalcUsage(tabId);
        loadTierList(tabId);
        loadGallery(state.currentCategory);
    }
}

export function loadTierList(draftId) {
    const basePath = getBasePath();
    const draft = state.drafts.find(d => d.id === draftId);
    if (!draft) return;

    const container = document.createElement('div');
    container.className = `tierlist-container ${draftId === state.currentDraft ? 'active' : ''}`;
    container.id = `tierlist-${draftId}`;

    const modeBar = document.createElement('div');
    modeBar.className = 'mode-bar';
    const modeLabel = document.createElement('span');
    modeLabel.className = 'mode-label';
    modeLabel.textContent = 'Mode :';
    modeBar.appendChild(modeLabel);

    const modeBtns = document.createElement('div');
    modeBtns.className = 'mode-btns';
    MODES.forEach(({ key, label }) => {
        const btn = document.createElement('button');
        btn.className = `mode-btn ${state.tierlistMode === key ? 'active' : ''}`;
        btn.dataset.mode = key;
        btn.textContent = label;
        modeBtns.appendChild(btn);
    });
    modeBar.appendChild(modeBtns);
    container.appendChild(modeBar);

    const controls = document.createElement('div');
    controls.className = 'tier-controls';
    controls.innerHTML = `
        <button id="add-tier-btn">+ Add Tier</button>
        <button id="clear-draft-btn" class="clear-draft">Clear Draft</button>
    `;
    container.appendChild(controls);

    draft.tiers.forEach((tier, index) => {
        const tierRow = document.createElement('div');
        tierRow.className = 'tier-row';
        tierRow.dataset.tierIndex = index;
        tierRow.innerHTML = `
            <div class="tier-header" style="background:${tier.color}">${tier.name}</div>
            <div class="tier-items" data-tier-index="${index}"></div>
            <div class="tier-actions">
                <button class="settings-tier" aria-label="Edit tier" data-tier-index="${index}">
                    <img src="${basePath}assets/icons/settings.png" alt="⚙" onerror="this.outerHTML='⚙'">
                </button>
            </div>
        `;
        const itemsZone = tierRow.querySelector('.tier-items');
        tier.items.forEach(item => itemsZone.appendChild(createTierItemElement(item, basePath)));
        container.appendChild(tierRow);
    });

    const removeZone = document.createElement('div');
    removeZone.className = 'remove-zone';
    removeZone.id = 'remove-zone';
    removeZone.textContent = '🗑 Drop here to remove from tier';
    container.appendChild(removeZone);

    const wrapper = document.getElementById('tierlist-wrapper');
    if (!wrapper) return;
    const existing = document.getElementById(`tierlist-${draftId}`);
    if (existing) existing.replaceWith(container);
    else wrapper.appendChild(container);

    setupTierListeners(draftId);
}

export function createTierItemElement(item, basePath) {
    if (!basePath) basePath = getBasePath();

    const el = document.createElement('div');
    el.className = 'tier-item';
    el.dataset.name = item.name;
    el.dataset.category = item.category;
    el.draggable = true;

    const sprite = document.createElement('img');
    sprite.src = `${basePath}assets/${item.category}/${item.file}`;
    sprite.alt = item.name;
    sprite.className = 'tier-item__sprite';
    sprite.draggable = false;
    el.appendChild(sprite);

    const nameEl = document.createElement('div');
    nameEl.className = 'tier-item__name';
    nameEl.textContent = item.name;
    el.appendChild(nameEl);

    if (item.category !== 'pokemon') return el;

    const mode = state.tierlistMode;
    const detail = getPokeDetail(item.name);

    if (mode === 'simple') {
        return el;
    }

    let passiveImg = resolvePassiveImg(item, detail);
    let uniteImg = resolveUniteImg(item, detail);
    let move1Img = item.move1Img || resolveStandardMoveImg(item.move1, detail);
    let move2Img = item.move2Img || resolveStandardMoveImg(item.move2, detail);

    if (mode === 'moves') {
        if (item.move1) el.appendChild(makeBadge(item.move1, move1Img, basePath, 'badge--left',  'badge--move'));
        if (item.move2) el.appendChild(makeBadge(item.move2, move2Img, basePath, 'badge--right', 'badge--move'));
    } else if (mode === 'passive') {
        if (item.passive) el.appendChild(makeBadge(item.passive, passiveImg, basePath, 'badge--center', 'badge--passive'));
    } else if (mode === 'unite') {
        if (item.unite) el.appendChild(makeBadge(item.unite, uniteImg, basePath, 'badge--center', 'badge--unite'));
    }

    return el;
}

function resolvePassiveImg(item, detail) {
    if (item.passiveImg) return item.passiveImg;
    if (!detail) return null;
    if (detail.passive?.image) return detail.passive.image;
    const m = detail.moves?.find(m => m.name.includes('(Passive)') || m.name.toLowerCase().includes('passive'));
    return m?.image || null;
}

function resolveUniteImg(item, detail) {
    if (item.uniteImg) return item.uniteImg;
    if (!detail) return null;
    const m = detail.moves?.find(m => m.name.includes('(Unite)') || m.name.toLowerCase().includes('unite'));
    return m?.image || null;
}

function resolveStandardMoveImg(moveName, detail) {
    if (!moveName || !detail) return null;
    const m = detail.moves?.find(m => m.name === moveName);
    return m?.image || null;
}

function makeBadge(moveName, moveImg, basePath, posClass, typeClass) {
    const badge = document.createElement('div');
    badge.className = `move-badge ${posClass} ${typeClass}`;
    badge.title = moveName || '';

    if (moveImg) {
        const img = document.createElement('img');
        img.src = moveImg.startsWith('assets/') ? `${basePath}${moveImg}` : moveImg;
        img.alt = moveName || '';
        img.className = 'move-badge__img';
        img.draggable = false;
        img.onerror = () => {
            img.style.display = 'none';
            const fb = document.createElement('span');
            fb.className = 'move-badge__fallback';
            fb.textContent = (moveName || '?').slice(0, 2).toUpperCase();
            badge.appendChild(fb);
        };
        badge.appendChild(img);
    } else {
        const fb = document.createElement('span');
        fb.className = 'move-badge__fallback';
        fb.textContent = (moveName || '?').slice(0, 2).toUpperCase();
        badge.appendChild(fb);
    }

    return badge;
}

function setupTierListeners(draftId) {
    const container = document.getElementById(`tierlist-${draftId}`);
    if (!container) return;

    container.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            state.tierlistMode = btn.dataset.mode;
            loadTierList(draftId);
        });
    });

    container.querySelector('#add-tier-btn')   ?.addEventListener('click', () => addTier(draftId));
    container.querySelector('#clear-draft-btn')?.addEventListener('click', () => clearDraft(draftId));

    container.querySelectorAll('.settings-tier').forEach(btn => {
        btn.addEventListener('click', () => openTierModal(draftId, parseInt(btn.dataset.tierIndex)));
    });

    container.addEventListener('dblclick', e => {
        const item = e.target.closest('.tier-item');
        if (!item || item.dataset.category !== 'pokemon') return;
        const tierIndex = parseInt(item.closest('.tier-row').dataset.tierIndex);
        import('./modals.js').then(m => m.showMoveModal(item.dataset.name, tierIndex, true));
    });
}