import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { CustomCharacter, CharacterType, CharacterClass, CustomSkill, SkillType } from '../types/character';
import { Button, TextField, Select, MenuItem } from '@mui/material';

// 固定のスキル効果リスト
const PRESET_SKILLS: SkillType[] = ['絶対成功', '範囲攻撃', '妨害'];

// AD / AP による選択可能なクラスの制限
const CLASS_OPTIONS: Record<CharacterType, CharacterClass[]> = {
  AD: ['Marksman', 'Fighter', 'Tank'],
  AP: ['Mage', 'Assassin'],
};

// ✅ クラスごとの攻撃・回避・HPの初期値
const CLASS_STATS: Record<CharacterClass, { attack: string; dodge: string; hp: number }> = {
  Marksman: { attack: '3D6', dodge: '1D6', hp: 2 },
  Fighter: { attack: '1D6+4', dodge: '1D6+4', hp: 4 },
  Tank: { attack: '1D6', dodge: '1D6', hp: 5 },
  Mage: { attack: '2D6', dodge: '1D6+4', hp: 3 },
  Assassin: { attack: '2D3+3', dodge: '2D6+3', hp: 2 },
};

const CharacterCreator: React.FC = () => {
  const { addCharacter, loadCharactersFromJson } = useGameStore();
  const [character, setCharacter] = useState<Partial<CustomCharacter>>({
    name: '',
    type: 'AD',
    class: 'Marksman',
  });

  const [skillName, setSkillName] = useState('');
  const [selectedSkillType, setSelectedSkillType] = useState<SkillType>('絶対成功');

  // ✅ キャラクター保存処理
  const handleSave = () => {
    if (!character.name || !character.type || !character.class) return;

    // ✅ クラスに応じたステータスを取得
    const stats = CLASS_STATS[character.class];

    // ✅ 入力されたスキルを直接適用
    const skills: CustomSkill[] = skillName
      ? [{ id: `skill_${Date.now()}`, name: skillName, type: selectedSkillType }]
      : [];

    addCharacter({
      ...character,
      id: `char_${Date.now()}`,
      skills,
      attack: stats.attack,
      dodge: stats.dodge,
      hp: stats.hp,
    } as CustomCharacter);

    // 入力欄をリセット
    setCharacter({ name: '', type: 'AD', class: 'Marksman' });
    setSkillName('');
  };

  // ✅ JSONファイルの読み込み処理
  const handleLoadJson = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const content = e.target?.result as string;
            const parsedData = JSON.parse(content);

            // JSONの形式チェック
            if (!parsedData || !parsedData.name || !parsedData.type || !parsedData.class) {
              alert(`無効なキャラクターデータ: ${file.name}`);
              return;
            }

            // ✅ キャラクターをJSONから読み込む際にもステータスを適用
            const stats = CLASS_STATS[parsedData.class as CharacterClass];

            loadCharactersFromJson({
              characters: [
                {
                  ...parsedData,
                  attack: stats.attack,
                  dodge: stats.dodge,
                  hp: stats.hp,
                  skills: parsedData.skills || [],
                },
              ],
            });
          } catch (error) {
            alert(`JSONファイルの読み込みに失敗しました: ${file.name}`);
          }
        };
        reader.readAsText(file);
      });
    }
  };

  return (
    <div>
      <h3>キャラクター作成</h3>
      <TextField label="名前" value={character.name} onChange={(e) => setCharacter({ ...character, name: e.target.value })} fullWidth />

      {/* ✅ AD/AP 選択 */}
      <Select
        value={character.type}
        onChange={(e) => {
          const newType = e.target.value as CharacterType;
          setCharacter({ ...character, type: newType, class: CLASS_OPTIONS[newType][0] });
        }}
        fullWidth
      >
        <MenuItem value="AD">AD</MenuItem>
        <MenuItem value="AP">AP</MenuItem>
      </Select>

      {/* ✅ クラス選択 */}
      <Select
        value={character.class}
        onChange={(e) => setCharacter({ ...character, class: e.target.value as CharacterClass })}
        fullWidth
      >
        {CLASS_OPTIONS[character.type as CharacterType].map((classOption) => (
          <MenuItem key={classOption} value={classOption}>
            {classOption}
          </MenuItem>
        ))}
      </Select>

      {/* ✅ スキル入力欄をそのままスキルとして適用 */}
      <h4>スキル（任意）</h4>
      <TextField label="スキル名" value={skillName} onChange={(e) => setSkillName(e.target.value)} fullWidth />
      <Select value={selectedSkillType} onChange={(e) => setSelectedSkillType(e.target.value as SkillType)} fullWidth>
        {PRESET_SKILLS.map((skill) => (
          <MenuItem key={skill} value={skill}>{skill}</MenuItem>
        ))}
      </Select>

      <Button onClick={handleSave} variant="contained">キャラクターを作成</Button>

      <h4>JSONファイルからキャラクターを登録（複数選択可）</h4>
      <input type="file" accept=".json" multiple onChange={handleLoadJson} />
    </div>
  );
};

export default CharacterCreator;
