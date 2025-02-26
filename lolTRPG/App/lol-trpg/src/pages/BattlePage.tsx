// src/pages/BattlePage.tsx
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Button, 
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
  Menu,
  MenuItem,
  Divider,
  Alert,
  Snackbar,
  ListItemButton
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { useGameStore, getAvailableActions, getAvailableTargets } from '../store/gameStore';
import { Character, ActionType, SupportActionType } from '../models/types';
import PageLayout from '../components/ui/PageLayout';

// バトルページコンポーネント
const BattlePage = () => {
  const navigate = useNavigate();
  const { 
    phase, 
    round, 
    blueTeamCharacters, 
    redTeamCharacters,
    blueTeamTowers,
    redTeamTowers,
    currentActions,
    actionTargets,
    turnResults,
    isPlayerTurn,
    initializeGame,
    setCharacterAction,
    setActionTarget,
    setSupportAction,
    executeTurn,
    getOpponentByRole,
    advancePhase,
    resetGame
  } = useGameStore();
  
  // アクションメニューの状態
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  
  // サポートアクションメニューの状態
  const [supportMenuAnchor, setSupportMenuAnchor] = useState<null | HTMLElement>(null);
  const [supportTargetId, setSupportTargetId] = useState<string | null>(null);
  const supportTypeRef = useRef<SupportActionType | null>(null);
  
  // ターゲット選択ダイアログの状態
  const [targetDialogOpen, setTargetDialogOpen] = useState(false);
  const [possibleTargets, setPossibleTargets] = useState<Character[]>([]);
  
  // 結果表示ダイアログの状態
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  
  // エラー表示
  const [errorMessage, setErrorMessage] = useState('');
  const [showError, setShowError] = useState(false);
  
  // 初期化
  useEffect(() => {
    initializeGame();
  }, [initializeGame]);
  
  // アクションメニューを開く
  const handleOpenActionMenu = (event: React.MouseEvent<HTMLElement>, characterId: string) => {
    // すでにアクションが選択されていたら何もしない
    if (currentActions[characterId]) return;
    
    setActionMenuAnchor(event.currentTarget);
    setSelectedCharacterId(characterId);
  };
  
  // アクションメニューを閉じる
  const handleCloseActionMenu = () => {
    setActionMenuAnchor(null);
    setSelectedCharacterId(null);
  };
  
  // サポートサブアクションを直接選択するハンドラ
  const handleSelectSupportSubAction = (supportType: SupportActionType) => {
    if (!selectedCharacterId) return;
    
    // アクションを「サポート」に設定
    setCharacterAction(selectedCharacterId, 'サポート');
    
    // 選択可能なターゲットを設定
    const character = [...blueTeamCharacters, ...redTeamCharacters].find(
      c => c.id === selectedCharacterId
    );
    
    if (character) {
      let targets: Character[] = [];
      
      // サブアクションタイプに応じてターゲットをフィルタリング
      if (supportType === 'エンチャント' || supportType === 'タンク') {
        // 味方のみを対象にする
        targets = [...blueTeamCharacters, ...redTeamCharacters].filter(
          c => c.team === character.team && c.id !== character.id
        );
      } else if (supportType === 'フック') {
        // 敵のみを対象にする
        targets = [...blueTeamCharacters, ...redTeamCharacters].filter(
          c => c.team !== character.team
        );
      }
      
      // サポートタイプを一時的に保存
      setSupportTargetId(null);
      supportTypeRef.current = supportType;
      
      setPossibleTargets(targets);
      setTargetDialogOpen(true);
    }
    
    handleCloseActionMenu();
  };
  
  // アクションを選択
  const handleSelectAction = (action: ActionType) => {
    if (selectedCharacterId) {
      if (action === 'アタック') {
        // 攻撃の場合はターゲット選択が必要
        setCharacterAction(selectedCharacterId, action);
        
        // 選択可能なターゲットを設定
        const character = [...blueTeamCharacters, ...redTeamCharacters].find(
          c => c.id === selectedCharacterId
        );
        
        if (character) {
          // アタック可能なターゲットを取得
          const targets = getAvailableTargets(character, phase, [...blueTeamCharacters, ...redTeamCharacters]);
          setPossibleTargets(targets);
          setTargetDialogOpen(true);
        }
      } else {
        // その他のアクションはそのまま設定
        setCharacterAction(selectedCharacterId, action);
      }
    }
    
    handleCloseActionMenu();
  };
  
  // ターゲットを選択
  const handleSelectTarget = (targetId: string) => {
    if (selectedCharacterId) {
      const action = currentActions[selectedCharacterId];
      
      if (action && action.actionType === 'サポート' && supportTypeRef.current) {
        // サポートアクションの場合、サブアクションと対象を直接設定
        setSupportAction(selectedCharacterId, supportTypeRef.current, targetId);
        setActionTarget(selectedCharacterId, targetId);
        // リファレンスをクリア
        supportTypeRef.current = null;
      } else {
        // 他のアクションはそのままターゲット設定
        setActionTarget(selectedCharacterId, targetId);
      }
    }
    
    setTargetDialogOpen(false);
  };
  
  // ターンを実行
  const handleExecuteTurn = () => {
    // 全キャラクターがアクションを選択しているか確認
    const allActionsSelected = [...blueTeamCharacters, ...redTeamCharacters].every(
      character => currentActions[character.id]
    );
    
    if (allActionsSelected) {
      executeTurn();
      setResultDialogOpen(true);
    } else {
      setErrorMessage('全てのキャラクターのアクションを選択してください');
      setShowError(true);
    }
  };
  
  // 次のラウンドへ
  const handleNextRound = () => {
    setResultDialogOpen(false);
    advancePhase();
  };
  
  // アクションラベルを取得
  const getActionLabel = (characterId: string) => {
    const action = currentActions[characterId];
    if (!action) return 'アクションを選択';
    
    // ターゲットがある場合は表示
    if (action.targetId) {
      const target = [...blueTeamCharacters, ...redTeamCharacters].find(
        c => c.id === action.targetId
      );
      
      if (target) {
        if (action.actionType === 'サポート' && action.supportType) {
          // サポートアクションの場合、サブアクションとターゲットを表示
          return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography variant="body2" fontWeight="bold">
                {action.supportType}
              </Typography>
              <Typography variant="caption" sx={{ 
                color: target.team === 'BLUE' ? 'primary.main' : 'error.main',
                fontWeight: 'bold'
              }}>
                → {target.name}
              </Typography>
            </Box>
          );
        } else {
          // 通常のアクション
          return `${action.actionType} → ${target.name}`;
        }
      }
    }
    
    return action.actionType;
  };
  
  // キャラクターカード
  const renderCharacterCard = (character: Character, isBlueTeam: boolean) => {
    const isActionSelected = !!currentActions[character.id];
    
    // キャラクタークラスに応じて利用可能なアクションを決定
    const availableActions = getAvailableActions(character, phase);
    
    return (
      <Paper
        id={character.id}
        key={character.id}
        variant="outlined"
        sx={{
          p: 2,
          mb: 2,
          backgroundColor: isActionSelected ? (isBlueTeam ? 'rgba(33, 150, 243, 0.1)' : 'rgba(244, 67, 54, 0.1)') : 'white'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body1" fontWeight="bold">
            {character.role}: {character.name}
          </Typography>
          <Typography variant="body2" color={character.hp <= 1 ? 'error' : 'text.primary'}>
            HP: {character.hp}/{character.maxHp}
          </Typography>
        </Box>
        
        <Typography variant="body2" color="text.secondary">
          FP: {character.fp} | {character.class}
        </Typography>
        
        <Typography variant="body2" color="text.secondary">
          攻撃: {character.attackDice} | 回避: {character.avoidDice}
        </Typography>
        
        {character.skills.length > 0 && (
          <Typography variant="body2" color="text.secondary">
            スキル: {character.skills[0].name}
          </Typography>
        )}
        
        <Button
          variant={isActionSelected ? "contained" : "outlined"}
          color={isActionSelected ? (isBlueTeam ? "primary" : "error") : "inherit"}
          size="small"
          fullWidth
          sx={{ 
            mt: 1,
            minHeight: '40px', // ボタンの高さを固定して、内容が増えても安定して表示されるようにする
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}
          disabled={!isPlayerTurn || isActionSelected || availableActions.length === 0}
          onClick={(e) => handleOpenActionMenu(e, character.id)}
        >
          {getActionLabel(character.id)}
        </Button>
      </Paper>
    );
  };
  
  // アクションメニューの内容
  const renderActionMenu = () => {
    if (!selectedCharacterId) return null;
    
    const character = [...blueTeamCharacters, ...redTeamCharacters].find(
      c => c.id === selectedCharacterId
    );
    
    if (!character) return null;
    
    // キャラクターのクラスとフェーズに応じて利用可能なアクションを決定
    const availableActions = getAvailableActions(character, phase);
    
    // サポートのみの場合、サブアクションを直接表示する
    if (character.class === 'サポート' && availableActions.includes('サポート')) {
      return (
        <Menu
          anchorEl={actionMenuAnchor}
          open={Boolean(actionMenuAnchor)}
          onClose={handleCloseActionMenu}
        >
          <MenuItem disabled>
            <Typography variant="subtitle2" fontWeight="bold">サポートアクション</Typography>
          </MenuItem>
          <MenuItem onClick={() => handleSelectSupportSubAction('エンチャント')}>
            エンチャント（味方バフ）
          </MenuItem>
          <MenuItem onClick={() => handleSelectSupportSubAction('フック')}>
            フック（敵デバフ）
          </MenuItem>
          <MenuItem onClick={() => handleSelectSupportSubAction('タンク')}>
            タンク（攻撃肩代わり）
          </MenuItem>
          <Divider />
          {availableActions.filter(a => a !== 'サポート').map(action => (
            <MenuItem key={action} onClick={() => handleSelectAction(action)}>
              {action}
            </MenuItem>
          ))}
        </Menu>
      );
    }
    
    // 通常のアクションメニュー
    return (
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleCloseActionMenu}
      >
        {availableActions.map(action => (
          <MenuItem key={action} onClick={() => handleSelectAction(action)}>
            {action}
          </MenuItem>
        ))}
      </Menu>
    );
  };
  
  return (
    <PageLayout maxContentWidth="1600px" fullWidth>
      <Box sx={{ width: '100%' }}>
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          {/* ヘッダー部分を中央揃えに変更 */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              {phase === 'LANE_BATTLE' ? 'レーン戦フェーズ' : 'チーム戦フェーズ'} - ラウンド {round}
            </Typography>
            
            <Button
              variant="contained"
              color="primary"
              startIcon={<PlayArrowIcon />}
              disabled={!isPlayerTurn}
              onClick={handleExecuteTurn}
              size="large"
              sx={{ mt: 2, px: 4, py: 1 }} // ボタンのサイズを大きくして目立たせる
            >
              判定開始
            </Button>
          </Box>
          
          <Divider sx={{ mb: 3 }} />
          
          <Grid container spacing={3}>
            {/* BLUEチーム */}
            <Grid item xs={12} md={5}>
              <Paper sx={{ p: 3, bgcolor: 'rgba(33, 150, 243, 0.08)', borderRadius: 2, height: '100%' }}>
                <Typography variant="h6" color="primary.dark" gutterBottom>
                  BLUE TEAM (タワー: {blueTeamTowers})
                </Typography>
                
                {blueTeamCharacters.map(character => renderCharacterCard(character, true))}
              </Paper>
            </Grid>
            
            {/* 中央 */}
            <Grid item xs={12} md={2} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<PlayArrowIcon />}
              disabled={!isPlayerTurn}
              onClick={handleExecuteTurn}
              size="large"
              sx={{ mt: 2, px: 4, py: 1 }} // ボタンのサイズを大きくして目立たせる
            >
              判定開始
            </Button>

              <Button
                variant="outlined"
                color="inherit"
                onClick={() => navigate('/team-formation')}
                sx={{ mb: 2, width: '100%' }}
              >
                チーム編成に戻る
              </Button>
              
              <Button
                variant="outlined"
                color="warning"
                onClick={resetGame}
                sx={{ width: '100%' }}
              >
                リセット
              </Button>
            </Grid>
            
            {/* REDチーム */}
            <Grid item xs={12} md={5}>
              <Paper sx={{ p: 3, bgcolor: 'rgba(244, 67, 54, 0.08)', borderRadius: 2, height: '100%' }}>
                <Typography variant="h6" color="error.dark" gutterBottom>
                  RED TEAM (タワー: {redTeamTowers})
                </Typography>
                
                {redTeamCharacters.map(character => renderCharacterCard(character, false))}
              </Paper>
            </Grid>
          </Grid>
        </Paper>
      </Box>
      
      {/* アクションメニュー */}
      {renderActionMenu()}
      
      {/* ターゲット選択ダイアログ */}
      <Dialog
        open={targetDialogOpen}
        onClose={() => setTargetDialogOpen(false)}
      >
        <DialogTitle>対象を選択</DialogTitle>
        <DialogContent>
          <List>
            {possibleTargets.map(target => (
              <ListItem key={target.id}>
                <ListItemButton onClick={() => handleSelectTarget(target.id)}>
                  <ListItemText
                    primary={target.name}
                    secondary={`${target.class} (${target.role}) - HP: ${target.hp}/${target.maxHp}`}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTargetDialogOpen(false)}>キャンセル</Button>
        </DialogActions>
      </Dialog>
      
      {/* 結果表示ダイアログ */}
      <Dialog
        open={resultDialogOpen}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6">ターン結果</Typography>
        </DialogTitle>
        <DialogContent dividers>
          <List>
            {turnResults.map((result, index) => {
              const character = [...blueTeamCharacters, ...redTeamCharacters].find(
                c => c.id === result.characterId
              );
              
              const target = result.targetId
                ? [...blueTeamCharacters, ...redTeamCharacters].find(
                    c => c.id === result.targetId
                  )
                : null;
              
              if (!character) return null;
              
              return (
                <Box key={index} sx={{ mb: 2 }}>
                  <Paper sx={{ p: 2, bgcolor: character.team === 'BLUE' ? 'rgba(33, 150, 243, 0.05)' : 'rgba(244, 67, 54, 0.05)' }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {character.name} ({character.role}) の「{result.action}」
                      {result.supportType ? `（${result.supportType}）` : ''}
                      {target ? ` → ${target.name}` : ''}
                    </Typography>
                    
                    <Box sx={{ mt: 1 }}>
                    {result.rolls.map((roll, i) => (
                      <Typography key={i} variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <Box component="span" sx={{ 
                          width: 60, 
                          display: 'inline-block',
                          color: roll.type === 'attack' ? 'error.main' : roll.type === 'avoid' ? 'info.main' : 'success.main',
                          fontWeight: 'bold'
                        }}>
                          {roll.type === 'attack' ? '攻撃' : roll.type === 'avoid' ? '回避' : 'スキル'}:
                        </Box>
                        <Box component="span" sx={{ mr: 1 }}>
                          {roll.dice}
                        </Box>
                        <Box component="span" sx={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          bgcolor: 'grey.100', 
                          px: 1, 
                          py: 0.5, 
                          borderRadius: 1,
                          mr: 1
                        }}>
                          [{roll.values.join(', ')}]
                        </Box>
                        = <Box component="span" fontWeight="bold" sx={{ ml: 1 }}>{roll.total}</Box>
                        {roll.skillModifier ? (
                          <Box component="span" sx={{ 
                            ml: 1, 
                            color: roll.skillModifier < 0 ? 'error.main' : 'success.main',
                            fontWeight: 'bold' 
                          }}>
                            ({roll.skillModifier > 0 ? '+' : ''}{roll.skillModifier})
                          </Box>
                        ) : null}
                      </Typography>
                    ))}
                      
                      <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {result.success && result.damage && (
                          <Typography variant="body2" sx={{ bgcolor: 'error.light', color: 'error.contrastText', px: 1, py: 0.5, borderRadius: 1 }}>
                            ダメージ: {result.damage}
                          </Typography>
                        )}
                        
                        {result.fpGained && (
                          <Typography variant="body2" sx={{ bgcolor: 'success.light', color: 'success.contrastText', px: 1, py: 0.5, borderRadius: 1 }}>
                            FP獲得: +{result.fpGained}
                          </Typography>
                        )}
                        
                        {/* サポート効果の表示 */}
                        {result.buffAdded && (
                          <Typography variant="body2" sx={{ bgcolor: 'success.light', color: 'success.contrastText', px: 1, py: 0.5, borderRadius: 1 }}>
                            バフ付与: +{result.buffAdded}
                          </Typography>
                        )}
                        
                        {result.debuffAdded && (
                          <Typography variant="body2" sx={{ bgcolor: 'error.light', color: 'error.contrastText', px: 1, py: 0.5, borderRadius: 1 }}>
                            デバフ付与: -{result.debuffAdded}
                          </Typography>
                        )}
                        
                        {result.tankEffect && (
                          <Typography variant="body2" sx={{ bgcolor: 'info.light', color: 'info.contrastText', px: 1, py: 0.5, borderRadius: 1 }}>
                            攻撃肩代わり効果
                          </Typography>
                        )}
                        
                        {/* タワーダメージの表示 */}
                        {result.towerDamage && (
                          <Typography variant="body2" sx={{ bgcolor: 'warning.light', color: 'warning.contrastText', px: 1, py: 0.5, borderRadius: 1 }}>
                            タワーダメージ: {result.towerDamage}
                          </Typography>
                        )}
                        
                        {result.forceRecall && (
                          <Typography variant="body2" sx={{ bgcolor: 'info.light', color: 'info.contrastText', px: 1, py: 0.5, borderRadius: 1 }}>
                            次のラウンドで強制リコール
                          </Typography>
                        )}

                        {result.killedTarget && (
                              <Typography variant="body2" sx={{ 
                                bgcolor: 'purple.light', 
                                color: 'purple.contrastText', 
                                px: 1, 
                                py: 0.5, 
                                borderRadius: 1,
                                fontWeight: 'bold'
                              }}>
                                キル！ (+8 FP)
                              </Typography>
                            )}
                      </Box>
                    </Box>
                  </Paper>
                </Box>
              );
            })}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleNextRound} variant="contained" color="primary">
            次のラウンドへ
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* エラーメッセージ */}
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

export default BattlePage;