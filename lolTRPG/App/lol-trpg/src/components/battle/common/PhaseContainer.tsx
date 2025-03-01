// components/battle/common/PhaseContainer.tsx
import { ReactNode } from 'react';
import { Box, Typography, Divider, Button } from '@mui/material';

interface PhaseContainerProps {
  title: string;
  children: ReactNode;
  onNext: () => void;
  nextButtonText?: string;
  showDivider?: boolean;
}

const PhaseContainer = ({ 
  title, 
  children, 
  onNext, 
  nextButtonText = '次へ進む',
  showDivider = true 
}: PhaseContainerProps) => {
  return (
    <Box sx={{ textAlign: 'center', p: 2, width: '100%' }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      
      {showDivider && <Divider sx={{ my: 2 }} />}
      
      <Box sx={{ my: 2 }}>
        {children}
      </Box>
      
      <Button 
        variant="contained" 
        color="primary"
        onClick={onNext}
        sx={{ mt: 1, px: 3 }}
      >
        {nextButtonText}
      </Button>
    </Box>
  );
};

export default PhaseContainer;