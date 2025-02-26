import React, { useState } from 'react';
import { useTeamStore } from '../components/store/teamStore';
import { useBattleStore } from '../components/store/battleStore';
import TeamActionSelection from '../components/UI/TeamActionSelection';
import LanePhaseResult from '../components/game/LanePhaseResult';
import { CustomCharacter } from '../types/character';

const LanePhaseScreen: React.FC<{ onNextPhase: () => void }> = ({ onNextPhase }) => {
  const { blueTeam, redTeam } = useTeamStore();
  const { setActions } = useBattleStore();
  const [actionsConfirmed, setActionsConfirmed] = useState(false);
  const [selectedActions, setSelectedActions] = useState<Record<string, { action: string; target?: string }>>({});

  const handleActionConfirm = () => {
    if (blueTeam.some((char: CustomCharacter) => !selectedActions[char.id]?.action) || 
        redTeam.some((char: CustomCharacter) => !selectedActions[char.id]?.action)) {
      alert('全員の行動を選択してください。');
      return;
    }

    Object.entries(selectedActions).forEach(([playerId, { action, target }]) => {
      setActions(playerId, { action, target });
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
