import { useState, useMemo } from 'react';
import { useGameStore } from '../stores/gameStore';
import type { Item, ItemCategory, ItemTier } from '../types/game';
import {
  ALL_ITEMS,
  getItemsByCategory,
  getItemsByTier,
  sortItemsByPrice,
  sortItemsByAttack,
} from '../data/items';

// ========================================
// ItemShop コンポーネント (Task 23-26)
// ========================================

interface ItemShopProps {
  characterId: string;
  onClose: () => void;
}

type SortType = 'price_asc' | 'price_desc' | 'attack_desc' | 'defense_desc';

export const ItemShop: React.FC<ItemShopProps> = ({
  characterId,
  onClose,
}) => {
  // フィルター・ソート状態
  const [selectedTier, setSelectedTier] = useState<ItemTier | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<
    ItemCategory | 'all'
  >('all');
  const [sortType, setSortType] = useState<SortType>('price_asc');

  // GameStore
  const character = useGameStore((state) =>
    state.characters.find((c) => c.id === characterId)
  );
  const canPurchaseItem = useGameStore((state) => state.canPurchaseItem);
  const purchaseItem = useGameStore((state) => state.purchaseItem);

  // ========================================
  // フィルター・ソート処理 (Task 24-25)
  // ========================================
  const filteredAndSortedItems = useMemo(() => {
    let items = ALL_ITEMS;

    // ティアでフィルター
    if (selectedTier !== 'all') {
      items = getItemsByTier(selectedTier);
    }

    // カテゴリでフィルター (Task 24)
    if (selectedCategory !== 'all') {
      items = getItemsByCategory(selectedCategory);
    }

    // ソート (Task 25)
    switch (sortType) {
      case 'price_asc':
        items = sortItemsByPrice(items, true);
        break;
      case 'price_desc':
        items = sortItemsByPrice(items, false);
        break;
      case 'attack_desc':
        items = sortItemsByAttack(items, false);
        break;
      case 'defense_desc':
        items = [...items].sort(
          (a, b) => (b.stats.defense || 0) - (a.stats.defense || 0)
        );
        break;
    }

    return items;
  }, [selectedTier, selectedCategory, sortType]);

  // ========================================
  // アイテム購入処理 (Task 26)
  // ========================================
  const handlePurchaseItem = (item: Item) => {
    if (!character) {
      alert('キャラクター情報が見つかりません');
      return;
    }

    // 所持金チェック (Task 26)
    if (!canPurchaseItem(characterId, item)) {
      alert(`ゴールドが不足しています（必要: ${item.cost}G）`);
      return;
    }

    // アイテムスロット数チェック（最大6個）
    if (character.items.length >= 6) {
      alert('アイテムスロットが満杯です');
      return;
    }

    // 購入実行
    const success = purchaseItem(characterId, item);
    if (success) {
      console.log(`Purchased item: ${item.name}`);
    } else {
      alert('アイテムの購入に失敗しました');
    }
  };

  if (!character) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* ヘッダー */}
        <div className="bg-gray-800 p-4 flex justify-between items-center border-b border-gray-700">
          <div>
            <h2 className="text-2xl font-bold">アイテムショップ</h2>
            <p className="text-sm text-gray-400">
              所持金: <span className="text-yellow-400 font-semibold">{character.gold}G</span>
              {' | '}
              アイテムスロット: {character.items.length}/6
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            閉じる
          </button>
        </div>

        {/* フィルター・ソート (Task 24-25) */}
        <div className="bg-gray-800/50 p-4 border-b border-gray-700 space-y-3">
          {/* ティアフィルター */}
          <div className="flex gap-2 items-center">
            <span className="text-sm text-gray-400 w-20">ティア:</span>
            <div className="flex gap-2 flex-wrap">
              {(['all', 'basic', 'advanced', 'legendary'] as const).map(
                (tier) => (
                  <button
                    key={tier}
                    onClick={() => setSelectedTier(tier)}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                      selectedTier === tier
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {tier === 'all'
                      ? '全て'
                      : tier === 'basic'
                      ? '基本'
                      : tier === 'advanced'
                      ? '上級'
                      : '伝説'}
                  </button>
                )
              )}
            </div>
          </div>

          {/* カテゴリフィルター (Task 24) */}
          <div className="flex gap-2 items-center">
            <span className="text-sm text-gray-400 w-20">カテゴリ:</span>
            <div className="flex gap-2 flex-wrap">
              {(
                [
                  'all',
                  'attack',
                  'defense',
                  'mobility',
                  'utility',
                  'hybrid',
                ] as const
              ).map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    selectedCategory === category
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {category === 'all'
                    ? '全て'
                    : category === 'attack'
                    ? '攻撃'
                    : category === 'defense'
                    ? '防御'
                    : category === 'mobility'
                    ? '機動力'
                    : category === 'utility'
                    ? '支援'
                    : '複合'}
                </button>
              ))}
            </div>
          </div>

          {/* ソート (Task 25) */}
          <div className="flex gap-2 items-center">
            <span className="text-sm text-gray-400 w-20">ソート:</span>
            <div className="flex gap-2 flex-wrap">
              {[
                { id: 'price_asc' as const, label: '価格（安い順）' },
                { id: 'price_desc' as const, label: '価格（高い順）' },
                { id: 'attack_desc' as const, label: '攻撃力順' },
                { id: 'defense_desc' as const, label: '防御力順' },
              ].map((sort) => (
                <button
                  key={sort.id}
                  onClick={() => setSortType(sort.id)}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    sortType === sort.id
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {sort.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* アイテム一覧 */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAndSortedItems.map((item) => {
              const canBuy = canPurchaseItem(characterId, item);
              const isOwned = character.items.some((i) => i.id === item.id);

              return (
                <div
                  key={item.id}
                  className={`bg-gray-800 rounded-lg p-4 border-2 transition-all ${
                    isOwned
                      ? 'border-green-500'
                      : canBuy
                      ? 'border-gray-700 hover:border-blue-500'
                      : 'border-gray-800 opacity-50'
                  }`}
                >
                  {/* アイテムヘッダー */}
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-lg">{item.name}</h3>
                      <div className="flex gap-2 mt-1">
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            item.tier === 'basic'
                              ? 'bg-gray-600'
                              : item.tier === 'advanced'
                              ? 'bg-blue-600'
                              : 'bg-purple-600'
                          }`}
                        >
                          {item.tier === 'basic'
                            ? '基本'
                            : item.tier === 'advanced'
                            ? '上級'
                            : '伝説'}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-gray-700">
                          {item.category === 'attack'
                            ? '攻撃'
                            : item.category === 'defense'
                            ? '防御'
                            : item.category === 'mobility'
                            ? '機動力'
                            : item.category === 'utility'
                            ? '支援'
                            : '複合'}
                        </span>
                      </div>
                    </div>
                    <div className="text-xl font-bold text-yellow-400">
                      {item.cost}G
                    </div>
                  </div>

                  {/* ステータス */}
                  <div className="space-y-1 mb-3 text-sm">
                    {(item.stats.attack || 0) > 0 && (
                      <div className="text-red-400">
                        攻撃力 +{item.stats.attack}
                      </div>
                    )}
                    {(item.stats.defense || 0) > 0 && (
                      <div className="text-blue-400">
                        防御力 +{item.stats.defense}
                      </div>
                    )}
                    {(item.stats.mobility || 0) > 0 && (
                      <div className="text-green-400">
                        機動力 +{item.stats.mobility}
                      </div>
                    )}
                    {(item.stats.utility || 0) > 0 && (
                      <div className="text-yellow-400">
                        支援力 +{item.stats.utility}
                      </div>
                    )}
                  </div>

                  {/* 効果 */}
                  {item.passiveEffect && (
                    <div className="text-xs text-gray-400 mb-2">
                      <span className="text-purple-400 font-semibold">
                        パッシブ:
                      </span>{' '}
                      {item.passiveEffect}
                    </div>
                  )}
                  {item.activeEffect && (
                    <div className="text-xs text-gray-400 mb-2">
                      <span className="text-orange-400 font-semibold">
                        アクティブ:
                      </span>{' '}
                      {item.activeEffect}
                    </div>
                  )}

                  {/* 購入ボタン (Task 26) */}
                  <button
                    onClick={() => handlePurchaseItem(item)}
                    disabled={!canBuy || isOwned || character.items.length >= 6}
                    className={`w-full py-2 rounded font-semibold text-sm transition-colors ${
                      isOwned
                        ? 'bg-green-600 cursor-default'
                        : canBuy && character.items.length < 6
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-gray-700 cursor-not-allowed opacity-50'
                    }`}
                  >
                    {isOwned
                      ? '所持中'
                      : character.items.length >= 6
                      ? 'スロット満杯'
                      : canBuy
                      ? '購入'
                      : 'ゴールド不足'}
                  </button>
                </div>
              );
            })}
          </div>

          {filteredAndSortedItems.length === 0 && (
            <div className="text-center text-gray-500 py-12">
              該当するアイテムがありません
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
