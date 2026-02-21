import { state, fearlessTeamA, fearlessTeamB } from "./state.js";
import { mapImages, draftOrders } from "./constants.js";
import {
  updateTurn, highlightCurrentSlot, resetDraftSlots, createRecapSlots,
  findNextBanSlot, findNextPickSlot, getAllBanSlots, getAllPickSlots,
} from "./ui.js";
import { setupTimer } from "./timer.js";
import { publishPick, publishDraftEnd, mpState } from "./multiplayer.js";

window._mpPublishPick = async (stepIndex, monFile) => {
  if (mpState.enabled) await publishPick(stepIndex, monFile);
};

export function startDraft() {
  if (!state.selectedMode) return;

  if (!state.selectedMap) {
    const maps = ["groudon", "kyogre", "rayquaza"];
    state.selectedMap = maps[Math.floor(Math.random() * maps.length)];
  }

  document.getElementById("map-display").innerHTML =
    `<img src="${mapImages[state.selectedMap]}" alt="${state.selectedMap}">`;
  document.getElementById("map-display").style.display = "block";
  document.getElementById("map-selection").style.display = "none";

  state.fearlessMode      = document.getElementById("fearless-checkbox").checked;
  state.currentDraftOrder = [...draftOrders[state.selectedMode]];
  state.currentStep       = 0;

  document.getElementById("start-draft").style.display = "none";
  document.getElementById("reset-draft").style.display = "inline-block";
  document.getElementById("backBtn").style.display     = "inline-block";

  // Montre la gallery, cache le recap
  _showGallery();
  _hideRecap();

  document.querySelectorAll(".mode-btn").forEach(b => b.classList.add("disabled"));

  // Cache le panneau MP pendant la draft
  document.getElementById("mp-controls").classList.remove("open");
  document.getElementById("mp-toggle-btn").style.display = "none";

  if (mpState.enabled) _updateMpTurnIndicator();

  setupTimer();
  resetDraftSlots();
  state.allImages.forEach(img => img.classList.remove("used", "fearless-blocked"));
  updateTurn();
  highlightCurrentSlot();
}

export async function endDraft() {
  clearInterval(state.timerInterval);

  document.querySelectorAll(".slot.current-pick, .ban-slot.current-pick")
    .forEach(s => s.classList.remove("current-pick"));

  document.getElementById("backBtn").style.display = "none";
  updateTurn();

  if (mpState.enabled) await publishDraftEnd();

  // Cache la gallery, montre le recap dans la fenêtre centrale
  _hideGallery();

  if (state.fearlessMode) {
    _showFearlessRecap();
  } else {
    _showFinalRecap();
  }
}

// ── Recap final (mode normal) ──────────────────────
function _showFinalRecap() {
  state.draftCount++;
  _buildCenterRecap(`Draft Result`, false);

  // Cache les contrôles fearless, montre reset
  document.getElementById("fearless-controls").style.display = "none";
  document.getElementById("reset-draft").style.display       = "inline-block";
}

// ── Recap fearless ────────────────────────────────
function _showFearlessRecap() {
  state.draftCount++;
  _buildCenterRecap(`Draft ${state.draftCount} Recap`, true);

  // Montre les contrôles fearless (avec sélection de map)
  document.getElementById("fearless-controls").style.display = "flex";

  // Pré-sélectionne la map actuelle
  document.querySelectorAll(".fearless-map-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.map === state.selectedMap);
  });
}

// ── Construction du recap dans #center-col ────────
function _buildCenterRecap(title, isFearless) {
  const recapEl    = document.getElementById("center-recap");
  const headerMap  = document.getElementById("center-recap-map");
  const headerTitle = document.getElementById("center-recap-title");
  const teamsEl    = document.getElementById("center-recap-teams");

  // Map dans le header
  headerMap.innerHTML = state.selectedMap
    ? `<img src="${mapImages[state.selectedMap]}" alt="${state.selectedMap}">`
    : "";

  headerTitle.textContent = title;

  // Vide et reconstruit les deux équipes
  teamsEl.innerHTML = "";
  ["teamA", "teamB"].forEach(teamId => {
    teamsEl.appendChild(_buildRecapTeam(teamId));
  });

  recapEl.style.display = "flex";

  // Si fearless : empile les recaps précédents aussi
  if (isFearless) {
    _appendToSeriesHistory(title);
  }
}

function _buildRecapTeam(teamId) {
  const wrap = document.createElement("div");
  wrap.className = `recap-team ${teamId}`;

  const title = document.createElement("div");
  title.className = "recap-team-title";
  title.textContent = teamId === "teamA" ? "🟣 Purple Team" : "🟠 Orange Team";
  wrap.appendChild(title);

  // Bans
  const bansLabel = document.createElement("div");
  bansLabel.className = "recap-section-label";
  bansLabel.textContent = "Bans";
  wrap.appendChild(bansLabel);

  const bansRow = document.createElement("div");
  bansRow.className = "recap-slots";
  getAllBanSlots(teamId).forEach(slot => {
    const rs = document.createElement("div");
    rs.className = "recap-slot ban-recap";
    const img = slot.querySelector("img");
    if (img) {
      const i = document.createElement("img");
      i.src = img.src; i.alt = img.alt;
      rs.appendChild(i);
    } else {
      rs.classList.add("empty");
    }
    bansRow.appendChild(rs);
  });
  wrap.appendChild(bansRow);

  // Picks
  const picksLabel = document.createElement("div");
  picksLabel.className = "recap-section-label";
  picksLabel.textContent = "Picks";
  wrap.appendChild(picksLabel);

  const picksRow = document.createElement("div");
  picksRow.className = "recap-slots";
  getAllPickSlots(teamId).forEach(slot => {
    const rs = document.createElement("div");
    rs.className = "recap-slot";
    const img = slot.querySelector("img");
    if (img) {
      const i = document.createElement("img");
      i.src = img.src; i.alt = img.alt;
      rs.appendChild(i);
    } else {
      rs.classList.add("empty");
    }
    picksRow.appendChild(rs);
  });
  wrap.appendChild(picksRow);

  return wrap;
}

// ── Historique fearless sous la fenêtre ───────────
function _appendToSeriesHistory(title) {
  const recapDiv = document.createElement("div");
  Object.assign(recapDiv.style, {
    marginBottom: "24px", padding: "16px",
    background: "var(--surface-2)", borderRadius: "12px",
    border: "1px solid var(--border)",
  });

  const h = document.createElement("h4");
  h.textContent = title;
  h.style.cssText = "font-family:'Exo 2',sans-serif; font-size:0.9rem; margin-bottom:10px; color:#fff; letter-spacing:0.06em; text-transform:uppercase;";
  recapDiv.appendChild(h);

  const teamsDiv = document.createElement("div");
  Object.assign(teamsDiv.style, { display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: "16px" });
  ["teamA", "teamB"].forEach(teamId => {
    teamsDiv.appendChild(_buildTeamRecapMini(teamId));
  });

  recapDiv.appendChild(teamsDiv);
  document.getElementById("series-recaps").prepend(recapDiv);
  document.getElementById("fearless-series").style.display = "block";
}

function _buildTeamRecapMini(teamId) {
  const container = document.createElement("div");
  container.style.textAlign = "center";

  const h = document.createElement("div");
  h.textContent = teamId === "teamA" ? "🟣 Purple" : "🟠 Orange";
  h.style.cssText = "font-size:0.75rem; font-weight:700; margin-bottom:6px; color:" + (teamId === "teamA" ? "var(--violet)" : "var(--orange)");
  container.appendChild(h);

  container.appendChild(createRecapSlots(getAllBanSlots(teamId), true));
  container.appendChild(createRecapSlots(getAllPickSlots(teamId), false));
  return container;
}

// ── Undo ──────────────────────────────────────────
export function undoLastPick() {
  if (mpState.enabled || state.currentStep <= 0) return;

  const lastIndex = state.currentStep - 1;
  const step      = state.currentDraftOrder[lastIndex];

  if (step.type === "ban") {
    const slots  = getAllBanSlots(step.team);
    const last   = slots.reverse().find(s => s.querySelector("img"));
    if (!last) return;
    const monFile = last.querySelector("img")?.dataset?.file;
    if (monFile) {
      const g = state.allImages.find(i => i.dataset.file === monFile);
      if (g) g.classList.remove("used");
    }
    last.innerHTML = "";
    last.classList.remove("filled");
  } else {
    const slots = getAllPickSlots(step.team);
    const last  = slots.reverse().find(s => s.querySelector("img"));
    if (!last) return;
    const img   = last.querySelector("img");
    const monFile = img?.dataset?.file;
    if (monFile) {
      const g = state.allImages.find(i => i.dataset.file === monFile);
      if (g) g.classList.remove("used");
      if (state.fearlessMode) {
        const teamSet = step.team === "teamA" ? fearlessTeamA : fearlessTeamB;
        teamSet.delete(monFile);
      }
    }
    last.innerHTML = state.langData.pick || "Pick";
  }

  state.currentStep = lastIndex;
  updateTurn();
  highlightCurrentSlot();
}

// ── Soft reset ────────────────────────────────────
export function softResetDraft() {
  clearInterval(state.timerInterval);
  state.currentStep  = 0;
  state.selectedMode = null;
  state.selectedMap  = null;

  document.querySelectorAll(".mode-btn").forEach(b => b.classList.remove("active", "disabled"));
  document.querySelectorAll(".map-btn").forEach(b => b.classList.remove("active"));
  document.getElementById("start-draft").style.display     = "inline-block";
  document.getElementById("start-draft").disabled          = true;
  document.getElementById("reset-draft").style.display     = "none";
  document.getElementById("backBtn").style.display         = "none";
  document.getElementById("final-draft").style.display     = "none";
  document.getElementById("fearless-series").style.display = "none";
  document.getElementById("fearless-controls").style.display = "none";
  document.getElementById("map-selection").style.display   = "block";
  document.getElementById("map-display").style.display     = "none";
  document.getElementById("turn-display").style.display    = "none";
  document.getElementById("bubble-timer").style.display    = "none";
  document.getElementById("mp-toggle-btn").style.display   = "flex";

  const mpInd = document.getElementById("mp-turn-indicator");
  if (mpInd) mpInd.style.display = "none";

  _hideGallery();
  _hideRecap();
  resetDraftSlots();
  state.allImages.forEach(img => img.classList.remove("used", "fearless-blocked"));
}

// ── Next draft (fearless) ─────────────────────────
export function startNextDraft() {
  resetDraftSlots();
  state.allImages.forEach(img => img.classList.remove("used", "fearless-blocked"));
  state.currentStep = 0;

  _hideRecap();
  _showGallery();

  document.getElementById("fearless-controls").style.display = "none";

  // Applique la map sélectionnée dans le re-select fearless
  const selectedMapBtn = document.querySelector(".fearless-map-btn.active");
  if (selectedMapBtn) state.selectedMap = selectedMapBtn.dataset.map;

  document.getElementById("map-display").innerHTML =
    `<img src="${mapImages[state.selectedMap]}" alt="${state.selectedMap}">`;

  setupTimer();
  updateTurn();
  highlightCurrentSlot();
}

// ── End fearless series ───────────────────────────
export function endFearlessSeries() {
  softResetDraft();
  fearlessTeamA.clear();
  fearlessTeamB.clear();
  state.draftCount = 0;
  document.getElementById("series-recaps").innerHTML = "";
  document.getElementById("fearless-series").style.display = "none";
}

// ── Helpers visibilité ────────────────────────────
function _showGallery() {
  const gw = document.getElementById("gallery-wrapper");
  gw.style.display = "flex";
  gw.style.flexDirection = "column";
  document.getElementById("filters").style.display      = "flex";
  document.getElementById("sort-options").style.display = "flex";
}

function _hideGallery() {
  document.getElementById("gallery-wrapper").style.display = "none";
  document.getElementById("filters").style.display         = "none";
  document.getElementById("sort-options").style.display    = "none";
}

function _hideRecap() {
  document.getElementById("center-recap").style.display = "none";
}

// ── MP turn indicator ─────────────────────────────
export function _updateMpTurnIndicator() {
  if (!mpState.enabled) return;
  const isMyTurn  = window._mpIsMyTurn ? window._mpIsMyTurn() : true;
  const indicator = document.getElementById("mp-turn-indicator");
  if (!indicator) return;

  if (mpState.playerRole === "spectator") {
    indicator.textContent = "👁 Spectator";
    indicator.className   = "mp-turn-indicator spectator";
  } else if (isMyTurn) {
    indicator.textContent = "✅ Your turn!";
    indicator.className   = "mp-turn-indicator your-turn";
  } else {
    indicator.textContent = "⏳ Waiting for opponent…";
    indicator.className   = "mp-turn-indicator waiting";
  }
  indicator.style.display = "block";
}