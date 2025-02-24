import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore';

const actions = ['ファーム', 'アタック', 'リコール'];

const TeamActionSelection: React.FC<{ team: 'blue' | 'red' }> = ({ team }) => {
  const { blueTeam, redTeam } = useGameStore();
  const players = team === 'blue' ? blueTeam : redTeam;
  const [selectedActions, setSelectedActions] = useState<string[]>(Array(players.length).fill('ファーム'));

  const handleActionChange = (index: number, action: string) => {
    const newActions = [...selectedActions];
    newActions[index] = action;
    setSelectedActions(newActions);
  };

  return (
    <div>
      <h2 style={{ color: team === 'blue' ? 'blue' : 'red' }}>{team === 'blue' ? '青チーム' : '赤チーム'}</h2>
      {players.map((player, index) => (
        <div key={player.id}>
          <p>{player.name} ({player.type} {player.class})</p>
          <select onChange={(e) => handleActionChange(index, e.target.value)} value={selectedActions[index]}>
            {actions.map(action => (
              <option key={action} value={action}>{action}</option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
};

export default TeamActionSelection;
