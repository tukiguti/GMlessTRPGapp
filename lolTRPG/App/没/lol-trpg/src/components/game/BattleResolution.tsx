import React, { useEffect, useState } from 'react';
import { useTeamStore, useBattleStore } from '../store/gameStore'; // ✅ `gameStore.ts` からインポート
import { rollDice, parseDiceNotation } from '../../utils/diceUtils';
import { CustomCharacter } from '../../types/character';

const BattleResolution: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const { blueTeam, redTeam, updateHp, hp } = useTeamStore(); // ✅ `updateHp` を使用
  const { actions } = useBattleStore();
  const [battleLog, setBattleLog] = useState<string[]>([]);

  useEffect(() => {
    const log: string[] = [];

    const resolveAttack = (attacker: CustomCharacter, defender: CustomCharacter) => {
      const attackValue = parseDiceNotation(attacker.attack);
      const dodgeValue = parseDiceNotation(defender.dodge);
      const attackRoll = rollDice(attackValue);
      const dodgeRoll = rollDice(dodgeValue);

      log.push(`${attacker.name} (攻撃: ${attackRoll}) vs ${defender.name} (回避: ${dodgeRoll})`);

      if (attackRoll > dodgeRoll) {
        const newHP = (hp[defender.id] || defender.hp) - 1; // ✅ `hp` を利用して現在のHPを取得
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
