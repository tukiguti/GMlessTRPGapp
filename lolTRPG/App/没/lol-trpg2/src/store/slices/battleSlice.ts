// src/store/slices/battleSlice.ts

import { Character, PlayerAction, TurnResult } from '../../models/types';
import { rollDice, rollDiceWithModifiers } from '../utils/diceUtils';

// ファーミング処理
export function handleFarming(character: Character): TurnResult {
  return {
    characterId: character.id,
    action: 'ファーム',
    rolls: [],
    success: true,
    fpGained: 5
  };
}

// アタック処理
export function handleAttack(
  attacker: Character, 
  defender: Character, 
  currentActions: Record<string, PlayerAction>
): TurnResult {
  // 攻撃ロール
  const attackRoll = rollDice(attacker.attackDice);
  attackRoll.type = 'attack';
  
  // 回避ロール
  let avoidRoll = rollDice(defender.avoidDice);
  avoidRoll.type = 'avoid';
  
  // 対象がファーム中なら回避に-3のペナルティ
  const defenderAction = currentActions[defender.id];
  if (defenderAction && defenderAction.actionType === 'ファーム') {
    // 新しいrollDiceWithModifiersを使用して、デバフを適用
    avoidRoll = rollDiceWithModifiers(
      defender.avoidDice,
      0,  // バフなし
      3,  // -3のデバフ
      'ファーム中のペナルティ'
    );
    avoidRoll.type = 'avoid';
  }
  
  // 成功判定
  const success = attackRoll.total > avoidRoll.total;
  
  // 結果を生成
  const result: TurnResult = {
    characterId: attacker.id,
    targetId: defender.id,
    action: 'アタック',
    rolls: [attackRoll, avoidRoll],
    success,
    fpGained: 2,  // 基本FP獲得
  };
  
  // 相手がリコール中または死亡していれば追加FP
  if (defenderAction && (defenderAction.actionType === 'リコール' || defender.hp <= 0)) {
    result.fpGained = 5;
  }
  
  // 成功した場合はダメージを追加
  if (success) {
    let damage = 1;  // 基本ダメージ
    
    // 剣アイテムを持っている場合、ダメージ+1
    if (attacker.items.some(item => item.type === '剣')) {
      damage += 1;
      // TurnResult に itemEffect プロパティを追加
      result.itemEffect = '剣の効果: ダメージ+1';
    }
    
    result.damage = damage;
  }
  
  return result;
}

// リコール処理
export function handleRecall(character: Character): TurnResult {
  return {
    characterId: character.id,
    action: 'リコール',
    rolls: [],
    success: true
  };
}

// サイドプッシュ処理
export function handleSidePush(character: Character): TurnResult {
  let towerDamage = 3;  // 基本ダメージ
  
  // ハンマーアイテムを持っている場合、タワーダメージ+1
  if (character.items.some(item => item.type === 'ハンマー')) {
    towerDamage += 1;
  }
  
  return {
    characterId: character.id,
    action: 'サイドプッシュ',
    rolls: [],
    success: true,
    towerDamage,
    forceRecall: true,
    fpGained: 3
  };
}