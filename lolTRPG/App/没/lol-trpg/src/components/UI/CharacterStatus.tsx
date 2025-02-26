import React from 'react';
import { CustomCharacter } from '../../types/character';

const CharacterStatus: React.FC<{ character: CustomCharacter; hp: number }> = ({ character, hp }) => {
  return (
    <div style={{ border: '1px solid gray', padding: '10px', margin: '5px', borderRadius: '5px' }}>
      <h3>{character.name} ({character.type} {character.class})</h3>
      <p>HP: {hp} / {character.hp}</p>
      <p>攻撃力: {character.attack}</p>
      <p>回避力: {character.dodge}</p>
    </div>
  );
};

export default CharacterStatus;
