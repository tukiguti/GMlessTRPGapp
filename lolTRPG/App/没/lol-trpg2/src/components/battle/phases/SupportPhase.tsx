// components/battle/phases/SupportPhase.tsx
import { Typography } from '@mui/material';
import { Character, SupportActionType } from '../../../models/types';
import { useGameStore } from '../../../store/gameStore';
import PhaseContainer from '../common/PhaseContainer';
import CharacterDisplay from '../common/CharacterDisplay';

interface SupportPhaseProps {
  characters: Character[];
  onNext: () => void;
}

const SupportPhase = ({ characters, onNext }: SupportPhaseProps) => {
  const { currentActions, blueTeamCharacters, redTeamCharacters } = useGameStore();
  
  const getSupportTypeText = (supportType: SupportActionType | undefined): string => {
    if (!supportType) return '';
    
    switch(supportType) {
      case 'エンチャント': return 'エンチャント（味方バフ）';
      case 'フック': return 'フック（敵デバフ）';
      case 'タンク': return 'タンク（攻撃肩代わり）';
      default: return supportType;
    }
  };
  
  return (
    <PhaseContainer title="サポート処理" onNext={onNext}>
      {characters.length > 0 ? (
        (() => {
          const character = characters[0];
          const action = currentActions[character.id];
          const supportType = action?.supportType as SupportActionType | undefined;
          const targetId = action?.targetId;
          
          let target = null;
          if (targetId) {
            target = [...blueTeamCharacters, ...redTeamCharacters].find(
              c => c.id === targetId
            );
          }
          
          return (
            <>
              <CharacterDisplay character={character} />
              
              {supportType && (
                <Typography variant="body1" sx={{ mb: 1 }}>
                  {getSupportTypeText(supportType)}
                </Typography>
              )}
              
              {target && (
                <Typography variant="body1" sx={{ mb: 2 }}>
                  対象: {target.name}
                </Typography>
              )}
            </>
          );
        })()
      ) : (
        <Typography variant="body1" sx={{ my: 3 }}>
          サポートを行ったキャラクターはいません
        </Typography>
      )}
    </PhaseContainer>
  );
};

export default SupportPhase;