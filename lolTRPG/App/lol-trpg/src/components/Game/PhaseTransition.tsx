// components/Game/PhaseTransition.tsx

import React, { useEffect, useState } from 'react';
import { GamePhase } from '../../models/game';

interface PhaseTransitionProps {
    phase: GamePhase;
    onAnimationComplete: () => void;
}

export const PhaseTransition: React.FC<PhaseTransitionProps> = ({ phase, onAnimationComplete }) => {
    const [isAnimating, setIsAnimating] = useState(true);

    useEffect(() => {
        setIsAnimating(true);
        const timer = setTimeout(() => {
            setIsAnimating(false);
            onAnimationComplete();
        }, 2000); // アニメーション時間

        return () => clearTimeout(timer);
    }, [phase, onAnimationComplete]);

    const getPhaseText = (phase: GamePhase) => {
        switch (phase) {
            case 'LANE':
                return 'レーン戦フェーズ';
            case 'TEAM_FIGHT':
                return '集団戦フェーズ';
            default:
                return '';
        }
    };

    if (!isAnimating) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
            <div className={`
                transform transition-all duration-1000
                ${isAnimating ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}
                text-4xl font-bold text-white text-center
                p-8 rounded-lg bg-blue-600 bg-opacity-80
                shadow-lg
            `}>
                <div className="phase-title">
                    {getPhaseText(phase)}
                </div>
                <div className="phase-animation mt-4">
                    {/* フェーズに応じたアイコンやアニメーション */}
                    {phase === 'LANE' ? (
                        <div className="lane-icon">🗡️</div>
                    ) : (
                        <div className="team-fight-icon">⚔️</div>
                    )}
                </div>
            </div>
        </div>
    );
};