import React, { useState } from 'react';
import { useTeamStore } from '../components/store/teamStore'; // ✅ チーム管理
import { useBattleStore } from '../components/store/battleStore'; // ✅ 戦闘管理

interface SiegePhaseScreenProps {
  onGameEnd: () => void;
}

const actions = ['サイドプッシュ', 'アタック', 'リコール'];

const SiegePhaseScreen: React.FC<SiegePhaseScreenProps> = ({ onGameEnd }) => {
  const { blueTeam, redTeam } = useTeamStore(); // ✅ `blueTeam`, `redTeam` を `useTeamStore()` から取得
  const { setActions } = useBattleStore(); // ✅ `setActions()` を `useBattleStore()` から取得
  const [selectedActions, setSelectedActions] = useState<Record<string, string>>({});
  const [actionsConfirmed, setActionsConfirmed] = useState(false);

  const handleActionConfirm = () => {
    if (
      blueTeam.some((char) => !selectedActions[char.id]) ||
      redTeam.some((char) => !selectedActions[char.id])
    ) {
      alert('全員の行動を選択してください。');
      return;
    }

    Object.entries(selectedActions).forEach(([playerId, action]) => {
      setActions(playerId, { action });
    });

    setActionsConfirmed(true);
  };

  return (
    <div>
      <h1>集団戦フェーズ</h1>

      {!actionsConfirmed ? (
        <>
          <h2 style={{ color: 'blue' }}>青チーム</h2>
          {blueTeam.map((player) => (
            <div key={player.id}>
              <p>{player.name} ({player.type} {player.class})</p>
              <select onChange={(e) => setSelectedActions({ ...selectedActions, [player.id]: e.target.value })} value={selectedActions[player.id] || ''}>
                <option value="">行動を選択</option>
                {actions.map((action) => (
                  <option key={action} value={action}>{action}</option>
                ))}
              </select>
            </div>
          ))}

          <button onClick={handleActionConfirm}>行動確定</button>
        </>
      ) : (
        <>
          <h2>結果発表（仮）</h2>
          {Object.entries(selectedActions).map(([playerId, action]) => (
            <p key={playerId}>{playerId}: {action}</p>
          ))}

          <button onClick={onGameEnd}>ゲーム終了</button>
        </>
      )}
    </div>
  );
};

export default SiegePhaseScreen;
