import { ConfigLoader } from '../config/ConfigLoader';
import { CharacterStats, ItemStats } from '../config/types';

// ========================================
// バフ/デバフの型定義
// ========================================
export interface Buff {
  id: string;
  type: 'buff' | 'debuff' | 'cc';
  effect: string;
  value: number;
  duration: number;
  source?: string;
}

// ========================================
// スキルの型定義
// ========================================
export interface Skill {
  type: 'damage' | 'cc' | 'buff' | 'debuff';
  cooldown: number;
  currentCooldown: number;
}

// ========================================
// アイテムの型定義
// ========================================
export interface Item {
  name: string;
  stats: ItemStats;
}

// ========================================
// ポジション情報
// ========================================
export interface Position {
  area: string;
  lane: string;
}

// ========================================
// キャラクター型定義
// ========================================
export interface Character {
  id: string;
  name: string;
  role: string;
  lane: string;
  level: number;
  hp: number;
  maxHp: number;
  gold: number;
  exp: number;
  stats: {
    attack: number;
    defense: number;
    mobility: number;
    utility: number;
  };
  position: Position;
  buffs: Buff[];
  skills: {
    normal: Skill;
    ult: Skill;
  };
  items: Item[];
  alive: boolean;
  respawnTimer: number;
}

// ========================================
// キャラクター作成関数
// ========================================
export function createCharacter(
  name: string,
  role: string,
  lane: string
): Character {
  const initialStats = ConfigLoader.getCharacterStats(role);

  return {
    id: generateId(),
    name,
    role,
    lane,
    level: 1,
    hp: initialStats.hp,
    maxHp: initialStats.hp,
    gold: 0,
    exp: 0,
    stats: {
      attack: initialStats.attack,
      defense: initialStats.defense,
      mobility: initialStats.mobility,
      utility: initialStats.utility
    },
    position: {
      area: lane,
      lane
    },
    buffs: [],
    skills: {
      normal: { type: 'damage', cooldown: 0, currentCooldown: 0 },
      ult: { type: 'damage', cooldown: 0, currentCooldown: 0 }
    },
    items: [],
    alive: true,
    respawnTimer: 0
  };
}

// ========================================
// レベルアップ処理
// ========================================
export function levelUp(character: Character): void {
  const config = ConfigLoader.get();
  const maxLevel = config.leveling_system.max_level;

  if (character.level >= maxLevel) {
    console.log(`[Character] ${character.name} is already at max level`);
    return;
  }

  const growth = ConfigLoader.getGrowthStats(character.role);

  character.maxHp += growth.hp;
  character.hp += growth.hp;
  character.stats.attack += growth.attack;
  character.stats.defense += growth.defense;
  character.stats.mobility += growth.mobility;
  character.stats.utility += growth.utility;
  character.level += 1;

  console.log(`[Character] ${character.name} leveled up to ${character.level}`);
}

// ========================================
// アイテム購入処理
// ========================================
export function purchaseItem(character: Character, itemName: string): boolean {
  const itemStats = ConfigLoader.getItemStats(itemName);

  if (!itemStats) {
    console.error(`[Character] Item not found: ${itemName}`);
    return false;
  }

  // ゴールドチェック
  if (character.gold < itemStats.cost) {
    console.log(`[Character] ${character.name} does not have enough gold for ${itemName}`);
    return false;
  }

  // アイテム購入
  character.gold -= itemStats.cost;
  character.items.push({ name: itemName, stats: itemStats });

  // ステータス適用
  if (itemStats.hp) {
    character.maxHp += itemStats.hp;
    character.hp += itemStats.hp;
  }
  if (itemStats.attack) character.stats.attack += itemStats.attack;
  if (itemStats.defense) character.stats.defense += itemStats.defense;
  if (itemStats.mobility) character.stats.mobility += itemStats.mobility;
  if (itemStats.utility) character.stats.utility += itemStats.utility;

  console.log(`[Character] ${character.name} purchased ${itemName}`);
  return true;
}

// ========================================
// ダメージ適用
// ========================================
export function applyDamage(character: Character, damage: number): void {
  character.hp -= damage;

  if (character.hp <= 0) {
    character.hp = 0;
    character.alive = false;
    console.log(`[Character] ${character.name} has died!`);
  }
}

// ========================================
// 回復
// ========================================
export function heal(character: Character, amount: number): void {
  character.hp = Math.min(character.hp + amount, character.maxHp);
  console.log(`[Character] ${character.name} healed for ${amount} HP`);
}

// ========================================
// バフ追加
// ========================================
export function addBuff(character: Character, buff: Buff): void {
  character.buffs.push(buff);
  console.log(`[Character] ${character.name} received buff: ${buff.type}`);
}

// ========================================
// バフ更新（持続時間減少）
// ========================================
export function updateBuffs(character: Character): void {
  character.buffs = character.buffs
    .map(buff => ({ ...buff, duration: buff.duration - 1 }))
    .filter(buff => buff.duration > 0);
}

// ========================================
// リスポーン処理
// ========================================
export function respawn(character: Character): void {
  if (character.alive) {
    return;
  }

  if (character.respawnTimer > 0) {
    character.respawnTimer -= 1;
    return;
  }

  character.alive = true;
  character.hp = character.maxHp;
  character.position = {
    area: 'BASE',
    lane: character.lane
  };

  console.log(`[Character] ${character.name} has respawned!`);
}

// ========================================
// デス処理
// ========================================
export function handleDeath(character: Character): void {
  const config = ConfigLoader.get();
  const deathPenalty = config.combat_system.death_penalty;

  character.alive = false;
  character.hp = 0;

  // リスポーンタイマー設定
  character.respawnTimer = deathPenalty.respawn_time_base +
    (character.level * deathPenalty.respawn_time_per_level);

  // ゴールドペナルティ
  const goldLoss = Math.floor(character.gold * deathPenalty.gold_loss_percentage);
  character.gold -= goldLoss;

  console.log(`[Character] ${character.name} died. Respawn in ${character.respawnTimer} turns. Lost ${goldLoss} gold.`);
}

// ========================================
// 経験値追加とレベルアップ判定
// ========================================
export function addExperience(character: Character, exp: number, currentTurn: number): void {
  character.exp += exp;

  const config = ConfigLoader.get();
  const levelUpTurns = config.leveling_system.level_up_turns;

  // レベルアップ判定
  for (let level = character.level + 1; level <= config.leveling_system.max_level; level++) {
    const requiredTurns = levelUpTurns[level];
    if (currentTurn >= requiredTurns) {
      levelUp(character);
    } else {
      break;
    }
  }
}

// ========================================
// ユーティリティ関数
// ========================================
function generateId(): string {
  return `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ========================================
// キャラクター情報取得
// ========================================
export function getCharacterInfo(character: Character): string {
  return `${character.name} (Lv${character.level}) - HP: ${character.hp}/${character.maxHp}, Gold: ${character.gold}`;
}
