// src/store/gameStore.ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Character, Role } from '../models/types';
import { useTeamStore } from './teamStore';
import { useCharacterStore } from './characterStore';

// ゲームフェーズ
export type GamePhase = 'LANE_BATTLE' | 'TEAM_BATTLE' | 'OBJECT_FIGHT' | 'RESULT';

// アクションタイプ
export type ActionType = 'ファーム' | 'アタック' | 'リコール' | 'サイドプッシュ' | 'スキル' | 'サポート';

// サポートのサブアクション
export type SupportActionType = 'エンチャント' | 'フック' | 'タンク';

// プレイヤーアクション
interface PlayerAction {
  characterId: string;
  actionType: ActionType;
  targetId?: string;  // ターゲットID
  skillId?: string;   // 使用するスキルID
  supportType?: SupportActionType; // サポートタイプ
}

// ゲーム状態
interface GameState {
  phase: GamePhase;
  round: number;
  blueTeamCharacters: Character[];
  redTeamCharacters: Character[];
  blueTeamTowers: number;
  redTeamTowers: number;
  currentActions: Record<string, PlayerAction>;  // キャラクターID → アクション
  actionTargets: Record<string, string>;  // キャラクターID → ターゲットID
  turnResults: TurnResult[];
  isPlayerTurn: boolean;
}

// ターン結果
interface TurnResult {
  characterId: string;
  targetId?: string;
  action: ActionType;
  supportType?: SupportActionType;
  rolls: DiceRoll[];
  success: boolean;
  damage?: number;
  fpGained?: number;
  buffAdded?: number;
  debuffAdded?: number;
  tankEffect?: boolean;
  towerDamage?: number;
  forceRecall?: boolean;
  itemPurchased?: string;
  killedTarget?: boolean;  // 追加
}

// ダイスロール結果
interface DiceRoll {
  dice: string;  // "1D6+2" など
  values: number[];  // [3] など
  total: number;
  type: 'attack' | 'avoid' | 'skill';
  skillModifier?: number;
}

// ゲームアクション
interface GameActions {
  // ゲーム初期化
  initializeGame: () => void;
  
  // アクション管理
  setCharacterAction: (characterId: string, action: ActionType) => void;
  setActionTarget: (characterId: string, targetId: string) => void;
  setSupportAction: (characterId: string, supportType: SupportActionType, targetId: string) => void;
  
  // ターン処理
  executeTurn: () => void;
  rollDice: (diceNotation: string) => DiceRoll;
  
  // その他のユーティリティ
  getCharacterByRole: (team: 'BLUE' | 'RED', role: Role) => Character | undefined;
  getOpponentByRole: (characterId: string) => Character | undefined;
  advancePhase: () => void;
  resetGame: () => void;
}

// GameStore型
type GameStore = GameState & GameActions;

export const useGameStore = create<GameStore>()(
  immer((set, get) => ({
    // 初期状態
    phase: 'LANE_BATTLE',
    round: 1,
    blueTeamCharacters: [],
    redTeamCharacters: [],
    blueTeamTowers: 3,
    redTeamTowers: 3,
    currentActions: {},
    actionTargets: {},
    turnResults: [],
    isPlayerTurn: true,
    
    // ゲーム初期化
    initializeGame: () => {
      const teamStore = useTeamStore.getState();
      const characterStore = useCharacterStore.getState();
      
      const blueTeamCharacters: Character[] = [];
      const redTeamCharacters: Character[] = [];
      
      // ブルーチームのキャラクター処理
      teamStore.blueTeam.members.forEach(member => {
        if (member.characterId) {
          const originalCharacter = characterStore.characters.find(c => c.id === member.characterId);
          
          if (originalCharacter) {
            // キャラクターのコピーを作成し、ロールを設定
            const blueCharacterCopy: Character = {
              ...originalCharacter,
              role: member.role,
              team: 'BLUE',
              fp: 0,  // FPを初期化
              hp: originalCharacter.maxHp,  // HPを最大値に設定
            };
            
            blueTeamCharacters.push(blueCharacterCopy);
          }
        }
      });
      
      // レッドチームのキャラクター処理
      teamStore.redTeam.members.forEach(member => {
        if (member.characterId) {
          const originalCharacter = characterStore.characters.find(c => c.id === member.characterId);
          
          if (originalCharacter) {
            // キャラクターのコピーを作成し、ロールを設定
            const redCharacterCopy: Character = {
              ...originalCharacter,
              role: member.role,
              team: 'RED',
              fp: 0,  // FPを初期化
              hp: originalCharacter.maxHp,  // HPを最大値に設定
            };
            
            redTeamCharacters.push(redCharacterCopy);
          }
        }
      });
      
      // ゲーム状態を初期化
      set({
        blueTeamCharacters,
        redTeamCharacters,
        phase: 'LANE_BATTLE',
        round: 1,
        blueTeamTowers: 3,
        redTeamTowers: 3,
        currentActions: {},
        actionTargets: {},
        turnResults: [],
        isPlayerTurn: true
      });
    },
    
    // キャラクターのアクションを設定
    setCharacterAction: (characterId, action) => {
      set(state => {
        state.currentActions[characterId] = {
          characterId,
          actionType: action
        };
      });
    },
    
    // アクションのターゲットを設定
    setActionTarget: (characterId, targetId) => {
      set(state => {
        state.actionTargets[characterId] = targetId;
        
        // アクションにもターゲットを設定
        if (state.currentActions[characterId]) {
          state.currentActions[characterId].targetId = targetId;
        }
      });
    },
    
    // サポートアクションの設定
    setSupportAction: (characterId, supportType, targetId) => {
      set(state => {
        if (state.currentActions[characterId]) {
          state.currentActions[characterId].supportType = supportType;
          state.currentActions[characterId].targetId = targetId;
        }
      });
    },
    
    // ターンを実行（全キャラクターのアクションを処理）
    executeTurn: () => {
      const state = get();
      const results: TurnResult[] = [];
      
      // すべてのキャラクター
      const allCharacters = [...state.blueTeamCharacters, ...state.redTeamCharacters];
      
      // 1. サポートアクション処理
      allCharacters.forEach(character => {
        const action = state.currentActions[character.id];
        if (action && action.actionType === 'サポート' && action.targetId && action.supportType) {
          const target = allCharacters.find(c => c.id === action.targetId);
          if (target) {
            results.push(handleSupport(character, target, action.supportType));
          }
        }
      });
      
      // 2. ファームアクション処理
      allCharacters.forEach(character => {
        const action = state.currentActions[character.id];
        if (action && action.actionType === 'ファーム') {
          results.push(handleFarming(character));
        }
      });
      
      // 3. リコールアクション処理
      allCharacters.forEach(character => {
        const action = state.currentActions[character.id];
        if (action && action.actionType === 'リコール') {
          results.push(handleRecall(character));
        }
      });
      
      // 4. アタックアクション処理（指定順序で）
      const attackOrder = [
        { team: 'BLUE', role: 'TOP' },
        { team: 'BLUE', role: 'JG' },
        { team: 'BLUE', role: 'MID' },
        { team: 'BLUE', role: 'ADC' },
        { team: 'RED', role: 'TOP' },
        { team: 'RED', role: 'JG' },
        { team: 'RED', role: 'MID' },
        { team: 'RED', role: 'ADC' }
      ];
      
      attackOrder.forEach(({ team, role }) => {
        // 指定チームと役職のキャラクターを検索
        const character = allCharacters.find(c => c.team === team && c.role === role);
        if (!character) return;
        
        const action = state.currentActions[character.id];
        if (action && action.actionType === 'アタック' && action.targetId) {
          const target = allCharacters.find(c => c.id === action.targetId);
          if (target) {
            // HP0でも攻撃判定を行う
            results.push(handleAttack(character, target, action));
          }
        }
      });
      
      // 結果を更新
      set(state => {
        state.turnResults = results;
        state.isPlayerTurn = false;
        
        // キャラクターの状態を更新
        results.forEach(result => {
          // HP変更、FP獲得など
          if (result.damage && result.targetId) {
            const target = [...state.blueTeamCharacters, ...state.redTeamCharacters].find(
              c => c.id === result.targetId
            );
            if (target) {
              // ターゲットのHPを減少
              const index = target.team === 'BLUE'
                ? state.blueTeamCharacters.findIndex(c => c.id === target.id)
                : state.redTeamCharacters.findIndex(c => c.id === target.id);
              
              if (index !== -1) {
                // HPが既に0の場合は変化なし
                if (target.hp > 0) {
                  const newHp = Math.max(0, target.hp - result.damage);
                  
                  // HPが0になった場合、攻撃者にFPを付与
                  if (newHp === 0 && target.hp > 0) {
                    const attacker = [...state.blueTeamCharacters, ...state.redTeamCharacters].find(
                      c => c.id === result.characterId
                    );
                    
                    if (attacker) {
                      const attackerIndex = attacker.team === 'BLUE'
                        ? state.blueTeamCharacters.findIndex(c => c.id === attacker.id)
                        : state.redTeamCharacters.findIndex(c => c.id === attacker.id);
                      
                      if (attackerIndex !== -1) {
                        if (attacker.team === 'BLUE') {
                          state.blueTeamCharacters[attackerIndex].fp += 8; // HP0にした報酬
                        } else {
                          state.redTeamCharacters[attackerIndex].fp += 8;
                        }
                        
                        // 結果にFP獲得を記録
                        const resultIndex = results.findIndex(r => 
                          r.characterId === attacker.id && r.targetId === target.id
                        );
                        if (resultIndex !== -1) {
                          results[resultIndex].fpGained = (results[resultIndex].fpGained || 0) + 8;
                          results[resultIndex].killedTarget = true;
                        }
                      }
                    }
                  }
                  
                  // HPを更新
                  if (target.team === 'BLUE') {
                    state.blueTeamCharacters[index].hp = newHp;
                  } else {
                    state.redTeamCharacters[index].hp = newHp;
                  }
                }
              }
            }
          }
          
          // FP獲得
          if (result.fpGained) {
            const character = [...state.blueTeamCharacters, ...state.redTeamCharacters].find(
              c => c.id === result.characterId
            );
            if (character) {
              const index = character.team === 'BLUE'
                ? state.blueTeamCharacters.findIndex(c => c.id === character.id)
                : state.redTeamCharacters.findIndex(c => c.id === character.id);
              
              if (index !== -1) {
                if (character.team === 'BLUE') {
                  state.blueTeamCharacters[index].fp += result.fpGained;
                } else {
                  state.redTeamCharacters[index].fp += result.fpGained;
                }
              }
            }
          }
        });
        
        // チーム戦フェーズでは毎ターン+1FP
        if (state.phase === 'TEAM_BATTLE') {
          allCharacters.forEach(character => {
            const team = character.team === 'BLUE' ? state.blueTeamCharacters : state.redTeamCharacters;
            const index = team.findIndex(c => c.id === character.id);
            
            if (index !== -1) {
              if (character.team === 'BLUE') {
                state.blueTeamCharacters[index].fp += 1;
              } else {
                state.redTeamCharacters[index].fp += 1;
              }
            }
          });
        }
        
        // アクションをクリア
        state.currentActions = {};
        state.actionTargets = {};
      });
      
      // ターン終了処理（AIターンなど）を追加予定
      setTimeout(() => {
        set(state => {
          state.isPlayerTurn = true;
          state.turnResults = [];
        });
      }, 3000);
    },
    
    // ダイスロール処理
    rollDice: (diceNotation) => {
      const result: DiceRoll = {
        dice: diceNotation,
        values: [],
        total: 0,
        type: 'attack'  // デフォルト
      };
      
      // "2D6+3" のようなダイス表記を解析
      const match = diceNotation.match(/(\d+)D(\d+)(?:\+(\d+))?/);
      if (match) {
        const numDice = parseInt(match[1], 10);
        const diceType = parseInt(match[2], 10);
        const modifier = match[3] ? parseInt(match[3], 10) : 0;
        
        // ダイスをロール
        for (let i = 0; i < numDice; i++) {
          const roll = Math.floor(Math.random() * diceType) + 1;
          result.values.push(roll);
        }
        
        // 合計を計算
        result.total = result.values.reduce((sum, val) => sum + val, 0) + modifier;
      } else {
        // 解析できない場合は0を返す
        result.total = 0;
      }
      
      return result;
    },
    
    // キャラクターをロールで取得
    getCharacterByRole: (team, role) => {
      const characters = team === 'BLUE' 
        ? get().blueTeamCharacters 
        : get().redTeamCharacters;
      
      return characters.find(c => c.role === role);
    },
    
    // 対戦相手を取得
    getOpponentByRole: (characterId) => {
      const state = get();
      const character = [...state.blueTeamCharacters, ...state.redTeamCharacters]
        .find(c => c.id === characterId);
      
      if (!character || !character.role) return undefined;
      
      const oppositeTeam = character.team === 'BLUE' ? 'RED' : 'BLUE';
      return get().getCharacterByRole(oppositeTeam, character.role);
    },
    
    // ゲームフェーズを進める
    advancePhase: () => {
      set(state => {
        if (state.phase === 'LANE_BATTLE') {
          if (state.round >= 4) {
            state.phase = 'TEAM_BATTLE';
            state.round = 1;
          } else {
            state.round += 1;
          }
        } else if (state.phase === 'TEAM_BATTLE') {
          if (state.round >= 5) {
            state.phase = 'OBJECT_FIGHT';
          } else {
            state.round += 1;
          }
        } else if (state.phase === 'OBJECT_FIGHT') {
          state.phase = 'TEAM_BATTLE';
          state.round += 1;
        }
        
        // 勝利条件をチェック
        if (state.blueTeamTowers <= 0 || state.redTeamTowers <= 0) {
          state.phase = 'RESULT';
        }
      });
    },
    
    // ゲームをリセット
    resetGame: () => {
      set({
        phase: 'LANE_BATTLE',
        round: 1,
        blueTeamCharacters: [],
        redTeamCharacters: [],
        blueTeamTowers: 3,
        redTeamTowers: 3,
        currentActions: {},
        actionTargets: {},
        turnResults: [],
        isPlayerTurn: true
      });
    }
  }))
);

// 行動可能なアクションを取得する関数
export const getAvailableActions = (character: Character, phase: GamePhase): ActionType[] => {
  // サポートクラスの場合
  if (character.class === 'サポート') {
    return ['リコール', 'サポート'];
  }
  
  // フェーズに応じたアクション
  if (phase === 'LANE_BATTLE') {
    return ['ファーム', 'アタック', 'リコール'];
  } else if (phase === 'TEAM_BATTLE') {
    return ['サイドプッシュ', 'アタック', 'リコール'];
  }
  
  return [];
};

// 攻撃可能なターゲットを取得する関数
export const getAvailableTargets = (character: Character, phase: GamePhase, allCharacters: Character[]): Character[] => {
  // 死亡しているキャラクターは攻撃できない
  const aliveEnemies = allCharacters.filter(c => 
    c.team !== character.team && c.hp > 0 && c.class !== 'サポート'
  );
  
  // サポートの場合、味方か敵かで分ける
  if (character.class === 'サポート') {
    const allies = allCharacters.filter(c => 
      c.team === character.team && c.id !== character.id
    );
    
    return [...allies, ...aliveEnemies];
  }
  
  // レーン戦フェーズでは、JG以外は対面のみを攻撃可能
  if (phase === 'LANE_BATTLE') {
    // JGの場合は全敵を攻撃可能
    if (character.class === 'ファームJG' || character.class === 'ガンクJG') {
      return aliveEnemies;
    }
    
    // それ以外は同じロールの敵のみ
    return aliveEnemies.filter(enemy => enemy.role === character.role);
  }
  
  // チーム戦フェーズでは全敵を攻撃可能
  return aliveEnemies;
};

// アクション処理関数
function handleFarming(character: Character): TurnResult {
  // ファーミング処理
  // ロールなし、FP+5
  return {
    characterId: character.id,
    action: 'ファーム',
    rolls: [],
    success: true,
    fpGained: 5
  };
}

function handleAttack(attacker: Character, defender: Character, action: PlayerAction): TurnResult {
  // アタック処理
  const gameStore = useGameStore.getState();
  
  // 攻撃ロール
  const attackRoll = gameStore.rollDice(attacker.attackDice);
  attackRoll.type = 'attack';
  
  // 回避ロール
  const avoidRoll = gameStore.rollDice(defender.avoidDice);
  avoidRoll.type = 'avoid';
  
  // 対象がファーム中なら回避に-3のペナルティ
  const defenderAction = gameStore.currentActions[defender.id];
  if (defenderAction && defenderAction.actionType === 'ファーム') {
    avoidRoll.total = Math.max(1, avoidRoll.total - 3);
    avoidRoll.skillModifier = -3;
  }
  
  // 成功判定
  const success = attackRoll.total > avoidRoll.total;
  
  // 結果を生成
  const result: TurnResult = {
    characterId: attacker.id,
    targetId: defender.id,
    action: 'アタック',
    rolls: [attackRoll, avoidRoll],
    success,
    fpGained: 2,  // 基本FP獲得
  };
  
  // 相手がリコール中または死亡していれば追加FP
  if (defenderAction && (defenderAction.actionType === 'リコール' || defender.hp <= 0)) {
    result.fpGained = 5;
  }
  
  // 成功した場合はダメージを追加
  if (success) {
    result.damage = 1;  // 基本ダメージ
  }
  
  return result;
}


function handleRecall(character: Character): TurnResult {
  // リコール処理（ここではまだアイテム購入の実装は省略）
  return {
    characterId: character.id,
    action: 'リコール',
    rolls: [],
    success: true
  };
}

function handleSidePush(character: Character): TurnResult {
  return {
    characterId: character.id,
    action: 'サイドプッシュ',
    rolls: [],
    success: true,
    towerDamage: 3,
    forceRecall: true,
    fpGained: 3
  };
}

function handleSupport(supporter: Character, target: Character, supportType: SupportActionType): TurnResult {
  const gameStore = useGameStore.getState();
  
  // サポート効果のロール（1D3）
  const effectRoll = gameStore.rollDice('1D3');
  effectRoll.type = 'skill';
  
  const result: TurnResult = {
    characterId: supporter.id,
    targetId: target.id,
    action: 'サポート',
    supportType: supportType,
    rolls: [effectRoll],
    success: true,
    fpGained: 2  // 基本FP獲得
  };
  
  // サポートタイプに応じた効果
  switch (supportType) {
    case 'エンチャント':
      // 味方にバフを付与
      result.buffAdded = effectRoll.total;
      break;
    case 'フック':
      // 敵にデバフを付与
      result.debuffAdded = effectRoll.total;
      break;
    case 'タンク':
      // 攻撃を肩代わり（ゲームロジックで処理）
      result.tankEffect = true;
      break;
  }
  
  return result;
}