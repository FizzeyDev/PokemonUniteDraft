import { state } from "./state.js";
import { draftOrders } from "./constants.js";
import { updateDynamicContent } from "./ui.js";
import { renderGallery, initSortSelect, initFilters, initSearch } from "./gallery.js";
import { startDraft, endFearlessSeries, softResetDraft, undoLastPick, startNextDraft, returnToLobby, _updateMpTurnIndicator } from "./draft.js";
import { mpState, createRoom, joinRoom, disconnectRoom, isMyTurn, publishDraftStart, switchRole } from "./multiplayer.js";

// ─── Language & data ──────────────────────────────────────────────────────────

const currentLang = localStorage.getItem("lang") || "fr";
fetch(`lang/${currentLang}.json`).then(r => r.json()).then(d => { state.langData = d; updateDynamicContent(); });
fetch("data/pokemons.json").then(r => r.json()).then(d => { state.monsData = d; renderGallery(); });

// ─── Mode buttons ─────────────────────────────────────────────────────────────

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

// ─── Map buttons ──────────────────────────────────────────────────────────────

document.querySelectorAll(".map-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".map-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    state.selectedMap = btn.dataset.map;
  });
});

// ─── Start draft ──────────────────────────────────────────────────────────────

document.getElementById("start-draft").addEventListener("click", async () => {
  startDraft();
  if (mpState.enabled && (mpState.isHost || mpState.playerRole === "teamA")) {
    const fearless = document.getElementById("fearless-checkbox").checked;
    await publishDraftStart(fearless, state.selectedMap);
  }
});

// ─── Reset draft ──────────────────────────────────────────────────────────────

document.getElementById("reset-draft").addEventListener("click", () => {
  disconnectRoom();
  softResetDraft();
  document.getElementById("mp-room-banner").style.display = "none";
});

// ─── Undo ─────────────────────────────────────────────────────────────────────

document.getElementById("backBtn").addEventListener("click", undoLastPick);

// ─── Next Draft (fearless) ────────────────────────────────────────────────────

document.getElementById("next-draft-btn").addEventListener("click", async () => {
  if (mpState.enabled && !state.fearlessMode) {
    // Non-fearless MP: return to lobby so both players can reconfig
    await returnToLobby();
  } else {
    // Local mode or fearless MP: start next draft directly
    await startNextDraft(false);
  }
});

// ─── End series ───────────────────────────────────────────────────────────────

document.getElementById("end-series-btn").addEventListener("click", endFearlessSeries);

// ─── Multiplayer: Create room ─────────────────────────────────────────────────

document.getElementById("create-room-btn").addEventListener("click", async () => {
  if (!state.selectedMode) { _showMpError("Select a draft mode first."); return; }
  const btn = document.getElementById("create-room-btn");
  btn.disabled = true; btn.textContent = "Creating…";
  try {
    const roomId = await createRoom(state.selectedMode, state.selectedMap);
    _showRoomBanner(roomId, "teamA");
    _updateRoleSelectorUI();
  } catch (e) {
    _showMpError("Firebase error: " + e.message); console.error(e);
  } finally {
    btn.disabled = false; btn.textContent = "🎮 Create a room";
  }
});

// ─── Multiplayer: Join room ───────────────────────────────────────────────────

document.getElementById("join-room-btn").addEventListener("click", async () => {
  const code = document.getElementById("room-code-input").value.trim().toUpperCase();
  if (!code || code.length !== 6) { _showMpError("Enter a valid room code (6 characters)."); return; }
  const btn = document.getElementById("join-room-btn");
  btn.disabled = true; btn.textContent = "Connecting…";
  const asSpectator = document.getElementById("join-as-spectator").checked;
  try {
    const { role, data } = await joinRoom(code, asSpectator);
    document.querySelectorAll(".mode-btn").forEach(b => b.classList.toggle("active", b.dataset.mode === data.mode));
    state.selectedMode      = data.mode;
    state.selectedMap       = data.map;
    state.currentDraftOrder = [...draftOrders[data.mode]];
    _showRoomBanner(code, role);
    _updateRoleSelectorUI();

    // teamB can start draft if teamA role is missing (edge case)
    document.getElementById("start-draft").disabled = role === "spectator";

    if (data.status === "drafting") {
      _launchDraftForPlayer(data);
    }
  } catch (e) {
    _showMpError(e.message || "Could not join the room."); console.error(e);
  } finally {
    btn.disabled = false; btn.textContent = "🔗 Join";
  }
});

// ─── Role selector buttons ────────────────────────────────────────────────────

document.querySelectorAll(".mp-role-btn").forEach(btn => {
  btn.addEventListener("click", async () => {
    if (!mpState.enabled) return;
    const newRole = btn.dataset.role;
    if (newRole === mpState.playerRole) return; // already this role
    try {
      await switchRole(newRole);
      _updateRoleSelectorUI();
      _showRoomBanner(mpState.roomId, mpState.playerRole);
      // Update start button access
      document.getElementById("start-draft").disabled = newRole === "spectator";
    } catch (e) {
      _showMpError(e.message);
    }
  });
});

// ─── MP event listeners ───────────────────────────────────────────────────────

window.addEventListener("mp:draftStart", (e) => {
  _launchDraftForPlayer(e.detail);
});

window.addEventListener("mp:nextDraft", (e) => {
  // FIX: Both players receive this event and call startNextDraft with skipPublish=true
  // to avoid double-publishing. The host already published via startNextDraft(false).
  const data = e.detail;
  state.selectedMode  = data.mode;
  state.selectedMap   = data.map;
  state.fearlessMode  = data.fearlessMode || false;
  state.currentStep   = 0;
  state.currentDraftOrder = [...draftOrders[data.mode]];
  startNextDraft(true); // skipPublish = true, host already published
  _forceShowGallery();
});

window.addEventListener("mp:draftEnd", () => {
  // Only non-host players react to this event.
  // The host already called endDraft() locally before publishing.
  if (!mpState.isHost && mpState.playerRole !== "teamA") {
    import("./draft.js").then(({ endDraft }) => endDraft());
  }
});

window.addEventListener("mp:returnToLobby", (data) => {
  // Non-host players return to lobby when host triggers it
  softResetDraft();
  document.getElementById("mp-room-banner").style.display = "flex";
  document.getElementById("mp-toggle-btn").style.display = "flex";
  _updateRoleSelectorUI();
  // Re-enable start button for team players
  if (mpState.playerRole !== "spectator") {
    document.getElementById("start-draft").disabled = !state.selectedMode;
  }
});

window.addEventListener("mp:roleChanged", (e) => {
  _updateRoleSelectorUI();
});

// ─── Private helpers ──────────────────────────────────────────────────────────

function _launchDraftForPlayer(data) {
  state.selectedMode      = data.mode;
  state.selectedMap       = data.map;
  state.fearlessMode      = data.fearlessMode || false;
  state.currentDraftOrder = [...draftOrders[data.mode]];
  state.currentStep       = 0;

  document.querySelectorAll(".mode-btn").forEach(b =>
    b.classList.toggle("active", b.dataset.mode === data.mode));

  startDraft();
  _forceShowGallery();
}

function _forceShowGallery() {
  const gw = document.getElementById("gallery-wrapper");
  if (gw) { gw.style.display = "flex"; gw.style.flexDirection = "column"; }
  const f = document.getElementById("filters");     if (f) f.style.display = "flex";
  const s = document.getElementById("sort-options"); if (s) s.style.display = "flex";
}

function _showRoomBanner(roomId, role) {
  document.getElementById("mp-room-code").textContent = roomId;
  document.getElementById("mp-player-role").textContent =
    role === "teamA"    ? "🟣 Purple Team" :
    role === "teamB"    ? "🟠 Orange Team" :
    "👁 Spectator";
  document.getElementById("mp-room-banner").style.display = "flex";
  document.getElementById("mp-copy-code").onclick = () => {
    navigator.clipboard.writeText(roomId);
    document.getElementById("mp-copy-code").textContent = "✅ Copied!";
    setTimeout(() => { document.getElementById("mp-copy-code").textContent = "📋 Copy"; }, 2000);
  };
}

function _updateRoleSelectorUI() {
  document.querySelectorAll(".mp-role-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.role === mpState.playerRole);
  });
  // Show role selector only when in a room
  const sel = document.getElementById("mp-role-selector");
  if (sel) sel.style.display = mpState.enabled ? "flex" : "none";
}

function _showMpError(msg) {
  const el = document.getElementById("mp-error");
  if (!el) return;
  el.textContent = msg; el.style.display = "block";
  setTimeout(() => { el.style.display = "none"; }, 5000);
}

window._mpIsMyTurn = isMyTurn;

initSortSelect();
initFilters();
initSearch();