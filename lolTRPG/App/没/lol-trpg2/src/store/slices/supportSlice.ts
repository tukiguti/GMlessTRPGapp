// src/store/slices/supportSlice.ts

import { Character, SupportActionType, TurnResult, ActionType } from '../../models/types';
import { rollDice } from '../utils/diceUtils';

// サポート処理
export function handleSupport(
  supporter: Character, 
  target: Character, 
  supportType: SupportActionType
): TurnResult {
  // サポート効果のロール（1D3）
  const effectRoll = rollDice('1D3');
  effectRoll.type = 'skill';
  
  const result: TurnResult = {
    characterId: supporter.id,
    targetId: target.id,
    action: 'サポート' as ActionType, // ActionType に 'サポート' が含まれていることを確認
    supportType: supportType,
    rolls: [effectRoll],
    success: true,
    fpGained: 2  // 基本FP獲得
  };
  
  // サポートタイプに応じた効果
  switch (supportType) {
    case 'エンチャント':
      // 味方にバフを付与
      result.buffAdded = effectRoll.total;
      break;
    case 'フック':
      // 敵にデバフを付与
      result.debuffAdded = effectRoll.total;
      break;
    case 'タンク':
      // 攻撃を肩代わり（ゲームロジックで処理）
      result.tankEffect = true;
      break;
  }
  
  return result;
}