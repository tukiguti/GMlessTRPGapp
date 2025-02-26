import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGamePhaseStore } from '../components/store/gamePhaseStore'; // ✅ 修正
import { Button } from '@mui/material';
import CharacterCreator from '../components/CharacterCreator';

const SetupScreen: React.FC = () => {
  const { setGamePhase } = useGamePhaseStore(); // ✅ `setGamePhase` を使用
  const navigate = useNavigate();

  const handleStart = () => {
    if (setGamePhase) { // ✅ `setGamePhase` が存在するか確認
      setGamePhase('teamSelect');
      navigate('/team'); // ✅ `/team` に遷移
    } else {
      console.error('setGamePhase is not available');
    }
  };

  return (
    <div>
      <h1>キャラクター作成</h1>
      <CharacterCreator />
      <Button variant="contained" color="primary" onClick={handleStart}>
        チーム編成へ
      </Button>
    </div>
  );
};

export default SetupScreen;
