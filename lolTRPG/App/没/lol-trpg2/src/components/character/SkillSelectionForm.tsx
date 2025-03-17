// src/components/character/SkillSelectionForm.tsx
import { useState } from 'react';
import { 
  Box, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Button,
  Typography,
  Card,
  CardContent,
  Tooltip,
  IconButton
} from '@mui/material';
// アイコンをインポートできない場合は、代わりにInfoアイコンを使用
import InfoIcon from '@mui/icons-material/Info';
import { CharacterClass, SkillType, SKILL_DESCRIPTIONS } from '../../models/types';

interface SkillSelectionFormProps {
  onSubmit: (skillName: string, skillType: SkillType) => void;
  // characterClassを使用しない場合は削除することもできます
  characterClass?: CharacterClass;
}

const SkillSelectionForm = ({ onSubmit }: SkillSelectionFormProps) => {
  const [skillName, setSkillName] = useState('');
  const [skillType, setSkillType] = useState<SkillType>('絶対成功');
  const [nameError, setNameError] = useState('');

  // 入力検証
  const validateForm = (): boolean => {
    if (!skillName.trim()) {
      setNameError('スキル名を入力してください');
      return false;
    }
    return true;
  };

  // フォーム送信ハンドラ
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(skillName, skillType);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        スキルを選択してください
      </Typography>

      {/* スキル名入力 */}
      <TextField
        fullWidth
        label="スキル名"
        value={skillName}
        onChange={(e) => {
          setSkillName(e.target.value);
          if (e.target.value.trim()) setNameError('');
        }}
        error={!!nameError}
        helperText={nameError}
        margin="normal"
        variant="outlined"
        required
      />

      {/* スキルタイプ選択 */}
      <FormControl fullWidth margin="normal" variant="outlined">
        <InputLabel>スキルタイプ</InputLabel>
        <Select
          value={skillType}
          onChange={(e) => setSkillType(e.target.value as SkillType)}
          label="スキルタイプ"
        >
          <MenuItem value="絶対成功">絶対成功</MenuItem>
          <MenuItem value="範囲攻撃">範囲攻撃</MenuItem>
          <MenuItem value="妨害">妨害</MenuItem>
          <MenuItem value="固定値増加">固定値増加</MenuItem>
          <MenuItem value="ダイス個数増加">ダイス個数増加</MenuItem>
        </Select>
      </FormControl>

      {/* スキル情報表示 */}
      <Card variant="outlined" sx={{ mt: 3, mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h6" gutterBottom>
              {skillType}
            </Typography>
            <Tooltip title={SKILL_DESCRIPTIONS[skillType]} arrow>
              <IconButton size="small" sx={{ ml: 1 }}>
                <InfoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          <Typography variant="body2" color="text.secondary">
            {SKILL_DESCRIPTIONS[skillType]}
          </Typography>
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

export default SkillSelectionForm;