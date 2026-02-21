import { state, fearlessTeamA, fearlessTeamB } from "./state.js";
import { highlightCurrentSlot, updateTurn, findNextBanSlot, findNextPickSlot } from "./ui.js";
import { endDraft } from "./draft.js";

let currentRole = null;
let searchTerm  = "";
let currentLang = localStorage.getItem('lang') || 'fr';

function applyFiltersAndSearch() {
  const query = searchTerm.toLowerCase();
  state.allImages.forEach(img => {
    let visible = true;
    if (currentRole !== null) {
      const roleMatch = currentRole === "unknown"
        ? !["def", "atk", "sup", "spe", "all"].includes(img.dataset.role)
        : img.dataset.role === currentRole;
      visible = roleMatch;
    }
    if (query) {
      visible = visible && (img.alt || "").toLowerCase().includes(query);
    }
    img.style.display = visible ? "block" : "none";
  });
}

export function renderGallery() {
  const gallery = document.getElementById("gallery");
  gallery.innerHTML = "";
  state.allImages = [];

  const sorted = [...state.monsData].sort((a, b) =>
    state.currentSort === "name"
      ? (a[`name_${currentLang}`] || a.name).localeCompare(b[`name_${currentLang}`] || b.name)
      : a.dex - b.dex
  );

  sorted.forEach(mon => {
    const img = document.createElement("img");
    img.src          = `assets/pokemon/${mon.file}`;
    img.alt          = mon[`name_${currentLang}`] || mon.name;
    img.dataset.file = mon.file;
    img.dataset.role = mon.role;
    img.addEventListener("click", () => onPokemonClick(img));
    gallery.appendChild(img);
    state.allImages.push(img);
  });

  applyFiltersAndSearch();
}

function onPokemonClick(img) {
  // Multiplayer turn check
  const isMyTurn = window._mpIsMyTurn ? window._mpIsMyTurn() : true;
  if (!isMyTurn) {
    _showNotYourTurn();
    return;
  }

  if (
    state.currentStep >= state.currentDraftOrder.length ||
    img.classList.contains("used") ||
    img.classList.contains("fearless-blocked")
  ) return;

  const step = state.currentDraftOrder[state.currentStep];

  // Find the right slot
  let slot;
  if (step.type === "ban") {
    slot = findNextBanSlot(step.team);
  } else {
    slot = findNextPickSlot(step.team);
  }
  if (!slot) return;

  // Place image in slot
  const clone = img.cloneNode(true);
  clone.style.cssText = ""; // reset any inline styles from gallery
  slot.innerHTML = "";
  slot.appendChild(clone);
  if (step.type === "ban") slot.classList.add("filled");

  img.classList.add("used");

  if (state.fearlessMode && step.type === "pick") {
    const teamSet = step.team === "teamA" ? fearlessTeamA : fearlessTeamB;
    teamSet.add(img.dataset.file);
  }

  // Publish in multiplayer
  if (window._mpPublishPick) window._mpPublishPick(state.currentStep, img.dataset.file);

  state.currentStep++;
  updateTurn();
  highlightCurrentSlot();

  if (state.currentStep >= state.currentDraftOrder.length) {
    endDraft();
  } else if (document.getElementById("enable-timer").checked) {
    state.timeLeft = parseInt(document.getElementById("timer-value").value) || 20;
    document.getElementById("bubble-timer").textContent = `${state.timeLeft}s`;
  }
}

function _showNotYourTurn() {
  const el = document.getElementById("not-your-turn-toast");
  if (!el) return;
  el.classList.add("visible");
  setTimeout(() => el.classList.remove("visible"), 2000);
}

export function initSortSelect() {
  const sortSelect = document.getElementById("sort-select");
  if (!sortSelect) return;
  sortSelect.addEventListener("change", e => {
    state.currentSort = e.target.value;
    renderGallery();
  });
}

export function initFilters() {
  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const role = btn.dataset.role;
      if (btn.classList.contains("active")) {
        btn.classList.remove("active");
        currentRole = null;
      } else {
        document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentRole = role === "unknown" ? "unknown" : role;
      }
      applyFiltersAndSearch();
    });
  });
}

export function initSearch() {
  const searchInput = document.getElementById("search-input");
  if (!searchInput) return;
  searchInput.addEventListener("input", e => {
    searchTerm = e.target.value.trim();
    applyFiltersAndSearch();
  });
}