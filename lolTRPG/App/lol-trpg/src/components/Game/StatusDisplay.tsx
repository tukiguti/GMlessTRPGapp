// src/components/Game/StatusDisplay.tsx

import React from 'react';
import { CustomCharacter, CustomItem } from '../../types';

interface StatusDisplayProps {
    team: 'ally' | 'enemy';
    characters: CustomCharacter[];
    items: Record<string, CustomItem[]>;
}

export const StatusDisplay: React.FC<StatusDisplayProps> = ({ team, characters, items }) => {
    return (
        <div className={`status-display ${team === 'ally' ? 'left-4' : 'right-4'} fixed top-4 w-64 space-y-4`}>
            {characters.map((char) => (
                <div key={char.id} className="bg-gray-800 rounded-lg p-4 text-white">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-bold">{char.name}</h3>
                        <span className="text-sm">{char.type} {char.class}</span>
                    </div>
                    
                    {/* HP バー */}
                    <div className="mb-2">
                        <div className="flex justify-between text-sm mb-1">
                            <span>HP</span>
                            <span>{char.hp || 0}/{char.maxHp || 0}</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                            <div 
                                className="bg-green-500 rounded-full h-2" 
                                style={{ width: `${((char.hp || 0) / (char.maxHp || 1)) * 100}%` }}
                            />
                        </div>
                    </div>

                    {/* FP (ファームポイント) */}
                    <div className="mb-4">
                        <div className="flex justify-between text-sm">
                            <span>FP</span>
                            <span>{char.farmPoints || 0}</span>
                        </div>
                    </div>

                    {/* アイテムリスト */}
                    {items[char.id]?.length > 0 && (
                        <div className="border-t border-gray-600 pt-2">
                            <h4 className="text-sm font-semibold mb-1">装備アイテム</h4>
                            <ul className="text-sm space-y-1">
                                {items[char.id].map((item) => (
                                    <li key={item.id} className="flex justify-between">
                                        <span>{item.customName}</span>
                                        <span className="text-gray-400">
                                            {Object.entries(item.effects)
                                                .filter(([_, value]) => value !== 0)
                                                .map(([key, value]) => {
                                                    const effectText = {
                                                        dodge: '回避',
                                                        attack: '攻撃',
                                                        towerDamage: 'タワーダメージ',
                                                        hp: 'HP',
                                                        damage: 'ダメージ'
                                                    }[key];
                                                    return `${effectText}+${value}`;
                                                })
                                                .join(', ')}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};