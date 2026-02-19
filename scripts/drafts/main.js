import { state } from "./state.js";
import { draftOrders } from "./constants.js";
import { updateDynamicContent } from "./ui.js";
import { renderGallery, initSortSelect, initFilters, initSearch } from "./gallery.js";
import {
  startDraft, endFearlessSeries,
  softResetDraft, undoLastPick, startNextDraft,
} from "./draft.js";

let currentLang = localStorage.getItem('lang') || 'fr';

fetch(`lang/${currentLang}.json`)
  .then(res => res.json())
  .then(data => {
    state.langData = data;
    updateDynamicContent();
  });

fetch("data/pokemons.json")
  .then(res => res.json())
  .then(data => {
    state.monsData = data;
    renderGallery();
  });

document.querySelectorAll(".mode-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".mode-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    state.selectedMode      = btn.dataset.mode;
    state.currentDraftOrder = [...draftOrders[state.selectedMode]];

    document.getElementById("mode-title").textContent =
      state.langData[`mode_${state.selectedMode}`] || "";
    document.getElementById("mode-text").textContent =
      state.langData[`tooltip_${state.selectedMode}`] || "";

    document.getElementById("start-draft").disabled = false;
  });
});

document.querySelectorAll(".map-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".map-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    state.selectedMap = btn.dataset.map;
  });
});

document.getElementById("start-draft").addEventListener("click", startDraft);
document.getElementById("reset-draft").addEventListener("click", softResetDraft);
document.getElementById("backBtn").addEventListener("click", undoLastPick);
document.getElementById("next-draft-btn").addEventListener("click", startNextDraft);
document.getElementById("end-series-btn").addEventListener("click", endFearlessSeries);

initSortSelect();
initFilters();
initSearch();
