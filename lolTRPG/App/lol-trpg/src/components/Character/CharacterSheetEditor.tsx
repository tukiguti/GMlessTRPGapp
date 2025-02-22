// src/components/Character/CharacterSheetEditor.tsx

import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    TextField,
    Typography,
    Alert,
} from '@mui/material';
import { CustomCharacter, CHARACTER_BASE_STATS } from '../../types';

// デフォルトのキャラクターシートテンプレート
const defaultCharacterSheet = {
    "characters": [
        {
            "id": "example_char_1",
            "name": "ゼラス",
            "type": "AP",
            "class": "Mage",
            "customSkills": [
                {
                    "id": "skill_1",
                    "originalType": "AOE",
                    "customName": "ゼラスウルト",
                    "customDescription": "範囲攻撃スキル",
                    "usageCount": 0
                }
            ],
            "background": "帝国の魔法研究所から抜け出した研究者",
            "appearance": "青いローブを纏った痩せ型の人物"
        }
    ]
};

interface CharacterSheetData {
    characters: Partial<CustomCharacter>[];
}

export const CharacterSheetEditor: React.FC = () => {
    const [jsonContent, setJsonContent] = useState('');

    useEffect(() => {
        setJsonContent(JSON.stringify(defaultCharacterSheet, null, 2));
    }, []);

    const validateAndNormalizeCharacter = (character: Partial<CustomCharacter>) => {
        if (!character.type || !character.class) {
            throw new Error('キャラクタータイプとクラスは必須です');
        }

        // クラスとタイプの組み合わせをチェック
        const isValidCombination = 
            (character.type === 'AD' && ['Marksman', 'Fighter', 'Tank'].includes(character.class)) ||
            (character.type === 'AP' && ['Mage', 'Assassin'].includes(character.class));

        if (!isValidCombination) {
            throw new Error('無効なクラスとタイプの組み合わせです');
        }

        // ステータス関連のプロパティは編集不可にするため、ここでは含めない
        const normalizedCharacter = {
            id: character.id || `char_${Date.now()}`,
            name: character.name || 'Unknown Character',
            type: character.type,
            class: character.class,
            customSkills: character.customSkills || [],
            background: character.background || '',
            appearance: character.appearance || ''
        };

        return normalizedCharacter;
    };

    const handleJsonChange = (newContent: string) => {
        setJsonContent(newContent);
    };

    const handleSave = () => {
        try {
            const parsed = JSON.parse(jsonContent);
            
            // キャラクターの検証と正規化
            if (!Array.isArray(parsed.characters)) {
                throw new Error('charactersは配列である必要があります');
            }

            const normalizedCharacters = parsed.characters.map(validateAndNormalizeCharacter);
            const normalizedData = {
                characters: normalizedCharacters
            };

            const blob = new Blob([JSON.stringify(normalizedData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'character-sheet.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (e) {
            alert(e instanceof Error ? e.message : 'JSONの形式が正しくありません');
        }
    };

    const handleLoad = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const content = e.target?.result as string;
                    const parsed = JSON.parse(content);
                    parsed.characters.forEach(validateAndNormalizeCharacter);
                    setJsonContent(JSON.stringify(parsed, null, 2));
                } catch (e) {
                    alert(e instanceof Error ? e.message : 'ファイルの読み込みに失敗しました');
                }
            };
            reader.readAsText(file);
        }
    };

    return (
        <Card>
            <CardContent>
                <Typography variant="h5" gutterBottom>
                    キャラクターシート エディタ
                </Typography>
                <Alert severity="info" sx={{ mb: 2 }}>
                    編集可能な項目:
                    <ul>
                        <li>• キャラクター名</li>
                        <li>• タイプ (AD/AP)</li>
                        <li>• クラス (タイプに応じて選択可能)</li>
                        <li>• カスタムスキル</li>
                        <li>• 背景設定</li>
                        <li>• 外見描写</li>
                    </ul>
                    ステータスはゲーム開始時にクラスに応じて自動的に設定されます。
                </Alert>
                <Box sx={{ mb: 2 }}>
                    <TextField
                        multiline
                        fullWidth
                        rows={20}
                        value={jsonContent}
                        onChange={(e) => handleJsonChange(e.target.value)}
                        variant="outlined"
                        sx={{ 
                            fontFamily: 'monospace',
                            '& .MuiInputBase-input': {
                                fontFamily: 'monospace'
                            }
                        }}
                    />
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleSave}
                        disabled={!jsonContent}
                    >
                        JSONファイルとして保存
                    </Button>
                    <Button
                        variant="outlined"
                        component="label"
                    >
                        JSONファイルを読み込む
                        <input
                            type="file"
                            hidden
                            accept=".json"
                            onChange={handleLoad}
                        />
                    </Button>
                </Box>
            </CardContent>
        </Card>
    );
};