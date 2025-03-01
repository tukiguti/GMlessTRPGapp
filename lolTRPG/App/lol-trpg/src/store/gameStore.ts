// src/store/gameStore.ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Character, GamePhase, PlayerAction, Item, TurnResult, SupportActionType, ActionType } from '../models/types';
import { useTeamStore } from './teamStore';
import { useCharacterStore } from './characterStore';

// diceSlice.ts から diceUtils.ts に参照を変更
import { rollDice } from './utils/diceUtils';
import { handleFarming, handleAttack, handleRecall, handleSidePush } from './slices/battleSlice';
import { handleSupport } from './slices/supportSlice';
import { purchaseItem } from './slices/itemSlice';
import { createTeamCharacters } from './slices/characterSlice';
import { advanceGamePhase } from './slices/phaseSlice';

// ゲーム状態
interface GameState {
  phase: GamePhase;
  round: number;
  blueTeamCharacters: Character[];
  redTeamCharacters: Character[];
  blueTeamTowers: number;
  redTeamTowers: number;
  currentActions: Record<string, PlayerAction>;
  actionTargets: Record<string, string>;
  turnResults: TurnResult[];
  isPlayerTurn: boolean;
  processedActions: Record<string, PlayerAction>; // 追加: 処理済みアクション
}

const initialState: GameState = {
  // 既存の初期値
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
  processedActions: {} // 追加
};

interface GameActions {
  // ゲーム初期化
  initializeGame: () => void;

  // アクション管理
  setCharacterAction: (characterId: string, action: ActionType) => void;
  setActionTarget: (characterId: string, targetId: string) => void;
  setSupportAction: (characterId: string, supportType: SupportActionType, targetId: string) => void;

  // ターン処理
  executeTurn: () => void;

  // アイテム管理
  addItemToCharacter: (characterId: string, item: Item) => void;

  // その他のユーティリティ
  rollDice: (diceNotation: string) => any;
  getCharacterByRole: (team: 'BLUE' | 'RED', role: string) => Character | undefined;
  getOpponentByRole: (characterId: string) => Character | undefined;
  advancePhase: () => void;
  resetGame: () => void;
}

type GameStore = GameState & GameActions;

export const useGameStore = create<GameStore>()(
  immer((set, get) => ({
    // 初期状態
    ...initialState,
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
    processedActions: {},

    // ゲーム初期化
    initializeGame: () => {
      const teamStore = useTeamStore.getState();
      const characterStore = useCharacterStore.getState();

      // チームメンバーからキャラクターを取得
      const blueTeamCharacters = createTeamCharacters(
        teamStore.blueTeam.members,
        characterStore.characters
      ).map(c => ({ ...c, team: 'BLUE' as 'BLUE' }));

      const redTeamCharacters = createTeamCharacters(
        teamStore.redTeam.members,
        characterStore.characters
      ).map(c => ({ ...c, team: 'RED' as 'RED' }));

      console.log("Initializing game with blue team:", blueTeamCharacters);
      console.log("Initializing game with red team:", redTeamCharacters);

      // ゲーム状態を初期化
      set({
        blueTeamCharacters,
        redTeamCharacters,
        phase: 'LANE_BATTLE',
        round: 1,
        blueTeamTowers: 3,
        redTeamTowers: 3,
        currentActions: {}, // アクションをクリア
        actionTargets: {},  // ターゲットをクリア
        turnResults: [],
        isPlayerTurn: true
      });
    },

    // キャラクターのアクションを設定
    setCharacterAction: (characterId, action) => {
      set(state => {
        if (!action) {
          // アクションを削除する場合
          const { [characterId]: _, ...restActions } = state.currentActions;
          state.currentActions = restActions;
          return;
        }

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

    // サポートアクションの設定（型安全な実装）
    setSupportAction: (characterId, supportType, targetId) => {
      set(state => {
        const action = state.currentActions[characterId];
        if (action) {
          // サポート用に拡張したアクションを作成
          const extendedAction: PlayerAction & { supportType?: SupportActionType } = {
            ...action,
            supportType: supportType,
            targetId: targetId
          };

          // 更新したアクションを状態に設定
          state.currentActions[characterId] = extendedAction;
        }
      });
    },

    // ターンを実行
    executeTurn: () => {
      const state = get();
      const results: TurnResult[] = [];

      // 現在のアクションをコピー（ここでactionsToProcessを定義）
      const actionsToProcess = { ...state.currentActions };

      // 全キャラクタDー
      const allCharacters = [...state.blueTeamCharacters, ...state.redTeamCharacters];

      console.log('executeTurn - アクションをコピー:', actionsToProcess);

      // 1. サポートアクション処理
      allCharacters.forEach(character => {
        const action = state.currentActions[character.id];
        if (action && action.actionType === 'サポート' && action.targetId) {
          // supportTypeプロパティへのアクセスを型安全に
          const extendedAction = action as PlayerAction & { supportType?: SupportActionType };
          const supportType = extendedAction.supportType;

          if (supportType) {
            const target = allCharacters.find(c => c.id === action.targetId);
            if (target) {
              results.push(handleSupport(character, target, supportType));
            }
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
            // 攻撃処理
            const result = handleAttack(character, target, state.currentActions);
            
            // HPが0になったかどうかを確認
            if (result.success && result.damage && target.hp - result.damage <= 0) {
              // HPが0になった場合、FPを追加で獲得
              result.fpGained = 8; // 8FPを獲得
              
              // リザルトに情報を追加
              result.killedTarget = true;
            }
            
            results.push(result);
          }
        }
      });

      // 結果を更新
      set(state => {
        state.turnResults = results;
        state.isPlayerTurn = false;
        
        // 処理済みアクションを保存（ここでactionsToProcessを使用）
        state.processedActions = actionsToProcess;
        
        // アクションをクリア
        state.currentActions = {};
        state.actionTargets = {};
        
        console.log('executeTurn - 処理済みアクション:', state.processedActions);
      });

      // ターン終了処理（AIターンなど）を追加予定
      setTimeout(() => {
        set(state => {
          state.isPlayerTurn = true;
          state.turnResults = [];
        });
      }, 3000);
    },

    // アイテムをキャラクターに追加
    addItemToCharacter: (characterId, item) => {
      set(state => {
        // キャラクターを検索
        const allCharacters = [...state.blueTeamCharacters, ...state.redTeamCharacters];
        const character = allCharacters.find(c => c.id === characterId);

        if (!character) return; // キャラクターが見つからない場合

        // 購入処理
        const result = purchaseItem(character, item);

        if (!result.success || !result.character) return; // 購入失敗

        // 更新したキャラクターを適用
        if (character.team === 'BLUE') {
          const index = state.blueTeamCharacters.findIndex(c => c.id === characterId);
          if (index !== -1) {
            state.blueTeamCharacters[index] = result.character;
          }
        } else {
          const index = state.redTeamCharacters.findIndex(c => c.id === characterId);
          if (index !== -1) {
            state.redTeamCharacters[index] = result.character;
          }
        }
      });
    },

    // ダイスロール処理（ユーティリティから再エクスポート）
    rollDice,

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
        const { phase, round, gameEnded } = advanceGamePhase(
          state.phase,
          state.round,
          state.blueTeamTowers,
          state.redTeamTowers
        );

        state.phase = phase;
        state.round = round;

        if (gameEnded) {
          // ゲーム終了処理
          console.log('Game ended!');
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