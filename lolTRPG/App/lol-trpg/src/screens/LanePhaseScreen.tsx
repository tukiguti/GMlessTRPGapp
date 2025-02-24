import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import TeamActionSelection from '../components/game/TeamActionSelection';
import BattleResolution from '../components/game/BattleResolution';
import LanePhaseResult from '../components/game/LanePhaseResult';

const LanePhaseScreen: React.FC<{ onNextPhase: () => void }> = ({ onNextPhase }) => {
  const { setGamePhase } = useGameStore();
  const [phase, setPhase] = useState<'action' | 'battle' | 'result'>('action');

  return (
    <div>
      <h1>レーン戦フェーズ</h1>

      {phase === 'action' && (
        <>
          <TeamActionSelection team="blue" />
          <TeamActionSelection team="red" />
          <button onClick={() => setPhase('battle')}>行動確定</button>
        </>
      )}

      {phase === 'battle' && <BattleResolution onComplete={() => setPhase('result')} />}

      {phase === 'result' && (
        <>
          <LanePhaseResult onNextPhase={() => {
            setGamePhase('siege'); // 集団戦フェーズへ遷移
            onNextPhase();
          }} />
        </>
      )}
    </div>
  );
};

export default LanePhaseScreen;
