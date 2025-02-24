import React, { useState } from 'react';
import LanePhaseScreen from './LanePhaseScreen';
import SiegePhaseScreen from './SiegePhaseScreen';

const GameScreen: React.FC = () => {
  const [phase, setPhase] = useState<'lane' | 'siege'>('lane');

  return (
    <div>
      {phase === 'lane' ? (
        <LanePhaseScreen onNextPhase={() => setPhase('siege')} />
      ) : (
        <SiegePhaseScreen />
      )}
    </div>
  );
};

export default GameScreen;
