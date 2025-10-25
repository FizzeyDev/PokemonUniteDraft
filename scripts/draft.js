// -------------------- Variables Globales --------------------
let currentLang = localStorage.getItem("lang") || 'en';
let currentLangData = {};
const langButtons = document.querySelectorAll('.lang-btn');
const startBtn = document.getElementById('start-draft');
const resetBtn = document.getElementById('reset-draft');
const backBtn = document.getElementById('backBtn');
const modeTitle = document.getElementById('mode-title');
const modeText = document.getElementById('mode-text');
const bubbleTimer = document.getElementById('bubble-timer');
const enableTimerCheckbox = document.getElementById('enable-timer');
const timerSettings = document.getElementById('timer-settings');
const timerInput = document.getElementById('timer-value');
const filtersDiv = document.getElementById('filters');
const gallerySection = document.getElementById('gallery');
const draftSummary = document.getElementById('draft-summary');
const roleButtons = document.querySelectorAll('.filter-btn');
let currentStep = 0;
let selectedMode = null;
let currentDraftOrder = [];
let allImages = [];
let timerInterval;
let timeLeft = parseInt(timerInput.value) || 20;

// Charger les données de langue au démarrage
fetch(`lang/${currentLang}.json`)
  .then(res => res.json())
  .then(data => {
    currentLangData = data;
    updateDynamicContent();
  });

// -------------------- Draft Orders --------------------
const draftOrders = {
  classic: [
    { team: "teamA", type: "ban" }, { team: "teamB", type: "ban" },
    { team: "teamA", type: "ban" }, { team: "teamB", type: "ban" },
    { team: "teamA", type: "ban" }, { team: "teamB", type: "ban" },
    { team: "teamA", type: "pick" }, { team: "teamB", type: "pick" },
    { team: "teamB", type: "pick" }, { team: "teamA", type: "pick" },
    { team: "teamA", type: "pick" }, { team: "teamB", type: "pick" },
    { team: "teamB", type: "pick" }, { team: "teamA", type: "pick" },
    { team: "teamA", type: "pick" }, { team: "teamB", type: "pick" }
  ],
  "swap-ban": [
    { team: "teamA", type: "ban" }, { team: "teamB", type: "ban" },
    { team: "teamB", type: "ban" }, { team: "teamA", type: "ban" },
    { team: "teamA", type: "ban" }, { team: "teamB", type: "ban" },
    { team: "teamA", type: "pick" }, { team: "teamB", type: "pick" },
    { team: "teamB", type: "pick" }, { team: "teamA", type: "pick" },
    { team: "teamA", type: "pick" }, { team: "teamB", type: "pick" },
    { team: "teamB", type: "pick" }, { team: "teamA", type: "pick" },
    { team: "teamA", type: "pick" }, { team: "teamB", type: "pick" }
  ],
  reban: [
    { team: "teamA", type: "ban" }, { team: "teamB", type: "ban" },
    { team: "teamA", type: "ban" }, { team: "teamB", type: "ban" },
    { team: "teamA", type: "pick" }, { team: "teamB", type: "pick" },
    { team: "teamB", type: "pick" }, { team: "teamA", type: "pick" },
    { team: "teamA", type: "pick" }, { team: "teamB", type: "pick" },
    { team: "teamA", type: "ban" }, { team: "teamB", type: "ban" },
    { team: "teamB", type: "pick" }, { team: "teamA", type: "pick" },
    { team: "teamA", type: "pick" }, { team: "teamB", type: "pick" }
  ],
  tournament: [
    { team: "teamA", type: "ban" }, { team: "teamB", type: "ban" },
    { team: "teamA", type: "ban" }, { team: "teamB", type: "ban" },
    { team: "teamA", type: "pick" }, { team: "teamB", type: "pick" },
    { team: "teamB", type: "pick" }, { team: "teamA", type: "pick" },
    { team: "teamA", type: "pick" }, { team: "teamB", type: "pick" },
    { team: "teamB", type: "pick" }, { team: "teamA", type: "pick" },
    { team: "teamA", type: "pick" }, { team: "teamB", type: "pick" }
  ]
};

// -------------------- Buttons Initial State --------------------
startBtn.disabled = true;
startBtn.style.opacity = "0.5";
resetBtn.addEventListener('click', softResetDraft);

// -------------------- Mode Buttons --------------------
document.querySelectorAll('.mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedMode = btn.dataset.mode;
    currentDraftOrder = [...draftOrders[selectedMode]];
    resetDraft(true);

    startBtn.disabled = false;
    startBtn.style.opacity = "1";

    let titleKey = "", descriptionKey = "";
    if (selectedMode === "classic") {
      titleKey = "mode_classic";
      descriptionKey = "tooltip_classic";
    } else if (selectedMode === "swap-ban") {
      titleKey = "mode_swap";
      descriptionKey = "tooltip_swap";
    } else if (selectedMode === "reban") {
      titleKey = "mode_reban";
      descriptionKey = "tooltip_reban";
    } else if (selectedMode === "tournament") {
      titleKey = "mode_tournament";
      descriptionKey = "tooltip_tournament";
      const banSlotsA = document.querySelectorAll("#teamA .slots.bans .slot");
      const banSlotsB = document.querySelectorAll("#teamB .slots.bans .slot");

      if (banSlotsA.length > 0) banSlotsA[banSlotsA.length - 1].style.display = "none";
      if (banSlotsB.length > 0) banSlotsB[banSlotsB.length - 1].style.display = "none";
    }

    if (selectedMode !== "tournament") {
      const banSlotsA = document.querySelectorAll("#teamA .slots.bans .slot");
      const banSlotsB = document.querySelectorAll("#teamB .slots.bans .slot");

      banSlotsA[banSlotsA.length - 1].style.display = "block";
      banSlotsB[banSlotsB.length - 1].style.display = "block";
    }

    modeTitle.innerHTML = `<strong>${currentLangData[titleKey] || titleKey}</strong>`;
    modeText.textContent = currentLangData[descriptionKey] || descriptionKey;
  });
});

// -------------------- Start Draft --------------------
startBtn.addEventListener('click', () => {
  if (!selectedMode) return;

  startBtn.style.display = 'none';
  resetBtn.style.display = 'inline-block';
  filtersDiv.style.display = 'flex';
  gallerySection.style.display = 'grid';
  draftSummary.style.display = 'none';
  document.getElementById("sort-options").style.display = "block";

  enableTimerCheckbox.style.display = "none";
  timerSettings.style.display = "none";
  timerInput.style.display = 'none';

  document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.add('disabled'));

  const timerEnabled = enableTimerCheckbox.checked;
  if (timerEnabled) {
    timeLeft = parseInt(timerInput.value) || 20;
    bubbleTimer.textContent = `${timeLeft}s`;
    bubbleTimer.style.display = "block";
    startTimer();
  } else {
    bubbleTimer.textContent = currentLangData.waiting || "Waiting...";
    bubbleTimer.style.display = "none";
  }

  highlightCurrentSlot();
  backBtn.style.display = "none";
});

// -------------------- Reset Functions --------------------
function resetDraft(modeChosen = false) {
  clearInterval(timerInterval);
  currentStep = 0;

  document.querySelectorAll(".slots .slot").forEach(slot => {
    slot.classList.remove('current-pick');
    const img = slot.querySelector('img');
    if (img) img.remove();
    slot.textContent = slot.closest('.picks') ? currentLangData.pick || 'Pick' : '';
  });

  allImages.forEach(img => {
    img.classList.remove("used");
    img.style.display = "block";
  });

  currentDraftOrder = selectedMode ? [...draftOrders[selectedMode]] : [];
  bubbleTimer.textContent = currentLangData.waiting || 'Waiting...';
  bubbleTimer.style.display = enableTimerCheckbox.checked ? "block" : "none";

  startBtn.style.display = 'inline-block';
  resetBtn.style.display = 'none';
  filtersDiv.style.display = 'none';
  gallerySection.style.display = 'none';
  if (draftSummary) draftSummary.style.display = 'none';

  const finalDiv = document.getElementById('final-draft');
  if (finalDiv) {
    finalDiv.style.display = 'none';
    const finalTeamsDiv = document.getElementById('final-draft-teams');
    if (finalTeamsDiv) finalTeamsDiv.innerHTML = '';
  }

  enableTimerCheckbox.style.display = "inline-block";
  timerInput.style.display = "inline-block";
  timerSettings.style.display = enableTimerCheckbox.checked ? "flex" : "none";

  if (modeChosen) {
    startBtn.disabled = false;
    startBtn.style.opacity = "1";
  } else {
    startBtn.disabled = true;
    startBtn.style.opacity = "0.5";
  }

  backBtn.style.display = "none";

  // Mettre à jour les textes dynamiques
  updateDynamicContent();
}

// -------------------- Undo Last Pick --------------------
backBtn.addEventListener('click', undoLastPick);

function undoLastPick() {
  if (currentStep <= 0) {
    backBtn.style.display = 'none';
    return;
  }

  const lastIndex = currentStep - 1;
  const step = currentDraftOrder[lastIndex];
  if (!step) return;

  const teamElem = document.getElementById(step.team);
  if (!teamElem) return;

  const slotSelector = `.slots.${step.type}s .slot`;
  const slots = Array.from(teamElem.querySelectorAll(slotSelector));
  const filledSlots = slots.filter(s => s.querySelector('img'));
  if (filledSlots.length === 0) return;

  const lastSlot = filledSlots[filledSlots.length - 1];
  const img = lastSlot.querySelector('img');
  if (!img) return;

  const srcFilename = img.src.split('/').pop();
  const galleryImg = allImages.find(g => g.src.split('/').pop() === srcFilename);
  if (galleryImg) galleryImg.classList.remove('used');

  lastSlot.removeChild(img);
  if (lastSlot.closest('.picks')) lastSlot.textContent = currentLangData.pick || 'Pick';
  else if (lastSlot.closest('.bans')) lastSlot.textContent = '';

  currentStep = lastIndex;
  highlightCurrentSlot();

  backBtn.style.display = currentStep > 0 ? 'inline-block' : 'none';
}

// -------------------- Soft Reset Draft --------------------
function softResetDraft() {
  clearInterval(timerInterval);
  currentStep = 0;
  timeLeft = parseInt(timerInput.value) || 20;

  document.querySelectorAll(".slots .slot img").forEach(img => img.remove());
  document.getElementById("sort-options").style.display = "none";
  backBtn.style.display = "none";

  document.querySelectorAll(".slots .slot").forEach(slot => {
    if (slot.closest(".picks")) {
      slot.textContent = currentLangData.pick || "Pick";
    } else if (slot.closest(".bans")) {
      slot.textContent = "";
    } else {
      slot.textContent = "";
    }
  });

  allImages.forEach(img => {
    img.classList.remove("used");
    img.style.display = "block";
  });

  currentDraftOrder = selectedMode ? [...draftOrders[selectedMode]] : [];

  bubbleTimer.textContent = currentLangData.waiting || "Waiting...";
  bubbleTimer.style.display = "block";

  document.querySelectorAll('.slot').forEach(slot => slot.classList.remove('current-pick'));

  startBtn.style.display = 'inline-block';
  resetBtn.style.display = 'none';
  filtersDiv.style.display = 'none';
  gallerySection.style.display = 'none';
  draftSummary.style.display = 'none';
  startBtn.disabled = true;
  startBtn.style.opacity = "0.5";

  const finalDiv = document.getElementById('final-draft');
  if (finalDiv) finalDiv.style.display = 'none';
  document.getElementById('final-draft-teams').innerHTML = '';

  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.classList.remove('active', 'disabled');
    btn.classList.add('enabled');
  });

  enableTimerCheckbox.style.display = "inline-block";
  timerInput.style.display = "inline-block";
  timerSettings.style.display = enableTimerCheckbox.checked ? "flex" : "none";

  updateDynamicContent();
}

// -------------------- Timer --------------------
function startTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timeLeft--;
    bubbleTimer.textContent = `${timeLeft}s`;
    if (timeLeft <= 0) {
      currentStep++;
      if (currentStep >= currentDraftOrder.length) {
        endDraft();
        return;
      }
      timeLeft = parseInt(timerInput.value) || 20;
      bubbleTimer.textContent = `${timeLeft}s`;
      highlightCurrentSlot();
    }
  }, 1000);
}

// -------------------- Highlight Current Slot --------------------
function highlightCurrentSlot() {
  document.querySelectorAll('.slot').forEach(slot => slot.classList.remove('current-pick'));
  if (currentStep < currentDraftOrder.length) {
    const step = currentDraftOrder[currentStep];
    const team = document.getElementById(step.team);
    const slot = Array.from(team.querySelectorAll(`.slots.${step.type}s .slot`))
      .find(s => !s.querySelector("img"));
    if (slot) slot.classList.add('current-pick');
  } else {
    endDraft();
  }
}

// -------------------- End Draft --------------------
function endDraft() {
  clearInterval(timerInterval);

  backBtn.style.display = 'none';
  filtersDiv.style.display = 'none';
  gallerySection.style.display = 'none';
  document.querySelectorAll('.slot').forEach(slot => slot.classList.remove('current-pick'));
  document.getElementById('sort-options').style.display = 'none';
  bubbleTimer.textContent = currentLangData.waiting || "Waiting...";

  const finalDiv = document.getElementById('final-draft');
  const finalTeamsDiv = document.getElementById('final-draft-teams');
  finalDiv.style.display = 'block';
  finalTeamsDiv.innerHTML = '';

  document.getElementById('final-draft-title').textContent = currentLangData.final_draft_title || "Final Draft Result";

  ["teamA", "teamB"].forEach(teamId => {
    const teamElem = document.getElementById(teamId);
    const teamName = currentLangData[teamId === "teamA" ? "team_purple" : "team_orange"] || teamElem.querySelector("h2").textContent;

    const teamContainer = document.createElement("div");
    teamContainer.style.textAlign = "center";

    const title = document.createElement("h3");
    title.textContent = teamName;
    teamContainer.appendChild(title);

    const picks = teamElem.querySelector(".slots.picks").cloneNode(true);
    const bans = teamElem.querySelector(".slots.bans").cloneNode(true);

    teamContainer.appendChild(bans);
    teamContainer.appendChild(picks);

    finalTeamsDiv.appendChild(teamContainer);
  });
}

// -------------------- Gallery & Picks --------------------
let monsData = [];
let currentSort = "dex";

fetch("mons.json")
  .then(res => res.json())
  .then(data => {
    monsData = data;
    renderGallery();
  });

// Dans la fonction renderGallery
function renderGallery() {
  gallerySection.innerHTML = "";
  allImages = [];

  let sorted = [...monsData];

  if (currentSort === "name") {
    if (currentLang === "fr") {
      sorted.sort((a, b) => a.name_fr.localeCompare(b.name_fr));
    } else if (currentLang === "es") {
      sorted.sort((a, b) => a.name_es.localeCompare(b.name_es));
    } else if (currentLang === "de") {
      sorted.sort((a, b) => a.name_de.localeCompare(b.name_de));
    } else if (currentLang === "it") {
      sorted.sort((a, b) => a.name_it.localeCompare(b.name_it));
    } else {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
  } else if (currentSort === "dex") {
    sorted.sort((a, b) => a.dex - b.dex);
  }

  sorted.forEach(mon => {
    const img = document.createElement("img");
    img.src = `images/${mon.file}`;
    img.alt = currentLang === "fr" ? mon.name_fr :
              currentLang === "es" ? mon.name_es :
              currentLang === "de" ? mon.name_de :
              currentLang === "it" ? mon.name_it : mon.name;
    img.dataset.role = mon.role;
    img.dataset.dex = mon.dex;
    img.dataset.name = mon.name;
    img.dataset.nameFr = mon.name_fr;
    img.dataset.nameEs = mon.name_es;
    img.dataset.nameDe = mon.name_de;
    img.dataset.nameIt = mon.name_it;

    const alreadyPicked = document.querySelector(
      `.slots img[data-dex="${mon.dex}"][data-file="${mon.file}"]`
    );
    if (alreadyPicked) {
      img.classList.add("used");
    }

    img.addEventListener("click", () => {
      if (currentStep >= currentDraftOrder.length || img.classList.contains("used")) return;
      const step = currentDraftOrder[currentStep];
      const team = document.getElementById(step.team);
      const slot = Array.from(team.querySelectorAll(`.slots.${step.type}s .slot`))
        .find(s => !s.querySelector("img"));
      if (slot) {
        const chosen = img.cloneNode(true);
        chosen.classList.add("selected-slot");
        chosen.dataset.file = mon.file; // Ajouter pour identifier les formes multiples
        slot.innerHTML = "";
        slot.appendChild(chosen);
        img.classList.add("used");
        currentStep++;
        backBtn.style.display = currentStep > 0 ? "inline-block" : "none";
        if (currentStep >= currentDraftOrder.length) {
          endDraft();
          return;
        }
        if (enableTimerCheckbox.checked) {
          timeLeft = parseInt(timerInput.value) || 20;
          bubbleTimer.textContent = `${timeLeft}s`;
        }
        highlightCurrentSlot();
      }
    });

    gallerySection.appendChild(img);
    allImages.push(img);
  });
}

// -------------------- Sorting --------------------
const sortSelect = document.getElementById("sort-select");
sortSelect.addEventListener("change", (e) => {
  currentSort = e.target.value;
  renderGallery();
});

// -------------------- Role Filtering --------------------
roleButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const role = btn.dataset.role;
    allImages.forEach(img => {
      img.style.display = (role === "all" || img.dataset.role === role) ? "block" : "none";
    });
  });
});

// -------------------- Enable Timer Toggle --------------------
enableTimerCheckbox.addEventListener("change", () => {
  if (enableTimerCheckbox.checked) {
    timerSettings.style.display = "flex";
    if (currentStep < currentDraftOrder.length) startTimer();
    bubbleTimer.style.display = "block";
  } else {
    timerSettings.style.display = "none";
    bubbleTimer.style.display = "none";
    clearInterval(timerInterval);
  }
});