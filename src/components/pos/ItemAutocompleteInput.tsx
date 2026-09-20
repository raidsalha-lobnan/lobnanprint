import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { InventoryItem, ItemCategory } from '../../types';
import { Search, Plus, CheckCircle2, AlertCircle, Package, Layers, Tag, ExternalLink, Star, Image as ImageIcon } from 'lucide-react';
import { matchItemByBarcode, getAllItemBarcodes } from '../../utils/barcodeGenerator';
import { useAccounting } from '../../context/AccountingContext';

interface ItemAutocompleteInputProps {
  value: string;
  lineId: string;
  inventoryItemId?: string;
  barcode?: string;
  inventory: InventoryItem[];
  pricingTier: 'retail' | 'wholesale' | 'special';
  currency: string;
  onChangeText: (text: string) => void;
  onSelectItem: (item: InventoryItem) => void;
  onQuickAdd?: (nameQuery: string) => void;
  onOpenSearchModal?: () => void;
  placeholder?: string;
  isActiveRow?: boolean;
}

// Arabic normalization helper for resilient searching
function normalizeArabic(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[\u064B-\u065F\u0670]/g, '') // remove Tashkeel
    .replace(/[إأآا]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/[يى]/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي');
}

// Category translation labels
function getCategoryLabel(cat?: string): string {
  switch (cat) {
    case 'books':
      return 'كتب';
    case 'stationery':
      return 'قرطاسية';
    case 'office_supplies':
      return 'مكتبية';
    case 'print_raw':
      return 'خامات مطبعة';
    case 'copy_scan':
      return 'تصوير وخدمات';
    case 'shields_gifts':
      return 'دروع وهدايا';
    case 'uniforms':
      return 'أزياء ومرايل';
    default:
      return 'أصناف';
  }
}

export const ItemAutocompleteInput: React.FC<ItemAutocompleteInputProps> = ({
  value,
  lineId,
  inventoryItemId,
  barcode,
  inventory,
  pricingTier,
  currency,
  onChangeText,
  onSelectItem,
  onQuickAdd,
  onOpenSearchModal,
  placeholder = 'اسم الصنف أو الخدمة...',
  isActiveRow = false
}) => {
  const { updateInventoryItem } = useAccounting();
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; showAbove: boolean } | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Matched registered inventory item if already linked
  const linkedItem = useMemo(() => {
    if (!inventoryItemId && !barcode) return null;
    return (inventory || []).find(i => (inventoryItemId && i.id === inventoryItemId) || (barcode && matchItemByBarcode(i, barcode)));
  }, [inventory, inventoryItemId, barcode]);

  // Compute matching inventory items
  const matches = useMemo(() => {
    if (!inventory || inventory.length === 0) return [];

    const normQuery = normalizeArabic(value);
    const rawQuery = (value || '').trim().toLowerCase();

    if (!normQuery) {
      // If query is empty, show the first 12 registered items as recommendations
      return inventory.slice(0, 12);
    }

    const filtered = inventory.filter(it => {
      if (!it) return false;
      const normName = normalizeArabic(it.name || '');
      const code = (it.code || '').toLowerCase();
      const bcode = (it.barcode || '').toLowerCase();
      const cat = (it.category || '').toLowerCase();
      const catLabel = normalizeArabic(getCategoryLabel(it.category));
      const hasMultiBarcodeMatch =
        (it.additionalBarcodes && it.additionalBarcodes.some(b => b.toLowerCase().includes(rawQuery))) ||
        (it.barcodeEntries && it.barcodeEntries.some(b => b.barcode.toLowerCase().includes(rawQuery) || (b.label && b.label.toLowerCase().includes(rawQuery))));

      return (
        normName.includes(normQuery) ||
        bcode.includes(rawQuery) ||
        hasMultiBarcodeMatch ||
        code.includes(rawQuery) ||
        cat.includes(rawQuery) ||
        catLabel.includes(normQuery)
      );
    });

    // Sort: exact matches first, then prefix matches, then substring
    filtered.sort((a, b) => {
      const aNorm = normalizeArabic(a.name || '');
      const bNorm = normalizeArabic(b.name || '');
      const aStarts = aNorm.startsWith(normQuery);
      const bStarts = bNorm.startsWith(normQuery);

      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return aNorm.localeCompare(bNorm);
    });

    return filtered.slice(0, 12);
  }, [inventory, value]);

  // Update floating dropdown coordinates
  const updatePosition = useCallback(() => {
    if (!inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const estimatedHeight = 310;
    const showAbove = spaceBelow < estimatedHeight && rect.top > estimatedHeight;

    setCoords({
      top: showAbove ? rect.top - 6 : rect.bottom + 4,
      left: Math.max(10, Math.min(rect.left, window.innerWidth - 440)),
      width: Math.max(rect.width, 420),
      showAbove
    });
  }, []);

  // Update position on window scroll or resize
  useEffect(() => {
    if (!isOpen) return;
    updatePosition();

    const handleScrollOrResize = () => {
      updatePosition();
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen, updatePosition]);

  // Handle outside clicks to close dropdown
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Select an item from the suggestions
  const handleSelect = (item: InventoryItem) => {
    onSelectItem(item);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  // Keyboard navigation inside input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        updatePosition();
        setHighlightedIndex(0);
      } else if (matches.length > 0) {
        setHighlightedIndex(prev => (prev < matches.length - 1 ? prev + 1 : 0));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (isOpen && matches.length > 0) {
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : matches.length - 1));
      }
    } else if (e.key === 'Enter') {
      if (isOpen && highlightedIndex >= 0 && highlightedIndex < matches.length) {
        e.preventDefault();
        handleSelect(matches[highlightedIndex]);
      } else if (isOpen && matches.length === 1 && normalizeArabic(matches[0].name) === normalizeArabic(value)) {
        e.preventDefault();
        handleSelect(matches[0]);
      }
    } else if (e.key === 'Tab') {
      if (isOpen && highlightedIndex >= 0 && highlightedIndex < matches.length) {
        handleSelect(matches[highlightedIndex]);
      } else if (isOpen && matches.length === 1 && normalizeArabic(matches[0].name) === normalizeArabic(value)) {
        handleSelect(matches[0]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  // Calculate pricing tier for item
  const getItemPrice = (item: InventoryItem) => {
    return pricingTier === 'wholesale'
      ? Number((item.sellingPrice * 0.9).toFixed(2))
      : item.sellingPrice;
  };

  return (
    <div ref={containerRef} className="relative w-full flex items-center">
      {/* Search Input with visual inventory link indicator */}
      <div className="relative w-full flex items-center">
        <input
          id={`item-input-${lineId}`}
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => {
            onChangeText(e.target.value);
            if (!isOpen) {
              setIsOpen(true);
              updatePosition();
            }
            setHighlightedIndex(0);
          }}
          onFocus={() => {
            setIsOpen(true);
            updatePosition();
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full pr-2 pl-7 py-1 bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white rounded font-bold text-slate-900 text-xs transition-colors ${
            linkedItem ? 'text-blue-900' : ''
          }`}
        />

        {/* Action / Linked badge icon on the left edge */}
        <div className="absolute left-1 flex items-center gap-1">
          {linkedItem ? (
            <span
              title={`مرتبط بصنف مخزون مسجل: ${linkedItem.name} (متوفر: ${linkedItem.stockQuantity} ${linkedItem.unit})`}
              className="text-emerald-600 hover:text-emerald-700 cursor-pointer flex items-center"
              onClick={e => {
                e.stopPropagation();
                setIsOpen(prev => !prev);
                updatePosition();
              }}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </span>
          ) : (
            <button
              type="button"
              tabIndex={-1}
              onClick={e => {
                e.stopPropagation();
                inputRef.current?.focus();
                setIsOpen(prev => !prev);
                updatePosition();
              }}
              title="البحث في الأصناف المخزنة"
              className="text-slate-400 hover:text-blue-600 p-0.5 rounded cursor-pointer transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Floating Suggestions Dropdown (Rendered in Portal to prevent clipping) */}
      {isOpen &&
        coords &&
        createPortal(
          <div
            ref={dropdownRef}
            dir="rtl"
            style={{
              position: 'fixed',
              top: coords.showAbove ? undefined : coords.top,
              bottom: coords.showAbove ? window.innerHeight - coords.top : undefined,
              left: coords.left,
              width: coords.width,
              zIndex: 99999
            }}
            className="bg-white rounded-xl shadow-2xl border border-blue-400 overflow-hidden text-slate-800 text-xs animate-in fade-in zoom-in-95 duration-100 ring-4 ring-blue-500/15"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white px-3 py-2 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-1.5">
                <Package className="w-4 h-4 text-blue-200" />
                <span className="font-bold text-xs">الأصناف المسجلة بالمخزن</span>
                <span className="bg-blue-500/50 text-blue-100 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                  {matches.length} صنف
                </span>
              </div>
              <div className="text-[10px] text-blue-200 flex items-center gap-1">
                <span>↑↓ للتنقل</span>
                <span>•</span>
                <span>Enter للاختيار</span>
                <span>•</span>
                <span>Esc للإغلاق</span>
              </div>
            </div>

            {/* List of items */}
            <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
              {matches.length === 0 ? (
                <div className="p-4 text-center">
                  <div className="text-amber-600 font-semibold text-xs mb-1 flex items-center justify-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>لم يتم العثور على صنف مطابق لـ "{value}"</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-light mb-3">
                    يمكنك إبقاء الاسم كما كتبته أو إضافة صنف جديد للمخزون فوراً.
                  </p>
                  {onQuickAdd && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        onQuickAdd(value);
                      }}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 mx-auto shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إضافة "{value}" كصنف جديد للمخزون</span>
                    </button>
                  )}
                </div>
              ) : (
                matches.map((item, idx) => {
                  const isHighlighted = idx === highlightedIndex;
                  const itemPrice = getItemPrice(item);
                  const isOutOfStock = (item.stockQuantity ?? 0) <= 0;
                  const isLowStock = !isOutOfStock && (item.stockQuantity ?? 0) <= (item.minAlertQuantity ?? 5);

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      className={`p-2 transition-colors cursor-pointer flex items-center justify-between ${
                        isHighlighted
                          ? 'bg-blue-50 border-r-4 border-blue-600 font-semibold'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Item Thumbnail */}
                      <div className="relative shrink-0 ml-2">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-9 h-9 object-cover rounded-md border border-slate-200 shadow-2xs"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-300">
                            <ImageIcon className="w-4 h-4" />
                          </div>
                        )}
                        {/* Interactive Star Toggle */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateInventoryItem(item.id, { isFavorite: !item.isFavorite });
                          }}
                          className={`absolute -top-1 -right-1 rounded-full p-0.5 shadow-xs transition-transform hover:scale-125 cursor-pointer ${
                            item.isFavorite ? 'bg-amber-400 text-amber-950' : 'bg-slate-200/80 text-slate-400 hover:text-amber-500'
                          }`}
                          title={item.isFavorite ? 'صنف مفضل (انقر للإلغاء)' : 'إضافة إلى المفضلة'}
                        >
                          <Star className={`w-2.5 h-2.5 ${item.isFavorite ? 'fill-amber-950' : ''}`} />
                        </button>
                      </div>

                      {/* Item Info */}
                      <div className="flex-1 min-w-0 pr-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-bold truncate ${isHighlighted ? 'text-blue-950' : 'text-slate-900'}`}>
                            {item.name}
                          </span>
                          {item.isFavorite && (
                            <span className="text-[10px] text-amber-600 font-semibold flex items-center gap-0.5 shrink-0">
                              <Star className="w-2.5 h-2.5 fill-amber-400" />
                              <span>مفضل</span>
                            </span>
                          )}
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium shrink-0 mr-auto">
                            {getCategoryLabel(item.category)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 font-light font-mono">
                          {item.barcode && (
                            <span className="flex items-center gap-0.5 text-slate-600">
                              <span className="text-[10px] text-slate-400">باركود:</span>
                              <span>{item.barcode}</span>
                            </span>
                          )}
                          {(item.barcodeEntries?.length || item.additionalBarcodes?.length) ? (
                            <span className="bg-sky-50 text-sky-700 text-[9px] px-1 py-0.2 rounded font-sans">
                              +{(item.barcodeEntries?.length || item.additionalBarcodes?.length)} بديل
                            </span>
                          ) : null}
                          {item.code && (
                            <span className="text-slate-400 text-[10px]">
                              [{item.code}]
                            </span>
                          )}
                          {/* Stock Status Badge */}
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                              isOutOfStock
                                ? 'bg-rose-100 text-rose-700'
                                : isLowStock
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {isOutOfStock
                              ? 'نفذ من المخزن'
                              : `متوفر: ${item.stockQuantity} ${item.unit || 'قطعة'}`}
                          </span>
                        </div>
                      </div>

                      {/* Selling Price */}
                      <div className="text-left pl-2 shrink-0">
                        <div className="font-mono font-black text-sm text-blue-700">
                          {itemPrice.toFixed(2)}
                          <span className="text-[10px] font-sans font-normal text-slate-500 mr-1">
                            {currency}
                          </span>
                        </div>
                        {pricingTier === 'wholesale' && (
                          <div className="text-[9px] text-emerald-600 font-bold">
                            سعر بيع 1
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Actions Bar */}
            <div className="bg-slate-50 border-t border-slate-200 px-3 py-2 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                {onQuickAdd && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onQuickAdd(value);
                    }}
                    className="text-blue-700 hover:text-blue-900 hover:underline flex items-center gap-1 font-bold text-[11px] cursor-pointer"
                  >
                    <Plus className="w-3 h-3 text-blue-600" />
                    <span>صنف جديد للمخزون</span>
                  </button>
                )}
                {onOpenSearchModal && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onOpenSearchModal();
                    }}
                    className="text-slate-600 hover:text-slate-800 hover:underline flex items-center gap-1 text-[11px] cursor-pointer mr-2 border-r border-slate-300 pr-2"
                  >
                    <Search className="w-3 h-3 text-slate-500" />
                    <span>بحث شامل (F3)</span>
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-[11px] text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                إغلاق (Esc)
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
