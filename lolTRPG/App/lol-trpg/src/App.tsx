// src/App.tsx

import React from 'react';
import { CharacterCreator } from './components/Character/CharacterCreator';
import { TeamComposition } from './components/Game/TeamComposition';
import { GameContainer } from './components/Game/GameContainer';
import { StatusDisplay } from './components/Game/StatusDisplay';
import { CharacterSheetEditor } from './components/Character/CharacterSheetEditor';
import { 
  CustomCharacter, 
  CustomItem, 
  CHARACTER_BASE_STATS 
} from './types';

const App: React.FC = () => {
  // ゲームの状態管理
  const [gameState, setGameState] = React.useState<'setup' | 'teamSelect' | 'game'>('setup');
  const [teamSize, setTeamSize] = React.useState<number>(2);
  const [characters, setCharacters] = React.useState<CustomCharacter[]>([]);
  const [selectedTeam, setSelectedTeam] = React.useState<{
    blue: (CustomCharacter | null)[];
    red: (CustomCharacter | null)[];
  }>({
    blue: [],
    red: []
  });
  const [items, setItems] = React.useState<Record<string, CustomItem[]>>({});
  const [isEditingSheet, setIsEditingSheet] = React.useState(false);

  // キャラクターシートからのデータ読み込み処理
  const handleLoadFromSheet = (sheetData: { characters: CustomCharacter[] }) => {
    setCharacters(prev => {
      const existingIds = new Set(prev.map(char => char.id));
      const newCharacters = sheetData.characters.filter(char => !existingIds.has(char.id));
      return [...prev, ...newCharacters];
    });
  };

  // キャラクター作成時の処理
  const handleCharacterSave = (character: CustomCharacter) => {
    setCharacters(prev => [...prev, character]);
  };

  // チーム選択時の処理
  const handleTeamSelection = (team: 'blue' | 'red', index: number, selectedChar: CustomCharacter | null) => {
    setSelectedTeam(prev => {
      const newTeam = { ...prev };
      if (selectedChar) {
        const baseStats = CHARACTER_BASE_STATS[selectedChar.class];
        newTeam[team][index] = {
          ...selectedChar,
          stats: baseStats,
          hp: baseStats.hp,
          maxHp: baseStats.maxHp,
          farmPoints: 0,
          items: [],
          skills: [],
          isDead: false
        };
      } else {
        newTeam[team][index] = null;
      }
      return newTeam;
    });
  };

  // チームサイズが変更されたときの処理
  React.useEffect(() => {
    setSelectedTeam({
      blue: Array(teamSize).fill(null),
      red: Array(teamSize).fill(null)
    });
  }, [teamSize]);

  // チーム編成へ進むボタンの有効/無効を判定
  const canProceedToTeamSelect = characters.length > 0 || (gameState === 'setup' && !isEditingSheet);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* セットアップ画面 */}
      {gameState === 'setup' && !isEditingSheet && (
        <div className="p-4">
          <h1 className="text-3xl font-bold mb-4">LoL TRPG</h1>
          
          {/* チームサイズ選択 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">チームサイズ選択</label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              value={teamSize}
              onChange={(e) => setTeamSize(Number(e.target.value))}
            >
              {[1, 2, 3, 4, 5].map(size => (
                <option key={size} value={size}>{size} vs {size}</option>
              ))}
            </select>
          </div>
          
          {/* ナビゲーションボタン */}
          <div className="flex space-x-4">
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors disabled:bg-gray-400"
              onClick={() => setGameState('teamSelect')}
              disabled={!canProceedToTeamSelect}
            >
              チーム編成へ
            </button>
            <button
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
              onClick={() => setIsEditingSheet(true)}
            >
              キャラクターシート エディタを開く
            </button>
            <label className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 transition-colors cursor-pointer">
              キャラクターシート読み込み
              <input
                type="file"
                hidden
                accept=".json"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      try {
                        const content = event.target?.result as string;
                        const data = JSON.parse(content);
                        handleLoadFromSheet(data);
                      } catch (error) {
                        alert('キャラクターシートの読み込みに失敗しました');
                      }
                    };
                    reader.readAsText(file);
                  }
                }}
              />
            </label>
          </div>

          {/* キャラクター作成セクション */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">キャラクター作成</h2>
            <CharacterCreator
              onSave={handleCharacterSave}
              onCancel={() => {}}
            />
          </div>

          {/* 利用可能なキャラクター一覧 */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">利用可能なキャラクター</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {characters.map(char => (
                <div key={char.id} className="bg-white rounded-lg p-4 shadow">
                  <h3 className="text-lg font-bold">{char.name}</h3>
                  <p>{char.type} - {char.class}</p>
                  {char.customSkills?.length > 0 && (
                    <div className="mt-2">
                      <p className="font-semibold">スキル:</p>
                      <ul className="list-disc list-inside">
                        {char.customSkills.map(skill => (
                          <li key={skill.id}>{skill.customName}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {char.background && (
                    <div className="mt-2">
                      <p className="font-semibold">背景:</p>
                      <p className="text-sm">{char.background}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* キャラクターシートエディタ画面 */}
      {gameState === 'setup' && isEditingSheet && (
        <div className="p-4">
          <CharacterSheetEditor />
          <button
            className="mt-4 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
            onClick={() => setIsEditingSheet(false)}
          >
            戻る
          </button>
        </div>
      )}

      {/* チーム編成画面 */}
      {gameState === 'teamSelect' && (
        <div className="p-4">
          <TeamComposition
            teamSize={teamSize}
            availableCharacters={characters}
            selectedCharacters={selectedTeam}
            onCharacterSelect={handleTeamSelection}
            onConfirm={() => setGameState('game')}
          />
          <button
            className="mt-4 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
            onClick={() => setGameState('setup')}
          >
            戻る
          </button>
        </div>
      )}

      {/* ゲーム画面 */}
      {gameState === 'game' && (
        <>
          <GameContainer 
            initialTeamSize={teamSize} 
            blueTeam={selectedTeam.blue.filter((char): char is CustomCharacter => char !== null)}
            redTeam={selectedTeam.red.filter((char): char is CustomCharacter => char !== null)}
          />
          <StatusDisplay
            team="ally"
            characters={selectedTeam.blue.filter((char): char is CustomCharacter => char !== null)}
            items={items}
          />
          <StatusDisplay
            team="enemy"
            characters={selectedTeam.red.filter((char): char is CustomCharacter => char !== null)}
            items={items}
          />
        </>
      )}
    </div>
  );
};

export default App;