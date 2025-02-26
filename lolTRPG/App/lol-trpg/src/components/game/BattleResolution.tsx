import React, { useEffect, useState } from 'react';
import { useTeamStore } from '../../store/teamStore'; // ✅ チーム管理
import { useBattleStore } from '../../store/battleStore'; // ✅ 戦闘管理
import { rollDice } from '../../utils/diceUtils'; // ✅ ダイスロール関数を `utils/diceUtils.ts` からインポート

const BattleResolution: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const { blueTeam, redTeam } = useTeamStore(); // ✅ `blueTeam`, `redTeam` を `useTeamStore()` から取得
  const { actions, hp, updateHp } = useBattleStore(); // ✅ `actions`, `hp`, `updateHp` を `useBattleStore()` から取得
  const [battleLog, setBattleLog] = useState<string[]>([]);

  useEffect(() => {
    const log: string[] = [];

    const resolveAttack = (attacker: any, defender: any) => {
      const attackRoll = rollDice(attacker.attack); // ✅ `attack` の値を使用
      const dodgeRoll = rollDice(defender.dodge); // ✅ `dodge` の値を使用
      log.push(`${attacker.name} (攻撃: ${attackRoll}) vs ${defender.name} (回避: ${dodgeRoll})`);

      if (attackRoll > dodgeRoll) {
        const newHP = hp[defender.id] - 1;
        updateHp(defender.id, newHP);
        log.push(`⚔️ ${attacker.name} が ${defender.name} にダメージ！ 残りHP: ${newHP}`);
      } else {
        log.push(`❌ ${attacker.name} の攻撃が外れた！`);
      }
    };

    blueTeam.forEach(attacker => {
      if (actions[attacker.id]?.action === 'アタック') {
        const target = redTeam[Math.floor(Math.random() * redTeam.length)];
        resolveAttack(attacker, target);
      }
    });

    redTeam.forEach(attacker => {
      if (actions[attacker.id]?.action === 'アタック') {
        const target = blueTeam[Math.floor(Math.random() * blueTeam.length)];
        resolveAttack(attacker, target);
      }
    });

    setBattleLog(log);
  }, []);

  return (
    <div>
      <h2>戦闘結果</h2>
      {battleLog.map((entry, index) => (
        <p key={index}>{entry}</p>
      ))}
      <button onClick={onComplete}>次へ</button>
    </div>
  );
};

export default BattleResolution;
