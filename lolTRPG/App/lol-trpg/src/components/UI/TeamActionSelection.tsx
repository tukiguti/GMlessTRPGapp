import React from 'react';
import { useTeamStore } from '../store/gameStore'; // ✅ `gameStore.ts` からインポート
import CharacterStatus from './CharacterStatus';
import CharacterActionSelection from './CharacterActionSelection';
import { CustomCharacter } from '../../types/character';

const TeamActionSelection: React.FC<{ 
  team: 'blue' | 'red'; 
  setSelectedActions: React.Dispatch<React.SetStateAction<Record<string, { action: string; target?: string }>>>;
}> = ({ team, setSelectedActions }) => {
  const { blueTeam, redTeam, hp } = useTeamStore(); // ✅ `hp` を追加
  const players: CustomCharacter[] = team === 'blue' ? blueTeam : redTeam;
  const enemyTeam: CustomCharacter[] = team === 'blue' ? redTeam : blueTeam;

  return (
    <div>
      <h2 style={{ color: team === 'blue' ? 'blue' : 'red' }}>
        {team === 'blue' ? '青チーム' : '赤チーム'}
      </h2>
      {players.map((player) => (
        <div key={player.id}>
          <CharacterStatus character={player} hp={hp[player.id] || player.hp} /> {/* ✅ `hp` を適用 */}
          <CharacterActionSelection 
            character={player} 
            enemyTeam={enemyTeam} 
            setSelectedActions={setSelectedActions} 
          />
        </div>
      ))}
    </div>
  );
};

export default TeamActionSelection;
