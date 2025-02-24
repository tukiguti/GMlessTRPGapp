import React from 'react';
import CharacterCreator from '../components/CharacterCreator';

const SetupScreen: React.FC = () => {
  return (
    <div>
      <h1>キャラクター作成</h1>
      <CharacterCreator />
    </div>
  );
};

export default SetupScreen;
