import React from 'react';
import { Tower } from '../stores/gameStore';

interface TowerStatusProps {
  towers: Tower[];
}

export const TowerStatus: React.FC<TowerStatusProps> = ({ towers }) => {
  const getTowerIcon = (type: string) => {
    switch (type) {
      case 'nexus':
        return '⬢';
      case 'nexus_tower':
        return '▲';
      case 'inner':
        return '◆';
      case 'outer':
        return '●';
      default:
        return '○';
    }
  };

  const activeTowers = towers.filter(t => !t.destroyed);
  const destroyedTowers = towers.filter(t => t.destroyed);

  return (
    <div className="space-y-2">
      {/* アクティブなタワー */}
      <div className="grid grid-cols-3 gap-2">
        {activeTowers.map((tower) => {
          const hpPercentage = (tower.hp / tower.maxHp) * 100;
          return (
            <div
              key={tower.id}
              className="bg-game-bg p-2 rounded text-center"
              title={`${tower.type} - ${tower.lane || ''}`}
            >
              <div className="text-2xl mb-1">{getTowerIcon(tower.type)}</div>
              <div className="w-full bg-gray-700 rounded-full h-2 mb-1">
                <div
                  className={`h-2 rounded-full ${
                    hpPercentage > 50 ? 'bg-green-500' : hpPercentage > 25 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${hpPercentage}%` }}
                />
              </div>
              <p className="text-xs text-gray-400">
                {tower.hp}/{tower.maxHp}
              </p>
            </div>
          );
        })}
      </div>

      {/* 破壊されたタワー */}
      {destroyedTowers.length > 0 && (
        <div className="text-xs text-gray-500">
          破壊: {destroyedTowers.map(t => getTowerIcon(t.type)).join(' ')}
        </div>
      )}
    </div>
  );
};
