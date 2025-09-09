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

// -------------------- Reset Draft Button --------------------
resetBtn.addEventListener('click', softResetDraft);


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
      document.getElementById('timer-label').textContent = data.timer_label;

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

// -------------------- Draft Logic --------------------
let currentStep = 0;
let selectedMode = null;
let currentDraftOrder = [];
let allImages = [];
let timerInterval;
let timeLeft = parseInt(timerInput.value) || 20;

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

startBtn.disabled = true;
startBtn.style.opacity = "0.5";

// -------------------- Mode Buttons --------------------
document.querySelectorAll('.mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedMode = btn.dataset.mode;
    currentDraftOrder = [...draftOrders[selectedMode]];
    resetDraft();

    startBtn.disabled = false;
    startBtn.style.opacity = "1";

    let title = "";
    let description = "";
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

  enableTimerCheckbox.style.display = "none";
  timerSettings.style.display = "none";
  timerInput.style.display = 'none';

  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.classList.add('disabled');
  });

  if (enableTimerCheckbox.checked) {
    timeLeft = parseInt(timerInput.value) || 20;
    bubbleTimer.textContent = `${timeLeft}s`;
    bubbleTimer.style.display = "block";
    startTimer();
  } else {
    bubbleTimer.textContent = "";
    bubbleTimer.style.display = "none";
  }

  highlightCurrentSlot();
});

// -------------------- Reset Draft --------------------
function resetDraft() {
  clearInterval(timerInterval);
  currentStep = 0;

  document.querySelectorAll(".slots .slot").forEach(slot => {
    slot.classList.remove('current-pick');
    const img = slot.querySelector('img');
    if (img) img.remove();
    if (slot.closest('.picks')) {
      slot.textContent = 'Pick';
    } else {
      slot.textContent = '';
    }
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
  timerInput.style.display = 'inline-block';
  timerSettings.style.display = enableTimerCheckbox.checked ? "flex" : "none";

  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.classList.remove('disabled');
    btn.classList.add('enabled');
  });
}

function softResetDraft() {
  clearInterval(timerInterval);
  currentStep = 0;

  document.querySelectorAll(".slots .slot img").forEach(img => img.remove());

  allImages.forEach(img => img.classList.remove("used"));
  
  currentDraftOrder = selectedMode ? [...draftOrders[selectedMode]] : [];

  bubbleTimer.textContent = currentLangData.waiting;
  bubbleTimer.style.display = "block";

  startBtn.style.display = 'inline-block';
  resetBtn.style.display = 'none';
  filtersDiv.style.display = 'none';
  gallerySection.style.display = 'none';
  draftSummary.style.display = 'none';
  startBtn.disabled = true;
  startBtn.style.opacity = "0.5";
  document.getElementById('final-draft').style.display = 'none';
  document.getElementById('final-draft-teams').innerHTML = '';

  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.classList.remove('active', 'disabled');
    btn.classList.add('enabled');
  });

  enableTimerCheckbox.style.display = "inline-block";
  timerInput.style.display = "inline-block";
  timerSettings.style.display = enableTimerCheckbox.checked ? "flex" : "none";

  loadLang(currentLang);

  allImages.forEach(img => img.style.display = "block");
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
fetch("mons.json")
  .then(res => res.json())
  .then(images => {
    images.forEach(file => {
      const img = document.createElement("img");
      img.src = `images/${file}`;
      img.alt = file.split(".")[0];
      img.dataset.role = getRoleFromName(file);
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
  });

function getRoleFromName(filename) {
  if (filename.includes("_def")) return "def";
  if (filename.includes("_atk")) return "atk";
  if (filename.includes("_sup")) return "sup";
  if (filename.includes("_spe")) return "spe";
  if (filename.includes("_all")) return "all";
  return "unknown";
}

// -------------------- Filter by Role --------------------
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
    bubbleTimer.style.display = "block";
  } else {
    timerSettings.style.display = "none";
    bubbleTimer.style.display = "none";
  }
});
