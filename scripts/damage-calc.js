const levelSliderAttacker = document.getElementById("levelSliderAttacker");
const levelSliderDefender = document.getElementById("levelSliderDefender");
const levelValueAttacker = document.getElementById("levelValueAttacker");
const levelValueDefender = document.getElementById("levelValueDefender");
const pokemonGridAttacker = document.getElementById("pokemonGridAttacker");
const pokemonGridDefender = document.getElementById("pokemonGridDefender");
const movesGrid = document.getElementById("movesGrid");

const specialHeldItems = {
  "mega-charizard-x": "Charizardite X",
  "mega-charizard-y": "Charizardite Y",
  "mega-lucario": "Lucarionite",
  "mega-gyarados": "Gyaradosite",
  "mewtwo_x": "Mewtwonite X",
  "mewtwo_y": "Mewtwonite Y",
  "zacian": "Rusted Sword"
};

let allPokemon = [];
let allItems = [];
let currentAttacker = null;
let currentDefender = null;
let attackerLevel = 15;
let defenderLevel = 15;

let attackerItems = [null, null, null];
let defenderItems = [null, null, null];

let attackerItemStacks = [0, 0, 0];
let defenderItemStacks = [0, 0, 0];

let attackerItemActivated = [false, false, false];
let defenderItemActivated = [false, false, false];

let isEditingHP = {
  attacker: false,
  defender: false
};

let attackerHPPercent = 100;
let defenderHPPercent = 100;

let attackerPassiveStacks = 0;
let attackerStance = 'shield';
let defenderStance = 'shield';
let attackerFlashFireActive = false;
let defenderFlashFireActive = false;

const substituteDoll = {
  pokemonId: "substitute-doll",
  role: "dummy",
  style: "physical",
  image: "assets/pokemon/substitute.png",
  displayName: "Substitute Doll",
  category: 'other',
  stats: Array.from({length: 15}, (_, i) => ({
    level: i + 1,
    hp: 100000,
    atk: 0,
    def: 0,
    sp_atk: 0,
    sp_def: 0
  }))
};

const customDoll = {
  pokemonId: "custom-doll",
  role: "dummy",
  style: "physical",
  image: "assets/pokemon/clefDoll.png",
  displayName: "Custom Doll",
  category: 'other',
  customStats: {
    hp: 10000,
    def: 100,
    sp_def: 100
  },
  stats: Array.from({length: 15}, (_, i) => ({
    level: i + 1,
    hp: 10000,
    atk: 0,
    def: 100,
    sp_atk: 0,
    sp_def: 100,
    crit: 0
  }))
};

const mobIds = [
  'regice', 'registeel', 'regirock', 'regieleki', 'regidrago',
  'kyogre', 'groudon', 'rayquaza'
];

const stackableItems = [
  "Attack Weight", "Sp. Atk Specs", "Aeos Cookie",
  "Accel Bracer", "Drive Lens", "Weakness Policy"
];

function getPokemonCategory(id) {
  if (id === 'substitute-doll' || id === 'custom-doll') return 'other';
  if (mobIds.includes(id)) return 'mob';
  return 'playable';
}

async function loadData() {
  try {
    const [pokeRes, itemRes, itemDataRes, monsRes] = await Promise.all([
      fetch('data/poke_data.json'),
      fetch('data/items.json'),
      fetch('data/items_data.json'),
      fetch('data/mons.json')
    ]);

    const pokeData = await pokeRes.json();
    const itemList = await itemRes.json();
    const itemStats = await itemDataRes.json();
    const monsData = await monsRes.json();

    const monsMap = {};
    monsData.forEach(mon => {
      let key = mon.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

      if (mon.name.startsWith("Mega-")) {
        key = "m" + key.replace("mega-", "");
      }

      if (mon.name === "Ho-Oh") key = "hooh";
      if (mon.name === "Mr. Mime") key = "mr_mime";
      if (mon.name === "Mewtwo X") key = "mewtwo_x";
      if (mon.name === "Mewtwo Y") key = "mewtwo_y";
      if (mon.name.startsWith("Mega-Lucario")) key = "mega-lucario";
      if (mon.name.startsWith("Mega-Charizard X")) key = "mega-charizard-x";
      if (mon.name.startsWith("Mega-Charizard Y")) key = "mega-charizard-y";
      if (mon.name.startsWith("Mega-Gyarados")) key = "mega-gyarados";

      monsMap[key] = {
        image: `assets/pokemon/${mon.file}`,
        displayName: mon.name
      };
    });

    allPokemon = pokeData.map(poke => {
      const monInfo = monsMap[poke.pokemonId] || {
        image: 'assets/pokemon/missing.png',
        displayName: poke.pokemonId.replace(/-/g, ' ').toUpperCase()
      };
      return {
        ...poke,
        image: monInfo.image,
        displayName: monInfo.displayName,
        category: getPokemonCategory(poke.pokemonId)
      };
    });

    allPokemon.push(substituteDoll);
    allPokemon.push(customDoll);

    allPokemon.sort((a, b) => a.pokemonId.localeCompare(b.pokemonId));

    allItems = itemList.map(base => {
      const stats = itemStats.find(i => i.name === base.name) || {};
      return { ...base, ...stats, image: `assets/items/${base.file}` };
    });

    initUI();
  } catch (err) {
    console.error("Erreur chargement données :", err);
    movesGrid.innerHTML = `<div class="error">Erreur chargement données (voir console)</div>`;
  }
}

function setupSearch() {
  const searchAttacker = document.getElementById('searchAttacker');
  const searchDefender = document.getElementById('searchDefender');

  const filterGrid = (input, grid) => {
    const term = input.value.toLowerCase().trim();

    grid.querySelectorAll('.pokemon-grid-item').forEach(item => {
      const name = item.querySelector('span').textContent.toLowerCase();
      const matches = name.includes(term);
      item.style.display = matches || term === '' ? 'block' : 'none';
    });
  };

  searchAttacker.addEventListener('input', () => filterGrid(searchAttacker, pokemonGridAttacker));
  searchDefender.addEventListener('input', () => filterGrid(searchDefender, pokemonGridDefender));
}

function initUI() {
  populateGrids();
  populateItemGrid();
  setupItemSelection();
  setupItemSearch();
  setupSearch();
  selectAttacker('absol');
  selectDefender('substitute-doll');
  updateDamages();
}

function selectAttacker(id) {
  currentAttacker = allPokemon.find(p => p.pokemonId === id);
  if (currentAttacker) {
    document.getElementById('attackerName').textContent = currentAttacker.displayName;
    document.getElementById('attackerImage').innerHTML = `<img src="${currentAttacker.image}" alt="${currentAttacker.displayName}">`;
    highlightGridSelection(pokemonGridAttacker, id);
  }

  resetItems('attacker');
  autoEquipSpecialItem('attacker', id);

  attackerHPPercent = 100;
  document.getElementById('hpSliderAttacker').value = 100;

  attackerPassiveStacks = 0;
  attackerStance = 'shield';
  attackerFlashFireActive = false;

  updateDamages();
}

function selectDefender(id) {
  currentDefender = allPokemon.find(p => p.pokemonId === id);
  if (currentDefender) {
    document.getElementById('defenderName').textContent = currentDefender.displayName;
    document.getElementById('defenderImage').innerHTML = `<img src="${currentDefender.image}" alt="${currentDefender.displayName}">`;
    highlightGridSelection(pokemonGridDefender, id);
  }

  resetItems('defender');
  autoEquipSpecialItem('defender', id);

  defenderHPPercent = 100;
  document.getElementById('hpSliderDefender').value = 100;

  defenderStance = 'shield';
  defenderFlashFireActive = false;

  if (id === 'substitute-doll') {
    disableItemSlots('defender');
  } else {
    enableItemSlots('defender');
  }

  const isCustom = id === 'custom-doll';
  document.getElementById('defenderDefNormal').style.display = isCustom ? 'none' : 'block';
  document.getElementById('defenderSpDefNormal').style.display = isCustom ? 'none' : 'block';

  const customRows = document.querySelectorAll('.custom-stat');
  customRows.forEach(row => row.style.display = isCustom ? 'block' : 'none');

  if (isCustom && currentDefender.customStats) {
    document.getElementById('defenderMaxHP').textContent = currentDefender.customStats.hp.toLocaleString();
    document.getElementById('defenderDefCustom').textContent = currentDefender.customStats.def.toLocaleString();
    document.getElementById('defenderSpDefCustom').textContent = currentDefender.customStats.sp_def.toLocaleString();
  }

  updateDamages();
}

function disableItemSlots(side) {
  const grid = side === 'attacker' ? 'Attacker' : 'Defender';
  const cards = document.querySelectorAll(`#itemsEquipped${grid} .item-equipped-card`);

  cards.forEach(card => {
    card.style.opacity = '0.5';
    card.style.pointerEvents = 'none';
    card.title = "Les items sont désactivés sur la Substitute Doll";
  });
}

function enableItemSlots(side) {
  const grid = side === 'attacker' ? 'Attacker' : 'Defender';
  const cards = document.querySelectorAll(`#itemsEquipped${grid} .item-equipped-card`);

  cards.forEach(card => {
    card.style.opacity = '';
    card.style.pointerEvents = '';
    card.title = '';
  });
}

function autoEquipSpecialItem(side, pokemonId) {
  const specialItemName = specialHeldItems[pokemonId];
  if (!specialItemName) return;

  const item = allItems.find(i => i.name === specialItemName);
  if (!item) return;

  const itemsArray = side === 'attacker' ? attackerItems : defenderItems;
  const stacksArray = side === 'attacker' ? attackerItemStacks : defenderItemStacks;
  const activatedArray = side === 'attacker' ? attackerItemActivated : defenderItemActivated;

  itemsArray[0] = item;
  stacksArray[0] = 0;
  activatedArray[0] = false;

  updateItemCard(side, 0, item);

  const card = document.querySelector(`#itemsEquipped${side.charAt(0).toUpperCase() + side.slice(1)} [data-slot="0"]`);
  if (card) {
    card.style.opacity = "0.7";
    card.style.pointerEvents = "none";
    card.title = "Item obligatoire pour ce Pokémon";
  }
}

function populateGrids() {
  [pokemonGridAttacker, pokemonGridDefender].forEach((grid, i) => {
    const isAttacker = i === 0;
    const side = isAttacker ? 'attacker' : 'defender';
    grid.innerHTML = "";

    allPokemon.forEach(poke => {
      if (isAttacker && poke.pokemonId === "substitute-doll") return;

      const div = document.createElement("div");
      div.className = "pokemon-grid-item";
      div.dataset.category = poke.category || 'playable';
      div.onclick = () => isAttacker ? selectAttacker(poke.pokemonId) : selectDefender(poke.pokemonId);
      div.innerHTML = `
        <img src="${poke.image}" alt="${poke.pokemonId}" onerror="this.src='assets/pokemon/missing.png'">
        <span>${poke.displayName}</span>
      `;
      grid.appendChild(div);
    });

    setupCategoryTabs(side);
    filterByCategory(side, 'playable');
  });
}

function highlightGridSelection(grid, id) {
  grid.querySelectorAll('.pokemon-grid-item').forEach(item => {
    const isSelected = item.querySelector('img').alt === id;
    item.classList.toggle('selected', isSelected);
  });
}

function setupCategoryTabs(side) {
  const tabsContainer = document.querySelector(`.category-tabs.${side}-tabs`);
  if (!tabsContainer) return;

  tabsContainer.querySelectorAll('.tab-button').forEach(btn => {
    btn.addEventListener('click', () => {
      tabsContainer.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const category = btn.dataset.category;
      filterByCategory(side, category);
    });
  });
}

function filterByCategory(side, category) {
  const grid = side === 'attacker' ? pokemonGridAttacker : pokemonGridDefender;

  grid.querySelectorAll('.pokemon-grid-item').forEach(item => {
    const itemCat = item.dataset.category;
    const shouldShow = (category === 'all' || itemCat === category);

    if (shouldShow) {
      item.style.display = 'block';
      delete item.dataset.hiddenBySearch;
    } else {
      item.style.display = 'none';
      item.dataset.hiddenBySearch = 'true';
    }
  });

  const outInput = document.getElementById(`search${side.charAt(0).toUpperCase() + side.slice(1)}`);
  if (outInput && outInput.value.trim() !== '') {
    outInput.dispatchEvent(new Event('input'));
  }
}

function populateItemGrid() {
  const grid = document.getElementById("itemGrid");
  if (!grid) return;
  grid.innerHTML = "";

  const excludedItems = Object.values(specialHeldItems);

  allItems.forEach(item => {
    if (excludedItems.includes(item.name)) return;

    const div = document.createElement("div");
    div.className = "item-grid-item";
    div.innerHTML = `
      <img src="${item.image}" alt="${item.name}" onerror="this.src='assets/items/missing.png'">
      <span>${item.display_name || item.name}</span>
    `;
    div.onclick = () => selectItemForSlot(item);
    grid.appendChild(div);
  });
}

function setupItemSearch() {
  const search = document.getElementById('itemSearch');
  if (!search) return;

  search.addEventListener('input', () => {
    const term = search.value.toLowerCase();
    document.querySelectorAll('#itemGrid .item-grid-item').forEach(el => {
      const name = (el.querySelector('span')?.textContent || '').toLowerCase();
      el.style.display = name.includes(term) ? 'block' : 'none';
    });
  });
}

let currentSlotTarget = null;

function setupItemSelection() {
  document.querySelectorAll('#itemsEquippedAttacker .item-equipped-card, #itemsEquippedDefender .item-equipped-card').forEach(card => {
    card.onclick = (e) => {
      if (e.target.closest('.item-equipped-stacks') || e.target.closest('.item-equipped-toggle')) return;
      const side = card.closest('#itemsEquippedAttacker') ? 'attacker' : 'defender';
      openItemSelector(side, parseInt(card.dataset.slot));
    };
  });

  const closeBtn = document.querySelector('.close-modal');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      document.getElementById('itemSelectorModal').style.display = 'none';
    });
  }
}

function openItemSelector(side, slot) {
  currentSlotTarget = { side, slot };
  document.getElementById('itemSelectorModal').style.display = 'flex';
}

function updateItemCard(side, slot, item = null) {
  const grid = side === 'attacker' ? document.getElementById('itemsEquippedAttacker') : document.getElementById('itemsEquippedDefender');
  const card = grid.querySelector(`[data-slot="${slot}"]`);
  const icon = card.querySelector('.item-equipped-icon img');
  const nameEl = card.querySelector('.item-equipped-name');
  const statsEl = card.querySelector('.item-equipped-stats');
  const stacksEl = card.querySelector('.item-equipped-stacks');
  const toggleEl = card.querySelector('.item-equipped-toggle');
  const valueSpan = stacksEl?.querySelector('.stack-value');
  const maxSpan = stacksEl?.querySelector('.stack-max');

  if (toggleEl) toggleEl.remove();

  const specsIndicator = card.querySelector('.choice-specs-indicator');
  if (specsIndicator) specsIndicator.remove();

  if (!item) {
    icon.src = 'assets/items/none.png';
    nameEl.textContent = 'Empty';
    statsEl.innerHTML = '';
    if (stacksEl) stacksEl.style.display = 'none';
    card.classList.remove('has-item');
    return;
  }

  icon.src = item.image || 'assets/items/none.png';
  nameEl.textContent = item.display_name || item.name;
  card.classList.add('has-item');

  let statsText = '';
  if (item.bonus1) statsText += `${item.bonus1}<br>`;
  if (item.bonus2) statsText += `${item.bonus2}<br>`;

  if (stackableItems.includes(item.name) && item.level20) {
    const perStack = parseFloat(item.level20);
    const maxStacks = item.name === "Weakness Policy" ? 4 : (item.name.includes("Accel") || item.name.includes("Drive") ? 20 : 6);
    const totalBonus = (perStack * maxStacks).toFixed(0);
    const isPercent = item.stack_type !== "flat";
    const statName = item.name === "Attack Weight" ? "Attack" :
                     item.name === "Sp. Atk Specs" ? "Sp. Atk" :
                     item.name === "Drive Lens" ? "Sp. Atk" :
                     item.name === "Accel Bracer" ? "Attack" :
                     item.name === "Aeos Cookie" ? "HP" :
                     item.description3 || '';

    statsText += `<br><span style="color:var(--green);font-weight:bold;">+${totalBonus}${isPercent ? '%' : ''} ${statName} (max)</span>`;
  } else if (item.name === "Muscle Band" && item.level20) {
    statsText += `<br><span style="color:var(--green);font-weight:bold;">+${item.level20} remaining HP on AA (max)</span>`;
  } else if (item.name === "Scope Lens" && item.level20) {
    statsText += `<br><span style="color:var(--green);font-weight:bold;">Extra crit AA: +${item.level20} Atk (max)</span>`;
  } else if (item.name === "Razor Claw" && item.level20) {
    statsText += `<br><span style="color:var(--green);font-weight:bold;">Next AA after move: +${item.level20}+20 Atk (max)</span>`;
  } else if (item.name === "Charging Charm" && item.level20) {
    statsText += `<br><span style="color:var(--green);font-weight:bold;">Proc (full energy): +40 + ${item.level20} Atk dmg</span>`;
  }

  statsEl.innerHTML = statsText || '<span style="color:#666">No bonus</span>';

  if (stackableItems.includes(item.name)) {
    const maxStacks = item.name === "Weakness Policy" ? 4 : (item.name.includes("Accel") || item.name.includes("Drive") ? 20 : 6);
    stacksEl.style.display = 'flex';
    maxSpan.textContent = `/${maxStacks}`;
    const stacksArray = side === 'attacker' ? attackerItemStacks : defenderItemStacks;
    valueSpan.textContent = stacksArray[slot];
  } else {
    stacksEl.style.display = 'none';
  }

  if (item.activable && item.name !== "Choice Specs") {
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'item-equipped-toggle';
    const activatedArray = side === 'attacker' ? attackerItemActivated : defenderItemActivated;
    toggleBtn.classList.toggle('active', activatedArray[slot]);
    toggleBtn.textContent = activatedArray[slot] ? 'Désactiver' : 'Activer';
    toggleBtn.onclick = (e) => {
      e.stopPropagation();
      activatedArray[slot] = !activatedArray[slot];
      toggleBtn.classList.toggle('active', activatedArray[slot]);
      toggleBtn.textContent = activatedArray[slot] ? 'Désactiver' : 'Activer';
      updateDamages();
    };
    card.appendChild(toggleBtn);
  }

  if (item.name === "Choice Specs") {
    const indicator = document.createElement('div');
    indicator.className = 'choice-specs-indicator';
    indicator.style.cssText = 'margin-top:8px; font-size:0.85rem; color:var(--green); font-weight:bold;';
    indicator.textContent = 'Effet toujours actif';
    card.appendChild(indicator);
  }

  attachStackButtons(side, slot);
}

function selectItemForSlot(item) {
  if (!currentSlotTarget) return;

  const { side, slot } = currentSlotTarget;
  const itemsArray = side === 'attacker' ? attackerItems : defenderItems;

  const alreadyEquipped = itemsArray.some((equippedItem, index) => {
    return index !== slot && equippedItem && equippedItem.name === item.name;
  });

  if (alreadyEquipped) {
    alert(`You can't equip ${item.display_name || item.name} more than one time on the same Pokemon !`);

    document.getElementById('itemSelectorModal').style.display = 'none';
    return;
  }

  const stacksArray = side === 'attacker' ? attackerItemStacks : defenderItemStacks;
  const activatedArray = side === 'attacker' ? attackerItemActivated : defenderItemActivated;

  itemsArray[slot] = item;
  stacksArray[slot] = 0;
  activatedArray[slot] = false;

  updateItemCard(side, slot, item);

  document.getElementById('itemSelectorModal').style.display = 'none';
  updateDamages();
}

function attachStackButtons(side, slot) {
  const grid = side === 'attacker' ? document.getElementById('itemsEquippedAttacker') : document.getElementById('itemsEquippedDefender');
  const card = grid.querySelector(`[data-slot="${slot}"]`);
  const minus = card.querySelector('.stack-btn.minus');
  const plus = card.querySelector('.stack-btn.plus');
  const valueSpan = card.querySelector('.stack-value');

  const item = (side === 'attacker' ? attackerItems : defenderItems)[slot];
  if (!item || !stackableItems.includes(item.name)) return;

  const max = parseInt(card.querySelector('.stack-max').textContent.slice(1));
  const stacksArray = side === 'attacker' ? attackerItemStacks : defenderItemStacks;

  minus.onclick = (e) => {
    e.stopPropagation();
    if (stacksArray[slot] > 0) {
      stacksArray[slot]--;
      valueSpan.textContent = stacksArray[slot];
      updateDamages();
    }
  };

  plus.onclick = (e) => {
    e.stopPropagation();
    if (stacksArray[slot] < max) {
      stacksArray[slot]++;
      valueSpan.textContent = stacksArray[slot];
      updateDamages();
    }
  };
}

function resetItems(side) {
  const itemsArray = side === 'attacker' ? attackerItems : defenderItems;
  const stacksArray = side === 'attacker' ? attackerItemStacks : defenderItemStacks;
  const activatedArray = side === 'attacker' ? attackerItemActivated : defenderItemActivated;

  itemsArray.fill(null);
  stacksArray.fill(0);
  activatedArray.fill(false);

  for (let i = 0; i < 3; i++) {
    updateItemCard(side, i);

    const card = document.querySelector(`#itemsEquipped${side.charAt(0).toUpperCase() + side.slice(1)} [data-slot="${i}"]`);
    if (card) {
      card.style.opacity = "";
      card.style.pointerEvents = "";
      card.title = "";
    }
  }
  updateDamages();
}

function getModifiedStats(pokemon, level, items, stacksArray, activatedArray) {
  let baseHp = 0;
  let baseAtk = 0;
  let baseSpAtk = 0;
  let baseDef = 0;
  let baseSpDef = 0;

  if (pokemon?.pokemonId === "custom-doll" && pokemon.customStats) {
    baseHp = pokemon.customStats.hp;
    baseDef = pokemon.customStats.def;
    baseSpDef = pokemon.customStats.sp_def;
  } else {
    const baseStats = pokemon?.stats?.[level - 1] || {};
    baseHp = baseStats.hp || 0;
    baseAtk = baseStats.atk || 0;
    baseSpAtk = baseStats.sp_atk || 0;
    baseDef = baseStats.def || 0;
    baseSpDef = baseStats.sp_def || 0;
  }

  let hp = baseHp;
  let atk = baseAtk;
  let sp_atk = baseSpAtk;
  let def = baseDef;
  let sp_def = baseSpDef;

  items.forEach((item, index) => {
    if (!item) return;

    if (item.name === "Wise Glasses" && item.level20) {
      const percent = parseFloat(item.level20.replace('%', '').trim()) / 100;
      sp_atk += Math.floor(baseSpAtk * percent);
    }

    if (stackableItems.includes(item.name) && item.stack_type === "percent" && item.level20) {
      const stacks = stacksArray[index];
      const valuePerStack = parseFloat(item.level20);
      const totalPercent = valuePerStack * stacks / 100;

      if (item.name === "Accel Bracer" || item.name === "Weakness Policy") {
        atk += Math.floor(baseAtk * totalPercent);
      } else if (item.name === "Drive Lens") {
        sp_atk += Math.floor(baseSpAtk * totalPercent);
      }
    }
  });

  items.forEach(item => {
    if (!item || !item.stats) return;
    item.stats.forEach(stat => {
      if (stat.label === "HP") hp += stat.value;
      else if (stat.label === "Attack") atk += stat.value;
      else if (stat.label === "Sp. Attack") sp_atk += stat.value;
      else if (stat.label === "Defense") def += stat.value;
      else if (stat.label === "Sp. Defense") sp_def += stat.value;
    });
  });

  items.forEach((item, index) => {
    if (!item || !item.level20 || item.stack_type !== "flat") return;

    const stacks = stacksArray[index];
    const valuePerStack = parseFloat(item.level20);
    const bonus = valuePerStack * stacks;

    if (item.name === "Attack Weight") atk += Math.floor(bonus);
    else if (item.name === "Sp. Atk Specs") sp_atk += Math.floor(bonus);
    else if (item.name === "Aeos Cookie") hp += Math.floor(bonus);
  });

  items.forEach((item, index) => {
    if (!item || !item.activable || !activatedArray[index] || !item.activation_effect) return;
    item.activation_effect.stats.forEach(stat => {
      const value = stat.value;
      if (!stat.percent) {
        if (stat.label.includes("HP") || stat.label.includes("Shield")) hp += value;
        else if (stat.label.includes("Attack")) atk += value;
      } else {
        const base = stat.label.includes("HP") ? baseHp :
                     stat.label.includes("Attack") && !stat.label.includes("Sp") ? baseAtk :
                     stat.label.includes("Sp. Attack") ? baseSpAtk :
                     stat.label.includes("Defense") ? baseDef :
                     baseSpDef;
        const bonus = Math.floor(base * (value / 100));
        if (stat.label.toLowerCase().includes("hp") || stat.label.toLowerCase().includes("shield")) hp += bonus;
        else if (stat.label.toLowerCase().includes("attack") && !stat.label.toLowerCase().includes("sp")) atk += bonus;
        else if (stat.label.toLowerCase().includes("sp.") && stat.label.toLowerCase().includes("attack")) sp_atk += bonus;
        else if (stat.label.toLowerCase().includes("defense")) def += bonus;
        else if (stat.label.toLowerCase().includes("sp.") && stat.label.toLowerCase().includes("defense")) sp_def += bonus;
      }
    });
  });

  if (pokemon?.pokemonId === "aegislash") {
    const levelMinusOne = level - 1;
    const stance = (pokemon === currentAttacker) ? attackerStance : defenderStance;

    if (stance === 'sword') {
      atk += 15 * levelMinusOne + 40;
    } else {
      def += 25 * levelMinusOne + 80;
      sp_def += 20 * levelMinusOne + 40;
    }
  }

  return {
    hp: Math.floor(hp),
    atk: Math.floor(atk),
    sp_atk: Math.floor(sp_atk),
    def: Math.floor(def),
    sp_def: Math.floor(sp_def)
  };
}

function calculateDamage(dmg, atkStat, defStat, level, crit = false, pokemonId = null, extraCritMult = 1.0, globalDamageMult = 1.0) {
  const atkScaling = Math.floor(atkStat * (dmg.multiplier / 100));
  const levelScaling = (level - 1) * dmg.levelCoef;
  let baseDamage = dmg.constant + atkScaling + levelScaling;

  let effectiveDef = defStat;

  if (currentDefender?.pokemonId === "armarouge" && defenderFlashFireActive) {
    effectiveDef = Math.floor(effectiveDef / (1 - 0.20));
  }

  const defReduction = 100 / (100 + effectiveDef * 0.165);
  let finalDamage = Math.floor(baseDamage * defReduction);

  if (crit) {
    let baseCritMult = 2.0;
    if (pokemonId === "azumarill") baseCritMult = 1.7;
    else if (pokemonId === "inteleon") baseCritMult = 2.5;

    finalDamage = Math.floor(finalDamage * baseCritMult * extraCritMult);
  }

  finalDamage = Math.floor(finalDamage * globalDamageMult);

  return Math.max(1, finalDamage);
}

function getAutoAttackResults(atkStats, defStats, currentDefHP, globalDamageMult = 1.0) {
  const results = {
    normal: 0,
    crit: 0,
    muscleExtra: 0,
    muscleTotalNormal: 0,
    muscleTotalCrit: 0,
    scopeExtra: 0,
    totalCritWithScope: 0,
    scopePercent: 0,
    hasMuscle: false,
    hasScope: false
  };

  results.normal = calculateDamage(
    { constant: 0, multiplier: 100, levelCoef: 0 },
    atkStats.atk,
    defStats.def,
    attackerLevel,
    false,
    currentAttacker.pokemonId,
    1.0,
    globalDamageMult
  );

  let scopeCritBonus = 1.0;
  attackerItems.forEach(item => {
    if (item && item.name === "Scope Lens" && item.stats) {
      const critStat = item.stats.find(s => s.label === "Critical-Hit Damage");
      if (critStat && critStat.value) {
        scopeCritBonus = critStat.value;
        results.hasScope = true;
      }
    }
  });

  results.crit = calculateDamage(
    { constant: 0, multiplier: 100, levelCoef: 0 },
    atkStats.atk,
    defStats.def,
    attackerLevel,
    true,
    currentAttacker.pokemonId,
    scopeCritBonus,
    globalDamageMult
  );

  attackerItems.forEach(item => {
    if (item && item.name === "Muscle Band" && item.level20) {
      results.hasMuscle = true;
      const percent = parseFloat(item.level20.replace('%', '')) / 100;
      let extra = Math.floor(currentDefHP * percent);
      extra = Math.min(extra, 360);

      results.muscleExtra = calculateDamage(
        { constant: extra, multiplier: 0, levelCoef: 0 },
        atkStats.atk,
        defStats.def,
        attackerLevel,
        false,
        null,
        1.0,
        globalDamageMult
      );

      results.muscleTotalNormal = results.normal + results.muscleExtra;
      results.muscleTotalCrit = results.crit + results.muscleExtra;
    }

    if (item && item.name === "Scope Lens") {
      results.hasScope = true;
      let percent = 45;
      if (item.level20 === "75%") percent = 75;
      else if (item.level20) percent = parseInt(item.level20.replace('%', '')) || 45;

      results.scopePercent = percent;
      const extraBase = Math.floor(atkStats.atk * (percent / 100));

      results.scopeExtra = calculateDamage(
        { constant: extraBase, multiplier: 0, levelCoef: 0 },
        atkStats.atk,
        defStats.def,
        attackerLevel,
        false,
        null,
        1.0,
        globalDamageMult
      );

      results.totalCritWithScope = results.crit + results.scopeExtra;
    }
  });

  return results;
}

function updateHPDisplays() {
  if (!currentAttacker || !currentDefender) return;

  const atkStats = getModifiedStats(currentAttacker, attackerLevel, attackerItems, attackerItemStacks, attackerItemActivated);
  const defStats = getModifiedStats(currentDefender, defenderLevel, defenderItems, defenderItemStacks, defenderItemActivated);

  if (!isEditingHP.attacker) {
    const currentAtkHP = Math.floor(atkStats.hp * (attackerHPPercent / 100));
    document.getElementById('hpValueAttacker').textContent = `${currentAtkHP.toLocaleString()} / ${atkStats.hp.toLocaleString()}`;
  }

  if (!isEditingHP.defender) {
    const currentDefHP = Math.floor(defStats.hp * (defenderHPPercent / 100));
    document.getElementById('hpValueDefender').textContent = `${currentDefHP.toLocaleString()} / ${defStats.hp.toLocaleString()}`;
  }
}

function updateDamages() {
  if (!currentAttacker?.moves?.length) {
    movesGrid.innerHTML = `<div class="loading">Sélectionne un attaquant !</div>`;
    return;
  }

  const atkStats = getModifiedStats(currentAttacker, attackerLevel, attackerItems, attackerItemStacks, attackerItemActivated);
  const defStats = getModifiedStats(currentDefender, defenderLevel, defenderItems, defenderItemStacks, defenderItemActivated);
  const currentDefHP = Math.floor(defStats.hp * (defenderHPPercent / 100));

  document.getElementById('resultsAttackerName').textContent = currentAttacker.displayName;
  document.getElementById('resultsDefenderName').textContent = currentDefender?.displayName || 'Aucun';
  document.getElementById('attackerAtk').textContent = atkStats.atk.toLocaleString();
  document.getElementById('attackerSpAtk').textContent = atkStats.sp_atk.toLocaleString();

  const isCustom = currentDefender?.pokemonId === "custom-doll";

  if (isCustom) {
    document.getElementById('defenderMaxHP').textContent = defStats.hp.toLocaleString();
    document.getElementById('defenderDefCustom').textContent = defStats.def.toLocaleString();
    document.getElementById('defenderSpDefCustom').textContent = defStats.sp_def.toLocaleString();
  } else {
    document.getElementById('defenderDef').textContent = defStats.def.toLocaleString();
    document.getElementById('defenderSpDef').textContent = defStats.sp_def.toLocaleString();
  }

  let baseCritChance = 0;
  if (currentAttacker && currentAttacker.stats) {
    const levelIndex = attackerLevel - 1;
    baseCritChance = currentAttacker.stats[levelIndex]?.crit || 0;
  }

  let totalCritChance = baseCritChance;
  attackerItems.forEach(item => {
    if (item && item.stats) {
      const critStat = item.stats.find(s => s.label === "Critical-Hit Rate");
      if (critStat && critStat.percent && critStat.value) {
        totalCritChance += critStat.value;
      }
    }
  });

  totalCritChance = Math.min(100, totalCritChance);
  document.getElementById('attackerCritChance').textContent = `${totalCritChance}%`;

  document.querySelectorAll('.global-bonus-line').forEach(el => el.remove());

  const itemEffects = applyItemsAndGlobalEffects(atkStats, defStats);
  applyPassiveEffects(atkStats, defStats);

  const finalEffects = {
    ...itemEffects,
    infiltratorIgnore: currentAttacker?.pokemonId === "chandelure" ? Math.min(attackerPassiveStacks * 0.025, 0.20) : 0,
    defenderFlashFireReduction: currentDefender?.pokemonId === "armarouge" && defenderFlashFireActive ? 0.20 : 0
  };

  displayMoves(atkStats, defStats, finalEffects, currentDefHP);
  updateHPDisplays();
}

function applyItemsAndGlobalEffects(atkStats, defStats) {
  const attackerCard = document.querySelector('.attacker-stats');
  const defenderCard = document.querySelector('.defender-stats');

  let choiceSpecsBonus = 0;
  let hasChoiceSpecs = false;
  let slickIgnore = 0;
  let scopeCritBonus = 1.0;
  let globalDamageMult = 1.0;

  attackerItems.forEach((item, i) => {
    if (!item) return;

    if (item.name === "Choice Specs") {
      hasChoiceSpecs = true;
      const percent = parseFloat(item.level20.replace('%', '').trim()) / 100;
      choiceSpecsBonus = Math.floor(atkStats.sp_atk * percent);
    }

    if (item.name === "Slick Spoon" && attackerItemActivated[i]) {
      slickIgnore = parseFloat(item.level20.replace('%', '').trim()) / 100 || 0;
    }

    if (item.name === "Scope Lens" && item.stats) {
      const critStat = item.stats.find(s => s.label === "Critical-Hit Damage");
      if (critStat?.value) scopeCritBonus = critStat.value;
    }

    if (item.activable && attackerItemActivated[i] && item.activation_effect) {
      item.activation_effect.stats.forEach(s => {
        if (s.label === "Damage" && s.percent) globalDamageMult *= (1 + s.value / 100);
      });
    }
  });

  const chargingIdx = attackerItems.findIndex(i => i?.name === "Charging Charm");
  if (chargingIdx !== -1 && attackerItemActivated[chargingIdx]) {
    const item = attackerItems[chargingIdx];
    const percent = parseFloat(item.level20.replace('%', '')) / 100;
    const exampleDef = currentAttacker.style === "special" ? defStats.sp_def : defStats.def;
    const chargingBase = 40 + Math.floor(atkStats.atk * percent);
    const chargingExtra = calculateDamage({ constant: chargingBase, multiplier: 0, levelCoef: 0 }, atkStats.atk, exampleDef, attackerLevel, false, null, 1.0, globalDamageMult);

    const line = document.createElement("div");
    line.className = "global-bonus-line";
    line.innerHTML = `
      <div style="margin:12px 0;padding:8px;background:#2a2a3a;border-radius:8px;font-size:0.95rem;">
        <strong>Charging Charm</strong> (full stack)<br>
        <span style="color:#a0d8ff;">+${chargingExtra.toLocaleString()} additional damages</span>
      </div>
    `;
    attackerCard.appendChild(line);
  }

  const rockyIdx = defenderItems.findIndex(i => i?.name === "Rocky Helmet");
  if (rockyIdx !== -1) {
    const item = defenderItems[rockyIdx];
    const percent = parseFloat(item.level20.replace('%', '')) / 100;
    const rockyDamage = Math.floor(defStats.hp * percent);
    const line = document.createElement("div");
    line.className = "global-bonus-line";
    line.innerHTML = `
      <div style="margin:12px 0;padding:10px;background:#3a2a2a;border-radius:8px;border-left:4px solid #ff6b6b;font-size:0.95rem;">
        <strong>🪨 Rocky Helmet</strong><br>
        <span style="color:#ff9999;">Deal ${rockyDamage.toLocaleString()} damage when hit</span>
      </div>
    `;
    defenderCard.appendChild(line);
  }

  return { choiceSpecsBonus, hasChoiceSpecs, slickIgnore, scopeCritBonus, globalDamageMult };
}

function applyPassiveEffects(atkStats, defStats) {
  const attackerCard = document.querySelector('.attacker-stats');
  const defenderCard = document.querySelector('.defender-stats');

  if (currentAttacker?.pokemonId === "chandelure") {
    const line = document.createElement("div");
    line.className = "global-bonus-line";
    line.innerHTML = `
      <div style="margin:12px 0;padding:10px;background:#2a2a3a;border-radius:8px;border-left:4px solid #bb86fc;display:flex;align-items:center;gap:12px;">
        <img src="assets/moves/chandelure/infiltrator.png" style="width:40px;height:40px;border-radius:6px;" onerror="this.src='assets/moves/missing.png'">
        <div style="flex:1;">
          <strong style="color:#bb86fc;">Infiltrator</strong><br>
          Stacks: <button class="stack-btn minus">-</button> <strong style="color:#a0d8ff;">${attackerPassiveStacks}</strong>/8 <button class="stack-btn plus">+</button>
          → Ignore ${(attackerPassiveStacks * 2.5).toFixed(1)}% Sp. Def
        </div>
      </div>
    `;
    line.querySelector('.minus').onclick = () => { if (attackerPassiveStacks > 0) { attackerPassiveStacks--; updateDamages(); } };
    line.querySelector('.plus').onclick = () => { if (attackerPassiveStacks < 8) { attackerPassiveStacks++; updateDamages(); } };
    attackerCard.appendChild(line);
  }

  if (currentAttacker?.pokemonId === "aegislash") {
    const isSword = attackerStance === 'sword';
    const line = document.createElement("div");
    line.className = "global-bonus-line";
    line.innerHTML = `
      <div style="margin:12px 0;padding:10px;background:#2a2a3a;border-radius:8px;border-left:4px solid #e67e22;display:flex;align-items:center;gap:12px;">
        <img src="assets/moves/aegislash/stance_change.png" style="width:40px;height:40px;border-radius:6px;" onerror="this.src='assets/moves/missing.png'">
        <div style="flex:1;">
          <strong style="color:#e67e22;">Stance Change</strong><br>
          Forme: <strong style="color:${isSword?'#e74c3c':'#3498db'};">${isSword?'Blade':'Shield'}</strong><br>
          <button class="stance-toggle" style="margin-top:8px;padding:8px 16px;background:${isSword?'#3498db':'#e74c3c'};color:white;border:none;border-radius:6px;cursor:pointer;">
            Switch to ${isSword?'Shield':'Blade'} Forme
          </button>
        </div>
      </div>
    `;
    line.querySelector('.stance-toggle').onclick = () => { attackerStance = isSword ? 'shield' : 'sword'; updateDamages(); };
    attackerCard.appendChild(line);
  }

  if (currentDefender?.pokemonId === "aegislash") {
    const isSword = defenderStance === 'sword';
    const line = document.createElement("div");
    line.className = "global-bonus-line";
    line.innerHTML = `
      <div style="margin:12px 0;padding:10px;background:#3a2a2a;border-radius:8px;border-left:4px solid #e67e22;display:flex;align-items:center;gap:12px;">
        <img src="assets/moves/aegislash/stance_change.png" style="width:40px;height:40px;border-radius:6px;" onerror="this.src='assets/moves/missing.png'">
        <div style="flex:1;">
          <strong style="color:#e67e22;">Stance Change</strong><br>
          Forme: <strong style="color:${isSword?'#e74c3c':'#3498db'};">${isSword?'Blade':'Shield'}</strong><br>
          <button class="stance-toggle" style="margin-top:8px;padding:8px 16px;background:${isSword?'#3498db':'#e74c3c'};color:white;border:none;border-radius:6px;cursor:pointer;">
            Switch to ${isSword?'Shield':'Blade'} Forme
          </button>
        </div>
      </div>
    `;
    line.querySelector('.stance-toggle').onclick = () => { defenderStance = isSword ? 'shield' : 'sword'; updateDamages(); };
    defenderCard.appendChild(line);
  }

  if (currentAttacker?.pokemonId === "armarouge") {
    const exampleDef = currentAttacker.style === "special" ? defStats.sp_def : defStats.def;
    const passive = currentAttacker.passive || { extraAutoMultiplier: 60, extraAutoConstant: 120 };
    const flashBonus = calculateDamage({ multiplier: passive.extraAutoMultiplier, levelCoef: 0, constant: passive.extraAutoConstant }, atkStats.sp_atk, exampleDef, attackerLevel, false);

    const line = document.createElement("div");
    line.className = "global-bonus-line";
    line.innerHTML = `
      <div style="margin:12px 0;padding:10px;background:#2a2a3a;border-radius:8px;border-left:4px solid #ff9500;display:flex;align-items:center;gap:12px;">
        <img src="assets/moves/armarouge/flash_fire.png" style="width:40px;height:40px;border-radius:6px;" onerror="this.src='assets/moves/missing.png'">
        <div style="flex:1;">
          <strong style="color:#ff9500;">Flash Fire</strong><br>
          Next AA: <strong style="color:${attackerFlashFireActive?'#88ff88':'#ff6666'};">${attackerFlashFireActive?'Active':'Inactive'}</strong> (+${flashBonus.toLocaleString()} dmg)<br>
          <button class="flashfire-toggle" style="margin-top:8px;padding:8px 16px;background:${attackerFlashFireActive?'#27ae60':'#7f8c8d'};color:white;border:none;border-radius:6px;cursor:pointer;">
            ${attackerFlashFireActive?'Deactivate':'Activate'} proc
          </button>
        </div>
      </div>
    `;
    line.querySelector('.flashfire-toggle').onclick = () => { attackerFlashFireActive = !attackerFlashFireActive; updateDamages(); };
    attackerCard.appendChild(line);
  }

  if (currentDefender?.pokemonId === "armarouge") {
    const line = document.createElement("div");
    line.className = "global-bonus-line";
    line.innerHTML = `
      <div style="margin:12px 0;padding:10px;background:#3a2a2a;border-radius:8px;border-left:4px solid #ff9500;display:flex;align-items:center;gap:12px;">
        <img src="assets/moves/armarouge/flash_fire.png" style="width:40px;height:40px;border-radius:6px;" onerror="this.src='assets/moves/missing.png'">
        <div style="flex:1;">
          <strong style="color:#ff9500;">Flash Fire</strong><br>
          Damage Reduction: <strong style="color:${defenderFlashFireActive?'#88ff88':'#ff6666'};">${defenderFlashFireActive?'20%':'0%'}</strong><br>
          <button class="flashfire-toggle" style="margin-top:8px;padding:8px 16px;background:${defenderFlashFireActive?'#27ae60':'#7f8c8d'};color:white;border:none;border-radius:6px;cursor:pointer;">
            ${defenderFlashFireActive?'Deactivate':'Activate'} reduction
          </button>
        </div>
      </div>
    `;
    line.querySelector('.flashfire-toggle').onclick = () => { defenderFlashFireActive = !defenderFlashFireActive; updateDamages(); };
    defenderCard.appendChild(line);
  }
}

function displayMoves(atkStats, defStats, effects, currentDefHP) {
  const { choiceSpecsBonus, hasChoiceSpecs, slickIgnore, scopeCritBonus, globalDamageMult, infiltratorIgnore, defenderFlashFireReduction } = effects;

  const aaResults = getAutoAttackResults(atkStats, defStats, currentDefHP, globalDamageMult);

  movesGrid.innerHTML = "";
  let firstHit = true;

  currentAttacker.moves.forEach(move => {
    const card = document.createElement("div");
    card.className = "move-card";

    const header = document.createElement("div");
    header.className = "move-title";
    header.innerHTML = `<img src="${move.image}" alt="${move.name}" onerror="this.src='assets/moves/missing.png'"> <strong>${move.name}</strong>`;
    card.appendChild(header);

    if (!move.damages || move.damages.length === 0 || move.damages.every(d => !d.dealDamage)) {
      const line = document.createElement("div");
      line.className = "damage-line";
      line.innerHTML = `<span class="dmg-name" style="color:#888;">Utility / No damage</span>`;
      card.appendChild(line);
      movesGrid.appendChild(card);
      return;
    }

    move.damages.forEach(dmg => {
      if (!dmg.dealDamage) return;

      let relevantAtk = currentAttacker.style === "special" ? atkStats.sp_atk : atkStats.atk;
      let relevantDef = currentAttacker.style === "special" ? defStats.sp_def : defStats.def;

      if (dmg.scaling === "physical") { relevantAtk = atkStats.atk; relevantDef = defStats.def; }
      if (dmg.scaling === "special") { relevantAtk = atkStats.sp_atk; relevantDef = defStats.sp_def; }

      let effectiveDef = relevantDef;
      if (slickIgnore > 0) effectiveDef = Math.floor(effectiveDef * (1 - slickIgnore));
      if (infiltratorIgnore > 0) effectiveDef = Math.floor(effectiveDef * (1 - infiltratorIgnore));
      if (defenderFlashFireReduction > 0) effectiveDef = Math.floor(effectiveDef / (1 - defenderFlashFireReduction));

      let normal = calculateDamage(dmg, relevantAtk, effectiveDef, attackerLevel, false, currentAttacker.pokemonId, 1.0, globalDamageMult);
      let crit = calculateDamage(dmg, relevantAtk, effectiveDef, attackerLevel, true, currentAttacker.pokemonId, scopeCritBonus, globalDamageMult);

      if (move.name === "Auto-attack" && attackerFlashFireActive && currentAttacker.pokemonId === "armarouge") {
        const passive = currentAttacker.passive || { extraAutoMultiplier: 60, extraAutoConstant: 120 };
        const bonus = calculateDamage({ multiplier: passive.extraAutoMultiplier, levelCoef: 0, constant: passive.extraAutoConstant }, relevantAtk, effectiveDef, attackerLevel);
        normal += bonus;
        crit += bonus;
      }

      let displayedNormal = normal;
      let displayedCrit = crit;
      if (hasChoiceSpecs && firstHit && (dmg.scaling === "special" || currentAttacker.style === "special")) {
        displayedNormal += choiceSpecsBonus;
        displayedCrit += choiceSpecsBonus;
      }

      const line = document.createElement("div");
      line.className = "damage-line";

      const canCrit = move.can_crit === "true" || move.can_crit === true;

      if (canCrit) {
        line.innerHTML = `
          <span class="dmg-name">${dmg.name}${dmg.notes ? `<br><i>${dmg.notes}</i>` : ""}</span>
          <div class="dmg-values">
            <span class="dmg-normal">${displayedNormal.toLocaleString()}</span>
            <span class="dmg-crit">(${displayedCrit.toLocaleString()})</span>
          </div>
        `;
      } else {
        line.innerHTML = `
          <span class="dmg-name">${dmg.name}${dmg.notes ? `<br><i>${dmg.notes}</i>` : ""}</span>
          <div class="dmg-values">
            <span class="dmg-normal">${displayedNormal.toLocaleString()}</span>
          </div>
        `;
      }

      card.appendChild(line);
      firstHit = false;
    });

    if (move.name === "Auto-attack") {
      if (aaResults.hasMuscle) {
        const line = document.createElement("div");
        line.className = "damage-line";
        line.innerHTML = `<span class="dmg-name">Muscle Band bonus (remaining HP)</span><div class="dmg-values"><span class="dmg-crit">+ ${aaResults.muscleExtra.toLocaleString()}</span></div>`;
        card.appendChild(line);
      }

      if (aaResults.hasScope) {
        const line = document.createElement("div");
        line.className = "damage-line";
        line.innerHTML = `<span class="dmg-name">Scope Lens bonus (extra hit on crit)</span><div class="dmg-values"><span class="dmg-crit">+ ${aaResults.scopeExtra.toLocaleString()}</span></div>`;
        card.appendChild(line);
      }

      let hasRazorClaw = false;
      let razorBonusPercent = 0;
      attackerItems.forEach(item => {
        if (item?.name === "Razor Claw" && item.level20) {
          hasRazorClaw = true;
          razorBonusPercent = parseFloat(item.level20.replace('%', '')) / 100;
        }
      });

      if (hasRazorClaw && razorBonusPercent > 0) {
        const razorExtraBase = Math.floor(atkStats.atk * razorBonusPercent) + 20;
        const razorExtra = calculateDamage({ constant: razorExtraBase, multiplier: 0, levelCoef: 0 }, atkStats.atk, defStats.def, attackerLevel, false, null, 1.0, globalDamageMult);
        const line = document.createElement("div");
        line.className = "damage-line";
        line.innerHTML = `<span class="dmg-name">Razor Claw bonus (next AA after move)</span><div class="dmg-values"><span class="dmg-crit">+ ${razorExtra.toLocaleString()}</span></div>`;
        card.appendChild(line);
      }
    }

    movesGrid.appendChild(card);
  });
}

document.getElementById('hpSliderAttacker').addEventListener('input', (e) => {
  attackerHPPercent = parseInt(e.target.value);
  updateHPDisplays();
  updateDamages();
});

document.getElementById('hpSliderDefender').addEventListener('input', (e) => {
  defenderHPPercent = parseInt(e.target.value);
  updateHPDisplays();
  updateDamages();
});

function makeHPValueEditable(elementId, sliderId) {
  const element = document.getElementById(elementId);
  const slider = document.getElementById(sliderId);

  const side = elementId.includes('Attacker') ? 'attacker' : 'defender';

  element.addEventListener('click', (e) => {
    if (isEditingHP[side]) return;
    isEditingHP[side] = true;

    e.stopPropagation();

    const [currentVal, maxVal] = element.textContent
      .split(' / ')
      .map(v => parseInt(v.replace(/,/g, '')));

    const input = document.createElement('input');
    input.type = 'number';
    input.min = 0;
    input.max = maxVal;
    input.value = currentVal;

    input.style.width = '120px';
    input.style.padding = '0.4rem';
    input.style.fontSize = '1.1rem';
    input.style.textAlign = 'center';

    element.textContent = '';
    element.appendChild(input);
    input.focus();
    input.select();

    const save = () => {
      let val = Math.max(0, Math.min(parseInt(input.value) || 0, maxVal));
      const percent = Math.round((val / maxVal) * 100);

      if (side === 'attacker') attackerHPPercent = percent;
      else defenderHPPercent = percent;

      slider.value = percent;
      isEditingHP[side] = false;
      updateHPDisplays();
      updateDamages();
    };

    input.addEventListener('blur', save);
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') save();
    });
  });
}

function makeCustomStatEditable(elementId, property) {
  const element = document.getElementById(elementId);

  element.addEventListener('click', (e) => {
    e.stopPropagation();

    const input = document.createElement('input');
    input.type = 'number';
    input.min = 1;
    input.value = element.textContent.replace(/,/g, '');
    input.style.width = '120px';
    input.style.padding = '0.4rem';
    input.style.fontSize = '1.1rem';
    input.style.textAlign = 'center';

    element.textContent = '';
    element.appendChild(input);
    input.focus();
    input.select();

    const save = () => {
      let val = parseInt(input.value) || (property === 'hp' ? 10000 : 100);
      if (property === 'hp') val = Math.max(1000, val);

      if (currentDefender?.pokemonId === "custom-doll" && currentDefender.customStats) {
        currentDefender.customStats[property] = val;
      }

      element.textContent = val.toLocaleString();
      updateDamages();
    };

    input.addEventListener('blur', save);
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') save();
    });
  });
}

makeCustomStatEditable('defenderMaxHP', 'hp');
makeCustomStatEditable('defenderDefCustom', 'def');
makeCustomStatEditable('defenderSpDefCustom', 'sp_def');

function updateSliderStyle(slider, value) {
  slider.style.setProperty('--value', value);
}

levelSliderAttacker.oninput = (e) => {
  attackerLevel = parseInt(e.target.value);
  levelValueAttacker.textContent = attackerLevel;
  updateSliderStyle(levelSliderAttacker, attackerLevel);
  updateDamages();
};

levelSliderDefender.oninput = (e) => {
  defenderLevel = parseInt(e.target.value);
  levelValueDefender.textContent = defenderLevel;
  updateSliderStyle(levelSliderDefender, defenderLevel);
  updateDamages();
};

updateSliderStyle(levelSliderAttacker, 15);
updateSliderStyle(levelSliderDefender, 15);

const warningBtn = document.getElementById('warningBtn');
const warningModal = document.getElementById('warningModal');
const closeWarning = document.querySelector('.close-warning');

if (warningBtn) {
  warningBtn.addEventListener('click', () => {
    warningModal.style.display = 'flex';
  });
}

if (closeWarning) {
  closeWarning.addEventListener('click', () => {
    warningModal.style.display = 'none';
  });
}

if (warningModal) {
  warningModal.addEventListener('click', (e) => {
    if (e.target === warningModal) {
      warningModal.style.display = 'none';
    }
  });
}

loadData();