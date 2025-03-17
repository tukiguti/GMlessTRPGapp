// src/components/battle/CharacterTeamPanel.tsx
import React from 'react';
import { Box, Typography, Paper, Grid, Divider, Button, IconButton } from '@mui/material';
import { Character, ActionType } from '../../models/types';
import { useGameStore } from '../../store/gameStore';
import UndoIcon from '@mui/icons-material/Undo';

interface CharacterTeamPanelProps {
  teamName: string;
  towers: number;
  characters: Character[];
  teamColor: 'primary' | 'error';
  showActionButtons?: boolean;
  onSelectActionForCharacter?: (character: Character) => void;
  onCancelAction?: (character: Character) => void;
}

const CharacterTeamPanel: React.FC<CharacterTeamPanelProps> = ({
  teamName,
  towers,
  characters,
  teamColor,
  showActionButtons = false,
  onSelectActionForCharacter,
  onCancelAction
}) => {
  const { currentActions } = useGameStore();
  
  // アクションのラベルを取得
  const getActionLabel = (character: Character): string => {
    const action = currentActions[character.id];
    if (!action) return '行動を選択';
    
    let label = action.actionType;
    
    // サポートタイプがある場合は表示
    if (action.actionType === 'サポート' && action.supportType) {
      label += ` (${action.supportType})`;
    }
    
    // ターゲットがある場合はアクション名と共に表示
    if (action.targetId) {
      const { blueTeamCharacters, redTeamCharacters } = useGameStore.getState();
      const targetCharacter = [...blueTeamCharacters, ...redTeamCharacters].find(
        c => c.id === action.targetId
      );
      
      if (targetCharacter) {
        label += ` → ${targetCharacter.name}`;
      }
    }
    
    return label;
  };
  
  return (
    <Paper 
      sx={{ 
        p: 2, 
        mb: 2, 
        bgcolor: teamColor === 'primary' ? 'rgba(33, 150, 243, 0.05)' : 'rgba(244, 67, 54, 0.05)',
        height: '100%'
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="h6" color={`${teamColor}.main`}>
          {teamName}
        </Typography>
        <Typography variant="h6" color={`${teamColor}.main`}>
          タワー：{towers}
        </Typography>
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      {characters.map(character => {
        const action = currentActions[character.id];
        
        return (
          <Box key={character.id} sx={{ mb: 2 }}>
            <Grid container alignItems="center">
              <Grid item xs={2}>
                <Typography variant="body1" fontWeight="bold">
                  {character.role}
                </Typography>
              </Grid>
              <Grid item xs={10}>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">
                      HP:{character.hp} FP:{character.fp}
                    </Typography>
                  </Box>
                  <Typography variant="caption" display="block">
                    攻撃:{character.attackDice} 回避:{character.avoidDice}
                  </Typography>
                  {character.items.length > 0 && (
                    <Typography variant="caption" display="block">
                      アイテム:{character.items.map(item => item.name).join(', ')}
                    </Typography>
                  )}
                  
                  {/* アクション選択ボタン */}
                  {showActionButtons && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <Button
                        variant={action ? "contained" : "outlined"}
                        color={teamColor}
                        size="small"
                        fullWidth
                        onClick={() => onSelectActionForCharacter && onSelectActionForCharacter(character)}
                        sx={{ mr: action ? 1 : 0 }}
                      >
                        {getActionLabel(character)}
                      </Button>
                      
                      {/* アクションが選択されている場合、やり直しボタンを表示 */}
                      {action && onCancelAction && (
                        <IconButton
                          size="small"
                          onClick={() => onCancelAction(character)}
                          color={teamColor}
                        >
                          <UndoIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  )}
                  
                  {/* 選択済みアクションの表示（ボタンが表示されていない場合） */}
                  {!showActionButtons && action && (
                    <Typography 
                      variant="caption" 
                      display="block" 
                      fontWeight="bold" 
                      color={`${teamColor}.main`}
                      sx={{ mt: 0.5 }}
                    >
                      {getActionLabel(character)}
                    </Typography>
                  )}
                </Box>
              </Grid>
            </Grid>
            <Divider sx={{ my: 1 }} />
          </Box>
        );
      })}
    </Paper>
  );
};

export default CharacterTeamPanel;