import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { Select, MenuItem, Button } from '@mui/material';

const TeamSelect: React.FC = () => {
  const { characters, teamSize, setTeamSize, setTeams } = useGameStore();
  const [blueTeam, setBlueTeam] = useState<(string | null)[]>(Array(teamSize).fill(null));
  const [redTeam, setRedTeam] = useState<(string | null)[]>(Array(teamSize).fill(null));

  // チームサイズ変更時の処理
  const handleTeamSizeChange = (size: number) => {
    setTeamSize(size);
    setBlueTeam(Array(size).fill(null));
    setRedTeam(Array(size).fill(null));
  };

  const handleSelectCharacter = (team: 'blue' | 'red', index: number, charId: string) => {
    if (team === 'blue') {
      setBlueTeam((prev) => {
        const newTeam = [...prev];
        newTeam[index] = charId;
        return newTeam;
      });
    } else {
      setRedTeam((prev) => {
        const newTeam = [...prev];
        newTeam[index] = charId;
        return newTeam;
      });
    }
  };

  const handleConfirm = () => {
    const selectedBlueTeam = blueTeam.map((charId) => characters.find((char) => char.id === charId)).filter(Boolean);
    const selectedRedTeam = redTeam.map((charId) => characters.find((char) => char.id === charId)).filter(Boolean);

    if (selectedBlueTeam.length < teamSize || selectedRedTeam.length < teamSize) {
      alert("チームのキャラクターが足りません。");
      return;
    }

    setTeams(selectedBlueTeam as any, selectedRedTeam as any);
  };

  return (
    <div>
      <h3>チーム編成</h3>

      {/* チームサイズ選択 */}
      <h4>チームサイズ</h4>
      <Select value={teamSize} onChange={(e) => handleTeamSizeChange(Number(e.target.value))} fullWidth>
        {[1, 2, 3, 4, 5].map((size) => (
          <MenuItem key={size} value={size}>{size} vs {size}</MenuItem>
        ))}
      </Select>

      <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '20px' }}>
        {/* 青チーム */}
        <div>
          <h2 style={{ color: 'blue' }}>青チーム</h2>
          {Array(teamSize).fill(null).map((_, index) => (
            <Select
              key={`blue-${index}`}
              value={blueTeam[index] || ''}
              onChange={(e) => handleSelectCharacter('blue', index, e.target.value)}
              displayEmpty
              fullWidth
            >
              <MenuItem value="">キャラクターを選択</MenuItem>
              {characters.map((char) => (
                <MenuItem key={char.id} value={char.id}>
                  {char.name} ({char.type} {char.class})（{char.skills.map(skill => skill.name).join(', ')}）
                </MenuItem>
              ))}
            </Select>
          ))}
        </div>

        {/* 赤チーム */}
        <div>
          <h2 style={{ color: 'red' }}>赤チーム</h2>
          {Array(teamSize).fill(null).map((_, index) => (
            <Select
              key={`red-${index}`}
              value={redTeam[index] || ''}
              onChange={(e) => handleSelectCharacter('red', index, e.target.value)}
              displayEmpty
              fullWidth
            >
              <MenuItem value="">キャラクターを選択</MenuItem>
              {characters.map((char) => (
                <MenuItem key={char.id} value={char.id}>
                  {char.name} ({char.type} {char.class})（{char.skills.map(skill => skill.name).join(', ')}）
                </MenuItem>
              ))}
            </Select>
          ))}
        </div>
      </div>

      <Button onClick={handleConfirm} variant="contained" color="primary" style={{ marginTop: '20px' }}>
        チーム確定
      </Button>
    </div>
  );
};

export default TeamSelect;
