import React from 'react';

const LanePhaseResult: React.FC<{ onNextPhase: () => void }> = ({ onNextPhase }) => {
  return (
    <div>
      <h1>レーン戦フェーズ結果</h1>
      <p>各プレイヤーの行動結果を表示（例: HP減少、FP増加など）</p>
      <button onClick={onNextPhase}>次のフェーズへ（集団戦）</button>
    </div>
  );
};

export default LanePhaseResult;
