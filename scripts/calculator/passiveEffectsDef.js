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

function applyMegaGyaradosDefender(atkStats, defStats, card) {
  const passive = state.currentDefender.passive;

  const line = document.createElement("div");
  line.className = "global-bonus-line";
  line.innerHTML = `
    <div style="margin:12px 0;padding:10px;background:#2a2a3a;border-radius:8px;border-left:4px solid #3498db;display:flex;align-items:center;gap:12px;">
      <img src="assets/moves/mega_gyarados/intimidate.png" style="width:40px;height:40px;border-radius:6px;">
      <div style="flex:1;">
        <strong style="color:#3498db;">Intimidate</strong><br>
        HP +1200, Atk +100<br>
        <button class="intimidate-toggle"
          style="margin-top:8px;padding:8px 16px;background:${state.defenderMegaGyaradosEvolve ? '#27ae60' : '#7f8c8d'};color:white;border:none;border-radius:6px;cursor:pointer;">
          ${state.defenderMegaGyaradosEvolve ? 'Gyarados' : 'Magikarp'}
        </button>
      </div>
    </div>

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
  line.querySelector('.intimidate-toggle').onclick = () => {
    state.defenderMegaGyaradosEvolve = !state.defenderMegaGyaradosEvolve;
    updateDamages();
  };

  line.querySelector('.moldbreaker-toggle').onclick = () => {
    state.defenderMoldBreakerActive = !state.defenderMoldBreakerActive;
    updateDamages();
  };
  card.appendChild(line);
}

function applyGyaradosDefender(atkStats, defStats, card) {
  const line = document.createElement("div");
  line.className = "global-bonus-line";
  line.innerHTML = `
    <div style="margin:12px 0;padding:10px;background:#2a2a3a;border-radius:8px;border-left:4px solid #3498db;display:flex;align-items:center;gap:12px;">
      <img src="assets/moves/gyarados/moxie.png" style="width:40px;height:40px;border-radius:6px;">
      <div style="flex:1;">
        <strong style="color:#3498db;">Moxie</strong><br>
        HP +1200, Atk +100<br>
        <button class="moxiedef-toggle"
          style="margin-top:8px;padding:8px 16px;background:${state.defenderGyaradosEvolve ? '#27ae60' : '#7f8c8d'};color:white;border:none;border-radius:6px;cursor:pointer;">
          ${state.defenderGyaradosEvolve ? 'Gyarados' : 'Magikarp'}
        </button>
      </div>
    </div>
  `;
  line.querySelector('.moxiedef-toggle').onclick = () => {
    state.defenderGyaradosEvolve = !state.defenderGyaradosEvolve;
    updateDamages();
  };
  card.appendChild(line);
}

function applyCrustleDefender(atkStats, defStats, card) {
  const passive = state.currentDefender.passive;

  const missingHpPercent = 100 - state.defenderHPPercent;
  const stacks = Math.min(
    passive.stack.maxStacks,
    Math.floor(missingHpPercent / passive.stack.missingHpPercentPerStack)
  );  

  const level = state.defenderLevel;
  const bonusPerStack = 2 * (level - 1) + 6;
  const totalBonus = bonusPerStack * stacks;

  defStats.def += totalBonus;
  defStats.sp_def += totalBonus;

  const line = document.createElement("div");
  line.className = "global-bonus-line";
  line.innerHTML = `
    <div style="margin:12px 0;padding:10px;background:#24362e;border-radius:8px;border-left:4px solid #7fdc9f;display:flex;align-items:center;gap:12px;">
      <img src="${passive.image}" style="width:40px;height:40px;border-radius:6px;">
      <div style="flex:1;">
        <strong style="color:#7fdc9f;">${passive.name}</strong><br>
        ${stacks} stack(s)<br>
        Def +${totalBonus} · SpDef +${totalBonus}
      </div>
    </div>
  `;

  card.appendChild(line);
}

function applyDragoniteDefender(atkStats, defStats, card) {
  const level = state.defenderLevel;

  const marvelActive = state.defenderMarvelScaleActive || false;
  const multiscaleActive = state.defenderMultiscaleActive || false;

  let content = "";

  if (level <= 8) {
    if (marvelActive) {
      defStats.def += 100;
    }

    content += `
      <div style="margin:12px 0;padding:10px;background:#2a2a3a;border-radius:8px;border-left:4px solid #9b59b6;display:flex;align-items:center;gap:12px;">
        <img src="assets/moves/dragonite/marvel_scale.png" style="width:40px;height:40px;border-radius:6px;" onerror="this.src='assets/moves/missing.png'">
        <div style="flex:1;">
          <strong style="color:#9b59b6;">Marvel Scale</strong><br>
          Status condition: <strong style="color:${marvelActive ? '#3498db' : '#e74c3c'};">${marvelActive ? 'Afflicted' : 'None'}</strong><br>
          Def +100<br>
          <button class="marvel-toggle"
            style="margin-top:8px;padding:6px 14px;background:${marvelActive ? '#3498db' : '#e74c3c'};color:white;border:none;border-radius:6px;cursor:pointer;">
            ${marvelActive ? 'Remove Status' : 'Apply Status'}
          </button>
        </div>
      </div>
    `;
  }

  if (level >= 9) {
    content += `
      <div style="margin:12px 0;padding:10px;background:#2a2a3a;border-radius:8px;border-left:4px solid #3498db;display:flex;align-items:center;gap:12px;">
        <img src="assets/moves/dragonite/multiscale.png" style="width:40px;height:40px;border-radius:6px;" onerror="this.src='assets/moves/missing.png'">
        <div style="flex:1;">
          <strong style="color:#3498db;">Multiscale</strong><br>
          Buff: <strong style="color:${multiscaleActive ? '#3498db' : '#e74c3c'};">${multiscaleActive ? 'Active' : 'Inactive'}</strong><br>
          Damage taken −30%<br>
          <button class="multiscale-toggle"
            style="margin-top:8px;padding:6px 14px;background:${multiscaleActive ? '#3498db' : '#e74c3c'};color:white;border:none;border-radius:6px;cursor:pointer;">
            ${multiscaleActive ? 'Disable Buff' : 'Enable Buff'}
          </button>
        </div>
      </div>
    `;
  }

  if (!content) return;

  const line = document.createElement("div");
  line.className = "global-bonus-line";
  line.innerHTML = content;

  if (level <= 8) {
    line.querySelector('.marvel-toggle')?.addEventListener('click', () => {
      state.defenderMarvelScaleActive = !marvelActive;
      updateDamages();
    });
  }

  if (level >= 9) {
    line.querySelector('.multiscale-toggle')?.addEventListener('click', () => {
      state.defenderMultiscaleActive = !multiscaleActive;
      updateDamages();
    });
  }

  card.appendChild(line);
}

function applyLaprasDefender(atkStats, defStats, card) {
  const passive = state.currentDefender.passive;

  const line = document.createElement("div");
  line.className = "global-bonus-line";
  line.innerHTML = `
    <div style="margin:12px 0;padding:10px;background:#24362e;border-radius:8px;border-left:4px solid #7fdc9f;display:flex;align-items:center;gap:12px;">
      <img src="${passive.image}" style="width:40px;height:40px;border-radius:6px;">
      <div style="flex:1;">
        <strong style="color:#7fdc9f;">${passive.name}</strong><br>
        ${passive.description}
      </div>
    </div>
  `;

  card.appendChild(line);
}

function applyMamoswineDefender(atkStats, defStats, card) {
  const passive = state.currentDefender.passive;

  const line = document.createElement("div");
  line.className = "global-bonus-line";
  line.innerHTML = `
    <div style="margin:12px 0;padding:10px;background:#2a2a3a;border-radius:8px;border-left:4px solid #bb86fc;display:flex;align-items:center;gap:12px;">
      <img src="${passive.image}" style="width:40px;height:40px;border-radius:6px;" onerror="this.src='assets/moves/missing.png'">
      <div style="flex:1;">
        <strong style="color:#bb86fc;">${passive.name}</strong><br>
        Stacks: <button class="stack-btn minus">-</button> <strong style="color:#a0d8ff;">${state.defenderPassiveStacks}</strong>/3 <button class="stack-btn plus">+</button>
      </div>
    </div>
  `;
  line.querySelector('.minus').onclick = () => {
    if (state.defenderPassiveStacks > 0) {
      state.defenderPassiveStacks--;
      updateDamages();
    }
  };
  line.querySelector('.plus').onclick = () => {
    if (state.defenderPassiveStacks < 3) {
      state.defenderPassiveStacks++;
      updateDamages();
    }
  };
  card.appendChild(line);
}

// Export pour le fichier damageDisplay.js
export {
  applyAegislashDefender,
  applyArmarougeDefender,
  applyZardxDefender,
  applyMegaGyaradosDefender,
  applyGyaradosDefender,
  applyCrustleDefender,
  applyDragoniteDefender,
  applyLaprasDefender,
  applyMamoswineDefender
};
