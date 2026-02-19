import { state } from "./state.js";
import { highlightCurrentSlot } from "./ui.js";
import { endDraft } from "./draft.js";

export function startTimer() {
  clearInterval(state.timerInterval);
  state.timerInterval = setInterval(() => {
    state.timeLeft--;
    document.getElementById("bubble-timer").textContent = `${state.timeLeft}s`;

    if (state.timeLeft <= 0) {
      state.currentStep++;
      if (state.currentStep >= state.currentDraftOrder.length) {
        endDraft();
        return;
      }
      state.timeLeft = parseInt(document.getElementById("timer-value").value) || 20;
      document.getElementById("bubble-timer").textContent = `${state.timeLeft}s`;
      highlightCurrentSlot();
    }
  }, 1000);
}

export function setupTimer() {
  const timerEnabled = document.getElementById("enable-timer").checked;
  if (timerEnabled) {
    state.timeLeft = parseInt(document.getElementById("timer-value").value) || 20;
    document.getElementById("bubble-timer").textContent = `${state.timeLeft}s`;
    document.getElementById("bubble-timer").style.display = "block";
    startTimer();
  } else {
    document.getElementById("bubble-timer").style.display = "none";
  }
}
