// -------------------- Language Handling --------------------
let currentLang = 'en';
let currentLangData = {};
const langBtn = document.getElementById('lang-toggle');
const startBtn = document.getElementById('start-draft');
const resetBtn = document.getElementById('reset-draft');
const timerInput = document.getElementById('timer-value');
const bubbleTimer = document.getElementById('bubble-timer');
const filtersDiv = document.getElementById('filters');
const gallerySection = document.getElementById('gallery');
const modeTitle = document.getElementById('mode-title');
const modeText = document.getElementById('mode-text');
const roleButtons = document.querySelectorAll('.filter-btn');
const enableTimerCheckbox = document.getElementById('enable-timer');
const timerSettings = document.getElementById('timer-settings');
const draftSummary = document.getElementById('draft-summary');
const summaryTeams = document.getElementById('summary-teams');
const backBtn = document.getElementById('backBtn');

// -------------------- Timer Variables --------------------
let currentStep = 0;
let selectedMode = null;
let currentDraftOrder = [];
let allImages = [];
let timerInterval;
let timeLeft = parseInt(timerInput.value) || 20;

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
  ]
};

// -------------------- Buttons Initial State --------------------
startBtn.disabled = true;
startBtn.style.opacity = "0.5";
resetBtn.addEventListener('click', softResetDraft);

// -------------------- Language Loader --------------------
function loadLang(lang) {
  fetch(`lang/${lang}.json`)
    .then(res => res.json())
    .then(data => {
      currentLangData = data;

      document.getElementById('title').textContent = data.title;
      document.querySelector('.mode-btn[data-mode="classic"]').textContent = data.mode_classic;
      document.querySelector('.mode-btn[data-mode="swap-ban"]').textContent = data.mode_swap;
      document.querySelector('.mode-btn[data-mode="reban"]').textContent = data.mode_reban;

      document.getElementById('teamA-name').textContent = data.teamA;
      document.getElementById('teamB-name').textContent = data.teamB;
      document.getElementById('timer-label').textContent = data.enable_timer;

      modeTitle.textContent = data.select_mode_title;
      modeText.textContent = data.select_mode_text;

      bubbleTimer.textContent = data.waiting;

      roleButtons.forEach(btn => {
        const role = btn.dataset.role;
        switch(role) {
          case 'def': btn.textContent = data.role_def; break;
          case 'atk': btn.textContent = data.role_atk; break;
          case 'sup': btn.textContent = data.role_sup; break;
          case 'spe': btn.textContent = data.role_spe; break;
          case 'all': btn.textContent = data.role_all; break;
          case 'unknown': btn.textContent = data.role_unknown; break;
        }
      });

      document.getElementById('footer-signature').textContent = data.footer_signature;
      document.getElementById('footer-legal').textContent = data.footer_legal;
      draftSummary.querySelector("h2").textContent = data.draft_recap || "Draft Recap";
    });
}

langBtn.addEventListener('click', () => {
  currentLang = currentLang === 'en' ? 'fr' : 'en';
  langBtn.dataset.lang = currentLang;
  langBtn.textContent = currentLang === 'en' ? 'EN' : 'FR';
  loadLang(currentLang);
});

loadLang(currentLang);

// -------------------- Mode Buttons --------------------
document.querySelectorAll('.mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedMode = btn.dataset.mode;
    currentDraftOrder = [...draftOrders[selectedMode]];
    resetDraft(true); // true = mode choisi, Start peut s’activer

    startBtn.disabled = false;
    startBtn.style.opacity = "1";

    let title = "", description = "";
    if (selectedMode === "classic") {
      title = currentLangData.mode_classic;
      description = currentLangData.tooltip_classic;
    } else if (selectedMode === "swap-ban") {
      title = currentLangData.mode_swap;
      description = currentLangData.tooltip_swap;
    } else if (selectedMode === "reban") {
      title = currentLangData.mode_reban;
      description = currentLangData.tooltip_reban;
    }

    modeTitle.innerHTML = `<strong>${title}</strong>`;
    modeText.textContent = description;
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
    bubbleTimer.textContent = "";
    bubbleTimer.style.display = "none";
  }

  highlightCurrentSlot();
  backBtn.style.display = "none"; // Back caché au début
});

// -------------------- Reset Functions --------------------
function resetDraft(modeChosen = false) {
  clearInterval(timerInterval);
  currentStep = 0;

  document.querySelectorAll(".slots .slot").forEach(slot => {
    slot.classList.remove('current-pick');
    const img = slot.querySelector('img');
    if (img) img.remove();
    slot.textContent = slot.closest('.picks') ? 'Pick' : '';
  });

  allImages.forEach(img => {
    img.classList.remove("used");
    img.style.display = "block";
  });

  currentDraftOrder = selectedMode ? [...draftOrders[selectedMode]] : [];
  bubbleTimer.textContent = currentLangData.waiting || '';
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

  // ⚠️ Activation du Start seulement si un mode est choisi
  if (modeChosen) {
    startBtn.disabled = false;
    startBtn.style.opacity = "1";
  } else {
    startBtn.disabled = true;
    startBtn.style.opacity = "0.5";
  }

  backBtn.style.display = "none"; // Back caché tant qu’aucun pick
}

// -------------------- Undo Last Pick --------------------
if (backBtn) {
  backBtn.addEventListener('click', undoLastPick);
}

function undoLastPick() {
  if (currentStep <= 0) {
    if (backBtn) backBtn.style.display = 'none';
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
  if (lastSlot.closest('.picks')) lastSlot.textContent = 'Pick';
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
      slot.textContent = "Pick";
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

  bubbleTimer.textContent = currentLangData.waiting;
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

  loadLang(currentLang);
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
  document.getElementById('timer-options').style.display = 'none';
  bubbleTimer.textContent = currentLangData.waiting;

  const finalDiv = document.getElementById('final-draft');
  const finalTeamsDiv = document.getElementById('final-draft-teams');
  finalDiv.style.display = 'block';
  finalTeamsDiv.innerHTML = '';

  document.getElementById('final-draft-title').textContent =
    currentLang === 'en' ? "Final Draft Result" : "Résultat de la Draft";

  ["teamA", "teamB"].forEach(teamId => {
    const teamElem = document.getElementById(teamId);
    const teamName = teamElem.querySelector("h2").textContent;

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

function renderGallery() {
  gallerySection.innerHTML = "";
  allImages = [];

  let sorted = [...monsData];
  if (currentSort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
  else if (currentSort === "dex") sorted.sort((a, b) => a.dex - b.dex);

  sorted.forEach(mon => {
    const img = document.createElement("img");
    img.src = `images/${mon.file}`;
    img.alt = mon.name;
    img.dataset.role = mon.role;
    img.dataset.dex = mon.dex;
    img.dataset.name = mon.name;

    img.addEventListener("click", () => {
      if (currentStep >= currentDraftOrder.length || img.classList.contains("used")) return;
      const step = currentDraftOrder[currentStep];
      const team = document.getElementById(step.team);
      const slot = Array.from(team.querySelectorAll(`.slots.${step.type}s .slot`))
        .find(s => !s.querySelector("img"));
      if (slot) {
        const chosen = img.cloneNode(true);
        chosen.classList.add('selected-slot');
        slot.innerHTML = "";
        slot.appendChild(chosen);
        img.classList.add("used");
        currentStep++;
        backBtn.style.display = currentStep > 0 ? 'inline-block' : 'none';
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
document.querySelectorAll(".filter-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const role = btn.dataset.role;
    allImages.forEach(img => {
      img.style.display = (role === "unknown" || img.dataset.role === role) ? "block" : "none";
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
