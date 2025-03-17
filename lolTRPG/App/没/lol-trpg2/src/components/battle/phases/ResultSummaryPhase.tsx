// components/battle/phases/ResultSummaryPhase.tsx
import { Typography } from '@mui/material';
import PhaseContainer from '../common/PhaseContainer';

interface ResultSummaryPhaseProps {
  diceResults: {
    attackerId?: string;
    defenderId?: string;
    attackRoll?: any;
    defenseRoll?: any;
    success?: boolean;
  }[];
  onNext: () => void;
}

const ResultSummaryPhase = ({ diceResults, onNext }: ResultSummaryPhaseProps) => {
  return (
    <PhaseContainer 
      title="バトル結果サマリー" 
      onNext={onNext}
      nextButtonText="次のラウンドへ"
    >
      {diceResults.length > 0 ? (
        <>
          <Typography variant="body1" gutterBottom>
            {diceResults.length}回の戦闘が発生しました。
          </Typography>
          
          <Typography variant="body1" sx={{ color: 'success.main' }}>
            成功した攻撃: {diceResults.filter(result => result.success).length}回
          </Typography>
          
          <Typography variant="body1" sx={{ color: 'error.main', mb: 2 }}>
            失敗した攻撃: {diceResults.filter(result => !result.success).length}回
          </Typography>
        </>
      ) : (
        <Typography variant="body1" sx={{ my: 3 }}>
          このラウンドでは戦闘は発生しませんでした。
        </Typography>
      )}
    </PhaseContainer>
  );
};

export default ResultSummaryPhase;