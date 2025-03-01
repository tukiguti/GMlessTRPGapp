// components/battle/phases/IntroPhase.tsx
import { Box, Typography } from '@mui/material';
import { GamePhase } from '../../../models/types';
import PhaseContainer from '../common/PhaseContainer';

interface IntroPhaseProps {
  phase: GamePhase;
  round: number;
  onNext: () => void;
}

const IntroPhase = ({ phase, round, onNext }: IntroPhaseProps) => {
  return (
    <PhaseContainer 
      title={phase === 'LANE_BATTLE' ? 'レーン戦フェーズ' : 'チーム戦フェーズ'} 
      onNext={onNext}
      nextButtonText="開始する"
    >
      <Typography variant="h6" color="primary" gutterBottom>
        ラウンド {round}
      </Typography>
      
      <Typography variant="body1" paragraph sx={{ my: 2 }}>
        全員のアクション選択が完了しました。<br />
        それぞれのアクションを順番に処理します。
      </Typography>
    </PhaseContainer>
  );
};

export default IntroPhase;