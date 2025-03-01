// components/battle/ActionPhaseContainer.tsx
import { useMemo } from 'react';
import { Character } from '../../models/types';
import IntroPhase from './phases/IntroPhase';
import RetreatPhase from './phases/RetreatPhase';
import FarmingPhase from './phases/FarmingPhase';
import SupportPhase from './phases/SupportPhase';
import AttackPhase from './phases/AttackPhase';
import ItemShopPhase from './phases/ItemShopPhase';
import ResultSummaryPhase from './phases/ResultSummaryPhase';
import { useGameStore } from '../../store/gameStore';
import { Box, Typography, Paper } from '@mui/material';

type ActionPhase =
    | 'ACTION_SELECTION'
    | 'INTRO'
    | 'RETREAT'
    | 'FARMING'
    | 'SUPPORT'
    | 'ATTACK'
    | 'ITEM_SHOP'
    | 'SUMMARY';

interface ActionPhaseContainerProps {
    actionPhase: ActionPhase;
    onNextPhase: () => void;
    onDiceRoll: (results: any) => void;
    diceResults: any[];
    currentAttackIndex: number;
}

const ActionPhaseContainer = ({
    actionPhase,
    onNextPhase,
    onDiceRoll,
    diceResults,
    currentAttackIndex
}: ActionPhaseContainerProps) => {
    const {
        phase,
        round,
        blueTeamCharacters,
        redTeamCharacters,
        currentActions
    } = useGameStore();

    // デバッグ情報表示関数
    const renderDebugInfo = () => {
        if (process.env.NODE_ENV !== 'production') {
            const allCharacters = [...blueTeamCharacters, ...redTeamCharacters];

            return (
                <Paper sx={{ p: 2, mt: 2, border: '1px dashed red', fontSize: '0.75rem' }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>デバッグ情報:</Typography>
                    <Box component="pre" sx={{ fontSize: '0.7rem', overflow: 'auto', maxHeight: '200px' }}>
                        現在のフェーズ: {actionPhase}
                        <br />
                        キャラクター数: {allCharacters.length}
                        <br />
                        アクション数: {Object.keys(currentActions).length}
                        <br />
                        アクション詳細:
                        {JSON.stringify(currentActions, null, 2)}
                    </Box>
                </Paper>
            );
        }
        return null;
    };

    // アクションに基づいてキャラクターをフィルタリング
    const getCharactersByAction = useMemo(() => {
        return (actionType: string): Character[] => {
            // 処理済みアクションを使用
            const processedActions = useGameStore.getState().processedActions || {};

            console.log('getCharactersByAction - アクション:', actionType);
            console.log('getCharactersByAction - 処理済みアクション:', processedActions);

            return [...blueTeamCharacters, ...redTeamCharacters]
                .filter(character => {
                    const action = processedActions[character.id];
                    const result = action && action.actionType === actionType;

                    if (result) {
                        console.log('getCharactersByAction - マッチしたキャラクター:', character.name);
                    }

                    return result;
                });
        };
    }, [blueTeamCharacters, redTeamCharacters]);

    // 攻撃順序に基づいたキャラクターリスト
    const getOrderedAttackers = useMemo(() => {
        return (): Character[] => {
            const attackOrder = [
                { team: 'BLUE', role: 'TOP' },
                { team: 'BLUE', role: 'JG' },
                { team: 'BLUE', role: 'MID' },
                { team: 'BLUE', role: 'ADC' },
                { team: 'RED', role: 'TOP' },
                { team: 'RED', role: 'JG' },
                { team: 'RED', role: 'MID' },
                { team: 'RED', role: 'ADC' }
            ];

            return attackOrder
                .map(({ team, role }) =>
                    [...blueTeamCharacters, ...redTeamCharacters].find(
                        c => c.team === team && c.role === role &&
                            currentActions[c.id]?.actionType === 'アタック'
                    )
                )
                .filter((character): character is Character => character !== undefined);
        };
    }, [blueTeamCharacters, redTeamCharacters, currentActions]);

    switch (actionPhase) {
        case 'INTRO':
            return (
                <>
                    <IntroPhase
                        phase={phase}
                        round={round}
                        onNext={onNextPhase}
                    />
                    {renderDebugInfo()}
                </>
            );

        case 'RETREAT':
            return (
                <>
                    <RetreatPhase
                        characters={getCharactersByAction('リコール')}
                        onNext={onNextPhase}
                    />
                    {renderDebugInfo()}
                </>
            );

        case 'FARMING':
            return (
                <>
                    <FarmingPhase
                        characters={getCharactersByAction('ファーム')}
                        onNext={onNextPhase}
                    />
                    {renderDebugInfo()}
                </>
            );

        case 'SUPPORT':
            return (
                <SupportPhase
                    characters={getCharactersByAction('サポート')}
                    onNext={onNextPhase}
                />
            );

        case 'ATTACK':
            const attackers = getOrderedAttackers();

            if (attackers.length === 0) {
                // アタックがない場合はスキップ
                setTimeout(() => onNextPhase(), 0);
                return null;
            }

            // 攻撃順序を明確にする
            // 青チームTOP, JG, MID, ADC、赤チームTOP, JG, MID, ADC
            const attackOrder = [
                { team: 'BLUE', role: 'TOP' },
                { team: 'BLUE', role: 'JG' },
                { team: 'BLUE', role: 'MID' },
                { team: 'BLUE', role: 'ADC' },
                { team: 'RED', role: 'TOP' },
                { team: 'RED', role: 'JG' },
                { team: 'RED', role: 'MID' },
                { team: 'RED', role: 'ADC' }
            ];

            // 全キャラクター
            const allCharacters = [...blueTeamCharacters, ...redTeamCharacters];

            // 攻撃順序に基づいてフィルタリング
            const orderedAttackers = attackOrder
                .map(({ team, role }) =>
                    allCharacters.find(c =>
                        c.team === team &&
                        c.role === role &&
                        processedActions[c.id]?.actionType === 'アタック'
                    )
                )
                .filter((character): character is Character => character !== undefined);

            if (orderedAttackers.length === 0) {
                // アタックがない場合はスキップ
                setTimeout(() => onNextPhase(), 0);
                return null;
            }

            // 現在のアタッカー
            const currentAttacker = orderedAttackers[currentAttackIndex];
            if (!currentAttacker) {
                // 無効なインデックスの場合はスキップ
                setTimeout(() => onNextPhase(), 0);
                return null;
            }

            // ターゲットを取得
            const targetId = processedActions[currentAttacker.id]?.targetId;
            const target = allCharacters.find(c => c.id === targetId);

            if (!target) {
                console.error('Target not found for attacker:', currentAttacker.id);
                setTimeout(() => onNextPhase(), 0);
                return null;
            }

            console.log(`戦闘判定: ${currentAttacker.name}(${currentAttacker.role}) → ${target.name}(${target.role})`);

            return (
                <AttackPhase
                    attacker={currentAttacker}
                    defender={target}
                    onNext={onNextPhase}
                    onDiceRoll={onDiceRoll}
                />
            );

        case 'ITEM_SHOP':
            return (
                <ItemShopPhase
                    characters={getCharactersByAction('リコール')}
                    onNext={onNextPhase}
                />
            );

        case 'SUMMARY':
            return (
                <ResultSummaryPhase
                    diceResults={diceResults}
                    onNext={onNextPhase}
                />
            );

        default:
            return null;
    }
};

export default ActionPhaseContainer;