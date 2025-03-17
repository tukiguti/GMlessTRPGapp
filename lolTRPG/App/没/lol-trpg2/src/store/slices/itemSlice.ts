// src/store/slices/itemSlice.ts
import { Character, Item } from '../../models/types';
import { applyItemEffectToCharacter, canPurchaseItem } from '../utils/itemUtils';

// アイテム購入処理
export function purchaseItem(character: Character, item: Item): { success: boolean; character?: Character } {
  // 購入可能かチェック
  if (!canPurchaseItem(character, item)) {
    return { success: false };
  }
  
  // アイテムを追加し、FPを減少
  let updatedCharacter = {
    ...character,
    items: [...character.items, item],
    fp: character.fp - item.cost
  };
  
  // アイテム効果を適用
  updatedCharacter = applyItemEffectToCharacter(updatedCharacter, item);
  
  return { success: true, character: updatedCharacter };
}