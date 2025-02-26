import React, { useState, useEffect, useRef } from 'react';
import { useTeamStore } from '../../store/teamStore';
import { useBattleStore } from '../../store/battleStore';

const actions = ['ファーム', 'アタック', 'リコール'];

const TeamActionSelection: React.FC<{ 
  team: 'blue' | 'red'; 
  setSelectedActions: (actions: Record<string, { action: string; target?: string }>) => void;
}> = ({ team, setSelectedActions }) => {
  const { blueTeam, redTeam } = useTeamStore();
  const { setActions } = useBattleStore();
  const players = team === 'blue' ? blueTeam : redTeam;
  const enemyTeam = team === 'blue' ? redTeam : blueTeam;

  // ✅ `selectedActions` の管理（useState）
  const [selectedActions, setSelectedActionsState] = useState<Record<string, { action: string; target?: string }>>({});
  const actionsRef = useRef(selectedActions); // ✅ `useRef()` を使用して `selectedActions` の最新状態を追跡

  // ✅ `selectedActions` の更新を監視し、`setActions()` に適用
  useEffect(() => {
    actionsRef.current = selectedActions;
  }, [selectedActions]);

  useEffect(() => {
    Object.entries(actionsRef.current).forEach(([playerId, actionData]) => {
      setActions(playerId, actionData);
    });
  }, [actionsRef.current, setActions]);

  // ✅ 行動の選択
  const handleActionChange = (playerId: string, action: string) => {
    setSelectedActionsState((prev) => {
      const updatedActions = { 
        ...prev, 
        [playerId]: { action, target: action === 'アタック' ? enemyTeam[0]?.id || '' : undefined }
      };
      setSelectedActions(updatedActions);
      return updatedActions;
    });
  };

  // ✅ 攻撃対象の選択
  const handleTargetChange = (playerId: string, targetId: string) => {
    setSelectedActionsState((prev) => {
      const updatedActions = { 
        ...prev, 
        [playerId]: { ...prev[playerId], target: targetId }
      };
      setSelectedActions(updatedActions);
      return updatedActions;
    });
  };

  return (
    <div>
      <h2 style={{ color: team === 'blue' ? 'blue' : 'red' }}>
        {team === 'blue' ? '青チーム' : '赤チーム'}
      </h2>
      {players.map((player) => (
        <div key={player.id}>
          <p>{player.name} ({player.type} {player.class})</p>

          {/* ✅ 行動選択 */}
          <select
            onChange={(e) => handleActionChange(player.id, e.target.value)}
            value={selectedActions[player.id]?.action || ''}
          >
            <option value="">行動を選択</option>
            {actions.map((action) => (
              <option key={action} value={action}>{action}</option>
            ))}
          </select>

          {/* ✅ アタック時にのみ攻撃対象を選択できる UI を表示 */}
          {selectedActions[player.id]?.action === 'アタック' && (
            <select
              onChange={(e) => handleTargetChange(player.id, e.target.value)}
              value={selectedActions[player.id]?.target || ''}>
              <option value="">攻撃対象を選択</option>
              {enemyTeam.map((enemy) => (
                <option key={enemy.id} value={enemy.id}>
                  {enemy.name} ({enemy.type} {enemy.class})
                </option>
              ))}
            </select>
          )}
        </div>
      ))}
    </div>
  );
};

export default TeamActionSelection;
