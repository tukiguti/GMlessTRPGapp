import React from 'react';
import { Character } from '../stores/gameStore';

interface CharacterCardProps {
  character: Character;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({ character }) => {
  const hpPercentage = (character.hp / character.maxHp) * 100;

  return (
    <div className={`bg-game-accent p-4 rounded-lg border-l-4 ${
      character.alive ? 'border-green-500' : 'border-gray-500 opacity-50'
    }`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-bold text-lg">{character.name}</h4>
          <p className="text-sm text-gray-400">
            Lv{character.level} • {character.role} • {character.lane}
          </p>
        </div>
        <div className="text-right">
          <p className="text-yellow-400 font-semibold">{character.gold}G</p>
          <p className="text-xs text-gray-400">{character.position.area}</p>
        </div>
      </div>

      {/* HPバー */}
      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span>HP</span>
          <span>{character.hp} / {character.maxHp}</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${
              hpPercentage > 50 ? 'bg-green-500' : hpPercentage > 25 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${hpPercentage}%` }}
          />
        </div>
      </div>

      {/* ステータス */}
      <div className="grid grid-cols-4 gap-2 text-sm">
        <div className="text-center">
          <p className="text-gray-400 text-xs">ATK</p>
          <p className="font-semibold text-red-400">{character.finalStats.attack}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-400 text-xs">DEF</p>
          <p className="font-semibold text-blue-400">{character.finalStats.defense}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-400 text-xs">MOB</p>
          <p className="font-semibold text-green-400">{character.finalStats.mobility}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-400 text-xs">UTL</p>
          <p className="font-semibold text-purple-400">{character.finalStats.utility}</p>
        </div>
      </div>

      {/* バフ表示 */}
      {character.buffs.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {character.buffs.map((buff, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-purple-600 text-xs rounded"
            >
              {buff.type}
            </span>
          ))}
        </div>
      )}

      {/* アイテム表示 */}
      {character.items.length > 0 && (
        <div className="mt-2">
          <p className="text-xs text-gray-400 mb-1">アイテム: {character.items.length}</p>
        </div>
      )}
    </div>
  );
};
