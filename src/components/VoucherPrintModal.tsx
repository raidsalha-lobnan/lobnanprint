import React from 'react';
import { useAccounting } from '../context/AccountingContext';
import { tafqeet } from '../utils/tafqeet';
import { Printer, X, Receipt, CheckCircle, Building2, Calendar, FileText, DollarSign, User } from 'lucide-react';
import { PrintHeader } from './common/PrintHeader';

export const VoucherPrintModal: React.FC = () => {
  const { selectedVoucherForPrint, setSelectedVoucherForPrint, settings, treasuries, parties } = useAccounting();

  if (!selectedVoucherForPrint) return null;

  const voucher = selectedVoucherForPrint;
  const isPayment = voucher.type === 'payment';
  const party = parties.find(p => p.id === voucher.partyId);

  // Treasury name if any
  const treasury = treasuries.find(t => t.accountCode === voucher.accountCode || t.accountCode === voucher.treasuryAccountCode);
  const treasuryName = treasury?.name || (voucher.paymentMethod === 'cash' ? 'الصندوق الرئيسي' : 'الحساب البنكي');

  // Amount in words
  const currName = voucher.currency === 'USD' ? 'دولار أمريكي' : voucher.currency === 'JOD' ? 'دينار أردني' : 'شيكل فلسطيني';
  const fracName = voucher.currency === 'USD' ? 'سنت' : voucher.currency === 'JOD' ? 'فلس' : 'أغورة';
  const amountWords = tafqeet(voucher.amount, currName, fracName);

  const handlePrint = () => {
    window.print();
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cash':
        return 'نقداً (كاش)';
      case 'bank_transfer':
        return 'تحويل بنكي';
      case 'cheque':
        return 'شيك بنكي';
      default:
        return method;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto print:p-0 print:bg-white print:static print:h-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:w-full">
        {/* Controls Bar (hidden during print) */}
        <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm">معاينة وطباعة {isPayment ? 'سند الصرف' : 'سند القبض'}</h3>
            <span className="font-mono text-xs bg-slate-800 text-slate-200 px-2 py-0.5 rounded border border-slate-700">
              {voucher.voucherNumber}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة السند</span>
            </button>
            <button
              onClick={() => setSelectedVoucherForPrint(null)}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Voucher Paper */}
        <div className="p-6 sm:p-8 flex-1 overflow-y-auto print:p-0 print:overflow-visible text-slate-900 text-right font-sans">
          {/* Official Company Header (Full Header banner if uploaded, or standard logo & details) */}
          <PrintHeader
            title={isPayment ? 'سند صرف نقدية / بنك' : 'سند قبض نقدية / بنك'}
            subtitle={isPayment ? 'Official Payment Voucher' : 'Official Receipt Voucher'}
            docNumber={voucher.voucherNumber}
            docDate={voucher.date}
            badge={isPayment ? 'سند صرف رسمي' : 'سند قبض رسمي'}
          />

          {/* Amount Ribbon Box */}
          <div className="bg-slate-50 border border-slate-300 rounded-xl p-3.5 mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">المبلغ:</span>
              <div className="bg-white border border-slate-300 px-3 py-1 rounded-lg font-mono text-lg font-black text-slate-950 shadow-2xs">
                {voucher.amount.toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {voucher.currencySymbol || settings.currency || '₪'}
              </div>
            </div>

            <div className="text-xs text-slate-700 max-w-sm truncate text-left font-semibold">
              فقط: <span className="text-slate-900 font-bold underline decoration-slate-400 underline-offset-4">{amountWords}</span>
            </div>
          </div>

          {/* Detailed Voucher Body Fields */}
          <div className="space-y-3.5 text-xs text-slate-800 border border-slate-200 rounded-xl p-4 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <span className="text-slate-500 font-bold min-w-[120px]">
                {isPayment ? 'يصرف إلى السيد / السادة:' : 'وصلنا من السيد / السادة:'}
              </span>
              <div className="flex-1 font-bold text-sm text-slate-950 flex items-center justify-between">
                <span>{voucher.partyName}</span>
                {party?.code && (
                  <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-normal">
                    كود: {party.code}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <span className="text-slate-500 font-bold min-w-[120px]">طريقة الدفع والحساب:</span>
              <div className="flex-1 font-medium text-slate-800 flex flex-wrap items-center gap-2">
                <span className="bg-slate-100 px-2.5 py-1 rounded font-bold text-slate-800 border border-slate-200">
                  {getPaymentMethodLabel(voucher.paymentMethod)}
                </span>
                <span className="text-slate-600">
                  من خزينة / حساب: <strong className="text-slate-800">{treasuryName}</strong>
                </span>
                {voucher.paymentMethod === 'cheque' && voucher.chequeNumber && (
                  <span className="bg-amber-50 border border-amber-200 text-amber-900 px-2 py-0.5 rounded text-[11px]">
                    شيك رقم: <strong className="font-mono">{voucher.chequeNumber}</strong>
                    {voucher.chequeBank && ` - بنك: ${voucher.chequeBank}`}
                    {voucher.chequeDueDate && ` - استحقاق: ${voucher.chequeDueDate}`}
                  </span>
                )}
                {voucher.paymentMethod === 'bank_transfer' && voucher.transferReference && (
                  <span className="bg-blue-50 border border-blue-200 text-blue-900 px-2 py-0.5 rounded text-[11px]">
                    رقم الحوالة: <strong className="font-mono">{voucher.transferReference}</strong>
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-start justify-between pt-0.5">
              <span className="text-slate-500 font-bold min-w-[120px] pt-1">وذلك عن (البيان):</span>
              <div className="flex-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200 leading-relaxed font-medium">
                {voucher.description || 'سداد مستحقات مالية على الحساب'}
              </div>
            </div>

            {/* ملاحظة القبض والصرف تظهر دائماً مع السند بشكل أفقي كملاحظة مرتبطة بسند القبض / الصرف */}
            <div className={`border rounded-xl p-3 text-xs flex items-start gap-2 shadow-2xs ${
              isPayment ? 'bg-amber-50/70 border-amber-200 text-amber-950' : 'bg-blue-50/70 border-blue-200 text-blue-950'
            }`}>
              <FileText className={`w-4 h-4 shrink-0 mt-0.5 ${isPayment ? 'text-amber-700' : 'text-blue-700'}`} />
              <div className="flex-1">
                <span className="font-bold ml-1.5">
                  {isPayment ? 'ملاحظة مرتبطة بسند الصرف:' : 'ملاحظة مرتبطة بسند القبض:'}
                </span>
                <span className="text-slate-800 font-medium whitespace-pre-wrap">
                  {voucher.description || (voucher as any).notes || (isPayment ? 'سند صرف ودفع معتمد' : 'سند تحصيل وقبض معتمد')}
                </span>
              </div>
            </div>
          </div>

          {/* Signatures Section */}
          <div className="mt-8 pt-4 border-t border-slate-200 grid grid-cols-4 gap-4 text-center text-xs">
            <div className="space-y-6">
              <span className="font-bold text-slate-700 block">منظم السند / المحاسب</span>
              <div className="border-b border-dotted border-slate-400 w-24 mx-auto pb-4" />
            </div>

            <div className="space-y-6">
              <span className="font-bold text-slate-700 block">مراجع الحسابات</span>
              <div className="border-b border-dotted border-slate-400 w-24 mx-auto pb-4" />
            </div>

            <div className="space-y-6">
              <span className="font-bold text-slate-700 block">اعتماد الإدارة / المشرف</span>
              <div className="border-b border-dotted border-slate-400 w-24 mx-auto pb-4" />
            </div>

            <div className="space-y-6">
              <span className="font-bold text-slate-700 block">
                {isPayment ? 'توقيع المستلم' : 'توقيع المستلم / الدافع'}
              </span>
              <div className="border-b border-dotted border-slate-400 w-24 mx-auto pb-4" />
            </div>
          </div>

          {/* Footer notice */}
          <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>سند مالي إلكتروني معتمد من النظام</span>
            <span>تاريخ الطباعة: {new Date().toLocaleDateString('ar-EG')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
