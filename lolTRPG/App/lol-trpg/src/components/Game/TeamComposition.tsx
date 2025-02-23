// src/components/Game/TeamComposition.tsx

import React from 'react';
import { CustomCharacter } from '../../types';

interface TeamCompositionProps {
    teamSize: number;
    availableCharacters: CustomCharacter[];
    selectedCharacters: {
        blue: (CustomCharacter | null)[];
        red: (CustomCharacter | null)[];
    };
    onCharacterSelect: (team: 'blue' | 'red', index: number, character: CustomCharacter | null) => void;
    onConfirm: () => void;
}

export const TeamComposition: React.FC<TeamCompositionProps> = ({
    teamSize,
    availableCharacters,
    selectedCharacters,
    onCharacterSelect,
    onConfirm
}) => {
    const renderCharacterSelect = (team: 'blue' | 'red', index: number) => {
        const selectedCharacter = selectedCharacters[team][index];

        return (
            <div className="mb-4">
                <h4 className="font-bold mb-2">レーン {index + 1}</h4>
                <select
                    className="w-full p-2 border rounded mb-2"
                    value={selectedCharacter?.id || ''}
                    onChange={(e) => {
                        const character = availableCharacters.find(c => c.id === e.target.value);
                        onCharacterSelect(team, index, character || null);
                    }}
                >
                    <option value="">キャラクターを選択</option>
                    {availableCharacters.map(char => (
                        <option key={char.id} value={char.id}>
                            {char.name} ({char.type} {char.class})
                        </option>
                    ))}
                </select>

                {selectedCharacter && (
                    <div className="bg-gray-50 p-3 rounded mt-2">
                        <p className="text-sm mb-1">タイプ: {selectedCharacter.type}</p>
                        <p className="text-sm mb-1">クラス: {selectedCharacter.class}</p>
                        {selectedCharacter.customSkills.length > 0 && (
                            <div className="mt-2">
                                <p className="text-sm font-semibold">スキル:</p>
                                <ul className="list-disc list-inside text-sm">
                                    {selectedCharacter.customSkills.map(skill => (
                                        <li key={skill.id}>{skill.customName}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    const isTeamComplete = (team: (CustomCharacter | null)[]) => {
        return team.length === teamSize && team.every(char => char !== null);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'row', width: '100%', padding: '20px', gap: '40px' }}>
            {/* 左側: 青チーム */}
            <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#2563eb' }}>
                    Blue Team
                </h3>
                {Array(teamSize).fill(null).map((_, index) => (
                    <div key={`blue-${index}`}>
                        {renderCharacterSelect('blue', index)}
                    </div>
                ))}
            </div>

            {/* 右側: 赤チーム */}
            <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#dc2626' }}>
                    Red Team
                </h3>
                {Array(teamSize).fill(null).map((_, index) => (
                    <div key={`red-${index}`}>
                        {renderCharacterSelect('red', index)}
                    </div>
                ))}
            </div>

            {/* 確定ボタン */}
            <div style={{ 
                position: 'fixed', 
                bottom: '20px', 
                left: '50%', 
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: '10px'
            }}>
                <button
                    style={{
                        padding: '10px 20px',
                        borderRadius: '5px',
                        backgroundColor: isTeamComplete(selectedCharacters.blue) && isTeamComplete(selectedCharacters.red) 
                            ? '#22c55e' 
                            : '#d1d5db',
                        color: 'white',
                        cursor: isTeamComplete(selectedCharacters.blue) && isTeamComplete(selectedCharacters.red) 
                            ? 'pointer' 
                            : 'not-allowed'
                    }}
                    disabled={!isTeamComplete(selectedCharacters.blue) || !isTeamComplete(selectedCharacters.red)}
                    onClick={onConfirm}
                >
                    編成を確定してゲーム開始
                </button>
            </div>
        </div>
    );
};