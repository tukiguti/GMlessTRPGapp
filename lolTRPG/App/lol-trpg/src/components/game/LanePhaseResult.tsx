import React, { useState } from 'react';
import { useBattleStore } from '../../store/battleStore'; // ✅ 戦闘管理
import { useTeamStore } from '../../store/teamStore'; // ✅ チーム管理
import BattleResolution from '../game/BattleResolution';
import { CustomCharacter } from '../../types/character';

const LanePhaseResult: React.FC<{ onNextPhase: () => void }> = ({ onNextPhase }) => {
  const { actions } = useBattleStore(); // ✅ `actions` を `useBattleStore()` から取得
  const { blueTeam, redTeam } = useTeamStore(); // ✅ `blueTeam`, `redTeam` を `useTeamStore()` から取得
  const [battleResolved, setBattleResolved] = useState(false);

  return (
    <div>
      <h1>レーン戦フェーズ結果</h1>
      {!battleResolved ? (
        <BattleResolution onComplete={() => setBattleResolved(true)} />
      ) : (
        <>
          <h2>青チーム</h2>
          {blueTeam.map((player: CustomCharacter) => (
            <p key={player.id}>{player.name}: {actions[player.id]?.action}</p>
          ))}
          <h2>赤チーム</h2>
          {redTeam.map((player: CustomCharacter) => (
            <p key={player.id}>{player.name}: {actions[player.id]?.action}</p>
          ))}
          <button onClick={onNextPhase}>次のフェーズへ（集団戦）</button>
        </>
      )}
    </div>
  );
};

export default LanePhaseResult;
