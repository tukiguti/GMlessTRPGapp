// src/store/slices/phaseSlice.ts

import { GamePhase } from '../../models/types';

// 次のフェーズに進む
export function advanceGamePhase(
  currentPhase: GamePhase, 
  currentRound: number,
  blueTeamTowers: number,
  redTeamTowers: number
): { phase: GamePhase; round: number; gameEnded: boolean } {
  let newPhase = currentPhase;
  let newRound = currentRound;
  let gameEnded = false;
  
  // タワーが0になったらゲーム終了 ('RESULT' が GamePhase に追加されていることを確認)
  if (blueTeamTowers <= 0 || redTeamTowers <= 0) {
    return { phase: 'RESULT' as GamePhase, round: newRound, gameEnded: true };
  }
  
  if (currentPhase === 'LANE_BATTLE') {
    if (currentRound >= 4) {
      newPhase = 'TEAM_BATTLE';
      newRound = 1;
    } else {
      newRound += 1;
    }
  } else if (currentPhase === 'TEAM_BATTLE') {
    if (currentRound >= 5) {
      // 'OBJECT_FIGHT' が GamePhase に追加されていることを確認
      newPhase = 'OBJECT_FIGHT' as GamePhase;
    } else {
      newRound += 1;
    }
  } else if (currentPhase === 'OBJECT_FIGHT') {
    // 型エラーを修正: 型安全な比較
    newPhase = 'TEAM_BATTLE';
    newRound += 1;
  }
  
  return { phase: newPhase, round: newRound, gameEnded };
}