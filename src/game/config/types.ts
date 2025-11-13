// ========================================
// キャラクターステータス
// ========================================
export interface CharacterStats {
  hp: number;
  attack: number;
  defense: number;
  mobility: number;
  utility: number;
}

export type RoleType =
  | 'ad_marksman'
  | 'ad_fighter'
  | 'ad_assassin'
  | 'ad_tank'
  | 'ap_mage'
  | 'ap_assassin'
  | 'ap_fighter'
  | 'ap_tank'
  | 'ap_support'
  | 'tank_support';

// ========================================
// レベリングシステム
// ========================================
export interface LevelingSystem {
  max_level: number;
  level_up_turns: Record<number, number>;
  growth_per_level: Record<RoleType, CharacterStats>;
}

// ========================================
// 戦闘システム
// ========================================
export interface CombatSystem {
  damage_multiplier: number;
  death_penalty: {
    respawn_time_base: number;
    respawn_time_per_level: number;
    gold_loss_percentage: number;
    exp_bonus_to_killer: number;
  };
  cc: {
    success_threshold: number;
    escape_threshold: number;
    normal_skill_penalty: number;
    ult_skill_penalty: number;
  };
}

// ========================================
// 戦闘補正
// ========================================
export interface CombatModifiers {
  gank: {
    no_vision_bonus: number;
    mobility_threshold: number;
  };
  positioning: {
    frontline_penalty: number;
    backline_vs_assassin_penalty: number;
  };
  numerical_advantage: Record<string, number>;
}

// ========================================
// スキルシステム
// ========================================
export interface SkillConfig {
  bonus?: number;
  penalty?: number;
  penalty_to_target?: number;
  cooldown: number;
  duration?: number;
  success_threshold?: number;
}

export interface SkillSystem {
  normal_skills: {
    damage: SkillConfig;
    cc: SkillConfig;
    buff: SkillConfig;
    debuff: SkillConfig;
  };
  ult_skills: {
    damage: SkillConfig;
    cc: SkillConfig;
    buff: SkillConfig;
    debuff: SkillConfig;
  };
}

// ========================================
// タワーシステム
// ========================================
export interface TowerSystem {
  hp: {
    outer_tower: number;
    inner_tower: number;
    nexus_tower: number;
    nexus: number;
  };
  damage_to_tower: {
    player_base_dice: string;
    minion_base_dice: string;
    minion_bonus_damage: number;
  };
  tower_defense: {
    damage_per_turn: number;
  };
}

// ========================================
// ミニオンシステム
// ========================================
export interface MinionSystem {
  spawn_frequency: number;
  minion_hp: number;
  last_hit_gold: number;
  last_hit_exp: number;
}

// ========================================
// ゴールドシステム
// ========================================
export interface GoldSystem {
  farming: number;
  attack_only: number;
  tower_outer: number;
  tower_inner: number;
  tower_nexus: number;
  nexus_destruction: number;
  kill_bonus: number;
  assist_bonus: number;
  dragon: number;
  baron: number;
  herald: number;
}

// ========================================
// ジャングルバフ
// ========================================
export interface JungleBuff {
  attack_bonus?: number;
  slow_effect?: number;
  utility_bonus?: number;
  cooldown_reduction?: number;
  cooldown_minimum?: number;
  duration: number;
  gold_reward: number;
  respawn_time: number;
}

export interface JungleBuffs {
  red_buff: JungleBuff;
  blue_buff: JungleBuff;
}

// ========================================
// アイテムシステム
// ========================================
export interface ItemStats {
  cost: number;
  hp?: number;
  attack?: number;
  defense?: number;
  mobility?: number;
  utility?: number;
  // 特殊効果
  critical_threshold?: number;
  critical_multiplier?: number;
  armor_pen?: number;
  armor_reduction_percent?: number;
  lifesteal_percent?: number;
  magic_resist_percent?: number;
  ability_haste?: number;
  move_speed?: number;
  attack_speed?: number;
}

// ========================================
// オブジェクトシステム
// ========================================
export interface ObjectConfig {
  hp: number;
  gold_reward: number;
  exp_reward: number;
  respawn_time: number;
  buff_duration?: number;
  effect?: any;
}

// ========================================
// 時間管理システム
// ========================================
export interface TimeSystem {
  turn_duration_seconds: number;
  max_game_turns: number;
  phases: {
    early_game: { start: number; end: number };
    mid_game: { start: number; end: number };
    late_game: { start: number; end: number };
  };
}

// ========================================
// メイン設定型
// ========================================
export interface GameConfig {
  config_version?: string;
  last_updated?: string;
  character_initial_stats: Record<RoleType, CharacterStats>;
  leveling_system: LevelingSystem;
  combat_system: CombatSystem;
  combat_modifiers: CombatModifiers;
  skill_system: SkillSystem;
  tower_system: TowerSystem;
  minion_system: MinionSystem;
  gold_system: GoldSystem;
  jungle_buffs: JungleBuffs;
  objects: {
    dragon_common?: ObjectConfig;
    dragon_types?: Record<string, any>;
    baron?: ObjectConfig;
    herald?: ObjectConfig;
  };
  basic_items: Record<string, ItemStats>;
  advanced_items: Record<string, ItemStats>;
  time_system: TimeSystem;
}
