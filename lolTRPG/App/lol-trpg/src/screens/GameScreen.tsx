import React from 'react';
import { useGamePhaseStore } from '../components/store/gamePhaseStore'; // ✅ フェーズ管理
import LanePhaseScreen from './LanePhaseScreen';
import SiegePhaseScreen from './SiegePhaseScreen';

const GameScreen: React.FC = () => {
  const { gamePhase } = useGamePhaseStore(); // ✅ 修正: `useGameStore()` → `useGamePhaseStore()`

  return (
    <div>
      {gamePhase === 'lane' && <LanePhaseScreen onNextPhase={() => {}} />}
      {gamePhase === 'siege' && <SiegePhaseScreen onGameEnd={() => {}} />}
    </div>
  );
};

export default GameScreen;
