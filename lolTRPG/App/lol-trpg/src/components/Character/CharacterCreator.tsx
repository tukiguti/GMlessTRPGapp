// src/components/Character/CharacterCreator.tsx

import React, { useState } from 'react';
import { 
    TextField, 
    Select, 
    MenuItem, 
    Button, 
    Card, 
    CardContent,
    FormControl,
    InputLabel,
    Box
} from '@mui/material';
import { 
    CharacterType, 
    CharacterClass, 
    CustomCharacter,
    CustomSkill, 
    CHARACTER_BASE_STATS 
} from '../../types';

interface CharacterCreatorProps {
    onSave: (character: CustomCharacter) => void;
    onCancel: () => void;
}

type SkillType = 'PERFECT_SUCCESS' | 'FORCE_ONE' | 'AOE' | 'INTERFERENCE';

export const CharacterCreator: React.FC<CharacterCreatorProps> = ({ onSave, onCancel }) => {
    const [character, setCharacter] = useState<Partial<CustomCharacter>>({
        name: '',
        type: 'AD',
        class: 'Marksman',
        customSkills: []
    });

    const [selectedSkillType, setSelectedSkillType] = useState<SkillType>('PERFECT_SUCCESS');
    const [customSkillName, setCustomSkillName] = useState('');
    const [customSkillDescription, setCustomSkillDescription] = useState('');

    const getAvailableClasses = (type: CharacterType): CharacterClass[] => {
        if (type === 'AD') {
            return ['Marksman', 'Fighter', 'Tank'];
        } else {
            return ['Mage', 'Assassin'];
        }
    };

    const handleTypeChange = (newType: CharacterType) => {
        const availableClasses = getAvailableClasses(newType);
        setCharacter(prev => ({
            ...prev,
            type: newType,
            class: availableClasses[0]
        }));
    };

    const handleAddSkill = () => {
        if (!customSkillName || !customSkillDescription) return;

        const newSkill: CustomSkill = {
            id: `skill_${Date.now()}`,
            originalType: selectedSkillType,
            customName: customSkillName,
            customDescription: customSkillDescription,
            usageCount: 0
        };

        setCharacter(prev => ({
            ...prev,
            customSkills: [...(prev.customSkills || []), newSkill]
        }));

        setCustomSkillName('');
        setCustomSkillDescription('');
    };

    const handleSave = () => {
        if (!character.name || !character.type || !character.class) return;

        const baseStats = CHARACTER_BASE_STATS[character.class];
        const newCharacter: CustomCharacter = {
            id: `char_${Date.now()}`,
            name: character.name,
            type: character.type,
            class: character.class,
            customSkills: character.customSkills || [],
            stats: baseStats,
            hp: baseStats.hp,
            maxHp: baseStats.maxHp,
            farmPoints: 0,
            items: [],
            skills: [],
            isDead: false
        };

        onSave(newCharacter);
        
        setCharacter({
            name: '',
            type: 'AD',
            class: 'Marksman',
            customSkills: []
        });
        setCustomSkillName('');
        setCustomSkillDescription('');
    };

    return (
        <Card>
            <CardContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                        label="キャラクター名"
                        value={character.name}
                        onChange={(e) => setCharacter(prev => ({ ...prev, name: e.target.value }))}
                        fullWidth
                    />

                    <FormControl fullWidth>
                        <InputLabel>タイプ</InputLabel>
                        <Select
                            value={character.type}
                            label="タイプ"
                            onChange={(e) => handleTypeChange(e.target.value as CharacterType)}
                        >
                            <MenuItem value="AD">AD</MenuItem>
                            <MenuItem value="AP">AP</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl fullWidth>
                        <InputLabel>クラス</InputLabel>
                        <Select
                            value={character.class}
                            label="クラス"
                            onChange={(e) => setCharacter(prev => ({ 
                                ...prev, 
                                class: e.target.value as CharacterClass 
                            }))}
                        >
                            {getAvailableClasses(character.type as CharacterType).map(classType => (
                                <MenuItem key={classType} value={classType}>
                                    {classType}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 2 }}>
                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel>スキルタイプ</InputLabel>
                            <Select
                                value={selectedSkillType}
                                label="スキルタイプ"
                                onChange={(e) => setSelectedSkillType(e.target.value as SkillType)}
                            >
                                <MenuItem value="PERFECT_SUCCESS">絶対成功</MenuItem>
                                <MenuItem value="FORCE_ONE">ダイス強制1</MenuItem>
                                <MenuItem value="AOE">範囲攻撃</MenuItem>
                                <MenuItem value="INTERFERENCE">妨害</MenuItem>
                            </Select>
                        </FormControl>

                        <TextField
                            label="スキル名"
                            value={customSkillName}
                            onChange={(e) => setCustomSkillName(e.target.value)}
                            fullWidth
                            sx={{ mb: 2 }}
                        />

                        <TextField
                            label="スキル説明"
                            value={customSkillDescription}
                            onChange={(e) => setCustomSkillDescription(e.target.value)}
                            multiline
                            rows={3}
                            fullWidth
                            sx={{ mb: 2 }}
                        />

                        <Button
                            variant="contained"
                            onClick={handleAddSkill}
                            disabled={!customSkillName || !customSkillDescription}
                            fullWidth
                            sx={{ mb: 2 }}
                        >
                            スキルを追加
                        </Button>

                        {character.customSkills && character.customSkills.length > 0 && (
                            <Box sx={{ mb: 2 }}>
                                <h4 className="font-semibold mb-2">追加済みスキル:</h4>
                                <ul className="list-disc list-inside">
                                    {character.customSkills.map(skill => (
                                        <li key={skill.id}>{skill.customName}</li>
                                    ))}
                                </ul>
                            </Box>
                        )}
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                        <Button
                            variant="contained"
                            onClick={handleSave}
                            disabled={!character.name}
                            fullWidth
                        >
                            保存
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={onCancel}
                            fullWidth
                        >
                            キャンセル
                        </Button>
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
};