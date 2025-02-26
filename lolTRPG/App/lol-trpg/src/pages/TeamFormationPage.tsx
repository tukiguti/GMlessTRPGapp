// src/pages/TeamFormationPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Button, 
  Container, 
  Typography, 
  Paper, 
  Grid, 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Divider,
  Alert,
  Snackbar
} from '@mui/material';
import { useCharacterStore } from '../store/characterStore';
import { useTeamStore } from '../store/teamStore';
import { Character, Role } from '../models/types';
import PageLayout from '../components/ui/PageLayout';

// キャラクター選択ダイアログコンポーネント
interface CharacterSelectDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (characterId: string) => void;
  role: Role;
  selectedCharacterIds: string[];
}

const CharacterSelectDialog = ({ 
  open, 
  onClose, 
  onSelect, 
  role, 
  selectedCharacterIds 
}: CharacterSelectDialogProps) => {
  const { characters } = useCharacterStore();
  const { isRoleAllowed } = useTeamStore();
  
  // このロールに配置可能なキャラクターだけをフィルタリング
  const eligibleCharacters = characters.filter(character => 
    isRoleAllowed(character.class, role) && 
    !selectedCharacterIds.includes(character.id)
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {role}ポジションのキャラクターを選択
      </DialogTitle>
      <DialogContent>
        {eligibleCharacters.length > 0 ? (
          <List sx={{ width: '100%' }}>
            {eligibleCharacters.map((character) => (
              <ListItem key={character.id} disablePadding>
                <ListItemButton onClick={() => onSelect(character.id)}>
                  <ListItemText 
                    primary={character.name} 
                    secondary={
                      <>
                        {`${character.class} / HP: ${character.hp} / 攻撃: ${character.attackDice}`}
                        <br />
                        {`スキル: ${character.skills.length > 0 ? `${character.skills[0].name}` : 'なし'}`}
                      </>
                    }
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography color="text.secondary" sx={{ py: 2 }}>
            このポジションに配置可能なキャラクターがありません。
            新しいキャラクターを作成するか、他のキャラクターの配置を解除してください。
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">キャンセル</Button>
      </DialogActions>
    </Dialog>
  );
};

// チーム編成ページコンポーネント
const TeamFormationPage = () => {
  const navigate = useNavigate();
  const { characters } = useCharacterStore();
  const { 
    blueTeam, 
    redTeam, 
    assignCharacter, 
    validateTeams, 
    resetTeams 
  } = useTeamStore();
  
  // ダイアログ状態
  const [selectDialogOpen, setSelectDialogOpen] = useState(false);
  const [currentTeam, setCurrentTeam] = useState<'BLUE' | 'RED'>('BLUE');
  const [currentRole, setCurrentRole] = useState<Role>('TOP');
  
  // エラー表示
  const [errorMessage, setErrorMessage] = useState('');
  const [showError, setShowError] = useState(false);
  
  // 選択されているキャラクターIDのリスト
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<string[]>([]);
  
  // 選択されているキャラクターのIDリストを更新
  useEffect(() => {
    const ids: string[] = [];
    
    blueTeam.members.forEach(member => {
      if (member.characterId) ids.push(member.characterId);
    });
    
    redTeam.members.forEach(member => {
      if (member.characterId) ids.push(member.characterId);
    });
    
    setSelectedCharacterIds(ids);
  }, [blueTeam, redTeam]);
  
  // キャラクター選択ダイアログを開く
  const handleOpenSelectDialog = (team: 'BLUE' | 'RED', role: Role) => {
    setCurrentTeam(team);
    setCurrentRole(role);
    setSelectDialogOpen(true);
  };
  
  // キャラクターを選択
  const handleSelectCharacter = (characterId: string) => {
    assignCharacter(currentTeam, currentRole, characterId);
    setSelectDialogOpen(false);
  };
  
  // キャラクターの配置を解除
  const handleRemoveCharacter = (team: 'BLUE' | 'RED', role: Role) => {
    assignCharacter(team, role, null);
  };
  
  // ゲーム開始
  const handleGameStart = () => {
    const validation = validateTeams();
    if (validation.valid) {
      navigate('/battle');
    } else {
      setErrorMessage(validation.errors.join('\n'));
      setShowError(true);
    }
  };
  
  // キャラクター情報の取得
  const getCharacter = (characterId: string | null): Character | null => {
    if (!characterId) return null;
    return characters.find(c => c.id === characterId) || null;
  };

  return (
    <PageLayout maxContentWidth="1400px">
      <Container maxWidth="lg">
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" align="center" gutterBottom>
            チーム編成
          </Typography>
          
          <Grid container spacing={3}>
            {/* BLUEチーム */}
            <Grid item xs={12} md={5}>
              <Paper 
                elevation={2} 
                sx={{ 
                  p: 3, 
                  bgcolor: 'rgba(33, 150, 243, 0.08)',
                  height: '100%'
                }}
              >
                <Typography variant="h6" color="primary.dark" gutterBottom>
                  BLUE TEAM
                </Typography>
                
                <Box sx={{ mt: 2 }}>
                  {blueTeam.members.map((member) => {
                    const character = getCharacter(member.characterId);
                    
                    return (
                      <Paper 
                        key={member.role} 
                        variant="outlined" 
                        sx={{ p: 2, mb: 2 }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography fontWeight="bold">{member.role}</Typography>
                          
                          {character ? (
                            <Button 
                              size="small" 
                              color="error"
                              onClick={() => handleRemoveCharacter('BLUE', member.role)}
                              variant="outlined"
                            >
                              解除
                            </Button>
                          ) : null}
                        </Box>
                        
                        {character ? (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body1">{character.name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {character.class} / HP: {character.hp}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              攻撃: {character.attackDice} / 回避: {character.avoidDice}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              スキル: {character.skills.length > 0 ? `${character.skills[0].name}` : 'なし'}
                            </Typography>
                          </Box>
                        ) : (
                          <Button 
                            variant="outlined" 
                            size="small" 
                            fullWidth 
                            sx={{ mt: 1 }}
                            onClick={() => handleOpenSelectDialog('BLUE', member.role)}
                          >
                            キャラクターを選択
                          </Button>
                        )}
                      </Paper>
                    );
                  })}
                </Box>
              </Paper>
            </Grid>
            
            {/* 中央 */}
            <Grid item xs={12} md={2} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
              <Button 
                variant="contained" 
                color="success" 
                size="large"
                onClick={handleGameStart}
                sx={{ py: 2, px: 4 }}
              >
                GAME START
              </Button>
              
              <Button 
                variant="outlined" 
                color="warning"
                onClick={resetTeams}
              >
                リセット
              </Button>
            </Grid>
            
            {/* REDチーム */}
            <Grid item xs={12} md={5}>
              <Paper 
                elevation={2} 
                sx={{ 
                  p: 3, 
                  bgcolor: 'rgba(244, 67, 54, 0.08)',
                  height: '100%'
                }}
              >
                <Typography variant="h6" color="error.dark" gutterBottom>
                  RED TEAM
                </Typography>
                
                <Box sx={{ mt: 2 }}>
                  {redTeam.members.map((member) => {
                    const character = getCharacter(member.characterId);
                    
                    return (
                      <Paper 
                        key={member.role} 
                        variant="outlined" 
                        sx={{ p: 2, mb: 2 }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography fontWeight="bold">{member.role}</Typography>
                          
                          {character ? (
                            <Button 
                              size="small" 
                              color="error"
                              onClick={() => handleRemoveCharacter('RED', member.role)}
                              variant="outlined"
                            >
                              解除
                            </Button>
                          ) : null}
                        </Box>
                        
                        {character ? (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body1">{character.name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {character.class} / HP: {character.hp}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              攻撃: {character.attackDice} / 回避: {character.avoidDice}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              スキル: {character.skills.length > 0 ? `${character.skills[0].name}` : 'なし'}
                            </Typography>
                          </Box>
                        ) : (
                          <Button 
                            variant="outlined" 
                            size="small" 
                            fullWidth 
                            sx={{ mt: 1 }}
                            onClick={() => handleOpenSelectDialog('RED', member.role)}
                          >
                            キャラクターを選択
                          </Button>
                        )}
                      </Paper>
                    );
                  })}
                </Box>
              </Paper>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
            <Button 
              variant="outlined" 
              color="inherit" 
              onClick={() => navigate('/single-player')}
            >
              戻る
            </Button>
          </Box>
        </Paper>
      </Container>
      
      {/* キャラクター選択ダイアログ */}
      <CharacterSelectDialog 
        open={selectDialogOpen}
        onClose={() => setSelectDialogOpen(false)}
        onSelect={handleSelectCharacter}
        role={currentRole}
        selectedCharacterIds={selectedCharacterIds}
      />
      
      {/* エラーメッセージスナックバー */}
      <Snackbar
        open={showError}
        autoHideDuration={6000}
        onClose={() => setShowError(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setShowError(false)}
          severity="error"
          sx={{ width: '100%' }}
        >
          {errorMessage}
        </Alert>
      </Snackbar>
    </PageLayout>
  );
};

export default TeamFormationPage;