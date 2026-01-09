import { useState } from 'react';
import { WebSocketService } from '../services/websocket';
import { useGameStore } from '../stores/gameStore';
import type { RoleType, LaneType, Stats } from '../types/game';

// ========================================
// CharacterSelection コンポーネント (Task 18-21)
// ========================================

interface CharacterSelectionProps {
  gameId: string;
  onSelectionComplete: () => void;
}

// ========================================
// ロール定義 (Task 19)
// ========================================
const ROLES: Array<{
  id: RoleType;
  name: string;
  description: string;
  baseStats: Stats;
  icon: string;
}> = [
    {
      id: 'ad_marksman',
      name: 'ADマークスマン',
      description: '遠距離物理DPS',
      baseStats: { attack: 8, defense: 3, mobility: 5, utility: 4 },
      icon: '🏹',
    },
    {
      id: 'ad_fighter',
      name: 'ADファイター',
      description: '近接物理DPS',
      baseStats: { attack: 7, defense: 6, mobility: 5, utility: 2 },
      icon: '⚔️',
    },
    {
      id: 'ad_assassin',
      name: 'ADアサシン',
      description: '高機動物理バースト',
      baseStats: { attack: 8, defense: 3, mobility: 9, utility: 0 },
      icon: '🗡️',
    },
    {
      id: 'ad_tank',
      name: 'ADタンク',
      description: '物理防御型タンク',
      baseStats: { attack: 4, defense: 9, mobility: 3, utility: 4 },
      icon: '🛡️',
    },
    {
      id: 'ap_mage',
      name: 'APメイジ',
      description: '遠距離魔法DPS',
      baseStats: { attack: 9, defense: 2, mobility: 4, utility: 5 },
      icon: '🔮',
    },
    {
      id: 'ap_assassin',
      name: 'APアサシン',
      description: '高機動魔法バースト',
      baseStats: { attack: 9, defense: 2, mobility: 8, utility: 1 },
      icon: '⚡',
    },
    {
      id: 'ap_fighter',
      name: 'APファイター',
      description: '近接魔法DPS',
      baseStats: { attack: 7, defense: 5, mobility: 6, utility: 2 },
      icon: '🔥',
    },
    {
      id: 'ap_tank',
      name: 'APタンク',
      description: '魔法防御型タンク',
      baseStats: { attack: 3, defense: 9, mobility: 4, utility: 4 },
      icon: '💎',
    },
    {
      id: 'ap_support',
      name: 'APサポート',
      description: '魔法支援型',
      baseStats: { attack: 4, defense: 4, mobility: 5, utility: 7 },
      icon: '✨',
    },
    {
      id: 'tank_support',
      name: 'タンクサポート',
      description: '防御支援型',
      baseStats: { attack: 2, defense: 8, mobility: 3, utility: 7 },
      icon: '🛡️',
    },
  ];

// ========================================
// レーン定義 (Task 20)
// ========================================
const LANES: Array<{
  id: LaneType;
  name: string;
  description: string;
}> = [
    { id: 'TOP', name: 'トップ', description: '上レーン - タンク/ファイター向き' },
    { id: 'JG', name: 'ジャングル', description: 'ジャングル - 機動力重視' },
    { id: 'MID', name: 'ミッド', description: '中レーン - メイジ/アサシン向き' },
    { id: 'BOT', name: 'ボット', description: '下レーン - マークスマン向き' },
    { id: 'SUP', name: 'サポート', description: 'サポート - 支援特化' },
  ];

export const CharacterSelection: React.FC<CharacterSelectionProps> = ({
  gameId,
  onSelectionComplete,
}) => {
  // 選択状態
  const [selectedRole, setSelectedRole] = useState<RoleType | null>(null);
  const [selectedLane, setSelectedLane] = useState<LaneType | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  // ゲームストア
  const teams = useGameStore((state) => state.teams);
  const characters = [...teams.blue, ...teams.red];

  // WebSocketサービス
  const ws = WebSocketService.getInstance();

  // ========================================
  // 選択済みレーンの確認
  // ========================================
  const isLaneTaken = (lane: LaneType): boolean => {
    return characters.some((char) => char.lane === lane);
  };

  // ========================================
  // キャラクター確定 (WebSocket送信)
  // ========================================
  const handleConfirmSelection = async () => {
    if (!selectedRole || !selectedLane) {
      alert('ロールとレーンを選択してください');
      return;
    }

    if (isLaneTaken(selectedLane)) {
      alert('このレーンは既に選択されています');
      return;
    }

    setIsConfirming(true);

    try {
      // キャラクター選択をサーバーに送信
      ws.selectCharacter(gameId, selectedRole, selectedLane);

      // 少し待ってから完了
      setTimeout(() => {
        setIsConfirming(false);
        onSelectionComplete();
      }, 500);
    } catch (error) {
      console.error('Failed to select character:', error);
      setIsConfirming(false);
      alert('キャラクター選択に失敗しました');
    }
  };

  // 選択中のロール情報
  const selectedRoleInfo = selectedRole
    ? ROLES.find((r) => r.id === selectedRole)
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-8">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">キャラクター選択</h1>
          <p className="text-gray-400">ロールとレーンを選択してください</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左: ロール選択 (Task 19) */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-semibold mb-4">ロール選択</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {ROLES.map((role) => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${selectedRole === role.id
                      ? 'border-blue-500 bg-blue-900/30 shadow-lg shadow-blue-500/50'
                      : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                    }`}
                >
                  <div className="text-3xl mb-2">{role.icon}</div>
                  <div className="text-sm font-semibold">{role.name}</div>
                </button>
              ))}
            </div>

            {/* レーン選択 (Task 20) */}
            <h2 className="text-2xl font-semibold mb-4 mt-8">レーン選択</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {LANES.map((lane) => {
                const taken = isLaneTaken(lane.id);
                return (
                  <button
                    key={lane.id}
                    onClick={() => !taken && setSelectedLane(lane.id)}
                    disabled={taken}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 ${taken
                        ? 'border-gray-800 bg-gray-900/50 cursor-not-allowed opacity-50'
                        : selectedLane === lane.id
                          ? 'border-purple-500 bg-purple-900/30 shadow-lg shadow-purple-500/50'
                          : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                      }`}
                  >
                    <div className="text-lg font-bold mb-1">{lane.name}</div>
                    <div className="text-xs text-gray-400">
                      {taken ? '選択済み' : lane.id}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 右: ステータスプレビュー (Task 21) */}
          <div className="lg:col-span-1">
            <h2 className="text-2xl font-semibold mb-4">プレビュー</h2>

            {selectedRoleInfo ? (
              <div className="bg-gray-800 rounded-lg p-6 space-y-4">
                {/* ロール情報 */}
                <div className="text-center">
                  <div className="text-5xl mb-3">{selectedRoleInfo.icon}</div>
                  <h3 className="text-xl font-bold mb-1">
                    {selectedRoleInfo.name}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {selectedRoleInfo.description}
                  </p>
                </div>

                <div className="border-t border-gray-700 pt-4">
                  {/* 基本ステータス */}
                  <h4 className="text-sm font-semibold mb-3 text-gray-400">
                    基本ステータス
                  </h4>
                  <div className="space-y-2">
                    <StatBar
                      label="攻撃力"
                      value={selectedRoleInfo.baseStats.attack}
                      max={10}
                      color="red"
                    />
                    <StatBar
                      label="防御力"
                      value={selectedRoleInfo.baseStats.defense}
                      max={10}
                      color="blue"
                    />
                    <StatBar
                      label="機動力"
                      value={selectedRoleInfo.baseStats.mobility}
                      max={10}
                      color="green"
                    />
                    <StatBar
                      label="支援力"
                      value={selectedRoleInfo.baseStats.utility}
                      max={10}
                      color="yellow"
                    />
                  </div>
                </div>

                {/* 選択中のレーン */}
                {selectedLane && (
                  <div className="border-t border-gray-700 pt-4">
                    <h4 className="text-sm font-semibold mb-2 text-gray-400">
                      選択中のレーン
                    </h4>
                    <div className="bg-purple-900/30 border border-purple-500 rounded-lg p-3 text-center">
                      <div className="font-bold text-purple-400">
                        {LANES.find((l) => l.id === selectedLane)?.name}
                      </div>
                    </div>
                  </div>
                )}

                {/* 確定ボタン */}
                <button
                  onClick={handleConfirmSelection}
                  disabled={!selectedRole || !selectedLane || isConfirming}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg font-semibold transition-all"
                >
                  {isConfirming ? '確定中...' : '選択を確定'}
                </button>
              </div>
            ) : (
              <div className="bg-gray-800 rounded-lg p-6 text-center text-gray-400">
                <p>ロールを選択してください</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ========================================
// ステータスバーコンポーネント
// ========================================
interface StatBarProps {
  label: string;
  value: number;
  max: number;
  color: 'red' | 'blue' | 'green' | 'yellow';
}

const StatBar: React.FC<StatBarProps> = ({ label, value, max, color }) => {
  const percentage = (value / max) * 100;

  const colorClasses = {
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
  };

  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-400">{label}</span>
        <span className="font-semibold">{value}</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div
          className={`${colorClasses[color]} h-2 rounded-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
