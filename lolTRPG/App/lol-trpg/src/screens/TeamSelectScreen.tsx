import React, { useState, useEffect } from 'react';
import { useCharacterStore } from '../store/characterStore';
import { useTeamStore } from '../store/teamStore';
import { useGamePhaseStore } from '../store/gamePhaseStore';
import { CustomCharacter } from '../types/character';
import { Button, Select, MenuItem } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const TeamSelectScreen: React.FC = () => {
  const { characters } = useCharacterStore(); // ✅ 修正: キャラクター管理は `useCharacterStore()`
  const { teamSize, setTeamSize, setTeams } = useTeamStore(); // ✅ 修正: チーム管理は `useTeamStore()`
  const { setGamePhase } = useGamePhaseStore(); // ✅ 修正: ゲームフェーズ管理は `useGamePhaseStore()`
  const [blueTeam, setBlueTeam] = useState<(CustomCharacter | null)[]>([]);
  const [redTeam, setRedTeam] = useState<(CustomCharacter | null)[]>([]);
  const navigate = useNavigate();

  // ✅ チームサイズが変更されたら配列のサイズを更新
  useEffect(() => {
    setBlueTeam(Array(teamSize).fill(null));
    setRedTeam(Array(teamSize).fill(null));
  }, [teamSize]);

  const handleSelect = (team: 'blue' | 'red', index: number, charId: string) => {
    const selectedChar = characters.find((char) => char.id === charId) || null;

    if (team === 'blue') {
      setBlueTeam((prev) => {
        const newTeam = [...prev];
        newTeam[index] = selectedChar;
        return newTeam;
      });
    } else {
      setRedTeam((prev) => {
        const newTeam = [...prev];
        newTeam[index] = selectedChar;
        return newTeam;
      });
    }
  };

  const handleConfirm = () => {
    if (blueTeam.includes(null) || redTeam.includes(null)) {
      alert('全員のキャラクターを選択してください。');
      return;
    }

    setTeams(
      blueTeam.filter((char): char is CustomCharacter => char !== null),
      redTeam.filter((char): char is CustomCharacter => char !== null)
    );

    setGamePhase('lane'); // ✅ 修正: `useGamePhaseStore()` を使用して試合フェーズを開始
    navigate('/game');    // ✅ 試合画面へ遷移
  };

  return (
    <div>
      <h1>チーム編成</h1>

      {/* ✅ チームサイズ変更 */}
      <h4>チームサイズ</h4>
      <Select value={teamSize} onChange={(e) => setTeamSize(Number(e.target.value))} fullWidth>
        {[1, 2, 3, 4, 5].map((size) => (
          <MenuItem key={size} value={size}>{size} vs {size}</MenuItem>
        ))}
      </Select>

      <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '20px' }}>
        {/* 青チーム */}
        <div>
          <h2 style={{ color: 'blue' }}>青チーム</h2>
          {blueTeam.map((_, index) => (
            <Select
              key={`blue-${index}`}
              value={blueTeam[index]?.id || ''}
              onChange={(e) => handleSelect('blue', index, e.target.value)}
              displayEmpty
              fullWidth
            >
              <MenuItem value="">キャラクターを選択</MenuItem>
              {characters.map((char) => (
                <MenuItem key={char.id} value={char.id}>
                  {char.name} ({char.type} {char.class})（{char.skills.map((skill) => skill.name).join(', ')}）
                </MenuItem>
              ))}
            </Select>
          ))}
        </div>

        {/* 赤チーム */}
        <div>
          <h2 style={{ color: 'red' }}>赤チーム</h2>
          {redTeam.map((_, index) => (
            <Select
              key={`red-${index}`}
              value={redTeam[index]?.id || ''}
              onChange={(e) => handleSelect('red', index, e.target.value)}
              displayEmpty
              fullWidth
            >
              <MenuItem value="">キャラクターを選択</MenuItem>
              {characters.map((char) => (
                <MenuItem key={char.id} value={char.id}>
                  {char.name} ({char.type} {char.class})（{char.skills.map((skill) => skill.name).join(', ')}）
                </MenuItem>
              ))}
            </Select>
          ))}
        </div>
      </div>

      <Button
        onClick={handleConfirm}
        variant="contained"
        color="primary"
        disabled={blueTeam.includes(null) || redTeam.includes(null)}
        style={{ marginTop: '20px' }}
      >
        チーム確定
      </Button>
    </div>
  );
};

export default TeamSelectScreen;
