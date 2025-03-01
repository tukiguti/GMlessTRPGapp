// src/store/utils/gameUtils.ts
import { Character, ActionType, GamePhase } from '../../models/types';

/**
 * キャラクターのクラスとフェーズに応じて利用可能なアクションを取得
 */
export const getAvailableActions = (character: Character, phase: GamePhase): ActionType[] => {
  if (character.class === 'サポート') {
    return ['サポート', 'リコール'];
  }
  
  // フェーズに応じてアクションを変える
  if (phase === 'LANE_BATTLE') {
    return ['ファーム', 'アタック', 'リコール'];
  } else {
    // チーム戦フェーズではサイドプッシュが追加
    return ['ファーム', 'アタック', 'サイドプッシュ', 'リコール'];
  }
};

/**
 * キャラクターとアクションに応じて選択可能なターゲットを取得
 */
export const getAvailableTargets = (
  character: Character, 
  phase: GamePhase,
  allCharacters: Character[]
): Character[] => {
  if (!character) return [];
  
  // アクションがアタックの場合は敵チームのキャラクターのみ
  const targets = allCharacters.filter(target => {
    // 自分自身は選択できない
    if (target.id === character.id) return false;
    
    // 敵チームのみ
    return target.team !== character.team;
  });
  
  return targets;
};