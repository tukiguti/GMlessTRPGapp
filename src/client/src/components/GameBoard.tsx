import React from 'react';
import { useGameStore } from '../stores/gameStore';
import { CharacterCard } from './CharacterCard';
import { TowerStatus } from './TowerStatus';

export const GameBoard: React.FC = () => {
  const { round, phase, characters, towers, team } = useGameStore();

  const blueCharacters = characters.filter(c => c.position.area.includes('blue') || team === 'blue');
  const redCharacters = characters.filter(c => c.position.area.includes('red') || team === 'red');

  const blueTowers = towers.filter(t => t.team === 'blue');
  const redTowers = towers.filter(t => t.team === 'red');

  return (
    <div className="space-y-6">
      {/* ゲーム情報 */}
      <div className="bg-game-card p-6 rounded-lg shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold">ラウンド {round}</h2>
            <p className="text-gray-400 mt-1">
              フェーズ: {phase === 'declaration' ? '行動宣言' : '解決'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">あなたのチーム</p>
            <p className={`text-2xl font-bold ${team === 'blue' ? 'text-blue-400' : 'text-red-400'}`}>
              {team === 'blue' ? 'ブルー' : 'レッド'}
            </p>
          </div>
        </div>
      </div>

      {/* ゲームボード */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ブルーチーム */}
        <div className="bg-blue-900 bg-opacity-20 p-6 rounded-lg border-2 border-blue-500">
          <h3 className="text-2xl font-bold text-blue-400 mb-4">ブルーチーム</h3>

          {/* タワー */}
          <div className="mb-4">
            <h4 className="text-lg font-semibold mb-2">タワー</h4>
            <TowerStatus towers={blueTowers} />
          </div>

          {/* キャラクター */}
          <div className="space-y-3">
            <h4 className="text-lg font-semibold">キャラクター</h4>
            {blueCharacters.length > 0 ? (
              blueCharacters.map((char) => (
                <CharacterCard key={char.id} character={char} />
              ))
            ) : (
              <p className="text-gray-400">キャラクターがいません</p>
            )}
          </div>
        </div>

        {/* レッドチーム */}
        <div className="bg-red-900 bg-opacity-20 p-6 rounded-lg border-2 border-red-500">
          <h3 className="text-2xl font-bold text-red-400 mb-4">レッドチーム</h3>

          {/* タワー */}
          <div className="mb-4">
            <h4 className="text-lg font-semibold mb-2">タワー</h4>
            <TowerStatus towers={redTowers} />
          </div>

          {/* キャラクター */}
          <div className="space-y-3">
            <h4 className="text-lg font-semibold">キャラクター</h4>
            {redCharacters.length > 0 ? (
              redCharacters.map((char) => (
                <CharacterCard key={char.id} character={char} />
              ))
            ) : (
              <p className="text-gray-400">キャラクターがいません</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
