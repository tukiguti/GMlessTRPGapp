// components/battle/phases/FarmingPhase.tsx
import { useMemo } from 'react';
import { Typography } from '@mui/material';
import { Character } from '../../../models/types';
import PhaseContainer from '../common/PhaseContainer';
import CharacterDisplay from '../common/CharacterDisplay';
import { useGameStore } from '../../../store/gameStore';

interface FarmingPhaseProps {
  characters: Character[];
  onNext: () => void;
}

const FarmingPhase = ({ characters, onNext }: FarmingPhaseProps) => {
  // 正しくストアから値を取得
  const { blueTeamCharacters, redTeamCharacters } = useGameStore();
  // processedActionsも同様に取得
  const processedActions = useGameStore(state => state.processedActions);
  
  // ファームキャラクターを取得
  const farmingCharacters = useMemo(() => {
    const allCharacters = [...blueTeamCharacters, ...redTeamCharacters];
    
    return allCharacters.filter(character => {
      const action = processedActions[character.id];
      return action && action.actionType === 'ファーム';
    });
  }, [processedActions, blueTeamCharacters, redTeamCharacters]);
  
  console.log('FarmingPhase - farmingCharacters:', farmingCharacters);
  console.log('FarmingPhase - props characters:', characters);
  console.log('FarmingPhase - processedActions:', processedActions);
  
  // この行で'process'が使われていると思われますが、おそらく意図しないものです
  // 以下のように修正します
  // 修正前: if (process.env.NODE_ENV !== 'production') { ... }
  // 修正後: {/* ここのコードを修正 */}
  
  const hasAnyFarmers = farmingCharacters.length > 0;

  return (
    <PhaseContainer title="ファーム処理" onNext={onNext}>
      {/* デバッグ情報が必要な場合は、NODE_ENVの代わりに単純な定数を使用 */}
      {/* {isDevelopment && renderDebugInfo()} */}
      
      {farmingCharacters.length > 0 ? (
        <>
          {farmingCharacters.map(character => (
            <div key={character.id}>
              <CharacterDisplay character={character} />
              <Typography variant="body1" sx={{ mb: 3 }}>
                ファームを行った (+5 FP)
              </Typography>
            </div>
          ))}
        </>
      ) : (
        <Typography variant="body1" sx={{ my: 3 }}>
          ファームを行ったキャラクターはいません (ファームアクション数: {
            Object.values(processedActions)
              .filter(action => action.actionType === 'ファーム').length
          })
        </Typography>
      )}
    </PhaseContainer>
  );
};

export default FarmingPhase;