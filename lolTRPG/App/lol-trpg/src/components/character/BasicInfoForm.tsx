// src/components/character/BasicInfoForm.tsx
import { useState } from 'react';
import { 
  Box, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  FormHelperText,
  Button,
  Typography,
  Card,
  CardContent
} from '@mui/material';
import { CharacterClass, CLASS_STATS } from '../../models/types';

interface BasicInfoFormProps {
  onSubmit: (name: string, characterClass: CharacterClass) => void;
}

const BasicInfoForm = ({ onSubmit }: BasicInfoFormProps) => {
  const [name, setName] = useState('');
  const [characterClass, setCharacterClass] = useState<CharacterClass>('マークスマン');
  const [nameError, setNameError] = useState('');

  // 入力検証
  const validateForm = (): boolean => {
    if (!name.trim()) {
      setNameError('キャラクター名を入力してください');
      return false;
    }
    return true;
  };

  // フォーム送信ハンドラ
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(name, characterClass);
    }
  };

  // 選択したクラスの情報を表示
  const selectedClassStats = CLASS_STATS[characterClass];

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        基本情報を入力してください
      </Typography>

      {/* キャラクター名入力 */}
      <TextField
        fullWidth
        label="キャラクター名"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          if (e.target.value.trim()) setNameError('');
        }}
        error={!!nameError}
        helperText={nameError}
        margin="normal"
        variant="outlined"
        required
      />

      {/* クラス選択 */}
      <FormControl fullWidth margin="normal" variant="outlined">
        <InputLabel>クラス</InputLabel>
        <Select
          value={characterClass}
          onChange={(e) => setCharacterClass(e.target.value as CharacterClass)}
          label="クラス"
        >
          <MenuItem disabled>
            <Typography variant="subtitle2">AD系</Typography>
          </MenuItem>
          <MenuItem value="マークスマン">マークスマン</MenuItem>
          <MenuItem value="ファイター">ファイター</MenuItem>
          <MenuItem value="タンク">タンク</MenuItem>
          
          <MenuItem disabled>
            <Typography variant="subtitle2">AP系</Typography>
          </MenuItem>
          <MenuItem value="メイジ">メイジ</MenuItem>
          <MenuItem value="アサシン">アサシン</MenuItem>
          
          <MenuItem disabled>
            <Typography variant="subtitle2">JG系</Typography>
          </MenuItem>
          <MenuItem value="ファームJG">ファームJG</MenuItem>
          <MenuItem value="ガンクJG">ガンクJG</MenuItem>
          
          <MenuItem disabled>
            <Typography variant="subtitle2">SUP系</Typography>
          </MenuItem>
          <MenuItem value="サポート">サポート</MenuItem>
        </Select>
      </FormControl>

      {/* クラス情報表示 */}
      <Card variant="outlined" sx={{ mt: 3, mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {characterClass}のステータス
          </Typography>
          <Typography variant="body1">
            HP: {selectedClassStats.hp}
          </Typography>
          {selectedClassStats.attackDice && (
            <Typography variant="body1">
              攻撃ダイス: {selectedClassStats.attackDice}
            </Typography>
          )}
          {selectedClassStats.avoidDice && (
            <Typography variant="body1">
              回避ダイス: {selectedClassStats.avoidDice}
            </Typography>
          )}
          {characterClass === 'サポート' && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              ※サポートは攻撃・回避判定を行いません
            </Typography>
          )}
        </CardContent>
      </Card>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button 
          type="submit" 
          variant="contained" 
          color="primary" 
          size="large"
        >
          次へ
        </Button>
      </Box>
    </Box>
  );
};

export default BasicInfoForm;