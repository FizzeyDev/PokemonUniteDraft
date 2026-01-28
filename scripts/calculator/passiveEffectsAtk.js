import { state } from './state.js';
import { calculateDamage } from './damageCalculator.js';
import { updateDamages } from './damageDisplay.js';

function applyBuzzwoleAttacker(atkStats, defStats, card) {
  const line = document.createElement("div");
  line.className = "global-bonus-line";
  line.innerHTML = `
    <div style="margin:12px 0;padding:10px;background:#2a2a3a;border-radius:8px;border-left:4px solid #bb86fc;display:flex;align-items:center;gap:12px;">
      <img src="assets/moves/buzzwole/beast_boost.png" style="width:40px;height:40px;border-radius:6px;" onerror="this.src='assets/moves/missing.png'">
      <div style="flex:1;">
        <strong style="color:#bb86fc;">Beast Boost</strong><br>
        Stacks: <button class="stack-btn minus">-</button> <strong style="color:#a0d8ff;">${state.attackerPassiveStacks}</strong>/6 <button class="stack-btn plus">+</button>
      </div>
    </div>
  `;
  line.querySelector('.minus').onclick = () => {
    if (state.attackerPassiveStacks > 0) {
      state.attackerPassiveStacks--;
      updateDamages();
    }
  };
  line.querySelector('.plus').onclick = () => {
    if (state.attackerPassiveStacks < 6) {
      state.attackerPassiveStacks++;
      updateDamages();
    }
  };
  card.appendChild(line);
}

function applyCeruledgeAttacker(atkStats, defStats, card) {
  const line = document.createElement("div");
  line.className = "global-bonus-line";
  line.innerHTML = `
    <div style="margin:12px 0;padding:10px;background:#2a2a3a;border-radius:8px;border-left:4px solid #bb86fc;display:flex;align-items:center;gap:12px;">
      <img src="assets/moves/ceruledge/weak_armor.png" style="width:40px;height:40px;border-radius:6px;" onerror="this.src='assets/moves/missing.png'">
      <div style="flex:1;">
        <strong style="color:#bb86fc;">Weak Armor</strong><br>
        Stacks: <button class="stack-btn minus">-</button> <strong style="color:#a0d8ff;">${state.attackerPassiveStacks}</strong>/6 <button class="stack-btn plus">+</button>
      </div>
    </div>
  `;
  line.querySelector('.minus').onclick = () => {
    if (state.attackerPassiveStacks > 0) {
      state.attackerPassiveStacks--;
      updateDamages();
    }
  };
  line.querySelector('.plus').onclick = () => {
    if (state.attackerPassiveStacks < 6) {
      state.attackerPassiveStacks++;
      updateDamages();
    }
  };
  card.appendChild(line);
}

function applyChandelureAttacker(atkStats, defStats, card) {
  const line = document.createElement("div");
  line.className = "global-bonus-line";
  line.innerHTML = `
    <div style="margin:12px 0;padding:10px;background:#2a2a3a;border-radius:8px;border-left:4px solid #bb86fc;display:flex;align-items:center;gap:12px;">
      <img src="assets/moves/chandelure/infiltrator.png" style="width:40px;height:40px;border-radius:6px;" onerror="this.src='assets/moves/missing.png'">
      <div style="flex:1;">
        <strong style="color:#bb86fc;">Infiltrator</strong><br>
        Stacks: <button class="stack-btn minus">-</button> <strong style="color:#a0d8ff;">${state.attackerPassiveStacks}</strong>/8 <button class="stack-btn plus">+</button>
        → Ignore ${(state.attackerPassiveStacks * 2.5).toFixed(1)}% Sp. Def
      </div>
    </div>
  `;
  line.querySelector('.minus').onclick = () => {
    if (state.attackerPassiveStacks > 0) {
      state.attackerPassiveStacks--;
      updateDamages();
    }
  };
  line.querySelector('.plus').onclick = () => {
    if (state.attackerPassiveStacks < 8) {
      state.attackerPassiveStacks++;
      updateDamages();
    }
  };
  card.appendChild(line);
}

function applyDarkraiAttacker(atkStats, defStats, card) {
  const asleep = state.attackerDarkraiSleep || false;

  const line = document.createElement("div");
  line.className = "global-bonus-line";
  line.innerHTML = `
    <div style="margin:12px 0;padding:10px;background:#2a2a3a;border-radius:8px;border-left:4px solid #bb86fc;display:flex;align-items:center;gap:12px;">
      <img src="assets/moves/darkrai/bad_dreams.png" style="width:40px;height:40px;border-radius:6px;" onerror="this.src='assets/moves/missing.png'">
      <div style="flex:1;">
        <strong style="color:#bb86fc;">Bad Dreams</strong><br>
        Status: <strong style="color:${asleep ? '#3498db' : '#e74c3c'};">${asleep ? 'Active' : 'Inactive'}</strong><br>
        <button class="sleep-toggle" style="margin-top:8px;padding:6px 14px;background:${asleep ? '#3498db' : '#e74c3c'};color:white;border:none;border-radius:6px;cursor:pointer;">
          ${asleep ? 'Asleep' : 'Awake'}
        </button>
      </div>
    </div>
  `;

  line.querySelector('.sleep-toggle').onclick = () => {
    if (!asleep) {
      state.attackerDarkraiSleep = true;
    } else {
      state.attackerDarkraiSleep = false;
    }
    updateDamages();
  };
  card.appendChild(line);
}

function applyDecidueyeAttacker(atkStats, defStats, card) {
  const distant = state.attackerDecidueyeDistant || false;

  const line = document.createElement("div");
  line.className = "global-bonus-line";
  line.innerHTML = `
    <div style="margin:12px 0;padding:10px;background:#1f2f24;border-radius:8px;border-left:4px solid #6fcf97;display:flex;align-items:center;gap:12px;">
      <img src="assets/moves/decidueye/long_reach.png" style="width:40px;height:40px;border-radius:6px;" onerror="this.src='assets/moves/missing.png'">
      <div style="flex:1;">
        <strong style="color:#6fcf97;">Long Reach</strong><br>
        Target: <strong style="color:${distant ? '#6fcf97' : '#e67e22'};">${distant ? 'Distant' : 'Close'}</strong><br>
        Damage bonus: <strong>+20%</strong><br>
        <button class="distance-toggle"
          style="margin-top:8px;padding:6px 14px;background:${distant ? '#6fcf97' : '#e67e22'};color:white;border:none;border-radius:6px;cursor:pointer;">
          ${distant ? 'Distant' : 'Close'}
        </button>
      </div>
    </div>
  `;

  line.querySelector('.distance-toggle').onclick = () => {
    state.attackerDecidueyeDistant = !distant;
    updateDamages();
  };

  card.appendChild(line);
}

function applyZardyAttacker(atkStats, defStats, card) {
  const blazeActive = state.attackerBlazeActive || false;
  const droughtActive = state.attackerDroughtActive || false;

  const line = document.createElement("div");
  line.className = "global-bonus-line";
  line.innerHTML = `
    <div style="margin:12px 0;padding:10px;background:#2a2a3a;border-radius:8px;border-left:4px solid #e67e22;display:flex;align-items:center;gap:12px;">
      <img src="assets/moves/mega_charizard_y/blaze.png" style="width:40px;height:40px;border-radius:6px;" onerror="this.src='assets/moves/missing.png'">
      <div style="flex:1;">
        <strong style="color:#e67e22;">Blaze</strong><br>
        Status: <strong style="color:${blazeActive ? '#3498db' : '#e74c3c'};">${blazeActive ? 'Active' : 'Inactive'}</strong><br>
        <button class="blaze-toggle" style="margin-top:8px;padding:6px 14px;background:${blazeActive ? '#3498db' : '#e74c3c'};color:white;border:none;border-radius:6px;cursor:pointer;">
          ${blazeActive ? 'Remove Blaze' : 'Trigger Blaze'}
        </button>
      </div>
    </div>

    <div style="margin:12px 0;padding:10px;background:#2a2a3a;border-radius:8px;border-left:4px solid #f1c40f;display:flex;align-items:center;gap:12px;">
      <img src="assets/moves/mega_charizard_y/drought.png" style="width:40px;height:40px;border-radius:6px;" onerror="this.src='assets/moves/missing.png'">
      <div style="flex:1;">
        <strong style="color:#f1c40f;">Drought</strong><br>
        Sunny Area: <strong style="color:${droughtActive ? '#3498db' : '#e74c3c'};">${droughtActive ? 'Active' : 'Inactive'}</strong><br>
        <button class="drought-toggle" style="margin-top:8px;padding:6px 14px;background:${droughtActive ? '#3498db' : '#e74c3c'};color:#222;border:none;border-radius:6px;cursor:pointer;">
          ${droughtActive ? 'Disable Sun' : 'Enable Sun'}
        </button>
      </div>
    </div>
  `;

  line.querySelector('.blaze-toggle').onclick = () => {
    if (!blazeActive) {
      state.attackerBlazeActive = true;
      state.attackerDroughtActive = false;
    } else {
      state.attackerBlazeActive = false;
    }
    updateDamages();
  };

  line.querySelector('.drought-toggle').onclick = () => {
    if (!droughtActive) {
      state.attackerDroughtActive = true;
      state.attackerBlazeActive = false;
    } else {
      state.attackerDroughtActive = false;
    }
    updateDamages();
  };

  card.appendChild(line);
}

function applyAegislashAttacker(atkStats, defStats, card) {
  const isSword = state.attackerStance === 'sword';
  const line = document.createElement("div");
  line.className = "global-bonus-line";
  line.innerHTML = `
    <div style="margin:12px 0;padding:10px;background:#2a2a3a;border-radius:8px;border-left:4px solid #e67e22;display:flex;align-items:center;gap:12px;">
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
    state.attackerStance = isSword ? 'shield' : 'sword';
    updateDamages();
  };
  card.appendChild(line);
}

function applyArmarougeAttacker(atkStats, defStats, card) {
  const exampleDef = state.currentAttacker.style === "special" ? defStats.sp_def : defStats.def;
  const passive = state.currentAttacker.passive || { extraAutoMultiplier: 60, extraAutoConstant: 120 };
  const flashBonus = calculateDamage(
    { multiplier: passive.extraAutoMultiplier, levelCoef: 0, constant: passive.extraAutoConstant },
    atkStats.sp_atk,
    exampleDef,
    state.attackerLevel,
    false
  );

  const line = document.createElement("div");
  line.className = "global-bonus-line";
  line.innerHTML = `
    <div style="margin:12px 0;padding:10px;background:#2a2a3a;border-radius:8px;border-left:4px solid #ff9500;display:flex;align-items:center;gap:12px;">
      <img src="assets/moves/armarouge/flash_fire.png" style="width:40px;height:40px;border-radius:6px;" onerror="this.src='assets/moves/missing.png'">
      <div style="flex:1;">
        <strong style="color:#ff9500;">Flash Fire</strong><br>
        Next AA: <strong style="color:${state.attackerFlashFireActive ? '#88ff88' : '#ff6666'};">${state.attackerFlashFireActive ? 'Active' : 'Inactive'}</strong> (+${flashBonus.toLocaleString()} dmg)<br>
        <button class="flashfire-toggle" style="margin-top:8px;padding:8px 16px;background:${state.attackerFlashFireActive ? '#27ae60' : '#7f8c8d'};color:white;border:none;border-radius:6px;cursor:pointer;">
          ${state.attackerFlashFireActive ? 'Deactivate' : 'Activate'} proc
        </button>
      </div>
    </div>
  `;
  line.querySelector('.flashfire-toggle').onclick = () => {
    state.attackerFlashFireActive = !state.attackerFlashFireActive;
    updateDamages();
  };
  card.appendChild(line);
}

function applyMegaGyaradosAttacker(atkStats, defStats, card) {
  const passive = state.currentAttacker.passive;
  const evolve = state.attackerMegaGyaradosEvolve;

  const line = document.createElement("div");
  line.className = "global-bonus-line";
  line.innerHTML = `
    <div style="margin:12px 0;padding:10px;background:#2a2a3a;border-radius:8px;border-left:4px solid #3498db;display:flex;align-items:center;gap:12px;">
      <img src="assets/moves/mega_gyarados/intimidate.png" style="width:40px;height:40px;border-radius:6px;">
      <div style="flex:1;">
        <strong style="color:#3498db;">Intimidate</strong><br>
        HP +1200, Atk +100<br>
        <button class="intimidate-toggle"
          style="margin-top:8px;padding:8px 16px;background:${state.attackerMegaGyaradosEvolve ? '#27ae60' : '#7f8c8d'};color:white;border:none;border-radius:6px;cursor:pointer;">
          ${state.attackerMegaGyaradosEvolve ? 'Gyarados' : 'Magikarp'}
        </button>
      </div>
    </div>

    <div style="margin:12px 0;padding:10px;background:#2a2a3a;border-radius:8px;border-left:4px solid #3498db;display:flex;align-items:center;gap:12px;">
      <img src="${passive.image}" style="width:40px;height:40px;border-radius:6px;">
      <div style="flex:1;">
        <strong style="color:#3498db;">${passive.name}</strong><br>
        Atk +${passive.bonusPercentAtk}% · Def Pen +${passive.bonusDefPen}%<br>
        <button class="moldbreaker-toggle"
          style="margin-top:8px;padding:8px 16px;background:${state.attackerMoldBreakerActive ? '#27ae60' : '#7f8c8d'};color:white;border:none;border-radius:6px;cursor:pointer;">
          ${state.attackerMoldBreakerActive ? 'Mega Evolve' : 'Normal'}
        </button>
      </div>
    </div>
  `;
  line.querySelector('.intimidate-toggle').onclick = () => {
    state.attackerMegaGyaradosEvolve = !state.attackerMegaGyaradosEvolve;
    updateDamages();
  };

  line.querySelector('.moldbreaker-toggle').onclick = () => {
    state.attackerMoldBreakerActive = !state.attackerMoldBreakerActive;
    updateDamages();
  };
  card.appendChild(line);
}

function applyGyaradosAttacker(atkStats, defStats, card) {
  const line = document.createElement("div");

  line.className = "global-bonus-line";
  line.innerHTML = `
    <div style="margin:12px 0;padding:10px;background:#2a2a3a;border-radius:8px;border-left:4px solid #3498db;display:flex;align-items:center;gap:12px;">
      <img src="assets/moves/gyarados/moxie.png" style="width:40px;height:40px;border-radius:6px;">
      <div style="flex:1;">
        <strong style="color:#3498db;">Moxie</strong><br>
        HP +1200, Atk +100<br>
        <button class="moxie-toggle"
          style="margin-top:8px;padding:8px 16px;background:${state.attackerGyaradosEvolve ? '#27ae60' : '#7f8c8d'};color:white;border:none;border-radius:6px;cursor:pointer;">
          ${state.attackerGyaradosEvolve ? 'Gyarados' : 'Magikarp'}
        </button>
      </div>
    </div>
  `;
  line.querySelector('.moxie-toggle').onclick = () => {
    state.attackerGyaradosEvolve = !state.attackerGyaradosEvolve;
    updateDamages();
  };
  card.appendChild(line);
}

// Export pour le fichier damageDisplay.js
export {
  applyBuzzwoleAttacker,
  applyCeruledgeAttacker,
  applyChandelureAttacker,
  applyDarkraiAttacker,
  applyDecidueyeAttacker,
  applyZardyAttacker,
  applyAegislashAttacker,
  applyArmarougeAttacker,
  applyMegaGyaradosAttacker,
  applyGyaradosAttacker
};
