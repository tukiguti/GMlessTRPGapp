import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { useGamePhaseStore } from './store/gamePhaseStore'; // ✅ `useGamePhaseStore()` をインポート
import SetupScreen from './screens/SetupScreen';
import TeamSelectScreen from './screens/TeamSelectScreen';
import GameScreen from './screens/GameScreen';

const RouterNavigator: React.FC = () => {
  const { gamePhase } = useGamePhaseStore(); // ✅ `gamePhase` を取得
  const navigate = useNavigate();

  useEffect(() => {
    if (gamePhase === 'setup') navigate('/');
    if (gamePhase === 'teamSelect') navigate('/team');
    if (gamePhase === 'lane') navigate('/game');
  }, [gamePhase, navigate]);

  return null; // ✅ 画面には何も表示しない
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <RouterNavigator /> {/* ✅ `gamePhase` によってページを自動遷移 */}
      <Routes>
        <Route path="/" element={<SetupScreen />} />
        <Route path="/team" element={<TeamSelectScreen />} />
        <Route path="/game" element={<GameScreen />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
