import { state, fearlessTeamA, fearlessTeamB } from "./state.js";

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
    return;
  }
  const step  = state.currentDraftOrder[state.currentStep];
  const label = step.team === "teamA" ? "Purple Team" : "Orange Team";
  const color = step.team === "teamA" ? "#9f53ec" : "#ffa500";
  const action = step.type === "ban" ? "to Ban" : "to Pick";
  turnDisplay.innerHTML = `<span style="color:${color};">${label}</span> ${action}`;
  turnDisplay.style.display = "block";
}

export function highlightCurrentSlot() {
  document.querySelectorAll(".slot").forEach(s => s.classList.remove("current-pick"));

  if (state.currentStep < state.currentDraftOrder.length) {
    const step = state.currentDraftOrder[state.currentStep];
    const team = document.getElementById(step.team);
    const slot = Array.from(team.querySelectorAll(`.slots.${step.type}s .slot`))
      .find(s => !s.querySelector("img"));
    if (slot) slot.classList.add("current-pick");
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
    const team = document.getElementById(teamId);
    if (!team) return;
    team.querySelectorAll(".slots .slot").forEach(slot => {
      slot.innerHTML = slot.closest(".picks") ? (state.langData.pick || "Pick") : "";
      slot.classList.remove("current-pick");
    });
  });
}

export function createRecapSlots(originalSlots, isBan = false) {
  const wrap = document.createElement("div");
  wrap.className = "slots " + (isBan ? "bans" : "picks");

  originalSlots.forEach(oldSlot => {
    const newSlot = document.createElement("div");
    newSlot.className = "slot" + (isBan ? " ban" : "");

    const oldImg = oldSlot.querySelector("img");
    if (oldImg) {
      const img      = document.createElement("img");
      img.src         = oldImg.src;
      img.alt         = oldImg.alt;
      img.style.cssText = "width:100%;height:100%;border-radius:6px;object-fit:cover;";
      if (isBan) img.style.opacity = "0.6";
      newSlot.appendChild(img);
    } else {
      newSlot.textContent = isBan ? "" : (state.langData.pick || "Pick");
    }
    wrap.appendChild(newSlot);
  });
  return wrap;
}
