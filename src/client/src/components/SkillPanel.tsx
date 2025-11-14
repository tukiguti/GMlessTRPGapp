import { useGameStore } from '../stores/gameStore';
import type { Skill } from '../types/game';

// ========================================
// SkillPanel コンポーネント (Task 27-28)
// ========================================

interface SkillPanelProps {
  characterId: string;
}

export const SkillPanel: React.FC<SkillPanelProps> = ({ characterId }) => {
  // GameStore
  const character = useGameStore((state) =>
    state.characters.find((c) => c.id === characterId)
  );
  const currentRound = useGameStore((state) => state.round);
  const useSkill = useGameStore((state) => state.useSkill);

  // ========================================
  // スキル使用処理 (Task 28)
  // ========================================
  const handleUseSkill = (skillType: 'normal' | 'ultimate') => {
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
          currentRound={currentRound}
          onUse={() => handleUseSkill('normal')}
        />

        {/* 必殺技 */}
        <SkillCard
          skill={character.skills.ultimate}
          type="ultimate"
          currentRound={currentRound}
          onUse={() => handleUseSkill('ultimate')}
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
  currentRound: number;
  onUse: () => void;
}

const SkillCard: React.FC<SkillCardProps> = ({
  skill,
  type,
  currentRound,
  onUse,
}) => {
  // クールダウン計算
  const roundsSinceLastUse = currentRound - skill.lastUsedRound;
  const remainingCooldown = Math.max(0, skill.cooldown - roundsSinceLastUse);
  const isReady = skill.ready;

  // クールダウンパーセンテージ（視覚化用）
  const cooldownPercentage = isReady
    ? 100
    : (roundsSinceLastUse / skill.cooldown) * 100;

  return (
    <div
      className={`bg-gray-900 rounded-lg p-3 border-2 transition-all ${
        isReady
          ? 'border-green-500 hover:border-green-400'
          : 'border-gray-700 opacity-75'
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-semibold">{skill.name}</h4>
            <span
              className={`text-xs px-2 py-0.5 rounded ${
                type === 'normal' ? 'bg-blue-600' : 'bg-purple-600'
              }`}
            >
              {type === 'normal' ? '通常スキル' : '必殺技'}
            </span>
          </div>
          {skill.description && (
            <p className="text-xs text-gray-400 mt-1">{skill.description}</p>
          )}
        </div>
      </div>

      {/* クールダウン表示 (Task 28) */}
      <div className="mb-2">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-400">クールダウン</span>
          <span
            className={`font-semibold ${
              isReady ? 'text-green-400' : 'text-yellow-400'
            }`}
          >
            {isReady ? '使用可能' : `残り ${remainingCooldown} ラウンド`}
          </span>
        </div>

        {/* クールダウンバー */}
        <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
          <div
            className={`h-2 transition-all duration-300 ${
              isReady ? 'bg-green-500' : 'bg-yellow-500'
            }`}
            style={{ width: `${cooldownPercentage}%` }}
          />
        </div>
      </div>

      {/* 使用ボタン */}
      <button
        onClick={onUse}
        disabled={!isReady}
        className={`w-full py-2 rounded font-semibold text-sm transition-all ${
          isReady
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
        {!isReady && (
          <span>
            最終使用: ラウンド{skill.lastUsedRound}
          </span>
        )}
      </div>
    </div>
  );
};
