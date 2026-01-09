import { useGameStore } from '../stores/gameStore';
import type { Skill } from '@gmless-trpg/game';

// ========================================
// SkillPanel コンポーネント (Task 27-28)
// ========================================

interface SkillPanelProps {
  characterId: string;
}

export const SkillPanel: React.FC<SkillPanelProps> = ({ characterId }) => {
  // GameStore
  const character = useGameStore((state) => {
    const allCharacters = [...state.teams.blue, ...state.teams.red];
    return allCharacters.find((c) => c.id === characterId);
  });
  const useSkill = useGameStore((state) => state.useSkill);

  // ========================================
  // スキル使用処理 (Task 28)
  // ========================================
  const handleUseSkill = (skillType: 'normal' | 'ult') => {
    const success = useSkill(characterId, skillType);
    if (success) {
      console.log(`Used ${skillType} skill`);
    } else {
      alert('スキルが使用できません（クールダウン中）');
    }
  };

  if (!character) {
    return null;
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="text-lg font-bold mb-4">スキル</h3>

      <div className="space-y-3">
        {/* 通常スキル */}
        <SkillCard
          skill={character.skills.normal}
          type="normal"
          onUse={() => handleUseSkill('normal')}
          role={character.role}
        />

        {/* 必殺技 */}
        <SkillCard
          skill={character.skills.ult}
          type="ultimate"
          onUse={() => handleUseSkill('ult')}
          role={character.role}
        />
      </div>
    </div>
  );
};

// ========================================
// SkillCard サブコンポーネント (Task 28)
// ========================================

interface SkillCardProps {
  skill: Skill;
  type: 'normal' | 'ultimate';
  onUse: () => void;
  role: string;
}

const getSkillInfo = (role: string, type: 'normal' | 'ultimate') => {
  const skillData: Record<string, { normal: { name: string; desc: string }; ultimate: { name: string; desc: string } }> = {
    ad_marksman: {
      normal: { name: 'ラピッドファイア', desc: '攻撃速度を増加させる' },
      ultimate: { name: 'バレットストーム', desc: '広範囲に弾幕を浴びせる' }
    },
    ad_fighter: {
      normal: { name: 'スラッシュ', desc: '強力な斬撃' },
      ultimate: { name: 'バーサーク', desc: '攻撃力と移動速度が大幅上昇' }
    },
    default: {
      normal: { name: '通常スキル', desc: 'ロール固有のスキル' },
      ultimate: { name: '必殺技', desc: '強力な必殺技' }
    }
  };

  const data = skillData[role] || skillData.default;
  return type === 'normal' ? data.normal : data.ultimate;
};

const SkillCard: React.FC<SkillCardProps> = ({
  skill,
  type,
  onUse,
  role
}) => {
  // クールダウン計算
  const remainingCooldown = skill.currentCooldown;
  const isReady = remainingCooldown <= 0;

  const info = getSkillInfo(role, type);

  // クールダウンパーセンテージ（視覚化用）
  const cooldownPercentage = isReady
    ? 100
    : ((skill.cooldown - remainingCooldown) / skill.cooldown) * 100;

  return (
    <div
      className={`bg-gray-900 rounded-lg p-3 border-2 transition-all ${isReady
        ? 'border-green-500 hover:border-green-400'
        : 'border-gray-700 opacity-75'
        }`}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-semibold">{info.name}</h4>
            <span
              className={`text-xs px-2 py-0.5 rounded ${type === 'normal' ? 'bg-blue-600' : 'bg-purple-600'
                }`}
            >
              {type === 'normal' ? '通常スキル' : '必殺技'}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">{info.desc}</p>
        </div>
      </div>

      {/* クールダウン表示 (Task 28) */}
      <div className="mb-2">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-400">クールダウン</span>
          <span
            className={`font-semibold ${isReady ? 'text-green-400' : 'text-yellow-400'
              }`}
          >
            {isReady ? '使用可能' : `残り ${remainingCooldown} ラウンド`}
          </span>
        </div>

        {/* クールダウンバー */}
        <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
          <div
            className={`h-2 transition-all duration-300 ${isReady ? 'bg-green-500' : 'bg-yellow-500'
              }`}
            style={{ width: `${cooldownPercentage}%` }}
          />
        </div>
      </div>

      {/* 使用ボタン */}
      <button
        onClick={onUse}
        disabled={!isReady}
        className={`w-full py-2 rounded font-semibold text-sm transition-all ${isReady
          ? type === 'normal'
            ? 'bg-blue-600 hover:bg-blue-700'
            : 'bg-purple-600 hover:bg-purple-700'
          : 'bg-gray-700 cursor-not-allowed opacity-50'
          }`}
      >
        {isReady ? 'スキル使用' : `CD: ${remainingCooldown}R`}
      </button>

      {/* スキル情報 */}
      <div className="mt-2 text-xs text-gray-500 flex justify-between">
        <span>CD: {skill.cooldown}ラウンド</span>
      </div>
    </div>
  );
};
