import state from './state.js';

export function getBasePath() {
    return window.location.pathname.includes('PokemonUniteDraft') ? '/PokemonUniteDraft/' : './';
}

export async function loadData() {
    try {
        const [pResp, iResp, bResp, dResp] = await Promise.all([
            fetch('data/pokemons.json'),
            fetch('data/items.json'),
            fetch('data/battle_items.json'),
            fetch('data/poke_data.json'),
        ]);
        if (!pResp.ok || !iResp.ok || !bResp.ok || !dResp.ok)
            throw new Error('Failed to fetch one or more data files');

        state.pokemonData    = await pResp.json();
        state.itemData       = await iResp.json();
        state.battleItemData = await bResp.json();

        const pokeDetailArray = await dResp.json();
        state.pokeDetailMap.clear();
        pokeDetailArray.forEach(p => {
            if (p.pokemonId) state.pokeDetailMap.set(p.pokemonId, p);
        });

    } catch (err) {
        console.error('Error loading JSON data:', err);
        const g = document.getElementById('gallery');
        if (g) g.innerHTML = '<p class="gallery-empty">Erreur : impossible de charger les données.</p>';
    }
}

export function getPokeDetail(pokemonName) {
    const entry = state.pokemonData.find(d => d.name === pokemonName);
    const id = entry?.pokemonId || pokemonName.toLowerCase().replace(/[^a-z0-9]/g, '');
    return state.pokeDetailMap.get(id) || null;
}
