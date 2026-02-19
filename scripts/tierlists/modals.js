import state from './state.js';
import { getPokeDetail } from './dataLoader.js';
import { loadTierList } from './tierlist.js';
import { loadGallery } from './gallery.js';

export function showMoveModal(pokemonName, tierIndex, isEdit) {
    const modal = document.getElementById('move-modal');
    const optionsDiv = document.getElementById('move-options');
    if (!modal || !optionsDiv) return;

    const title = modal.querySelector('h3');
    if (title) title.textContent = isEdit
        ? `Edit moves : ${pokemonName}`
        : `Choose moves : ${pokemonName}`;

    let placedItem = null;
    if (isEdit) {
        const draft = state.drafts.find(d => d.id === state.currentDraft);
        for (const t of draft?.tiers || []) {
            const found = t.items.find(i => i.name === pokemonName && i.category === 'pokemon');
            if (found) { placedItem = found; break; }
        }
    }

    const detail = getPokeDetail(pokemonName);
    optionsDiv.innerHTML = '';

    if (!detail || !detail.moves?.length) {
        optionsDiv.innerHTML = '<p class="modal-note">Aucune donnée de move disponible pour ce Pokémon.</p>';
    } else {
        buildMoveModalBody(optionsDiv, detail, placedItem, state.tierlistMode);
    }

    modal.dataset.pokemon = pokemonName;
    modal.dataset.tierIndex = tierIndex;
    modal.dataset.isEdit = isEdit;
    modal.style.display = 'flex';
}

function buildMoveModalBody(container, detail, placedItem, mode) {
    const moves = detail.moves || [];

    const autoAttack = moves.find(m => m.name === 'Auto-attack');

    const passiveObj = detail.passive
        ? { name: detail.passive.name, image: detail.passive.image }
        : moves.find(m => m.name.includes('(Passive)') || m.name.toLowerCase().includes('passive'));

    const uniteObj = moves.find(m =>
        m.name.includes('(Unite)') || m.name.toLowerCase().includes('unite')
    );

    const standards = moves.filter(m =>
        m !== autoAttack
        && m.name !== passiveObj?.name
        && m !== uniteObj
    );

    const half  = Math.ceil(standards.length / 2);
    const slot1 = standards.slice(0, half);
    const slot2 = standards.slice(half);

    if (mode === 'simple') {
        container.innerHTML = '<p class="modal-note">En mode <strong>Simple</strong>, les moves ne sont pas affichés. Changez de mode pour les configurer.</p>';
        return;
    }

    if (mode === 'moves') {
        container.appendChild(buildSlotSection('Move Slot 1', slot1, 'move1', placedItem?.move1 || ''));
        container.appendChild(buildSlotSection('Move Slot 2', slot2, 'move2', placedItem?.move2 || ''));
    } else if (mode === 'passive') {
        container.appendChild(buildSingleSection('Passif', passiveObj, 'passive', placedItem?.passive || ''));
    } else if (mode === 'unite') {
        container.appendChild(buildSingleSection('Unite Move', uniteObj, 'unite', placedItem?.unite || ''));
    }
}

function buildSlotSection(label, moves, inputName, currentValue) {
    const section = document.createElement('div');
    section.className = 'move-section';

    const h = document.createElement('h3');
    h.textContent = label;
    section.appendChild(h);

    if (!moves.length) {
        section.innerHTML += '<p class="modal-note">Aucun move pour ce slot.</p>';
        return section;
    }

    moves.forEach((mv, idx) => {
        const id = `${inputName}-${idx}`;
        const checked = currentValue ? currentValue === mv.name : idx === 0;

        const wrapper = document.createElement('label');
        wrapper.className = `move-option ${checked ? 'selected' : ''}`;
        wrapper.htmlFor = id;

        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.id = id;
        radio.name = inputName;
        radio.value = mv.name;
        if (mv.image) radio.dataset.image = mv.image;
        radio.checked = checked;

        radio.addEventListener('change', () => {
            section.querySelectorAll('.move-option').forEach(l => l.classList.remove('selected'));
            wrapper.classList.add('selected');
        });

        if (mv.image) {
            const moveImg = document.createElement('img');
            moveImg.src = mv.image.startsWith('assets/') ? mv.image : mv.image;
            moveImg.alt = mv.name;
            moveImg.className = 'move-option__img';
            moveImg.onerror = () => { moveImg.style.display = 'none'; };
            wrapper.appendChild(moveImg);
        }

        const span = document.createElement('span');
        span.className = 'move-name';
        span.textContent = mv.name;

        wrapper.appendChild(radio);
        wrapper.appendChild(span);
        section.appendChild(wrapper);
    });
    return section;
}

function buildSingleSection(label, move, inputName, currentValue) {
    const section = document.createElement('div');
    section.className = 'move-section';

    const h = document.createElement('h3');
    h.textContent = label;
    section.appendChild(h);

    if (!move) {
        section.innerHTML += `<p class="modal-note">Aucune donnée de ${label.toLowerCase()} disponible.</p>`;
        const hidden = document.createElement('input');
        hidden.type = 'hidden';
        hidden.name = inputName;
        hidden.value = '';
        section.appendChild(hidden);
        return section;
    }

    const wrapper = document.createElement('label');
    wrapper.className = 'move-option selected';

    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = inputName;
    radio.value = move.name;
    if (move.image) radio.dataset.image = move.image;
    radio.checked = true;

    if (move.image) {
        const moveImg = document.createElement('img');
        moveImg.src = move.image;
        moveImg.alt = move.name;
        moveImg.className = 'move-option__img';
        moveImg.onerror = () => { moveImg.style.display = 'none'; };
        wrapper.appendChild(moveImg);
    }

    const span = document.createElement('span');
    span.className = 'move-name';
    span.textContent = move.name;

    wrapper.appendChild(radio);
    wrapper.appendChild(span);
    section.appendChild(wrapper);
    return section;
}

export function hideMoveModal() {
    const modal = document.getElementById('move-modal');
    if (modal) modal.style.display = 'none';
    state.pendingAdd = null;
}

export function onMoveSave() {
    const modal = document.getElementById('move-modal');
    if (!modal) return;

    const pokemonName = modal.dataset.pokemon;
    const tierIndex = parseInt(modal.dataset.tierIndex);
    const isEdit = modal.dataset.isEdit === 'true';

    const optionsDiv = document.getElementById('move-options');

    const getField = (name) => {
        const el = optionsDiv?.querySelector(`input[name="${name}"]:checked`);
        return { val: el?.value || '', img: el?.dataset.image || '' };
    };

    const m1 = getField('move1');
    const m2 = getField('move2');
    const pa = getField('passive');
    const un = getField('unite');

    const draft = state.drafts.find(d => d.id === state.currentDraft);

    if (isEdit) {
        for (const tier of draft.tiers) {
            const it = tier.items.find(i => i.name === pokemonName && i.category === 'pokemon');
            if (it) {
                if (m1.val)  { it.move1 = m1.val;  it.move1Img = m1.img; }
                if (m2.val)  { it.move2 = m2.val;  it.move2Img = m2.img; }
                if (pa.val)  { it.passive = pa.val;  it.passiveImg = pa.img; }
                if (un.val)  { it.unite = un.val;  it.uniteImg = un.img; }
                break;
            }
        }
    } else {
        if (!state.pendingAdd || state.pendingAdd.name !== pokemonName) { hideMoveModal(); return; }

        const count = state.pokemonUsage.get(pokemonName) || 0;
        if (count >= 4) { hideMoveModal(); return; }

        state.pokemonUsage.set(pokemonName, count + 1);
        const file = state.pokemonData.find(p => p.name === pokemonName)?.file;
        draft.tiers[tierIndex].items.push({
            name: pokemonName, category: 'pokemon', file,
            move1: m1.val, move1Img: m1.img,
            move2: m2.val, move2Img: m2.img,
            passive: pa.val, passiveImg: pa.img,
            unite: un.val,   uniteImg:   un.img,
        });
        state.pendingAdd = null;
    }

    hideMoveModal();
    loadTierList(state.currentDraft);
    loadGallery(state.currentCategory);
}

export function openTierModal(draftId, tierIndex) {
    const draft = state.drafts.find(d => d.id === draftId);
    if (!draft) return;

    const tier = draft.tiers[tierIndex];
    const modal = document.getElementById('tier-modal');
    if (!modal) return;

    document.getElementById('tier-name').value  = tier.name;
    document.getElementById('tier-color').value = tier.color || '#4a90e2';
    modal.dataset.draftId = draftId;
    modal.dataset.tierIndex = tierIndex;
    modal.style.display = 'flex';
}

export function hideTierModal() {
    const modal = document.getElementById('tier-modal');
    if (modal) modal.style.display = 'none';
}

export function onTierSave() {
    const modal = document.getElementById('tier-modal');
    if (!modal) return;
    const draftId = parseInt(modal.dataset.draftId);
    const tierIndex = parseInt(modal.dataset.tierIndex);
    const draft = state.drafts.find(d => d.id === draftId);
    if (!draft) return;

    draft.tiers[tierIndex].name  = document.getElementById('tier-name').value.trim() || `Tier ${tierIndex + 1}`;
    draft.tiers[tierIndex].color = document.getElementById('tier-color').value || draft.tiers[tierIndex].color;
    hideTierModal();
    loadTierList(draftId);
}

export function onTierDelete() {
    const modal = document.getElementById('tier-modal');
    if (!modal) return;
    import('./actions.js').then(m => m.deleteTier(parseInt(modal.dataset.draftId), parseInt(modal.dataset.tierIndex)));
    hideTierModal();
}