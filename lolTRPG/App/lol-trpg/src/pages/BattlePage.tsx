// pages/BattlePage.tsx
import { useState, useEffect, useCallback } from 'react';
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
  Snackbar,
  Alert
} from '@mui/material';
import { useGameStore } from '../store/gameStore';
import { ActionType, Character, SupportActionType } from '../models/types';
import PageLayout from '../components/ui/PageLayout';
import CharacterTeamPanel from '../components/battle/CharacterTeamPanel';
import ActionPhaseContainer from '../components/battle/ActionPhaseContainer';

// 戦闘結果の型定義
interface BattleResult {
  attackerId?: string;
  defenderId?: string;
  attackRoll?: any;
  defenseRoll?: any;
  success?: boolean;
}

// アクションフェーズを表す型
type ActionPhase =
  | 'ACTION_SELECTION' // 行動選択フェーズ
  | 'INTRO'      // フェーズ導入
  | 'RETREAT'    // リコール処理
  | 'FARMING'    // ファーム処理
  | 'SUPPORT'    // サポート処理
  | 'ATTACK'     // アタック処理
  | 'ITEM_SHOP'  // アイテム購入
  | 'SUMMARY';   // 結果サマリー

const BattlePage = () => {
  const navigate = useNavigate();

  // ゲームストアから必要な情報を取得
  const {
    phase,
    round,
    blueTeamCharacters,
    redTeamCharacters,
    blueTeamTowers,
    redTeamTowers,
    currentActions,
    setCharacterAction,
    setActionTarget,
    executeTurn,
    advancePhase,
    initializeGame,
    resetGame
  } = useGameStore();

  // 現在のアクションフェーズ - 初期値を ACTION_SELECTION に設定
  const [actionPhase, setActionPhase] = useState<ActionPhase>('ACTION_SELECTION');

  // アタック対象のキャラクターのインデックス
  const [currentAttackIndex, setCurrentAttackIndex] = useState(0);

  // ダイスロール結果
  const [diceResults, setDiceResults] = useState<BattleResult[]>([]);

  // アクション選択ダイアログ
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);

  // サポートアクション選択ダイアログ
  const [supportDialogOpen, setSupportDialogOpen] = useState(false);

  // ターゲット選択ダイアログ
  const [targetDialogOpen, setTargetDialogOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<ActionType | null>(null);
  const [selectedSupportType, setSelectedSupportType] = useState<SupportActionType | null>(null);

  // エラーメッセージ
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);

  // 初期化処理
  useEffect(() => {
    // ゲームの状態を初期化
    initializeGame();
  }, [initializeGame]);

  // 次のフェーズに進む
  const handleNextPhase = useCallback(() => {
    console.log('handleNextPhase - 現在のフェーズ:', actionPhase);
    console.log('handleNextPhase - 現在のアクション:', useGameStore.getState().currentActions);
  
    switch (actionPhase) {
      case 'ACTION_SELECTION':
        // 行動選択が完了したら、イントロフェーズへ
        console.log('ACTION_SELECTION → INTRO');
        setActionPhase('INTRO');
        break;
      case 'INTRO':
        // アクション選択が完了したら、まずリコール処理へ
        console.log('INTRO → RETREAT (executeTurn実行前)');
        executeTurn(); // ターン実行
        console.log('executeTurn実行後のアクション:', useGameStore.getState().currentActions);
        setActionPhase('RETREAT');
        break;
      case 'RETREAT':
        setActionPhase('FARMING');
        break;
      case 'FARMING':
        setActionPhase('SUPPORT');
        break;
      case 'SUPPORT':
        setActionPhase('ATTACK');
        setCurrentAttackIndex(0);
        break;
      case 'ATTACK':
        // アタッカーのリストを取得
        const attackers = getOrderedAttackers();
        // すべてのアタックが終了したらアイテムショップへ
        if (currentAttackIndex >= attackers.length - 1) {
          setActionPhase('ITEM_SHOP');
        } else {
          setCurrentAttackIndex(currentAttackIndex + 1);
        }
        break;
      case 'ITEM_SHOP':
        setActionPhase('SUMMARY');
        break;
      case 'SUMMARY':
        // 結果表示後、次のラウンドへ
        advancePhase();
        // 次のラウンドは行動選択から始める
        setActionPhase('ACTION_SELECTION');
        // ダイス結果をリセット
        setDiceResults([]);
        break;
    }
  }, [actionPhase, currentAttackIndex, executeTurn, advancePhase]);

  // 攻撃順序に基づいたキャラクターリスト
  const getOrderedAttackers = useCallback((): Character[] => {
    const attackOrder = [
      { team: 'BLUE', role: 'TOP' },
      { team: 'BLUE', role: 'JG' },
      { team: 'BLUE', role: 'MID' },
      { team: 'BLUE', role: 'ADC' },
      { team: 'RED', role: 'TOP' },
      { team: 'RED', role: 'JG' },
      { team: 'RED', role: 'MID' },
      { team: 'RED', role: 'ADC' }
    ];

    return attackOrder
      // pages/BattlePage.tsx (続き)
      .map(({ team, role }) =>
        [...blueTeamCharacters, ...redTeamCharacters].find(
          c => c.team === team && c.role === role &&
            currentActions[c.id]?.actionType === 'アタック'
        )
      )
      .filter((character): character is Character => character !== undefined);
  }, [blueTeamCharacters, redTeamCharacters, currentActions]);

  // キャラクターのアクションを選択
  const handleSelectCharacterForAction = useCallback((character: Character) => {
    setSelectedCharacter(character);

    // SUPクラスのみサポートまたはリコールが選択可能
    if (character.class === 'サポート') {
      setActionDialogOpen(true);
    } else {
      // それ以外のクラスは通常のアクション選択ダイアログを表示
      setActionDialogOpen(true);
    }
  }, []);

  // アクションをキャンセル/やり直し
  const handleCancelAction = useCallback((character: Character) => {
    // アクションをリセット
    const action = currentActions[character.id];
    if (action) {
      // ゲームストアからアクションを削除
      setCharacterAction(character.id, undefined as any);
    }
  }, [currentActions, setCharacterAction]);

  // アクションを選択
  const handleSelectAction = useCallback((action: ActionType) => {
    if (!selectedCharacter) return;

    // SUPクラスの場合、サポートアクションの特殊処理
    if (selectedCharacter.class === 'サポート' && action === 'サポート') {
      setActionDialogOpen(false);
      setSupportDialogOpen(true);
      return;
    }

    // アクションが選択できるか確認（サポートクラスの制限）
    if (selectedCharacter.class === 'サポート' &&
      action !== 'サポート' && action !== 'リコール') {
      setErrorMessage("サポートクラスはサポートまたはリコールのみ選択できます");
      setShowError(true);
      setActionDialogOpen(false);
      return;
    }

    setCharacterAction(selectedCharacter.id, action);
    setActionDialogOpen(false);

    // アタックアクションの場合はターゲット選択
    if (action === 'アタック') {
      setSelectedAction(action);
      setTargetDialogOpen(true);
    }
  }, [selectedCharacter, setCharacterAction]);

  // サポートタイプを選択
  const handleSelectSupportType = useCallback((supportType: SupportActionType) => {
    if (!selectedCharacter) return;

    setCharacterAction(selectedCharacter.id, 'サポート');
    setSupportDialogOpen(false);

    // サポートタイプに応じたターゲット選択
    setSelectedAction('サポート');
    setSelectedSupportType(supportType);
    setTargetDialogOpen(true);
  }, [selectedCharacter, setCharacterAction]);

  // ターゲットを選択
  const handleSelectTarget = useCallback((targetId: string) => {
    if (!selectedCharacter) return;

    // サポートタイプの場合、サポートタイプも設定
    if (selectedAction === 'サポート' && selectedSupportType) {
      // サポートタイプを設定する処理（gameStoreにメソッドを追加する必要あり）
      const gameStore = useGameStore.getState();
      if ('setSupportAction' in gameStore) {
        (gameStore as any).setSupportAction(
          selectedCharacter.id,
          selectedSupportType,
          targetId
        );
      } else {
        // 互換性のためフォールバック
        setActionTarget(selectedCharacter.id, targetId);
      }
    } else {
      setActionTarget(selectedCharacter.id, targetId);
    }

    setTargetDialogOpen(false);
    setSelectedCharacter(null);
    setSelectedAction(null);
    setSelectedSupportType(null);
  }, [selectedCharacter, selectedAction, selectedSupportType, setActionTarget]);

  // 選択可能なターゲットを取得 (レーン戦フェーズのルールを適用)
  const getPossibleTargets = useCallback((): Character[] => {
    if (!selectedCharacter || !selectedAction) return [];

    // アタックアクションの場合
    if (selectedAction === 'アタック') {
      // 敵チームのキャラクターを取得
      const enemyTeam = selectedCharacter.team === 'BLUE' ? redTeamCharacters : blueTeamCharacters;

      // レーン戦フェーズの特殊ルール
      if (phase === 'LANE_BATTLE') {
        switch (selectedCharacter.role) {
          case 'TOP':
            // TOPはTOPのみをアタック可能
            return enemyTeam.filter(c => c.role === 'TOP');
          case 'JG':
            // JGはTOP, JG, MID, ADCをアタック可能
            return enemyTeam.filter(c => c.role !== 'SUP');
          case 'MID':
            // MIDはMIDのみをアタック可能
            return enemyTeam.filter(c => c.role === 'MID');
          case 'ADC':
            // ADCはADCのみをアタック可能
            return enemyTeam.filter(c => c.role === 'ADC');
          default:
            return [];
        }
      } else {
        // チーム戦フェーズではすべての敵がターゲット可能
        return enemyTeam;
      }
    }
    // サポートアクションの場合
    else if (selectedAction === 'サポート' && selectedSupportType) {
      const teamCharacters = selectedCharacter.team === 'BLUE' ? blueTeamCharacters : redTeamCharacters;
      const enemyTeam = selectedCharacter.team === 'BLUE' ? redTeamCharacters : blueTeamCharacters;

      switch (selectedSupportType) {
        case 'エンチャント':
        case 'タンク':
          // 味方のみ対象（自分以外）
          return teamCharacters.filter(c => c.id !== selectedCharacter.id);
        case 'フック':
          // 敵のみ対象
          return enemyTeam;
        default:
          return [];
      }
    }

    return [];
  }, [selectedCharacter, selectedAction, selectedSupportType, phase, blueTeamCharacters, redTeamCharacters]);

  // 中央コンテンツを取得
  const getCenterContent = useCallback(() => {
    if (actionPhase === 'ACTION_SELECTION') {
      return (
        <Box sx={{ textAlign: 'center', p: 2 }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleNextPhase}
            disabled={
              [...blueTeamCharacters, ...redTeamCharacters].some(
                character => !currentActions[character.id]
              )
            }
            sx={{ px: 4, py: 1.5 }}
          >
            判定開始
          </Button>
        </Box>
      );
    } else {
      return (
        <ActionPhaseContainer
          actionPhase={actionPhase}
          onNextPhase={handleNextPhase}
          onDiceRoll={(results) => {
            setDiceResults([...diceResults, results]);
          }}
          diceResults={diceResults}
          currentAttackIndex={currentAttackIndex}
        />
      );
    }
  }, [
    actionPhase,
    handleNextPhase,
    blueTeamCharacters,
    redTeamCharacters,
    currentActions,
    diceResults,
    currentAttackIndex
  ]);

  // バトルビューをレンダリング
  const renderBattleView = () => {
    return (
      <Box sx={{ width: '100%', p: 2 }}>
        <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
          <Typography variant="h5" align="center" gutterBottom>
            {phase === 'LANE_BATTLE' ? 'レーン戦フェーズ' : 'チーム戦フェーズ'} ラウンド：{round}
          </Typography>

          <Grid container spacing={2}>
            {/* BLUE TEAM - 左側 */}
            <Grid item xs={12} md={5}>
              <CharacterTeamPanel
                teamName="BLUE TEAM"
                towers={blueTeamTowers}
                characters={blueTeamCharacters}
                teamColor="primary"
                showActionButtons={actionPhase === 'ACTION_SELECTION'}
                onSelectActionForCharacter={handleSelectCharacterForAction}
                onCancelAction={handleCancelAction}
              />
            </Grid>

            {/* 中央コンテンツ */}
            <Grid item xs={12} md={2} sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              {getCenterContent()}
            </Grid>

            {/* RED TEAM - 右側 */}
            <Grid item xs={12} md={5}>
              <CharacterTeamPanel
                teamName="RED TEAM"
                towers={redTeamTowers}
                characters={redTeamCharacters}
                teamColor="error"
                showActionButtons={actionPhase === 'ACTION_SELECTION'}
                onSelectActionForCharacter={handleSelectCharacterForAction}
                onCancelAction={handleCancelAction}
              />
            </Grid>
          </Grid>

          {/* 下部コントロールボタン */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, gap: 2 }}>
            <Button
              variant="outlined"
              color="inherit"
              onClick={() => navigate('/team-formation')}
            >
              チーム編成に戻る
            </Button>

            <Button
              variant="outlined"
              color="warning"
              onClick={resetGame}
            >
              リセット
            </Button>
          </Box>
        </Paper>
      </Box>
    );
  };

  // 指定されたキャラクターに対して使用可能なアクションを取得
  const getAvailableActions = useCallback((character: Character): ActionType[] => {
    if (character.class === 'サポート') {
      return ['サポート', 'リコール'];
    }

    return ['ファーム', 'アタック', 'リコール'];
  }, []);

  return (
    <PageLayout maxContentWidth="1400px">
      {renderBattleView()}

      {/* アクション選択ダイアログ */}
      <Dialog
        open={actionDialogOpen}
        onClose={() => setActionDialogOpen(false)}
      >
        <DialogTitle>
          アクションを選択 - {selectedCharacter?.name}
        </DialogTitle>
        <DialogContent>
          <List>
            {selectedCharacter && getAvailableActions(selectedCharacter).map((action) => (
              <ListItem
                key={action}
                sx={{ cursor: 'pointer' }}
              >
                <ListItemText
                  primary={action}
                  secondary={
                    action === 'ファーム' ? 'FPを獲得する (+5 FP)' :
                      action === 'アタック' ? '敵キャラクターを攻撃する' :
                        action === 'リコール' ? 'アイテムショップを利用可能にする' :
                          action === 'サポート' ? '味方キャラクターを支援する' : ''
                  }
                  onClick={() => handleSelectAction(action)}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialogOpen(false)}>キャンセル</Button>
        </DialogActions>
      </Dialog>

      {/* サポートタイプ選択ダイアログ */}
      <Dialog
        open={supportDialogOpen}
        onClose={() => setSupportDialogOpen(false)}
      >
        <DialogTitle>
          サポートタイプを選択
        </DialogTitle>
        <DialogContent>
          <List>
            <ListItem sx={{ cursor: 'pointer' }}>
              <ListItemText
                primary="エンチャント"
                secondary="味方キャラクターにバフを付与する"
                onClick={() => handleSelectSupportType('エンチャント')}
              />
            </ListItem>
            <ListItem sx={{ cursor: 'pointer' }}>
              <ListItemText
                primary="フック"
                secondary="敵キャラクターにデバフを付与する"
                onClick={() => handleSelectSupportType('フック')}
              />
            </ListItem>
            <ListItem sx={{ cursor: 'pointer' }}>
              <ListItemText
                primary="タンク"
                secondary="味方キャラクターへの攻撃を肩代わりする"
                onClick={() => handleSelectSupportType('タンク')}
              />
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSupportDialogOpen(false)}>キャンセル</Button>
        </DialogActions>
      </Dialog>

      {/* ターゲット選択ダイアログ */}
      <Dialog
        open={targetDialogOpen}
        onClose={() => setTargetDialogOpen(false)}
      >
        <DialogTitle>
          対象を選択 - {
            selectedAction === 'アタック' ? '攻撃' :
              selectedAction === 'サポート' && selectedSupportType === 'エンチャント' ? 'バフ付与' :
                selectedAction === 'サポート' && selectedSupportType === 'フック' ? 'デバフ付与' :
                  selectedAction === 'サポート' && selectedSupportType === 'タンク' ? 'タンク' : ''
          }
        </DialogTitle>
        <DialogContent>
          <List>
            {getPossibleTargets().length > 0 ? (
              getPossibleTargets().map(target => (
                <ListItem
                  key={target.id}
                  sx={{ cursor: 'pointer' }}
                >
                  <ListItemText
                    primary={target.name}
                    secondary={`${target.role} (HP: ${target.hp}/${target.maxHp})`}
                    onClick={() => handleSelectTarget(target.id)}
                  />
                </ListItem>
              ))
            ) : (
              <ListItem>
                <ListItemText
                  primary="選択可能な対象がありません"
                  secondary="選択できる対象がいません。別のアクションを選択してください。"
                />
              </ListItem>
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTargetDialogOpen(false)}>キャンセル</Button>
        </DialogActions>
      </Dialog>

      {/* エラー表示 */}
      <Snackbar
        open={showError}
        autoHideDuration={6000}
        onClose={() => setShowError(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setShowError(false)}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </PageLayout>
  );
};

export default BattlePage;