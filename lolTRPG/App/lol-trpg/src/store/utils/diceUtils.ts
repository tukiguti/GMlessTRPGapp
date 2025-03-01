// src/store/utils/diceUtils.ts
import { DiceRoll } from '../../models/types';

/**
 * ダイス表記を解析して結果を返す
 * @param diceNotation "2D6+3" などのダイス表記
 * @returns ダイスロールの結果
 */
export function rollDice(diceNotation: string): DiceRoll {
  // 基本的な結果オブジェクトを初期化
  const result: DiceRoll = {
    diceType: '',              // 初期値を設定
    diceCount: 0,              // 初期値を設定
    rolls: [],                 // 初期値を設定
    modifier: 0,               // 初期値を設定
    total: 0,                  // 初期値を設定
    dice: diceNotation,        // 元のダイス表記
    values: [],                // レガシーサポート用
    type: 'attack'             // デフォルトタイプ
  };
  
  // "2D6+3" のようなダイス表記を解析
  const match = diceNotation.match(/(\d+)D(\d+)(?:\+(\d+))?/);
  if (match) {
    const numDice = parseInt(match[1], 10);
    const diceType = parseInt(match[2], 10);
    const modifier = match[3] ? parseInt(match[3], 10) : 0;
    
    // 結果オブジェクトに基本情報を設定
    result.diceType = `D${diceType}`;
    result.diceCount = numDice;
    result.modifier = modifier;
    
    // ダイスをロール
    for (let i = 0; i < numDice; i++) {
      const roll = Math.floor(Math.random() * diceType) + 1;
      result.rolls.push(roll);
      result.values.push(roll); // values は定義済みなので安全
    }
    
    // 合計を計算
    result.total = result.rolls.reduce((sum, val) => sum + val, 0) + modifier;
  } else {
    // 解析できない場合は0を返す
    result.diceType = 'INVALID';
    result.total = 0;
  }
  
  return result;
}

/**
 * ダイス表記にボーナスを追加する
 * @param formula ダイス表記（"2D6+3"など）
 * @param bonus 追加するボーナス値
 * @returns 新しいダイス表記
 */
export function addBonusToFormula(formula: string, bonus: number): string {
  // 既存のボーナスを抽出
  const match = formula.match(/(\d+)D(\d+)(?:\+(\d+))?/);
  if (!match) return formula; // マッチしない場合はそのまま返す
  
  const numDice = match[1];
  const diceType = match[2];
  const existingBonus = match[3] ? parseInt(match[3], 10) : 0;
  
  // 新しいボーナスを計算
  const newBonus = existingBonus + bonus;
  
  // 新しい表記を作成
  return `${numDice}D${diceType}+${newBonus}`;
}

/**
 * バフ/デバフを適用したダイスロール
 * @param diceNotation ダイス表記
 * @param buffs バフの値
 * @param debuffs デバフの値
 * @param skillModifier スキルによる修正値または説明
 * @returns 修正されたダイスロール結果
 */
export function rollDiceWithModifiers(
  diceNotation: string, 
  buffs: number = 0, 
  debuffs: number = 0,
  skillModifier: number | string = 0
): DiceRoll {
  const roll = rollDice(diceNotation);
  const totalModifier = buffs - debuffs;
  
  // バフ/デバフ モディファイアを追加
  if (buffs > 0) {
    roll.buffModifier = buffs;
  }
  
  if (debuffs > 0) {
    roll.debuffModifier = debuffs;
  }
  
  roll.total += totalModifier;
  
  // スキルモディファイアの適用
  if (typeof skillModifier === 'number' && skillModifier !== 0) {
    roll.skillModifier = skillModifier;
    roll.total += skillModifier;
  } else if (typeof skillModifier === 'string' && skillModifier) {
    roll.skillModifier = skillModifier;
  }
  
  return roll;
}

/**
 * スキル効果を適用したダイスロール
 * @param diceNotation ダイス表記
 * @param skillType スキルタイプ
 * @returns スキル効果を適用したダイスロール結果
 */
export function rollDiceWithSkill(diceNotation: string, skillType: string | null): DiceRoll {
  if (skillType === '絶対成功') {
    // 絶対成功の場合、全てのダイスが最大値
    const match = diceNotation.match(/(\d+)D(\d+)(?:\+(\d+))?/);
    if (match) {
      const numDice = parseInt(match[1], 10);
      const diceType = parseInt(match[2], 10);
      const modifier = match[3] ? parseInt(match[3], 10) : 0;
      
      const rolls = Array(numDice).fill(diceType);
      const total = numDice * diceType + modifier;
      
      return {
        diceType: `D${diceType}`,
        diceCount: numDice,
        rolls: rolls,
        modifier: modifier,
        total: total,
        dice: diceNotation,
        values: rolls,
        type: 'attack',
        skillModifier: `絶対成功: 全ダイス最大値(${diceType})`
      };
    }
  }
  
  if (skillType === 'ダイス個数増加') {
    // ダイス個数を1D6増加
    const extraDice = Math.floor(Math.random() * 6) + 1;
    const normalRoll = rollDice(diceNotation);
    
    normalRoll.rolls.push(extraDice);
    if (normalRoll.values) {
      normalRoll.values.push(extraDice);
    }
    normalRoll.total += extraDice;
    normalRoll.skillModifier = `+1D6 (${extraDice})`;
    normalRoll.diceCount += 1;
    
    return normalRoll;
  }
  
  if (skillType === '固定値増加') {
    // +4の固定値を追加
    const normalRoll = rollDice(diceNotation);
    normalRoll.total += 4;
    normalRoll.skillModifier = '+4 (固定値増加)';
    return normalRoll;
  }
  
  if (skillType === '妨害') {
    // 相手のダイス一つを1として計算する効果は
    // 実際の戦闘ロジックで適用するため、ここでは
    // 特殊なフラグを設定するのみ
    const normalRoll = rollDice(diceNotation);
    normalRoll.skillModifier = '妨害: 敵のダイス1個を1に';
    return normalRoll;
  }
  
  // その他のスキルの場合、通常のロール
  return rollDice(diceNotation);
}

/**
 * ダイスの成功/失敗を判定する
 * @param attackRoll 攻撃ロール結果
 * @param defenseRoll 防御ロール結果
 * @returns 攻撃の成功判定
 */
export function isSuccessfulRoll(attackRoll: DiceRoll, defenseRoll: DiceRoll): boolean {
  return attackRoll.total > defenseRoll.total;
}

/**
 * スキル成功判定を行う
 * @param skillType スキルタイプ
 * @param usedCount スキル使用回数
 * @returns スキルの成功判定と失敗時の効果
 */
export function checkSkillSuccess(
  skillType: string, 
  usedCount: number
): { success: boolean; effect?: string } {
  // 初回使用は常に成功
  if (usedCount === 0) {
    return { success: true };
  }
  
  // 2回目以降はスキルタイプに応じた判定
  const roll = Math.floor(Math.random() * 6) + 1; // 1D6
  
  switch (skillType) {
    case '絶対成功':
      // 2以上で失敗、失敗時はダイス1個を1として扱う
      if (roll >= 2) {
        return { success: false, effect: 'ダイス1個を1として扱う' };
      }
      break;
      
    case '範囲攻撃':
      // 3以上で失敗、失敗時は攻撃に-6
      if (roll >= 3) {
        return { success: false, effect: '攻撃に-6の修正、対象は全体のまま' };
      }
      break;
      
    case '妨害':
      // 3以上で失敗、失敗時は自身の判定に-3
      if (roll >= 3) {
        return { success: false, effect: '自身の判定に-3の修正' };
      }
      break;
      
    case '固定値増加':
      // 3以上で失敗、失敗時は-2の判定
      if (roll >= 3) {
        return { success: false, effect: '判定に-2の修正' };
      }
      break;
      
    case 'ダイス個数増加':
      // 3以上で失敗、失敗時は-1D6
      if (roll >= 3) {
        return { success: false, effect: '判定に-1D6の修正' };
      }
      break;
  }
  
  return { success: true };
}

/**
 * ダイス表記をパースして構成要素を取得
 * @param diceNotation ダイス表記（"2D6+3"など）
 * @returns ダイスの構成要素（ダイス数、面数、修正値）
 */
export function parseDiceNotation(diceNotation: string): { 
  numDice: number; 
  diceType: number; 
  modifier: number 
} | null {
  const match = diceNotation.match(/(\d+)D(\d+)(?:\+(\d+))?/);
  if (!match) return null;
  
  return {
    numDice: parseInt(match[1], 10),
    diceType: parseInt(match[2], 10),
    modifier: match[3] ? parseInt(match[3], 10) : 0
  };
}