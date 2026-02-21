import { state, fearlessTeamA, fearlessTeamB } from "./state.js";
import { mpState } from "./multiplayer.js";

export function updateDynamicContent() {
  document.querySelectorAll("[data-lang]").forEach(el => {
    const key = el.getAttribute("data-lang");
    if (state.langData[key]) el.textContent = state.langData[key];
  });
}

export function updateTurn() {
  const turnDisplay = document.getElementById("turn-display");
  if (state.currentStep >= state.currentDraftOrder.length) {
    turnDisplay.style.display = "none";
    _hideMpTurnIndicator();
    return;
  }
  const step   = state.currentDraftOrder[state.currentStep];
  const label  = step.team === "teamA" ? "Purple Team" : "Orange Team";
  const color  = step.team === "teamA" ? "var(--violet, #9f53ec)" : "var(--orange, #ff9d00)";
  const action = step.type === "ban" ? "to Ban" : "to Pick";
  turnDisplay.innerHTML = `<span style="color:${color};">${label}</span><br>${action}`;
  turnDisplay.style.display = "block";

  if (mpState.enabled) {
    import("./draft.js").then(({ _updateMpTurnIndicator }) => _updateMpTurnIndicator());
  }
}

export function highlightCurrentSlot() {
  document.querySelectorAll(".slot.current-pick, .ban-slot.current-pick")
    .forEach(s => s.classList.remove("current-pick"));

  if (state.currentStep >= state.currentDraftOrder.length) {
    updateFearlessRestrictions();
    return;
  }

  const step = state.currentDraftOrder[state.currentStep];

  if (step.type === "ban") {
    const bansContainer = document.getElementById(`bans-${step.team}`);
    if (bansContainer) {
      const slot = Array.from(bansContainer.querySelectorAll(".ban-slot"))
                        .find(s => !s.querySelector("img"));
      if (slot) slot.classList.add("current-pick");
    }
  } else {
    const picksContainer = document.getElementById(`picks-${step.team}`);
    if (picksContainer) {
      const slot = Array.from(picksContainer.querySelectorAll(".slot"))
                        .find(s => !s.querySelector("img"));
      if (slot) slot.classList.add("current-pick");
    }
  }

  updateFearlessRestrictions();
}

export function updateFearlessRestrictions() {
  state.allImages.forEach(img => img.classList.remove("fearless-blocked"));
  if (!state.fearlessMode || state.currentStep >= state.currentDraftOrder.length) return;

  const step = state.currentDraftOrder[state.currentStep];
  if (step.type !== "pick") return;

  const teamSet = step.team === "teamA" ? fearlessTeamA : fearlessTeamB;
  state.allImages.forEach(img => {
    if (teamSet.has(img.dataset.file) && !img.classList.contains("used")) {
      img.classList.add("fearless-blocked");
    }
  });
}

export function resetDraftSlots() {
  ["teamA", "teamB"].forEach(teamId => {
    const col = document.getElementById(`picks-${teamId}`);
    if (col) {
      col.querySelectorAll(".slot").forEach(slot => {
        slot.innerHTML = state.langData.pick || "Pick";
        slot.classList.remove("current-pick");
      });
    }
    const bans = document.getElementById(`bans-${teamId}`);
    if (bans) {
      bans.querySelectorAll(".ban-slot").forEach(slot => {
        slot.innerHTML = "";
        slot.classList.remove("current-pick", "filled");
      });
    }
  });
}

export function createRecapSlots(originalSlots, isBan = false) {
  const wrap = document.createElement("div");
  wrap.className = "slots " + (isBan ? "bans" : "picks");

  originalSlots.forEach(oldSlot => {
    const newSlot = document.createElement("div");
    newSlot.className = isBan ? "ban-slot filled" : "slot";

    const oldImg = oldSlot.querySelector("img");
    if (oldImg) {
      const img = document.createElement("img");
      img.src = oldImg.src;
      img.alt = oldImg.alt;
      img.style.cssText = "width:100%;height:100%;border-radius:6px;object-fit:cover;";
      if (isBan) img.style.opacity = "0.55";
      newSlot.appendChild(img);
    } else {
      if (!isBan) newSlot.textContent = state.langData.pick || "Pick";
    }
    wrap.appendChild(newSlot);
  });
  return wrap;
}

export function findNextBanSlot(team) {
  const container = document.getElementById(`bans-${team}`);
  if (!container) return null;
  return Array.from(container.querySelectorAll(".ban-slot")).find(s => !s.querySelector("img"));
}

export function findNextPickSlot(team) {
  const container = document.getElementById(`picks-${team}`);
  if (!container) return null;
  return Array.from(container.querySelectorAll(".slot")).find(s => !s.querySelector("img"));
}

export function getAllBanSlots(team) {
  const container = document.getElementById(`bans-${team}`);
  return container ? Array.from(container.querySelectorAll(".ban-slot")) : [];
}

export function getAllPickSlots(team) {
  const container = document.getElementById(`picks-${team}`);
  return container ? Array.from(container.querySelectorAll(".slot")) : [];
}

function _hideMpTurnIndicator() {
  const el = document.getElementById("mp-turn-indicator");
  if (el) el.style.display = "none";
}