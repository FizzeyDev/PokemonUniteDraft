import { state } from "./state.js";
import { draftOrders } from "./constants.js";
import { updateDynamicContent } from "./ui.js";
import { renderGallery, initSortSelect, initFilters, initSearch } from "./gallery.js";
import {
  startDraft, endFearlessSeries,
  softResetDraft, undoLastPick, startNextDraft,
} from "./draft.js";
import {
  mpState, createRoom, joinRoom, disconnectRoom, isMyTurn, publishDraftStart,
} from "./multiplayer.js";

let currentLang = localStorage.getItem('lang') || 'fr';

fetch(`lang/${currentLang}.json`)
  .then(res => res.json())
  .then(data => {
    state.langData = data;
    updateDynamicContent();
  });

fetch("data/pokemons.json")
  .then(res => res.json())
  .then(data => {
    state.monsData = data;
    renderGallery();
  });

// ─── Mode buttons ────────────────────────────────
document.querySelectorAll(".mode-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".mode-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    state.selectedMode      = btn.dataset.mode;
    state.currentDraftOrder = [...draftOrders[state.selectedMode]];

    document.getElementById("mode-title").textContent =
      state.langData[`mode_${state.selectedMode}`] || "";
    document.getElementById("mode-text").textContent =
      state.langData[`tooltip_${state.selectedMode}`] || "";

    document.getElementById("start-draft").disabled = false;
    document.getElementById("create-room-btn").disabled = false;
  });
});

document.querySelectorAll(".map-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".map-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    state.selectedMap = btn.dataset.map;
  });
});

// ─── Draft solo ──────────────────────────────────
document.getElementById("start-draft").addEventListener("click", startDraft);
document.getElementById("reset-draft").addEventListener("click", () => {
  disconnectRoom();
  softResetDraft();
  _hideMpRoomBanner();
});
document.getElementById("backBtn").addEventListener("click", undoLastPick);
document.getElementById("next-draft-btn").addEventListener("click", startNextDraft);
document.getElementById("end-series-btn").addEventListener("click", endFearlessSeries);

// ─── Multiplayer : Créer une room ─────────────────
document.getElementById("create-room-btn").addEventListener("click", async () => {
  if (!state.selectedMode) {
    _showMpError("Sélectionne un mode avant de créer une room.");
    return;
  }

  const btn = document.getElementById("create-room-btn");
  btn.disabled = true;
  btn.textContent = "Création...";

  try {
    const roomId = await createRoom(state.selectedMode, state.selectedMap);
    _showRoomBanner(roomId, "teamA");
    _showMpStatusPanel();
  } catch (e) {
    _showMpError("Erreur Firebase : " + e.message);
    console.error(e);
  } finally {
    btn.disabled = false;
    btn.textContent = "🎮 Créer une room";
  }
});

// ─── Multiplayer : Rejoindre une room ─────────────
document.getElementById("join-room-btn").addEventListener("click", async () => {
  const code = document.getElementById("room-code-input").value.trim().toUpperCase();
  if (!code || code.length !== 6) {
    _showMpError("Entre un code de room valide (6 caractères).");
    return;
  }

  const btn = document.getElementById("join-room-btn");
  btn.disabled = true;
  btn.textContent = "Connexion...";

  const asSpectator = document.getElementById("join-as-spectator").checked;

  try {
    const { role, data } = await joinRoom(code, asSpectator);

    // Synchronise mode/map depuis Firebase
    document.querySelectorAll(".mode-btn").forEach(b => {
      b.classList.toggle("active", b.dataset.mode === data.mode);
    });
    state.selectedMode      = data.mode;
    state.selectedMap       = data.map;
    state.currentDraftOrder = [...draftOrders[data.mode]];

    _showRoomBanner(code, role);
    _showMpStatusPanel();

    if (data.status === "drafting") {
      // La draft a déjà commencé : on démarre côté client
      startDraft();
    }

    document.getElementById("start-draft").disabled = role !== "teamA";

  } catch (e) {
    _showMpError(e.message || "Impossible de rejoindre la room.");
    console.error(e);
  } finally {
    btn.disabled = false;
    btn.textContent = "🔗 Rejoindre";
  }
});

// ─── Listener : start déclenché par l'hôte ────────
window.addEventListener("mp:draftStart", (e) => {
  const data = e.detail;

  // S'assure que tout l'état est set avant de lancer
  state.selectedMode      = data.mode;
  state.selectedMap       = data.map;
  state.fearlessMode      = data.fearlessMode || false;
  state.currentDraftOrder = [...draftOrders[data.mode]];

  // Sync le bouton de mode visuellement
  document.querySelectorAll(".mode-btn").forEach(b => {
    b.classList.toggle("active", b.dataset.mode === data.mode);
  });

  startDraft();

  // Force l'affichage de la gallery (sécurité si startDraft rate)
  document.getElementById("gallery-wrapper").style.display      = "flex";
  document.getElementById("gallery-wrapper").style.flexDirection = "column";
  document.getElementById("filters").style.display              = "flex";
  document.getElementById("sort-options").style.display         = "flex";
});

window.addEventListener("mp:draftEnd", () => {
  import("./draft.js").then(({ endDraft }) => endDraft());
});

// ─── Hooks sur startDraft pour publier en MP ──────
const _origStartDraft = startDraft;
document.getElementById("start-draft").addEventListener("click", async () => {
  if (mpState.enabled && mpState.isHost) {
    const fearless = document.getElementById("fearless-checkbox").checked;
    await publishDraftStart(fearless, state.selectedMap);
  }
});

// ─── UI helpers ───────────────────────────────────
function _showRoomBanner(roomId, role) {
  const banner = document.getElementById("mp-room-banner");
  const codeEl = document.getElementById("mp-room-code");
  const roleEl = document.getElementById("mp-player-role");

  codeEl.textContent = roomId;
  roleEl.textContent = role === "teamA"
    ? "🟣 Purple Team (hôte)"
    : role === "teamB"
    ? "🟠 Orange Team"
    : "👁 Spectateur";

  banner.style.display = "flex";

  // Bouton copier
  document.getElementById("mp-copy-code").onclick = () => {
    navigator.clipboard.writeText(roomId);
    document.getElementById("mp-copy-code").textContent = "✅ Copié !";
    setTimeout(() => {
      document.getElementById("mp-copy-code").textContent = "📋 Copier";
    }, 2000);
  };
}

function _hideMpRoomBanner() {
  document.getElementById("mp-room-banner").style.display = "none";
}

function _showMpStatusPanel() {
  const el = document.getElementById("mp-status-panel");
  if (el) el.style.display = "flex";
}

function _showMpError(msg) {
  const el = document.getElementById("mp-error");
  el.textContent = msg;
  el.style.display = "block";
  setTimeout(() => { el.style.display = "none"; }, 5000);
}

// ─── Expose isMyTurn pour gallery.js ─────────────
window._mpIsMyTurn = isMyTurn;

initSortSelect();
initFilters();
initSearch();