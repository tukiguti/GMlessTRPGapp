import React, { useState } from 'react';
import { useCharacterStore } from './store/characterStore';
import {
  CustomCharacter,
  CharacterType,
  CharacterClass,
  SkillType,
  CLASS_OPTIONS,
  CLASS_STATS,
  PRESET_SKILLS,
} from '../types/character';
import { Button, TextField, Select, MenuItem } from '@mui/material';

const CharacterCreator: React.FC = () => {
  const { addCharacter, loadCharactersFromJson } = useCharacterStore();
  const [character, setCharacter] = useState<Partial<CustomCharacter>>({
    name: '',
    type: 'AD',
    class: CLASS_OPTIONS['AD'][0], // ✅ 初期値を `CLASS_OPTIONS` から取得
  });

  const [skillName, setSkillName] = useState('');
  const [selectedSkillType, setSelectedSkillType] = useState<SkillType>(PRESET_SKILLS[0]); // ✅ `PRESET_SKILLS` から取得

  // キャラクターを追加
  const handleSave = () => {
    if (!character.name || !character.type || !character.class) return;

    const stats = CLASS_STATS[character.class]; // ✅ `CLASS_STATS` からステータス取得

    const newCharacter: CustomCharacter = {
      ...character,
      id: `char_${Date.now()}`,
      attack: stats.attack,
      dodge: stats.dodge,
      hp: stats.hp,
      skills: skillName ? [{ id: `skill_${Date.now()}`, name: skillName, type: selectedSkillType }] : [],
    } as CustomCharacter;

    addCharacter(newCharacter);
    setCharacter({ name: '', type: 'AD', class: CLASS_OPTIONS['AD'][0] });
    setSkillName('');
  };

  // JSONファイルからキャラクターをロード
  const handleLoadJson = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const content = e.target?.result as string;
            const parsedData = JSON.parse(content);

            if (!parsedData.name || !parsedData.type || !parsedData.class) {
              alert(`無効なキャラクターデータ: ${file.name}`);
              return;
            }

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
      <TextField
        label="名前"
        value={character.name}
        onChange={(e) => setCharacter((prev) => ({ ...prev, name: e.target.value }))}
        fullWidth
      />

      {/* AD / AP 選択 */}
      <Select
        value={character.type}
        onChange={(e) => {
          const newType = e.target.value as CharacterType;
          setCharacter((prev) => ({ ...prev, type: newType, class: CLASS_OPTIONS[newType][0] }));
        }}
        fullWidth
      >
        <MenuItem value="AD">AD</MenuItem>
        <MenuItem value="AP">AP</MenuItem>
      </Select>

      {/* クラス選択 */}
      <Select
        value={character.class}
        onChange={(e) => setCharacter((prev) => ({ ...prev, class: e.target.value as CharacterClass }))}
        fullWidth
      >
        {CLASS_OPTIONS[character.type as CharacterType].map((classOption) => (
          <MenuItem key={classOption} value={classOption}>
            {classOption}
          </MenuItem>
        ))}
      </Select>

      {/* スキル名とスキル効果を分離 */}
      <h4>スキル（任意）</h4>
      <TextField
        label="スキル名"
        value={skillName}
        onChange={(e) => setSkillName(e.target.value)}
        fullWidth
      />
      <Select value={selectedSkillType} onChange={(e) => setSelectedSkillType(e.target.value as SkillType)} fullWidth>
        {PRESET_SKILLS.map((skill) => (
          <MenuItem key={skill} value={skill}>
            {skill}
          </MenuItem>
        ))}
      </Select>

      <Button onClick={handleSave} variant="contained">
        キャラクターを作成
      </Button>

      <h4>JSONファイルからキャラクターを登録（複数選択可）</h4>
      <input type="file" accept=".json" multiple onChange={handleLoadJson} />
    </div>
  );
};

export default CharacterCreator;
