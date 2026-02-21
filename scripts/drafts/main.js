import { state } from "./state.js";
import { draftOrders } from "./constants.js";
import { updateDynamicContent } from "./ui.js";
import { renderGallery, initSortSelect, initFilters, initSearch } from "./gallery.js";
import { startDraft, endFearlessSeries, softResetDraft, undoLastPick, startNextDraft } from "./draft.js";
import { mpState, createRoom, joinRoom, disconnectRoom, isMyTurn, publishDraftStart, publishNextDraft } from "./multiplayer.js";

// ─── Init données ─────────────────────────────────
const currentLang = localStorage.getItem("lang") || "fr";
fetch(`lang/${currentLang}.json`).then(r => r.json()).then(d => { state.langData = d; updateDynamicContent(); });
fetch("data/pokemons.json").then(r => r.json()).then(d => { state.monsData = d; renderGallery(); });

// ─── Mode buttons ─────────────────────────────────
document.querySelectorAll(".mode-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".mode-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    state.selectedMode      = btn.dataset.mode;
    state.currentDraftOrder = [...draftOrders[state.selectedMode]];
    document.getElementById("mode-title").textContent = state.langData[`mode_${state.selectedMode}`] || "";
    document.getElementById("mode-text").textContent  = state.langData[`tooltip_${state.selectedMode}`] || "";
    document.getElementById("start-draft").disabled      = false;
    document.getElementById("create-room-btn").disabled  = false;
  });
});

document.querySelectorAll(".map-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".map-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    state.selectedMap = btn.dataset.map;
  });
});

// ─── Draft controls ───────────────────────────────
document.getElementById("start-draft").addEventListener("click", async () => {
  startDraft(); // génère la map random AVANT publishDraftStart
  if (mpState.enabled && mpState.isHost) {
    const fearless = document.getElementById("fearless-checkbox").checked;
    await publishDraftStart(fearless, state.selectedMap); // state.selectedMap est maintenant set
  }
});

document.getElementById("reset-draft").addEventListener("click", () => {
  disconnectRoom();
  softResetDraft();
  document.getElementById("mp-room-banner").style.display = "none";
});

document.getElementById("backBtn").addEventListener("click", undoLastPick);

document.getElementById("next-draft-btn").addEventListener("click", async () => {
  startNextDraft(); // set state.selectedMap depuis le re-select fearless
  if (mpState.enabled && mpState.isHost) {
    await publishNextDraft(state.selectedMap);
  }
});

document.getElementById("end-series-btn").addEventListener("click", endFearlessSeries);

// ─── Multiplayer : créer une room ─────────────────
document.getElementById("create-room-btn").addEventListener("click", async () => {
  if (!state.selectedMode) { _showMpError("Sélectionne un mode avant de créer une room."); return; }
  const btn = document.getElementById("create-room-btn");
  btn.disabled = true; btn.textContent = "Création...";
  try {
    const roomId = await createRoom(state.selectedMode, state.selectedMap);
    _showRoomBanner(roomId, "teamA");
  } catch (e) {
    _showMpError("Erreur Firebase : " + e.message); console.error(e);
  } finally {
    btn.disabled = false; btn.textContent = "🎮 Create a room";
  }
});

// ─── Multiplayer : rejoindre une room ─────────────
document.getElementById("join-room-btn").addEventListener("click", async () => {
  const code = document.getElementById("room-code-input").value.trim().toUpperCase();
  if (!code || code.length !== 6) { _showMpError("Entre un code de room valide (6 caractères)."); return; }
  const btn = document.getElementById("join-room-btn");
  btn.disabled = true; btn.textContent = "Connexion...";
  const asSpectator = document.getElementById("join-as-spectator").checked;
  try {
    const { role, data } = await joinRoom(code, asSpectator);
    // Sync visuel du mode
    document.querySelectorAll(".mode-btn").forEach(b => b.classList.toggle("active", b.dataset.mode === data.mode));
    state.selectedMode      = data.mode;
    state.selectedMap       = data.map;
    state.currentDraftOrder = [...draftOrders[data.mode]];
    _showRoomBanner(code, role);
    document.getElementById("start-draft").disabled = role !== "teamA";
    // Si la draft est déjà en cours quand on rejoint
    if (data.status === "drafting") {
      _launchDraftForPlayer(data);
    }
  } catch (e) {
    _showMpError(e.message || "Impossible de rejoindre la room."); console.error(e);
  } finally {
    btn.disabled = false; btn.textContent = "🔗 Join";
  }
});

// ─── Events MP reçus depuis multiplayer.js ────────

// Première draft démarrée par l'hôte
window.addEventListener("mp:draftStart", (e) => {
  _launchDraftForPlayer(e.detail);
});

// Draft suivante fearless démarrée par l'hôte
window.addEventListener("mp:nextDraft", (e) => {
  const data = e.detail;
  state.selectedMap = data.map;
  state.currentStep = 0;
  // startNextDraft s'occupe du reset DOM + gallery
  startNextDraft();
  // Force affichage gallery (sécurité)
  _forceShowGallery();
});

// Fin de draft (tous joueurs)
window.addEventListener("mp:draftEnd", () => {
  import("./draft.js").then(({ endDraft }) => endDraft());
});

// ─── Helper : lancer la draft côté joueur B ───────
function _launchDraftForPlayer(data) {
  // Set tout l'état depuis Firebase avant d'appeler startDraft
  state.selectedMode      = data.mode;
  state.selectedMap       = data.map;
  state.fearlessMode      = data.fearlessMode || false;
  state.currentDraftOrder = [...draftOrders[data.mode]];
  state.currentStep       = 0;

  // Sync visuel mode button
  document.querySelectorAll(".mode-btn").forEach(b => b.classList.toggle("active", b.dataset.mode === data.mode));

  startDraft();
  _forceShowGallery();
}

function _forceShowGallery() {
  const gw = document.getElementById("gallery-wrapper");
  if (gw) { gw.style.display = "flex"; gw.style.flexDirection = "column"; }
  const f = document.getElementById("filters");
  if (f) f.style.display = "flex";
  const s = document.getElementById("sort-options");
  if (s) s.style.display = "flex";
}

// ─── UI helpers ───────────────────────────────────
function _showRoomBanner(roomId, role) {
  document.getElementById("mp-room-code").textContent = roomId;
  document.getElementById("mp-player-role").textContent =
    role === "teamA" ? "🟣 Purple Team (hôte)" :
    role === "teamB" ? "🟠 Orange Team" : "👁 Spectateur";
  document.getElementById("mp-room-banner").style.display = "flex";
  document.getElementById("mp-copy-code").onclick = () => {
    navigator.clipboard.writeText(roomId);
    document.getElementById("mp-copy-code").textContent = "✅ Copié !";
    setTimeout(() => { document.getElementById("mp-copy-code").textContent = "📋 Copy"; }, 2000);
  };
}

function _showMpError(msg) {
  const el = document.getElementById("mp-error");
  if (!el) return;
  el.textContent = msg; el.style.display = "block";
  setTimeout(() => { el.style.display = "none"; }, 5000);
}

// ─── Expose isMyTurn pour gallery.js ─────────────
window._mpIsMyTurn = isMyTurn;

initSortSelect();
initFilters();
initSearch();