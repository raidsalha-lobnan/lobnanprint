import React, { useState } from 'react';
import { useAccounting } from '../../context/AccountingContext';
import { InventoryItem } from '../../types';
import { X, Star, Plus, Image as ImageIcon, Search } from 'lucide-react';
import { posSound } from '../../utils/audio';

interface FavoriteItemsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectItem: (item: InventoryItem) => void;
}

export const FavoriteItemsDrawer: React.FC<FavoriteItemsDrawerProps> = ({
  isOpen,
  onClose,
  onSelectItem
}) => {
  const { inventory, settings } = useAccounting();
  const [searchQuery, setSearchQuery] = useState('');

  // Default to favorites_only if there are favorite items
  const hasFavorites = (inventory || []).some(i => i.isFavorite);
  const [selectedCategory, setSelectedCategory] = useState<string>(hasFavorites ? 'favorites_only' : 'all');

  if (!isOpen) return null;

  const categories = [
    { id: 'favorites_only', label: '⭐ المفضلة فقط' },
    { id: 'all', label: 'جميع الأصناف' },
    { id: 'stationery', label: 'قرطاسية ومكتبية' },
    { id: 'books', label: 'كتب وملازم' },
    { id: 'copy_scan', label: 'تصوير ومستندات' },
    { id: 'shields_gifts', label: 'دروع وهدايا' },
    { id: 'print_service', label: 'خدمات طباعة' },
    { id: 'print_raw', label: 'خامات ومواد' }
  ];

  const filteredItems = (inventory || []).filter(item => {
    if (!item) return false;

    // Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const match =
        item.name.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        (item.barcode && item.barcode.includes(q));
      if (!match) return false;
    }

    // Category filter
    if (selectedCategory === 'favorites_only') {
      return item.isFavorite === true;
    }
    if (selectedCategory === 'all') {
      return true;
    }
    return (item.category as string) === selectedCategory;
  });

  const handlePickItem = (item: InventoryItem) => {
    posSound.playCashBeep();
    onSelectItem(item);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex justify-end">
      <div className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col border-r border-slate-200 animate-in slide-in-from-left duration-200">
        {/* Header */}
        <div className="bg-blue-800 text-white px-5 py-3.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-blue-700 rounded-lg shadow-inner">
              <Star className="w-5 h-5 text-amber-300 fill-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-sm">الأصناف والخدمات المفضلة للكاشير</h3>
              <p className="text-[11px] text-blue-200">عرض صور الأصناف والإضافة المباشرة للفاتورة بنقرة واحدة</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-blue-200 hover:text-white p-1.5 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-2.5 bg-slate-100 border-b border-slate-200">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="بحث في الأصناف بالاسم أو الكود أو الباركود..."
              className="w-full bg-white border border-slate-300 rounded-lg pr-8 pl-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Category filters */}
        <div className="p-2.5 bg-slate-50 border-b border-slate-200 flex gap-1.5 overflow-x-auto text-xs no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-semibold cursor-pointer transition-all ${
                selectedCategory === cat.id
                  ? 'bg-blue-700 text-white shadow-xs scale-102'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Item Cards Grid with Images */}
        <div className="p-3.5 flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-2 gap-3 bg-slate-50/50">
          {filteredItems.length === 0 ? (
            <div className="col-span-2 text-center py-12 text-slate-400">
              <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
                <Star className="w-7 h-7" />
              </div>
              <p className="text-sm font-semibold text-slate-600">لا توجد أصناف مطابقة</p>
              <p className="text-xs text-slate-400 mt-1">
                {selectedCategory === 'favorites_only'
                  ? 'يمكنك إضافة أي صنف للمفضلة بوضع علامة النجمة ⭐ عليه في شاشة المخزن.'
                  : 'جرب البحث باسم صنف آخر أو اختر قسماً مختلفاً.'}
              </p>
            </div>
          ) : (
            filteredItems.map(item => (
              <div
                key={item.id}
                onClick={() => handlePickItem(item)}
                className="bg-white border border-slate-200 hover:border-blue-500 hover:shadow-md p-2.5 rounded-xl flex flex-col justify-between cursor-pointer transition-all group relative overflow-hidden active:scale-98"
              >
                {/* Item Image Display */}
                <div className="relative w-full h-28 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 mb-2">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-linear-to-b from-slate-50 to-slate-100">
                      <ImageIcon className="w-7 h-7 text-slate-300 mb-1" />
                      <span className="text-[10px] text-slate-400 font-medium">بدون صورة</span>
                    </div>
                  )}

                  {/* Favorite Star Badge */}
                  {item.isFavorite && (
                    <span className="absolute top-1.5 right-1.5 bg-amber-400 text-amber-950 rounded-full p-1 shadow-xs" title="صنف مفضل">
                      <Star className="w-3 h-3 fill-amber-950" />
                    </span>
                  )}

                  {/* Code Badge */}
                  <span className="absolute bottom-1 left-1 bg-slate-900/75 text-white font-mono font-bold text-[9px] px-1.5 py-0.5 rounded backdrop-blur-2xs">
                    {item.code}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-1 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="text-[9px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded font-medium inline-block">
                        {item.unit || 'حبة'}
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono">
                        رصيد: {item.stockQuantity}
                      </span>
                    </div>
                    <h4 className="font-bold text-xs text-slate-900 line-clamp-2 leading-snug group-hover:text-blue-700 transition-colors">
                      {item.name}
                    </h4>
                  </div>

                  <div className="mt-2.5 pt-1.5 border-t border-slate-100 flex items-center justify-between">
                    <span className="font-mono font-black text-blue-700 text-xs">
                      {item.sellingPrice.toFixed(2)} {settings.currency}
                    </span>
                    <div className="p-1.5 bg-blue-50 text-blue-700 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-2xs">
                      <Plus className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-600">
          <span className="font-medium">
            عدد الأصناف المعروضة: <strong className="text-slate-900 font-mono">{filteredItems.length}</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg cursor-pointer transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
