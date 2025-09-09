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
      document.getElementById('footer-signature').textContent = currentLangData.footer_signature;
      document.getElementById('footer-legal').textContent = currentLangData.footer_legal;

      modeTitle.textContent = data.select_mode_title;
      modeText.textContent = data.select_mode_text;
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
  timerInput.style.display = 'none';

  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.classList.add('disabled');
  });

  timeLeft = parseInt(timerInput.value) || 20;
  bubbleTimer.textContent = `${timeLeft}s`;

  startTimer();
  highlightCurrentSlot();
});


// -------------------- Timer --------------------
function startTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timeLeft--;
    bubbleTimer.textContent = `${timeLeft}s`;
    if (timeLeft <= 0) {
      currentStep++;
      timeLeft = parseInt(timerInput.value) || 20;
      bubbleTimer.textContent = `${timeLeft}s`;
      highlightCurrentSlot();
    }
  }, 1000);
}

// -------------------- Reset Draft --------------------
resetBtn.addEventListener('click', resetDraft);

function resetDraft() {
  clearInterval(timerInterval);
  currentStep = 0;
  document.querySelectorAll(".slots .slot img").forEach(img => img.remove());
  allImages.forEach(img => img.classList.remove("used"));
  currentDraftOrder = selectedMode ? [...draftOrders[selectedMode]] : [];
  bubbleTimer.textContent = 'Waiting...';
  startBtn.style.display = 'inline-block';
  resetBtn.style.display = 'none';
  filtersDiv.style.display = 'none';
  gallerySection.style.display = 'none';
  timerInput.style.display = 'inline-block';
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.classList.remove('disabled');
    btn.classList.add('enabled');
  });
}

// -------------------- Highlight --------------------
function highlightCurrentSlot() {
  document.querySelectorAll('.slot').forEach(slot => slot.classList.remove('current-pick'));
  if (currentStep < currentDraftOrder.length) {
    const step = currentDraftOrder[currentStep];
    const team = document.getElementById(step.team);
    const slot = Array.from(team.querySelectorAll(`.slots.${step.type}s .slot`))
      .find(s => !s.querySelector("img"));
    if (slot) slot.classList.add('current-pick');
  }
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
          timeLeft = parseInt(timerInput.value) || 20;
          bubbleTimer.textContent = `${timeLeft}s`;
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

// -------------------- Filter by role --------------------
document.querySelectorAll(".filter-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const role = btn.dataset.role;
    allImages.forEach(img => {
      img.style.display = (role === "unknown" || img.dataset.role === role) ? "block" : "none";
    });
  });
});
