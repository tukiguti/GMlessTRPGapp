// src/components/Game/GameContainer.tsx

import React, { useState } from 'react';
import { CustomCharacter } from '../../types';
import { GamePhase, GameState } from '../../types/gameTypes';

interface GameContainerProps {
    initialTeamSize: number;
    blueTeam: CustomCharacter[];
    redTeam: CustomCharacter[];
}

export const GameContainer: React.FC<GameContainerProps> = ({
    initialTeamSize,
    blueTeam,
    redTeam
}) => {
    return (
        <div style={{ 
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '20px',
            padding: '20px',
            maxWidth: '800px',
            margin: '0 auto'
        }}>
            {/* ゲーム状況セクション */}
            <div style={{ marginBottom: '20px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '10px' }}>
                    ゲーム状況
                </h2>
                <div style={{ marginLeft: '20px', lineHeight: '1.8' }}>
                    <div>フェーズ: <span style={{ color: '#0000FF' }}>レーン戦</span></div>
                    <div>ラウンド: <span style={{ color: '#0000FF' }}>1</span></div>
                    <div>現在のターン: <span style={{ color: '#0000FF' }}>青チーム</span></div>
                    <div>プレイヤー: <span style={{ color: '#0000FF' }}>ゼラス</span></div>
                    <div>青チームタワー: <span style={{ color: '#0000FF' }}>5</span></div>
                    <div>赤チームタワー: <span style={{ color: '#FF0000' }}>5</span></div>
                </div>
            </div>

            {/* 行動選択セクション */}
            <div>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '10px' }}>
                    行動選択
                </h2>
                <div style={{ 
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '10px'
                }}>
                    <div style={{ 
                        border: '1px solid #ccc',
                        padding: '15px',
                        backgroundColor: '#f5f5f5',
                        cursor: 'pointer'
                    }}>
                        <h3 style={{ fontWeight: 'bold', marginBottom: '10px' }}>ファーム</h3>
                        <p style={{ fontSize: '14px' }}>
                            ファームポイントを5獲得、回避判定に-3のペナルティ
                        </p>
                    </div>
                    <div style={{ 
                        border: '1px solid #ccc',
                        padding: '15px',
                        backgroundColor: '#f5f5f5',
                        cursor: 'pointer'
                    }}>
                        <h3 style={{ fontWeight: 'bold', marginBottom: '10px' }}>アタック</h3>
                        <p style={{ fontSize: '14px' }}>
                            プレイヤーに攻撃、成功時ファームポイント2獲得
                        </p>
                    </div>
                    <div style={{ 
                        border: '1px solid #ccc',
                        padding: '15px',
                        backgroundColor: '#f5f5f5',
                        cursor: 'pointer'
                    }}>
                        <h3 style={{ fontWeight: 'bold', marginBottom: '10px' }}>リコール</h3>
                        <p style={{ fontSize: '14px' }}>
                            ファームポイントを使用してアイテムを購入
                        </p>
                    </div>
                </div>
            </div>

            {/* キャラクター情報セクション */}
            <div>
                <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>ゼラス</h3>
                    <div style={{ marginLeft: '20px', lineHeight: '1.5' }}>
                        <div>AP Mage</div>
                        <div>HP3/3</div>
                        <div>FP0</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GameContainer;