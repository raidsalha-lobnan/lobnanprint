import { ManualInvoiceView } from './components/ManualInvoiceView';
import React, { useEffect } from 'react';
import { OfflineIndicator } from './components/OfflineIndicator';
import { TelegramBotIntegration } from './components/TelegramBotIntegration';
import { AccountingProvider, useAccounting } from './context/AccountingContext';
import { Navbar } from './components/Navbar';
import { HomeScreenView } from './components/HomeScreenView';
import { DashboardView } from './components/DashboardView';
import { PosView } from './components/PosView';
import { PrintOrdersView } from './components/PrintOrdersView';
import { InvoicesView } from './components/InvoicesView';
import { SpecialInvoiceView } from './components/SpecialInvoiceView';
import { InventoryView } from './components/InventoryView';
import { PurchasesView } from './components/PurchasesView';
import { AccountingView } from './components/AccountingView';
import { ReportsView } from './components/ReportsView';
import { PartiesView } from './components/PartiesView';
import { EmployeesView } from './components/EmployeesView';
import { TreasuriesView } from './components/TreasuriesView';
import { SettingsView } from './components/SettingsView';
import { BranchesManagementView } from './components/BranchesManagementView';
import { UsersPermissionsView } from './components/UsersPermissionsView';
import { WarehouseOperationsView } from './components/WarehouseOperationsView';
import { SalesReturnsView } from './components/SalesReturnsView';
import { ReceiptVouchersView } from './components/ReceiptVouchersView';
import { PaymentVouchersView } from './components/PaymentVouchersView';
import { ExpensesView } from './components/ExpensesView';
import { DebtClearingView } from './components/DebtClearingView';
import { AuditLogView } from './components/AuditLogView';
import { InvoicePrintModal } from './components/InvoicePrintModal';
import { JobTicketModal } from './components/JobTicketModal';
import { PayrollPrintModal } from './components/PayrollPrintModal';
import { AccountStatementModal } from './components/AccountStatementModal';
import { PurchasePrintModal } from './components/PurchasePrintModal';
import { VoucherPrintModal } from './components/VoucherPrintModal';
import { TransactionLifecycleModal } from './components/TransactionLifecycleModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoginView } from './components/LoginView';
import { auth } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';

const MainLayout: React.FC = () => {
  const {
    activeTab,
    settings,
    setActiveTab,
    hasPermission,
    selectedInvoiceForPrint,
    selectedInvoiceForLifecycle,
    selectedJobForPrint,
    selectedVoucherForPrint,
    selectedPayrollSheetForPrint,
    selectedPartyForStatement,
    selectedEmployeeForStatement,
    selectedPurchaseForPrint,
    selectedReturnForPrint,
    selectedSalesReturnForPrint,
  } = useAccounting();

  const isPrintModalActive = Boolean(
    selectedInvoiceForPrint ||
    selectedInvoiceForLifecycle ||
    selectedJobForPrint ||
    selectedVoucherForPrint ||
    selectedPayrollSheetForPrint ||
    selectedPartyForStatement ||
    selectedEmployeeForStatement ||
    selectedPurchaseForPrint ||
    selectedReturnForPrint ||
    selectedSalesReturnForPrint
  );

  // Enforce screen permissions
  React.useEffect(() => {
    const isAllowed = () => {
      switch(activeTab) {
        case 'home':
        case 'dashboard':
          return hasPermission('view_dashboard');
        case 'pos':
          return hasPermission('view_pos');
        case 'print_orders':
          return hasPermission('view_print_orders');
              case 'manual_invoices':
        return <ManualInvoiceView />;
      case 'invoices':
      case 'special_invoice':
      case 'sales_returns':
        return hasPermission('view_invoices');
        case 'inventory':
        case 'warehouses':
        case 'purchases':
        case 'purchases_invoices':
        case 'purchases_suppliers':
        case 'purchases_returns':
          return hasPermission('view_inventory');
        case 'accounting':
        case 'receipt_vouchers':
        case 'payment_vouchers':
        case 'expenses':
        case 'debt_clearing':
        case 'treasuries':
          return hasPermission('view_accounting');
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
          return hasPermission('view_reports');
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
          return hasPermission('view_settings');
        default:
          return true;
      }
    };

    if (!isAllowed()) {
      if (hasPermission('view_pos')) setActiveTab('pos');
      else if (hasPermission('view_print_orders')) setActiveTab('print_orders');
      else if (hasPermission('view_dashboard')) setActiveTab('dashboard');
      else setActiveTab('settings');
    }
  }, [activeTab, hasPermission, setActiveTab]);


  // Global auto-select & full field highlight behavior
  // عند وضع المؤشر في أي خانة يتم تحديد وتعليم محتواها وخانتها بالكامل
  useEffect(() => {
    let activeMouseDownTarget: HTMLElement | null = null;

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        (target instanceof HTMLInputElement && !['checkbox', 'radio', 'button', 'submit', 'file', 'image', 'reset'].includes(target.type)) ||
        target instanceof HTMLTextAreaElement
      ) {
        if (document.activeElement !== target) {
          activeMouseDownTarget = target;
        }
      }
    };

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (
        (target instanceof HTMLInputElement && !['checkbox', 'radio', 'button', 'submit', 'file', 'image', 'reset'].includes(target.type)) ||
        target instanceof HTMLTextAreaElement
      ) {
        // Automatically select the entire contents of the field
        setTimeout(() => {
          try {
            (target as HTMLInputElement | HTMLTextAreaElement).select();
          } catch {
            // Ignore elements that do not support select()
          }
        }, 15);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (activeMouseDownTarget && e.target === activeMouseDownTarget) {
        const input = activeMouseDownTarget as HTMLInputElement | HTMLTextAreaElement;
        setTimeout(() => {
          try {
            input.select();
          } catch {}
        }, 15);
        activeMouseDownTarget = null;
      }
    };

    document.addEventListener('mousedown', handleMouseDown, true);
    document.addEventListener('focusin', handleFocusIn, true);
    document.addEventListener('mouseup', handleMouseUp, true);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown, true);
      document.removeEventListener('focusin', handleFocusIn, true);
      document.removeEventListener('mouseup', handleMouseUp, true);
    };
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeScreenView />;
      case 'dashboard':
        return <DashboardView />;
      case 'pos':
        return <PosView />;
      case 'print_orders':
        return <PrintOrdersView />;
      case 'invoices':
        return <InvoicesView />;
      case 'special_invoice':
        return <SpecialInvoiceView />;
      case 'sales_returns':
        return <SalesReturnsView />;
      case 'receipt_vouchers':
        return <ReceiptVouchersView />;
      case 'inventory':
        return <InventoryView />;
      case 'warehouses':
        return <WarehouseOperationsView />;
      case 'purchases':
      case 'purchases_suppliers':
        return <PurchasesView initialTab="suppliers" />;
      case 'purchases_invoices':
        return <PurchasesView initialTab="invoices" />;
      case 'purchases_returns':
        return <PurchasesView initialTab="returns" />;
      case 'payment_vouchers':
        return <PaymentVouchersView />;
      case 'expenses':
        return <ExpensesView />;
      case 'debt_clearing':
        return <DebtClearingView />;
      case 'audit_log':
        return <AuditLogView />;
      case 'accounting':
        return <AccountingView />;
      case 'reports':
        return <ReportsView />;
      case 'report_customer_statement':
        return <ReportsView initialReport="customer_statement" />;
      case 'report_customer_items':
        return <ReportsView initialReport="customer_items" />;
      case 'report_supplier_statement':
        return <ReportsView initialReport="supplier_statement" />;
      case 'report_supplier_items':
        return <ReportsView initialReport="supplier_items" />;
      case 'report_receipt_vouchers':
        return <ReportsView initialReport="receipt_vouchers" />;
      case 'report_payment_vouchers':
        return <ReportsView initialReport="payment_vouchers" />;
      case 'report_employee_statement':
        return <ReportsView initialReport="employee_statement" />;
      case 'report_payroll_sheets':
        return <ReportsView initialReport="payroll_sheets" />;
      case 'report_treasuries_movement':
        return <ReportsView initialReport="treasuries_movement" />;
      case 'parties':
        return <PartiesView />;
      case 'employees':
        return <EmployeesView initialSubTab="employees" />;
      case 'employees_adjustments':
        return <EmployeesView initialSubTab="adjustments" />;
      case 'employees_payroll':
        return <EmployeesView initialSubTab="payroll_sheets" />;
      case 'treasuries':
        return <TreasuriesView />;
      case 'branches':
        return <BranchesManagementView />;
      case 'users_permissions':
        return <UsersPermissionsView />;
      case 'settings':
      case 'settings_general':
        return <SettingsView initialTab="general" />;
      case 'settings_sql':
        return <SettingsView initialTab="sql" />;
      case 'settings_backup':
        return <SettingsView initialTab="backup" />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className={`flex flex-col ${(activeTab === 'pos') ? 'h-screen overflow-hidden' : 'min-h-screen'} bg-[#f8fafc] text-[#0f172a] font-sans selection:bg-blue-500 selection:text-white print:h-auto print:bg-white print:overflow-visible ${isPrintModalActive ? 'print-modal-is-active' : ''}`} dir="rtl">
      {/* Top Header & Horizontal Menu Bar - ALWAYS hidden during print */}
      <div className={`print:hidden ${activeTab !== 'pos' ? 'sticky top-0 z-[100]' : ''}`}>
        <Navbar />
      </div>

      {/* Main Content Area - Hidden during print if any print modal is open */}
      <main className={`${(activeTab === 'pos' || activeTab === 'manual_invoices' || activeTab === 'special_invoice') ? "flex-1 min-h-0 w-full p-0 flex flex-col overflow-hidden" : "flex-1 p-4 lg:p-6 pb-12 w-full flex flex-col overflow-y-auto"} ${isPrintModalActive ? "print:hidden" : "print:p-0 print:m-0 print:overflow-visible print:h-auto print:max-h-none"}`}>
        <ErrorBoundary fallbackTitle="حدث تنبيه في عرض هذه الشاشة">
          {renderContent()}
        </ErrorBoundary>
      </main>

      {/* High Density Status Footer - ALWAYS hidden during print */}
      {activeTab !== 'pos' && (
        <footer className="print:hidden h-7 bg-slate-800 text-slate-400 text-[10px] flex items-center justify-between px-3 sm:px-5 shrink-0 border-t border-slate-700 select-none overflow-hidden fixed bottom-0 w-full z-[100]">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
            <span className="truncate">متصل: خادم سحابي آمن</span>
          </div>
          <div className="flex items-center shrink-0">
            <span className="truncate">آخر مزامنة: الآن</span>
          </div>
        </footer>
      )}

      {/* Print Overlays & Modals */}
      <InvoicePrintModal />
      <JobTicketModal />
      <PayrollPrintModal />
      <AccountStatementModal />
      <PurchasePrintModal />
      <VoucherPrintModal />
      <TransactionLifecycleModal />
      <OfflineIndicator />
        <TelegramBotIntegration />
    </div>
  );
};

export default function App() {
  const [firebaseUser, setFirebaseUser] = React.useState<User | null>(null);
  const [localUserId, setLocalUserId] = React.useState<string | null>(() => {
    return localStorage.getItem('alnoor_press_accounting_v1_current_user_id');
  });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let unsubs: (() => void) | undefined;
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setFirebaseUser(u);
      setLoading(false);
      
      if (u && u.email) {
        unsubs = onSnapshot(doc(db, 'userSessions', u.email.toLowerCase()), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const currentSession = localStorage.getItem('active_session_id');
            if (data.sessionId && currentSession && data.sessionId !== currentSession) {
              // Forced logout: another device logged in
              auth.signOut();
              localStorage.removeItem('alnoor_press_accounting_v1_current_user_id');
              localStorage.removeItem('active_session_id');
              window.location.reload();
            }
          }
        });
      } else {
        if (unsubs) unsubs();
      }
    });
    return () => {
      unsubscribe();
      if (unsubs) unsubs();
    };
  }, []);

  const isAuth = !!firebaseUser || !!localUserId;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100" dir="rtl">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuth) {
    return <LoginView onLocalLogin={(id) => setLocalUserId(id)} />;
  }

  return (
    <AccountingProvider>
      <MainLayout />
    </AccountingProvider>
  );
}
