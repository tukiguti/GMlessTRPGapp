// src/pages/CharacterListPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Paper, 
  List, 
  ListItem, 
  ListItemText, 
  IconButton, 
  Button, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogContentText, 
  DialogTitle,
  TextField,
  Stack,
  Divider
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import { useCharacterStore } from '../store/characterStore';
import { Character, CLASS_STATS, CharacterClass } from '../models/types';
import PageLayout from '../components/ui/PageLayout';

const CharacterListPage = () => {
  const navigate = useNavigate();
  const { 
    characters, 
    deleteCharacter, 
    exportCharacterToJson, 
    importCharacterFromJson,
    addCharacter
  } = useCharacterStore();
  
  // ダイアログの状態管理
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [jsonImportText, setJsonImportText] = useState('');
  const [importError, setImportError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // キャラクター削除ダイアログを開く
  const handleOpenDeleteDialog = (characterId: string) => {
    setSelectedCharacterId(characterId);
    setDeleteDialogOpen(true);
  };

  // キャラクター削除を確定
  const handleConfirmDelete = () => {
    if (selectedCharacterId) {
      deleteCharacter(selectedCharacterId);
    }
    setDeleteDialogOpen(false);
    setSelectedCharacterId(null);
  };

  // キャラクター編集画面に移動
  const handleEditCharacter = (characterId: string) => {
    // 今回は編集機能は省略し、詳細表示だけにします
    navigate(`/character/${characterId}`);
  };

  // JSONファイルとしてエクスポート
  const handleExportJson = (characterId: string) => {
    const jsonData = exportCharacterToJson(characterId);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // 一時的なリンクを作成してダウンロードを開始
    const a = document.createElement('a');
    a.href = url;
    a.download = `character_${characterId}.json`;
    document.body.appendChild(a);
    a.click();
    
    // クリーンアップ
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 全キャラクターをエクスポート
  const handleExportAllJson = () => {
    // キャラクターデータからクラスベースのステータスを除去
    const exportData = characters.map(character => ({
      id: character.id,
      name: character.name,
      class: character.class,
      skills: character.skills,
      items: character.items
    }));
    
    const jsonData = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `all_characters_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // JSONインポートダイアログを開く
  const handleOpenImportDialog = () => {
    setImportDialogOpen(true);
    setJsonImportText('');
    setImportError('');
  };

  // JSONデータのインポートを実行
  const handleImportJson = () => {
    if (!jsonImportText.trim()) {
      setImportError('JSONデータを入力してください');
      return;
    }

    try {
      // JSONデータを解析
      const parsedData = JSON.parse(jsonImportText);
      
      // 配列かどうかをチェック
      const charactersToImport = Array.isArray(parsedData) ? parsedData : [parsedData];
      
      // 各キャラクターを処理
      let importCount = 0;
      
      charactersToImport.forEach(charData => {
        // 基本的な検証
        if (!charData.id || !charData.name || !charData.class) {
          throw new Error('無効なキャラクターデータです。必須フィールドが不足しています。');
        }
        
        // クラスに基づいてステータスを設定
        const classStats = CLASS_STATS[charData.class as CharacterClass];
        if (!classStats) {
          throw new Error(`無効なクラス: ${charData.class}`);
        }
        
        // 完全なキャラクターオブジェクトを作成
        const character: Character = {
          id: charData.id,
          name: charData.name,
          class: charData.class as CharacterClass,
          hp: classStats.hp,
          maxHp: classStats.hp,
          fp: 0,
          attackDice: classStats.attackDice,
          avoidDice: classStats.avoidDice,
          skills: charData.skills || [],
          items: charData.items || []
        };
        
        // キャラクターを追加
        addCharacter(character);
        importCount++;
      });
      
      setImportDialogOpen(false);
      setJsonImportText('');
      setImportError('');
      
      const message = `${importCount}人のキャラクターをインポートしました`;
      setSuccessMessage(message);
      
      // 3秒後にメッセージを消す
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      
    } catch (error) {
      if (error instanceof Error) {
        setImportError(error.message);
      } else {
        setImportError('JSONデータのインポートに失敗しました');
      }
    }
  };

  // ファイル選択からJSONをインポート
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        setJsonImportText(content);
      } catch (error) {
        console.error('ファイルの読み込みに失敗しました:', error);
        setImportError('ファイルの読み込みに失敗しました');
      }
    };
    reader.readAsText(file);
  };

  return (
    <PageLayout maxContentWidth="1000px">
      <Paper elevation={3} sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
        <Typography variant="h4" align="center" gutterBottom>
          キャラクター一覧
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 4 }} flexWrap="wrap">
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => navigate('/character-creation')}
          >
            新規作成
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<UploadIcon />}
            onClick={handleOpenImportDialog}
          >
            JSONインポート
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<DownloadIcon />}
            onClick={handleExportAllJson}
            disabled={characters.length === 0}
          >
            全てエクスポート
          </Button>
          <Button 
            variant="outlined" 
            color="inherit" 
            onClick={() => navigate('/single-player')}
          >
            戻る
          </Button>
        </Stack>

        {/* 成功メッセージ */}
        {successMessage && (
          <Box sx={{ 
            mb: 2, 
            p: 2, 
            backgroundColor: 'success.light', 
            color: 'success.contrastText',
            borderRadius: 1
          }}>
            <Typography>{successMessage}</Typography>
          </Box>
        )}

        {characters.length > 0 ? (
          <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
            {characters.map((character) => (
              <Box key={character.id}>
                <ListItem
                  secondaryAction={
                    <Box>
                      <IconButton 
                        edge="end" 
                        aria-label="edit"
                        onClick={() => handleEditCharacter(character.id)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        edge="end" 
                        aria-label="download"
                        onClick={() => handleExportJson(character.id)}
                      >
                        <DownloadIcon />
                      </IconButton>
                      <IconButton 
                        edge="end" 
                        aria-label="delete"
                        onClick={() => handleOpenDeleteDialog(character.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  }
                >
                  <ListItemText
                    primary={character.name}
                    secondary={
                      <>
                        <Typography component="span" variant="body2">
                          {character.class}
                        </Typography>
                        <br />
                        <Typography component="span" variant="body2" color="text.secondary">
                          HP: {character.hp} / 攻撃: {character.attackDice} / 回避: {character.avoidDice}
                        </Typography>
                        <br />
                        <Typography component="span" variant="body2" color="text.secondary">
                          スキル: {character.skills.length > 0 ? character.skills[0].name : 'なし'}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
                <Divider />
              </Box>
            ))}
          </List>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              作成したキャラクターはまだありません
            </Typography>
          </Box>
        )}
      </Paper>

      {/* 削除確認ダイアログ */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>キャラクターの削除</DialogTitle>
        <DialogContent>
          <DialogContentText>
            このキャラクターを削除してもよろしいですか？この操作は元に戻せません。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>キャンセル</Button>
          <Button onClick={handleConfirmDelete} color="error">
            削除する
          </Button>
        </DialogActions>
      </Dialog>

      {/* JSONインポートダイアログ */}
      <Dialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>キャラクターのJSONインポート</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            JSONファイルを選択するか、JSONデータを直接入力してください。
            単一のキャラクターまたは複数のキャラクターを含むJSONを読み込むことができます。
            必要な情報は「id」「name」「class」「skills」のみです。
            HPやダイス判定などはクラスに基づいて自動的に設定されます。
          </DialogContentText>
          
          <Button 
            variant="outlined" 
            component="label" 
            sx={{ mb: 2 }}
          >
            ファイルを選択
            <input
              type="file"
              accept=".json"
              hidden
              onChange={handleFileImport}
            />
          </Button>
          
          <TextField
            fullWidth
            multiline
            rows={10}
            label="JSONデータ"
            value={jsonImportText}
            onChange={(e) => {
              setJsonImportText(e.target.value);
              setImportError('');
            }}
            error={!!importError}
            helperText={importError}
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportDialogOpen(false)}>キャンセル</Button>
          <Button onClick={handleImportJson} color="primary">
            インポートする
          </Button>
        </DialogActions>
      </Dialog>
      </PageLayout>
  );
};

export default CharacterListPage;