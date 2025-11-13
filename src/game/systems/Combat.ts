import { ConfigLoader } from '../config/ConfigLoader';
import { Character } from './Character';

// ========================================
// マッチアップ結果
// ========================================
export interface MatchupResult {
  winner: Character;
  loser: Character;
  attackerScore: number;
  defenderScore: number;
  damage: number;
}

// ========================================
// ダイスロール
// ========================================
export function rollDice(sides: number = 20): number {
  return Math.floor(Math.random() * sides) + 1;
}

// ========================================
// マッチアップスコア計算
// ========================================
export function calculateMatchupScore(
  character: Character,
  modifiers: number = 0
): number {
  const dice = rollDice(20);
  const attackStat = character.stats.attack;

  // バフによるボーナス計算
  const buffBonus = character.buffs
    .filter(buff => buff.type === 'buff')
    .reduce((sum, buff) => sum + buff.value, 0);

  // デバフによるペナルティ計算
  const debuffPenalty = character.buffs
    .filter(buff => buff.type === 'debuff')
    .reduce((sum, buff) => sum + buff.value, 0);

  const totalScore = dice + attackStat + modifiers + buffBonus - debuffPenalty;

  console.log(`[Combat] ${character.name} - Dice: ${dice}, Attack: ${attackStat}, Modifiers: ${modifiers}, Buffs: ${buffBonus}, Debuffs: ${debuffPenalty} = Total: ${totalScore}`);

  return totalScore;
}

// ========================================
// マッチアップ解決
// ========================================
export function resolveMatchup(
  attacker: Character,
  defender: Character,
  attackerModifiers: number = 0,
  defenderModifiers: number = 0
): MatchupResult {
  console.log(`[Combat] Matchup: ${attacker.name} vs ${defender.name}`);

  const attackerScore = calculateMatchupScore(attacker, attackerModifiers);
  const defenderScore = calculateMatchupScore(defender, defenderModifiers);

  const winner = attackerScore >= defenderScore ? attacker : defender;
  const loser = attackerScore >= defenderScore ? defender : attacker;

  const damage = calculateDamage(
    attackerScore,
    defenderScore,
    loser.stats.defense
  );

  console.log(`[Combat] ${winner.name} wins! Damage: ${damage}`);

  return { winner, loser, attackerScore, defenderScore, damage };
}

// ========================================
// ダメージ計算
// ========================================
export function calculateDamage(
  attackerScore: number,
  defenderScore: number,
  defenderDefense: number
): number {
  const config = ConfigLoader.get();
  const multiplier = config.combat_system.damage_multiplier;

  const difference = Math.abs(attackerScore - defenderScore);
  const rawDamage = difference * multiplier;
  const finalDamage = rawDamage - defenderDefense;

  return Math.max(0, Math.floor(finalDamage));
}

// ========================================
// クリティカル判定
// ========================================
export function checkCritical(character: Character, diceRoll: number): boolean {
  // アイテムからクリティカル閾値を取得
  const criticalItem = character.items.find(item => item.stats.critical_threshold);

  if (!criticalItem || !criticalItem.stats.critical_threshold) {
    return false;
  }

  return diceRoll >= criticalItem.stats.critical_threshold;
}

// ========================================
// クリティカルダメージ計算
// ========================================
export function applyCriticalDamage(damage: number, character: Character): number {
  const criticalItem = character.items.find(item => item.stats.critical_multiplier);

  if (!criticalItem || !criticalItem.stats.critical_multiplier) {
    return damage;
  }

  return Math.floor(damage * criticalItem.stats.critical_multiplier);
}

// ========================================
// ガンク補正計算
// ========================================
export function calculateGankModifier(
  ganker: Character,
  hasVision: boolean
): number {
  const config = ConfigLoader.get();
  const gankConfig = config.combat_modifiers.gank;

  let modifier = 0;

  // 視界なしボーナス
  if (!hasVision) {
    modifier += gankConfig.no_vision_bonus;
  }

  // 高Mobility判定
  if (ganker.stats.mobility >= gankConfig.mobility_threshold) {
    modifier += 2; // 高Mobilityボーナス
  }

  return modifier;
}

// ========================================
// ポジショニング補正
// ========================================
export function calculatePositioningModifier(
  attacker: Character,
  defender: Character
): number {
  const config = ConfigLoader.get();
  const positioningConfig = config.combat_modifiers.positioning;

  let modifier = 0;

  // フロントライン vs バックライン
  const frontlineRoles = ['ad_fighter', 'ad_tank', 'ap_fighter', 'ap_tank', 'tank_support'];
  const backlineRoles = ['ad_marksman', 'ap_mage', 'ap_support'];
  const assassinRoles = ['ad_assassin', 'ap_assassin'];

  const attackerIsFrontline = frontlineRoles.includes(attacker.role);
  const defenderIsBackline = backlineRoles.includes(defender.role);

  // フロントラインがバックラインを攻撃する場合のペナルティ
  if (attackerIsFrontline && defenderIsBackline) {
    modifier += positioningConfig.frontline_penalty;
  }

  // バックラインがアサシンに攻撃される場合のペナルティ
  if (assassinRoles.includes(attacker.role) && defenderIsBackline) {
    modifier += positioningConfig.backline_vs_assassin_penalty;
  }

  return modifier;
}

// ========================================
// 数的優位補正
// ========================================
export function calculateNumericalAdvantageModifier(
  allyCount: number,
  enemyCount: number
): number {
  const config = ConfigLoader.get();
  const numericalConfig = config.combat_modifiers.numerical_advantage;

  const difference = allyCount - enemyCount;

  if (difference > 0) {
    // 味方が多い場合（例: "2v1", "3v2"）
    const key = `${allyCount}v${enemyCount}`;
    return numericalConfig[key] || 0;
  }

  return 0;
}

// ========================================
// CC（クラウドコントロール）判定
// ========================================
export function resolveCCAttempt(
  attacker: Character,
  defender: Character,
  skillType: 'normal' | 'ult'
): boolean {
  const config = ConfigLoader.get();
  const ccConfig = config.combat_system.cc;

  const attackerScore = rollDice(20) + attacker.stats.utility;
  const defenderScore = rollDice(20) + defender.stats.mobility;

  const success = attackerScore >= ccConfig.success_threshold;
  const escaped = defenderScore >= ccConfig.escape_threshold;

  if (success && !escaped) {
    const penalty = skillType === 'ult'
      ? ccConfig.ult_skill_penalty
      : ccConfig.normal_skill_penalty;

    console.log(`[Combat] ${attacker.name} successfully CC'd ${defender.name} with penalty: ${penalty}`);
    return true;
  }

  console.log(`[Combat] ${defender.name} escaped CC from ${attacker.name}`);
  return false;
}

// ========================================
// タワーダメージ計算
// ========================================
export function calculateTowerDamage(attacker: Character): number {
  const config = ConfigLoader.get();
  const towerConfig = config.tower_system.damage_to_tower;

  // プレイヤー基本ダイス（例: "1d6"）
  const baseDice = parseDiceNotation(towerConfig.player_base_dice);
  const attackBonus = attacker.stats.attack;

  return baseDice + attackBonus;
}

// ========================================
// ダイス表記のパース（例: "1d6" → 1〜6のランダム）
// ========================================
function parseDiceNotation(notation: string): number {
  const match = notation.match(/(\d+)d(\d+)/);

  if (!match) {
    return 0;
  }

  const count = parseInt(match[1], 10);
  const sides = parseInt(match[2], 10);

  let total = 0;
  for (let i = 0; i < count; i++) {
    total += rollDice(sides);
  }

  return total;
}

// ========================================
// ミニオンダメージ計算
// ========================================
export function calculateMinionDamage(): number {
  const config = ConfigLoader.get();
  const towerConfig = config.tower_system.damage_to_tower;

  const baseDice = parseDiceNotation(towerConfig.minion_base_dice);
  const bonus = towerConfig.minion_bonus_damage;

  return baseDice + bonus;
}
