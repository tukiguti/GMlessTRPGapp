import React, { useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { rollDice } from '../../utils/diceUtils';

const BattleResolution: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const { blueTeam, redTeam, actions, updateHp } = useGameStore();
  const [results, setResults] = useState<string[]>([]);

  useEffect(() => {
    let battleResults: string[] = [];

    blueTeam.forEach((player, index) => {
      const action = actions[player.id]; // `player.id` をキーとして取得
      const opponent = redTeam[index];

      if (!action || !opponent) return;

      if (action === 'アタック') {
        const attackRoll = rollDice(player.attack);
        const dodgeRoll = rollDice(opponent.dodge);

        if (attackRoll > dodgeRoll) {
          updateHp(opponent.id, Math.max(0, opponent.hp - 1)); // HP が負にならないようにする
          battleResults.push(`${player.name} が ${opponent.name} に攻撃成功！(HP-1)`);
        } else {
          battleResults.push(`${player.name} の攻撃は ${opponent.name} に回避された`);
        }
      }
    });

    setResults(battleResults);
  }, [blueTeam, redTeam, actions, updateHp]);

  return (
    <div>
      <h2>戦闘結果</h2>
      {results.length === 0 ? <p>戦闘結果がありません</p> : results.map((result, i) => <p key={i}>{result}</p>)}
      <button onClick={onComplete}>次へ</button>
    </div>
  );
};

export default BattleResolution;
