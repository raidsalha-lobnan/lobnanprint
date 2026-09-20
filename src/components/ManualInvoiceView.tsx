import React, { useState, useRef, useEffect } from 'react';
import { DateInput } from '../components/common/DateInput';
import { useAccounting } from '../context/AccountingContext';
import { Printer, Save, Plus, Trash2 } from 'lucide-react';
import { OfficialStamp } from './common/OfficialStamp';


export const ManualInvoiceView: React.FC = () => {
    const { settings, addPosInvoice, invoices, inventory, parties } = useAccounting();
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [sellerName, setSellerName] = useState(settings?.companyName || '');
  const [sellerPhone, setSellerPhone] = useState(settings?.phone || '');
  const [sellerAddress, setSellerAddress] = useState(settings?.address || '');
  
  const [items, setItems] = useState(
    Array(12).fill(null).map(() => ({ name: '', itemNotes: '', qty: '', price: '', total: 0 }))
  );
  
  const [notes, setNotes] = useState('');
  const [discount, setDiscount] = useState('');
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);
  
  useEffect(() => {
    if (!invoiceNumber) {
      const year = new Date().getFullYear();
      const count = invoices.length + 1;
      setInvoiceNumber(`INV-${year}-${String(count).padStart(4, '0')}`);
    }
  }, [invoices.length]);

  useEffect(() => {
    if (settings) {
      setSellerName(settings.companyName || '');
      setSellerPhone(settings.phone || '');
      setSellerAddress(settings.address || '');
    }
  }, [settings]);

  const selectInventoryItem = (index: number, invItem: any) => {
    const newItems = [...items];
    newItems[index].name = invItem.name;
    newItems[index].price = invItem.sellingPrice.toString();
    setActiveItemIndex(null);
    
    const qty = parseFloat(newItems[index].qty) || 0;
    if (qty > 0) {
      newItems[index].total = qty * invItem.sellingPrice;
    }
    setItems(newItems);
  };

  const handleItemChange = (index: number, field: string, value: string) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    if (field === 'qty' || field === 'price') {
      const qty = parseFloat(newItems[index].qty) || 0;
      const prc = parseFloat(newItems[index].price) || 0;
      newItems[index].total = qty * prc;
    }
    setItems(newItems);
  };

  const subtotal = items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  const discountVal = parseFloat(discount) || 0;
  const netAmount = Math.max(0, subtotal - discountVal);
  const taxAmount = settings?.taxEnabled ? netAmount * (settings.vatRate / 100) : 0;
  const grandTotal = netAmount + taxAmount;



  const handlePrint = () => {
    window.print();
  };

  const handleSave = () => {
    // Only save items that have a name and total > 0
    const validItems = items.filter(i => (i.name.trim() !== '' || i.itemNotes?.trim() !== '') && i.total > 0);
    if (validItems.length === 0) {
      alert('يجب إدخال صنف واحد على الأقل');
      return;
    }

    addPosInvoice({
      invoiceNumber,
      date,
      customerName: customerName || 'عميل نقدي',
      customerPhone,
      type: 'standard',
      items: validItems.map(i => ({
        id: Math.random().toString(36).substr(2, 9),
        inventoryItemId: '',
        name: [i.name, i.itemNotes].filter(Boolean).join(' - '),
        quantity: Number(i.qty) || 1,
        unitPrice: Number(i.price) || 0,
        total: i.total,
        isCustom: true
      })),
      subtotal,
      discountTotal: discountVal,
      taxRate: settings.vatRate,
      taxAmount,
      totalAmount: grandTotal,
      paidAmount: grandTotal,
      remainingAmount: 0,
      paymentMethod: 'cash',
      status: 'paid',
      notes,
    });
    alert('تم حفظ الفاتورة بنجاح في سجل المبيعات');
  };

  return (
    <div className="w-full h-full flex flex-col print:p-0 print:m-0 print:w-full bg-slate-50 overflow-hidden">
      {/* Top Controls (Hidden on Print) */}
      <div className="flex items-center justify-between bg-white p-4 shadow-sm border-b border-slate-200 print:hidden shrink-0 w-full">
        <div>
          <h2 className="text-lg font-bold text-slate-800">فاتورة مبيعات A4 (تصميم مخصص)</h2>
          <p className="text-[10px] text-slate-400 font-light">قم بتعبئة البيانات وطباعتها أو حفظها في السجل</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-sm shadow-sm transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>حفظ بالسجل</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm shadow-sm transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة الفاتورة</span>
          </button>
        </div>
      </div>

      {/* Printable Area - Full Screen Scrollable */}
      <div className="w-full flex-1 overflow-auto bg-white p-4 md:p-8 print:p-0 print:overflow-visible" onClick={() => setActiveItemIndex(null)}>
        <div 
          className="bg-white text-slate-900 font-sans relative box-border w-full max-w-5xl mx-auto min-h-full flex flex-col justify-between" 
          dir="rtl"
        >
          {/* Header Image from Settings */}
          {settings?.headerImageUrl && (
             <div className="w-full mb-6 print:mb-4">
                <img src={settings.headerImageUrl} alt="Header" className="w-full h-auto max-h-48 object-contain" />
             </div>
          )}
          
          <div className="flex-1 flex flex-col">
        
        {/* Header Row */}
        <div className="flex items-start justify-between mb-[3%] relative">
          {/* Invoice Number Box */}
          <div className="w-48 border-[1.5px] border-slate-400 rounded-md p-[1.5%] flex items-center gap-2">
            <span className="font-bold text-sm shrink-0">رقم الفاتورة :</span>
            <input 
              type="text" 
              value={invoiceNumber}
              onChange={e => setInvoiceNumber(e.target.value)}
              className="w-full text-center border-b border-dotted border-slate-400 focus:outline-none focus:border-blue-500 text-sm font-bold bg-transparent"
            />
          </div>

          {/* Center Title */}
          <div className="bg-[#1e3a8a] text-white px-12 py-3 rounded-md absolute left-1/2 -translate-x-1/2 -top-[1.5%]">
            <h1 className="text-[3.5cqw] sm:text-2xl md:text-3xl font-black tracking-wider">فاتورة مبيعات</h1>
          </div>

          {/* Date Box */}
          <div className="w-48 border-[1.5px] border-slate-400 rounded-md p-[1.5%] flex items-center gap-2">
            <span className="font-bold text-sm shrink-0">التاريخ :</span>
            <DateInput value={date} onChange={e => setDate(e.target.value)}
              className="w-full text-center border-b border-dotted border-slate-400 focus:outline-none focus:border-blue-500 text-sm font-bold bg-transparent"
            />
          </div>
        </div>

        {/* Info Boxes */}
        <div className="grid grid-cols-2 gap-[4%] mb-[2%]">
          {/* Customer Box */}
          <div className="border-[1.5px] border-[#1e3a8a] rounded-md overflow-hidden">
            <div className="bg-[#dbeafe] py-[1%] text-center font-bold text-[#1e3a8a] border-b-[1.5px] border-[#1e3a8a]">
              بيانات العميل
            </div>
            <div className="p-3 space-y-3">
              <div className="flex items-end gap-2">
                <span className="font-bold text-sm shrink-0">اسم العميل :</span>
                <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full border-b-[1.5px] border-dotted border-slate-400 focus:outline-none focus:border-blue-500 bg-transparent text-sm" />
              </div>
              <div className="flex items-end gap-2">
                <span className="font-bold text-sm shrink-0">رقم الهاتف :</span>
                <input type="text" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="w-full border-b-[1.5px] border-dotted border-slate-400 focus:outline-none focus:border-blue-500 bg-transparent text-sm" />
              </div>
              <div className="flex items-end gap-2">
                <span className="font-bold text-sm shrink-0">العنوان :</span>
                <input type="text" value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} className="w-full border-b-[1.5px] border-dotted border-slate-400 focus:outline-none focus:border-blue-500 bg-transparent text-sm" />
              </div>
            </div>
          </div>

          {/* Seller Box */}
          <div className="border-[1.5px] border-[#1e3a8a] rounded-md overflow-hidden">
            <div className="bg-[#dbeafe] py-[1%] text-center font-bold text-[#1e3a8a] border-b-[1.5px] border-[#1e3a8a]">
              بيانات البائع
            </div>
            <div className="p-3 space-y-3">
              <div className="flex items-end gap-2">
                <span className="font-bold text-sm shrink-0">اسم المنشأة :</span>
                <input type="text" value={sellerName} onChange={e => setSellerName(e.target.value)} className="w-full border-b-[1.5px] border-dotted border-slate-400 focus:outline-none focus:border-blue-500 bg-transparent text-sm" />
              </div>
              <div className="flex items-end gap-2">
                <span className="font-bold text-sm shrink-0">رقم الهاتف :</span>
                <input type="text" value={sellerPhone} onChange={e => setSellerPhone(e.target.value)} className="w-full border-b-[1.5px] border-dotted border-slate-400 focus:outline-none focus:border-blue-500 bg-transparent text-sm" />
              </div>
              <div className="flex items-end gap-2">
                <span className="font-bold text-sm shrink-0">العنوان :</span>
                <input type="text" value={sellerAddress} onChange={e => setSellerAddress(e.target.value)} className="w-full border-b-[1.5px] border-dotted border-slate-400 focus:outline-none focus:border-blue-500 bg-transparent text-sm" />
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="border-[1.5px] border-[#1e3a8a] rounded-md overflow-hidden mb-[2%]">
          <table className="w-full text-center">
            <thead className="bg-[#dbeafe] text-[#1e3a8a] font-bold border-b-[1.5px] border-[#1e3a8a]">
              <tr>
                <th className="py-2 border-l-[1.5px] border-[#1e3a8a] w-12">م</th>
                <th className="py-2 border-l-[1.5px] border-[#1e3a8a]">البيان والصنف</th>
                <th className="py-2 border-l-[1.5px] border-[#1e3a8a] w-24">الكمية</th>
                <th className="py-2 border-l-[1.5px] border-[#1e3a8a] w-28">سعر الوحدة</th>
                <th className="py-2 w-32">الإجمالي</th>
              </tr>
            </thead>
            <tbody className="divide-y-[1.5px] divide-[#1e3a8a]">
              {items.map((item, idx) => (
                <tr key={item.id} className="h-[4%]">
                  <td className="border-l-[1.5px] border-[#1e3a8a] font-bold text-sm text-slate-700">{idx + 1}</td>
                  <td className="border-l-[1.5px] border-[#1e3a8a] p-0 relative">
                    <div className="flex items-center w-full h-full px-2">
                      <input 
                        type="text" 
                        value={item.name} 
                        onChange={e => {
                          handleItemChange(idx, 'name', e.target.value);
                          setActiveItemIndex(idx);
                        }} 
                        onFocus={() => setActiveItemIndex(idx)}
                        className="flex-1 bg-transparent focus:outline-none focus:bg-slate-50 text-sm" 
                      />
                      {(item.name || item.itemNotes) && <span className="text-[#1e3a8a] font-bold mx-1 select-none">/</span>}
                      <input 
                        type="text" 
                        value={item.itemNotes} 
                        onChange={e => handleItemChange(idx, 'itemNotes', e.target.value)} 
                        className="flex-1 bg-transparent focus:outline-none focus:bg-slate-50 text-sm text-slate-600" 
                      />
                    </div>
                    {/* Dropdown */}
                    {activeItemIndex === idx && (() => {
                      const itemResults = inventory.filter(i => i.name.includes(item.name) && item.name.trim() !== '');
                      if (itemResults.length > 0) {
                        return (
                          <div className="absolute top-full right-0 w-full mt-1 bg-white border border-slate-200 rounded shadow-lg z-50 max-h-48 overflow-y-auto no-print text-right">
                            {itemResults.map(invItem => (
                              <div 
                                key={invItem.id} 
                                className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b last:border-b-0 flex justify-between"
                                onClick={() => selectInventoryItem(idx, invItem)}
                              >
                                <span className="font-bold">{invItem.name}</span>
                                <span className="text-slate-500 tabular-nums">{invItem.sellingPrice} ر.س</span>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </td>
                  <td className="border-l-[1.5px] border-[#1e3a8a] px-2">
                    <input type="number" min="0" value={item.qty} onChange={e => handleItemChange(idx, 'qty', e.target.value)} className="w-full text-center bg-transparent focus:outline-none focus:bg-slate-50 text-sm" />
                  </td>
                  <td className="border-l-[1.5px] border-[#1e3a8a] px-2">
                    <input type="number" min="0" value={item.price} onChange={e => handleItemChange(idx, 'price', e.target.value)} className="w-full text-center bg-transparent focus:outline-none focus:bg-slate-50 text-sm" />
                  </td>
                  <td className="px-2 text-sm font-bold bg-slate-50/50">
                    {item.total > 0 ? item.total.toLocaleString('ar-SA') : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-2 gap-[4%] mb-[4%]">
          {/* Notes */}
          <div className="border-[1.5px] border-[#1e3a8a] rounded-md overflow-hidden h-max">
            <div className="bg-[#dbeafe] py-[1%] text-center font-bold text-[#1e3a8a] border-b-[1.5px] border-[#1e3a8a]">
              ملاحظات
            </div>
            <div className="p-[1.5%] flex-1 min-h-0">
              <textarea 
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full h-full resize-none bg-transparent focus:outline-none text-sm"
              />
            </div>
          </div>

          {/* Totals */}
          <div className="border-[1.5px] border-[#1e3a8a] rounded-md overflow-hidden flex flex-col">
            <div className="flex border-b-[1.5px] border-[#1e3a8a] divide-x-[1.5px] divide-x-reverse divide-[#1e3a8a] h-[4%]">
              <div className="w-3/5 bg-[#dbeafe] text-[#1e3a8a] font-bold flex items-center justify-center text-sm">إجمالي المبلغ</div>
              <div className="w-2/5 flex items-center justify-center font-bold text-sm bg-slate-50/50">{subtotal.toLocaleString('ar-SA')}</div>
            </div>
            <div className="flex border-b-[1.5px] border-[#1e3a8a] divide-x-[1.5px] divide-x-reverse divide-[#1e3a8a] h-[4%]">
              <div className="w-3/5 bg-[#dbeafe] text-[#1e3a8a] font-bold flex items-center justify-center text-sm">الخصم</div>
              <div className="w-2/5 flex items-center justify-center font-bold text-sm">
                <input type="number" min="0" value={discount} onChange={e => setDiscount(e.target.value)} className="w-full text-center bg-transparent focus:outline-none" />
              </div>
            </div>
            <div className="flex border-b-[1.5px] border-[#1e3a8a] divide-x-[1.5px] divide-x-reverse divide-[#1e3a8a] h-[4%]">
              <div className="w-3/5 bg-[#dbeafe] text-[#1e3a8a] font-bold flex items-center justify-center text-sm">صافي المبلغ</div>
              <div className="w-2/5 flex items-center justify-center font-bold text-sm bg-slate-50/50">{netAmount.toLocaleString('ar-SA')}</div>
            </div>
            <div className="flex border-b-[1.5px] border-[#1e3a8a] divide-x-[1.5px] divide-x-reverse divide-[#1e3a8a] h-[4%]">
              <div className="w-3/5 bg-[#dbeafe] text-[#1e3a8a] font-bold flex items-center justify-center text-sm">قيمة الضريبة</div>
              <div className="w-2/5 flex items-center justify-center font-bold text-sm bg-slate-50/50">{taxAmount > 0 ? taxAmount.toLocaleString('ar-SA') : ''}</div>
            </div>
            <div className="flex divide-x-[1.5px] divide-x-reverse divide-white h-10">
              <div className="w-3/5 bg-[#1e3a8a] text-white font-bold flex items-center justify-center">المبلغ الإجمالي</div>
              <div className="w-2/5 bg-[#1e3a8a] text-white flex items-center justify-center font-black">{grandTotal.toLocaleString('ar-SA')}</div>
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-[4%] mb-[3%] text-center sm:text-sm font-bold text-[#1e3a8a] relative">
          <div>
            <div className="mb-8">توقيع العميل</div>
            <div className="border-b-[1.5px] border-dotted border-[#1e3a8a] mx-12"></div>
          </div>
          <div className="relative">
            <div className="mb-8">توقيع البائع</div>
            <div className="border-b-[1.5px] border-dotted border-[#1e3a8a] mx-12"></div>
            {settings?.stampUrl && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/4 opacity-90 pointer-events-none mix-blend-multiply">
                 <OfficialStamp stampUrl={settings.stampUrl} />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center font-bold text-[#1e3a8a] text-[1.2vh] sm:text-sm mt-auto relative pt-4 shrink-0">
          <div className="border-b-[1.5px] border-[#1e3a8a] absolute top-1/2 left-0 w-full -z-10"></div>
          <span className="bg-white px-4">مع خالص الشكر والتقدير</span>
        </div>
      </div>
      </div>
      </div>
      </div>
  );
};
