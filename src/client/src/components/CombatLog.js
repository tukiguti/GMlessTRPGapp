import React, { useEffect, useRef } from 'react';
export const CombatLog = ({ logs, filter, maxHeight = '500px' }) => {
    const logEndRef = useRef(null);
    // 新しいログが追加されたら自動スクロール
    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);
    const getEventIcon = (type) => {
        switch (type) {
            case 'kill':
                return '💀';
            case 'damage':
                return '⚔️';
            case 'tower':
                return '🏰';
            case 'objective':
                return '🐉';
            case 'item':
                return '🛒';
            case 'heal':
                return '💚';
            case 'system':
                return 'ℹ️';
            default:
                return '📋';
        }
    };
    const getEventColor = (type) => {
        switch (type) {
            case 'kill':
                return 'text-red-400';
            case 'damage':
                return 'text-orange-400';
            case 'tower':
                return 'text-yellow-400';
            case 'objective':
                return 'text-purple-400';
            case 'item':
                return 'text-blue-400';
            case 'heal':
                return 'text-green-400';
            case 'system':
                return 'text-gray-400';
            default:
                return 'text-white';
        }
    };
    const getBackgroundColor = (type) => {
        switch (type) {
            case 'kill':
                return 'bg-red-900 bg-opacity-20 border-red-700';
            case 'damage':
                return 'bg-orange-900 bg-opacity-20 border-orange-700';
            case 'tower':
                return 'bg-yellow-900 bg-opacity-20 border-yellow-700';
            case 'objective':
                return 'bg-purple-900 bg-opacity-20 border-purple-700';
            case 'item':
                return 'bg-blue-900 bg-opacity-20 border-blue-700';
            case 'heal':
                return 'bg-green-900 bg-opacity-20 border-green-700';
            case 'system':
                return 'bg-gray-800 border-gray-700';
            default:
                return 'bg-gray-800 border-gray-700';
        }
    };
    // フィルターが指定されている場合は適用
    const filteredLogs = filter
        ? logs.filter(log => filter.includes(log.type))
        : logs;
    return (<div className="bg-gray-900 rounded-lg border-2 border-gray-700 p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-xl font-bold text-white">戦闘ログ</h3>
        <span className="text-sm text-gray-400">
          {filteredLogs.length} 件のイベント
        </span>
      </div>

      {/* ログエントリー */}
      <div className="space-y-2 overflow-y-auto" style={{ maxHeight }}>
        {filteredLogs.length === 0 ? (<div className="text-center text-gray-500 py-8">
            まだイベントがありません
          </div>) : (filteredLogs.map((log) => (<div key={log.id} className={`p-3 rounded border-l-4 ${getBackgroundColor(log.type)}`}>
              <div className="flex items-start gap-2">
                {/* アイコン */}
                <span className="text-xl flex-shrink-0">
                  {getEventIcon(log.type)}
                </span>

                {/* メッセージ */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-400 font-mono">
                      [{log.timestamp}]
                    </span>
                    <span className="text-xs bg-gray-700 px-2 py-0.5 rounded">
                      R{log.round}
                    </span>
                  </div>
                  <p className={`text-sm ${getEventColor(log.type)}`}>
                    {log.message}
                  </p>
                </div>
              </div>
            </div>)))}
        <div ref={logEndRef}/>
      </div>
    </div>);
};
export const CombatLogFilter = ({ selectedFilters, onFilterChange }) => {
    const filterOptions = [
        { type: 'kill', label: 'キル', icon: '💀' },
        { type: 'damage', label: 'ダメージ', icon: '⚔️' },
        { type: 'tower', label: 'タワー', icon: '🏰' },
        { type: 'objective', label: 'オブジェクト', icon: '🐉' },
        { type: 'item', label: 'アイテム', icon: '🛒' },
        { type: 'heal', label: '回復', icon: '💚' },
        { type: 'system', label: 'システム', icon: 'ℹ️' },
    ];
    const toggleFilter = (type) => {
        if (selectedFilters.includes(type)) {
            onFilterChange(selectedFilters.filter(f => f !== type));
        }
        else {
            onFilterChange([...selectedFilters, type]);
        }
    };
    return (<div className="bg-gray-800 p-3 rounded-lg mb-2">
      <p className="text-sm text-gray-400 mb-2">フィルター:</p>
      <div className="flex flex-wrap gap-2">
        {filterOptions.map((option) => (<button key={option.type} onClick={() => toggleFilter(option.type)} className={`px-3 py-1 rounded text-sm transition-all ${selectedFilters.includes(option.type)
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
            <span className="mr-1">{option.icon}</span>
            {option.label}
          </button>))}
      </div>
    </div>);
};
