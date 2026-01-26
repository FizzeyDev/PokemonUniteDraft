// damageCalculator.js - Calculs de dégâts

import { state } from './state.js';
import { stackableItems } from './constants.js';

export function getModifiedStats(pokemon, level, items, stacksArray, activatedArray) {
  let baseHp = 0;
  let baseAtk = 0;
  let baseSpAtk = 0;
  let baseDef = 0;
  let baseSpDef = 0;

  if (pokemon?.pokemonId === "custom-doll" && pokemon.customStats) {
    baseHp = pokemon.customStats.hp;
    baseDef = pokemon.customStats.def;
    baseSpDef = pokemon.customStats.sp_def;
  } else {
    const baseStats = pokemon?.stats?.[level - 1] || {};
    baseHp = baseStats.hp || 0;
    baseAtk = baseStats.atk || 0;
    baseSpAtk = baseStats.sp_atk || 0;
    baseDef = baseStats.def || 0;
    baseSpDef = baseStats.sp_def || 0;
  }

  let hp = baseHp;
  let atk = baseAtk;
  let sp_atk = baseSpAtk;
  let def = baseDef;
  let sp_def = baseSpDef;

  items.forEach((item, index) => {
    if (!item) return;

    if (item.name === "Wise Glasses" && item.level20) {
      const percent = parseFloat(item.level20.replace('%', '').trim()) / 100;
      sp_atk += Math.floor(baseSpAtk * percent);
    }

    if (stackableItems.includes(item.name) && item.stack_type === "percent" && item.level20) {
      const stacks = stacksArray[index];
      const valuePerStack = parseFloat(item.level20);
      const totalPercent = valuePerStack * stacks / 100;

      if (item.name === "Accel Bracer" || item.name === "Weakness Policy") {
        atk += Math.floor(baseAtk * totalPercent);
      } else if (item.name === "Drive Lens") {
        sp_atk += Math.floor(baseSpAtk * totalPercent);
      }
    }
  });

  items.forEach(item => {
    if (!item || !item.stats) return;
    item.stats.forEach(stat => {
      if (stat.label === "HP") hp += stat.value;
      else if (stat.label === "Attack") atk += stat.value;
      else if (stat.label === "Sp. Attack") sp_atk += stat.value;
      else if (stat.label === "Defense") def += stat.value;
      else if (stat.label === "Sp. Defense") sp_def += stat.value;
    });
  });

  items.forEach((item, index) => {
    if (!item || !item.level20 || item.stack_type !== "flat") return;

    const stacks = stacksArray[index];
    const valuePerStack = parseFloat(item.level20);
    const bonus = valuePerStack * stacks;

    if (item.name === "Attack Weight") atk += Math.floor(bonus);
    else if (item.name === "Sp. Atk Specs") sp_atk += Math.floor(bonus);
    else if (item.name === "Aeos Cookie") hp += Math.floor(bonus);
  });

  items.forEach((item, index) => {
    if (!item || !item.activable || !activatedArray[index] || !item.activation_effect) return;
    item.activation_effect.stats.forEach(stat => {
      const value = stat.value;
      if (!stat.percent) {
        if (stat.label.includes("HP") || stat.label.includes("Shield")) hp += value;
        else if (stat.label.includes("Attack")) atk += value;
      } else {
        const base = stat.label.includes("HP") ? baseHp :
                     stat.label.includes("Attack") && !stat.label.includes("Sp") ? baseAtk :
                     stat.label.includes("Sp. Attack") ? baseSpAtk :
                     stat.label.includes("Defense") ? baseDef :
                     baseSpDef;
        const bonus = Math.floor(base * (value / 100));
        if (stat.label.toLowerCase().includes("hp") || stat.label.toLowerCase().includes("shield")) hp += bonus;
        else if (stat.label.toLowerCase().includes("attack") && !stat.label.toLowerCase().includes("sp")) atk += bonus;
        else if (stat.label.toLowerCase().includes("sp.") && stat.label.toLowerCase().includes("attack")) sp_atk += bonus;
        else if (stat.label.toLowerCase().includes("defense")) def += bonus;
        else if (stat.label.toLowerCase().includes("sp.") && stat.label.toLowerCase().includes("defense")) sp_def += bonus;
      }
    });
  });

  if (pokemon === state.currentAttacker) {
    if (state.attackerRegisteelBuff) {
      atk += Math.floor(baseAtk * 0.15);
      sp_atk += Math.floor(baseSpAtk * 0.15);
    }
    if (state.attackerXAttackBuff) {
      atk += Math.floor(baseAtk * 0.20);
      sp_atk += Math.floor(baseSpAtk * 0.20);
    }
    if (state.attackerBlisseyUltBuff) {
      atk += Math.floor(baseAtk * 0.20);
      sp_atk += Math.floor(baseSpAtk * 0.20);
    }
    if (state.attackerAlcreamieBuff) {
      if (pokemon.style === "physical") {
        atk += 40;
      } else if (pokemon.style === "special") {
        sp_atk += 25;
      }
    }
  }

  if (pokemon === state.currentDefender) {
    if (state.defenderRegirockBuff) {
      def += Math.floor(baseDef * 0.30);
      sp_def += Math.floor(baseSpDef * 0.25);
    }
  }

  if (pokemon?.pokemonId === "aegislash") {
    const levelMinusOne = level - 1;
    const stance = (pokemon === state.currentAttacker) ? state.attackerStance : state.defenderStance;

    if (stance === 'sword') {
      atk += 15 * levelMinusOne + 40;
    } else {
      def += 25 * levelMinusOne + 80;
      sp_def += 20 * levelMinusOne + 40;
    }
  }

  if (pokemon === state.currentAttacker) {
    let atkMult = 1.0;
    let spMult = 1.0;

    if (state.debuffBuzzwoleLunge) atkMult *= 0.70;
    if (state.debuffCharizardBurn) atkMult *= 0.95;
    if (state.debuffCinderaceBurn) { atkMult *= 0.95; spMult *= 0.95; }
    if (state.debuffCramorantFeatherDance) atkMult *= 0.70;
    if (state.debuffDodrioTriAttackFlame) atkMult *= 0.92;
    if (state.debuffDodrioTriAttackFlameSprint) atkMult *= 0.88;
    if (state.debuffGengarWillOWisp) { atkMult *= 0.90; spMult *= 0.95; }
    if (state.debuffSlowbroScald) atkMult *= 0.40;
    if (state.debuffSylveonBabyDollEyes) atkMult *= 0.85;
    if (state.debuffTrevenantWillOWisp) { atkMult *= 0.90; spMult *= 0.95; }
    if (state.debuffTsareenaTropKick) atkMult *= 0.75;
    if (state.debuffInteleonTearfulLook) { atkMult *= 0.80; spMult *= 0.80; }
    if (state.debuffHoohFlamethrower) { atkMult *= 0.80; spMult *= 0.80; }
    if (state.debuffHoohSacredFire) atkMult *= 0.90;
    if (state.debuffHoohSacredFirePlus) atkMult *= 0.80;
    if (state.debuffTinkatonIceHammer) { atkMult *= 0.70; spMult *= 0.85; }
    if (state.debuffTinkatonIceHammerPlus) { atkMult *= 0.50; spMult *= 0.70; }
    if (state.debuffUmbreonSnarlFinalHit) { atkMult *= 0.85; spMult *= 0.85; }

    if (state.debuffUmbreonSnarl) {
      atkMult *= Math.pow(0.97, state.umbreonSnarlStacks);
      spMult *= Math.pow(0.97, state.umbreonSnarlStacks);
    }
    if (state.debuffSylveonMysticalFire) {
      spMult *= Math.pow(0.85, state.sylveonMysticalFireStacks);
    }

    atk = Math.floor(atk * atkMult);
    sp_atk = Math.floor(sp_atk * spMult);

    if (state.debuffAlcremieCharm) {
      atk -= 30;
      sp_atk -= 20;
    }

    atk = Math.max(1, atk);
    sp_atk = Math.max(1, sp_atk);
  }

  if (pokemon === state.currentDefender) {
    let defMult = 1.0;
    let spDefMult = 1.0;

    if (state.defenderAbsolBoosted) defMult *= 0.85;
    if (state.defenderCramorantBoostedGulpMissile) { defMult *= 0.80; spDefMult *= 0.95; }
    if (state.defenderDecidueyeShadowSneak) defMult *= 0.40;
    if (state.defenderDecidueyeShadowSneakPlus) defMult *= 0.20;
    if (state.defenderGardevoirBoosted) spDefMult *= 0.90;
    if (state.defenderGardevoirPsychic) spDefMult *= Math.pow(0.73, 3);
    if (state.defenderGlaceonTailWhip) { defMult *= 0.70; spDefMult *= 0.70; }
    if (state.defenderHoopaShadowBall) spDefMult *= 0.70;
    if (state.defenderMimePsychic) spDefMult *= Math.pow(0.95, 8);
    if (state.defenderSlowbroOblivious) spDefMult *= Math.pow(0.96, 5);
    if (state.defenderSylveonHyperVoice) spDefMult *= Math.pow(0.80, 4);
    if (state.defenderTsareenaBoosted) defMult *= 0.80;
    if (state.defenderUrshifuLiquidation) defMult *= 0.70;
    if (state.defenderVenusaurSludgeBomb) spDefMult *= 0.60;
    if (state.defenderWigglytuffSing) { defMult *= 0.75; spDefMult *= 0.75; }
    if (state.defenderUmbreonFakeTears) { defMult *= 0.80; spDefMult *= 0.80; }
    if (state.defenderMewtwoXUnite) defMult *= 0.80;
    if (state.defenderMewtwoYUnite) spDefMult *= 0.85;
    if (state.defenderTinkatonThief) { defMult *= 0.90; spDefMult *= 0.90; }
    if (state.defenderTinkatonThiefPlus) { defMult *= 0.75; spDefMult *= 0.75; }
    if (state.defenderPsyduckTailWhip) spDefMult *= 0.80;
    if (state.defenderPsyduckTailWhipMysterious) spDefMult *= 0.70;
    if (state.defenderPsyduckPsychicPlus) spDefMult *= 0.75;
    if (state.defenderAlolanRaichuStoredPowerPlus) spDefMult *= Math.pow(0.95, 3);
    if (state.defenderLatiasDragonBreath) spDefMult *= 0.70;
    if (state.defenderEmpoleonAquaJetTorrent) spDefMult *= 0.40;

    def = Math.floor(def * defMult);
    sp_def = Math.floor(sp_def * spDefMult);

    if (state.defenderGengarShadowBall) {
      const reduction = 80 + 5 * (state.defenderLevel - 1);
      sp_def = Math.max(1, sp_def - reduction);
    }
    if (state.defenderCeruledgePsychoCut) {
      const reduction = 10 + 2 * (state.defenderLevel - 1);
      def = Math.max(1, def - reduction);
    }
    if (state.defenderCeruledgePsychoCutPlus) {
      const reduction = 15 + 3 * (state.defenderLevel - 1);
      def = Math.max(1, def - reduction);
    }

    def = Math.max(0, def);
    sp_def = Math.max(0, sp_def);
  }

  return {
    hp: Math.floor(hp),
    atk: Math.floor(atk),
    sp_atk: Math.floor(sp_atk),
    def: Math.floor(def),
    sp_def: Math.floor(sp_def)
  };
}

export function calculateDamage(dmg, atkStat, defStat, level, crit = false, pokemonId = null, extraCritMult = 1.0, globalDamageMult = 1.0) {
  const atkScaling = Math.floor(atkStat * (dmg.multiplier / 100));
  const levelScaling = (level - 1) * dmg.levelCoef;
  let baseDamage = dmg.constant + atkScaling + levelScaling;

  let effectiveDef = defStat;

  if (state.currentDefender?.pokemonId === "armarouge" && state.defenderFlashFireActive) {
    effectiveDef = Math.floor(effectiveDef / (1 - 0.20));
  }

  const defReduction = 100 / (100 + effectiveDef * 0.165);
  let finalDamage = Math.floor(baseDamage * defReduction);

  if (crit) {
    let baseCritMult = 2.0;
    if (pokemonId === "azumarill") baseCritMult = 1.7;
    else if (pokemonId === "inteleon") baseCritMult = 2.5;

    finalDamage = Math.floor(finalDamage * baseCritMult * extraCritMult);
  }

  finalDamage = Math.floor(finalDamage * globalDamageMult);

  return Math.max(1, finalDamage);
}

export function getAutoAttackResults(atkStats, defStats, currentDefHP, globalDamageMult = 1.0) {
  const results = {
    normal: 0,
    crit: 0,
    muscleExtra: 0,
    muscleTotalNormal: 0,
    muscleTotalCrit: 0,
    scopeExtra: 0,
    totalCritWithScope: 0,
    scopePercent: 0,
    hasMuscle: false,
    hasScope: false
  };

  results.normal = calculateDamage(
    { constant: 0, multiplier: 100, levelCoef: 0 },
    atkStats.atk,
    defStats.def,
    state.attackerLevel,
    false,
    state.currentAttacker.pokemonId,
    1.0,
    globalDamageMult
  );

  let scopeCritBonus = 1.0;
  state.attackerItems.forEach(item => {
    if (item && item.name === "Scope Lens" && item.stats) {
      const critStat = item.stats.find(s => s.label === "Critical-Hit Damage");
      if (critStat && critStat.value) {
        scopeCritBonus = critStat.value;
        results.hasScope = true;
      }
    }
  });

  results.crit = calculateDamage(
    { constant: 0, multiplier: 100, levelCoef: 0 },
    atkStats.atk,
    defStats.def,
    state.attackerLevel,
    true,
    state.currentAttacker.pokemonId,
    scopeCritBonus,
    globalDamageMult
  );

  state.attackerItems.forEach(item => {
    if (item && item.name === "Muscle Band" && item.level20) {
      results.hasMuscle = true;
      const percent = parseFloat(item.level20.replace('%', '') / 100);
      let extra = Math.floor(currentDefHP * percent);
      extra = Math.min(extra, 360);

      results.muscleExtra = calculateDamage(
        { constant: extra, multiplier: 0, levelCoef: 0 },
        atkStats.atk,
        defStats.def,
        state.attackerLevel,
        false,
        null,
        1.0,
        globalDamageMult
      );

      results.muscleTotalNormal = results.normal + results.muscleExtra;
      results.muscleTotalCrit = results.crit + results.muscleExtra;
    }

    if (item && item.name === "Scope Lens") {
      results.hasScope = true;
      let percent = 45;
      if (item.level20 === "75%") percent = 75;
      else if (item.level20) percent = parseInt(item.level20.replace('%', '')) || 45;

      results.scopePercent = percent;
      const extraBase = Math.floor(atkStats.atk * (percent / 100));

      results.scopeExtra = calculateDamage(
        { constant: extraBase, multiplier: 0, levelCoef: 0 },
        atkStats.atk,
        defStats.def,
        state.attackerLevel,
        false,
        null,
        1.0,
        globalDamageMult
      );

      results.totalCritWithScope = results.crit + results.scopeExtra;
    }
  });

  return results;
}