import { create } from 'zustand';
import { CustomCharacter } from '../types/character';

interface CharacterState {
  characters: CustomCharacter[];
  addCharacter: (char: CustomCharacter) => void;
  loadCharactersFromJson: (jsonData: { characters: CustomCharacter[] }) => void;
}

export const useCharacterStore = create<CharacterState>((set) => ({
  characters: [],

  addCharacter: (char) => set((state) => ({
    characters: [...state.characters, char]
  })),

  loadCharactersFromJson: (jsonData) =>
    set((state) => ({
      characters: [...state.characters, ...jsonData.characters],
    })),
}));
