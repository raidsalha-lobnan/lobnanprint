import React, { useState } from 'react';
import { useAccounting } from '../context/AccountingContext';
import { Invoice } from '../types';
import {
  FileText,
  Search,
  Printer,
  Calendar,
  CheckCircle,
  Clock,
  Eye,
  CreditCard,
  Banknote,
  Building2,
  GitBranch,
  Layers,
  CheckCircle2,
  ArrowLeft,
  History
} from 'lucide-react';
import { InvoiceStatusHistoryModal } from './pos/InvoiceStatusHistoryModal';
import { getInvoiceWorkflowStatusMeta, getInvoicePaymentStatusMeta } from '../utils/invoiceStatusUtils';

export const InvoicesView: React.FC = () => {
  const { invoices, setSelectedInvoiceForPrint, setSelectedInvoiceForLifecycle, settings, setActiveTab, setEditingPosInvoiceId } = useAccounting();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedInvoiceForStatus, setSelectedInvoiceForStatus] = useState<Invoice | null>(null);

  const filteredInvoices = invoices.filter(inv => {
    const matchType = filterType === 'all' || inv.type === filterType;
    const q = searchQuery.trim().toLowerCase();
    const matchSearch =
      !q ||
      inv.invoiceNumber.toLowerCase().includes(q) ||
      inv.customerName.toLowerCase().includes(q);
    return matchType && matchSearch;
  });

  const totalInvoiced = filteredInvoices.reduce((acc, inv) => acc + inv.totalAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">سجل فواتير المبيعات</h2>
            <p className="text-[10px] text-slate-400 font-light">فواتير نقاط البيع السريعة، وأوامر مطبوعات المطبعة المعتمدة</p>
          </div>
        </div>

        <div className="text-left bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 text-xs">
          <span className="text-slate-500 block">إجمالي الفواتير المعروضة:</span>
          <strong className="text-slate-900 text-sm font-mono font-black">
            {totalInvoiced.toLocaleString('ar-SA')} {settings.currency}
          </strong>
        </div>
      </div>

      {/* Single-Entry 7-Stage Cascade Architecture Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 rounded-2xl border border-indigo-900/50 shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <GitBranch className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold">دورة الإدخال الواحد المؤتمتة (Single Entry Cascading Flow)</h3>
              <p className="text-[11px] text-slate-400">تُسجل الفاتورة مرة واحدة لتُحدث تلقائياً السلسلة المحاسبية الكاملة دون أي تكرار يدوي:</p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            ✓ ترحيل فوري متوازي 100%
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5 text-center text-[11px] pt-2 border-t border-slate-800">
          <div className="bg-slate-800/80 p-1.5 rounded-lg border border-slate-700 font-medium text-slate-200">
            1. الفاتورة
          </div>
          <div className="bg-slate-800/80 p-1.5 rounded-lg border border-slate-700 font-medium text-slate-200">
            2. المخزون
          </div>
          <div className="bg-slate-800/80 p-1.5 rounded-lg border border-slate-700 font-medium text-slate-200">
            3. العميل
          </div>
          <div className="bg-slate-800/80 p-1.5 rounded-lg border border-slate-700 font-medium text-slate-200">
            4. الصندوق/البنك
          </div>
          <div className="bg-slate-800/80 p-1.5 rounded-lg border border-slate-700 font-medium text-slate-200">
            5. تكلفة المبيعات
          </div>
          <div className="bg-slate-800/80 p-1.5 rounded-lg border border-slate-700 font-medium text-slate-200">
            6. الحسابات
          </div>
          <div className="bg-indigo-900/80 p-1.5 rounded-lg border border-indigo-700 font-bold text-indigo-200">
            7. التقارير
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ابحث برقم الفاتورة، اسم العميل..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pr-9 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700"
          >
            <option value="all">كافة أنواع الفواتير</option>
            <option value="pos">فواتير نقطة البيع (الكاشير)</option>
            <option value="print_order">فواتير أوامر الطباعة</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3.5">رقم الفاتورة</th>
                <th className="p-3.5">التاريخ</th>
                <th className="p-3.5">العميل</th>
                <th className="p-3.5">النوع</th>
                <th className="p-3.5">طريقة الدفع</th>
                <th className="p-3.5">المجموع قبل الضريبة</th>
                <th className="p-3.5">الضريبة ({settings.vatRate}%)</th>
                <th className="p-3.5">الإجمالي</th>
                <th className="p-3.5">الحالة</th>
                <th className="p-3.5 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.map(inv => (
                <tr key={inv.id} className="hover:bg-slate-50/80">
                  <td className="p-3.5">
                    <button
                      onClick={() => {
                        setEditingPosInvoiceId(inv.id);
                        setActiveTab('pos');
                      }}
                      className="font-mono font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1"
                      title="فتح لتعديل الفاتورة المباشر"
                    >
                      {inv.invoiceNumber}
                    </button>
                  </td>
                  <td className="p-3.5 text-slate-500">{inv.date}</td>
                  <td className="p-3.5 font-bold text-slate-900">{inv.customerName}</td>
                  <td className="p-3.5">
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-md font-medium ${
                        inv.type === 'pos' ? 'bg-sky-50 text-sky-700' : 'bg-indigo-50 text-indigo-700'
                      }`}
                    >
                      {inv.type === 'pos' ? 'نقطة بيع' : 'أمر مطبعة'}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded flex items-center gap-1 w-max">
                      {inv.paymentMethod === 'cash' ? (
                        <>
                          <Banknote className="w-3 h-3" />
                          <span>نقدي</span>
                        </>
                      ) : inv.paymentMethod === 'card' ? (
                        <>
                          <CreditCard className="w-3 h-3" />
                          <span>شبكة</span>
                        </>
                      ) : (
                        <>
                          <Building2 className="w-3 h-3" />
                          <span>آجل</span>
                        </>
                      )}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono font-semibold text-slate-600">
                    {(inv.subtotal - inv.discountTotal).toLocaleString('ar-SA')} {settings.currency}
                  </td>
                  <td className="p-3.5 font-mono text-slate-500">
                    {inv.taxAmount.toLocaleString('ar-SA')}
                  </td>
                  <td className="p-3.5 font-mono font-bold text-slate-900 text-sm">
                    {inv.totalAmount.toLocaleString('ar-SA')} {settings.currency}
                  </td>
                  <td className="p-3.5">
                    {(() => {
                      const wfMeta = getInvoiceWorkflowStatusMeta(inv.workflowStatus);
                      const payMeta = getInvoicePaymentStatusMeta(inv.paymentStatus || (inv.status === 'paid' ? 'paid_cash' : 'unpaid'));
                      return (
                        <div className="flex flex-col gap-1 w-max">
                          <span
                            className={`text-[11px] px-2 py-0.5 rounded font-bold border ${wfMeta.badgeBg} ${wfMeta.badgeText} ${wfMeta.badgeBorder} flex items-center justify-between gap-1`}
                            title={wfMeta.description}
                          >
                            <span>{wfMeta.label}</span>
                            <span className="text-[9px] font-mono opacity-80">
                              {wfMeta.isAccounting ? '●' : '○'}
                            </span>
                          </span>

                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded border font-semibold ${payMeta.bgColor} ${payMeta.color} ${payMeta.borderColor}`}
                            title={payMeta.description}
                          >
                            {payMeta.label}
                          </span>
                        </div>
                      );
                    })()}
                  </td>
                  <td className="p-3.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => setSelectedInvoiceForStatus(inv)}
                        className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors border border-blue-200"
                        title={`سجل توثيق حالات الفاتورة (${inv.statusHistory?.length || 1})`}
                      >
                        <History className="w-3.5 h-3.5 text-blue-600" />
                        <span>سجل الحالة</span>
                      </button>
                      <button
                        onClick={() => setSelectedInvoiceForLifecycle(inv)}
                        className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold cursor-pointer transition-colors border border-emerald-200"
                        title="عرض مسار الحركة الآلية للعملية (7 مراحل)"
                      >
                        <GitBranch className="w-3.5 h-3.5 text-emerald-600" />
                        <span>مسار الحركة</span>
                      </button>
                      <button
                        onClick={() => setSelectedInvoiceForPrint(inv)}
                        className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>طباعة</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Status & Audit History Modal */}
      {selectedInvoiceForStatus && (
        <InvoiceStatusHistoryModal
          invoice={selectedInvoiceForStatus}
          isOpen={!!selectedInvoiceForStatus}
          onClose={() => setSelectedInvoiceForStatus(null)}
        />
      )}
    </div>
  );
};
