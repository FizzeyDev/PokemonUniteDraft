import { state } from "./state.js";
import { attachTooltip, hideTooltip } from "./tooltip.js";
import { scaledSize } from "./scale.js";

const spawnsContainer = document.getElementById("spawns-container");

export function getLaneT1State(lane) {
  const ids = lane === "top" ? [3, 4] : [1, 2];
  const broken = state.towers.filter(t => ids.includes(t.breakid) && t.destroyed);
  if (broken.length === 2) return { count: 2, spot: "center" };
  if (broken.length === 1) {
    const id = broken[0].breakid;
    const spot = (lane === "bot" && id === 1) || (lane === "top" && id === 3) ? "left" : "right";
    return { count: 1, spot };
  }
  return { count: 0, spot: "center" };
}

function getAltariaPosition(altaria, lane, spot) {
  if (spot === "center") return altaria.lanes[lane];
  if (spot === "left")   return altaria.t1Positions[lane].left;
  if (spot === "right")  return altaria.t1Positions[lane].right;
  return altaria.lanes[lane];
}

export function initializeAltariaLane(lane, altaria) {
  const laneT1 = getLaneT1State(lane);
  const sequenceKey = laneT1.count.toString();
  const list = altaria.spawnLists[sequenceKey] || [];
  if (!list.length) return;
  state.altariaState[lane].sequenceKey = sequenceKey;
  state.altariaState[lane].seqIndex = -1;
  state.altariaState[lane].pending = {
    time: list[0],
    spot: laneT1.count === 1 ? laneT1.spot : "center",
    index: 0,
  };
}

function registerNextAltariaSpawnOnKill(lane, altaria) {
  const st = state.altariaState[lane];
  if (!st.active?.killed) return;
  const laneT1 = getLaneT1State(lane);
  const sequenceKey = laneT1.count.toString();
  const list = altaria.spawnLists[sequenceKey] || [];
  const nextTime = list.find(t => t < st.active.time);
  if (nextTime == null) { st.pending = null; return; }
  st.pending = {
    time: nextTime,
    spot: laneT1.count === 1 ? laneT1.spot : "center",
    sequenceKey,
    seqIndex: list.indexOf(nextTime),
  };
}

export function spawnAltaria(lane) {
  const altaria = state.spawns.find(p => p.name === "Altaria");
  if (!altaria) return false;
  const st = state.altariaState[lane];
  if (!st.pending) return false;
  if (st.active && !st.active.killed) {
    st.seqIndex = st.pending.index;
    st.pending = null;
    return false;
  }

  const { time, spot, index } = st.pending;
  const pos = getAltariaPosition(altaria, lane, spot);
  const baseSize = altaria.size || 70;

  const img = document.createElement("img");
  img.src = altaria.img;
  img.classList.add("spawn", "altaria");
  img.style.left = `${pos.x}%`;
  img.style.top  = `${pos.y}%`;
  img.dataset.baseSize = baseSize;
  const sz = scaledSize(baseSize);
  img.style.width  = `${sz}px`;
  img.style.height = `${sz}px`;

  attachTooltip(img, {
    name: "Altaria",
    gif: altaria.gif || altaria.img,
    html: altaria.spawnInfos[index] || "",
  });

  img.addEventListener("click", () => {
    const s = state.altariaState[lane].active;
    if (s && !s.killed) {
      s.killed = true;
      s.killedTime = state.currentTime;
      if (s.element && spawnsContainer.contains(s.element)) spawnsContainer.removeChild(s.element);
      registerNextAltariaSpawnOnKill(lane, altaria);
      state.altariaState[lane].active = null;
      hideTooltip();
    }
  });

  spawnsContainer.appendChild(img);
  st.active  = { time, element: img, killed: false, killedTime: null };
  st.seqIndex = index;
  st.pending  = null;
  return true;
}

export function updateAltariaSpawns() {
  const altaria = state.spawns.find(p => p.name === "Altaria");
  if (!altaria?.isSpecial) return;
  ["top", "bot"].forEach(lane => {
    const st = state.altariaState[lane];
    if (!st) return;
    if (st.pending && state.currentTime === st.pending.time) spawnAltaria(lane);
    if (st.active?.killed && st.active.element) {
      if (spawnsContainer.contains(st.active.element)) spawnsContainer.removeChild(st.active.element);
      st.active.element = null;
    }
  });
}