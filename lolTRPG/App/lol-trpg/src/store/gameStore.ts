import { create } from 'zustand';
import { useCharacterStore } from './characterStore';
import { useTeamStore } from './teamStore';
import { useGamePhaseStore } from './gamePhaseStore';
import { useBattleStore } from './battleStore';
import { CustomCharacter, SkillType } from '../types/character';

interface GameState {
  getCharacters: () => CustomCharacter[];
  getTeamSize: () => number;
  getBlueTeam: () => CustomCharacter[];
  getRedTeam: () => CustomCharacter[];
  getActions: () => Record<string, { action: string; target?: string }>;
  getHp: () => Record<string, number>;
  getGamePhase: () => 'setup' | 'teamSelect' | 'lane' | 'siege';

  addCharacter: (char: CustomCharacter) => void;
  setTeamSize: (size: number) => void;
  setTeams: (blue: CustomCharacter[], red: CustomCharacter[]) => void;
  loadCharactersFromJson: (jsonData: { characters: CustomCharacter[] }) => void;

  setActions: (playerId: string, actionData: { action: string; target?: string }) => void;
  updateHp: (playerId: string, newHp: number) => void;
  applySkill: (playerId: string, skill: SkillType) => void;
  setGamePhase: (phase: 'setup' | 'teamSelect' | 'lane' | 'siege') => void;
}

export const useGameStore = create<GameState>(() => ({
  getCharacters: () => useCharacterStore.getState().characters,
  getTeamSize: () => useTeamStore.getState().teamSize,
  getBlueTeam: () => useTeamStore.getState().blueTeam,
  getRedTeam: () => useTeamStore.getState().redTeam,
  getActions: () => useBattleStore.getState().actions,
  getHp: () => useBattleStore.getState().hp,
  getGamePhase: () => useGamePhaseStore.getState().gamePhase,

  addCharacter: (char) => useCharacterStore.getState().addCharacter(char),
  setTeamSize: (size) => useTeamStore.getState().setTeamSize(size),
  setTeams: (blue, red) => useTeamStore.getState().setTeams(blue, red),
  loadCharactersFromJson: (jsonData) => useCharacterStore.getState().loadCharactersFromJson(jsonData),

  setActions: (playerId, actionData) => useBattleStore.getState().setActions(playerId, actionData),
  updateHp: (playerId, newHp) => useBattleStore.getState().updateHp(playerId, newHp),
  applySkill: (playerId, skill) => useBattleStore.getState().applySkill(playerId, skill),

  setGamePhase: (phase) => useGamePhaseStore.getState().setGamePhase(phase),
}));
