// src/components/ui/PageLayout.tsx
import { Box, Container, Paper } from '@mui/material';
import { ReactNode } from 'react';

interface PageLayoutProps {
  children: ReactNode;
  maxContentWidth?: string | number;
  fullWidth?: boolean;
}

const PageLayout = ({ children, maxContentWidth = '100%', fullWidth = false }: PageLayoutProps) => {
  return (
    <Box sx={{ 
      width: '100%',
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center',
      minHeight: '100%',
    }}>
      <Container 
        disableGutters 
        sx={{ 
          width: '100%',
          maxWidth: fullWidth ? '100%' : maxContentWidth, 
          px: { xs: 1, sm: 2, md: 3 },
          py: { xs: 2, sm: 3, md: 4 },
        }}
      >
        <Paper 
          elevation={2} 
          sx={{ 
            width: '100%', 
            p: { xs: 2, sm: 3, md: 4 },
            borderRadius: 2,
          }}
        >
          {children}
        </Paper>
      </Container>
    </Box>
  );
};

export default PageLayout;