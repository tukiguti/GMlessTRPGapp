import React, { useState } from 'react';
import { useTeamStore } from '../store/teamStore'; // ✅ チーム管理
import { useBattleStore } from '../store/battleStore'; // ✅ 戦闘管理
import TeamActionSelection from '../components/game/TeamActionSelection';
import LanePhaseResult from '../components/game/LanePhaseResult';

interface LanePhaseScreenProps {
  onNextPhase: () => void;
}

const LanePhaseScreen: React.FC<LanePhaseScreenProps> = ({ onNextPhase }) => {
  const { blueTeam, redTeam } = useTeamStore(); // ✅ `blueTeam` と `redTeam` を `useTeamStore()` から取得
  const { setActions } = useBattleStore(); // ✅ `setActions()` を `useBattleStore()` から取得
  const [actionsConfirmed, setActionsConfirmed] = useState(false);

  // ✅ 行動と攻撃対象を管理するステート
  const [selectedActions, setSelectedActions] = useState<Record<string, { action: string; target?: string }>>({});

  const handleActionConfirm = () => {
    if (
      blueTeam.some((char) => !selectedActions[char.id]?.action) ||
      redTeam.some((char) => !selectedActions[char.id]?.action)
    ) {
      alert('全員の行動を選択してください。');
      return;
    }

    Object.entries(selectedActions).forEach(([playerId, { action, target }]) => {
      setActions(playerId, { action, target }); // ✅ 修正: `useBattleStore()` の `setActions()` を使用
    });

    setActionsConfirmed(true);
  };

  return (
    <div>
      <h1>レーン戦フェーズ</h1>
      {!actionsConfirmed ? (
        <>
          <TeamActionSelection team="blue" setSelectedActions={setSelectedActions} />
          <TeamActionSelection team="red" setSelectedActions={setSelectedActions} />
          <button onClick={handleActionConfirm}>行動確定</button>
        </>
      ) : (
        <LanePhaseResult onNextPhase={onNextPhase} />
      )}
    </div>
  );
};

export default LanePhaseScreen;
