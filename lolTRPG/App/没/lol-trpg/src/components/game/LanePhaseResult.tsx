import React from 'react';
import { useBattleStore, useTeamStore } from '../store/gameStore'; // ✅ `gameStore.ts` から一括インポート
import { CustomCharacter } from '../../types/character';

const LanePhaseResult: React.FC<{ onNextPhase: () => void }> = ({ onNextPhase }) => {
  const { actions } = useBattleStore();
  const { blueTeam, redTeam } = useTeamStore();

  return (
    <div>
      <h1>レーン戦フェーズ結果</h1>
      <h2>青チーム</h2>
      {blueTeam.map((player: CustomCharacter) => (
        <p key={player.id}>{player.name}: {actions[player.id]?.action}</p>
      ))}
      <h2>赤チーム</h2>
      {redTeam.map((player: CustomCharacter) => (
        <p key={player.id}>{player.name}: {actions[player.id]?.action}</p>
      ))}
      <button onClick={onNextPhase}>次のフェーズへ（集団戦）</button>
    </div>
  );
};

export default LanePhaseResult;
