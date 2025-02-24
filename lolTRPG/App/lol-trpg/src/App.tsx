import React, { useState } from 'react';
import SetupScreen from './screens/SetupScreen';
import TeamSelectScreen from './screens/TeamSelectScreen';

const App: React.FC = () => {
  const [screen, setScreen] = useState<'setup' | 'teamSelect'>('setup');

  return (
    <div>
      {screen === 'setup' ? <SetupScreen /> : <TeamSelectScreen />}
      <button onClick={() => setScreen(screen === 'setup' ? 'teamSelect' : 'setup')}>
        {screen === 'setup' ? '次へ（チーム編成）' : '戻る（キャラクター作成）'}
      </button>
    </div>
  );
};

export default App;
