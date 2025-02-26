import { create } from 'zustand';
import { CustomCharacter } from '../types/character';

interface TeamState {
  teamSize: number;
  blueTeam: CustomCharacter[];
  redTeam: CustomCharacter[];
  setTeamSize: (size: number) => void;
  setTeams: (blue: CustomCharacter[], red: CustomCharacter[]) => void;
}

export const useTeamStore = create<TeamState>((set) => ({
  teamSize: 1,
  blueTeam: [],
  redTeam: [],

  setTeamSize: (size) => set({ teamSize: size }),

  setTeams: (blue, red) => set(() => ({
    blueTeam: blue,
    redTeam: red,
  })),
}));
