import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { useGamePhaseStore } from './components/store/gamePhaseStore'; // ✅ `useGamePhaseStore()` をインポート
import SetupScreen from './screens/SetupScreen';
import TeamSelectScreen from './screens/TeamSelectScreen';
import GameScreen from './screens/GameScreen';

const RouterNavigator: React.FC = () => {
  const { currentPhase } = useGamePhaseStore(); // ✅ 修正: `gamePhase` → `currentPhase`
  const navigate = useNavigate();

  useEffect(() => {
    if (currentPhase === 'setup') navigate('/');
    if (currentPhase === 'teamSelect') navigate('/team');
    if (currentPhase === 'lane') navigate('/game');
  }, [currentPhase, navigate]);

  return null;
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <RouterNavigator /> {/* ✅ `currentPhase` によってページを自動遷移 */}
      <Routes>
        <Route path="/" element={<SetupScreen />} />
        <Route path="/team" element={<TeamSelectScreen />} />
        <Route path="/game" element={<GameScreen />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
