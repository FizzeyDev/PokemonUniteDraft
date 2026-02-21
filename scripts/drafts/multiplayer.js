// multiplayer.js
// ─────────────────────────────────────────────────────────────────────────────
// Firebase Realtime Database — via REST API + SSE (Server-Sent Events)
// Pas de SDK, pas de CORB, fonctionne partout (Live Server, GitHub Pages, etc.)
//
// SETUP:
//   1. Créé un projet Firebase sur https://console.firebase.google.com
//   2. Active "Realtime Database" (mode test)
//   3. Remplace DATABASE_URL ci-dessous par l'URL de ta base
//      (Realtime Database > copie l'URL en haut, ex: https://xxx-default-rtdb.europe-west1.firebasedatabase.app)
// ─────────────────────────────────────────────────────────────────────────────

import { state } from "./state.js";
import { draftOrders } from "./constants.js";

// ──────────────────────────────────────────────────
// 🔧 REMPLACE ICI par l'URL de ta Realtime Database
// ──────────────────────────────────────────────────
const DATABASE_URL = "https://TON-PROJET-default-rtdb.europe-west1.firebasedatabase.app";
// ──────────────────────────────────────────────────

// ─── Helpers REST ─────────────────────────────────
async function dbGet(path) {
  const res = await fetch(`${DATABASE_URL}/${path}.json`);
  if (!res.ok) throw new Error(`Firebase GET failed: ${res.status}`);
  return res.json();
}

async function dbSet(path, data) {
  const res = await fetch(`${DATABASE_URL}/${path}.json`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Firebase SET failed: ${res.status}`);
  return res.json();
}

async function dbUpdate(path, data) {
  const res = await fetch(`${DATABASE_URL}/${path}.json`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Firebase UPDATE failed: ${res.status}`);
  return res.json();
}

async function dbPush(path, data) {
  const res = await fetch(`${DATABASE_URL}/${path}.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Firebase PUSH failed: ${res.status}`);
  const json = await res.json();
  return json.name; // Firebase retourne { name: "-NxyzKey" }
}

// SSE : écoute les changements en temps réel via EventSource
function dbListen(path, callback) {
  const es = new EventSource(`${DATABASE_URL}/${path}.json`);

  es.addEventListener("put", (event) => {
    try {
      const parsed = JSON.parse(event.data);
      if (parsed.data !== null && parsed.data !== undefined) callback(parsed.data);
    } catch (e) { console.warn("[MP] SSE parse error", e); }
  });

  es.addEventListener("patch", (event) => {
    try {
      const parsed = JSON.parse(event.data);
      // Un patch partiel : on refetch la room complète pour avoir l'état cohérent
      dbGet(path).then(data => { if (data) callback(data); });
    } catch (e) { console.warn("[MP] SSE patch error", e); }
  });

  es.onerror = () => {
    console.warn("[MP] SSE reconnecting...");
  };

  return es;
}

// ─── État multijoueur local ────────────────────────
export const mpState = {
  enabled:        false,
  roomId:         null,
  playerRole:     null,   // "teamA" | "teamB" | "spectator"
  isHost:         false,
  sseConnection:  null,   // EventSource actif
  spectatorCount: 0,
};

// ─── Génère un code de room à 6 caractères ────────
function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// ─── Créer une room ───────────────────────────────
export async function createRoom(mode, map) {
  const roomId = generateRoomCode();

  const roomData = {
    mode,
    map: map || null,
    createdAt: Date.now(),
    status: "waiting",
    currentStep: 0,
    picks: {},
    players: {
      teamA: { joined: true,  online: true  },
      teamB: { joined: false, online: false },
    },
    spectators: {},
    fearlessMode: false,
  };

  await dbSet(`rooms/${roomId}`, roomData);

  mpState.enabled    = true;
  mpState.roomId     = roomId;
  mpState.playerRole = "teamA";
  mpState.isHost     = true;

  _subscribeToRoom(roomId);
  _registerOfflineHook(roomId, "teamA");

  return roomId;
}

// ─── Rejoindre une room ───────────────────────────
export async function joinRoom(roomId, asSpectator = false) {
  const data = await dbGet(`rooms/${roomId}`);

  if (!data) throw new Error("Room introuvable. Vérifie le code.");
  if (data.status === "done") throw new Error("Cette draft est déjà terminée.");

  let role;

  if (asSpectator || data.players.teamB.joined) {
    const key = await dbPush(`rooms/${roomId}/spectators`, { online: true });
    role = "spectator";
    mpState.playerRole = "spectator";
    window.addEventListener("beforeunload", () =>
      navigator.sendBeacon(`${DATABASE_URL}/rooms/${roomId}/spectators/${key}/online.json`, "false")
    );
  } else {
    await dbUpdate(`rooms/${roomId}/players/teamB`, { joined: true, online: true });
    role = "teamB";
    mpState.playerRole = "teamB";
    _registerOfflineHook(roomId, "teamB");
  }

  mpState.enabled = true;
  mpState.roomId  = roomId;
  mpState.isHost  = false;

  state.selectedMode      = data.mode;
  state.selectedMap       = data.map;
  state.currentDraftOrder = [...draftOrders[data.mode]];
  state.currentStep       = data.currentStep || 0;
  state.fearlessMode      = data.fearlessMode || false;

  _subscribeToRoom(roomId);

  return { role, data };
}

// ─── Publier un pick/ban ──────────────────────────
export async function publishPick(stepIndex, monFile) {
  if (!mpState.enabled || !mpState.roomId) return;

  const step = state.currentDraftOrder[stepIndex];

  await dbUpdate(`rooms/${mpState.roomId}`, {
    currentStep: stepIndex + 1,
    [`picks/${stepIndex}`]: {
      file: monFile,
      team: step.team,
      type: step.type,
    },
  });
}

// ─── Publier la fin de draft ──────────────────────
export async function publishDraftEnd() {
  if (!mpState.enabled || !mpState.roomId) return;
  await dbUpdate(`rooms/${mpState.roomId}`, { status: "done" });
}

// ─── Publier le démarrage ─────────────────────────
export async function publishDraftStart(fearlessMode, map) {
  if (!mpState.enabled || !mpState.roomId) return;
  await dbUpdate(`rooms/${mpState.roomId}`, {
    status: "drafting",
    fearlessMode,
    map: map || null,
  });
}

// ─── Écoute SSE en temps réel ─────────────────────
function _subscribeToRoom(roomId) {
  if (mpState.sseConnection) mpState.sseConnection.close();

  mpState.sseConnection = dbListen(`rooms/${roomId}`, (data) => {
    if (data && typeof data === "object") _onRoomUpdate(data);
  });
}

// ─── Handler principal de mise à jour ─────────────
function _onRoomUpdate(data) {
  mpState.spectatorCount = data.spectators
    ? Object.keys(data.spectators).length
    : 0;

  _updateOnlineIndicators(data);
  updateSpectatorCount(mpState.spectatorCount);

  if (data.status === "drafting" && !_isDraftStarted()) {
    window.dispatchEvent(new CustomEvent("mp:draftStart", { detail: data }));
  }

  if (data.status === "done" && _isDraftStarted()) {
    window.dispatchEvent(new CustomEvent("mp:draftEnd"));
  }

  const remoteStep = data.currentStep || 0;
  if (remoteStep > state.currentStep) {
    _syncPicks(data, remoteStep);
  }
}

// ─── Sync des picks reçus depuis Firebase ─────────
function _syncPicks(data, remoteStep) {
  const picks = data.picks || {};

  for (let i = state.currentStep; i < remoteStep; i++) {
    const pick = picks[i];
    if (!pick) continue;

    const step = state.currentDraftOrder[i];
    if (!step) continue;

    // Utilise les nouveaux sélecteurs DOM (bans-teamA / picks-teamA)
    let slot;
    if (step.type === "ban") {
      const container = document.getElementById(`bans-${step.team}`);
      if (!container) continue;
      slot = Array.from(container.querySelectorAll(".ban-slot"))
                  .find(s => !s.querySelector("img"));
      if (slot) slot.classList.add("filled");
    } else {
      const container = document.getElementById(`picks-${step.team}`);
      if (!container) continue;
      slot = Array.from(container.querySelectorAll(".slot"))
                  .find(s => !s.querySelector("img"));
    }
    if (!slot) continue;

    const galleryImg = state.allImages.find(img => img.dataset.file === pick.file);
    if (galleryImg) {
      slot.innerHTML = "";
      const clone = galleryImg.cloneNode(true);
      clone.style.cssText = "";
      slot.appendChild(clone);
      galleryImg.classList.add("used");
    }

    state.currentStep = i + 1;
  }

  import("./ui.js").then(({ updateTurn, highlightCurrentSlot }) => {
    updateTurn();
    highlightCurrentSlot();
  });
}

// ─── Présence hors-ligne ─────────────────────────
function _registerOfflineHook(roomId, role) {
  const path = `${DATABASE_URL}/rooms/${roomId}/players/${role}/online.json`;
  window.addEventListener("beforeunload", () => {
    navigator.sendBeacon(path, JSON.stringify(false));
  });
}

// ─── Indicateurs en ligne ─────────────────────────
function _updateOnlineIndicators(data) {
  const aOnline = data.players?.teamA?.online;
  const bOnline = data.players?.teamB?.online;
  const indA = document.getElementById("mp-indicator-teamA");
  const indB = document.getElementById("mp-indicator-teamB");
  if (indA) indA.className = `mp-indicator ${aOnline ? "online" : "offline"}`;
  if (indB) indB.className = `mp-indicator ${bOnline ? "online" : "offline"}`;
}

function _isDraftStarted() {
  const g = document.getElementById("gallery");
  return g && g.style.display !== "none";
}

// ─── Cleanup ──────────────────────────────────────
export function disconnectRoom() {
  if (mpState.sseConnection) {
    mpState.sseConnection.close();
    mpState.sseConnection = null;
  }
  mpState.enabled    = false;
  mpState.roomId     = null;
  mpState.playerRole = null;
  mpState.isHost     = false;
}

// ─── Utilitaire UI ────────────────────────────────
export function updateSpectatorCount(count) {
  const el = document.getElementById("mp-spectator-count");
  if (el) el.textContent = count > 0 ? `👁 ${count} spectateur${count > 1 ? "s" : ""}` : "";
}

// ─── Vérifie si c'est le tour de ce joueur ────────
export function isMyTurn() {
  if (!mpState.enabled) return true;
  if (mpState.playerRole === "spectator") return false;
  if (state.currentStep >= state.currentDraftOrder.length) return false;
  const step = state.currentDraftOrder[state.currentStep];
  return step.team === mpState.playerRole;
}