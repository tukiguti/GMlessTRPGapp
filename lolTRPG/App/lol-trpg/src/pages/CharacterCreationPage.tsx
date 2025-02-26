// src/pages/CharacterCreationPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Paper, Stepper, Step, StepLabel, Button, Typography } from '@mui/material';
import BasicInfoForm from '../components/character/BasicInfoForm';
import SkillSelectionForm from '../components/character/SkillSelectionForm';
import CharacterPreview from '../components/character/CharacterPreview';
import { Character, CharacterClass, Skill, createNewCharacter, createNewSkill } from '../models/types';
import { useCharacterStore } from '../store/characterStore';

const steps = ['基本情報', 'スキル選択', '確認と保存'];

const CharacterCreationPage = () => {
  const navigate = useNavigate();
  const addCharacter = useCharacterStore(state => state.addCharacter);
  
  const [activeStep, setActiveStep] = useState(0);
  const [character, setCharacter] = useState<Character | null>(null);
  const [skillName, setSkillName] = useState('');
  const [skillType, setSkillType] = useState<Skill['type'] | ''>('');

  // 基本情報フォームの送信ハンドラ
  const handleBasicInfoSubmit = (name: string, characterClass: CharacterClass) => {
    const newCharacter = createNewCharacter(name, characterClass);
    setCharacter(newCharacter);
    setActiveStep(1);
  };

  // スキル選択フォームの送信ハンドラ
  const handleSkillSubmit = (name: string, type: Skill['type']) => {
    if (!character) return;
    
    const newSkill = createNewSkill(name, type);
    const updatedCharacter = {
      ...character,
      skills: [newSkill]
    };
    
    setCharacter(updatedCharacter);
    setActiveStep(2);
  };

  // キャラクター保存ハンドラ
  const handleSaveCharacter = () => {
    if (!character) return;
    
    // キャラクターをストアに保存
    addCharacter(character);
    
    // シングルプレイヤー画面に戻る
    navigate('/single-player');
  };

  // 前のステップに戻る
  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  // キャラクター作成をキャンセルして戻る
  const handleCancel = () => {
    navigate('/single-player');
  };

  // ステップの内容をレンダリング
  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return <BasicInfoForm onSubmit={handleBasicInfoSubmit} />;
      case 1:
        return (
          <SkillSelectionForm 
            onSubmit={handleSkillSubmit}
            characterClass={character?.class || 'マークスマン'}
          />
        );
      case 2:
        return (
          <Box sx={{ mt: 2 }}>
            {character && <CharacterPreview character={character} />}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSaveCharacter}
                sx={{ minWidth: 200 }}
              >
                保存する
              </Button>
            </Box>
          </Box>
        );
      default:
        return '不明なステップ';
    }
  };

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Paper elevation={3} sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
        <Typography variant="h4" align="center" gutterBottom>
          キャラクター作成
        </Typography>
        
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {getStepContent(activeStep)}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button 
            variant="outlined" 
            color="inherit" 
            onClick={activeStep === 0 ? handleCancel : handleBack}
          >
            {activeStep === 0 ? 'キャンセル' : '戻る'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default CharacterCreationPage;