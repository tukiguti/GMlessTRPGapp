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
    const isTeamComplete = (team: (CustomCharacter | null)[]) => {
        return team.length === teamSize && team.every(char => char !== null);
    };

    const canConfirm = isTeamComplete(selectedCharacters.blue) && isTeamComplete(selectedCharacters.red);

    const renderTeam = (team: 'blue' | 'red') => (
        <div className="w-full">
            <h3 className={`text-xl font-bold mb-4 ${team === 'blue' ? 'text-blue-600' : 'text-red-600'}`}>
                {team === 'blue' ? 'Blue Team' : 'Red Team'}
            </h3>
            <div className="grid grid-cols-1 gap-4">
                {Array(teamSize).fill(null).map((_, index) => (
                    <div key={`${team}-${index}`} className="border rounded-lg p-4 bg-white shadow">
                        <h4 className="text-lg font-semibold mb-2">レーン {index + 1}</h4>
                        <select
                            className="w-full p-2 border rounded mb-2"
                            value={selectedCharacters[team][index]?.id || ''}
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

                        {selectedCharacters[team][index] && (
                            <div className="text-sm">
                                <p className="font-semibold">スキル:</p>
                                <ul className="list-disc list-inside">
                                    {selectedCharacters[team][index]?.customSkills.map(skill => (
                                        <li key={skill.id}>{skill.customName}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-6">チーム編成</h2>
            <div className="flex gap-8">
                {renderTeam('blue')}
                {renderTeam('red')}
            </div>

            <div className="mt-6 flex justify-end space-x-4">
                <button
                    className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition-colors disabled:bg-gray-400"
                    onClick={onConfirm}
                    disabled={!canConfirm}
                >
                    確定
                </button>
            </div>
        </div>
    );
};