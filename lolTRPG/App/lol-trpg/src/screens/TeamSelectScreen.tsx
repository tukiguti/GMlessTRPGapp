import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { CustomCharacter } from '../types/character';
import { Button, Select, MenuItem } from '@mui/material';

const TeamSelectScreen: React.FC = () => {
  const { characters, teamSize, setTeamSize, setTeams } = useGameStore();
  const [blueTeam, setBlueTeam] = useState<(CustomCharacter | null)[]>([]);
  const [redTeam, setRedTeam] = useState<(CustomCharacter | null)[]>([]);

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
    setTeams(
      blueTeam.filter((char): char is CustomCharacter => char !== null),
      redTeam.filter((char): char is CustomCharacter => char !== null)
    );
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
