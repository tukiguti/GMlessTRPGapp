import { useState } from 'react';

// ========================================
// MainMenu コンポーネント (Task 12-13)
// ========================================

export type GameMode =
  | 'tutorial'   // チュートリアル
  | 'cpu'        // CPU練習
  | 'casual'     // カジュアル
  | 'ranked'     // ランクマッチ
  | 'custom';    // カスタム

interface MainMenuProps {
  onStartGame: (mode: GameMode) => void;
}

const GAME_MODES: Array<{
  id: GameMode;
  name: string;
  description: string;
  icon: string;
}> = [
  {
    id: 'tutorial',
    name: 'チュートリアル',
    description: 'ゲームの基本を学ぶ',
    icon: '📚',
  },
  {
    id: 'cpu',
    name: 'CPU練習',
    description: 'CPUと対戦して練習',
    icon: '🤖',
  },
  {
    id: 'casual',
    name: 'カジュアル',
    description: '気軽に対戦を楽しむ',
    icon: '🎮',
  },
  {
    id: 'ranked',
    name: 'ランクマッチ',
    description: 'ランクを上げて競う',
    icon: '🏆',
  },
  {
    id: 'custom',
    name: 'カスタム',
    description: '友達と遊ぶ',
    icon: '🔧',
  },
];

export const MainMenu: React.FC<MainMenuProps> = ({ onStartGame }) => {
  const [selectedMode, setSelectedMode] = useState<GameMode>('casual');

  const handleModeSelect = (mode: GameMode) => {
    setSelectedMode(mode);
  };

  const handleStartGame = () => {
    onStartGame(selectedMode);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="max-w-4xl w-full p-8">
        {/* タイトル */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            GMレスLoL風TRPG
          </h1>
          <p className="text-gray-400 text-lg">
            5vs5の戦略的バトルロイヤルTRPG
          </p>
        </div>

        {/* ゲームモード選択 (Task 13) */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-6 text-center">
            ゲームモードを選択
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {GAME_MODES.map((mode) => (
              <button
                key={mode.id}
                onClick={() => handleModeSelect(mode.id)}
                className={`p-6 rounded-lg border-2 transition-all duration-200 text-left ${
                  selectedMode === mode.id
                    ? 'border-blue-500 bg-blue-900/30 shadow-lg shadow-blue-500/50'
                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-600 hover:bg-gray-800'
                }`}
              >
                <div className="text-4xl mb-2">{mode.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{mode.name}</h3>
                <p className="text-sm text-gray-400">{mode.description}</p>

                {/* 選択中インジケーター */}
                {selectedMode === mode.id && (
                  <div className="mt-3 flex items-center text-blue-400 text-sm">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    選択中
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 開始ボタン */}
        <div className="text-center">
          <button
            onClick={handleStartGame}
            className="px-12 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg text-xl font-bold shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            ゲーム開始
          </button>
        </div>

        {/* バージョン情報 */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>Alpha v0.1.0</p>
        </div>
      </div>
    </div>
  );
};
