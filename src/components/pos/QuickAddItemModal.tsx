import React, { useState, useEffect } from 'react';
import { useAccounting } from '../../context/AccountingContext';
import { InventoryItem } from '../../types';
import { ItemUnitSelector } from '../ItemUnitSelector';
import { X, Plus, Sparkles, Check } from 'lucide-react';

interface QuickAddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemCreatedAndAdd?: (item: InventoryItem) => void;
  initialName?: string;
}

export const QuickAddItemModal: React.FC<QuickAddItemModalProps> = ({
  isOpen,
  onClose,
  onItemCreatedAndAdd,
  initialName = ''
}) => {
  const { addInventoryItem, settings } = useAccounting();

  const [name, setName] = useState(initialName);
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState<string>('office_supplies');
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [stockQuantity, setStockQuantity] = useState<number>(10);
  const [unit, setUnit] = useState<string>('قطعة');
  const [autoAdd, setAutoAdd] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen) {
      setName(initialName || '');
    }
  }, [isOpen, initialName]);

  if (!isOpen) return null;

  const generateBarcode = () => {
    const randomCode = '628' + Math.floor(10000000 + Math.random() * 90000000);
    setBarcode(randomCode);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newItem: Omit<InventoryItem, 'id'> = {
      code: 'ITM-' + Math.floor(1000 + Math.random() * 9000),
      name: name.trim(),
      barcode: barcode.trim() || ('628' + Date.now().toString().slice(-8)),
      category: category as any,
      purchasePrice: Number(purchasePrice) || 0,
      sellingPrice: Number(sellingPrice) || 0,
      stockQuantity: Number(stockQuantity) || 0,
      minAlertQuantity: 5,
      unit: unit || 'قطعة'
    };

    addInventoryItem(newItem);

    if (autoAdd && onItemCreatedAndAdd) {
      onItemCreatedAndAdd({
        ...newItem,
        id: 'inv-' + Date.now()
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full overflow-hidden text-slate-800 flex flex-col">
        <div className="bg-purple-700 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-600 rounded-xl">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base">إضافة صنف جديد سريعاً</h3>
              <p className="text-xs text-purple-200">إدراج الصنف في المخزون والفاتورة مباشرة بأعلى دقة ووضوح</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-purple-200 hover:text-white p-1.5 rounded-lg hover:bg-purple-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs overflow-y-auto flex-1">
          {/* Row 1: Name and Barcode */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5 text-xs">اسم الصنف أو الخدمة *</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="مثال: مطبوعات جلدية فاخرة أو ورق تصوير A4"
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-slate-50 focus:bg-white"
              />
            </div>

            {/* Barcode */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5 text-xs">الباركود الدولي أو المحلي</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={barcode}
                  onChange={e => setBarcode(e.target.value)}
                  placeholder="امسح بالباركود أو اضغط توليد"
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-mono bg-slate-50 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={generateBarcode}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-4 py-2 rounded-xl flex items-center gap-1.5 font-semibold cursor-pointer shrink-0"
                >
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>توليد باركود</span>
                </button>
              </div>
            </div>
          </div>

          {/* Row 2: Category & Unit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1.5 text-xs">التصنيف</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs bg-slate-50"
              >
                <option value="office_supplies">أدوات مكتبية ومدرسية</option>
                <option value="printing_paper">ورق ومواد طباعة</option>
                <option value="copy_scan">خدمات تصوير وتصميم</option>
                <option value="gifts">هدايا ودروع تذكارية</option>
                <option value="packaging">تغليف وتجليد</option>
                <option value="other">أصناف أخرى</option>
              </select>
            </div>
            <div>
              <ItemUnitSelector
                value={unit}
                onChange={setUnit}
                label="وحدة القياس"
                placeholder="اختر أو اكتب الوحدة..."
                showQuickPills={true}
              />
            </div>
          </div>

          {/* Row 3: Pricing & Stock */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1.5 text-xs">سعر التكلفة ({settings.currency})</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={purchasePrice || ''}
                onChange={e => setPurchasePrice(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-mono bg-slate-50"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1.5 text-xs">سعر البيع ({settings.currency}) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={sellingPrice || ''}
                onChange={e => setSellingPrice(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full border border-purple-300 ring-1 ring-purple-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-purple-700 bg-purple-50/50"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1.5 text-xs">الرصيد الافتتاحي</label>
              <input
                type="number"
                min="0"
                value={stockQuantity || ''}
                onChange={e => setStockQuantity(parseInt(e.target.value) || 0)}
                placeholder="10"
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-mono bg-slate-50"
              />
            </div>
          </div>

          <div className="pt-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={autoAdd}
                onChange={e => setAutoAdd(e.target.checked)}
                className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
              />
              <span className="font-semibold text-slate-800">إضافة هذا الصنف مباشرة إلى جدول الفاتورة بعد الحفظ</span>
            </label>
          </div>

          <div className="flex gap-3 pt-3 border-t border-slate-200">
            <button
              type="submit"
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-2 transition-colors text-sm"
            >
              <Check className="w-5 h-5" />
              <span>حفظ الصنف</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl cursor-pointer text-sm"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
