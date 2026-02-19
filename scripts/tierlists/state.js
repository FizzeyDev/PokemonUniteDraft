const state = {
    drafts: [{
        id: 1,
        tiers: [
            { name: 'S', color: '#e74c3c', items: [] },
            { name: 'A', color: '#3498db', items: [] },
            { name: 'B', color: '#2ecc71', items: [] },
            { name: 'C', color: '#f1c40f', items: [] },
            { name: 'D', color: '#9b59b6', items: [] }
        ]
    }],
    currentDraft: 1,
    currentCategory: 'pokemon',
    pokemonUsage: new Map(),
    itemUsage: new Map(),
    pokemonData: [],
    itemData: [],
    battleItemData: [],
    pokeDetailMap: new Map(),
    pendingAdd: null,

    tierlistMode: 'simple',

    gallerySearchQuery: '',
};

export default state;