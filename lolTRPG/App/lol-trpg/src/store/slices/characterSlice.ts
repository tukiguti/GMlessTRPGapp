// src/store/slices/characterSlice.ts
import { Character, Role } from '../../models/types';

// チームメンバーからキャラクターリストを作成
export function createTeamCharacters(
  teamMembers: { characterId: string | null; role: Role }[],
  charactersPool: Character[]
): Character[] {
  const teamCharacters: Character[] = [];
  
  teamMembers.forEach(member => {
    if (member.characterId) {
      const character = charactersPool.find(c => c.id === member.characterId);
      if (character) {
        // キャラクターのコピーを作成し、ロールを設定
        const characterCopy = {
          ...character,
          role: member.role,
          fp: 0,  // FPを初期化
          hp: character.maxHp,  // HPを最大値に設定
        };
        teamCharacters.push(characterCopy);
      }
    }
  });
  
  return teamCharacters;
}

// キャラクターの回復処理
export function healCharacter(character: Character, amount: number): Character {
  return {
    ...character,
    hp: Math.min(character.maxHp, character.hp + amount)
  };
}

// キャラクターのダメージ処理
export function damageCharacter(character: Character, amount: number): Character {
  return {
    ...character,
    hp: Math.max(0, character.hp - amount)
  };
}