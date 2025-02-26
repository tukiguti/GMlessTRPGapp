import { Box, Button, Container, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../components/ui/PageLayout';

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <PageLayout maxContentWidth="600px">
      <Container maxWidth="sm" sx={{ py: 10 }}>
        <Stack spacing={4} alignItems="center">
          <Typography variant="h3" component="h1" align="center" gutterBottom>
            League of Legends TRPG
          </Typography>
          
          <Stack spacing={2} width="100%">
            <Button 
              variant="contained" 
              color="primary" 
              size="large" 
              onClick={() => navigate('/single-player')}
              fullWidth
            >
              シングルプレイヤー
            </Button>
            
            <Button 
              variant="contained" 
              color="secondary" 
              size="large" 
              disabled
              fullWidth
              sx={{ '&.Mui-disabled': { color: 'text.secondary' } }}
            >
              マルチプレイヤー（実装予定）
            </Button>
            
            <Button 
              variant="contained" 
              color="info" 
              size="large" 
              disabled
              fullWidth
              sx={{ '&.Mui-disabled': { color: 'text.secondary' } }}
            >
              設定（実装予定）
            </Button>
          </Stack>
        </Stack>
      </Container>
    </PageLayout>
  );
};

export default HomePage;