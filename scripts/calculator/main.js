// main.js - Point d'entrée principal de l'application

import { loadData } from './dataLoader.js';
import { populateGrids, setupSearch, setupLevelSliders, setupHPSliders, setupModals, setupCollapsibleSections, makeHPValueEditable, makeCustomStatEditable } from './uiManager.js';
import { populateItemGrid, setupItemSearch, setupItemSelection } from './itemManager.js';
import { selectAttacker, selectDefender } from './pokemonManager.js';
import { setupBuffListeners, setupDebuffListeners, setupStackableDebuffs } from './events.js';
import { updateDamages } from './damageDisplay.js';

async function initApp() {
  const success = await loadData();
  
  if (!success) {
    const movesGrid = document.getElementById("movesGrid");
    if (movesGrid) {
      movesGrid.innerHTML = `<div class="error">Erreur chargement données (voir console)</div>`;
    }
    return;
  }

  // Initialisation de l'UI
  populateGrids();
  populateItemGrid();
  setupItemSelection();
  setupItemSearch();
  setupSearch();
  setupLevelSliders();
  setupHPSliders();
  setupModals();
  setupCollapsibleSections();

  // Configuration des listeners d'événements
  setupBuffListeners();
  setupDebuffListeners();
  setupStackableDebuffs();

  // Rendre les HP éditables
  makeHPValueEditable('hpValueAttacker', 'hpSliderAttacker');
  makeHPValueEditable('hpValueDefender', 'hpSliderDefender');

  // Rendre les stats custom éditables
  makeCustomStatEditable('defenderMaxHP', 'hp');
  makeCustomStatEditable('defenderDefCustom', 'def');
  makeCustomStatEditable('defenderSpDefCustom', 'sp_def');

  // Sélection initiale
  selectAttacker('absol');
  selectDefender('substitute-doll');
  updateDamages();
}

// Lancer l'application quand le DOM est prêt
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}