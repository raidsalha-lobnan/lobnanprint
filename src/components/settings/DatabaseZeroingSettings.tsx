import React, { useState, useMemo } from 'react';
import { useAccounting } from '../../context/AccountingContext';
import { DatabaseZeroingOptions, ZeroingExecutionResult } from '../../types';
import { initialParties, initialInventory, initialTreasuries } from '../../data/initialData';
import { DEFAULT_WAREHOUSES } from '../../data/defaultCompanyBranchUserData';
import {
  ShieldAlert,
  ShieldCheck,
  Download,
  Trash2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Boxes,
  Users,
  Wallet,
  Receipt,
  RotateCcw,
  FileSpreadsheet,
  Layers,
  ArrowRight,
  Printer,
  Sparkles
} from 'lucide-react';

export const DatabaseZeroingSettings: React.FC = () => {
  const {
    currentUser,
    lastBackupInfo,
    exportDataJSON,
    performDatabaseZeroing,
    invoices,
    purchases,
    salesReturns,
    purchaseReturns,
    vouchers,
    journalEntries,
    printOrders,
    stockMovements,
    warehouseOperations,
    payrollSheets,
    parties,
    inventory,
    warehouses,
    treasuries,
    accounts
  } = useAccounting();

  // 1. فحص الصلاحية: هل المستخدم مدير نظام؟
  const isSystemAdmin =
    currentUser?.roleId === 'role-admin' ||
    currentUser?.roleName === 'مدير النظام' ||
    currentUser?.username === 'admin';

  // 2. إعدادات التاريخ والنطاق
  const todayStr = new Date().toISOString().split('T')[0];
  const [cutoffDate, setCutoffDate] = useState<string>(todayStr);
  const [scope, setScope] = useState<'up_to_date' | 'all'>('up_to_date');

  // 3. خيارات التصفير
  const [options, setOptions] = useState<DatabaseZeroingOptions>({
    cutoffDate: todayStr,
    scope: 'up_to_date',
    // الحركات والعمليات
    resetInvoices: true,
    resetPurchases: true,
    resetSalesReturns: true,
    resetPurchaseReturns: true,
    resetVouchers: true,
    resetJournalEntries: true,
    resetPrintOrders: true,
    resetStockMovements: true,
    resetWarehouseOperations: true,
    resetPayroll: true,
    // العملاء والموردين
    resetManualParties: true,
    zeroPartyBalances: true,
    // المخازن والأصناف
    zeroInventoryStock: true,
    resetManualInventoryItems: false,
    resetManualWarehouses: false,
    // الصناديق والخزنات
    zeroTreasuryBalances: true,
    resetManualTreasuries: false,
    // الحسابات
    zeroAccountBalances: false
  });

  // مزامنة التاريخ والنطاق في الخيارات
  React.useEffect(() => {
    setOptions(prev => ({
      ...prev,
      cutoffDate,
      scope
    }));
  }, [cutoffDate, scope]);

  // كلمة التأكيد
  const [confirmInput, setConfirmInput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<ZeroingExecutionResult | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);

  // حالة النسخ الاحتياطي المحققة محلياً في هذه الجلسة
  const [sessionBackupCompleted, setSessionBackupCompleted] = useState<boolean>(() => !!lastBackupInfo);

  const handleRunBackup = () => {
    exportDataJSON();
    setSessionBackupCompleted(true);
  };

  // دوال الحساب الحية للسجلات المتأثرة
  const isBeforeCutoff = (dateStr?: string) => {
    if (scope === 'all') return true;
    if (!dateStr) return true;
    const clean = dateStr.split('T')[0];
    return clean <= cutoffDate;
  };

  const initialPartiesSet = useMemo(() => new Set(initialParties.map(p => p.id)), []);
  const initialInvSet = useMemo(() => new Set(initialInventory.map(i => i.id)), []);
  const defaultWhSet = useMemo(() => new Set(DEFAULT_WAREHOUSES.map(w => w.id)), []);
  const initialTreasurySet = useMemo(() => new Set(initialTreasuries.map(t => t.id)), []);

  const counts = useMemo(() => {
    const invCount = invoices.filter(i => isBeforeCutoff(i.date)).length;
    const purCount = purchases.filter(p => isBeforeCutoff(p.date)).length;
    const srCount = salesReturns.filter(r => isBeforeCutoff(r.date)).length;
    const prCount = purchaseReturns.filter(r => isBeforeCutoff(r.date)).length;
    const vchCount = vouchers.filter(v => isBeforeCutoff(v.date)).length;
    const jeCount = journalEntries.filter(j => isBeforeCutoff(j.date)).length;
    const poCount = printOrders.filter(o => isBeforeCutoff(o.createdAt || o.deliveryDate)).length;
    const smCount = stockMovements.filter(m => isBeforeCutoff(m.date)).length;
    const woCount = warehouseOperations.filter(w => isBeforeCutoff(w.date)).length;
    const psCount = payrollSheets.filter(p => isBeforeCutoff(p.createdAt)).length;

    const manualParties = parties.filter(p => !initialPartiesSet.has(p.id) && isBeforeCutoff(p.openingBalanceDate || (p as any).createdAt)).length;
    const partiesWithBalance = parties.filter(p => p.balance !== 0).length;

    const manualItems = inventory.filter(i => !initialInvSet.has(i.id) && isBeforeCutoff(i.lastMovementDate || (i as any).createdAt)).length;
    const itemsWithStock = inventory.filter(i => i.stockQuantity !== 0).length;

    const manualWhs = warehouses.filter(w => !defaultWhSet.has(w.id) && isBeforeCutoff(w.createdAt)).length;
    const manualTreas = treasuries.filter(t => !initialTreasurySet.has(t.id) && isBeforeCutoff(t.createdAt)).length;
    const treasWithBal = treasuries.filter(t => t.balance !== 0).length;

    return {
      invCount,
      purCount,
      srCount,
      prCount,
      vchCount,
      jeCount,
      poCount,
      smCount,
      woCount,
      psCount,
      manualParties,
      partiesWithBalance,
      manualItems,
      itemsWithStock,
      manualWhs,
      manualTreas,
      treasWithBal,
      totalAccounts: accounts.length
    };
  }, [
    invoices, purchases, salesReturns, purchaseReturns, vouchers, journalEntries,
    printOrders, stockMovements, warehouseOperations, payrollSheets, parties,
    inventory, warehouses, treasuries, accounts, cutoffDate, scope,
    initialPartiesSet, initialInvSet, defaultWhSet, initialTreasurySet
  ]);

  // إجمالي السجلات التي سيتم حذفها أو تصفيرها
  const totalSelectedItemsToZero = useMemo(() => {
    let count = 0;
    if (options.resetInvoices) count += counts.invCount;
    if (options.resetPurchases) count += counts.purCount;
    if (options.resetSalesReturns) count += counts.srCount;
    if (options.resetPurchaseReturns) count += counts.prCount;
    if (options.resetVouchers) count += counts.vchCount;
    if (options.resetJournalEntries) count += counts.jeCount;
    if (options.resetPrintOrders) count += counts.poCount;
    if (options.resetStockMovements) count += counts.smCount;
    if (options.resetWarehouseOperations) count += counts.woCount;
    if (options.resetPayroll) count += counts.psCount;
    if (options.resetManualParties) count += counts.manualParties;
    if (options.resetManualInventoryItems) count += counts.manualItems;
    if (options.resetManualWarehouses) count += counts.manualWhs;
    if (options.resetManualTreasuries) count += counts.manualTreas;
    return count;
  }, [options, counts]);

  // أزرار الاختيار السريع
  const handleSelectAll = () => {
    setOptions(prev => ({
      ...prev,
      resetInvoices: true,
      resetPurchases: true,
      resetSalesReturns: true,
      resetPurchaseReturns: true,
      resetVouchers: true,
      resetJournalEntries: true,
      resetPrintOrders: true,
      resetStockMovements: true,
      resetWarehouseOperations: true,
      resetPayroll: true,
      resetManualParties: true,
      zeroPartyBalances: true,
      zeroInventoryStock: true,
      resetManualInventoryItems: true,
      resetManualWarehouses: true,
      zeroTreasuryBalances: true,
      resetManualTreasuries: true,
      zeroAccountBalances: true
    }));
  };

  const handleSelectRecommendedLive = () => {
    // التوصية المثالية للاعتماد والبدء الفعلي:
    // تصفير كل الحركات + تصفير كميات المخزون + تصفير أرصدة الذمم والديون والصناديق
    // مع الإبقاء على الدليل والأصناف الأساسية للعمل المباشر
    setOptions(prev => ({
      ...prev,
      resetInvoices: true,
      resetPurchases: true,
      resetSalesReturns: true,
      resetPurchaseReturns: true,
      resetVouchers: true,
      resetJournalEntries: true,
      resetPrintOrders: true,
      resetStockMovements: true,
      resetWarehouseOperations: true,
      resetPayroll: true,
      resetManualParties: false, // الإبقاء على العملاء
      zeroPartyBalances: true,   // تصفير الأرصدة
      zeroInventoryStock: true,  // تصفير كميات المخزون لجرد جديد
      resetManualInventoryItems: false, // الإبقاء على الأصناف
      resetManualWarehouses: false,
      zeroTreasuryBalances: true, // تصفير رصيد الصندوق
      resetManualTreasuries: false,
      zeroAccountBalances: true
    }));
  };

  const handleDeselectAll = () => {
    setOptions(prev => ({
      ...prev,
      resetInvoices: false,
      resetPurchases: false,
      resetSalesReturns: false,
      resetPurchaseReturns: false,
      resetVouchers: false,
      resetJournalEntries: false,
      resetPrintOrders: false,
      resetStockMovements: false,
      resetWarehouseOperations: false,
      resetPayroll: false,
      resetManualParties: false,
      zeroPartyBalances: false,
      zeroInventoryStock: false,
      resetManualInventoryItems: false,
      resetManualWarehouses: false,
      zeroTreasuryBalances: false,
      resetManualTreasuries: false,
      zeroAccountBalances: false
    }));
  };

  // شروط السماح بالتصفير
  const isConfirmInputValid = confirmInput.trim() === 'تصفير' || confirmInput.trim().toUpperCase() === 'RESET';
  const hasSelectedAny =
    options.resetInvoices || options.resetPurchases || options.resetSalesReturns ||
    options.resetPurchaseReturns || options.resetVouchers || options.resetJournalEntries ||
    options.resetPrintOrders || options.resetStockMovements || options.resetWarehouseOperations ||
    options.resetPayroll || options.resetManualParties || options.zeroPartyBalances ||
    options.zeroInventoryStock || options.resetManualInventoryItems || options.resetManualWarehouses ||
    options.zeroTreasuryBalances || options.resetManualTreasuries || options.zeroAccountBalances;

  const canExecute = isSystemAdmin && sessionBackupCompleted && isConfirmInputValid && hasSelectedAny && !isExecuting;

  const handleExecuteZeroing = () => {
    if (!canExecute) return;

    const confirmMsg =
      `تحذير نهائي!\nهل أنت متأكد تماماً من تصفير قاعدة البيانات حتى تاريخ (${cutoffDate})؟\n` +
      `سيتم حذف ${totalSelectedItemsToZero} حركة وسجل وتصفير الأرصدة المحددة بشكل نهائي لا رجعة فيه.\n` +
      `هل ترغب بالاستمرار؟`;

    if (!window.confirm(confirmMsg)) return;

    setIsExecuting(true);
    try {
      const res = performDatabaseZeroing(options);
      setExecutionResult(res);
      setShowResultModal(true);
      setConfirmInput('');
    } catch (err: any) {
      alert('حدث خطأ أثناء تنفيذ عملية التصفير: ' + (err.message || 'خطأ غير متوقع'));
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="space-y-4 text-xs max-w-5xl mx-auto">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-rose-900 via-slate-900 to-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-md border border-rose-800/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-400/40 text-rose-300 flex items-center justify-center shrink-0 shadow-inner">
            <Trash2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                تصفير قاعدة البيانات وبدء التشغيل الفعلي
              </h2>
              <span className="px-2.5 py-0.5 bg-rose-500/30 border border-rose-400/50 text-rose-200 text-[11px] font-bold rounded-full">
                خاص بمدير النظام فقط
              </span>
            </div>
            <p className="text-slate-300 text-xs mt-1 leading-relaxed">
              خاصية معتمدة لتصفير كافة العمليات والفواتير التجريبية والأرصدة إلى تاريخ معين، لإعادة تهيئة النظام والبدء الفعلي النظيف بعد مرحلة التجربة والتدريب.
            </p>
          </div>
        </div>

        {/* Security Badge */}
        <div className="shrink-0 w-full md:w-auto">
          {isSystemAdmin ? (
            <div className="flex items-center gap-2 bg-emerald-950/80 border border-emerald-500/50 px-3.5 py-2 rounded-xl text-emerald-300 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <div>
                <div className="text-[11px]">مصرّح: مدير النظام</div>
                <div className="text-[10px] text-emerald-400/80 font-mono">{currentUser?.fullName || currentUser?.username}</div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-rose-950/90 border border-rose-500/60 px-3.5 py-2 rounded-xl text-rose-300 font-bold">
              <Lock className="w-4 h-4 text-rose-400" />
              <div>
                <div className="text-[11px]">محظور: ليس مدير نظام</div>
                <div className="text-[10px] text-rose-400/80">مقيد بمدير النظام العام فقط</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Non-admin blocking message */}
      {!isSystemAdmin && (
        <div className="bg-rose-50 border-2 border-rose-300 p-4 rounded-xl text-rose-900 flex items-start gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-bold text-sm">تم تقييد الوصول لهذه الشاشة الحساسة</h3>
            <p className="text-xs text-rose-800 leading-relaxed">
              عملية تصفير قاعدة البيانات مقيدة بصلاحية <strong>مدير النظام (Admin)</strong> حصراً، نظراً لأنها تقوم بحذف السجلات المالية والمخزنية وتصفير الأرصدة. يرجى تسجيل الدخول بحساب مدير النظام لتتمكن من استخدام هذه الميزة.
            </p>
          </div>
        </div>
      )}

      {/* Step 1: Mandatory Backup */}
      <div className={`p-4 rounded-xl border transition-all ${
        sessionBackupCompleted
          ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
          : 'bg-amber-50/90 border-amber-300 text-amber-950 shadow-xs'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold shrink-0 ${
              sessionBackupCompleted ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
            }`}>
              {sessionBackupCompleted ? <CheckCircle2 className="w-5 h-5" /> : '1'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm">
                  الخطوة الأولى: إجراء نسخة احتياطية كاملة (إلزامي قبل التصفير)
                </h3>
                {sessionBackupCompleted && (
                  <span className="bg-emerald-200 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    مكتمل وجاهز
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">
                وفقاً لتعليمات الأمان، يمنع النظام تصفير البيانات إلا بعد تنزيل نسخة احتياطية كاملة وحفظها على جهازك للرجوع إليها في أي وقت.
              </p>
              {lastBackupInfo && (
                <div className="text-[11px] font-mono text-emerald-700 mt-1 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>آخر نسخة تم تنزيلها: {new Date(lastBackupInfo.timestamp).toLocaleString('ar-SA')} ({lastBackupInfo.filename})</span>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleRunBackup}
            disabled={!isSystemAdmin}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold px-4 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer text-xs shrink-0 self-stretch sm:self-auto justify-center"
          >
            <Download className="w-4 h-4" />
            <span>تنزيل نسخة احتياطية كاملة الآن (JSON)</span>
          </button>
        </div>
      </div>

      {/* Step 2: Cutoff Date & Scope Selection */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
            2
          </div>
          <h3 className="font-bold text-xs text-slate-900">
            الخطوة الثانية: تحديد تاريخ التصفير ونطاق السجلات
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* حقل اختيار التاريخ */}
          <div className="space-y-1.5">
            <label className="block text-slate-700 font-bold text-[11px] flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>تصفير الحركات والبيانات المسجلة حتى تاريخ:</span>
            </label>
            <input
              type="date"
              value={cutoffDate}
              onChange={(e) => setCutoffDate(e.target.value)}
              disabled={!isSystemAdmin || scope === 'all'}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-hidden disabled:opacity-50"
            />
            <p className="text-[10px] text-slate-500">
              سيتم استهداف المعاملات والسجلات المنشأة في أو قبل هذا التاريخ.
            </p>
          </div>

          {/* نطاق التصفير */}
          <div className="space-y-1.5">
            <label className="block text-slate-700 font-bold text-[11px]">
              نطاق سريان التصفير:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className={`p-2.5 rounded-lg border cursor-pointer flex items-center gap-2 transition-all ${
                scope === 'up_to_date'
                  ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}>
                <input
                  type="radio"
                  name="zeroScope"
                  checked={scope === 'up_to_date'}
                  onChange={() => setScope('up_to_date')}
                  disabled={!isSystemAdmin}
                  className="text-blue-600 cursor-pointer"
                />
                <span className="text-[11px]">حتى التاريخ المحدد فقط</span>
              </label>

              <label className={`p-2.5 rounded-lg border cursor-pointer flex items-center gap-2 transition-all ${
                scope === 'all'
                  ? 'bg-rose-50 border-rose-300 text-rose-900 font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}>
                <input
                  type="radio"
                  name="zeroScope"
                  checked={scope === 'all'}
                  onChange={() => setScope('all')}
                  disabled={!isSystemAdmin}
                  className="text-rose-600 cursor-pointer"
                />
                <span className="text-[11px]">تصفير شامل لكافة التواريخ</span>
              </label>
            </div>
            <p className="text-[10px] text-slate-500">
              {scope === 'up_to_date' ? 'يسمح بالإبقاء على أي عمليات تم إدخالها بعد تاريخ الاعتماد.' : 'سيتم تصفير كل السجلات التجريبية دون استثناء.'}
            </p>
          </div>
        </div>
      </div>

      {/* Step 3: Granular Item Selection */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
              3
            </div>
            <div>
              <h3 className="font-bold text-xs text-slate-900">
                الخطوة الثالثة: اختيار المراد تصفيره بدقة (البنود والعمليات)
              </h3>
              <p className="text-[10px] text-slate-500">حدد البنود التي ترغب بتصفيرها لبدء نسختك الفعلية:</p>
            </div>
          </div>

          {/* أزرار الاختيار السريع */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={handleSelectRecommendedLive}
              disabled={!isSystemAdmin}
              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-md font-bold text-[11px] flex items-center gap-1 cursor-pointer"
              title="تصفير كل الحركات والكميات والديون مع الإبقاء على العملاء والأصناف والدليل"
            >
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span>توصية الاعتماد الفعلي</span>
            </button>
            <button
              type="button"
              onClick={handleSelectAll}
              disabled={!isSystemAdmin}
              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-semibold text-[11px] cursor-pointer"
            >
              تحديد الكل
            </button>
            <button
              type="button"
              onClick={handleDeselectAll}
              disabled={!isSystemAdmin}
              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-semibold text-[11px] cursor-pointer"
            >
              إلغاء التحديد
            </button>
          </div>
        </div>

        {/* أقسام الاختيارات */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* القسم 1: الحركات والعمليات المالية */}
          <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 text-slate-900 font-bold">
              <span className="flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-blue-600" />
                <span>1. الحركات والفواتير والعمليات المالية</span>
              </span>
              <span className="text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200 font-mono">
                {counts.invCount + counts.purCount + counts.vchCount + counts.jeCount} حركة
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center justify-between p-1.5 bg-white rounded-lg border border-slate-200 hover:border-slate-300 cursor-pointer">
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={options.resetInvoices}
                    onChange={(e) => setOptions({ ...options, resetInvoices: e.target.checked })}
                    disabled={!isSystemAdmin}
                    className="w-4 h-4 text-rose-600 rounded-sm"
                  />
                  <span className="font-semibold text-slate-800 text-[11px]">فواتير المبيعات ونقاط البيع (POS)</span>
                </span>
                <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                  {counts.invCount} فاتورة
                </span>
              </label>

              <label className="flex items-center justify-between p-1.5 bg-white rounded-lg border border-slate-200 hover:border-slate-300 cursor-pointer">
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={options.resetPurchases}
                    onChange={(e) => setOptions({ ...options, resetPurchases: e.target.checked })}
                    disabled={!isSystemAdmin}
                    className="w-4 h-4 text-rose-600 rounded-sm"
                  />
                  <span className="font-semibold text-slate-800 text-[11px]">فواتير المشتريات ومشتريات الخامات</span>
                </span>
                <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                  {counts.purCount} فاتورة
                </span>
              </label>

              <label className="flex items-center justify-between p-1.5 bg-white rounded-lg border border-slate-200 hover:border-slate-300 cursor-pointer">
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={options.resetSalesReturns && options.resetPurchaseReturns}
                    onChange={(e) => setOptions({ ...options, resetSalesReturns: e.target.checked, resetPurchaseReturns: e.target.checked })}
                    disabled={!isSystemAdmin}
                    className="w-4 h-4 text-rose-600 rounded-sm"
                  />
                  <span className="font-semibold text-slate-800 text-[11px]">مردودات المبيعات ومردودات المشتريات</span>
                </span>
                <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                  {counts.srCount + counts.prCount} مردود
                </span>
              </label>

              <label className="flex items-center justify-between p-1.5 bg-white rounded-lg border border-slate-200 hover:border-slate-300 cursor-pointer">
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={options.resetVouchers}
                    onChange={(e) => setOptions({ ...options, resetVouchers: e.target.checked })}
                    disabled={!isSystemAdmin}
                    className="w-4 h-4 text-rose-600 rounded-sm"
                  />
                  <span className="font-semibold text-slate-800 text-[11px]">سندات القبض والصرف المالي</span>
                </span>
                <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                  {counts.vchCount} سند
                </span>
              </label>

              <label className="flex items-center justify-between p-1.5 bg-white rounded-lg border border-slate-200 hover:border-slate-300 cursor-pointer">
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={options.resetJournalEntries}
                    onChange={(e) => setOptions({ ...options, resetJournalEntries: e.target.checked })}
                    disabled={!isSystemAdmin}
                    className="w-4 h-4 text-rose-600 rounded-sm"
                  />
                  <span className="font-semibold text-slate-800 text-[11px]">قيود اليومية المحاسبية وحركات الأستاذ</span>
                </span>
                <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                  {counts.jeCount} قيد
                </span>
              </label>

              <label className="flex items-center justify-between p-1.5 bg-white rounded-lg border border-slate-200 hover:border-slate-300 cursor-pointer">
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={options.resetPrintOrders}
                    onChange={(e) => setOptions({ ...options, resetPrintOrders: e.target.checked })}
                    disabled={!isSystemAdmin}
                    className="w-4 h-4 text-rose-600 rounded-sm"
                  />
                  <span className="font-semibold text-slate-800 text-[11px]">أوامر تشغيل المطبعة والورشة</span>
                </span>
                <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                  {counts.poCount} أمر
                </span>
              </label>

              <label className="flex items-center justify-between p-1.5 bg-white rounded-lg border border-slate-200 hover:border-slate-300 cursor-pointer">
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={options.resetStockMovements && options.resetWarehouseOperations}
                    onChange={(e) => setOptions({ ...options, resetStockMovements: e.target.checked, resetWarehouseOperations: e.target.checked })}
                    disabled={!isSystemAdmin}
                    className="w-4 h-4 text-rose-600 rounded-sm"
                  />
                  <span className="font-semibold text-slate-800 text-[11px]">حركات المخزون والمناقلات وعمليات المستودعات</span>
                </span>
                <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                  {counts.smCount + counts.woCount} حركة
                </span>
              </label>

              <label className="flex items-center justify-between p-1.5 bg-white rounded-lg border border-slate-200 hover:border-slate-300 cursor-pointer">
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={options.resetPayroll}
                    onChange={(e) => setOptions({ ...options, resetPayroll: e.target.checked })}
                    disabled={!isSystemAdmin}
                    className="w-4 h-4 text-rose-600 rounded-sm"
                  />
                  <span className="font-semibold text-slate-800 text-[11px]">مسيرات الرواتب وسلف وخصومات الموظفين</span>
                </span>
                <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                  {counts.psCount} مسير
                </span>
              </label>
            </div>
          </div>

          {/* القسم 2: العملاء والموردين والأطراف */}
          <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-2.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 text-slate-900 font-bold">
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>2. العملاء والموردين (الأطراف والذمم)</span>
                </span>
                <span className="text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200 font-mono">
                  {parties.length} طرف مسجل
                </span>
              </div>

              <div className="space-y-1.5 mt-2.5">
                <label className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 hover:border-slate-300 cursor-pointer">
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={options.resetManualParties}
                      onChange={(e) => setOptions({ ...options, resetManualParties: e.target.checked })}
                      disabled={!isSystemAdmin}
                      className="w-4 h-4 text-rose-600 rounded-sm"
                    />
                    <div>
                      <div className="font-semibold text-slate-800 text-[11px]">
                        حذف أسماء العملاء والموردين المضافة يدوياً
                      </div>
                      <div className="text-[10px] text-slate-500">
                        حذف السجلات التجريبية المضافة والإبقاء على الأطراف النظامية
                      </div>
                    </div>
                  </span>
                  <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                    {counts.manualParties} مضاف
                  </span>
                </label>

                <label className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 hover:border-slate-300 cursor-pointer">
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={options.zeroPartyBalances}
                      onChange={(e) => setOptions({ ...options, zeroPartyBalances: e.target.checked })}
                      disabled={!isSystemAdmin}
                      className="w-4 h-4 text-rose-600 rounded-sm"
                    />
                    <div>
                      <div className="font-semibold text-slate-800 text-[11px]">
                        تصفير أرصدة الذمم والمديونيات لجميع الأطراف
                      </div>
                      <div className="text-[10px] text-slate-500">
                        جعل كافة أرصدة العملاء والموردين = (0.00 ₪) لبدء حسابات نظيفة
                      </div>
                    </div>
                  </span>
                  <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                    {counts.partiesWithBalance} رصيد
                  </span>
                </label>
              </div>
            </div>

            <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-[10px] text-emerald-900 mt-2">
              💡 نصيحة: إذا كنت أدخلت عملاءك الحقيقيين بالفعل، يمكنك ترك خيار حذف الأسماء معطلاً وتفعيل تصفير الأرصدة فقط لبدء التعاملات المالية الفعلية.
            </div>
          </div>

          {/* القسم 3: المخازن والأصناف والمستودعات */}
          <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 text-slate-900 font-bold">
              <span className="flex items-center gap-1.5">
                <Boxes className="w-4 h-4 text-amber-600" />
                <span>3. المخازن والأصناف والمستودعات</span>
              </span>
              <span className="text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200 font-mono">
                {inventory.length} صنف مسجل
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 hover:border-slate-300 cursor-pointer">
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={options.zeroInventoryStock}
                    onChange={(e) => setOptions({ ...options, zeroInventoryStock: e.target.checked })}
                    disabled={!isSystemAdmin}
                    className="w-4 h-4 text-rose-600 rounded-sm"
                  />
                  <div>
                    <div className="font-semibold text-slate-800 text-[11px]">
                      تصفير كميات وأرصدة المخزون لكافة الأصناف (0.00)
                    </div>
                    <div className="text-[10px] text-slate-500">
                      تصفير الكميات في كل المستودعات لتكون جاهزة للجرد الفعلي الافتتاحي
                    </div>
                  </div>
                </span>
                <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                  {counts.itemsWithStock} صنف به كميات
                </span>
              </label>

              <label className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 hover:border-slate-300 cursor-pointer">
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={options.resetManualInventoryItems}
                    onChange={(e) => setOptions({ ...options, resetManualInventoryItems: e.target.checked })}
                    disabled={!isSystemAdmin}
                    className="w-4 h-4 text-rose-600 rounded-sm"
                  />
                  <div>
                    <div className="font-semibold text-slate-800 text-[11px]">
                      حذف الأصناف والمنتجات والخامات المضافة يدوياً
                    </div>
                    <div className="text-[10px] text-slate-500">
                      حذف الأصناف التجريبية التي تمت إضافتها للتجربة
                    </div>
                  </div>
                </span>
                <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                  {counts.manualItems} صنف مضاف
                </span>
              </label>

              <label className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 hover:border-slate-300 cursor-pointer">
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={options.resetManualWarehouses}
                    onChange={(e) => setOptions({ ...options, resetManualWarehouses: e.target.checked })}
                    disabled={!isSystemAdmin}
                    className="w-4 h-4 text-rose-600 rounded-sm"
                  />
                  <div>
                    <div className="font-semibold text-slate-800 text-[11px]">
                      حذف المستودعات والمخازن الإضافية المضافة يدوياً
                    </div>
                    <div className="text-[10px] text-slate-500">
                      الإبقاء على المستودعات الافتراضية للشركة
                    </div>
                  </div>
                </span>
                <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                  {counts.manualWhs} مستودع مضاف
                </span>
              </label>
            </div>
          </div>

          {/* القسم 4: الصناديق والخزنات والدليل المحاسبي */}
          <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 text-slate-900 font-bold">
              <span className="flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-indigo-600" />
                <span>4. الصناديق والخزنات والدليل المحاسبي</span>
              </span>
              <span className="text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200 font-mono">
                {treasuries.length} خزنة / {accounts.length} حساب
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 hover:border-slate-300 cursor-pointer">
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={options.zeroTreasuryBalances}
                    onChange={(e) => setOptions({ ...options, zeroTreasuryBalances: e.target.checked })}
                    disabled={!isSystemAdmin}
                    className="w-4 h-4 text-rose-600 rounded-sm"
                  />
                  <div>
                    <div className="font-semibold text-slate-800 text-[11px]">
                      تصفير أرصدة الصناديق والخزنات وحذف حركاتها
                    </div>
                    <div className="text-[10px] text-slate-500">
                      تصفير الرصيد النقدي والعملات المتعددة (₪ 0.00) لبدء إيداع رأس المال الفعلي
                    </div>
                  </div>
                </span>
                <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                  {counts.treasWithBal} خزنة بها رصيد
                </span>
              </label>

              <label className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 hover:border-slate-300 cursor-pointer">
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={options.resetManualTreasuries}
                    onChange={(e) => setOptions({ ...options, resetManualTreasuries: e.target.checked })}
                    disabled={!isSystemAdmin}
                    className="w-4 h-4 text-rose-600 rounded-sm"
                  />
                  <div>
                    <div className="font-semibold text-slate-800 text-[11px]">
                      حذف الصناديق والحسابات البنكية المضافة يدوياً
                    </div>
                    <div className="text-[10px] text-slate-500">
                      الإبقاء على الخزينة النقدية الرئيسية الافتراضية
                    </div>
                  </div>
                </span>
                <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                  {counts.manualTreas} مضاف
                </span>
              </label>

              <label className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 hover:border-slate-300 cursor-pointer">
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={options.zeroAccountBalances}
                    onChange={(e) => setOptions({ ...options, zeroAccountBalances: e.target.checked })}
                    disabled={!isSystemAdmin}
                    className="w-4 h-4 text-rose-600 rounded-sm"
                  />
                  <div>
                    <div className="font-semibold text-slate-800 text-[11px]">
                      تصفير أرصدة شجرة الحسابات في الدليل المحاسبي
                    </div>
                    <div className="text-[10px] text-slate-500">
                      تصفير موازين الأصول والخصوم والإيرادات والمصروفات إلى 0.00
                    </div>
                  </div>
                </span>
                <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                  {accounts.length} حساب
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Step 4: Final Confirmation Lock & Execution */}
      <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-2xl border-2 border-rose-600/60 shadow-lg space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
          <div className="w-7 h-7 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold text-xs">
            4
          </div>
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <span>الخطوة الرابعة: التأكيد الأمني المزدوج والتنفيذ النهائي</span>
              <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded border border-rose-500/30">
                إجراء حساس لا رجعة فيه
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              يرجى مراجعة ملخص السجلات المتأثرة ثم كتابة كلمة التأكيد للبدء الفعلي:
            </p>
          </div>
        </div>

        {/* Dynamic Summary Box */}
        <div className="bg-slate-800/90 border border-slate-700 p-3.5 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-200">
            <span>ملخص ما سيتم تصفيره حتى ({scope === 'all' ? 'كافة التواريخ' : cutoffDate}):</span>
            <span className="text-amber-400 font-mono text-sm">
              إجمالي السجلات والحركات المستهدفة: {totalSelectedItemsToZero} سجل
            </span>
          </div>

          <div className="flex flex-wrap gap-2 text-[11px] text-slate-300">
            {options.resetInvoices && (
              <span className="bg-slate-700/80 px-2 py-1 rounded border border-slate-600">
                فواتير مبيعات: <strong>{counts.invCount}</strong>
              </span>
            )}
            {options.resetPurchases && (
              <span className="bg-slate-700/80 px-2 py-1 rounded border border-slate-600">
                فواتير مشتريات: <strong>{counts.purCount}</strong>
              </span>
            )}
            {options.resetVouchers && (
              <span className="bg-slate-700/80 px-2 py-1 rounded border border-slate-600">
                سندات قبض وصرف: <strong>{counts.vchCount}</strong>
              </span>
            )}
            {options.resetJournalEntries && (
              <span className="bg-slate-700/80 px-2 py-1 rounded border border-slate-600">
                قيود يومية: <strong>{counts.jeCount}</strong>
              </span>
            )}
            {options.resetPrintOrders && (
              <span className="bg-slate-700/80 px-2 py-1 rounded border border-slate-600">
                أوامر تشغيل: <strong>{counts.poCount}</strong>
              </span>
            )}
            {options.resetManualParties && (
              <span className="bg-slate-700/80 px-2 py-1 rounded border border-slate-600">
                عملاء وموردين مضافين: <strong>{counts.manualParties}</strong>
              </span>
            )}
            {options.zeroPartyBalances && (
              <span className="bg-slate-700/80 px-2 py-1 rounded border border-slate-600">
                تصفير مديونيات وذمم: <strong>{counts.partiesWithBalance} طرف</strong>
              </span>
            )}
            {options.zeroInventoryStock && (
              <span className="bg-slate-700/80 px-2 py-1 rounded border border-slate-600">
                تصفير كميات المخزون: <strong>{counts.itemsWithStock} صنف</strong>
              </span>
            )}
            {options.resetManualInventoryItems && (
              <span className="bg-slate-700/80 px-2 py-1 rounded border border-slate-600">
                أصناف مضافة يدوياً: <strong>{counts.manualItems}</strong>
              </span>
            )}
            {options.zeroTreasuryBalances && (
              <span className="bg-slate-700/80 px-2 py-1 rounded border border-slate-600">
                تصفير أرصدة الصناديق: <strong>{counts.treasWithBal} خزنة</strong>
              </span>
            )}
            {options.zeroAccountBalances && (
              <span className="bg-slate-700/80 px-2 py-1 rounded border border-slate-600">
                تصفير شجرة الحسابات: <strong>{counts.totalAccounts} حساب</strong>
              </span>
            )}
          </div>
        </div>

        {/* Confirmation Input & Action Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          <div className="flex-1 space-y-1">
            <label className="block text-slate-300 font-bold text-xs">
              للتأكيد، اكتب كلمة <span className="text-rose-400 font-mono font-black text-sm select-all">تصفير</span> في المربع:
            </label>
            <input
              type="text"
              placeholder="اكتب كلمة تصفير للمتابعة..."
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              disabled={!isSystemAdmin || !sessionBackupCompleted}
              className="w-full sm:max-w-md bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 font-bold focus:border-rose-500 focus:outline-hidden disabled:opacity-50"
            />
          </div>

          <button
            type="button"
            onClick={handleExecuteZeroing}
            disabled={!canExecute}
            className={`px-5 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
              canExecute
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-900/50 scale-100 hover:scale-[1.02]'
                : 'bg-slate-800 border border-slate-700 text-slate-500 cursor-not-allowed opacity-60'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>
              {isExecuting ? 'جاري تنفيذ التصفير...' : 'تأكيد تصفير قاعدة البيانات والبدء الفعلي'}
            </span>
          </button>
        </div>

        {/* Guidance messages */}
        {!sessionBackupCompleted && (
          <p className="text-[11px] text-amber-400 flex items-center gap-1.5 font-bold">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>يجب تنزيل نسخة احتياطية أولاً في الخطوة 1 لتفعيل زر التصفير وحماية بيانات المنشأة.</span>
          </p>
        )}
      </div>

      {/* Result Modal */}
      {showResultModal && executionResult && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  تم تصفير قاعدة البيانات بنجاح!
                </h3>
                <p className="text-xs text-slate-500">
                  النظام مهيأ الآن للبدء الفعلي والتشغيل الإنتاجي النظيف.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-2">
              <div className="font-bold text-slate-800 text-[11px] border-b border-slate-200 pb-1">
                تقرير تنفيذ عملية التصفير:
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-700">
                <div>فواتير مبيعات محذوفة: <strong>{executionResult.summary.deletedInvoices}</strong></div>
                <div>فواتير مشتريات محذوفة: <strong>{executionResult.summary.deletedPurchases}</strong></div>
                <div>سندات مالية محذوفة: <strong>{executionResult.summary.deletedVouchers}</strong></div>
                <div>قيود محاسبية محذوفة: <strong>{executionResult.summary.deletedJournalEntries}</strong></div>
                <div>أوامر تشغيل محذوفة: <strong>{executionResult.summary.deletedPrintOrders}</strong></div>
                <div>عملاء وموردين تم حذفهم: <strong>{executionResult.summary.deletedManualParties}</strong></div>
                <div>أرصدة أطراف تم تصفيرها: <strong>{executionResult.summary.zeroedPartyBalances}</strong></div>
                <div>أصناف تم تصفير كمياتها: <strong>{executionResult.summary.zeroedInventoryStocks}</strong></div>
                <div>أصناف مضافة تم حذفها: <strong>{executionResult.summary.deletedManualItems}</strong></div>
                <div>خزنات تم تصفير رصيدها: <strong>{executionResult.summary.zeroedTreasuries}</strong></div>
              </div>
              <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-200 flex justify-between">
                <span>المنفذ: {executionResult.executedBy}</span>
                <span>التاريخ: {new Date(executionResult.executedAt).toLocaleString('ar-SA')}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowResultModal(false);
                  window.location.reload();
                }}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs"
              >
                إغلاق وتحديث النظام
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
