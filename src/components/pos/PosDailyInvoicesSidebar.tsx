import React, { useState, useMemo } from 'react';
import { DateInput } from '../../components/common/DateInput';
import { useAccounting } from '../../context/AccountingContext';
import { Invoice, PosInvoiceWorkflowStatus, PaymentMethod, Treasury } from '../../types';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Banknote,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  Printer,
  Edit3,
  Coins,
  ArrowDownLeft,
  X,
  Check,
  Building,
  User,
  Plus,
  History,
  Calendar,
  AlignRight
} from 'lucide-react';
import { InvoiceStatusHistoryModal } from './InvoiceStatusHistoryModal';
import { posSound } from '../../utils/audio';
import {
  WORKFLOW_STATUS_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
  getInvoiceWorkflowStatusMeta,
  getInvoicePaymentStatusMeta,
  computeInvoicePaymentStatus,
  isInvoiceAccountingEligible
} from '../../utils/invoiceStatusUtils';

export type DailyInvoiceFilterTab =
  | 'all'
  | 'new'
  | 'quotation'
  | 'design'
  | 'pending_approval'
  | 'print_external'
  | 'print_internal'
  | 'ready'
  | 'delivered'
  | 'other'
  | 'paid'
  | 'unpaid_or_credit';

interface PosDailyInvoicesSidebarProps {
  onSelectInvoiceToLoad: (inv: Invoice) => void;
  onPrintInvoice: (inv: Invoice) => void;
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
}

export const PosDailyInvoicesSidebar: React.FC<PosDailyInvoicesSidebarProps> = ({
  onSelectInvoiceToLoad,
  onPrintInvoice,
  isOpen = true,
  onClose,
  className = ''
}) => {
  const {
    invoices,
    updateInvoice,
    createPaymentVoucher,
    treasuries,
    currencies,
    settings
  } = useAccounting();

  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [activeFilterTab, setActiveFilterTab] = useState<DailyInvoiceFilterTab>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Additional Collection Modal State
  const [collectingInvoice, setCollectingInvoice] = useState<Invoice | null>(null);
  const [collectionAmount, setCollectionAmount] = useState<string>('');
  const [collectionMethod, setCollectionMethod] = useState<'cash' | 'bank_transfer'>('cash');
  const [collectionCurrencyCode, setCollectionCurrencyCode] = useState<string>(settings.baseCurrencyCode || 'ILS');
  const [collectionTreasuryCode, setCollectionTreasuryCode] = useState<string>('1101');
  const [collectionNotes, setCollectionNotes] = useState<string>('');
  const [isSuccessMessage, setIsSuccessMessage] = useState<string>('');

  // Status Change Modal / Popover
  const [statusChangingInvoice, setStatusChangingInvoice] = useState<Invoice | null>(null);
  const [targetStatusForModal, setTargetStatusForModal] = useState<PosInvoiceWorkflowStatus | undefined>(undefined);

  const handleOpenStatusModal = (inv: Invoice, targetStatus?: PosInvoiceWorkflowStatus) => {
    setStatusChangingInvoice(inv);
    setTargetStatusForModal(targetStatus);
  };

  const todayInvoices = useMemo(() => {
    return invoices
      .filter(inv => inv.date === selectedDate)
      .sort((a, b) => (b.invoiceNumber || '').localeCompare(a.invoiceNumber || ''));
  }, [invoices, selectedDate]);

  // Tab counters
  const counts = useMemo(() => {
    const res: Record<DailyInvoiceFilterTab, number> = {
      all: todayInvoices.length,
      new: 0,
      quotation: 0,
      design: 0,
      pending_approval: 0,
      print_external: 0,
      print_internal: 0,
      ready: 0,
      delivered: 0,
      other: 0,
      paid: 0,
      unpaid_or_credit: 0
    };

    todayInvoices.forEach(inv => {
      const wf = inv.workflowStatus || 'new';
      
      const pStatus = inv.paymentStatus || computeInvoicePaymentStatus({
        paymentMethod: inv.paymentMethod,
        totalAmount: inv.totalAmount,
        paidAmount: inv.paidAmount,
        remainingAmount: inv.remainingAmount,
        cashPaidAmount: inv.cashPaidAmount,
        bankPaidAmount: inv.bankPaidAmount
      });
      const isPaid = pStatus === 'paid_cash' || pStatus === 'paid_bank' || pStatus === 'paid_cash_bank' || (inv.remainingAmount <= 0 && inv.paidAmount > 0);
      
      if (isPaid) {
        res.paid++;
      } else {
        res.unpaid_or_credit++;
      }

      if (wf === 'new') res.new++;
      else if (wf === 'quotation') res.quotation++;
      else if (wf === 'design' || wf === 'in_progress_design') res.design++;
      else if (wf === 'pending_approval') res.pending_approval++;
      else if (wf === 'print_external' || wf === 'in_progress_external') res.print_external++;
      else if (wf === 'print_internal' || wf === 'in_progress_internal' || wf === 'in_progress') res.print_internal++;
      else if (wf === 'ready') res.ready++;
      else if (wf === 'delivered') res.delivered++;
      else res.other++;
    });

    return res;
  }, [todayInvoices]);

  const filteredInvoices = useMemo(() => {
    return todayInvoices.filter(inv => {
      // Search
      if (searchQuery) {
        const lowerQ = searchQuery.toLowerCase();
        const matches = 
          inv.invoiceNumber?.toLowerCase().includes(lowerQ) ||
          inv.customerName?.toLowerCase().includes(lowerQ) ||
          inv.subCustomerName?.toLowerCase().includes(lowerQ) ||
          inv.totalAmount.toString().includes(lowerQ);
        if (!matches) return false;
      }

      // Tabs
      const wf = inv.workflowStatus || 'new';
      switch (activeFilterTab) {
        case 'new':
          return wf === 'new';
        case 'quotation':
          return wf === 'quotation';
        case 'design':
          return wf === 'design' || wf === 'in_progress_design';
        case 'pending_approval':
          return wf === 'pending_approval';
        case 'print_external':
          return wf === 'print_external' || wf === 'in_progress_external';
        case 'print_internal':
          return wf === 'print_internal' || wf === 'in_progress_internal' || wf === 'in_progress';
        case 'ready':
          return wf === 'ready';
        case 'delivered':
          return wf === 'delivered';
        case 'other':
          return ['deferred', 'paused', 'editing', 'cancelled'].includes(wf);
        case 'paid': {
          const pStatus = inv.paymentStatus || computeInvoicePaymentStatus({
            paymentMethod: inv.paymentMethod,
            totalAmount: inv.totalAmount,
            paidAmount: inv.paidAmount,
            remainingAmount: inv.remainingAmount,
            cashPaidAmount: inv.cashPaidAmount,
            bankPaidAmount: inv.bankPaidAmount
          });
          return pStatus === 'paid_cash' || pStatus === 'paid_bank' || pStatus === 'paid_cash_bank' || (inv.remainingAmount <= 0 && inv.paidAmount > 0);
        }
        case 'unpaid_or_credit':
          return inv.remainingAmount > 0 || inv.paidAmount === 0;
        case 'all':
        default:
          return true;
      }
    });
  }, [todayInvoices, activeFilterTab, searchQuery]);

  // Handle Changing Workflow Status
  const handleChangeStatus = (inv: Invoice, newStatus: PosInvoiceWorkflowStatus) => {
    updateInvoice(inv.id, {
      workflowStatus: newStatus
    });
    posSound.playSuccessBeep();
    setStatusChangingInvoice(null);
  };

  // Open Additional Collection Modal
  const handleOpenCollection = (inv: Invoice) => {
    setCollectingInvoice(inv);
    const rem = inv.remainingAmount > 0 ? inv.remainingAmount : 0;
    setCollectionAmount(rem > 0 ? String(rem) : '');
    setCollectionMethod('cash');
    setCollectionCurrencyCode(inv.currency || settings.baseCurrencyCode || 'ILS');
    setCollectionTreasuryCode('1101');
    setCollectionNotes(`دفعة تحصيل إضافية لفاتورة رقم ${inv.invoiceNumber}`);
  };

  // Execute Additional Collection
  const handleExecuteCollection = () => {
    if (!collectingInvoice) return;

    const amountNum = parseFloat(collectionAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('الرجاء إدخال مبلغ تحصيل صحيح');
      return;
    }

    const newPaid = Number(((collectingInvoice.paidAmount || 0) + amountNum).toFixed(2));
    const newRemaining = Math.max(0, Number((collectingInvoice.totalAmount - newPaid).toFixed(2)));
    const newStatus = newRemaining === 0 ? 'paid' : 'partial';

    // Update invoice
    updateInvoice(collectingInvoice.id, {
      paidAmount: newPaid,
      remainingAmount: newRemaining,
      status: newStatus
    });

    // Create payment voucher receipt (سند قبض رسمي)
    const partyId = collectingInvoice.customerId || 'pt-cust-1';
    const partyName = collectingInvoice.customerName || 'عميل كاشير نقدي';

    createPaymentVoucher({
      voucherNumber: `RCT-ADD-${Date.now().toString().slice(-5)}`,
      type: 'receipt',
      date: selectedDate,
      partyId,
      partyName,
      amount: amountNum,
      paymentMethod: collectionMethod,
      accountCode: collectionTreasuryCode,
      description: `سند قبض وتحصيل دفعة لفاتورة #${collectingInvoice.invoiceNumber} - ${collectionNotes}`,
      referenceInvoiceId: collectingInvoice.id,
      currency: collectionCurrencyCode,
      subCustomerId: collectingInvoice.subCustomerId,
      subCustomerName: collectingInvoice.subCustomerName,
      treasuryAccountCode: collectionTreasuryCode
    });

    posSound.playSuccessBeep();
    setIsSuccessMessage(`تم تحصيل ${amountNum.toFixed(2)} بنجاح للفاتورة #${collectingInvoice.invoiceNumber}!`);
    
    setTimeout(() => {
      setIsSuccessMessage('');
      setCollectingInvoice(null);
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div className={`flex flex-col h-full bg-[#f8fafc] text-slate-800 ${className}`} dir="rtl">
      {/* Header & Controls */}
      <div className="bg-[#1f4a7c] text-white p-2 shrink-0 flex flex-col gap-2">
        {/* Row 1: Title & Close */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-amber-300" />
            <h3 className="font-bold text-sm leading-none">سجل الفواتير والمبيعات</h3>
            <span className="text-[10px] bg-blue-600 px-1.5 py-0.5 rounded-full font-bold ml-1">
              {filteredInvoices.length}
            </span>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-blue-200 hover:text-white rounded hover:bg-white/10 p-0.5 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Row 2: Date & Status Filter */}
        <div className="flex items-center gap-1.5">
          <div className="flex flex-1 items-center bg-[#153358] rounded px-1.5 py-1 border border-blue-400/30">
            <Calendar className="w-3.5 h-3.5 text-blue-200 ml-1 shrink-0" />
            <DateInput value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
              className="bg-transparent text-white text-[11px] font-mono focus:outline-none cursor-pointer w-full"
            />
          </div>
          <select
            value={activeFilterTab}
            onChange={(e) => setActiveFilterTab(e.target.value as any)}
            className="flex-1 bg-[#153358] border border-blue-400/30 text-white rounded text-[11px] py-1 pl-1 pr-5 focus:outline-none font-bold"
          >
            <option value="all">الكل ({counts.all})</option>
            <option value="unpaid_or_credit">ذمم وآجل ({counts.unpaid_or_credit})</option>
            <option value="paid">مسددة ({counts.paid})</option>
            <option value="new">جديدة ({counts.new})</option>
            <option value="quotation">عروض ({counts.quotation})</option>
            <option value="design">تصميم ({counts.design})</option>
            <option value="print_internal">طباعة داخلي ({counts.print_internal})</option>
            <option value="print_external">طباعة خارجي ({counts.print_external})</option>
            <option value="ready">جاهزة ({counts.ready})</option>
            <option value="delivered">مسلمة ({counts.delivered})</option>
          </select>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white border-b border-slate-200 p-1.5 shrink-0">
        <div className="relative">
          <Search className="absolute right-2 top-1.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="بحث برقم، عميل، أو مبلغ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-2 pr-7 py-1 border border-slate-300 rounded text-[11px] font-medium focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* List Content */}
      <div className="flex-1 overflow-auto bg-slate-50 p-2">
        {filteredInvoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
              <FileText className="w-8 h-8 text-slate-300" />
            </div>
            <p className="font-bold text-sm">لا توجد فواتير مطابقة للبحث أو الفلتر في هذا اليوم</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 pb-10">
            {/* Table Header Row */}
            <div className="flex items-center justify-between gap-2 px-2 py-1.5 bg-slate-200/70 border border-slate-300 rounded-lg text-[11px] font-bold text-slate-600 shadow-xs mb-1">
              <div className="flex-1 text-right">اسم العميل</div>
              <div className="flex items-center justify-between shrink-0 text-center" style={{ width: '135px' }} dir="rtl">
                <div className="w-[45px]">الإجمالي</div>
                <div className="w-[45px]">المدفوع</div>
                <div className="w-[45px]">الباقي</div>
              </div>
            </div>

            {filteredInvoices.map((inv) => {
              const pMeta = getInvoicePaymentStatusMeta(inv.paymentStatus || computeInvoicePaymentStatus({
                paymentMethod: inv.paymentMethod,
                totalAmount: inv.totalAmount,
                paidAmount: inv.paidAmount,
                remainingAmount: inv.remainingAmount,
                cashPaidAmount: inv.cashPaidAmount,
                bankPaidAmount: inv.bankPaidAmount
              }));
              
              const methodStr = inv.paymentMethod === 'cash' ? 'نقدي' : inv.paymentMethod === 'card' ? 'بطاقة' : inv.paymentMethod === 'credit' ? 'آجل' : 'متعدد';
              const wMeta = getInvoiceWorkflowStatusMeta(inv.workflowStatus || 'new');

              return (
                <div key={inv.id} className="bg-white border border-slate-200 hover:border-blue-400 transition-colors rounded-lg p-2 shadow-xs flex flex-col gap-1.5 group">
                  {/* Line 1: Customer ::: Totals */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-bold text-slate-800 text-[13px] truncate flex-1 leading-none pt-0.5">
                      {inv.customerName || 'عميل نقدي'}{inv.subCustomerName ? ` / ${inv.subCustomerName}` : ''}
                    </div>
                    <div className="flex items-center justify-between shrink-0 text-xs font-mono bg-slate-50 border border-slate-100 rounded px-1 py-0.5" style={{ width: '135px' }} dir="rtl">
                      <div className="w-[45px] text-center font-bold text-slate-800 shrink-0">{inv.totalAmount.toFixed(2)}</div>
                      <div className="w-[45px] text-center font-bold text-emerald-700 shrink-0">{inv.paidAmount.toFixed(2)}</div>
                      <div className="w-[45px] text-center font-black text-rose-700 shrink-0">{inv.remainingAmount > 0 ? inv.remainingAmount.toFixed(2) : '0.00'}</div>
                    </div>
                  </div>

                  {/* Line 2: Payment Method - Notes ::: Actions & Status */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5 flex-1 text-[11px] text-slate-600 truncate">
                      <span className={`font-black px-1.5 py-0.5 rounded border ${pMeta.bgColor} ${pMeta.color} ${pMeta.borderColor} shrink-0 leading-none`}>
                        {methodStr}
                      </span>
                      <span className="truncate max-w-[200px] sm:max-w-[300px]">
                        {[inv.notes, inv.paymentNotes].filter(Boolean).join(' - ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Status Dropdown (Auto-saves on change) */}
                      <select
                        value={inv.workflowStatus || 'new'}
                        onChange={e => handleChangeStatus(inv, e.target.value as PosInvoiceWorkflowStatus)}
                        className={`text-[10px] font-black px-1.5 py-1 rounded border cursor-pointer focus:outline-none ${wMeta.bgColor} ${wMeta.color} ${wMeta.borderColor}`}
                        title="تغيير الحالة تلقائياً"
                      >
                        {WORKFLOW_STATUS_OPTIONS.map(opt => (
                          <option key={opt.id} value={opt.id}>{opt.label}</option>
                        ))}
                      </select>

                      <button
                        onClick={() => onSelectInvoiceToLoad(inv)}
                        className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded transition-colors"
                        title="تعديل"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      
                      {inv.remainingAmount > 0 && (
                        <button
                          onClick={() => handleOpenCollection(inv)}
                          className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded transition-colors"
                          title="تحصيل"
                        >
                          <Coins className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Status Change & Audit History Modal */}
      {statusChangingInvoice && (
        <InvoiceStatusHistoryModal
          invoice={statusChangingInvoice}
          isOpen={!!statusChangingInvoice}
          onClose={() => {
            setStatusChangingInvoice(null);
            setTargetStatusForModal(undefined);
          }}
          initialTargetStatus={targetStatusForModal}
        />
      )}

      {/* Additional Collection Modal */}
      {collectingInvoice && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 p-5 w-full max-w-md text-xs text-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">
                    تحصيل إضافي لفاتورة #{collectingInvoice.invoiceNumber}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-light">
                    العميل: {collectingInvoice.customerName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCollectingInvoice(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            {/* Financial Overview Card */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 grid grid-cols-3 gap-2 text-center font-mono">
              <div>
                <span className="text-[9px] text-slate-400 font-light block">إجمالي الفاتورة:</span>
                <span className="font-bold text-slate-900">
                  {collectingInvoice.totalAmount.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 font-light block">المدفوع سابقاً:</span>
                <span className="font-bold text-emerald-700">
                  {collectingInvoice.paidAmount.toFixed(2)}
                </span>
              </div>
              <div className="bg-rose-50 rounded-lg p-1 border border-rose-200">
                <span className="text-[10px] text-rose-600 block font-bold">المتبقي المطلوب:</span>
                <span className="font-black text-rose-700">
                  {collectingInvoice.remainingAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Collection Fields */}
            <div className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  مبلغ الدفعة الإضافية المراد تحصيلها الآن:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={collectingInvoice.remainingAmount}
                    value={collectionAmount}
                    onChange={e => setCollectionAmount(e.target.value)}
                    placeholder="أدخل المبلغ..."
                    className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-black text-sm text-emerald-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setCollectionAmount(String(collectingInvoice.remainingAmount))}
                    className="px-3 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold rounded-lg cursor-pointer whitespace-nowrap"
                  >
                    سداد كامل المتبقي
                  </button>
                </div>
              </div>

              {/* Payment Method & Currency */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">طريقة السداد:</label>
                  <select
                    value={collectionMethod}
                    onChange={e => setCollectionMethod(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-semibold"
                  >
                    <option value="cash">نقدي (Cash)</option>
                    <option value="bank_transfer">تحويل بنكي / مدى</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">عملة السداد:</label>
                  <select
                    value={collectionCurrencyCode}
                    onChange={e => setCollectionCurrencyCode(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-semibold"
                  >
                    {currencies.map(c => (
                      <option key={c.code} value={c.code}>
                        {c.name} ({c.symbol})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Treasury Account (الصندوق / البنك) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  إيداع في الصندوق / الحساب البنكي (حسب العملة):
                </label>
                <select
                  value={collectionTreasuryCode}
                  onChange={e => setCollectionTreasuryCode(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-semibold"
                >
                  {treasuries.map(t => (
                    <option key={t.id} value={t.accountCode}>
                      {t.name} - رصيد: {t.balance.toFixed(2)} ({t.currency || '₪'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">ملاحظات التحصيل:</label>
                <input
                  type="text"
                  value={collectionNotes}
                  onChange={e => setCollectionNotes(e.target.value)}
                  placeholder="ملاحظات اختيارية..."
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5"
                />
              </div>
            </div>

            {/* Success Alert */}
            {isSuccessMessage && (
              <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-2.5 rounded-xl font-bold text-center flex items-center justify-center gap-1.5">
                <Check className="w-4 h-4" />
                <span>{isSuccessMessage}</span>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setCollectingInvoice(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleExecuteCollection}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>تأكيد التحصيل والإيداع</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
