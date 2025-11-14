import type { Item, ItemTier, ItemCategory } from '../types/game';

// ========================================
// アイテムデータ (Task 22)
// ========================================

// ========================================
// 基本アイテム（コンポーネント）
// ========================================

export const BASIC_ITEMS: Item[] = [
  // AD系基本アイテム
  {
    id: 'long_sword',
    name: 'ロングソード',
    tier: 'basic',
    category: 'attack',
    cost: 350,
    stats: { attack: 1.0, defense: 0, mobility: 0, utility: 0 },
    passiveEffect: 'AD系アイテムの基礎素材',
  },
  {
    id: 'dagger',
    name: 'ダガー',
    tier: 'basic',
    category: 'attack',
    cost: 300,
    stats: { attack: 0.5, defense: 0, mobility: 1, utility: 0 },
    passiveEffect: 'アサシン系アイテムの素材',
  },

  // AP系基本アイテム
  {
    id: 'amplifying_tome',
    name: 'アンプリファイングトーム',
    tier: 'basic',
    category: 'attack',
    cost: 400,
    stats: { attack: 1.5, defense: 0, mobility: 0, utility: 0 },
    passiveEffect: 'AP系アイテムの基礎素材',
  },
  {
    id: 'blasting_wand',
    name: 'ブラスティングワンド',
    tier: 'basic',
    category: 'attack',
    cost: 500,
    stats: { attack: 2.0, defense: 0, mobility: 0, utility: 0 },
    passiveEffect: '強力なAP系アイテムの素材',
  },

  // 防御系基本アイテム
  {
    id: 'cloth_armor',
    name: 'クロスアーマー',
    tier: 'basic',
    category: 'defense',
    cost: 300,
    stats: { attack: 0, defense: 1.5, mobility: 0, utility: 0 },
    passiveEffect: '防御系アイテムの基礎素材',
  },
  {
    id: 'ruby_crystal',
    name: 'ルビークリスタル',
    tier: 'basic',
    category: 'defense',
    cost: 400,
    stats: { attack: 0, defense: 1.0, mobility: 0, utility: 0 },
    passiveEffect: 'HP系アイテムの基礎素材（HP+150相当）',
  },

  // ユーティリティ系基本アイテム
  {
    id: 'boots',
    name: 'ブーツ',
    tier: 'basic',
    category: 'mobility',
    cost: 300,
    stats: { attack: 0, defense: 0, mobility: 1, utility: 0 },
    passiveEffect: '移動力アイテムの基礎素材',
  },
  {
    id: 'faerie_charm',
    name: 'フェアリーチャーム',
    tier: 'basic',
    category: 'utility',
    cost: 250,
    stats: { attack: 0, defense: 0, mobility: 0, utility: 1.0 },
    passiveEffect: 'サポート系アイテムの素材',
  },
];

// ========================================
// 上位アイテム（合成）
// ========================================

export const ADVANCED_ITEMS: Item[] = [
  // AD系上位アイテム
  {
    id: 'infinity_edge',
    name: 'インフィニティエッジ',
    tier: 'advanced',
    category: 'attack',
    cost: 1450,
    stats: { attack: 3.5, defense: 0, mobility: 0, utility: 0 },
    passiveEffect: 'クリティカル: マッチアップ判定でダイスが18以上の場合、ダメージ1.5倍',
  },
  {
    id: 'black_cleaver',
    name: 'ブラッククリーバー',
    tier: 'advanced',
    category: 'hybrid',
    cost: 1600,
    stats: { attack: 2.5, defense: 1.5, mobility: 0, utility: 0 },
    passiveEffect: '防御貫通: マッチアップ判定で勝利時、相手の防御力を-2（3ターン持続、スタック可能）\n防御力減衰: 相手の防御力を20%減衰',
  },
  {
    id: 'guardian_angel',
    name: 'ガーディアンエンジェル',
    tier: 'advanced',
    category: 'hybrid',
    cost: 1750,
    stats: { attack: 1.5, defense: 3.5, mobility: 0, utility: 0 },
    passiveEffect: '復活: デス時、即座にHP50%で復活（1回のみ、購入後再発動なし）',
  },
  {
    id: 'trinity_force',
    name: 'トリニティフォース',
    tier: 'advanced',
    category: 'hybrid',
    cost: 2050,
    stats: { attack: 2.0, defense: 1.5, mobility: 2, utility: 0 },
    passiveEffect: '三位一体: スキル使用後、次のマッチアップ判定に+3ボーナス',
  },

  // AP系上位アイテム
  {
    id: 'rabadons_deathcap',
    name: 'ラバドンデスキャップ',
    tier: 'advanced',
    category: 'attack',
    cost: 1900,
    stats: { attack: 6.0, defense: 0, mobility: 0, utility: 0 },
    passiveEffect: '魔力増幅: 自分の攻撃力をさらに+20%増加（他のアイテム含む）',
  },
  {
    id: 'zhonyas_hourglass',
    name: 'ゾーニャの砂時計',
    tier: 'advanced',
    category: 'hybrid',
    cost: 1800,
    stats: { attack: 3.5, defense: 2.0, mobility: 0, utility: 0 },
    activeEffect: '停止: 1ターンの間、無敵状態（攻撃不可、ダメージ受けない）。クールダウン: 5ターン',
  },
  {
    id: 'void_staff',
    name: 'ヴォイドスタッフ',
    tier: 'advanced',
    category: 'attack',
    cost: 2100,
    stats: { attack: 5.5, defense: 0, mobility: 0, utility: 0 },
    passiveEffect: '虚無: 敵の防御力を40%減衰',
  },

  // 防御系上位アイテム
  {
    id: 'sunfire_cape',
    name: 'サンファイアケープ',
    tier: 'advanced',
    category: 'defense',
    cost: 1500,
    stats: { attack: 0, defense: 5.5, mobility: 0, utility: 0 },
    passiveEffect: '炎上: 毎ターン、隣接する敵全員に20ダメージ（防御力無視）',
  },

  // ユーティリティ系上位アイテム
  {
    id: 'mobility_boots',
    name: 'モビリティブーツ',
    tier: 'advanced',
    category: 'mobility',
    cost: 1000,
    stats: { attack: 0, defense: 0, mobility: 3, utility: 0 },
    passiveEffect: '高速移動: ローム/ガンク時、移動力ボーナスが2倍になる',
  },
  {
    id: 'ardent_censer',
    name: 'アーデントセンサー',
    tier: 'advanced',
    category: 'utility',
    cost: 1400,
    stats: { attack: 1.0, defense: 0, mobility: 0, utility: 3.0 },
    passiveEffect: '味方強化: 自分のバフスキルを受けた味方は、2ターンの間攻撃力+1追加ボーナス',
  },
];

// ========================================
// 伝説アイテム（将来追加予定）
// ========================================

export const LEGENDARY_ITEMS: Item[] = [
  // 将来追加予定
];

// ========================================
// 全アイテムリスト
// ========================================

export const ALL_ITEMS: Item[] = [
  ...BASIC_ITEMS,
  ...ADVANCED_ITEMS,
  ...LEGENDARY_ITEMS,
];

// ========================================
// ヘルパー関数
// ========================================

/**
 * IDでアイテムを取得
 */
export const getItemById = (id: string): Item | undefined => {
  return ALL_ITEMS.find((item) => item.id === id);
};

/**
 * ティアでフィルター
 */
export const getItemsByTier = (tier: ItemTier): Item[] => {
  return ALL_ITEMS.filter((item) => item.tier === tier);
};

/**
 * カテゴリでフィルター
 */
export const getItemsByCategory = (category: ItemCategory): Item[] => {
  return ALL_ITEMS.filter((item) => item.category === category);
};

/**
 * 価格順にソート
 */
export const sortItemsByPrice = (items: Item[], ascending = true): Item[] => {
  return [...items].sort((a, b) =>
    ascending ? a.cost - b.cost : b.cost - a.cost
  );
};

/**
 * 攻撃力順にソート
 */
export const sortItemsByAttack = (items: Item[], ascending = false): Item[] => {
  return [...items].sort((a, b) => {
    const aAttack = a.stats.attack || 0;
    const bAttack = b.stats.attack || 0;
    return ascending ? aAttack - bAttack : bAttack - aAttack;
  });
};
