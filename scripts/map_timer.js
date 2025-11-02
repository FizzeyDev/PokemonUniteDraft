const playBtn = document.getElementById("play-btn");
const minutesInput = document.getElementById("minutes");
const secondsInput = document.getElementById("seconds");
const timeSlider = document.getElementById("time-slider");
const spawnsContainer = document.getElementById("spawns-container");
const towersContainer = document.getElementById("towers-container");

// Tooltip global
const tooltip = document.getElementById("pokemon-tooltip");
const tooltipGif = document.getElementById("tooltip-gif");
const tooltipName = document.getElementById("tooltip-name");
const tooltipText = document.getElementById("tooltip-text");

let totalTime = 600;
let currentTime = totalTime;
let timerRunning = false;
let timerInterval = null;
let spawns = [];
let towers = [];

// --- ALTARIA SYSTEM ---
let altariaState = {
  bot: { sequenceKey: null, seqIndex: -1, pending: null, active: null },
  top: { sequenceKey: null, seqIndex: -1, pending: null, active: null }
};

// === INITIALISATION ===
fetch("spawns.json")
  .then((response) => response.json())
  .then((data) => {
    spawns = data.pokemons.map((p) => ({
      ...p,
      originalName: p.name,
      originalImg: p.spawns?.[0]?.img || p.img,
      spawns:
        p.spawns?.map((s) => ({
          ...s,
          element: null,
          killed: false,
          killedTime: null
        })) || []
    }));

    towers = data.towers.map((t) => ({ ...t, element: null }));

    const altaria = spawns.find((p) => p.name === "Altaria");
    if (altaria && altaria.isSpecial) {
      ["top", "bot"].forEach((lane) => {
        initializeAltariaLane(lane, altaria);
      });
    }

    updateDisplay();
  })
  .catch((err) => console.error("Erreur JSON:", err));

// === AFFICHAGE / TIMER ===
function updateDisplay() {
  const m = Math.floor(currentTime / 60).toString().padStart(2, "0");
  const s = (currentTime % 60).toString().padStart(2, "0");
  minutesInput.value = m;
  secondsInput.value = s;
  timeSlider.value = currentTime;

  updateSpawns();
  updateTowers();
}

function startTimer() {
  timerRunning = true;
  playBtn.textContent = "Pause";
  timerInterval = setInterval(() => {
    if (currentTime > 0) {
      currentTime--;
      updateDisplay();
    } else stopTimer();
  }, 1000);
}

function stopTimer() {
  timerRunning = false;
  playBtn.textContent = "Play";
  clearInterval(timerInterval);
}

playBtn.addEventListener("click", () =>
  timerRunning ? stopTimer() : startTimer()
);
timeSlider.addEventListener("input", (e) => {
  currentTime = +e.target.value;
  updateDisplay();
});

function updateFromInputs() {
  let m = +minutesInput.value || 0;
  let s = +secondsInput.value || 0;
  if (s > 59) s = 59;
  if (m > 10) m = 10;
  currentTime = m * 60 + s;
  updateDisplay();
}
minutesInput.addEventListener("input", updateFromInputs);
secondsInput.addEventListener("input", updateFromInputs);

// === CONDITIONS TOURS ===
function isRemovedByTower(spawn) {
  if (!spawn.removeOnTowerBreak) return false;
  return towers.some(
    (t) => spawn.removeOnTowerBreak.includes(t.breakid) && t.destroyed
  );
}

function isSpawnedByTower(spawn) {
  if (!spawn.spawnOnTowerBreak) return true;
  return towers.some(
    (t) => spawn.spawnOnTowerBreak.includes(t.breakid) && t.destroyed
  );
}

function isTowerClickable(tower) {
  if (tower.destroyed) return false;
  if (!tower.requiresTowerBreak) return true;

  const requiredIds = Array.isArray(tower.requiresTowerBreak)
    ? tower.requiresTowerBreak
    : [tower.requiresTowerBreak];

  return requiredIds.every((reqId) =>
    towers.some((t) => t.breakid === reqId && t.destroyed)
  );
}

// === ALTARIA HELPERS ===
function getLaneT1State(lane) {
  const t1s = lane === "top" ? [3, 4] : [1, 2];
  const broken = towers.filter((t) => t1s.includes(t.breakid) && t.destroyed);
  const count = broken.length;
  if (count === 2) return { count: 2, spot: "center" };
  if (count === 1) {
    const id = broken[0].breakid;
    const spot =
      (lane === "bot" && id === 1) || (lane === "top" && id === 3)
        ? "left"
        : "right";
    return { count: 1, spot };
  }
  return { count: 0, spot: "center" };
}

function getAltariaPosition(lane, spot) {
  const altaria = spawns.find((p) => p.name === "Altaria");
  if (!altaria) return { x: 50, y: 50 };
  if (spot === "center") return altaria.lanes[lane];
  if (spot === "left") return altaria.t1Positions[lane].left;
  if (spot === "right") return altaria.t1Positions[lane].right;
  return altaria.lanes[lane];
}

// === ALTARIA INITIALIZATION ===
function initializeAltariaLane(lane, altaria) {
  const laneT1 = getLaneT1State(lane);
  const sequenceKey = laneT1.count.toString();
  const list = altaria.spawnLists[sequenceKey] || [];
  if (!list || list.length === 0) {
    console.warn(`[${lane}] No altaria spawn list for sequence ${sequenceKey}`);
    return;
  }
  altariaState[lane].sequenceKey = sequenceKey;
  altariaState[lane].seqIndex = -1;
  altariaState[lane].pending = {
    time: list[0],
    spot: laneT1.count === 1 ? laneT1.spot : "center",
    index: 0
  };
  console.log(
    `[${lane}] Initialized: seq=${sequenceKey}, pending=${list[0]} (idx 0), spot=${altariaState[lane].pending.spot}`
  );
}

// === ALTARIA KILL / RESPAWN ===
function registerNextAltariaSpawnOnKill(lane) {
  const altaria = spawns.find((p) => p.name === "Altaria");
  if (!altaria || !altaria.isSpecial) return;

  const state = altariaState[lane];
  if (!state.active || !state.active.killed) return;

  const lastSpawnTime = state.active.time;
  const laneT1 = getLaneT1State(lane);
  const sequenceKey = laneT1.count.toString();
  const list = altaria.spawnLists[sequenceKey] || [];
  const nextTime = list.find((t) => t < lastSpawnTime);
  if (nextTime == null) {
    console.log(
      `[${lane}] No more spawns available in sequence "${sequenceKey}"`
    );
    state.pending = null;
    return;
  }
  const spot = laneT1.count === 1 ? laneT1.spot : "center";
  state.pending = {
    time: nextTime,
    spot,
    sequenceKey,
    seqIndex: list.indexOf(nextTime)
  };
  console.log(
    `[${lane}] Next Altaria scheduled at ${nextTime}s (sequence "${sequenceKey}", spot: ${spot})`
  );
}

function spawnAltaria(lane) {
  const altaria = spawns.find((p) => p.name === "Altaria");
  if (!altaria) return false;
  const state = altariaState[lane];
  if (!state.pending) return false;
  if (state.active && !state.active.killed) {
    console.log(
      `[${lane}] Tried to spawn but active altaria present -> will SKIP (timing consumed)`
    );
    state.seqIndex = state.pending.index;
    state.pending = null;
    return false;
  }

  const time = state.pending.time;
  const spot = state.pending.spot;
  const index = state.pending.index;
  const pos = getAltariaPosition(lane, spot);

  const img = document.createElement("img");
  img.src = altaria.img;
  img.classList.add("spawn", "altaria");
  img.style.left = `${pos.x}%`;
  img.style.top = `${pos.y}%`;
  img.style.transform = "translate(-50%, -50%)";
  img.style.width = `${altaria.size}px`;
  img.style.height = `${altaria.size}px`;
  img.title = `Altaria (${lane}) - ${time}s`;

  // === TOOLTIP ALTARIA ===
  let hoverTimer = null;
  img.addEventListener("mouseenter", () => {
    hoverTimer = setTimeout(() => {
      const rect = img.getBoundingClientRect();
      const mapRect = document.querySelector(".map-container").getBoundingClientRect();
      let x = rect.left - mapRect.left + rect.width / 2;
      let y = rect.top - mapRect.top - 10;
      const tooltipWidth = 400, tooltipHeight = 140;
      if (x + tooltipWidth > mapRect.width) x = mapRect.width - tooltipWidth - 20;
      if (x < 20) x = 20;
      if (y - tooltipHeight < 0) y = rect.bottom - mapRect.top + 10;

      tooltip.style.left = `${x}px`;
      tooltip.style.top = `${y}px`;
      tooltipName.textContent = "Altaria";
      tooltipGif.src = altaria.gif || altaria.img;
      
      
      tooltipText.innerHTML = `<p><strong>Altaria</strong> spawn depend on the tower break.</p>`;
      tooltip.classList.add("show");
    }, 1000);
  });
  img.addEventListener("mouseleave", () => {
    clearTimeout(hoverTimer);
    tooltip.classList.remove("show");
  });

  img.addEventListener("click", () => {
    const s = altariaState[lane].active;
    if (s && !s.killed) {
      s.killed = true;
      s.killedTime = currentTime;

      if (s.element && spawnsContainer.contains(s.element)) {
        spawnsContainer.removeChild(s.element);
      }

      registerNextAltariaSpawnOnKill(lane);
      altariaState[lane].active = null;
      tooltip.classList.remove("show");
      console.log(`[${lane}] Altaria killed at ${currentTime}s`);
      updateDisplay();
    }
  });

  spawnsContainer.appendChild(img);
  state.active = { time, element: img, killed: false, killedTime: null };
  state.seqIndex = index;
  state.pending = null;

  console.log(
    `[${lane}] Altaria spawned at ${time}s (idx ${index}) spot=${spot}`
  );
  return true;
}

function updateAltariaSpawns() {
  const altaria = spawns.find((p) => p.name === "Altaria");
  if (!altaria?.isSpecial) return;

  ["top", "bot"].forEach((lane) => {
    const state = altariaState[lane];
    if (!state) return;
    if (state.pending && currentTime === state.pending.time) {
      spawnAltaria(lane);
    }
    if (state.active?.killed && state.active.element) {
      if (spawnsContainer.contains(state.active.element)) {
        spawnsContainer.removeChild(state.active.element);
      }
      state.active.element = null;
    }
  });
}

// === Sitrus special behavior (respawn only before 5 minutes) ===
function updateSitrusSpawn(pokemon) {
  pokemon.spawns.forEach((spawn) => {
    const before5Minutes = currentTime > 300;
    const isSpawnTime = currentTime <= spawn.time;
    const isTowerConditionMet =
      isSpawnedByTower(spawn) && !isRemovedByTower(spawn);

    if (isSpawnTime && isTowerConditionMet && !spawn.element && !spawn.killed) {
      const img = document.createElement("img");
      img.src = spawn.img;
      img.classList.add("spawn", "sitrus");
      img.style.left = `${spawn.xPercent}%`;
      img.style.top = `${spawn.yPercent}%`;
      img.style.transform = "translate(-50%, -50%)";
      img.title = `Sitrus Berry`;
      img.style.width = `${spawn.size || 40}px`;
      img.style.height = `${spawn.size || 40}px`;

      // === TOOLTIP SITRUS ===
      let hoverTimer = null;
      img.addEventListener("mouseenter", () => {
        hoverTimer = setTimeout(() => {
          const rect = img.getBoundingClientRect();
          const mapRect = document.querySelector(".map-container").getBoundingClientRect();
          let x = rect.left - mapRect.left + rect.width / 2;
          let y = rect.top - mapRect.top - 10;
          const tooltipWidth = 400, tooltipHeight = 140;
          if (x + tooltipWidth > mapRect.width) x = mapRect.width - tooltipWidth - 20;
          if (x < 20) x = 20;
          if (y - tooltipHeight < 0) y = rect.bottom - mapRect.top + 10;

          tooltip.style.left = `${x}px`;
          tooltip.style.top = `${y}px`;
          tooltipName.textContent = "Sitrus Berry";
          tooltipGif.src = "assets/maps/spawn/sitrus.png";
          tooltipText.innerHTML = `<p>Restore <strong>1500</strong> HP.</p><p>Sitrus Berry can't respawn after 5:00 and they disapeared when the corresponding tower is break.</p><p>When consumed, <strong>respawn after 1 minute</strong>.</p>`;
          tooltip.classList.add("show");
        }, 1000);
      });
      img.addEventListener("mouseleave", () => {
        clearTimeout(hoverTimer);
        tooltip.classList.remove("show");
      });

      img.addEventListener("click", () => {
        if (!spawn.killed) {
          spawn.killed = true;
          spawn.killedTime = currentTime;
          if (!before5Minutes) spawn.permanentDelete = true;
          if (spawn.element && spawnsContainer.contains(spawn.element)) {
            spawnsContainer.removeChild(spawn.element);
          }
          spawn.element = null;
          tooltip.classList.remove("show");
        }
      });

      spawnsContainer.appendChild(img);
      spawn.element = img;
    } else if (
      spawn.element &&
      (!isSpawnTime || !isTowerConditionMet || spawn.killed)
    ) {
      if (spawn.element && spawnsContainer.contains(spawn.element)) {
        spawnsContainer.removeChild(spawn.element);
      }
      spawn.element = null;
    }

    if (
      before5Minutes &&
      spawn.killed &&
      !spawn.permanentDelete &&
      spawn.killedTime &&
      spawn.time_before_respawn > 0 &&
      currentTime <= spawn.killedTime - spawn.time_before_respawn
    ) {
      spawn.killed = false;
      spawn.killedTime = null;
      const img = document.createElement("img");
      img.src = spawn.img;
      img.classList.add("spawn", "sitrus");
      img.style.left = `${spawn.xPercent}%`;
      img.style.top = `${spawn.yPercent}%`;
      img.style.transform = "translate(-50%, -50%)";
      img.title = `Sitrus Berry`;
      img.style.width = `${spawn.size || 40}px`;
      img.style.height = `${spawn.size || 40}px`;

      let hoverTimer = null;
      img.addEventListener("mouseenter", () => {
        hoverTimer = setTimeout(() => {
          const rect = img.getBoundingClientRect();
          const mapRect = document.querySelector(".map-container").getBoundingClientRect();
          let x = rect.left - mapRect.left + rect.width / 2;
          let y = rect.top - mapRect.top - 10;
          const tooltipWidth = 400, tooltipHeight = 140;
          if (x + tooltipWidth > mapRect.width) x = mapRect.width - tooltipWidth - 20;
          if (x < 20) x = 20;
          if (y - tooltipHeight < 0) y = rect.bottom - mapRect.top + 10;

          tooltip.style.left = `${x}px`;
          tooltip.style.top = `${y}px`;
          tooltipName.textContent = "Sitrus Berry";
          tooltipGif.src = "assets/maps/gifs/sitrus.gif";
          tooltipText.innerHTML = `<p>Restore <strong>1500</strong> HP.</p><p>Sitrus Berry can't respawn after 5:00 and they disapeared when the corresponding tower is break.</p>`;
          tooltip.classList.add("show");
        }, 1000);
      });
      img.addEventListener("mouseleave", () => {
        clearTimeout(hoverTimer);
        tooltip.classList.remove("show");
      });

      img.addEventListener("click", () => {
        if (!spawn.killed) {
          spawn.killed = true;
          spawn.killedTime = currentTime;
          if (!before5Minutes) spawn.permanentDelete = true;
          if (spawn.element && spawnsContainer.contains(spawn.element)) {
            spawnsContainer.removeChild(spawn.element);
          }
          spawn.element = null;
          tooltip.classList.remove("show");
        }
      });

      spawnsContainer.appendChild(img);
      spawn.element = img;
    }
  });
}

// === SPAWNS GLOBAUX ===
function updateSpawns() {
  spawns.forEach((pokemon) => {
    if (pokemon.name === "Sitrus") {
      updateSitrusSpawn(pokemon);
      return;
    }

    if (pokemon.name === "Altaria" && pokemon.isSpecial) {
      updateAltariaSpawns();
      return;
    }

    pokemon.spawns.forEach((spawn) => {
      const shouldEvolve =
        pokemon.evolution && currentTime <= pokemon.evolution.time && !spawn.killed;
      const shouldDevolve =
        pokemon.evolution && currentTime > pokemon.evolution.time && !spawn.killed;

      if (shouldEvolve && spawn.element) {
        spawn.element.src = pokemon.evolution.img;
        spawn.element.title = pokemon.evolution.name;
        pokemon.name = pokemon.evolution.name;
      } else if (shouldDevolve && spawn.element) {
        spawn.element.src = pokemon.originalImg;
        spawn.element.title = pokemon.originalName;
        pokemon.name = pokemon.originalName;
      }

      const isSpawnTime = currentTime <= spawn.time;
      const isBeforeDispawn =
        spawn.time_dispawn === 0 || currentTime > spawn.time_dispawn;
      const isRespawned = spawn.killedTime
        ? currentTime <= spawn.killedTime - (spawn.time_before_respawn || 0)
        : true;
      const isTowerConditionMet =
        isSpawnedByTower(spawn) && !isRemovedByTower(spawn);

      if (
        isSpawnTime &&
        isBeforeDispawn &&
        isRespawned &&
        isTowerConditionMet &&
        !spawn.element &&
        !spawn.killed
      ) {
        const img = document.createElement("img");
        img.src = shouldEvolve ? pokemon.evolution.img : pokemon.originalImg;
        img.classList.add("spawn");
        img.style.left = `${spawn.xPercent}%`;
        img.style.top = `${spawn.yPercent}%`;
        img.style.transform = "translate(-50%, -50%)";
        img.title = shouldEvolve ? pokemon.evolution.name : pokemon.originalName;
        img.style.width = `${spawn.size || 90}px`;
        img.style.height = `${spawn.size || 90}px`;

        // === TOOLTIP GÉNÉRAL ===
        let hoverTimer = null;
        img.addEventListener("mouseenter", () => {
          hoverTimer = setTimeout(() => {
            const rect = img.getBoundingClientRect();
            const mapRect = document.querySelector(".map-container").getBoundingClientRect();
            let x = rect.left - mapRect.left + rect.width / 2;
            let y = rect.top - mapRect.top - 10;
            const tooltipWidth = 400, tooltipHeight = 140;
            if (x + tooltipWidth > mapRect.width) x = mapRect.width - tooltipWidth - 20;
            if (x < 20) x = 20;
            if (y - tooltipHeight < 0) y = rect.bottom - mapRect.top + 10;

            tooltip.style.left = `${x}px`;
            tooltip.style.top = `${y}px`;

            const displayName = shouldEvolve ? pokemon.evolution.name : pokemon.originalName;
            tooltipName.textContent = displayName;
            tooltipGif.src = pokemon.gif || pokemon.originalImg;

            // INFO DYNAMIQUE DEPUIS LE SPAWN
            const spawnInfo = shouldEvolve 
              ? (pokemon.evolution?.info || `<p><strong>${displayName}</strong> (évolué)</p>`) 
              : (spawn.info || `<p><strong>${displayName}</strong></p><p>No specific information.</p>`);

            tooltipText.innerHTML = spawnInfo;

            tooltip.classList.add("show");
          }, 1000);
        });
        img.addEventListener("mouseleave", () => {
          clearTimeout(hoverTimer);
          tooltip.classList.remove("show");
        });

        img.addEventListener("click", () => {
          if (!spawn.killed) {
            spawn.killed = true;
            spawn.killedTime = currentTime;
            if (spawn.delete) {
              if (spawn.element && spawnsContainer.contains(spawn.element)) {
                spawnsContainer.removeChild(spawn.element);
              }
              spawn.element = null;
            } else {
              spawn.element.style.opacity = 0.5;
              spawn.element.style.filter = "grayscale(100%)";
              spawn.element.style.pointerEvents = "none";
            }
            tooltip.classList.remove("show");
          }
        });

        spawnsContainer.appendChild(img);
        spawn.element = img;
      } else if (
        spawn.element &&
        (!isSpawnTime ||
          !isBeforeDispawn ||
          !isRespawned ||
          !isTowerConditionMet ||
          spawn.killed)
      ) {
        if (spawn.element && spawnsContainer.contains(spawn.element)) {
          spawnsContainer.removeChild(spawn.element);
        }
        spawn.element = null;
      }

      if (
        spawn.killed &&
        spawn.killedTime &&
        spawn.time_before_respawn > 0 &&
        currentTime <= spawn.killedTime - spawn.time_before_respawn
      ) {
        spawn.killed = false;
        spawn.killedTime = null;
        if (spawn.element) {
          spawn.element.style.opacity = 1;
          spawn.element.style.filter = "none";
          spawn.element.style.pointerEvents = "auto";
        }
      }
    });
  });
}

// === TOURS ===
function updateTowers() {
  towers.forEach((tower) => {
    const clickable = isTowerClickable(tower);

    if (!tower.element) {
      const img = document.createElement("img");
      img.src = tower.destroyed ? tower.imgBroken : tower.img;
      img.classList.add("tower");
      img.style.left = `${tower.xPercent}%`;
      img.style.top = `${tower.yPercent}%`;
      img.style.transform = "translate(-50%, -50%)";
      img.title = tower.id;
      img.dataset.breakid = tower.breakid;

      // === TOOLTIP TOUR ===
      let hoverTimer = null;
      img.addEventListener("mouseenter", () => {
        hoverTimer = setTimeout(() => {
          const rect = img.getBoundingClientRect();
          const mapRect = document.querySelector(".map-container").getBoundingClientRect();
          let x = rect.left - mapRect.left + rect.width / 2;
          let y = rect.top - mapRect.top - 10;
          const tooltipWidth = 400, tooltipHeight = 140;
          if (x + tooltipWidth > mapRect.width) x = mapRect.width - tooltipWidth - 20;
          if (x < 20) x = 20;
          if (y - tooltipHeight < 0) y = rect.bottom - mapRect.top + 10;

          tooltip.style.left = `${x}px`;
          tooltip.style.top = `${y}px`;

          tooltipName.textContent = tower.name || tower.id;
          tooltipGif.src = tower.img;
          tooltipText.innerHTML = tower.info || "<p>No information available.</p>";

          if (tower.mobsLinked?.length) {
            tooltipText.innerHTML += `<p><strong>Affected Pokemons:</strong> ${tower.mobsLinked.join(", ")}</p>`;
          }

          tooltip.classList.add("show");
        }, 1000);
      });

      img.addEventListener("mouseleave", () => {
        clearTimeout(hoverTimer);
        tooltip.classList.remove("show");
      });

      // === CLIC SUR TOUR ===
      img.addEventListener("click", () => {
        if (!isTowerClickable(tower) || tower.destroyed) return;

        // Marque la tour comme détruite
        tower.destroyed = true;
        img.src = tower.imgBroken;
        img.classList.add("destroyed");
        img.style.pointerEvents = "none";

        // Mets à jour les spawns et tours visibles
        updateDisplay();
      });

      // Gestion visuelle initiale
      if (tower.destroyed) img.classList.add("destroyed");
      else if (!clickable) img.classList.add("disabled");
      else img.classList.remove("disabled");

      img.style.pointerEvents =
        tower.destroyed || !clickable ? "none" : "auto";

      towersContainer.appendChild(img);
      tower.element = img;
    } else {
      // Mise à jour si déjà existante
      tower.element.src = tower.destroyed ? tower.imgBroken : tower.img;
      tower.element.classList.remove("destroyed", "disabled");
      if (tower.destroyed) tower.element.classList.add("destroyed");
      else if (!clickable) tower.element.classList.add("disabled");

      tower.element.style.pointerEvents =
        tower.destroyed || !clickable ? "none" : "auto";
    }
  });
}
