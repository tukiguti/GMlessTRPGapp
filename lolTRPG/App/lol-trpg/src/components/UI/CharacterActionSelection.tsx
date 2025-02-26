import React, { useState } from 'react';
import { CustomCharacter } from '../../types/character';

const actions = ['ファーム', 'アタック', 'リコール'];

const CharacterActionSelection: React.FC<{ 
  character: CustomCharacter; 
  enemyTeam: CustomCharacter[];
  setSelectedActions: React.Dispatch<React.SetStateAction<Record<string, { action: string; target?: string }>>>;
}> = ({ character, enemyTeam, setSelectedActions }) => {
  const [action, setAction] = useState<string>('');
  const [target, setTarget] = useState<string | undefined>();

  const handleActionChange = (selectedAction: string) => {
    setAction(selectedAction);
    setSelectedActions((prev: Record<string, { action: string; target?: string }>) => ({
      ...prev,
      [character.id]: { action: selectedAction, target: selectedAction === 'アタック' ? target : undefined }
    }));
  };

  return (
    <div>
      <h4>{character.name}</h4>
      <select onChange={(e) => handleActionChange(e.target.value)} value={action}>
        <option value="">行動を選択</option>
        {actions.map((act) => (
          <option key={act} value={act}>{act}</option>
        ))}
      </select>

      {action === 'アタック' && (
        <select onChange={(e) => setTarget(e.target.value)} value={target || ''}>
          <option value="">攻撃対象を選択</option>
          {enemyTeam.map(enemy => (
            <option key={enemy.id} value={enemy.id}>{enemy.name}</option>
          ))}
        </select>
      )}
    </div>
  );
};

export default CharacterActionSelection;
