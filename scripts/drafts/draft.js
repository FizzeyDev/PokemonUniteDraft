import { state, fearlessTeamA, fearlessTeamB } from "./state.js";
import { mapImages, draftOrders } from "./constants.js";
import {
  updateTurn, highlightCurrentSlot,
  resetDraftSlots, createRecapSlots,
} from "./ui.js";
import { setupTimer } from "./timer.js";
import { publishPick, publishDraftEnd, mpState } from "./multiplayer.js";

// Expose publishPick pour gallery.js (via window pour éviter les imports circulaires)
window._mpPublishPick = async (stepIndex, monFile) => {
  if (mpState.enabled) {
    await publishPick(stepIndex, monFile);
  }
};

export function startDraft() {
  if (!state.selectedMode) return;

  if (!state.selectedMap) {
    const maps = ["groudon", "kyogre", "rayquaza"];
    state.selectedMap = maps[Math.floor(Math.random() * maps.length)];
  }

  document.getElementById("map-display").innerHTML =
    `<img src="${mapImages[state.selectedMap]}" alt="${state.selectedMap}">`;
  document.getElementById("map-display").style.display   = "block";
  document.getElementById("map-selection").style.display = "none";

  state.fearlessMode      = document.getElementById("fearless-checkbox").checked;
  state.currentDraftOrder = [...draftOrders[state.selectedMode]];
  state.currentStep       = 0;

  document.getElementById("start-draft").style.display  = "none";
  document.getElementById("reset-draft").style.display  = "inline-block";
  document.getElementById("filters").style.display      = "flex";
  document.getElementById("gallery").style.display      = "grid";
  document.getElementById("sort-options").style.display = "block";
  document.querySelectorAll(".mode-btn").forEach(b => b.classList.add("disabled"));
  document.querySelectorAll(".switch").forEach(s => s.closest("label").style.display = "none");

  // En multijoueur, masque les contrôles multijoueur pendant la draft
  if (mpState.enabled) {
    document.getElementById("mp-controls").style.display = "none";
    _updateMpTurnIndicator();
  }

  setupTimer();
  resetDraftSlots();
  state.allImages.forEach(img => img.classList.remove("used", "fearless-blocked"));
  updateTurn();
  highlightCurrentSlot();
}

export async function endDraft() {
  clearInterval(state.timerInterval);
  document.querySelectorAll(".slot").forEach(s => s.classList.remove("current-pick"));
  document.getElementById("filters").style.display      = "none";
  document.getElementById("gallery").style.display      = "none";
  document.getElementById("sort-options").style.display = "none";
  updateTurn();

  if (mpState.enabled) {
    await publishDraftEnd();
  }

  if (state.fearlessMode) {
    _showFearlessRecap();
  } else {
    _showFinalDraft();
  }
}

function _showFearlessRecap() {
  state.draftCount++;
  const recapDiv = document.createElement("div");
  Object.assign(recapDiv.style, {
    marginBottom: "40px", padding: "20px",
    background: "#2a3435", borderRadius: "12px",
  });

  const title = document.createElement("h3");
  title.textContent = `Draft ${state.draftCount} Recap`;
  recapDiv.appendChild(title);

  const teamsDiv = document.createElement("div");
  Object.assign(teamsDiv.style, { display: "flex", justifyContent: "space-around", flexWrap: "wrap" });

  ["teamA", "teamB"].forEach(teamId => {
    const container = _buildTeamRecap(teamId);
    teamsDiv.appendChild(container);
  });

  recapDiv.appendChild(teamsDiv);
  document.getElementById("series-recaps").prepend(recapDiv);
  document.getElementById("fearless-series").style.display   = "block";
  document.getElementById("fearless-controls").style.display = "flex";
  document.getElementById("final-draft").style.display       = "none";
}

function _showFinalDraft() {
  document.getElementById("final-draft").style.display = "block";
  const finalTeamsDiv = document.getElementById("final-draft-teams");
  finalTeamsDiv.innerHTML = "";

  ["teamA", "teamB"].forEach(teamId => {
    finalTeamsDiv.appendChild(_buildTeamRecap(teamId, true));
  });
}

function _buildTeamRecap(teamId, useH3 = false) {
  const teamElem  = document.getElementById(teamId);
  const container = document.createElement("div");
  container.style.textAlign = "center";

  const h = document.createElement(useH3 ? "h3" : "h4");
  h.textContent = teamId === "teamA" ? "Purple Team" : "Orange Team";
  container.appendChild(h);

  container.appendChild(
    createRecapSlots(teamElem.querySelector(".slots.bans").querySelectorAll(".slot"), true)
  );
  container.appendChild(
    createRecapSlots(teamElem.querySelector(".slots.picks").querySelectorAll(".slot"), false)
  );
  return container;
}

export function undoLastPick() {
  // L'undo est désactivé en multijoueur
  if (mpState.enabled) return;

  if (state.currentStep <= 0) return;

  const lastIndex = state.currentStep - 1;
  const step      = state.currentDraftOrder[lastIndex];
  const teamElem  = document.getElementById(step.team);
  const slots     = Array.from(teamElem.querySelectorAll(`.slots.${step.type}s .slot`));
  const lastSlot  = slots.reverse().find(s => s.querySelector("img"));
  if (!lastSlot) return;

  const img = lastSlot.querySelector("img");
  if (img) {
    const monFile    = img.dataset.file;
    const galleryImg = state.allImages.find(g => g.dataset.file === monFile);
    if (galleryImg) galleryImg.classList.remove("used");

    if (state.fearlessMode && step.type === "pick") {
      const teamSet = step.team === "teamA" ? fearlessTeamA : fearlessTeamB;
      teamSet.delete(monFile);
    }
    img.remove();
  }

  lastSlot.innerHTML = lastSlot.closest(".picks") ? (state.langData.pick || "Pick") : "";

  state.currentStep = lastIndex;
  updateTurn();
  highlightCurrentSlot();
}

export function softResetDraft() {
  clearInterval(state.timerInterval);
  state.currentStep  = 0;
  state.selectedMode = null;
  state.selectedMap  = null;

  document.querySelectorAll(".mode-btn").forEach(b => b.classList.remove("active", "disabled"));
  document.querySelectorAll(".map-btn").forEach(b => b.classList.remove("active"));
  document.getElementById("start-draft").style.display   = "inline-block";
  document.getElementById("start-draft").disabled        = true;
  document.getElementById("reset-draft").style.display   = "none";
  document.getElementById("filters").style.display       = "none";
  document.getElementById("gallery").style.display       = "none";
  document.getElementById("sort-options").style.display  = "none";
  document.getElementById("final-draft").style.display   = "none";
  document.getElementById("fearless-series").style.display = "none";
  document.getElementById("map-selection").style.display = "block";
  document.getElementById("map-display").style.display   = "none";
  document.getElementById("turn-display").style.display  = "none";
  document.querySelectorAll(".switch").forEach(s => s.closest("label").style.display = "block");

  // Réaffiche les contrôles MP
  if (document.getElementById("mp-controls")) {
    document.getElementById("mp-controls").style.display = "block";
  }

  resetDraftSlots();
  state.allImages.forEach(img => img.classList.remove("used", "fearless-blocked"));
}

export function startNextDraft() {
  resetDraftSlots();
  state.allImages.forEach(img => img.classList.remove("used", "fearless-blocked"));
  state.currentStep = 0;

  setupTimer();

  document.getElementById("filters").style.display      = "flex";
  document.getElementById("gallery").style.display      = "grid";
  document.getElementById("sort-options").style.display = "block";
  document.getElementById("fearless-controls").style.display = "none";

  updateTurn();
  highlightCurrentSlot();
}

export function endFearlessSeries() {
  softResetDraft();
  fearlessTeamA.clear();
  fearlessTeamB.clear();
  state.draftCount = 0;
  document.getElementById("series-recaps").innerHTML    = "";
  document.getElementById("fearless-series").style.display = "none";
}

// ─── Indicateur de tour MP dans le turn-display ──
export function _updateMpTurnIndicator() {
  if (!mpState.enabled) return;
  const isMyTurn = window._mpIsMyTurn ? window._mpIsMyTurn() : true;
  const indicator = document.getElementById("mp-turn-indicator");
  if (!indicator) return;

  if (mpState.playerRole === "spectator") {
    indicator.textContent = "👁 Vous êtes spectateur";
    indicator.className   = "mp-turn-indicator spectator";
  } else if (isMyTurn) {
    indicator.textContent = "✅ C'est votre tour !";
    indicator.className   = "mp-turn-indicator your-turn";
  } else {
    indicator.textContent = "⏳ En attente de l'adversaire…";
    indicator.className   = "mp-turn-indicator waiting";
  }
  indicator.style.display = "block";
}