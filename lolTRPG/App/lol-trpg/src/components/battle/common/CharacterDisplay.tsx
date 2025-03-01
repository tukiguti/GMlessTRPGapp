// components/battle/common/CharacterDisplay.tsx
import { Typography, Box } from '@mui/material';
import { Character } from '../../../models/types';

interface CharacterDisplayProps {
  character: Character;
  subtitle?: string;
}

const CharacterDisplay = ({ character, subtitle }: CharacterDisplayProps) => {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="body1" fontWeight="bold">
        {character.name}
      </Typography>
      
      {subtitle && (
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      )}
      
      <Typography variant="caption" display="block">
        HP: {character.hp}/{character.maxHp} | FP: {character.fp}
      </Typography>
    </Box>
  );
};

export default CharacterDisplay;