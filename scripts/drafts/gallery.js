import { state, fearlessTeamA, fearlessTeamB } from "./state.js";
import { highlightCurrentSlot, updateTurn } from "./ui.js";
import { endDraft } from "./draft.js";

let currentRole = null;
let searchTerm = "";

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
      const name = (img.alt || "").toLowerCase();
      visible = visible && name.includes(query);
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
    img.src = `assets/pokemon/${mon.file}`;
    img.alt = mon[`name_${currentLang}`] || mon.name;
    img.dataset.file = mon.file;
    img.dataset.role = mon.role;
    img.addEventListener("click", () => onPokemonClick(img));

    gallery.appendChild(img);
    state.allImages.push(img);
  });

  applyFiltersAndSearch();
}

function onPokemonClick(img) {
  if (
    state.currentStep >= state.currentDraftOrder.length ||
    img.classList.contains("used") ||
    img.classList.contains("fearless-blocked")
  ) return;

  const step = state.currentDraftOrder[state.currentStep];
  const team = document.getElementById(step.team);
  const slot = Array.from(team.querySelectorAll(`.slots.${step.type}s .slot`))
                    .find(s => !s.querySelector("img"));
  if (!slot) return;

  slot.innerHTML = "";
  slot.appendChild(img.cloneNode(true));
  img.classList.add("used");

  if (state.fearlessMode && step.type === "pick") {
    const teamSet = step.team === "teamA" ? fearlessTeamA : fearlessTeamB;
    teamSet.add(img.dataset.file);
  }

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
        currentRole = role === "unknown" ? null : role;
      } else {
        document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentRole = role === "unknown" ? null : role;
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