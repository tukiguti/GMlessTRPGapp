import { create } from 'zustand';
import { CustomCharacter } from '../../types/character';

interface CharacterState {
  characters: CustomCharacter[];
  addCharacter: (character: CustomCharacter) => void;
  loadCharactersFromJson: (characters: CustomCharacter[]) => void;
}

export const useCharacterStore = create<CharacterState>((set) => ({
  characters: [],
  addCharacter: (character) => set((state) => ({ characters: [...state.characters, character] })),
  loadCharactersFromJson: (characters) => set({ characters }),
}));
