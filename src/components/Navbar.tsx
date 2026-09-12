import React, { useState, useRef, useEffect } from 'react';
import { useAccounting } from '../context/AccountingContext';
import {
  LayoutDashboard,
  ShoppingCart,
  Printer,
  FileText,
  Boxes,
  Truck,
  Users,
  UserCheck,
  Wallet,
  BookOpenCheck,
  BarChart3,
  Settings,
  Plus,
  Download,
  RotateCcw,
  Sparkles,
  Clock,
  AlertTriangle,
  Building2,
  ShieldCheck,
  Store,
  ChevronDown,
  PackageCheck,
  Layers,
  ArrowRightLeft,
  Check,
  Receipt,
  History,
  Wifi,
  WifiOff,
  RefreshCw,
  Database,
  CheckCircle2,
  HardDrive
} from 'lucide-react';

interface SubMenuItem {
  id: string;
  label: string;
  sublabel?: string;
  icon: React.ElementType;
  badge?: string | null;
  badgeColor?: string;
}

interface TopMenuSection {
  id: string;
  title: string;
  icon?: React.ElementType;
  items: SubMenuItem[];
}

export const Navbar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    settings,
    stats,
    exportDataJSON,
    resetAllData,
    branches,
    activeBranchId,
    setActiveBranchId,
    getActiveBranch,
    warehouses,
    warehouseOperations,
    users,
    currentUserId,
    setCurrentUserId,
    currentUser,
    getAllowedBranchesForUser,
    isOnline,
    lastSyncTime,
    isFirebaseSyncing,
    lastFirebaseSyncTime,
    hasUnsyncedChanges,
    pendingSyncCount,
    lastLocalSaveTime,
    forceSyncNow,
    hasPermission
  } = useAccounting();

  const [syncFeedback, setSyncFeedback] = useState<{ message: string; success: boolean } | null>(null);

  const handleManualSync = async () => {
    const res = await forceSyncNow();
    setSyncFeedback(res);
    setTimeout(() => setSyncFeedback(null), 4500);
  };

  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<any>(null);

  const activeBranch = getActiveBranch() || branches[0];
  const allowedBranches = getAllowedBranchesForUser(currentUser);

  // Close dropdown on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
        setOpenDropdownId(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
        setOpenDropdownId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const todayArabic = new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date());

  // Definition of Dropdown Menus in the Top Row matching user exact specifications
  const menuSections: TopMenuSection[] = [
    {
      id: 'control_panel_menu',
      title: 'لوحة التحكم',
      icon: LayoutDashboard,
      items: [
        {
          id: 'home',
          label: '1. الشاشة الرئيسية',
          sublabel: 'اختصارات سريعة للعمليات الدائمة (كاشير، كشوف حسابات، فواتير وأوامر تشغيل مع إمكانية التخصيص)',
          icon: Sparkles,
          badge: 'سريعة ومخصصة',
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
        },
        {
          id: 'dashboard',
          label: '2. لوحة المعلومات',
          sublabel: 'استعراض الأرصدة الشاملة (الصندوق اليومي، المبيعات، البنوك، الأرباح والمؤشرات المالية)',
          icon: LayoutDashboard,
          badge: 'الأرصدة والتحليلات',
          badgeColor: 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
        }
      ]
    },
    // 1. المبيعات : قائمة منسدلة
    {
      id: 'sales_menu',
      title: 'المبيعات',
      icon: ShoppingCart,
      items: [
        {
          id: 'pos',
          label: '1. الكاشير / نقطة البيع',
          sublabel: 'نقاط البيع السريعة والتحصيل الفوري والفواتير النقدية والآجلة',
          icon: ShoppingCart,
          badge: 'سريع',
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
        },
        {
          id: 'print_orders',
          label: '2. أوامر الطباعة والورشة أو طلبات الطباعة والورشة',
          sublabel: 'إدارة أوامر التصنيع والطباعة، تذاكر العمل ومراحل الإنجاز والتسليم',
          icon: Printer,
          badge: (stats?.pendingPrintJobs ?? 0) > 0 ? `${stats.pendingPrintJobs}` : null,
          badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
        },
        {
          id: 'parties',
          label: '3. العملاء',
          sublabel: 'بيانات العملاء، المديونيات، أرصدة الذمم وكشوف الحسابات التفصيلية',
          icon: Users
        },
        {
          id: 'invoices',
          label: '4. فواتير المبيعات',
          sublabel: 'إدارة واستعراض وطباعة فواتير المبيعات المعتمدة وحالات الدفع والتحصيل',
          icon: FileText
        },
        {
          id: 'sales_returns',
          label: '5. مرتجع فواتير المبيعات',
          sublabel: 'إصدار إشعارات دائنة ضريبية، استرداد المبالغ وإرجاع البضائع للمخزن',
          icon: RotateCcw,
          badge: (stats?.salesReturnsCount ?? 0) > 0 ? `${stats.salesReturnsCount}` : null,
          badgeColor: 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
        },
        {
          id: 'receipt_vouchers',
          label: '6. سند قبض',
          sublabel: 'تحرير وطباعة سندات القبض المالية وتحصيل الدفعات النقدية والبنكية',
          icon: Receipt
        }
      ]
    },
    // 2. المشتريات والمصروفات : قائمة منسدلة
    {
      id: 'purchases_expenses_menu',
      title: 'المشتريات والمصروفات',
      icon: Truck,
      items: [
        {
          id: 'purchases_suppliers',
          label: '1. الموردين',
          sublabel: 'سجل الموردين، أرصدة الالتزامات والمستحقات، والبيانات الضريبية',
          icon: Truck
        },
        {
          id: 'purchases_invoices',
          label: '2. فاتورة شراء',
          sublabel: 'تسجيل فواتير شراء الخامات والورق والمستلزمات وتحديث المخزون',
          icon: FileText
        },
        {
          id: 'purchases_returns',
          label: '3. مرتجع فاتورة شراء',
          sublabel: 'مردودات المشتريات وإصدار إشعارات مدينة وتخفيض مديونية المورد',
          icon: RotateCcw
        },
        {
          id: 'payment_vouchers',
          label: '4. سند صرف',
          sublabel: 'صرف مستحقات الموردين والعهد وتسديد الدفعات النقدية والبنكية',
          icon: Wallet
        },
        {
          id: 'expenses',
          label: '5. المصروفات',
          sublabel: 'تسجيل مصروفات الإيجار، الكهرباء، الرواتب والتشغيل مع الترحيل المحاسبي',
          icon: ArrowRightLeft
        }
      ]
    },
    // 3. الأصناف : قائمة منسدلة
    {
      id: 'items_menu',
      title: 'الأصناف',
      icon: Boxes,
      items: [
        {
          id: 'inventory',
          label: '1. قائمة الأصناف وبطاقات المخزون',
          sublabel: 'بطاقات الأصناف، ألواح الورق، الأحبار، حدود الأمان والجرد الدوري',
          icon: Boxes,
          badge: stats.lowStockCount > 0 ? `${stats.lowStockCount} نواقص` : null,
          badgeColor: 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
        },
        {
          id: 'warehouses',
          label: '2. حركات وأذون المخازن',
          sublabel: 'أذون الصرف والتوريد والتحويلات المخزنية بين الفروع والمستودعات',
          icon: PackageCheck
        }
      ]
    },
    // 4. الموظفون والموارد البشرية : قائمة منسدلة
    {
      id: 'hr_menu',
      title: 'الموظفون والموارد البشرية',
      icon: UserCheck,
      items: [
        {
          id: 'employees',
          label: '1. سجل الموظفين وبيانات العمل',
          sublabel: 'سجلات العاملين، الأقسام، الرواتب والبيانات الشخصية',
          icon: Users,
          badge: stats.totalEmployeesCount > 0 ? `${stats.totalEmployeesCount}` : null,
          badgeColor: 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
        },
        {
          id: 'employees_adjustments',
          label: '2. السلف والاستقطاعات والمكافآت',
          sublabel: 'تسجيل سلف الموظفين، الخصومات الشهرية والحوافز والمكافآت',
          icon: Wallet
        },
        {
          id: 'employees_payroll',
          label: '3. مسيرات الرواتب وصرف المستحقات',
          sublabel: 'إعداد واعتماد مسير الرواتب الشهري والصرف النقدي والبنكي',
          icon: FileText
        },
        {
          id: 'report_employee_statement',
          label: '4. كشف حساب تفصيلي موظف',
          sublabel: 'تقرير شامل لاستحقاقات وسلف وخصومات الموظف وصافي المستحق',
          icon: UserCheck
        }
      ]
    },
    // 5. المالية والمحاسبة : قائمة منسدلة
    {
      id: 'finance_accounting_menu',
      title: 'المالية والمحاسبة',
      icon: Wallet,
      items: [
        {
          id: 'branches',
          label: '1. الفروع والشركات',
          sublabel: 'إدارة الفروع والمراكز المتعددة والربط المالي والصلاحيات',
          icon: Building2,
          badge: branches.length > 0 ? `${branches.length}` : null,
          badgeColor: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
        },
        {
          id: 'warehouses',
          label: '2. المخازن والمستودعات',
          sublabel: 'المستودعات المتعددة، التحويلات المخزنية، وأذون الصرف والتوريد',
          icon: PackageCheck,
          badge: warehouseOperations.length > 0 ? `${warehouseOperations.length}` : null,
          badgeColor: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
        },
        {
          id: 'treasuries',
          label: '3. الصناديق والعملات',
          sublabel: 'حركة الخزينة النقدية، الحسابات البنكية، وأسعار صرف العملات',
          icon: Wallet,
          badge: stats.treasuriesCount > 0 ? `${stats.treasuriesCount}` : null,
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
        },
        {
          id: 'debt_clearing',
          label: '4. مقاصة بين عميل ومورد',
          sublabel: 'تسوية المديونيات المتبادلة بين طرف عميل ومورد بقيد محاسبي آلي',
          icon: ArrowRightLeft
        },
        {
          id: 'accounting',
          label: '5. القيود ودفتر الأستاذ',
          sublabel: 'القيود المحاسبية المزدوجة المتوازنة، دليل الحسابات، وميزان المراجعة',
          icon: BookOpenCheck,
          badge: 'مزدوج',
          badgeColor: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
        }
      ]
    },
    // 6. التقارير : قائمة منسدلة
    {
      id: 'reports_menu',
      title: 'التقارير',
      icon: BarChart3,
      items: [
        {
          id: 'report_customer_statement',
          label: '1. كشف حساب تفصيلي عميل',
          sublabel: 'اختيار العميل الرئيسي أو العميل الرئيسي والفرعي',
          icon: Users
        },
        {
          id: 'report_customer_items',
          label: '2. كشف حساب الأصناف للعميل',
          sublabel: 'تجميع الأصناف المتشابهة للفترة المحددة للعميل الرئيسي أو الفرعي',
          icon: Boxes
        },
        {
          id: 'report_supplier_statement',
          label: '3. كشف حساب تفصيلي مورد',
          sublabel: 'اختيار المورد الرئيسي أو المورد الرئيسي والفرعي',
          icon: Truck
        },
        {
          id: 'report_supplier_items',
          label: '4. كشف حساب الأصناف للمورد',
          sublabel: 'تجميع الأصناف والخامات المتشابهة للفترة المحددة للمورد المحدد',
          icon: Boxes
        },
        {
          id: 'report_receipt_vouchers',
          label: '5. كشف تفصيلي سندات القبض',
          sublabel: 'تفاصيل التحصيلات والمقبوضات النقدية والبنكية حسب الخزينة',
          icon: Receipt
        },
        {
          id: 'report_payment_vouchers',
          label: '6. كشف تفصيلي سندات الصرف',
          sublabel: 'تفاصيل المدفوعات والمنصرفات النقدية والبنكية للموردين والمصاريف',
          icon: Wallet
        },
        {
          id: 'report_employee_statement',
          label: '7. كشف حساب تفصيلي موظف',
          sublabel: 'استحقاقات الموظف، السلف، الاستقطاعات، والحوافز وصافي المستحق',
          icon: UserCheck
        },
        {
          id: 'report_payroll_sheets',
          label: '8. كشف رواتب الموظفين',
          sublabel: 'مسيرات الرواتب الشهرية الشاملة والمبالغ المصروفة والمعتمدة',
          icon: FileText
        },
        {
          id: 'report_treasuries_movement',
          label: '9. كشف تفصيلي للصناديق',
          sublabel: 'تفاصيل حركة الصناديق والتدفقات النقدية والبنكية الداخلة والخارجة',
          icon: Wallet
        },
        {
          id: 'reports',
          label: '10. المركز الشامل للتقارير والتحليلات',
          sublabel: 'لوحة التقارير المركزية والضرائب وقوائم الدخل والمبيعات والمشتريات',
          icon: BarChart3
        }
      ]
    },
    // 7. إعدادات النظام والمنشأة : قائمة منسدلة
    {
      id: 'settings_menu',
      title: 'إعدادات النظام والمنشأة',
      icon: Settings,
      items: [
        {
          id: 'users_permissions',
          label: '1. المستخدمون والصلاحيات',
          sublabel: 'إدارة حسابات المستخدمين، الأدوار، والصلاحيات الأمنية للنظام',
          icon: ShieldCheck,
          badge: users.length > 0 ? `${users.length}` : null,
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
        },
        {
          id: 'settings_general',
          label: '2. البيانات الرسمية والضريبة',
          sublabel: 'اسم المنشأة، السجل التجاري، الرقم الضريبي، العملة والترويسة',
          icon: Settings
        },
        {
          id: 'settings_sql',
          label: '3. التشغيل المحلي وربط خادم sql',
          sublabel: 'إعدادات الاتصال المباشر بقاعدة بيانات SQL المحلية والمزامنة',
          icon: Layers
        },
        {
          id: 'settings_backup',
          label: '4. النسخ الاحتياطي والصيانة',
          sublabel: 'تصدير واستيراد قواعد البيانات والصيانة الشاملة للسجلات',
          icon: Download
        }
      ]
    }
  ];

  const handleSelectSubItem = (itemId: string) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setActiveTab(itemId);
    setOpenDropdownId(null);
  };

  const handleMouseEnter = (sectionId: string) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setOpenDropdownId(sectionId);
  };

  const handleMouseLeave = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = setTimeout(() => {
      setOpenDropdownId(null);
    }, 220);
  };

  const toggleDropdown = (sectionId: string) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setOpenDropdownId(prev => (prev === sectionId ? null : sectionId));
  };

  
  const filterMenuItems = (sections: TopMenuSection[]): TopMenuSection[] => {
    return sections.map(section => {
      const filteredItems = section.items.filter(item => {
        if (!item) return false;
        
        // Define screen permissions based on tab id
        let reqPerm: string | null = null;
        switch(item.id) {
          case 'home':
          case 'dashboard':
            reqPerm = 'view_dashboard';
            break;
          case 'pos':
            reqPerm = 'view_pos';
            break;
          case 'print_orders':
            reqPerm = 'view_print_orders';
            break;
          case 'invoices':
          case 'sales_returns':
            reqPerm = 'view_invoices';
            break;
          case 'inventory':
          case 'warehouses':
          case 'purchases':
          case 'purchases_invoices':
          case 'purchases_suppliers':
          case 'purchases_returns':
            reqPerm = 'view_inventory';
            break;
          case 'accounting':
          case 'receipt_vouchers':
          case 'payment_vouchers':
          case 'expenses':
          case 'debt_clearing':
          case 'treasuries':
            reqPerm = 'view_accounting';
            break;
          case 'reports':
          case 'report_customer_statement':
          case 'report_supplier_statement':
          case 'report_employee_statement':
          case 'report_customer_items':
          case 'report_supplier_items':
          case 'report_receipt_vouchers':
          case 'report_payment_vouchers':
          case 'report_payroll_sheets':
          case 'report_treasuries_movement':
            reqPerm = 'view_reports';
            break;
          case 'settings':
          case 'settings_general':
          case 'settings_sql':
          case 'settings_backup':
          case 'users_permissions':
          case 'branches':
          case 'parties':
          case 'employees':
          case 'employees_adjustments':
          case 'employees_payroll':
            reqPerm = 'view_settings';
            break;
        }
        
        if (reqPerm) {
           return hasPermission(reqPerm as any);
        }
        return true;
      });
      return { ...section, items: filteredItems };
    }).filter(section => section.items.length > 0);
  };

  const visibleMenuSections = filterMenuItems(menuSections);

  const isSectionActive = (section: TopMenuSection) => {
    if (section.id === 'control_panel_menu' && ['home', 'dashboard'].includes(activeTab)) return true;
    if (section.id === 'sales_menu' && ['pos', 'print_orders', 'parties', 'invoices', 'sales_returns', 'receipt_vouchers'].includes(activeTab)) return true;
    if (section.id === 'purchases_expenses_menu' && ['purchases', 'purchases_suppliers', 'purchases_invoices', 'purchases_returns', 'payment_vouchers', 'expenses'].includes(activeTab)) return true;
    if (section.id === 'items_menu' && ['inventory', 'warehouses'].includes(activeTab)) return true;
    if (section.id === 'hr_menu' && ['employees', 'employees_adjustments', 'employees_payroll', 'report_employee_statement'].includes(activeTab)) return true;
    if (section.id === 'finance_accounting_menu' && ['branches', 'warehouses', 'treasuries', 'debt_clearing', 'accounting'].includes(activeTab)) return true;
    if (section.id === 'reports_menu' && (activeTab === 'reports' || activeTab.startsWith('report_'))) return true;
    if (section.id === 'settings_menu' && (activeTab === 'settings' || activeTab.startsWith('settings_') || activeTab === 'users_permissions')) return true;
    return section.items.some(item => item.id === activeTab);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0f172a] text-slate-200 shadow-md border-b border-slate-700/80 shrink-0 select-none overflow-visible">
      {/* Top Utility & Brand Bar */}
      <div className="h-13 px-3 sm:px-6 flex items-center justify-between border-b border-slate-800/80 text-xs">
        {/* Brand Header */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition"
            onClick={() => setActiveTab('home')}
            title="الانتقال إلى الشاشة الرئيسية"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center text-white font-black text-base shrink-0 shadow-sm">
              P
            </div>
            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="font-extrabold text-white tracking-tight text-sm">
                  المحاسب الذكي
                </span>
                <span className="text-[11px] text-blue-400 font-semibold bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-800/50">
                  ERP v2.5
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-[180px] sm:max-w-xs">
                {settings.businessName}
              </p>
            </div>
          </div>

          <div className="hidden xl:flex items-center gap-2 text-[11px] text-slate-400 border-r border-slate-700/80 pr-3 mr-1">
            <span>{todayArabic}</span>
            {settings.crNumber && (
              <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700 font-mono text-[10px]">
                س.ت: {settings.crNumber}
              </span>
            )}
          </div>
        </div>

        {/* Center / Liquidity Compact Indicators */}
        <div className="hidden lg:flex items-center gap-2.5 text-xs">
          <div
            onClick={() => setActiveTab('treasuries')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/90 border border-slate-700 text-slate-200 shadow-2xs cursor-pointer hover:bg-slate-700/80 transition"
            title="الصندوق النقدي - اضغط للتفاصيل"
          >
            <Wallet className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400 text-[11px]">الصندوق:</span>
            <strong className="font-mono font-bold text-emerald-400">{(stats?.cashBalance ?? 0).toLocaleString('ar-SA')}</strong>
            <span className="text-[10px] text-slate-400">{settings.currency}</span>
          </div>

          <div
            onClick={() => setActiveTab('treasuries')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/90 border border-slate-700 text-slate-200 shadow-2xs cursor-pointer hover:bg-slate-700/80 transition"
            title="الحساب البنكي - اضغط للتفاصيل"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-400 text-[11px]">البنك:</span>
            <strong className="font-mono font-bold text-blue-300">{(stats?.bankBalance ?? 0).toLocaleString('ar-SA')}</strong>
            <span className="text-[10px] text-slate-400">{settings.currency}</span>
          </div>

          {stats.pendingPrintJobs > 0 && (
            <button
              onClick={() => setActiveTab('print_orders')}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 transition cursor-pointer"
              title="أوامر تشغيل معلقة بالورشة - اضغط للعرض"
            >
              <Clock className="w-3 h-3 text-amber-400 animate-pulse" />
              <span className="text-[11px] font-bold">ورشة: {stats.pendingPrintJobs}</span>
            </button>
          )}

          {stats.lowStockCount > 0 && (
            <button
              onClick={() => setActiveTab('inventory')}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-rose-500/15 border border-rose-500/30 text-rose-300 hover:bg-rose-500/25 transition cursor-pointer"
              title="أصناف وصلت لحد الأمان بالمخزون - اضغط للعرض"
            >
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              <span className="text-[11px] font-bold">نواقص: {stats.lowStockCount}</span>
            </button>
          )}
        </div>

        {/* Right / Fast Action Toolbar & User */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('pos')}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer shadow-xs"
            title="فتح كاشير المبيعات لإنشاء فاتورة جديدة"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">فاتورة جديدة</span>
            <span className="sm:hidden">فاتورة</span>
          </button>

          <button
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1.5 rounded-md text-xs font-semibold border border-slate-700 transition cursor-pointer"
            title="الشاشة الرئيسية واختصارات العمليات"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">الرئيسية</span>
          </button>

          <div className="h-4 w-px bg-slate-700 mx-0.5 hidden sm:block"></div>

          {/* Offline-First & Primary Cloud Database Sync Widget */}
          <button
            onClick={handleManualSync}
            disabled={isFirebaseSyncing}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-all shadow-2xs cursor-pointer ${
              !isOnline
                ? 'bg-amber-950/60 border-amber-500/50 text-amber-200 hover:bg-amber-900/70'
                : isFirebaseSyncing
                ? 'bg-sky-950/60 border-sky-500/50 text-sky-200'
                : hasUnsyncedChanges
                ? 'bg-blue-950/60 border-blue-500/50 text-blue-200 hover:bg-blue-900/70'
                : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50'
            }`}
            title={
              !isOnline
                ? `⚡ وضع عدم الاتصال (Offline): كافة البيانات تُحفظ فورياً في LocalStorage (آخر حفظ: ${lastLocalSaveTime}). ستتم المزامنة التلقائية فور عودة الإنترنت.`
                : isFirebaseSyncing
                ? 'جاري المزامنة مع قاعدة بيانات البرنامج الرئيسي...'
                : hasUnsyncedChanges
                ? `يوجد ${pendingSyncCount} تعديل محفوظ محلياً. اضغط للمزامنة الفورية مع قاعدة البيانات السحابية.`
                : `متصل ومتزامن مع قاعدة البيانات الرئيسية (آخر مزامنة: ${lastFirebaseSyncTime || lastSyncTime || 'الآن'}). اضغط لإعادة المزامنة.`
            }
          >
            {isFirebaseSyncing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-sky-400 animate-spin" />
                <span className="hidden lg:inline text-[11px]">جاري المزامنة...</span>
              </>
            ) : !isOnline ? (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span className="text-[11px] font-bold">محلي (LocalStorage)</span>
                {pendingSyncCount > 0 && (
                  <span className="px-1 py-0.2 bg-amber-500/20 text-amber-200 text-[10px] rounded font-mono font-bold">
                    {pendingSyncCount}
                  </span>
                )}
              </>
            ) : hasUnsyncedChanges ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden lg:inline text-[11px]">مزامنة التعديلات</span>
                <span className="px-1.5 py-0.2 bg-blue-500/20 text-blue-200 text-[10px] rounded font-mono font-bold">
                  {pendingSyncCount}
                </span>
              </>
            ) : (
              <>
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden lg:inline text-[11px]">قاعدة البيانات متزامنة</span>
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              </>
            )}
          </button>

          {/* Active Branch Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700 rounded-lg px-2 py-1 text-xs">
            <Store className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="text-[11px] text-slate-400 hidden xl:inline">الفرع:</span>
            <select
              value={activeBranchId}
              onChange={(e) => setActiveBranchId(e.target.value)}
              className="bg-transparent text-slate-200 text-xs font-bold focus:outline-hidden cursor-pointer max-w-[130px] truncate"
              title="الفرع النشط الحالي - اضغط للتبديل"
            >
              {allowedBranches.map(b => (
                <option key={b.id} value={b.id} className="bg-slate-900 text-white">
                  {b.name} ({b.branchCode})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={exportDataJSON}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="تصدير نسخة احتياطية من البيانات (JSON)"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={resetAllData}
            className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
            title="إعادة ضبط البيانات إلى الوضع الافتراضي"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Dynamic Active User Persona Switcher */}
          <div className="hidden sm:flex items-center gap-2 pr-2 border-r border-slate-700 mr-1">
            <div className={`w-7 h-7 rounded-full ${currentUser.avatarColor || 'bg-indigo-600'} flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-xs`}>
              {currentUser.fullName.charAt(0)}
            </div>
            <div className="text-right">
                            <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-white max-w-[120px] truncate">
                  {currentUser.fullName}
                </span>
                <button
                  onClick={() => {
                    import('../firebase').then(({ auth }) => auth.signOut());
                    localStorage.removeItem('alnoor_press_accounting_v1_current_user_id');
                    localStorage.removeItem('active_session_id');
                    window.location.reload();
                  }}
                  className="mr-2 text-[10px] bg-rose-600 hover:bg-rose-700 text-white px-2 py-0.5 rounded"
                  title="تسجيل الخروج"
                >
                  خروج
                </button>
              </div>
              <p className="text-[10px] text-blue-400 leading-tight">
                {currentUser.roleName}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Dropdown Menu Bar (سطر القوائم العرضي المنسدلة في أعلى البرنامج) */}
      <nav
        ref={navRef}
        className="bg-[#1e293b] px-2 sm:px-4 flex items-center border-t border-slate-700/60 relative overflow-visible z-50"
      >
        <div className="flex items-center gap-1 py-1 flex-wrap sm:flex-nowrap">
          {visibleMenuSections.map((section) => {
            const SectionIcon = section.icon;
            const isMenuOpen = openDropdownId === section.id;
            
            // Check if active tab belongs to this menu section
            const isParentActive = isSectionActive(section);
            const isLeftAligned = section.id === 'settings_menu' || section.id === 'reports_menu';

            return (
              <div
                key={section.id}
                className="relative"
                onMouseEnter={() => handleMouseEnter(section.id)}
                onMouseLeave={handleMouseLeave}
              >
                {/* Top-Level Menu Button */}
                <button
                  onClick={() => toggleDropdown(section.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-bold transition-all cursor-pointer select-none ${
                    isParentActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : isMenuOpen
                      ? 'bg-slate-800 text-white ring-1 ring-slate-600'
                      : 'text-slate-200 hover:text-white hover:bg-slate-800/90'
                  }`}
                  aria-expanded={isMenuOpen}
                >
                  {SectionIcon && (
                    <SectionIcon className={`w-3.5 h-3.5 ${isParentActive ? 'text-white' : 'text-slate-400'}`} />
                  )}
                  <span>{section.title}</span>
                  <ChevronDown
                    className={`w-3 h-3 transition-transform duration-200 ${
                      isMenuOpen ? 'rotate-180 text-blue-300' : isParentActive ? 'text-blue-200' : 'text-slate-400'
                    }`}
                  />
                </button>

                {/* Dropdown Menu Content */}
                {isMenuOpen && (
                  <div
                    onMouseEnter={() => {
                      if (closeTimeoutRef.current) {
                        clearTimeout(closeTimeoutRef.current);
                        closeTimeoutRef.current = null;
                      }
                    }}
                    onMouseLeave={handleMouseLeave}
                    className={`absolute top-full mt-1.5 w-72 sm:w-84 bg-[#0f172a] text-slate-100 rounded-xl shadow-2xl border border-slate-700/90 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 divide-y divide-slate-800/80 ${
                      isLeftAligned ? 'left-0 right-auto' : 'right-0 left-auto'
                    }`}
                  >
                    <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 flex items-center justify-between">
                      <span>قائمة {section.title}</span>
                      <span className="text-[10px] text-blue-400">اختر العملية</span>
                    </div>

                    <div className="p-1 space-y-0.5">
                      {section.items.map((subItem) => {
                        const SubIcon = subItem.icon;
                        const isSubActive = activeTab === subItem.id;

                        return (
                          <button
                            key={subItem.id}
                            onClick={() => handleSelectSubItem(subItem.id)}
                            className={`w-full text-right flex items-start gap-2.5 p-2 rounded-lg text-xs transition-all cursor-pointer ${
                              isSubActive
                                ? 'bg-blue-600 text-white font-bold shadow-xs'
                                : 'hover:bg-slate-800/90 text-slate-200 hover:text-white'
                            }`}
                          >
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                              isSubActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-blue-400 border border-slate-700'
                            }`}>
                              <SubIcon className="w-3.5 h-3.5" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-bold text-xs truncate">
                                  {subItem.label}
                                </span>
                                {subItem.badge && (
                                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold shrink-0 ${
                                    isSubActive ? 'bg-white/25 text-white' : subItem.badgeColor || 'bg-slate-700 text-slate-300'
                                  }`}>
                                    {subItem.badge}
                                  </span>
                                )}
                                {isSubActive && (
                                  <Check className="w-3.5 h-3.5 text-white shrink-0 mr-1" />
                                )}
                              </div>
                              {subItem.sublabel && (
                                <p className={`text-[10px] mt-0.5 leading-tight line-clamp-2 ${
                                  isSubActive ? 'text-blue-100' : 'text-slate-400'
                                }`}>
                                  {subItem.sublabel}
                                </p>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* 8. سجل العمليات (Audit Log) */}
          <button
            onClick={() => {
              setActiveTab('audit_log');
              setOpenDropdownId(null);
            }}
            onMouseEnter={() => {
              if (closeTimeoutRef.current) {
                clearTimeout(closeTimeoutRef.current);
                closeTimeoutRef.current = null;
              }
              setOpenDropdownId(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'audit_log'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-200 hover:text-white hover:bg-slate-800/90'
            }`}
            title="سجل العمليات والأحداث الشامل للمنظومة"
          >
            <History className={`w-3.5 h-3.5 ${activeTab === 'audit_log' ? 'text-white' : 'text-slate-400'}`} />
            <span>سجل العمليات</span>
          </button>
        </div>
      </nav>

      {/* Offline Awareness Strip */}
      {!isOnline && (
        <div className="bg-amber-950/90 text-amber-200 border-t border-amber-600/50 px-3 sm:px-4 py-1.5 text-xs flex flex-wrap items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
            <span className="leading-tight">
              <strong>وضع عدم الاتصال بالإنترنت (Offline):</strong> النظام يعمل بكامل طاقته ومميزاته بلا توقف! تُحفظ كافة الفواتير والعمليات فورياً في الذاكرة المحلية (LocalStorage).
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {pendingSyncCount > 0 && (
              <span className="bg-amber-900/80 px-2 py-0.5 rounded text-[11px] font-mono font-bold text-amber-100 border border-amber-600/40">
                {pendingSyncCount} حركة بانتظار المزامنة التلقائية
              </span>
            )}
            <span className="text-[11px] text-amber-300/80 hidden sm:inline">ستتم المزامنة تلقائياً فور توفر الإنترنت</span>
          </div>
        </div>
      )}

      {/* Sync Feedback Toast */}
      {syncFeedback && (
        <div className={`px-4 py-2 text-xs flex items-center justify-between border-t transition-all ${
          syncFeedback.success
            ? 'bg-emerald-950/90 text-emerald-100 border-emerald-600/60'
            : 'bg-rose-950/90 text-rose-100 border-rose-600/60'
        }`}>
          <div className="flex items-center gap-2">
            {syncFeedback.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span className="font-medium">{syncFeedback.message}</span>
          </div>
          <button
            onClick={() => setSyncFeedback(null)}
            className="text-xs hover:underline cursor-pointer px-1.5 py-0.5 rounded hover:bg-white/10"
          >
            إغلاق
          </button>
        </div>
      )}
    </header>
  );
};
