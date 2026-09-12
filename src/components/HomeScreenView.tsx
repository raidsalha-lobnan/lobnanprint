import React, { useState } from 'react';
import { useAccounting } from '../context/AccountingContext';
import {
  ShoppingCart,
  FileText,
  Printer,
  Boxes,
  Truck,
  Users,
  Wallet,
  BookOpenCheck,
  BarChart3,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  Sparkles,
  Clock,
  AlertTriangle,
  SlidersHorizontal,
  Check,
  LayoutDashboard,
  Layers,
  UserCheck,
  Search,
  ChevronLeft,
  Store,
  RotateCcw,
  X,
  Database,
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle2,
  HardDrive
} from 'lucide-react';

interface ShortcutDefinition {
  id: string;
  title: string;
  subtitle: string;
  category: 'operations' | 'finance' | 'inventory' | 'reports';
  icon: React.ElementType;
  gradient: string;
  textColor: string;
  badge?: string;
  badgeBg?: string;
  onClick: (helpers: ShortcutHelpers) => void;
}

interface ShortcutHelpers {
  setActiveTab: (tab: string) => void;
  openCustomerStatement: () => void;
  openSupplierStatement: () => void;
}

export const HomeScreenView: React.FC = () => {
  const {
    setActiveTab,
    settings,
    updateSettings,
    stats,
    invoices,
    printOrders,
    parties,
    setSelectedPartyForStatement,
    currentUser,
    getActiveBranch,
    branches,
    isOnline,
    lastSyncTime,
    isFirebaseSyncing,
    lastFirebaseSyncTime,
    hasUnsyncedChanges,
    pendingSyncCount,
    lastLocalSaveTime,
    forceSyncNow
  } = useAccounting();

  const [syncFeedback, setSyncFeedback] = useState<{ message: string; success: boolean } | null>(null);

  const handleManualSync = async () => {
    const res = await forceSyncNow();
    setSyncFeedback(res);
    setTimeout(() => setSyncFeedback(null), 4500);
  };

  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const activeBranch = getActiveBranch() || branches[0];

  // Open Customer Statement Modal with first available customer or prompt
  const handleOpenCustomerStatement = () => {
    const customer = parties.find(p => p.type === 'customer' || p.type === 'both') || parties[0];
    if (customer) {
      setSelectedPartyForStatement(customer);
    } else {
      setActiveTab('parties');
    }
  };

  // Open Supplier Statement Modal with first available supplier or prompt
  const handleOpenSupplierStatement = () => {
    const supplier = parties.find(p => p.type === 'supplier' || p.type === 'both') || parties[0];
    if (supplier) {
      setSelectedPartyForStatement(supplier);
    } else {
      setActiveTab('parties');
    }
  };

  const helpers: ShortcutHelpers = {
    setActiveTab,
    openCustomerStatement: handleOpenCustomerStatement,
    openSupplierStatement: handleOpenSupplierStatement
  };

  const allShortcuts: ShortcutDefinition[] = [
    {
      id: 'pos',
      title: 'كاشير المبيعات (POS)',
      subtitle: 'إنهاء فواتير المبيعات السريعة والتحصيل الفوري',
      category: 'operations',
      icon: ShoppingCart,
      gradient: 'from-emerald-500 to-teal-700',
      textColor: 'text-emerald-700',
      badge: 'العملية الدائمة',
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      onClick: (h) => h.setActiveTab('pos')
    },
    {
      id: 'customer_statement',
      title: 'كشف حساب عميل',
      subtitle: 'متابعة الفواتير والمديونيات والدفعات وحركات العميل',
      category: 'finance',
      icon: Users,
      gradient: 'from-blue-500 to-indigo-700',
      textColor: 'text-blue-700',
      badge: 'كشف مالي سريع',
      badgeBg: 'bg-blue-100 text-blue-800 border-blue-200',
      onClick: (h) => h.openCustomerStatement()
    },
    {
      id: 'supplier_statement',
      title: 'كشف حساب مورد',
      subtitle: 'كشف تفصيلي بمشتريات الخامات والدفعات للموردين',
      category: 'finance',
      icon: Truck,
      gradient: 'from-purple-500 to-indigo-800',
      textColor: 'text-purple-700',
      badge: 'مشتريات وخامات',
      badgeBg: 'bg-purple-100 text-purple-800 border-purple-200',
      onClick: (h) => h.openSupplierStatement()
    },
    {
      id: 'new_print_order',
      title: 'أمر تشغيل ورشة طباعة',
      subtitle: 'إصدار أمر تشغيل بمواصفات الورق والمقاسات والتسليم',
      category: 'operations',
      icon: Printer,
      gradient: 'from-sky-500 to-blue-700',
      textColor: 'text-sky-700',
      badge: stats.pendingPrintJobs > 0 ? `${stats.pendingPrintJobs} معلق` : undefined,
      badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
      onClick: (h) => h.setActiveTab('print_orders')
    },
    {
      id: 'new_invoice',
      title: 'فواتير المبيعات',
      subtitle: 'استعراض وتعديل وطباعة فواتير المبيعات المعتمدة',
      category: 'operations',
      icon: FileText,
      gradient: 'from-teal-500 to-emerald-700',
      textColor: 'text-teal-700',
      onClick: (h) => h.setActiveTab('invoices')
    },
    {
      id: 'purchases',
      title: 'فاتورة مشتريات خامات',
      subtitle: 'إدخال مشتريات الورق والأحبار والمستلزمات للمستودع',
      category: 'inventory',
      icon: Truck,
      gradient: 'from-amber-500 to-orange-700',
      textColor: 'text-amber-700',
      onClick: (h) => h.setActiveTab('purchases')
    },
    {
      id: 'receipt_voucher',
      title: 'سند قبض نقدية / بنك',
      subtitle: 'إثبات تحصيل مالي من عميل أو إيراد وتغذية الصندوق',
      category: 'finance',
      icon: ArrowDownLeft,
      gradient: 'from-emerald-600 to-teal-800',
      textColor: 'text-emerald-700',
      onClick: (h) => h.setActiveTab('receipt_vouchers')
    },
    {
      id: 'sales_returns',
      title: 'مرتجع فواتير المبيعات',
      subtitle: 'إصدار إشعارات دائنة ضريبية وتسوية مبالغ العملاء ورد البضائع',
      category: 'operations',
      icon: RotateCcw,
      gradient: 'from-rose-500 to-red-700',
      textColor: 'text-rose-700',
      onClick: (h) => h.setActiveTab('sales_returns')
    },
    {
      id: 'payment_voucher',
      title: 'سند صرف لمورد أو مصروف',
      subtitle: 'سداد مستحقات الموردين أو مصاريف تشغيلية من الصندوق',
      category: 'finance',
      icon: ArrowUpRight,
      gradient: 'from-rose-500 to-pink-700',
      textColor: 'text-rose-700',
      onClick: (h) => h.setActiveTab('treasuries')
    },
    {
      id: 'treasury_transfer',
      title: 'تحويل بين الخزنات',
      subtitle: 'مناقلة نقدية بين الصناديق وحسابات البنوك مع قيد فوري',
      category: 'finance',
      icon: ArrowLeftRight,
      gradient: 'from-violet-500 to-purple-700',
      textColor: 'text-violet-700',
      onClick: (h) => h.setActiveTab('treasuries')
    },
    {
      id: 'inventory',
      title: 'المخزون والورق',
      subtitle: 'أرصدة الخامات، حدود الأمان، وأصناف المستودعات',
      category: 'inventory',
      icon: Boxes,
      gradient: 'from-orange-500 to-amber-700',
      textColor: 'text-orange-700',
      badge: stats.lowStockCount > 0 ? `${stats.lowStockCount} نواقص` : undefined,
      badgeBg: 'bg-rose-100 text-rose-800 border-rose-200',
      onClick: (h) => h.setActiveTab('inventory')
    },
    {
      id: 'dashboard_info',
      title: 'لوحة المعلومات والأرصدة',
      subtitle: 'استعراض الأرصدة الشاملة، الصندوق اليومي، والرسوم البيانية',
      category: 'reports',
      icon: LayoutDashboard,
      gradient: 'from-indigo-500 to-blue-700',
      textColor: 'text-indigo-700',
      onClick: (h) => h.setActiveTab('dashboard')
    },
    {
      id: 'accounting',
      title: 'دفتر اليومية والقيود',
      subtitle: 'سجل القيود المحاسبية المزدوجة المتوازنة ودفتر الأستاذ',
      category: 'finance',
      icon: BookOpenCheck,
      gradient: 'from-cyan-600 to-blue-800',
      textColor: 'text-cyan-700',
      onClick: (h) => h.setActiveTab('accounting')
    },
    {
      id: 'employees',
      title: 'رواتب وسلف الموظفين',
      subtitle: 'سجلات الموظفين، السلف، المكافآت، والمسير الشهري',
      category: 'finance',
      icon: UserCheck,
      gradient: 'from-blue-600 to-indigo-800',
      textColor: 'text-blue-700',
      onClick: (h) => h.setActiveTab('employees')
    },
    {
      id: 'reports',
      title: 'الأرباح والتقارير والضريبة',
      subtitle: 'قوائم الدخل، كشوفات المبيعات، وميزان المراجعة والضريبة',
      category: 'reports',
      icon: BarChart3,
      gradient: 'from-emerald-600 to-teal-800',
      textColor: 'text-emerald-700',
      onClick: (h) => h.setActiveTab('reports')
    }
  ];

  // Active enabled shortcut IDs (from settings or fallback)
  const enabledShortcutIds = settings.homeShortcuts && settings.homeShortcuts.length > 0
    ? settings.homeShortcuts
    : allShortcuts.map(s => s.id);

  const displayedShortcuts = allShortcuts.filter(s => {
    const isEnabled = enabledShortcutIds.includes(s.id);
    if (!isEnabled) return false;
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return s.title.toLowerCase().includes(term) || s.subtitle.toLowerCase().includes(term);
  });

  const handleToggleShortcut = (id: string) => {
    const current = settings.homeShortcuts || allShortcuts.map(s => s.id);
    let updated: string[];
    if (current.includes(id)) {
      updated = current.filter(x => x !== id);
    } else {
      updated = [...current, id];
    }
    updateSettings({
      ...settings,
      homeShortcuts: updated
    });
  };

  const handleSelectAllShortcuts = () => {
    updateSettings({
      ...settings,
      homeShortcuts: allShortcuts.map(s => s.id)
    });
  };

  const handleResetShortcuts = () => {
    updateSettings({
      ...settings,
      homeShortcuts: [
        'pos',
        'customer_statement',
        'supplier_statement',
        'new_invoice',
        'new_print_order',
        'payment_voucher',
        'receipt_voucher',
        'purchases',
        'inventory',
        'treasury_transfer',
        'dashboard_info',
        'reports'
      ]
    });
  };

  const todayArabic = new Intl.DateTimeFormat('ar-SA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date());

  const todayStr = new Date().toISOString().split('T')[0];
  const calculatedTodaySales = (invoices || [])
    .filter(inv => inv?.date && inv.date.startsWith(todayStr))
    .reduce((sum, inv) => sum + (inv.totalAmount || (inv as any).total || 0), 0);

  const todaySales = stats?.todaySales !== undefined ? stats.todaySales : calculatedTodaySales;

  const recentInvoices = (invoices || []).slice(0, 4);
  const recentPrintJobs = (printOrders || []).slice(0, 3);

  return (
    <div className="space-y-4 pb-12 w-full px-2 sm:px-4">
      {/* Top Welcome & Context Hero */}
      <div className="bg-gradient-to-r from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white rounded-2xl p-4 sm:p-6 shadow-md border border-slate-700/80 relative overflow-hidden">
        {/* Background Subtle Accent */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none translate-x-1/3 translate-y-1/3"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="bg-blue-600/90 text-white font-bold px-2.5 py-0.5 rounded-full border border-blue-400/40 flex items-center gap-1.5 shadow-2xs">
                <Sparkles className="w-3 h-3 text-amber-300" />
                الشاشة الرئيسية
              </span>
              <span className="text-slate-300 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {todayArabic}
              </span>
              <span className="text-slate-400">|</span>
              <span className="text-blue-300 flex items-center gap-1 font-medium">
                <Store className="w-3.5 h-3.5" />
                الفرع: {activeBranch?.name || 'المركز الرئيسي'}
              </span>
            </div>

            <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>أهلاً بك،</span>
              <span className="text-blue-400">{currentUser.fullName}</span>
              <span className="text-xs font-normal text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700">
                {currentUser.roleName}
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              مركز الانطلاق السريع لتشغيل مهامك اليومية بكفاءة عالية. اضغط على أي اختصار أدناه لبدء العملية فوراً، أو خصص الأزرار المعروضة لتناسب روتين عملك.
            </p>
          </div>

          {/* Quick Action Buttons in Hero */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setIsCustomizeModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold border border-slate-600 shadow-sm transition-all cursor-pointer"
              title="تخصيص الاختصارات المعروضة في الشاشة الرئيسية حسب حاجتك"
            >
              <SlidersHorizontal className="w-4 h-4 text-blue-400" />
              <span>تخصيص الاختصارات</span>
              <span className="text-[10px] bg-blue-900/70 text-blue-200 px-1.5 py-0.2 rounded-full border border-blue-700/50">
                {displayedShortcuts.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
              title="الانتقال إلى لوحة المعلومات والتحليلات المالية الشاملة"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>لوحة المعلومات</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Hero Bottom Mini Liquidity Tickers */}
        <div className="mt-5 pt-4 border-t border-slate-700/60 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/60">
            <span className="text-slate-400 text-[11px] block">رصيد الصندوق اليومي:</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <strong className="font-mono text-emerald-400 font-bold text-sm sm:text-base">
                {(stats?.cashBalance ?? 0).toLocaleString('ar-SA')}
              </strong>
              <span className="text-[10px] text-slate-400">{settings.currency}</span>
            </div>
          </div>

          <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/60">
            <span className="text-slate-400 text-[11px] block">رصيد البنك:</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <strong className="font-mono text-blue-300 font-bold text-sm sm:text-base">
                {(stats?.bankBalance ?? 0).toLocaleString('ar-SA')}
              </strong>
              <span className="text-[10px] text-slate-400">{settings.currency}</span>
            </div>
          </div>

          <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/60">
            <span className="text-slate-400 text-[11px] block">مبيعات اليوم:</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <strong className="font-mono text-emerald-400 font-bold text-sm sm:text-base">
                {(todaySales ?? 0).toLocaleString('ar-SA')}
              </strong>
              <span className="text-[10px] text-slate-400">{settings.currency}</span>
            </div>
          </div>

          <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/60">
            <span className="text-slate-400 text-[11px] block">أوامر ورشة الطباعة:</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <strong className="font-mono text-amber-300 font-bold text-sm sm:text-base">
                {stats?.pendingPrintJobs ?? 0}
              </strong>
              <span className="text-[10px] text-slate-400">أمر قيد التنفيذ</span>
            </div>
          </div>
        </div>
      </div>

      {/* Offline-First Persistence & Main Database Sync Status Card */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl shrink-0 ${
              !isOnline
                ? 'bg-amber-100 text-amber-700 border border-amber-200'
                : hasUnsyncedChanges
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
            }`}>
              {!isOnline ? (
                <WifiOff className="w-5 h-5 text-amber-600 animate-pulse" />
              ) : isFirebaseSyncing ? (
                <RefreshCw className="w-5 h-5 text-sky-600 animate-spin" />
              ) : (
                <Database className="w-5 h-5 text-emerald-600" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-slate-800">
                  الحفظ الفوري بالذاكرة المحلية ومزامنة قاعدة البيانات الرئيسية
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                  !isOnline
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  {!isOnline ? 'وضع غير متصل (Offline)' : 'متصل بالإنترنت (Online)'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                تُحفظ كافة العمليات والفواتير فورياً في الذاكرة المحلية (LocalStorage). لا يتوقف النظام إطلاقاً عند انقطاع الإنترنت، وتتم المزامنة تلقائياً مع قاعدة البيانات فور توفر الاتصال.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-2 md:pt-0 border-slate-100">
            <div className="text-right text-xs">
              <div className="text-slate-400 text-[11px]">حالة المزامنة:</div>
              <div className="font-bold text-slate-700 flex items-center gap-1">
                {isFirebaseSyncing ? (
                  <span className="text-sky-600 font-medium">جاري المزامنة...</span>
                ) : !isOnline ? (
                  <span className="text-amber-600 font-medium">محلي (بانتظار الإنترنت)</span>
                ) : hasUnsyncedChanges ? (
                  <span className="text-blue-600 font-medium">{pendingSyncCount} تعديل بانتظار المزامنة</span>
                ) : (
                  <span className="text-emerald-600 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    متزامن بالكامل
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={handleManualSync}
              disabled={isFirebaseSyncing}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer ${
                isFirebaseSyncing
                  ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                  : !isOnline
                  ? 'bg-amber-500 hover:bg-amber-600 text-white'
                  : hasUnsyncedChanges
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFirebaseSyncing ? 'animate-spin text-slate-400' : ''}`} />
              <span>{isFirebaseSyncing ? 'جاري المزامنة...' : 'مزامنة فورية'}</span>
            </button>
          </div>
        </div>

        {syncFeedback && (
          <div className={`mt-3 p-2.5 rounded-lg text-xs flex items-center justify-between border ${
            syncFeedback.success
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}>
            <span>{syncFeedback.message}</span>
            <button
              onClick={() => setSyncFeedback(null)}
              className="font-bold text-xs underline cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        )}
      </div>

      {/* Main Shortcuts Section */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
          <div>
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>اختصارات العمليات الدائمة</span>
            </h2>
            <p className="text-xs text-slate-500">
              الوصول الفوري لكاشير المبيعات، كشوف الحسابات، أوامر التشغيل، وسندات الصرف والقبض بنقرة واحدة
            </p>
          </div>

          {/* Quick Search in Shortcuts */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="بحث في الاختصارات..."
              className="w-full bg-white border border-slate-300 rounded-lg pr-8 pl-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-2xs"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>

        {/* Grid of Shortcuts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {displayedShortcuts.map((shortcut) => {
            const Icon = shortcut.icon;
            return (
              <div
                key={shortcut.id}
                onClick={() => shortcut.onClick(helpers)}
                className="group relative bg-white rounded-xl border border-slate-200/90 hover:border-blue-400 p-4 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden"
              >
                {/* Top Subtle Color Accent Bar */}
                <div className={`absolute top-0 right-0 left-0 h-1 bg-gradient-to-r ${shortcut.gradient} opacity-80 group-hover:opacity-100 transition-opacity`}></div>

                <div>
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${shortcut.gradient} flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    {shortcut.badge && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${shortcut.badgeBg || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                        {shortcut.badge}
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center justify-between">
                    <span>{shortcut.title}</span>
                  </h3>

                  <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
                    {shortcut.subtitle}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-400 group-hover:text-blue-600 transition-colors">
                  <span>فتح العملية الآن</span>
                  <ChevronLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>

        {displayedShortcuts.length === 0 && (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center">
            <SlidersHorizontal className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">لم يتم العثور على اختصارات تطابق بحثك</p>
            <p className="text-xs text-slate-400 mt-1">تأكد من تفعيل الأزرار المطلوبة من خلال زر "تخصيص الاختصارات"</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setIsCustomizeModalOpen(true);
              }}
              className="mt-3 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition"
            >
              فتح نافذة تخصيص الاختصارات
            </button>
          </div>
        )}
      </div>

      {/* Fast Activity Overview / Recent Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
        {/* Recent Invoices Quick Access */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold text-slate-800">آخر فواتير المبيعات</h3>
            </div>
            <button
              onClick={() => setActiveTab('invoices')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 cursor-pointer"
            >
              <span>عرض الكل</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentInvoices.length > 0 ? (
              recentInvoices.map((inv) => (
                <div
                  key={inv.id}
                  onClick={() => setActiveTab('invoices')}
                  className="py-2.5 flex items-center justify-between hover:bg-slate-50 px-2 rounded-lg transition-colors cursor-pointer text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-[11px]">
                      {inv.invoiceNumber}
                    </span>
                    <span className="font-semibold text-slate-800 truncate">{inv.customerName}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-slate-900">
                      {(inv.totalAmount || (inv as any).total || 0).toLocaleString('ar-SA')} {settings.currency}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      inv.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                      inv.paymentStatus === 'partial' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {inv.paymentStatus === 'paid' ? 'مدفوعة' : inv.paymentStatus === 'partial' ? 'جزئي' : 'آجلة'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-3 text-center">لا توجد فواتير مبيعات مسجلة حتى الآن</p>
            )}
          </div>
        </div>

        {/* Recent Print Jobs Quick Access */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Printer className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold text-slate-800">أوامر ورشة الطباعة قيد المتابعة</h3>
            </div>
            <button
              onClick={() => setActiveTab('print_orders')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 cursor-pointer"
            >
              <span>عرض الورشة</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentPrintJobs.length > 0 ? (
              recentPrintJobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => setActiveTab('print_orders')}
                  className="py-2.5 flex items-center justify-between hover:bg-slate-50 px-2 rounded-lg transition-colors cursor-pointer text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-[11px]">
                      {job.orderNumber}
                    </span>
                    <span className="font-semibold text-slate-800 truncate">{job.title || (job as any).jobTitle || 'أمر تشغيل ورشة'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500">{job.customerName}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                      {job.status === 'received' ? 'مستلم' : job.status === 'in_progress' ? 'قيد الطباعة' : job.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-3 text-center">لا توجد أوامر تشغيل ورشة حالياً</p>
            )}
          </div>
        </div>
      </div>

      {/* Customize Shortcuts Modal (نافذة تخصيص الاختصارات) */}
      {isCustomizeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-[#0f172a] text-white p-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600/80 flex items-center justify-center text-white">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">تخصيص أزرار واختصارات الشاشة الرئيسية</h3>
                  <p className="text-[11px] text-slate-400">
                    حدد العمليات التي ترغب بإظهارها على شاشتك الرئيسية لتسريع وصولك اليومي
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCustomizeModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Quick Actions */}
            <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSelectAllShortcuts}
                  className="text-blue-600 hover:text-blue-700 font-bold hover:underline cursor-pointer"
                >
                  تحديد الكل ({allShortcuts.length})
                </button>
                <span className="text-slate-300">|</span>
                <button
                  onClick={handleResetShortcuts}
                  className="text-slate-600 hover:text-slate-800 font-bold hover:underline cursor-pointer"
                >
                  استعادة الترتيب الافتراضي
                </button>
              </div>
              <span className="text-slate-500 font-mono text-[11px]">
                المفعل حالياً: {enabledShortcutIds.length} من {allShortcuts.length}
              </span>
            </div>

            {/* Modal Body / Checklist */}
            <div className="p-4 overflow-y-auto space-y-2.5 flex-1 divide-y divide-slate-100">
              {allShortcuts.map((shortcut) => {
                const Icon = shortcut.icon;
                const isChecked = enabledShortcutIds.includes(shortcut.id);

                return (
                  <label
                    key={shortcut.id}
                    className={`pt-2.5 first:pt-0 flex items-center justify-between gap-3 p-2 rounded-xl transition-all cursor-pointer ${
                      isChecked ? 'bg-blue-50/50 hover:bg-blue-50' : 'hover:bg-slate-50 opacity-70'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${shortcut.gradient} flex items-center justify-center text-white shrink-0 shadow-2xs`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{shortcut.title}</span>
                          {shortcut.badge && (
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-semibold">
                              {shortcut.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">{shortcut.subtitle}</p>
                      </div>
                    </div>

                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleShortcut(shortcut.id)}
                        className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                      />
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 p-3.5 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                يتم حفظ التفضيلات فورياً في إعدادات المنشأة والمتصفح
              </span>
              <button
                onClick={() => setIsCustomizeModalOpen(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
              >
                تم وتطبيق الاختصارات
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
