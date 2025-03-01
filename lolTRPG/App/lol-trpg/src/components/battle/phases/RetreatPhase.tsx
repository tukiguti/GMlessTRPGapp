// components/battle/phases/RetreatPhase.tsx
import { Typography } from '@mui/material';
import { Character } from '../../../models/types';
import PhaseContainer from '../common/PhaseContainer';
import CharacterDisplay from '../common/CharacterDisplay';

interface RetreatPhaseProps {
  characters: Character[];
  onNext: () => void;
}

const RetreatPhase = ({ characters, onNext }: RetreatPhaseProps) => {
  return (
    <PhaseContainer title="リコール処理" onNext={onNext}>
      {characters.length > 0 ? (
        // 修正: 配列をマップして複数のキャラクターを表示
        characters.map(character => (
          <div key={character.id} style={{ marginBottom: '16px' }}>
            <CharacterDisplay character={character} />
            <Typography variant="body1">
              リコールを実行
            </Typography>
          </div>
        ))
      ) : (
        <Typography variant="body1" sx={{ my: 3 }}>
          リコールを行ったキャラクターはいません
        </Typography>
      )}
    </PhaseContainer>
  );
};

export default RetreatPhase;