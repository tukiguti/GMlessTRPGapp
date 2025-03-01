// components/battle/phases/AttackPhase.tsx
import { useState, useEffect } from 'react';
import { Box, Typography, Button, Grid, Paper } from '@mui/material';
import { Character, Skill, DiceRoll } from '../../../models/types';
import { useGameStore } from '../../../store/gameStore';
import PhaseContainer from '../common/PhaseContainer';
import CharacterDisplay from '../common/CharacterDisplay';
import DiceRollDisplay from '../common/DiceRollDisplay';

interface AttackPhaseProps {
  attacker: Character;
  defender: Character;
  onNext: () => void;
  onDiceRoll: (results: any) => void;
}

const AttackPhase = ({ attacker, defender, onNext, onDiceRoll }: AttackPhaseProps) => {
  const { rollDice } = useGameStore();
  
  // ステート
  const [attackerUseSkill, setAttackerUseSkill] = useState(false);
  const [defenderUseSkill, setDefenderUseSkill] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [showDiceRoll, setShowDiceRoll] = useState(false);
  const [attackRoll, setAttackRoll] = useState<DiceRoll | null>(null);
  const [defenseRoll, setDefenseRoll] = useState<DiceRoll | null>(null);
  const [showResult, setShowResult] = useState(false);
  
  // スキル選択フェーズか判定フェーズかを管理
  const [phase, setPhase] = useState<'skill_selection' | 'dice_roll'>('skill_selection');
  
  // 効果テキスト
  const [effectText, setEffectText] = useState("");
  
  // 判定ロール処理
  const handleDiceRoll = () => {
    setIsRolling(true);
    setShowDiceRoll(true);
    
    // 攻撃ロール
    const attackDice = attackerUseSkill 
      ? `${attacker.attackDice}+4` // スキル使用時は+4の例
      : attacker.attackDice;
      
    // 防御ロール
    const defenseDice = defenderUseSkill
      ? `${defender.avoidDice}+4` // スキル使用時は+4の例
      : defender.avoidDice;
    
    // 少し遅延してロール結果を表示
    setTimeout(() => {
      const attackResult = rollDice(attackDice);
      setAttackRoll(attackResult);
      
      // 少しだけディフェンスロールを遅延させる
      setTimeout(() => {
        const defenseResult = rollDice(defenseDice);
        setDefenseRoll(defenseResult);
        setIsRolling(false);
        
        // 結果判定
        const success = attackResult.total > defenseResult.total;
        
        if (success) {
          setEffectText(`${attacker.name}の攻撃が成功！${defender.name}に1ダメージ！`);
        } else {
          setEffectText(`${defender.name}は攻撃を回避した！`);
        }
        
        setShowResult(true);
        
        // 結果を親コンポーネントに通知
        onDiceRoll({
          attackerId: attacker.id,
          defenderId: defender.id,
          attackRoll: attackResult,
          defenseRoll: defenseResult,
          success: success
        });
      }, 1000);
    }, 1000);
  };
  
  // スキル選択フェーズから判定フェーズへ
  const proceedToDiceRoll = () => {
    setPhase('dice_roll');
  };
  
  // キャラクターのスキルを表示
  const renderSkills = (character: Character, isAttacker: boolean) => {
    // スキルがない場合
    if (!character.skills || character.skills.length === 0) {
      return <Typography variant="body2">スキルなし</Typography>;
    }
    
    return (
      <Box>
        {character.skills.map((skill: Skill) => (
          <Button
            key={skill.id}
            variant="outlined"
            size="small"
            sx={{ mr: 1, mb: 1 }}
            onClick={() => {
              if (isAttacker) {
                setAttackerUseSkill(true);
              } else {
                setDefenderUseSkill(true);
              }
            }}
            disabled={
              (isAttacker && attackerUseSkill) || 
              (!isAttacker && defenderUseSkill) ||
              phase === 'dice_roll'
            }
          >
            {skill.name} ({skill.type})
          </Button>
        ))}
        {isAttacker && attackerUseSkill && (
          <Typography variant="body2" color="primary">
            スキル使用！
          </Typography>
        )}
        {!isAttacker && defenderUseSkill && (
          <Typography variant="body2" color="primary">
            スキル使用！
          </Typography>
        )}
      </Box>
    );
  };
  
  return (
    <PhaseContainer 
      title="戦闘判定" 
      onNext={onNext}
      nextButtonText={phase === 'skill_selection' 
        ? "判定開始" 
        : (showResult ? "次へ進む" : "判定中...")}
      showDivider={false}
    >
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" align="center" sx={{ mb: 2 }}>
          {attacker.name}（{attacker.team}） → {defender.name}（{defender.team}）
        </Typography>
        
        <Grid container spacing={3}>
          {/* アタッカー情報 */}
          <Grid item xs={6}>
            <Paper sx={{ p: 2, bgcolor: 'rgba(33, 150, 243, 0.1)' }}>
              <Typography variant="subtitle1" fontWeight="bold">{attacker.name}</Typography>
              <Typography variant="body2">攻撃: {attacker.attackDice}</Typography>
              <Typography variant="body2">HP: {attacker.hp}/{attacker.maxHp}</Typography>
              
              {phase === 'skill_selection' && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2">スキル:</Typography>
                  {renderSkills(attacker, true)}
                </Box>
              )}
            </Paper>
          </Grid>
          
          {/* ディフェンダー情報 */}
          <Grid item xs={6}>
            <Paper sx={{ p: 2, bgcolor: 'rgba(244, 67, 54, 0.1)' }}>
              <Typography variant="subtitle1" fontWeight="bold">{defender.name}</Typography>
              <Typography variant="body2">回避: {defender.avoidDice}</Typography>
              <Typography variant="body2">HP: {defender.hp}/{defender.maxHp}</Typography>
              
              {phase === 'skill_selection' && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2">スキル:</Typography>
                  {renderSkills(defender, false)}
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
        
        {/* スキル選択フェーズでのボタン */}
        {phase === 'skill_selection' && (
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={proceedToDiceRoll}
            >
              スキル選択完了
            </Button>
          </Box>
        )}
        
        {/* 判定フェーズ */}
        {phase === 'dice_roll' && (
          <Box sx={{ mt: 3 }}>
            {!showDiceRoll && (
              <Box sx={{ textAlign: 'center' }}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={handleDiceRoll}
                  disabled={isRolling}
                >
                  ダイスロール
                </Button>
              </Box>
            )}
            
            {showDiceRoll && attackRoll && defenseRoll && (
              <DiceRollDisplay 
                attackRoll={attackRoll}
                defenseRoll={defenseRoll}
                isSuccess={attackRoll.total > defenseRoll.total}
                showResult={showResult}
              />
            )}
            
            {showResult && (
              <Typography 
                variant="h6" 
                align="center" 
                sx={{ 
                  mt: 2, 
                  color: attackRoll && defenseRoll && attackRoll.total > defenseRoll.total 
                    ? 'success.main' 
                    : 'error.main'
                }}
              >
                {effectText}
              </Typography>
            )}
          </Box>
        )}
      </Box>
    </PhaseContainer>
  );
};

export default AttackPhase;