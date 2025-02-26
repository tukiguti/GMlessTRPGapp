import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGamePhaseStore } from '../store/gamePhaseStore'; // ✅ フェーズ管理ストアをインポート
import { Button } from '@mui/material';
import CharacterCreator from '../components/CharacterCreator'; // ✅ キャラクリコンポーネントをインポート

const SetupScreen: React.FC = () => {
  const { setGamePhase } = useGamePhaseStore(); // ✅ 修正: `useGameStore()` ではなく `useGamePhaseStore()` を使用
  const navigate = useNavigate();

  const handleStart = () => {
    setGamePhase('teamSelect'); // ✅ `teamSelect` フェーズへ遷移
    navigate('/');
  };

  return (
    <div>
      <h1>キャラクター作成</h1>
      <CharacterCreator /> {/* ✅ キャラクター作成コンポーネントを表示 */}
      <Button variant="contained" color="primary" onClick={handleStart}>
        チーム編成へ
      </Button>
    </div>
  );
};

export default SetupScreen;
