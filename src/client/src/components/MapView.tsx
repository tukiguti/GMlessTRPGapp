import React from 'react';

interface MapViewProps {
  onAreaClick?: (area: string) => void;
  selectedArea?: string;
  characters: Array<{
    id: string;
    name: string;
    position: { area: string };
    team: 'blue' | 'red';
  }>;
  towers: Array<{
    id: string;
    type: string;
    team: 'blue' | 'red';
    destroyed: boolean;
    lane?: string;
  }>;
}

export const MapView: React.FC<MapViewProps> = ({
  onAreaClick,
  selectedArea,
  characters,
  towers
}) => {
  const width = 800;
  const height = 800;

  // エリアの座標定義（LoL風の対角線配置）
  const areas = {
    // ブルーチーム陣地（左下）
    blue_nexus: { x: 100, y: 700, label: 'ネクサス' },
    blue_nexus_tower: { x: 150, y: 650, label: 'NT' },

    // ブルーチーム レーン
    blue_top_inner: { x: 200, y: 550, label: 'TOP Inn' },
    blue_top_outer: { x: 250, y: 450, label: 'TOP Out' },
    blue_mid_inner: { x: 250, y: 600, label: 'MID Inn' },
    blue_mid_outer: { x: 350, y: 500, label: 'MID Out' },
    blue_bot_inner: { x: 300, y: 650, label: 'BOT Inn' },
    blue_bot_outer: { x: 400, y: 600, label: 'BOT Out' },

    // ブルーチーム ジャングル
    blue_top_mid_jungle: { x: 200, y: 500, label: '🔴' },
    blue_mid_bot_jungle: { x: 300, y: 600, label: '🔵' },

    // レッドチーム陣地（右上）
    red_nexus: { x: 700, y: 100, label: 'ネクサス' },
    red_nexus_tower: { x: 650, y: 150, label: 'NT' },

    // レッドチーム レーン
    red_top_inner: { x: 600, y: 250, label: 'TOP Inn' },
    red_top_outer: { x: 550, y: 350, label: 'TOP Out' },
    red_mid_inner: { x: 550, y: 200, label: 'MID Inn' },
    red_mid_outer: { x: 450, y: 300, label: 'MID Out' },
    red_bot_inner: { x: 500, y: 150, label: 'BOT Inn' },
    red_bot_outer: { x: 400, y: 200, label: 'BOT Out' },

    // レッドチーム ジャングル
    red_top_mid_jungle: { x: 600, y: 300, label: '🔵' },
    red_mid_bot_jungle: { x: 500, y: 200, label: '🔴' },

    // 中立エリア
    baron_pit: { x: 400, y: 250, label: '🦀' },
    dragon_pit: { x: 400, y: 550, label: '🐉' },
  };

  const handleAreaClick = (area: string) => {
    if (onAreaClick) {
      onAreaClick(area);
    }
  };

  const getCharactersInArea = (area: string) => {
    return characters.filter(c => c.position.area === area);
  };

  return (
    <div className="bg-gray-900 rounded-lg p-4 border-2 border-gray-700">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        style={{ background: '#0a0e1a' }}
      >
        {/* 背景グラデーション */}
        <defs>
          <radialGradient id="blueGlow" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="redGlow" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* ブルー陣地のグロー */}
        <circle cx={100} cy={700} r={200} fill="url(#blueGlow)" />

        {/* レッド陣地のグロー */}
        <circle cx={700} cy={100} r={200} fill="url(#redGlow)" />

        {/* リバー（中央の川） */}
        <path
          d="M 0 400 Q 200 350, 400 400 T 800 400"
          fill="none"
          stroke="#1e40af"
          strokeWidth="80"
          opacity="0.2"
        />

        {/* TOPレーン */}
        <path
          d="M 100 700 L 150 650 L 200 550 L 250 450 L 350 350 L 450 250 L 550 150 L 650 100 L 700 100"
          fill="none"
          stroke="#4b5563"
          strokeWidth="60"
          opacity="0.5"
        />

        {/* MIDレーン */}
        <path
          d="M 100 700 L 200 600 L 300 500 L 400 400 L 500 300 L 600 200 L 700 100"
          fill="none"
          stroke="#4b5563"
          strokeWidth="60"
          opacity="0.5"
        />

        {/* BOTレーン */}
        <path
          d="M 100 700 L 200 700 L 300 650 L 400 600 L 500 500 L 600 350 L 650 250 L 700 200 L 700 100"
          fill="none"
          stroke="#4b5563"
          strokeWidth="60"
          opacity="0.5"
        />

        {/* ジャングルエリア（森）の表現 */}
        <g opacity="0.3">
          {/* ブルー側 ジャングル */}
          <circle cx={200} cy={500} r={40} fill="#166534" />
          <circle cx={300} cy={600} r={40} fill="#166534" />
          {/* レッド側 ジャングル */}
          <circle cx={600} cy={300} r={40} fill="#166534" />
          <circle cx={500} cy={200} r={40} fill="#166534" />
        </g>

        {/* エリア（クリック可能） */}
        {Object.entries(areas).map(([key, area]) => {
          const isSelected = selectedArea === key;
          const charsInArea = getCharactersInArea(key);
          const isNexus = key.includes('nexus') && !key.includes('tower');
          const isTower = key.includes('tower') || key.includes('inner') || key.includes('outer');

          return (
            <g key={key}>
              {/* エリアの円 */}
              <circle
                cx={area.x}
                cy={area.y}
                r={isNexus ? 30 : isTower ? 20 : 25}
                fill={isSelected ? '#fbbf24' : key.includes('blue') ? '#3b82f6' : key.includes('red') ? '#ef4444' : '#6b7280'}
                fillOpacity={isNexus ? 0.8 : 0.4}
                stroke={isSelected ? '#fbbf24' : key.includes('blue') ? '#60a5fa' : key.includes('red') ? '#f87171' : '#9ca3af'}
                strokeWidth={isSelected ? 4 : 2}
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => handleAreaClick(key)}
              />

              {/* エリアラベル */}
              <text
                x={area.x}
                y={area.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                fontSize={isNexus ? 14 : 10}
                fontWeight="bold"
                className="pointer-events-none"
              >
                {area.label}
              </text>

              {/* キャラクター数の表示 */}
              {charsInArea.length > 0 && (
                <g>
                  <circle
                    cx={area.x + 15}
                    cy={area.y - 15}
                    r={10}
                    fill="#10b981"
                    stroke="white"
                    strokeWidth={2}
                  />
                  <text
                    x={area.x + 15}
                    y={area.y - 15}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fontSize={10}
                    fontWeight="bold"
                    className="pointer-events-none"
                  >
                    {charsInArea.length}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* タワーアイコン */}
        {towers.filter(t => !t.destroyed).map((tower) => {
          const areaKey = tower.id;
          const area = areas[areaKey as keyof typeof areas];
          if (!area) return null;

          return (
            <g key={tower.id}>
              <polygon
                points={`${area.x},${area.y - 15} ${area.x - 10},${area.y + 5} ${area.x + 10},${area.y + 5}`}
                fill={tower.team === 'blue' ? '#3b82f6' : '#ef4444'}
                stroke="white"
                strokeWidth={1}
              />
            </g>
          );
        })}

        {/* キャラクターアイコン（簡易版） */}
        {characters.map((char) => {
          const area = areas[char.position.area as keyof typeof areas];
          if (!area) return null;

          // 同じエリアに複数いる場合のオフセット計算
          const charsInSameArea = getCharactersInArea(char.position.area);
          const index = charsInSameArea.findIndex(c => c.id === char.id);
          const offsetX = (index % 3 - 1) * 15;
          const offsetY = Math.floor(index / 3) * 15;

          return (
            <g key={char.id}>
              <circle
                cx={area.x + offsetX}
                cy={area.y + offsetY + 30}
                r={8}
                fill={char.team === 'blue' ? '#60a5fa' : '#f87171'}
                stroke="white"
                strokeWidth={2}
                className="cursor-pointer"
              />
              <text
                x={area.x + offsetX}
                y={area.y + offsetY + 30}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                fontSize={8}
                fontWeight="bold"
                className="pointer-events-none"
              >
                {char.name.charAt(0)}
              </text>
            </g>
          );
        })}

        {/* 凡例 */}
        <g transform="translate(10, 10)">
          <rect width={180} height={80} fill="#1f2937" opacity={0.9} rx={5} />
          <text x={10} y={20} fill="white" fontSize={12} fontWeight="bold">凡例</text>

          <circle cx={20} cy={35} r={6} fill="#3b82f6" />
          <text x={35} y={38} fill="white" fontSize={10}>ブルーチーム</text>

          <circle cx={20} cy={50} r={6} fill="#ef4444" />
          <text x={35} y={53} fill="white" fontSize={10}>レッドチーム</text>

          <circle cx={20} cy={65} r={6} fill="#6b7280" />
          <text x={35} y={68} fill="white" fontSize={10}>中立エリア</text>
        </g>
      </svg>
    </div>
  );
};
