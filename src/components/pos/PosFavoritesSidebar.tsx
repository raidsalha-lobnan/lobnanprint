import React, { useState, useMemo, useEffect } from 'react';
import { useAccounting } from '../../context/AccountingContext';
import { InventoryItem, ItemCategory } from '../../types';
import { CATEGORY_DEFINITIONS } from '../../utils/barcodeGenerator';
import {
  Star,
  Plus,
  Image as ImageIcon,
  Search,
  ChevronRight,
  ChevronLeft,
  Filter,
  Check,
  Package,
  Layers,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { posSound } from '../../utils/audio';

interface PosFavoritesSidebarProps {
  onSelectItem: (item: InventoryItem) => void;
  className?: string;
}

export const PosFavoritesSidebar: React.FC<PosFavoritesSidebarProps> = ({
  onSelectItem,
  className = ''
}) => {
  const { inventory, updateInventoryItem } = useAccounting();
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('pos_favorites_show_only_favs');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('pos_favorites_sidebar_collapsed');
      return saved !== null ? saved === 'true' : false;
    } catch {
      return false;
    }
  });

  const handleSetCollapsed = (val: boolean) => {
    setIsCollapsed(val);
    try {
      localStorage.setItem('pos_favorites_sidebar_collapsed', String(val));
    } catch {}
  };

  const handleToggleShowOnlyFavorites = () => {
    setShowOnlyFavorites(prev => {
      const next = !prev;
      try {
        localStorage.setItem('pos_favorites_show_only_favs', String(next));
      } catch {}
      return next;
    });
  };

  // 1. استخراج التصنيفات ديناميكياً: كل تصنيف مضاف في الأصناف يتواجد له زر في المفضلة
  const categories = useMemo(() => {
    // جميع التصنيفات المتواجدة فعلياً في الأصناف بالمخزون
    const inventoryCats = Array.from(
      new Set((inventory || []).map(i => i.category).filter(Boolean))
    ) as string[];

    // التصنيفات الأساسية المعرفة بالنظام
    const standardKeys = [
      'stationery',
      'books',
      'print_raw',
      'print_service',
      'copy_scan',
      'shields_gifts'
    ];

    // دمج التصنيفات الأساسية أولاً ثم أي تصنيف مضاف جديد
    const allKeys = Array.from(new Set([...standardKeys, ...inventoryCats]));

    return allKeys
      .map(catKey => {
        const def = CATEGORY_DEFINITIONS[catKey as ItemCategory];
        const name = def?.name || catKey;
        const catItems = (inventory || []).filter(i => i.category === catKey);
        const favItems = catItems.filter(i => i.isFavorite === true);

        return {
          id: catKey,
          name,
          totalCount: catItems.length,
          favCount: favItems.length,
          prefix: def?.prefix || 'ITM'
        };
      })
      // إظهار التصنيف إذا كان به أصناف أو ضمن التصنيفات الأساسية
      .filter(c => c.totalCount > 0 || standardKeys.includes(c.id));
  }, [inventory]);

  // 2. أول تصنيف يكون هو الظاهر مجرد فتح الكاشير تلقائياً
  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    return categories[0]?.id || 'stationery';
  });

  // التأكد من أن التصنيف المختار صالح وموجود دائماً (أول تصنيف افتراضياً)
  useEffect(() => {
    if (categories.length > 0 && !categories.some(c => c.id === selectedCategory)) {
      setSelectedCategory(categories[0].id);
    }
  }, [categories, selectedCategory]);

  const activeCategoryObj = categories.find(c => c.id === selectedCategory) || categories[0];

  // 3. كل تصنيف يتضمن الأصناف التي تم اختيارها لتكون ضمن المفضلة
  const categoryItems = useMemo(() => {
    return (inventory || []).filter(item => item.category === selectedCategory);
  }, [inventory, selectedCategory]);

  const displayedItems = useMemo(() => {
    return categoryItems.filter(item => {
      if (!item) return false;

      // فلترة المفضلة فقط حسب طلب المستخدم (مع إمكانية عرض جميع أصناف التصنيف لاختيار المفضلة)
      if (showOnlyFavorites && !item.isFavorite) {
        return false;
      }

      // البحث السريع
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          item.name.toLowerCase().includes(q) ||
          item.code.toLowerCase().includes(q) ||
          (item.barcode && item.barcode.includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [categoryItems, showOnlyFavorites, searchQuery]);

  // إضافة الصنف لجدول الفاتورة فور النقر عليه
  const handlePickItem = (item: InventoryItem) => {
    posSound.playCashBeep();
    onSelectItem(item);
  };

  // تبديل حالة المفضلة للصنف بنقرة واحدة
  const handleToggleFavorite = (e: React.MouseEvent, item: InventoryItem) => {
    e.stopPropagation();
    const nextState = !item.isFavorite;
    updateInventoryItem(item.id, { isFavorite: nextState });
    posSound.beep();
  };

  // إذا تم تصغير الشريط
  if (isCollapsed) {
    return (
      <div className="bg-[#1f4a7c] text-white border border-[#173a62] rounded-xl p-2 flex flex-row lg:flex-col items-center justify-between shadow-md shrink-0 w-full lg:w-11 py-2 lg:py-3 transition-all order-first">
        <button
          type="button"
          onClick={() => handleSetCollapsed(false)}
          className="p-1.5 bg-amber-400 text-amber-950 rounded-lg hover:bg-amber-300 transition-colors shadow-xs cursor-pointer flex items-center gap-1"
          title="فتح شريط المفضلة السريعة"
        >
          <ChevronLeft className="w-4 h-4 hidden lg:block" />
          <Star className="w-4 h-4 lg:hidden fill-amber-950" />
          <span className="text-[11px] font-bold lg:hidden">فتح المفضلة والتصنيفات</span>
        </button>
        <div className="lg:my-auto lg:py-6 font-bold text-xs tracking-wider text-blue-200 flex items-center gap-1.5 lg:[writing-mode:vertical-rl]">
          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 hidden lg:inline" />
          <span className="hidden lg:inline">مفضلة الكاشير</span>
        </div>
        <span className="text-[10px] font-mono bg-blue-900/90 px-1.5 py-0.5 rounded text-amber-300 font-bold">
          ⭐ {(inventory || []).filter(i => i.isFavorite).length}
        </span>
      </div>
    );
  }

  return (
    <div
      id="pos-favorites-sidebar"
      className={`bg-white rounded-xl border border-slate-300 shadow-sm flex flex-col overflow-hidden shrink-0 select-none ${className}`}
    >
      {/* 1. Header: عنوان المفضلة وزر التصغير */}
      <div className="bg-[#1f4a7c] text-white px-3 py-2 flex items-center justify-between border-b border-blue-900 shadow-2xs">
        <div className="flex items-center gap-1.5">
          <div className="p-1 bg-amber-400 text-amber-950 rounded-lg shadow-inner">
            <Star className="w-3.5 h-3.5 fill-amber-950" />
          </div>
          <div>
            <h3 className="font-bold text-xs tracking-wide">مفضلة الكاشير</h3>
            <span className="text-[10px] text-blue-200 block">
              أصناف مفضلة بنقرة واحدة
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* عداد الأصناف */}
          <span className="text-[10px] bg-blue-900/80 text-amber-300 font-mono font-bold px-2 py-0.5 rounded">
            {displayedItems.length} صنف
          </span>

          {/* زر تصغير الشريط */}
          <button
            type="button"
            onClick={() => handleSetCollapsed(true)}
            className="text-blue-200 hover:text-white p-1 rounded hover:bg-blue-800 transition-colors cursor-pointer"
            title="تصغير شريط المفضلة"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. أزرار التصنيفات: كل تصنيف يضاف في الأصناف يتواجد زر في المفضلة مقابله */}
      <div className="bg-[#f0f4f9] p-2 border-b border-slate-200">
        <div className="flex items-center justify-between mb-1.5 px-0.5 text-[11px]">
          <span className="font-bold text-slate-700 flex items-center gap-1">
            <Layers className="w-3 h-3 text-blue-700" />
            <span>أزرار التصنيفات:</span>
          </span>
          <span className="text-[9px] text-slate-400 font-light font-medium">
            (أول تصنيف ظاهر تلقائياً)
          </span>
        </div>

        {/* شبكة أزرار التصنيفات واضحة وجذابة */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-28 overflow-y-auto pr-0.5 custom-scrollbar">
          {categories.map(cat => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat.id);
                  posSound.click();
                }}
                className={`px-2 py-1.5 rounded-lg text-xs font-bold text-right transition-all flex items-center justify-between cursor-pointer border ${
                  isActive
                    ? 'bg-[#1f4a7c] text-white border-[#173a62] shadow-xs scale-[1.02] ring-1 ring-blue-400/50'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                }`}
                title={`تصنيف: ${cat.name} (${cat.favCount} مفضل / ${cat.totalCount} إجمالي)`}
              >
                <span className="truncate ml-1">{cat.name}</span>
                <span
                  className={`text-[10px] font-mono px-1 py-0.2 rounded shrink-0 ${
                    isActive
                      ? 'bg-amber-400 text-amber-950 font-black'
                      : 'bg-slate-100 text-slate-600 font-semibold'
                  }`}
                >
                  ⭐{cat.favCount}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. شريط البحث السريع والتبديل بين المفضلة وكل أصناف التصنيف */}
      <div className="p-2 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={`بحث في أصناف "${activeCategoryObj?.name || 'التصنيف'}"...`}
            className="w-full bg-white border border-slate-300 rounded-lg pr-7 pl-6 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-2 top-1 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* زر التبديل بين المفضلة فقط أو جميع أصناف التصنيف لتحديد المفضلة */}
        <button
          type="button"
          onClick={handleToggleShowOnlyFavorites}
          className={`px-2 py-1 rounded-lg text-[11px] font-bold shrink-0 flex items-center gap-1 border cursor-pointer transition-colors ${
            showOnlyFavorites
              ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
              : 'bg-blue-50 text-blue-900 border-blue-300 hover:bg-blue-100'
          }`}
          title={
            showOnlyFavorites
              ? 'عرض الأصناف المفضلة فقط بهذا التصنيف (انقر لعرض كل أصناف التصنيف لاختيار المفضلة)'
              : 'عرض كل أصناف التصنيف لتحديد المفضلة بالنجمة ⭐'
          }
        >
          <Star
            className={`w-3 h-3 ${
              showOnlyFavorites ? 'fill-amber-500 text-amber-500' : 'text-slate-400'
            }`}
          />
          <span>{showOnlyFavorites ? 'المفضلة ⭐' : 'كل الأصناف'}</span>
        </button>
      </div>

      {/* 4. شبكة الأصناف المفضلة التابعة للتصنيف المختار مع إظهار صورة الصنف */}
      <div className="flex-1 overflow-y-auto p-2 bg-slate-100/60 custom-scrollbar">
        {displayedItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-400 space-y-2">
            <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 shadow-inner">
              <Star className="w-6 h-6 text-amber-400 fill-amber-300/40" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-700">
                {showOnlyFavorites
                  ? `لا توجد أصناف مفضلة محددة في تصنيف "${activeCategoryObj?.name || ''}"`
                  : 'لا توجد أصناف تطابق البحث في هذا التصنيف'}
              </p>
              <p className="text-[9px] text-slate-400 font-light mt-1 max-w-[220px]">
                {showOnlyFavorites
                  ? 'يمكنك استعراض كل أصناف التصنيف والضغط على النجمة ⭐ لإضافتها لمفضلتك فوراً.'
                  : 'جرب كلمة بحث أخرى أو أضف صنفاً جديداً لهذا التصنيف.'}
              </p>
            </div>

            {showOnlyFavorites && categoryItems.length > 0 && (
              <button
                type="button"
                onClick={() => setShowOnlyFavorites(false)}
                className="mt-2 px-3 py-1.5 bg-[#1f4a7c] hover:bg-[#183a62] text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 text-amber-300" />
                <span>عرض أصناف التصنيف لاختيار المفضلة ({categoryItems.length} صنف)</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {displayedItems.map(item => {
              const isFav = item.isFavorite === true;
              return (
                <div
                  key={item.id}
                  onClick={() => handlePickItem(item)}
                  className="bg-white border border-slate-200 hover:border-blue-500 hover:shadow-md rounded-xl p-2 flex flex-col justify-between cursor-pointer transition-all group relative overflow-hidden active:scale-98"
                  title={`${item.name} - ${item.sellingPrice.toFixed(2)} ₪ (انقر للإضافة إلى الفاتورة)`}
                >
                  {/* حاوية صورة الصنف مع تظهير النجمة وحالة المخزون */}
                  <div className="relative w-full h-22 sm:h-24 bg-slate-50 rounded-lg overflow-hidden border border-slate-200 mb-1.5 flex items-center justify-center">
                    {/* و تظهر صورة الصنف إذا كانت موجودة ضمن الصنف */}
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        onError={(e) => {
                          // إخفاء الصورة المعطوبة واستبدالها بالرمز التعبيري الافتراضي
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-300 p-2">
                        <ImageIcon className="w-6 h-6 mb-1 text-slate-400" />
                        <span className="text-[9px] font-mono text-slate-400 font-bold">
                          {item.code}
                        </span>
                      </div>
                    )}

                    {/* زر النجمة لتحديد / إلغاء المفضلة بالصنف */}
                    <button
                      type="button"
                      onClick={e => handleToggleFavorite(e, item)}
                      title={isFav ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
                      className={`absolute top-1 right-1 p-1 rounded-full shadow-xs transition-all cursor-pointer ${
                        isFav
                          ? 'bg-amber-400 text-amber-950 hover:bg-amber-300 hover:scale-110 ring-1 ring-amber-500/50'
                          : 'bg-black/45 text-white hover:bg-amber-400 hover:text-amber-950'
                      }`}
                    >
                      <Star className={`w-3 h-3 ${isFav ? 'fill-amber-950' : ''}`} />
                    </button>

                    {/* رصيد المخزون */}
                    <span
                      className={`absolute bottom-1 left-1 text-[9px] font-mono px-1.5 py-0.2 rounded font-bold ${
                        item.stockQuantity <= item.minAlertQuantity
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-900/75 text-white'
                      }`}
                    >
                      {item.stockQuantity} {item.unit || 'حبة'}
                    </span>
                  </div>

                  {/* تفاصيل الصنف: الاسم والسعر وزر الإضافة */}
                  <div className="flex-1 flex flex-col justify-between">
                    <h4 className="font-bold text-[11px] text-slate-900 line-clamp-2 leading-tight group-hover:text-blue-700 transition-colors mb-1">
                      {item.name}
                    </h4>

                    <div className="pt-1 border-t border-slate-100 flex items-center justify-between">
                      <span className="font-mono font-black text-blue-700 text-xs sm:text-sm">
                        {item.sellingPrice.toFixed(2)} ₪
                      </span>
                      <span className="p-1 bg-blue-50 text-blue-700 rounded-md group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <Plus className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Footer: معلومات سريعة */}
      <div className="p-2 bg-slate-100 border-t border-slate-200 text-[10px] text-slate-600 flex items-center justify-between">
        <span className="flex items-center gap-1 font-semibold">
          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
          <span>
            {activeCategoryObj?.name}: {activeCategoryObj?.favCount || 0} مفضل
          </span>
        </span>
        <span className="text-slate-500">انقر على الصنف لإضافته للفاتورة</span>
      </div>
    </div>
  );
};
