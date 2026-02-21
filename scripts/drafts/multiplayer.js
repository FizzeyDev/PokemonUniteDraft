import { state } from "./state.js";
import { draftOrders } from "./constants.js";

const DATABASE_URL = "https://unite-draft-default-rtdb.europe-west1.firebasedatabase.app";


async function dbGet(path) {
  const res = await fetch(`${DATABASE_URL}/${path}.json`);
  if (!res.ok) throw new Error(`Firebase GET failed: ${res.status}`);
  return res.json();
}
async function dbSet(path, data) {
  const res = await fetch(`${DATABASE_URL}/${path}.json`, {
    method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Firebase SET failed: ${res.status}`);
  return res.json();
}
async function dbUpdate(path, data) {
  const res = await fetch(`${DATABASE_URL}/${path}.json`, {
    method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Firebase UPDATE failed: ${res.status}`);
  return res.json();
}
async function dbPush(path, data) {
  const res = await fetch(`${DATABASE_URL}/${path}.json`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Firebase PUSH failed: ${res.status}`);
  return (await res.json()).name;
}
function dbListen(path, callback) {
  const es = new EventSource(`${DATABASE_URL}/${path}.json`);
  es.addEventListener("put",   (e) => { try { const p = JSON.parse(e.data); if (p.data) callback(p.data); } catch {} });
  es.addEventListener("patch", (e) => { try { dbGet(path).then(d => { if (d) callback(d); }); } catch {} });
  es.onerror = () => console.warn("[MP] SSE reconnecting...");
  return es;
}

export const mpState = {
  enabled: false, roomId: null, playerRole: null,
  isHost: false, sseConnection: null, spectatorCount: 0,
  localStatus: "idle", _catchupInterval: null,
};

function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export async function createRoom(mode, map) {
  const roomId = generateRoomCode();
  await dbSet(`rooms/${roomId}`, {
    mode, map: map || null, createdAt: Date.now(),
    status: "waiting", currentStep: 0, picks: {},
    fearlessMode: false, draftCount: 0,
    players: { teamA: { joined: true, online: true }, teamB: { joined: false, online: false } },
    spectators: {},
  });
  mpState.enabled = true; mpState.roomId = roomId;
  mpState.playerRole = "teamA"; mpState.isHost = true; mpState.localStatus = "idle";
  _subscribeToRoom(roomId);
  _registerOfflineHook(roomId, "teamA");
  return roomId;
}

export async function joinRoom(roomId, asSpectator = false) {
  const data = await dbGet(`rooms/${roomId}`);
  if (!data) throw new Error("Room introuvable. Vérifie le code.");

  let role;
  if (asSpectator || data.players?.teamB?.joined) {
    const key = await dbPush(`rooms/${roomId}/spectators`, { online: true });
    role = "spectator"; mpState.playerRole = "spectator";
    window.addEventListener("beforeunload", () =>
      navigator.sendBeacon(`${DATABASE_URL}/rooms/${roomId}/spectators/${key}/online.json`, "false"));
  } else {
    await dbUpdate(`rooms/${roomId}/players/teamB`, { joined: true, online: true });
    role = "teamB"; mpState.playerRole = "teamB";
    _registerOfflineHook(roomId, "teamB");
  }

  mpState.enabled = true; mpState.roomId = roomId;
  mpState.isHost = false; mpState.localStatus = "idle";
  state.selectedMode      = data.mode;
  state.selectedMap       = data.map;
  state.currentDraftOrder = [...draftOrders[data.mode]];
  state.currentStep       = data.currentStep || 0;
  state.fearlessMode      = data.fearlessMode || false;

  _subscribeToRoom(roomId);
  return { role, data };
}

export async function publishPick(stepIndex, monFile) {
  if (!mpState.enabled || !mpState.roomId) return;
  const step = state.currentDraftOrder[stepIndex];
  await dbUpdate(`rooms/${mpState.roomId}`, {
    currentStep: stepIndex + 1,
    [`picks/${stepIndex}`]: { file: monFile, team: step.team, type: step.type },
  });
}

export async function publishDraftStart(fearlessMode, map) {
  if (!mpState.enabled || !mpState.roomId) return;
  mpState.localStatus = "drafting";
  await dbUpdate(`rooms/${mpState.roomId}`, {
    status: "drafting", fearlessMode: fearlessMode || false,
    map: map || null, currentStep: 0, picks: {}, draftCount: 1,
  });
}

export async function publishDraftEnd() {
  if (!mpState.enabled || !mpState.roomId) return;
  mpState.localStatus = "recap";
  await dbUpdate(`rooms/${mpState.roomId}`, { status: "recap" });
}

export async function publishNextDraft(map) {
  if (!mpState.enabled || !mpState.roomId) return;
  const data = await dbGet(`rooms/${mpState.roomId}`);
  const nextCount = (data?.draftCount || 1) + 1;
  mpState.localStatus = "drafting";
  await dbUpdate(`rooms/${mpState.roomId}`, {
    status: "drafting", currentStep: 0, picks: {},
    map: map || null, draftCount: nextCount,
  });
}

function _subscribeToRoom(roomId) {
  if (mpState.sseConnection) mpState.sseConnection.close();
  mpState.sseConnection = dbListen(`rooms/${roomId}`, (data) => {
    if (data && typeof data === "object") _onRoomUpdate(data);
  });
  if (mpState._catchupInterval) clearInterval(mpState._catchupInterval);
  mpState._catchupInterval = setInterval(async () => {
    if (!mpState.enabled || mpState.localStatus !== "drafting") return;
    try {
      const d = await dbGet(`rooms/${roomId}`);
      if (d && (d.currentStep || 0) > state.currentStep) _syncPicks(d, d.currentStep);
    } catch {}
  }, 3000);
}

function _onRoomUpdate(data) {
  _updateOnlineIndicators(data);
  const count = data.spectators ? Object.keys(data.spectators).length : 0;
  mpState.spectatorCount = count;
  const specEl = document.getElementById("mp-spectator-count");
  if (specEl) specEl.textContent = count > 0 ? `👁 ${count} spectateur${count > 1 ? "s" : ""}` : "";

  const rs = data.status;
  const ls = mpState.localStatus;

  if (rs === "drafting" && (ls === "idle" || ls === "recap")) {
    mpState.localStatus = "drafting";
    state.selectedMode      = data.mode;
    state.selectedMap       = data.map;
    state.fearlessMode      = data.fearlessMode || false;
    state.currentDraftOrder = [...draftOrders[data.mode]];
    state.currentStep       = 0;

    const isNextFearless = (data.draftCount || 1) > 1;
    if (isNextFearless) {
      window.dispatchEvent(new CustomEvent("mp:nextDraft", { detail: data }));
    } else {
      window.dispatchEvent(new CustomEvent("mp:draftStart", { detail: data }));
    }

    const remoteStep = data.currentStep || 0;
    if (remoteStep > 0) setTimeout(() => _syncPicks(data, remoteStep), 500);
    return;
  }

  if (rs === "drafting" && ls === "drafting") {
    const remoteStep = data.currentStep || 0;
    if (remoteStep > state.currentStep) _syncPicks(data, remoteStep);
    return;
  }

  if (rs === "recap" && ls === "drafting") {
    mpState.localStatus = "recap";
    window.dispatchEvent(new CustomEvent("mp:draftEnd"));
    return;
  }
}

function _syncPicks(data, remoteStep) {
  const picks = data.picks || {};
  for (let i = state.currentStep; i < remoteStep; i++) {
    const pick = picks[i];
    if (!pick) continue;
    const step = state.currentDraftOrder[i];
    if (!step) continue;

    let slot;
    if (step.type === "ban") {
      const c = document.getElementById(`bans-${step.team}`);
      if (!c) continue;
      slot = Array.from(c.querySelectorAll(".ban-slot")).find(s => !s.querySelector("img"));
      if (slot) slot.classList.add("filled");
    } else {
      const c = document.getElementById(`picks-${step.team}`);
      if (!c) continue;
      slot = Array.from(c.querySelectorAll(".slot")).find(s => !s.querySelector("img"));
    }
    if (!slot) continue;

    const gImg = state.allImages.find(img => img.dataset.file === pick.file);
    if (gImg) {
      slot.innerHTML = "";
      const clone = gImg.cloneNode(true);
      clone.style.cssText = "";
      slot.appendChild(clone);
      gImg.classList.add("used");
    }
    state.currentStep = i + 1;
  }
  import("./ui.js").then(({ updateTurn, highlightCurrentSlot }) => {
    updateTurn(); highlightCurrentSlot();
  });
}

function _registerOfflineHook(roomId, role) {
  window.addEventListener("beforeunload", () =>
    navigator.sendBeacon(`${DATABASE_URL}/rooms/${roomId}/players/${role}/online.json`, JSON.stringify(false)));
}
function _updateOnlineIndicators(data) {
  const indA = document.getElementById("mp-indicator-teamA");
  const indB = document.getElementById("mp-indicator-teamB");
  if (indA) indA.className = `mp-indicator ${data.players?.teamA?.online ? "online" : "offline"}`;
  if (indB) indB.className = `mp-indicator ${data.players?.teamB?.online ? "online" : "offline"}`;
}

export function isMyTurn() {
  if (!mpState.enabled) return true;
  if (mpState.playerRole === "spectator") return false;
  if (state.currentStep >= state.currentDraftOrder.length) return false;
  return state.currentDraftOrder[state.currentStep].team === mpState.playerRole;
}

export function disconnectRoom() {
  if (mpState.sseConnection) { mpState.sseConnection.close(); mpState.sseConnection = null; }
  if (mpState._catchupInterval) { clearInterval(mpState._catchupInterval); mpState._catchupInterval = null; }
  mpState.enabled = false; mpState.roomId = null; mpState.playerRole = null;
  mpState.isHost = false; mpState.localStatus = "idle";
}