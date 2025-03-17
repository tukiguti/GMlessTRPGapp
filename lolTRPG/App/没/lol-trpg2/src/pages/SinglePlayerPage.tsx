// src/pages/SinglePlayerPage.tsx
import { Button, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../components/ui/PageLayout';

const SinglePlayerPage = () => {
  const navigate = useNavigate();

  return (
    <PageLayout maxContentWidth="600px">
      <Stack spacing={3} width="100%">
        <Typography variant="h4" component="h1" align="center">
          シングルプレイヤー
        </Typography>
        
        <Stack spacing={2} width="100%">
          <Button 
            variant="contained" 
            color="primary" 
            size="large" 
            onClick={() => navigate('/character-creation')}
            sx={{ minHeight: '56px' }}
            fullWidth
          >
            キャラクター作成
          </Button>
          
            {/* キャラクター一覧ページへのボタンを追加 */}
            <Button 
              variant="contained" 
              color="info" 
              size="large" 
              onClick={() => navigate('/character-list')}
              fullWidth
            >
              キャラクター一覧
            </Button>

          <Button 
            variant="contained" 
            color="secondary" 
            size="large" 
            onClick={() => navigate('/character-creation')}
            sx={{ minHeight: '56px' }}
            fullWidth
          >
            JSONファイル読み込み
          </Button>
          
          <Button 
            variant="contained" 
            color="success" 
            size="large" 
            onClick={() => navigate('/team-formation')}
            sx={{ minHeight: '56px' }}
            fullWidth
          >
            チーム編成へ
          </Button>
          
          <Button 
            variant="outlined" 
            color="inherit" 
            size="large" 
            onClick={() => navigate('/')}
            sx={{ mt: 2 }}
            fullWidth
          >
            戻る
          </Button>
        </Stack>
      </Stack>
    </PageLayout>
  );
};

export default SinglePlayerPage;