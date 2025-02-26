import { create } from 'zustand';
import { CustomCharacter } from '../../types/character';

interface TeamState {
  blueTeam: CustomCharacter[];
  redTeam: CustomCharacter[];
  teamSize: number;
  hp: Record<string, number>;
  setTeamSize: (size: number) => void;
  setTeams: (blue: CustomCharacter[], red: CustomCharacter[]) => void;
}

export const useTeamStore = create<TeamState>((set) => ({
  blueTeam: [],
  redTeam: [],
  teamSize: 1, // ✅ 修正: 初期値を 1 に
  hp: {},
  setTeamSize: (size) => set({ teamSize: size }),
  setTeams: (blue, red) => set({ blueTeam: blue, redTeam: red }), // ✅ `setTeams()` を追加
}));
