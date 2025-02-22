// src/utils/characterExport.ts

import { CustomCharacter } from '../types';

export const exportCharacterToJson = (character: CustomCharacter) => {
    const filename = `${character.name.replace(/\s+/g, '_')}.json`;
    const json = JSON.stringify(character, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

export const importCharacterFromJson = (file: File): Promise<CustomCharacter> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (event) => {
            try {
                const character = JSON.parse(event.target?.result as string);
                if (!character.name || !character.type || !character.class) {
                    throw new Error('Invalid character data');
                }
                resolve(character as CustomCharacter);
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
};