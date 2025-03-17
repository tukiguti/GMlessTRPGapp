// src/store/utils/itemUtils.ts

import { Character, Item } from '../../models/types';
import { addBonusToFormula } from './diceUtils';

// アイテム効果を適用
export function applyItemEffectToCharacter(character: Character, item: Item): Character {
  let updatedCharacter = { ...character };
  
  // アイテムタイプに応じた効果を適用
  switch (item.type) {
    case '靴':
      // 回避に+3のボーナス
      updatedCharacter.avoidDice = addBonusToFormula(updatedCharacter.avoidDice, 3);
      break;
    case '弓':
      // 攻撃に+3のボーナス
      updatedCharacter.attackDice = addBonusToFormula(updatedCharacter.attackDice, 3);
      break;
    case '鎧':
      // HP+2
      updatedCharacter.hp += 2;
      updatedCharacter.maxHp += 2;
      break;
    // その他のアイテム効果は戦闘ロジック内で処理
  }
  
  return updatedCharacter;
}

// アイテムの購入可否をチェック
export function canPurchaseItem(character: Character, item: Item): boolean {
  // FPが足りるか確認
  if (character.fp < item.cost) return false;
  
  // 同じタイプのアイテムが既に存在するか確認
  const hasSameTypeItem = character.items.some(i => i.type === item.type);
  
  return !hasSameTypeItem;
}