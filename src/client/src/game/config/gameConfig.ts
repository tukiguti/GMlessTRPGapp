/**
 * クライアント側ゲーム設定（オフラインモード用）
 */

export const GAME_CONFIG = {
  // キャラクター基本ステータス
  roles: {
    tank: { attack: 6, defense: 9, mobility: 4, utility: 5 },
    fighter: { attack: 8, defense: 7, mobility: 6, utility: 4 },
    assassin: { attack: 9, defense: 4, mobility: 9, utility: 3 },
    marksman: { attack: 10, defense: 3, mobility: 5, utility: 4 },
    mage: { attack: 9, defense: 4, mobility: 4, utility: 8 },
    support: { attack: 3, defense: 5, mobility: 5, utility: 10 },
    enchanter: { attack: 2, defense: 4, mobility: 4, utility: 10 },
    catcher: { attack: 4, defense: 6, mobility: 5, utility: 9 },
    diver: { attack: 7, defense: 6, mobility: 7, utility: 5 },
    juggernaut: { attack: 8, defense: 8, mobility: 3, utility: 4 },
  },

  // レベルアップボーナス
  levelUp: {
    attack: 0.5,
    defense: 0.5,
    mobility: 0.2,
    utility: 0.3,
    maxHp: 50,
  },

  // 戦闘システム
  combat: {
    criticalHit: 20, // 1d20で20が出たらクリティカル
    criticalMultiplier: 2.0,
    baseDamageMin: 10,
    baseDamageMax: 30,
  },

  // ゴールド獲得
  gold: {
    kill: 300,
    assist: 150,
    minionKill: 20,
    tower: 150,
    dragon: 100,
    baron: 200,
    herald: 100,
  },

  // リスポーン時間（秒）
  respawn: {
    baseTime: 10,
    perLevel: 2,
    maxTime: 60,
  },

  // ラウンド設定
  round: {
    maxRounds: 120, // 最大120ラウンド = 20分
    declarationTime: 60, // 宣言フェーズ60秒
  },

  // タワー設定
  tower: {
    maxHp: 2000,
    attack: 15,
    defense: 10,
    goldReward: 150,
  },

  // ネクサス設定
  nexus: {
    maxHp: 5000,
  },

  // ミニオン設定
  minion: {
    spawnInterval: 3, // 3ラウンドごと
    attack: 2,
    defense: 1,
    maxHp: 100,
    goldReward: 20,
  },
};

export type RoleType = keyof typeof GAME_CONFIG.roles;
