// damageDisplay.js - Affichage des dégâts et résultats

import { state } from './state.js';
import { getModifiedStats, calculateDamage, getAutoAttackResults } from './damageCalculator.js';
import { updateHPDisplays } from './uiManager.js';
import { stackableItems } from './constants.js';

const movesGrid = document.getElementById("movesGrid");

export function updateDamages() {
  if (!state.currentAttacker?.moves?.length) {
    movesGrid.innerHTML = `<div class="loading">Sélectionne un attaquant !</div>`;
    return;
  }

  const atkStats = getModifiedStats(state.currentAttacker, state.attackerLevel, state.attackerItems, state.attackerItemStacks, state.attackerItemActivated);
  const defStats = getModifiedStats(state.currentDefender, state.defenderLevel, state.defenderItems, state.defenderItemStacks, state.defenderItemActivated);
  const currentDefHP = Math.floor(defStats.hp * (state.defenderHPPercent / 100));

  document.getElementById('resultsAttackerName').textContent = state.currentAttacker.displayName;
  document.getElementById('resultsDefenderName').textContent = state.currentDefender?.displayName || 'Aucun';
  document.getElementById('attackerAtk').textContent = atkStats.atk.toLocaleString();
  document.getElementById('attackerSpAtk').textContent = atkStats.sp_atk.toLocaleString();

  const isCustom = state.currentDefender?.pokemonId === "custom-doll";

  if (isCustom) {
    document.getElementById('defenderMaxHP').textContent = defStats.hp.toLocaleString();
    document.getElementById('defenderDefCustom').textContent = defStats.def.toLocaleString();
    document.getElementById('defenderSpDefCustom').textContent = defStats.sp_def.toLocaleString();
  } else {
    document.getElementById('defenderDef').textContent = defStats.def.toLocaleString();
    document.getElementById('defenderSpDef').textContent = defStats.sp_def.toLocaleString();
  }

  let baseCritChance = 0;
  if (state.currentAttacker && state.currentAttacker.stats) {
    const levelIndex = state.attackerLevel - 1;
    baseCritChance = state.currentAttacker.stats[levelIndex]?.crit || 0;
  }

  let totalCritChance = baseCritChance;
  state.attackerItems.forEach(item => {
    if (item && item.stats) {
      const critStat = item.stats.find(s => s.label === "Critical-Hit Rate");
      if (critStat && critStat.percent && critStat.value) {
        totalCritChance += critStat.value;
      }
    }
  });

  totalCritChance = Math.min(100, totalCritChance);
  document.getElementById('attackerCritChance').textContent = `${totalCritChance}%`;

  document.querySelectorAll('.global-bonus-line').forEach(el => el.remove());

  const itemEffects = applyItemsAndGlobalEffects(atkStats, defStats);
  applyPassiveEffects(atkStats, defStats);

  let defenderDamageMult = 1.0;
  if (state.defenderEldegossBuff) defenderDamageMult *= 0.85;
  if (state.defenderNinetailsBuff) defenderDamageMult *= 0.65;
  if (state.defenderNinetailsPlusBuff) defenderDamageMult *= 0.60;
  if (state.defenderUmbreonBuff) defenderDamageMult *= 0.85;
  if (state.defenderUmbreonPlusBuff) defenderDamageMult *= 0.75;
  if (state.defenderBlisseyRedirectionBuff) defenderDamageMult *= 0.50;
  if (state.defenderHoOhRedirectionBuff) defenderDamageMult *= 0.40;
  if (state.defenderDhelmiseAnchorShotPlus) defenderDamageMult *= 1.50;

  const finalEffects = {
    ...itemEffects,
    infiltratorIgnore: state.currentAttacker?.pokemonId === "chandelure" ? Math.min(state.attackerPassiveStacks * 0.025, 0.20) : 0,
    defenderFlashFireReduction: state.currentDefender?.pokemonId === "armarouge" && state.defenderFlashFireActive ? 0.20 : 0,
    defenderDamageMult
  };

  displayMoves(atkStats, defStats, finalEffects, currentDefHP);
  updateHPDisplays();
}

function applyItemsAndGlobalEffects(atkStats, defStats) {
  const attackerCard = document.querySelector('.attacker-stats');
  const defenderCard = document.querySelector('.defender-stats');

  let choiceSpecsBonus = 0;
  let hasChoiceSpecs = false;
  let slickIgnore = 0;
  let scopeCritBonus = 1.0;
  let globalDamageMult = 1.0;

  if (state.attackerGroudonBuff) globalDamageMult *= 1.50;
  if (state.attackerRayquazaBuff) globalDamageMult *= 1.40;
  if (state.attackerBlisseyHandBuff) globalDamageMult *= 1.15;
  if (state.attackerMimeSwapBuff) globalDamageMult *= 1.15;
  if (state.attackerMimeSwapPlusBuff) globalDamageMult *= 1.20;
  if (state.attackerMiraidonBuff) {
    globalDamageMult *= 1.10;
    if (state.currentAttacker?.pokemonId === "miraidon") {
      globalDamageMult *= 1.30;
    }
  }

  if (state.debuffGoodraMuddyWater) globalDamageMult *= 0.85;
  if (state.debuffMimePowerSwap) globalDamageMult *= 0.85;
  if (state.debuffMimePowerSwapPlus) globalDamageMult *= 0.80;
  if (state.debuffTrevenantWoodHammerPlus) globalDamageMult *= 0.80;
  if (state.debuffPsyduckSurfPlus) globalDamageMult *= 0.75;
  if (state.debuffPsyduckUnite) globalDamageMult *= 0.70;
  if (state.debuffLatiasMistBall) globalDamageMult *= 0.75;

  state.attackerItems.forEach((item, i) => {
    if (!item) return;

    if (item.name === "Choice Specs") {
      hasChoiceSpecs = true;
      const percent = parseFloat(item.level20.replace('%', '').trim()) / 100;
      choiceSpecsBonus = Math.floor(atkStats.sp_atk * percent);
    }

    if (item.name === "Slick Spoon" && state.attackerItemActivated[i]) {
      slickIgnore = parseFloat(item.level20.replace('%', '').trim()) / 100 || 0;
    }

    if (item.name === "Scope Lens" && item.stats) {
      const critStat = item.stats.find(s => s.label === "Critical-Hit Damage");
      if (critStat?.value) scopeCritBonus = critStat.value;
    }

    if (item.activable && state.attackerItemActivated[i] && item.activation_effect) {
      item.activation_effect.stats.forEach(s => {
        if (s.label === "Damage" && s.percent) globalDamageMult *= (1 + s.value / 100);
      });
    }
  });

  const chargingIdx = state.attackerItems.findIndex(i => i?.name === "Charging Charm");
  if (chargingIdx !== -1 && state.attackerItemActivated[chargingIdx]) {
    const item = state.attackerItems[chargingIdx];
    const percent = parseFloat(item.level20.replace('%', '')) / 100;
    const exampleDef = state.currentAttacker.style === "special" ? defStats.sp_def : defStats.def;
    const chargingBase = 40 + Math.floor(atkStats.atk * percent);
    const chargingExtra = calculateDamage({ constant: chargingBase, multiplier: 0, levelCoef: 0 }, atkStats.atk, exampleDef, state.attackerLevel, false, null, 1.0, globalDamageMult);

    const line = document.createElement("div");
    line.className = "global-bonus-line";
    line.innerHTML = `
      <div style="margin:12px 0;padding:8px;background:#2a2a3a;border-radius:8px;font-size:0.95rem;">
        <strong>Charging Charm</strong> (full stack)<br>
        <span style="color:#a0d8ff;">+${chargingExtra.toLocaleString()} additional damages</span>
      </div>
    `;
    attackerCard.appendChild(line);
  }

  const rockyIdx = state.defenderItems.findIndex(i => i?.name === "Rocky Helmet");
  if (rockyIdx !== -1) {
    const item = state.defenderItems[rockyIdx];
    const percent = parseFloat(item.level20.replace('%', '')) / 100;
    const rockyDamage = Math.floor(defStats.hp * percent);
    const line = document.createElement("div");
    line.className = "global-bonus-line";
    line.innerHTML = `
      <div style="margin:12px 0;padding:10px;background:#3a2a2a;border-radius:8px;border-left:4px solid #ff6b6b;font-size:0.95rem;">
        <strong>🪨 Rocky Helmet</strong><br>
        <span style="color:#ff9999;">Deal ${rockyDamage.toLocaleString()} damage when hit</span>
      </div>
    `;
    defenderCard.appendChild(line);
  }

  return { choiceSpecsBonus, hasChoiceSpecs, slickIgnore, scopeCritBonus, globalDamageMult };
}

function applyPassiveEffects(atkStats, defStats) {
  const attackerCard = document.querySelector('.attacker-stats');
  const defenderCard = document.querySelector('.defender-stats');

  if (state.currentAttacker?.pokemonId === "chandelure") {
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
    line.querySelector('.minus').onclick = () => { if (state.attackerPassiveStacks > 0) { state.attackerPassiveStacks--; updateDamages(); } };
    line.querySelector('.plus').onclick = () => { if (state.attackerPassiveStacks < 8) { state.attackerPassiveStacks++; updateDamages(); } };
    attackerCard.appendChild(line);
  }

  if (state.currentAttacker?.pokemonId === "aegislash") {
    const isSword = state.attackerStance === 'sword';
    const line = document.createElement("div");
    line.className = "global-bonus-line";
    line.innerHTML = `
      <div style="margin:12px 0;padding:10px;background:#2a2a3a;border-radius:8px;border-left:4px solid #e67e22;display:flex;align-items:center;gap:12px;">
        <img src="assets/moves/aegislash/stance_change.png" style="width:40px;height:40px;border-radius:6px;" onerror="this.src='assets/moves/missing.png'">
        <div style="flex:1;">
          <strong style="color:#e67e22;">Stance Change</strong><br>
          Forme: <strong style="color:${isSword?'#e74c3c':'#3498db'};">${isSword?'Blade':'Shield'}</strong><br>
          <button class="stance-toggle" style="margin-top:8px;padding:8px 16px;background:${isSword?'#3498db':'#e74c3c'};color:white;border:none;border-radius:6px;cursor:pointer;">
            Switch to ${isSword?'Shield':'Blade'} Forme
          </button>
        </div>
      </div>
    `;
    line.querySelector('.stance-toggle').onclick = () => { state.attackerStance = isSword ? 'shield' : 'sword'; updateDamages(); };
    attackerCard.appendChild(line);
  }

  if (state.currentDefender?.pokemonId === "aegislash") {
    const isSword = state.defenderStance === 'sword';
    const line = document.createElement("div");
    line.className = "global-bonus-line";
    line.innerHTML = `
      <div style="margin:12px 0;padding:10px;background:#3a2a2a;border-radius:8px;border-left:4px solid #e67e22;display:flex;align-items:center;gap:12px;">
        <img src="assets/moves/aegislash/stance_change.png" style="width:40px;height:40px;border-radius:6px;" onerror="this.src='assets/moves/missing.png'">
        <div style="flex:1;">
          <strong style="color:#e67e22;">Stance Change</strong><br>
          Forme: <strong style="color:${isSword?'#e74c3c':'#3498db'};">${isSword?'Blade':'Shield'}</strong><br>
          <button class="stance-toggle" style="margin-top:8px;padding:8px 16px;background:${isSword?'#3498db':'#e74c3c'};color:white;border:none;border-radius:6px;cursor:pointer;">
            Switch to ${isSword?'Shield':'Blade'} Forme
          </button>
        </div>
      </div>
    `;
    line.querySelector('.stance-toggle').onclick = () => { state.defenderStance = isSword ? 'shield' : 'sword'; updateDamages(); };
    defenderCard.appendChild(line);
  }

  if (state.currentAttacker?.pokemonId === "armarouge") {
    const exampleDef = state.currentAttacker.style === "special" ? defStats.sp_def : defStats.def;
    const passive = state.currentAttacker.passive || { extraAutoMultiplier: 60, extraAutoConstant: 120 };
    const flashBonus = calculateDamage({ multiplier: passive.extraAutoMultiplier, levelCoef: 0, constant: passive.extraAutoConstant }, atkStats.sp_atk, exampleDef, state.attackerLevel, false);

    const line = document.createElement("div");
    line.className = "global-bonus-line";
    line.innerHTML = `
      <div style="margin:12px 0;padding:10px;background:#2a2a3a;border-radius:8px;border-left:4px solid #ff9500;display:flex;align-items:center;gap:12px;">
        <img src="assets/moves/armarouge/flash_fire.png" style="width:40px;height:40px;border-radius:6px;" onerror="this.src='assets/moves/missing.png'">
        <div style="flex:1;">
          <strong style="color:#ff9500;">Flash Fire</strong><br>
          Next AA: <strong style="color:${state.attackerFlashFireActive?'#88ff88':'#ff6666'};">${state.attackerFlashFireActive?'Active':'Inactive'}</strong> (+${flashBonus.toLocaleString()} dmg)<br>
          <button class="flashfire-toggle" style="margin-top:8px;padding:8px 16px;background:${state.attackerFlashFireActive?'#27ae60':'#7f8c8d'};color:white;border:none;border-radius:6px;cursor:pointer;">
            ${state.attackerFlashFireActive?'Deactivate':'Activate'} proc
          </button>
        </div>
      </div>
    `;
    line.querySelector('.flashfire-toggle').onclick = () => { state.attackerFlashFireActive = !state.attackerFlashFireActive; updateDamages(); };
    attackerCard.appendChild(line);
  }

  if (state.currentDefender?.pokemonId === "armarouge") {
    const line = document.createElement("div");
    line.className = "global-bonus-line";
    line.innerHTML = `
      <div style="margin:12px 0;padding:10px;background:#3a2a2a;border-radius:8px;border-left:4px solid #ff9500;display:flex;align-items:center;gap:12px;">
        <img src="assets/moves/armarouge/flash_fire.png" style="width:40px;height:40px;border-radius:6px;" onerror="this.src='assets/moves/missing.png'">
        <div style="flex:1;">
          <strong style="color:#ff9500;">Flash Fire</strong><br>
          Damage Reduction: <strong style="color:${state.defenderFlashFireActive?'#88ff88':'#ff6666'};">${state.defenderFlashFireActive?'20%':'0%'}</strong><br>
          <button class="flashfire-toggle" style="margin-top:8px;padding:8px 16px;background:${state.defenderFlashFireActive?'#27ae60':'#7f8c8d'};color:white;border:none;border-radius:6px;cursor:pointer;">
            ${state.defenderFlashFireActive?'Deactivate':'Activate'} reduction
          </button>
        </div>
      </div>
    `;
    line.querySelector('.flashfire-toggle').onclick = () => { state.defenderFlashFireActive = !state.defenderFlashFireActive; updateDamages(); };
    defenderCard.appendChild(line);
  }
}

function displayMoves(atkStats, defStats, effects, currentDefHP) {
  const { choiceSpecsBonus, hasChoiceSpecs, slickIgnore, scopeCritBonus, globalDamageMult, infiltratorIgnore, defenderFlashFireReduction, defenderDamageMult } = effects;

  const aaResults = getAutoAttackResults(atkStats, defStats, currentDefHP, globalDamageMult);

  movesGrid.innerHTML = "";
  let firstHit = true;

  state.currentAttacker.moves.forEach(move => {
    const card = document.createElement("div");
    card.className = "move-card";

    const header = document.createElement("div");
    header.className = "move-title";
    header.innerHTML = `<img src="${move.image}" alt="${move.name}" onerror="this.src='assets/moves/missing.png'"> <strong>${move.name}</strong>`;
    card.appendChild(header);

    if (!move.damages || move.damages.length === 0 || move.damages.every(d => !d.dealDamage)) {
      const line = document.createElement("div");
      line.className = "damage-line";
      line.innerHTML = `<span class="dmg-name" style="color:#888;">Utility / No damage</span>`;
      card.appendChild(line);
      movesGrid.appendChild(card);
      return;
    }

    move.damages.forEach(dmg => {
      if (!dmg.dealDamage) return;

      let relevantAtk = state.currentAttacker.style === "special" ? atkStats.sp_atk : atkStats.atk;
      let relevantDef = state.currentAttacker.style === "special" ? defStats.sp_def : defStats.def;

      if (dmg.scaling === "physical") { relevantAtk = atkStats.atk; relevantDef = defStats.def; }
      if (dmg.scaling === "special") { relevantAtk = atkStats.sp_atk; relevantDef = defStats.sp_def; }

      let effectiveDef = relevantDef;
      if (slickIgnore > 0) effectiveDef = Math.floor(effectiveDef * (1 - slickIgnore));
      if (infiltratorIgnore > 0) effectiveDef = Math.floor(effectiveDef * (1 - infiltratorIgnore));
      if (defenderFlashFireReduction > 0) effectiveDef = Math.floor(effectiveDef / (1 - defenderFlashFireReduction));

      let normal = calculateDamage(dmg, relevantAtk, effectiveDef, state.attackerLevel, false, state.currentAttacker.pokemonId, 1.0, globalDamageMult);
      let crit = calculateDamage(dmg, relevantAtk, effectiveDef, state.attackerLevel, true, state.currentAttacker.pokemonId, scopeCritBonus, globalDamageMult);

      if (move.name === "Auto-attack" && state.attackerFlashFireActive && state.currentAttacker.pokemonId === "armarouge") {
        const passive = state.currentAttacker.passive || { extraAutoMultiplier: 60, extraAutoConstant: 120 };
        const bonus = calculateDamage({ multiplier: passive.extraAutoMultiplier, levelCoef: 0, constant: passive.extraAutoConstant }, relevantAtk, effectiveDef, state.attackerLevel);
        normal += bonus;
        crit += bonus;
      }

      normal = Math.floor(normal * defenderDamageMult);
      crit = Math.floor(crit * defenderDamageMult);

      let displayedNormal = normal;
      let displayedCrit = crit;

      if (hasChoiceSpecs && firstHit && (dmg.scaling === "special" || state.currentAttacker.style === "special")) {
        displayedNormal += choiceSpecsBonus;
        displayedCrit += choiceSpecsBonus;
        displayedNormal = Math.floor(displayedNormal * defenderDamageMult);
        displayedCrit = Math.floor(displayedCrit * defenderDamageMult);
      }

      const line = document.createElement("div");
      line.className = "damage-line";

      const canCrit = move.can_crit === "true" || move.can_crit === true;

      if (canCrit) {
        line.innerHTML = `
          <span class="dmg-name">${dmg.name}${dmg.notes ? `<br><i>${dmg.notes}</i>` : ""}</span>
          <div class="dmg-values">
            <span class="dmg-normal">${displayedNormal.toLocaleString()}</span>
            <span class="dmg-crit">(${displayedCrit.toLocaleString()})</span>
          </div>
        `;
      } else {
        line.innerHTML = `
          <span class="dmg-name">${dmg.name}${dmg.notes ? `<br><i>${dmg.notes}</i>` : ""}</span>
          <div class="dmg-values">
            <span class="dmg-normal">${displayedNormal.toLocaleString()}</span>
          </div>
        `;
      }

      card.appendChild(line);
      firstHit = false;
    });

    if (move.name === "Auto-attack") {
      if (aaResults.hasMuscle) {
        let muscleExtra = Math.floor(aaResults.muscleExtra * defenderDamageMult);
        const line = document.createElement("div");
        line.className = "damage-line";
        line.innerHTML = `<span class="dmg-name">Muscle Band bonus (remaining HP)</span><div class="dmg-values"><span class="dmg-crit">+ ${muscleExtra.toLocaleString()}</span></div>`;
        card.appendChild(line);
      }

      if (aaResults.hasScope) {
        let scopeExtra = Math.floor(aaResults.scopeExtra * defenderDamageMult);
        const line = document.createElement("div");
        line.className = "damage-line";
        line.innerHTML = `<span class="dmg-name">Scope Lens bonus (extra hit on crit)</span><div class="dmg-values"><span class="dmg-crit">+ ${scopeExtra.toLocaleString()}</span></div>`;
        card.appendChild(line);
      }

      let hasRazorClaw = false;
      let razorBonusPercent = 0;
      state.attackerItems.forEach(item => {
        if (item?.name === "Razor Claw" && item.level20) {
          hasRazorClaw = true;
          razorBonusPercent = parseFloat(item.level20.replace('%', '')) / 100;
        }
      });

      if (hasRazorClaw && razorBonusPercent > 0) {
        const razorExtraBase = Math.floor(atkStats.atk * razorBonusPercent) + 20;
        let razorExtra = calculateDamage({ constant: razorExtraBase, multiplier: 0, levelCoef: 0 }, atkStats.atk, defStats.def, state.attackerLevel, false, null, 1.0, globalDamageMult);
        razorExtra = Math.floor(razorExtra * defenderDamageMult);
        const line = document.createElement("div");
        line.className = "damage-line";
        line.innerHTML = `<span class="dmg-name">Razor Claw bonus (next AA after move)</span><div class="dmg-values"><span class="dmg-crit">+ ${razorExtra.toLocaleString()}</span></div>`;
        card.appendChild(line);
      }
    }

    movesGrid.appendChild(card);
  });
}