import { state } from './state.js';
import { updateDamages } from './damageDisplay.js';

function applyAegislashDefender(atkStats, defStats, card) {
  const isSword = state.defenderStance === 'sword';
  const line = document.createElement("div");
  line.className = "global-bonus-line";
  line.innerHTML = `
    <div style="margin:12px 0;padding:10px;background:#3a2a2a;border-radius:8px;border-left:4px solid #e67e22;display:flex;align-items:center;gap:12px;">
      <img src="assets/moves/aegislash/stance_change.png" style="width:40px;height:40px;border-radius:6px;" onerror="this.src='assets/moves/missing.png'">
      <div style="flex:1;">
        <strong style="color:#e67e22;">Stance Change</strong><br>
        Forme: <strong style="color:${isSword ? '#e74c3c' : '#3498db'};">${isSword ? 'Blade' : 'Shield'}</strong><br>
        <button class="stance-toggle" style="margin-top:8px;padding:8px 16px;background:${isSword ? '#3498db' : '#e74c3c'};color:white;border:none;border-radius:6px;cursor:pointer;">
          Switch to ${isSword ? 'Shield' : 'Blade'} Forme
        </button>
      </div>
    </div>
  `;
  line.querySelector('.stance-toggle').onclick = () => {
    state.defenderStance = isSword ? 'shield' : 'sword';
    updateDamages();
  };
  card.appendChild(line);
}

function applyArmarougeDefender(atkStats, defStats, card) {
  const line = document.createElement("div");
  line.className = "global-bonus-line";
  line.innerHTML = `
    <div style="margin:12px 0;padding:10px;background:#3a2a2a;border-radius:8px;border-left:4px solid #ff9500;display:flex;align-items:center;gap:12px;">
      <img src="assets/moves/armarouge/flash_fire.png" style="width:40px;height:40px;border-radius:6px;" onerror="this.src='assets/moves/missing.png'">
      <div style="flex:1;">
        <strong style="color:#ff9500;">Flash Fire</strong><br>
        Damage Reduction: <strong style="color:${state.defenderFlashFireActive ? '#88ff88' : '#ff6666'};">${state.defenderFlashFireActive ? '20%' : '0%'}</strong><br>
        <button class="flashfire-toggle" style="margin-top:8px;padding:8px 16px;background:${state.defenderFlashFireActive ? '#27ae60' : '#7f8c8d'};color:white;border:none;border-radius:6px;cursor:pointer;">
          ${state.defenderFlashFireActive ? 'Deactivate' : 'Activate'} reduction
        </button>
      </div>
    </div>
  `;
  line.querySelector('.flashfire-toggle').onclick = () => {
    state.defenderFlashFireActive = !state.defenderFlashFireActive;
    updateDamages();
  };
  card.appendChild(line);
}

function applyZardxDefender(atkStats, defStats, card) {
  const passive = state.currentDefender.passive;

  const line = document.createElement("div");
  line.className = "global-bonus-line";
  line.innerHTML = `
    <div style="margin:12px 0;padding:10px;background:#3a2a2a;border-radius:8px;border-left:4px solid #3498db;display:flex;align-items:center;gap:12px;">
      <img src="${passive.image}" style="width:40px;height:40px;border-radius:6px;">
      <div style="flex:1;">
        <strong style="color:#3498db;">${passive.name}</strong><br>
        Def +${passive.bonusPercentDef}% · SpDef +${passive.bonusPercentSpDef}%<br>
        <button class="toughclaw-toggle"
          style="margin-top:8px;padding:8px 16px;background:${state.defenderZardToughClaw ? '#27ae60' : '#7f8c8d'};color:white;border:none;border-radius:6px;cursor:pointer;">
          ${state.defenderZardToughClaw ? 'Mega Evolve' : 'Normal'}
        </button>
      </div>
    </div>
  `;
  line.querySelector('.toughclaw-toggle').onclick = () => {
    state.defenderZardToughClaw = !state.defenderZardToughClaw;
    updateDamages();
  };
  card.appendChild(line);
}

function applyGyaradosDefender(atkStats, defStats, card) {
  const passive = state.currentDefender.passive;

  const line = document.createElement("div");
  line.className = "global-bonus-line";
  line.innerHTML = `
    <div style="margin:12px 0;padding:10px;background:#3a2a2a;border-radius:8px;border-left:4px solid #3498db;display:flex;align-items:center;gap:12px;">
      <img src="${passive.image}" style="width:40px;height:40px;border-radius:6px;">
      <div style="flex:1;">
        <strong style="color:#3498db;">${passive.name}</strong><br>
        Def +${passive.bonusPercentDef}% · SpDef +${passive.bonusPercentSpDef}%<br>
        <button class="moldbreaker-toggle"
          style="margin-top:8px;padding:8px 16px;background:${state.defenderMoldBreakerActive ? '#27ae60' : '#7f8c8d'};color:white;border:none;border-radius:6px;cursor:pointer;">
          ${state.defenderMoldBreakerActive ? 'Mega Evolve' : 'Normal'}
        </button>
      </div>
    </div>
  `;
  line.querySelector('.moldbreaker-toggle').onclick = () => {
    state.defenderMoldBreakerActive = !state.defenderMoldBreakerActive;
    updateDamages();
  };
  card.appendChild(line);
}

// Export pour le fichier damageDisplay.js
export {
  applyAegislashDefender,
  applyArmarougeDefender,
  applyZardxDefender,
  applyGyaradosDefender
};
