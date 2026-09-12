import React, { useState, useMemo, useEffect } from 'react';
import { useAccounting } from '../context/AccountingContext';
import {
  generateAccountStatement,
  generateEmployeeStatement,
  exportStatementToCSV,
  exportEmployeeStatementToCSV,
  StatementRow,
  EmployeeStatementRow
} from '../utils/statementGenerator';
import { formatNumber } from '../utils/numberFormat';
import { tafqeet } from '../utils/tafqeet';
import {
  X,
  Printer,
  Download,
  Calendar,
  Filter,
  Users,
  Building,
  UserCheck,
  Phone,
  CreditCard,
  Receipt,
  FileText,
  BadgeDollarSign,
  Briefcase,
  ChevronDown,
  Info
} from 'lucide-react';
import { Party, Employee } from '../types';
import { PrintHeader } from './common/PrintHeader';

export const AccountStatementModal: React.FC = () => {
  const {
    selectedPartyForStatement,
    setSelectedPartyForStatement,
    selectedEmployeeForStatement,
    setSelectedEmployeeForStatement,
    parties,
    employees,
    invoices,
    purchases,
    purchaseReturns,
    vouchers,
    printOrders,
    journalEntries,
    employeeAdvances,
    employeeDeductions,
    employeeIncentives,
    debtClearings,
    settings
  } = useAccounting();

  // Mode: 'party' or 'employee'
  const [statementMode, setStatementMode] = useState<'party' | 'employee'>('party');
  const [selectedPartyId, setSelectedPartyId] = useState<string>('');
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');

  // Synchronize initial selection when modal opens
  useEffect(() => {
    if (selectedEmployeeForStatement) {
      setStatementMode('employee');
      setSelectedEmpId(selectedEmployeeForStatement.id);
    } else if (selectedPartyForStatement) {
      setStatementMode('party');
      setSelectedPartyId(selectedPartyForStatement.id);
    }
  }, [selectedPartyForStatement, selectedEmployeeForStatement]);

  // Date filters
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'debit' | 'credit'>('all');
  const [showItemDetails, setShowItemDetails] = useState<boolean>(true);

  // Active party or employee
  const currentParty = useMemo(() => {
    if (selectedPartyId) {
      return parties.find(p => p.id === selectedPartyId) || null;
    }
    return selectedPartyForStatement;
  }, [selectedPartyId, selectedPartyForStatement, parties]);

  const parentParty = useMemo(() => {
    if (currentParty && currentParty.parentCustomerId) {
      return parties.find(p => p.id === currentParty.parentCustomerId) || null;
    }
    return null;
  }, [currentParty, parties]);

  const clientDisplayName = useMemo(() => {
    if (!currentParty) return '';
    if (currentParty.isSubCustomer && parentParty) {
      return `${parentParty.name} / ${currentParty.name}`;
    }
    if (currentParty.parentCustomerName) {
      return `${currentParty.parentCustomerName} / ${currentParty.name}`;
    }
    return currentParty.name;
  }, [currentParty, parentParty]);

  const currentEmployee = useMemo(() => {
    if (selectedEmpId) {
      return employees.find(e => e.id === selectedEmpId) || null;
    }
    return selectedEmployeeForStatement;
  }, [selectedEmpId, selectedEmployeeForStatement, employees]);

  // Generate Party Statement
  const partyStatement = useMemo(() => {
    if (statementMode !== 'party' || !currentParty) return null;
    return generateAccountStatement({
      party: currentParty,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      invoices,
      purchases,
      purchaseReturns,
      vouchers,
      printOrders,
      journalEntries,
      debtClearings
    });
  }, [statementMode, currentParty, fromDate, toDate, invoices, purchases, purchaseReturns, vouchers, printOrders, journalEntries, debtClearings]);

  // Generate Employee Statement
  const employeeStatement = useMemo(() => {
    if (statementMode !== 'employee' || !currentEmployee) return null;
    return generateEmployeeStatement({
      employee: currentEmployee,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      vouchers,
      advances: employeeAdvances,
      deductions: employeeDeductions,
      incentives: employeeIncentives
    });
  }, [statementMode, currentEmployee, fromDate, toDate, vouchers, employeeAdvances, employeeDeductions, employeeIncentives]);

  const isOpen = Boolean(selectedPartyForStatement || selectedEmployeeForStatement);

  if (!isOpen) return null;

  const handleClose = () => {
    setSelectedPartyForStatement(null);
    setSelectedEmployeeForStatement(null);
    setSelectedPartyId('');
    setSelectedEmpId('');
  };

  const handlePrint = () => {
    document.body.classList.add('printing-mode');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing-mode');
    }, 1000);
  };

  const handleExportCSV = () => {
    if (statementMode === 'party' && partyStatement) {
      exportStatementToCSV(partyStatement, settings.currency || '₪');
    } else if (statementMode === 'employee' && employeeStatement) {
      exportEmployeeStatementToCSV(employeeStatement, settings.currency || '₪');
    }
  };

  const setDatePreset = (preset: 'all' | 'today' | 'this_month' | 'last_month' | 'this_year') => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const todayStr = now.toISOString().split('T')[0];

    if (preset === 'all') {
      setFromDate('');
      setToDate('');
    } else if (preset === 'today') {
      setFromDate(todayStr);
      setToDate(todayStr);
    } else if (preset === 'this_month') {
      const firstDay = new Date(y, m, 1).toISOString().split('T')[0];
      const lastDay = new Date(y, m + 1, 0).toISOString().split('T')[0];
      setFromDate(firstDay);
      setToDate(lastDay);
    } else if (preset === 'last_month') {
      const firstDay = new Date(y, m - 1, 1).toISOString().split('T')[0];
      const lastDay = new Date(y, m, 0).toISOString().split('T')[0];
      setFromDate(firstDay);
      setToDate(lastDay);
    } else if (preset === 'this_year') {
      const firstDay = `${y}-01-01`;
      const lastDay = `${y}-12-31`;
      setFromDate(firstDay);
      setToDate(lastDay);
    }
  };

  // Filtered rows for party
  const displayedPartyRows = partyStatement ? partyStatement.rows.filter(r => {
    if (filterType === 'debit') return r.debit > 0;
    if (filterType === 'credit') return r.credit > 0;
    return true;
  }) : [];

  const isCustomer = currentParty ? (currentParty.type === 'customer' || currentParty.type === 'both') : false;
  const isSupplier = currentParty ? (currentParty.type === 'supplier' || currentParty.type === 'both') : false;

  const partyTafqeet = partyStatement ? tafqeet(partyStatement.closingBalance, 'شيكل فلسطيني', 'أغورة') : '';
  const empTafqeet = employeeStatement ? tafqeet(employeeStatement.closingBalance, 'شيكل فلسطيني', 'أغورة') : '';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static print:overflow-visible print-area">
      <div className="bg-white rounded-xl max-w-5xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[94vh] print:max-h-none print:max-w-none print:border-none print:shadow-none print:w-full print:rounded-none">
        
        {/* Top Control Bar (Hidden in Print) */}
        <div className="bg-slate-900 text-white p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 print:hidden border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-600/30 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white">
                  {statementMode === 'employee'
                    ? `كشف مالي تفصيلي للموظف: ${currentEmployee?.name || 'اختر موظف'}`
                    : `كشف حساب مالي تفصيلي: ${currentParty?.name || 'اختر حساب'}`}
                </h2>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  statementMode === 'employee' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                  isCustomer ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                  'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                }`}>
                  {statementMode === 'employee' ? 'موظف' : isCustomer ? 'عميل' : 'مورد خامات'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                نظام الرصيد التراكمي المستمر (Continuous Running Balance) معتمد لترويسة المنشأة والطباعة A4
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700 transition-colors cursor-pointer"
              title="تصدير كشف الحساب إلى إكسل CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>تصدير CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-sm transition-colors cursor-pointer"
              title="طباعة رسمية A4 مع ترويسة المنشأة"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة A4</span>
            </button>

            <button
              onClick={handleClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Entity Switcher & Date Filters (Hidden in Print) */}
        <div className="bg-slate-50 p-3 border-b border-slate-200 space-y-2.5 text-xs print:hidden">
          
          {/* Switcher Bar between Customer/Supplier and Employee */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-slate-200/80">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">نوع الكشف:</span>
              <div className="flex rounded-lg bg-slate-200/80 p-0.5 border border-slate-300">
                <button
                  type="button"
                  onClick={() => {
                    setStatementMode('party');
                    if (!selectedPartyId && parties.length > 0) setSelectedPartyId(parties[0].id);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    statementMode === 'party'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Building className="w-3.5 h-3.5" />
                  <span>عميل / مورد</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStatementMode('employee');
                    if (!selectedEmpId && employees.length > 0) setSelectedEmpId(employees[0].id);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    statementMode === 'employee'
                      ? 'bg-white text-amber-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>موظف وكادر العمل</span>
                </button>
              </div>
            </div>

            {/* Quick Entity Selector Dropdown */}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-600">
                {statementMode === 'party' ? 'اختر العميل/المورد:' : 'اختر الموظف:'}
              </span>
              {statementMode === 'party' ? (
                <select
                  value={currentParty?.id || ''}
                  onChange={e => setSelectedPartyId(e.target.value)}
                  className="bg-white border border-slate-300 rounded-md px-2.5 py-1 text-xs text-slate-800 font-bold focus:ring-1 focus:ring-blue-500 max-w-xs truncate"
                >
                  <optgroup label="العملاء">
                    {parties.filter(p => p.type === 'customer' || p.type === 'both').map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.code || 'عميل'})</option>
                    ))}
                  </optgroup>
                  <optgroup label="الموردين">
                    {parties.filter(p => p.type === 'supplier').map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.code || 'مورد'})</option>
                    ))}
                  </optgroup>
                </select>
              ) : (
                <select
                  value={currentEmployee?.id || ''}
                  onChange={e => setSelectedEmpId(e.target.value)}
                  className="bg-white border border-slate-300 rounded-md px-2.5 py-1 text-xs text-slate-800 font-bold focus:ring-1 focus:ring-amber-500 max-w-xs truncate"
                >
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.name} - {e.position} ({e.code || 'موظف'})</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Date Filter & Options Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-slate-600 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>الفترة المحددة:</span>
              </span>

              <input
                type="date"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                className="bg-white border border-slate-300 rounded-md px-2 py-1 text-xs text-slate-700 font-mono focus:ring-1 focus:ring-blue-500"
                title="من تاريخ"
              />
              <span className="text-slate-400 font-bold">إلى</span>
              <input
                type="date"
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                className="bg-white border border-slate-300 rounded-md px-2 py-1 text-xs text-slate-700 font-mono focus:ring-1 focus:ring-blue-500"
                title="إلى تاريخ"
              />

              <div className="flex items-center bg-slate-200/80 p-0.5 rounded-md gap-0.5 mr-1">
                <button
                  onClick={() => setDatePreset('all')}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer ${
                    !fromDate && !toDate ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  الكل
                </button>
                <button
                  onClick={() => setDatePreset('today')}
                  className="px-2 py-0.5 rounded text-[11px] font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  اليوم
                </button>
                <button
                  onClick={() => setDatePreset('this_month')}
                  className="px-2 py-0.5 rounded text-[11px] font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  هذا الشهر
                </button>
                <button
                  onClick={() => setDatePreset('last_month')}
                  className="px-2 py-0.5 rounded text-[11px] font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  الشهر الماضي
                </button>
                <button
                  onClick={() => setDatePreset('this_year')}
                  className="px-2 py-0.5 rounded text-[11px] font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  هذا العام
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {statementMode === 'party' && (
                <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer font-bold select-none">
                  <input
                    type="checkbox"
                    checked={showItemDetails}
                    onChange={e => setShowItemDetails(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>عرض تفاصيل وملاحظات وأبعاد الأصناف</span>
                </label>
              )}

              {statementMode === 'party' && (
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-slate-600 flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    <span>تصفية:</span>
                  </span>
                  <select
                    value={filterType}
                    onChange={e => setFilterType(e.target.value as any)}
                    className="bg-white border border-slate-300 rounded-md px-2 py-1 text-xs text-slate-700 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="all">كافة الحركات (الكل)</option>
                    <option value="debit">الحركات المدينة فقط (مدين / سحوبات)</option>
                    <option value="credit">الحركات الدائنة فقط (دائن / مقبوضات)</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Printable Statement Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 print:p-0 print:overflow-visible">
          
          {/* Printable Official Facility Header (A4) - يعتمد الترويسة حسب إعدادات البرنامج واللوقو والبيانات الرسمية */}
          <PrintHeader
            title={
              statementMode === 'employee' ? 'كشف حساب موظف' :
              isCustomer ? 'كشف حساب عميل' : 'كشف حساب مورد'
            }
            docDate={new Date().toISOString().split('T')[0]}
            extraMeta={
              <div>
                <span className="text-slate-400 font-sans">العملة: </span>
                <span>{settings.baseCurrencyCode || 'ILS'} ({settings.currency || '₪'})</span>
              </div>
            }
          />

          <div className="border-b-2 border-slate-800 pb-3">
            {/* Profile Grid: Party or Employee */}
            {statementMode === 'party' && currentParty && (
              <div className="mt-2 bg-slate-50 rounded-lg p-3 border border-slate-300 space-y-2 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200 pb-2">
                  <div>
                    <span className="text-[11px] text-slate-500 font-bold block">
                      {isCustomer ? 'اسم العميل / الاسم الفرعي (إن وجد):' : 'اسم المورد / الحساب:'}
                    </span>
                    <span className="text-base font-black text-slate-900">
                      {clientDisplayName}
                    </span>
                    {currentParty.isSubCustomer && (
                      <span className="mr-2 inline-block bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold px-1.5 py-0.5 rounded">
                        حساب زبون فرعي / دين مؤقت
                      </span>
                    )}
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-[11px] text-slate-500 font-bold block">الفترة من ---- إلى -----------:</span>
                    <span className="font-mono text-slate-900 font-black text-sm">
                      من <span className="text-blue-700">{fromDate || 'بداية التعامل'}</span> إلى <span className="text-blue-700">{toDate || 'تاريخ اليوم'}</span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[11px] pt-0.5">
                  <div>
                    <span className="text-slate-500 font-semibold block text-[10px]">الصفة والنوع:</span>
                    <span className="font-bold text-slate-800">
                      {currentParty.type === 'customer' ? 'عميل معتمد' :
                       currentParty.type === 'supplier' ? 'مورد خامات ومستلزمات' : 'عميل ومورد'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold block text-[10px]">الهاتف / الجوال:</span>
                    <span className="font-mono text-slate-800 font-bold">{currentParty.phone || 'غير مسجل'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold block text-[10px]">المدينة / العنوان:</span>
                    <span className="text-slate-800">{currentParty.city || currentParty.address || 'فلسطين'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold block text-[10px]">الرقم الضريبي / السجل:</span>
                    <span className="font-mono text-slate-800">{currentParty.taxNumber || currentParty.commercialRegister || 'غير مسجل'}</span>
                  </div>
                </div>
              </div>
            )}

            {statementMode === 'employee' && currentEmployee && (
              <div className="mt-2 bg-slate-50 rounded-lg p-3 border border-slate-300 space-y-2 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200 pb-2">
                  <div>
                    <span className="text-[11px] text-slate-500 font-bold block">اسم الموظف / الحساب:</span>
                    <span className="text-base font-black text-slate-900">{currentEmployee.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono mr-2">كود: {currentEmployee.code || 'EMP-01'}</span>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-[11px] text-slate-500 font-bold block">الفترة المالية المحددة:</span>
                    <span className="font-mono text-slate-900 font-black text-sm">
                      من <span className="text-blue-700">{fromDate || 'بداية العمل'}</span> إلى <span className="text-blue-700">{toDate || 'تاريخ اليوم'}</span>
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[11px] pt-0.5">
                  <div>
                    <span className="text-slate-500 font-semibold block text-[10px]">المسمى الوظيفي / القسم:</span>
                    <span className="font-semibold text-slate-800">{currentEmployee.jobTitle} {currentEmployee.department ? `(${currentEmployee.department})` : ''}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold block text-[10px]">الراتب والبدلات:</span>
                    <span className="font-mono text-slate-800 font-bold">
                      {currentEmployee.salaryAmount} {settings.currency} {currentEmployee.salaryType === 'daily' ? 'يومي' : currentEmployee.salaryType === 'weekly' ? 'أسبوعي' : 'شهري'}
                      {Number(currentEmployee.allowances || 0) > 0 && ` + ${currentEmployee.allowances} بدلات`}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold block text-[10px]">الهاتف / الحساب:</span>
                    <span className="font-mono text-slate-800">{currentEmployee.phone || currentEmployee.iban || currentEmployee.bankName || 'غير مسجل'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold block text-[10px]">الحالة الوظيفية:</span>
                    <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold ${
                      currentEmployee.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {currentEmployee.status === 'active' ? 'على رأس العمل' : currentEmployee.status === 'on_leave' ? 'في إجازة' : 'متوقف / غير نشط'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* SECTION 1: PARTY FINANCIAL STATEMENT (CUSTOMER / SUPPLIER)*/}
          {/* ========================================================= */}
          {statementMode === 'party' && partyStatement && (
            <div className="space-y-4">
              
              {/* Summary Cards: Breakdown of Withdrawals, Receipts, Disbursements */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-semibold block">رصيد أول المدة / سابق:</span>
                  <span className="text-sm font-black font-mono text-slate-800">
                    {formatNumber(partyStatement.openingBalance, 2)} {settings.currency}
                  </span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">قبل تاريخ {fromDate || 'البدء'}</span>
                </div>

                <div className="bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-200/80">
                  <span className="text-[10px] text-emerald-700 font-semibold block">
                    {isCustomer ? 'إجمالي السحوبات (مدين):' : 'إجمالي التوريدات (دائن):'}
                  </span>
                  <span className="text-sm font-black font-mono text-emerald-800">
                    {formatNumber(isCustomer ? partyStatement.totalWithdrawals : partyStatement.totalCredit, 2)} {settings.currency}
                  </span>
                  <span className="text-[9px] text-emerald-600 block mt-0.5">
                    {isCustomer ? 'فواتير المبيعات وأوامر التشغيل' : 'فواتير توريد الخامات'}
                  </span>
                </div>

                <div className="bg-blue-50/70 p-2.5 rounded-lg border border-blue-200/80">
                  <span className="text-[10px] text-blue-700 font-semibold block">
                    {isCustomer ? 'إجمالي المقبوضات (دائن):' : 'إجمالي الصرف والمسدد (مدين):'}
                  </span>
                  <span className="text-sm font-black font-mono text-blue-800">
                    {formatNumber(isCustomer ? partyStatement.totalReceipts : partyStatement.totalDebit, 2)} {settings.currency}
                  </span>
                  <span className="text-[9px] text-blue-600 block mt-0.5">
                    {isCustomer ? 'سندات القبض والدفعات والمقاصة' : 'سندات الصرف والسداد والمقاصة'}
                  </span>
                </div>

                <div className="bg-amber-50/70 p-2.5 rounded-lg border border-amber-200/80">
                  <span className="text-[10px] text-amber-700 font-semibold block">
                    {isCustomer ? 'إجمالي الصرف / مرتجعات:' : 'المردودات والمقبوضات:'}
                  </span>
                  <span className="text-sm font-black font-mono text-amber-800">
                    {formatNumber(isCustomer ? partyStatement.totalDisbursements : 0, 2)} {settings.currency}
                  </span>
                  <span className="text-[9px] text-amber-600 block mt-0.5">
                    {isCustomer ? 'سندات صرف أو استردادات' : 'مرتجع مشتريات'}
                  </span>
                </div>

                <div className={`p-2.5 rounded-lg border ${
                  partyStatement.closingBalance > 0
                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                    : partyStatement.closingBalance < 0
                    ? 'bg-rose-50 border-rose-300 text-rose-900'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                }`}>
                  <span className="text-[10px] font-semibold block">
                    {isCustomer
                      ? (partyStatement.closingBalance > 0 ? 'صافي المتبقي على العميل:' : partyStatement.closingBalance < 0 ? 'رصيد دائن للعميل:' : 'الحساب متطابق (صفر):')
                      : (partyStatement.closingBalance > 0 ? 'صافي مستحق للمورد:' : 'الحساب خالص:')}
                  </span>
                  <span className="text-sm font-black font-mono">
                    {formatNumber(Math.abs(partyStatement.closingBalance), 2)} {settings.currency}
                  </span>
                  <span className="text-[9px] font-bold block mt-0.5">
                    {partyStatement.closingBalance > 0 ? (isCustomer ? 'مطلوب سداده' : 'التزام علينا') : partyStatement.closingBalance < 0 ? 'مبلغ فائض' : 'تمت التسوية'}
                  </span>
                </div>
              </div>

              {/* Detailed Transactions Table */}
              <div className="border-2 border-slate-700 rounded-lg overflow-x-auto shadow-2xs">
                <table className="w-full text-right text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-800 text-white font-bold border-b border-slate-900 print:bg-slate-200 print:text-slate-900 text-[11px]">
                      <th className="py-2 px-2 w-9 text-center border-l border-slate-700 print:border-slate-300">م</th>
                      <th className="py-2 px-2 w-24 text-center border-l border-slate-700 print:border-slate-300">التاريخ</th>
                      <th className="py-2 px-2 w-24 text-center border-l border-slate-700 print:border-slate-300">رقم الحركة</th>
                      <th className="py-2 px-2.5 w-28 text-center border-l border-slate-700 print:border-slate-300">نوع العملية</th>
                      <th className="py-2 px-3 border-l border-slate-700 print:border-slate-300 min-w-72">البيان والشرح والتفاصيل الكاملة</th>
                      <th className="py-2 px-2.5 w-28 text-left bg-rose-950/40 print:bg-rose-50 border-l border-slate-700 print:border-slate-300">
                        {isCustomer ? 'مدين (عليه)' : 'مدين (المسدد)'}
                      </th>
                      <th className="py-2 px-2.5 w-28 text-left bg-emerald-950/40 print:bg-emerald-50 border-l border-slate-700 print:border-slate-300">
                        {isCustomer ? 'دائن (له)' : 'دائن (التوريدات)'}
                      </th>
                      <th className="py-2 px-2.5 w-28 text-left bg-slate-700 print:bg-slate-300">
                        الرصيد التراكمي
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono">
                    {/* Opening Balance Row */}
                    <tr className="bg-slate-100/80 font-bold border-b border-slate-300 text-slate-800">
                      <td className="py-2 px-2 text-center text-slate-400 font-sans">-</td>
                      <td className="py-2 px-2 text-center text-slate-600 font-mono">{fromDate || 'الرصيد السابق'}</td>
                      <td className="py-2 px-2 text-center text-slate-500 font-mono">OPENING</td>
                      <td className="py-2 px-2 text-center font-sans">
                        <span className="bg-slate-200 text-slate-800 px-2 py-0.5 rounded text-[10px] font-bold">
                          رصيد سابق
                        </span>
                      </td>
                      <td className="py-2 px-3 font-sans text-slate-700 font-semibold">
                        رصيد الحساب الافتتاحي السابق (ما قبل تاريخ {fromDate || 'بدء الحركة'})
                      </td>
                      <td className="py-2 px-2.5 text-left font-bold text-slate-700">
                        {partyStatement.openingBalance > 0 ? partyStatement.openingBalance.toFixed(2) : '-'}
                      </td>
                      <td className="py-2 px-2.5 text-left font-bold text-slate-700">
                        {partyStatement.openingBalance < 0 ? Math.abs(partyStatement.openingBalance).toFixed(2) : '-'}
                      </td>
                      <td className="py-2 px-2.5 text-left font-black text-slate-950 bg-slate-100">
                        {partyStatement.openingBalance.toFixed(2)}
                      </td>
                    </tr>

                    {displayedPartyRows.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400 font-sans">
                          لا توجد حركات مالية مسجلة خلال هذه الفترة المحددة.
                        </td>
                      </tr>
                    ) : (
                      displayedPartyRows.map((row, idx) => (
                        <tr
                          key={`${row.id || 'party-row'}-${idx}`}
                          className={`hover:bg-slate-50/90 transition-colors ${
                            idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                          }`}
                        >
                          <td className="py-2.5 px-2 text-center text-slate-400 font-sans text-[11px] align-top">{idx + 1}</td>
                          <td className="py-2.5 px-2 text-slate-700 whitespace-nowrap text-center align-top">{row.date}</td>
                          <td className="py-2.5 px-2 font-bold text-slate-900 whitespace-nowrap text-center align-top font-mono">{row.referenceNumber}</td>
                          <td className="py-2.5 px-2 font-sans text-center align-top">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              row.type === 'invoice' ? 'bg-indigo-100 text-indigo-900 border border-indigo-200' :
                              row.type === 'receipt' ? 'bg-blue-100 text-blue-900 border border-blue-200' :
                              row.type === 'payment' ? 'bg-amber-100 text-amber-900 border border-amber-200' :
                              row.type === 'purchase' ? 'bg-purple-100 text-purple-900 border border-purple-200' :
                              row.type === 'clearance' ? 'bg-teal-100 text-teal-900 border border-teal-200' :
                              'bg-slate-100 text-slate-800'
                            }`}>
                              {row.typeLabel}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-sans text-slate-800 align-top space-y-1.5">
                            <div className="font-semibold text-slate-900">{row.description}</div>

                            {/* تفاصيل الفاتورة الدقيقة: الصنف :: البيان ::: الطول :: العرض:: العدد :: الكمية :: السعر */}
                            {showItemDetails && row.items && row.items.length > 0 && (
                              <div className="mt-1.5 border border-slate-300 rounded overflow-hidden shadow-2xs bg-white">
                                <table className="w-full text-right text-[11px] border-collapse">
                                  <thead>
                                    <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                                      <th className="py-1 px-1.5 border-l border-slate-200">الصنف</th>
                                      <th className="py-1 px-1.5 border-l border-slate-200">البيان</th>
                                      <th className="py-1 px-1.5 text-center w-14 border-l border-slate-200">الطول</th>
                                      <th className="py-1 px-1.5 text-center w-14 border-l border-slate-200">العرض</th>
                                      <th className="py-1 px-1.5 text-center w-12 border-l border-slate-200">العدد</th>
                                      <th className="py-1 px-1.5 text-center w-16 border-l border-slate-200">الكمية</th>
                                      <th className="py-1 px-1.5 text-center w-16 border-l border-slate-200">السعر</th>
                                      <th className="py-1 px-1.5 text-left w-20">الإجمالي</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-200">
                                    {row.items.map((it, iIdx) => (
                                      <tr key={iIdx} className="hover:bg-slate-50">
                                        <td className="py-1 px-1.5 font-bold text-slate-900 border-l border-slate-200">{it.itemName}</td>
                                        <td className="py-1 px-1.5 text-slate-700 border-l border-slate-200">{it.description || it.notes || '-'}</td>
                                        <td className="py-1 px-1.5 text-center font-mono text-slate-800 border-l border-slate-200">{it.length != null && it.length !== 0 ? it.length : '-'}</td>
                                        <td className="py-1 px-1.5 text-center font-mono text-slate-800 border-l border-slate-200">{it.width != null && it.width !== 0 ? it.width : '-'}</td>
                                        <td className="py-1 px-1.5 text-center font-mono text-slate-800 border-l border-slate-200">{it.count || 1}</td>
                                        <td className="py-1 px-1.5 text-center font-mono font-bold text-slate-900 border-l border-slate-200">
                                          {it.quantity} {it.unit || ''}
                                        </td>
                                        <td className="py-1 px-1.5 text-center font-mono text-slate-800 border-l border-slate-200">{it.unitPrice.toFixed(2)}</td>
                                        <td className="py-1 px-1.5 text-left font-mono font-bold text-slate-900">{it.total.toFixed(2)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                  <tfoot className="bg-slate-50 border-t border-slate-300 font-bold text-[11px]">
                                    <tr>
                                      <td colSpan={5} className="py-1.5 px-2 text-slate-700">
                                        {row.subCustomerName && (
                                          <span className="ml-2 text-blue-700 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                            الزبون الفرعي: {row.subCustomerName}
                                          </span>
                                        )}
                                        {row.invoiceNotes && (
                                          <span className="text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-medium">
                                            📝 ملاحظة الفاتورة: {row.invoiceNotes}
                                          </span>
                                        )}
                                      </td>
                                      <td colSpan={3} className="py-1.5 px-2 text-left font-mono">
                                        <div className="flex items-center justify-end gap-2.5 text-slate-800">
                                          {row.subtotal !== undefined && row.subtotal !== row.totalAmount && (
                                            <span>المجموع: <span className="font-bold">{row.subtotal.toFixed(2)}</span></span>
                                          )}
                                          {row.discountTotal !== undefined && row.discountTotal > 0 && (
                                            <span className="text-rose-600 font-bold">الخصم: -{row.discountTotal.toFixed(2)}</span>
                                          )}
                                          {row.taxAmount !== undefined && row.taxAmount > 0 && (
                                            <span className="text-slate-600">الضريبة: +{row.taxAmount.toFixed(2)}</span>
                                          )}
                                          <span className="text-slate-950 font-black bg-slate-200 px-2 py-0.5 rounded">
                                            إجمالي الفاتورة: {(row.totalAmount || row.debit).toFixed(2)} {settings.currency}
                                          </span>
                                        </div>
                                      </td>
                                    </tr>
                                  </tfoot>
                                </table>
                              </div>
                            )}

                            {/* تفاصيل سند القبض الكاملة والملاحظات */}
                            {row.type === 'receipt' && (
                              <div className="mt-1 p-2 bg-blue-50/80 border border-blue-200 rounded text-xs space-y-1">
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-200 pb-1">
                                  <div className="flex items-center gap-2 font-bold text-blue-900">
                                    <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-[10px]">سند قبض نقدية</span>
                                    <span>رقم السند: <strong className="font-mono">{row.referenceNumber}</strong></span>
                                    {row.subCustomerName && (
                                      <span className="text-blue-800 bg-white px-2 py-0.5 rounded border border-blue-300 text-[11px]">
                                        الزبون الفرعي: {row.subCustomerName}
                                      </span>
                                    )}
                                  </div>
                                  <div className="font-mono font-bold text-blue-950 text-xs">
                                    المبلغ المقبوض: <span className="text-emerald-700 font-black text-sm">{row.credit.toFixed(2)}</span> {settings.currency}
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] pt-0.5">
                                  <div>
                                    <span className="text-slate-500">طريقة القبض: </span>
                                    <span className="font-bold text-slate-800">{row.paymentMethodLabel || 'نقداً'}</span>
                                  </div>
                                  {row.chequeNumber && (
                                    <div>
                                      <span className="text-slate-500">رقم الشيك: </span>
                                      <span className="font-bold text-slate-900 font-mono">{row.chequeNumber}</span>
                                    </div>
                                  )}
                                  {row.chequeBank && (
                                    <div>
                                      <span className="text-slate-500">البنك المسحوب عليه: </span>
                                      <span className="font-bold text-slate-800">{row.chequeBank}</span>
                                    </div>
                                  )}
                                  {row.chequeDueDate && (
                                    <div>
                                      <span className="text-slate-500">تاريخ استحقاق الشيك: </span>
                                      <span className="font-bold text-slate-900 font-mono">{row.chequeDueDate}</span>
                                    </div>
                                  )}
                                  {row.transferReference && (
                                    <div>
                                      <span className="text-slate-500">رقم الحوالة: </span>
                                      <span className="font-bold text-slate-900 font-mono">{row.transferReference}</span>
                                    </div>
                                  )}
                                  {row.accountCode && (
                                    <div>
                                      <span className="text-slate-500">الصندوق / الحساب المستلم: </span>
                                      <span className="font-mono text-slate-800">{row.accountCode}</span>
                                    </div>
                                  )}
                                </div>
                                {(row.voucherNotes || row.description) && (
                                  <div className="mt-1 pt-1 border-t border-blue-200/80 flex items-start gap-1.5 text-[11px]">
                                    <span className="font-bold text-blue-900 shrink-0">📝 البيان والملاحظات:</span>
                                    <span className="text-slate-900 font-medium">{row.voucherNotes || row.description}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* تفاصيل المقاصة الكاملة */}
                            {row.type === 'clearance' && (
                              <div className="mt-1 p-2 bg-teal-50/80 border border-teal-200 rounded text-xs space-y-1">
                                <div className="flex items-center justify-between border-b border-teal-200 pb-1">
                                  <div className="flex items-center gap-2 font-bold text-teal-900">
                                    <span className="bg-teal-700 text-white px-2 py-0.5 rounded text-[10px]">مقاصة ذمم متبادلة</span>
                                    <span>رقم المقاصة: <strong className="font-mono">{row.referenceNumber}</strong></span>
                                    {row.counterPartyName && (
                                      <span className="text-teal-950 bg-white px-2 py-0.5 rounded border border-teal-300 text-[11px]">
                                        الطرف المقابل: {row.counterPartyName}
                                      </span>
                                    )}
                                  </div>
                                  <div className="font-mono font-bold text-teal-950 text-xs">
                                    مبلغ المقاصة: <span className="font-black text-teal-800 text-sm">{(row.credit || row.debit).toFixed(2)}</span> {settings.currency}
                                  </div>
                                </div>
                                {row.reason && (
                                  <div className="text-[11px] text-slate-800">
                                    <span className="font-bold text-teal-900">سبب المقاصة والتسوية: </span>
                                    <span>{row.reason}</span>
                                  </div>
                                )}
                                {(row.voucherNotes || row.description) && (
                                  <div className="text-[11px] text-slate-800 flex items-start gap-1.5">
                                    <span className="font-bold text-teal-900 shrink-0">📝 تفاصيل وملاحظات المقاصة: </span>
                                    <span className="text-slate-900 font-medium">{row.voucherNotes || row.description}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* تفاصيل سند الصرف الكاملة والملاحظات */}
                            {row.type === 'payment' && (
                              <div className="mt-1 p-2 bg-amber-50/80 border border-amber-200 rounded text-xs space-y-1">
                                <div className="flex items-center justify-between border-b border-amber-200 pb-1">
                                  <div className="flex items-center gap-2 font-bold text-amber-900">
                                    <span className="bg-amber-700 text-white px-2 py-0.5 rounded text-[10px]">سند صرف نقدية / استرداد</span>
                                    <span>رقم السند: <strong className="font-mono">{row.referenceNumber}</strong></span>
                                  </div>
                                  <div className="font-mono font-bold text-amber-950 text-xs">
                                    المبلغ المصروف: <span className="font-black text-amber-900 text-sm">{row.debit.toFixed(2)}</span> {settings.currency}
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] pt-0.5">
                                  <div>
                                    <span className="text-slate-500">طريقة الصرف: </span>
                                    <span className="font-bold text-slate-800">{row.paymentMethodLabel || 'نقداً'}</span>
                                  </div>
                                  {row.chequeNumber && (
                                    <div>
                                      <span className="text-slate-500">رقم الشيك: </span>
                                      <span className="font-bold text-slate-900 font-mono">{row.chequeNumber}</span>
                                    </div>
                                  )}
                                  {row.chequeBank && (
                                    <div>
                                      <span className="text-slate-500">البنك: </span>
                                      <span className="font-bold text-slate-800">{row.chequeBank}</span>
                                    </div>
                                  )}
                                  {row.chequeDueDate && (
                                    <div>
                                      <span className="text-slate-500">تاريخ الاستحقاق: </span>
                                      <span className="font-bold text-slate-900 font-mono">{row.chequeDueDate}</span>
                                    </div>
                                  )}
                                  {row.transferReference && (
                                    <div>
                                      <span className="text-slate-500">رقم الحوالة: </span>
                                      <span className="font-bold text-slate-900 font-mono">{row.transferReference}</span>
                                    </div>
                                  )}
                                  {row.accountCode && (
                                    <div>
                                      <span className="text-slate-500">الصندوق / الحساب المنصرف منه: </span>
                                      <span className="font-mono text-slate-800">{row.accountCode}</span>
                                    </div>
                                  )}
                                </div>
                                {(row.voucherNotes || row.description) && (
                                  <div className="mt-1 pt-1 border-t border-amber-200/80 flex items-start gap-1.5 text-[11px]">
                                    <span className="font-bold text-amber-900 shrink-0">📝 البيان والملاحظات:</span>
                                    <span className="text-slate-900 font-medium">{row.voucherNotes || row.description}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* أي عملية أخرى تظهر كامل تفاصيلها */}
                            {row.type !== 'invoice' && row.type !== 'receipt' && row.type !== 'payment' && row.type !== 'clearance' && row.voucherNotes && (
                              <div className="mt-1 text-[11px] text-slate-700 bg-slate-100 p-1.5 rounded border border-slate-200">
                                <span className="font-bold text-slate-800">ملاحظات وتفاصيل العملية: </span>
                                <span>{row.voucherNotes}</span>
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-2.5 text-left font-bold text-rose-700 align-top">
                            {row.debit > 0 ? row.debit.toFixed(2) : '-'}
                          </td>
                          <td className="py-2.5 px-2.5 text-left font-bold text-emerald-700 align-top">
                            {row.credit > 0 ? row.credit.toFixed(2) : '-'}
                          </td>
                          <td className="py-2.5 px-2.5 text-left font-black text-slate-900 bg-slate-50/70 align-top">
                            {row.runningBalance.toFixed(2)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                      <td colSpan={5} className="py-2.5 px-3 text-left font-sans">الإجمالي العام للحركات بالفترة:</td>
                      <td className="py-2.5 px-2.5 text-left font-mono text-rose-800 font-black">
                        {partyStatement.totalDebit.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-2.5 text-left font-mono text-emerald-800 font-black">
                        {partyStatement.totalCredit.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-2.5 text-left font-mono text-slate-900 font-black bg-slate-200/80">
                        {partyStatement.closingBalance.toFixed(2)} {settings.currency}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* ملخص نهاية الكشف بعد الجدول حسب طلب المستخدم الدقيق: */}
              {/* إجمالي مدين الفترة :وهو الرصيد للفترة فقط المحددة -- إجمالي دائن الفترة -- الإجمالي لتاريخ الكشف */}
              <div className="mt-4 p-3.5 bg-slate-50 border-2 border-slate-800 rounded-xl space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* 1. إجمالي مدين الفترة */}
                  <div className="p-3 bg-white border-2 border-rose-300 rounded-lg shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-900">إجمالي مدين الفترة:</span>
                      <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-bold">
                        {isCustomer ? 'سحوبات وفواتير' : 'سداد ومسدد'}
                      </span>
                    </div>
                    <div className="my-2 text-center">
                      <div className="text-2xl font-black font-mono text-rose-700">
                        {partyStatement.totalDebit.toFixed(2)} <span className="text-sm font-sans">{settings.currency}</span>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-500 text-center border-t border-slate-100 pt-1 font-medium">
                      (وهو الرصيد للفترة فقط المحددة)
                    </div>
                  </div>

                  {/* 2. إجمالي دائن الفترة */}
                  <div className="p-3 bg-white border-2 border-emerald-300 rounded-lg shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-900">إجمالي دائن الفترة:</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                        {isCustomer ? 'مقبوضات وتحصيلات' : 'توريدات خامات'}
                      </span>
                    </div>
                    <div className="my-2 text-center">
                      <div className="text-2xl font-black font-mono text-emerald-700">
                        {partyStatement.totalCredit.toFixed(2)} <span className="text-sm font-sans">{settings.currency}</span>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-500 text-center border-t border-slate-100 pt-1 font-medium">
                      (إجمالي المقبوضات والحركات الدائنة للفترة)
                    </div>
                  </div>

                  {/* 3. الإجمالي لتاريخ الكشف */}
                  <div className={`p-3 bg-white border-2 rounded-lg shadow-xs flex flex-col justify-between ${
                    partyStatement.closingBalance > 0
                      ? 'border-amber-400 bg-amber-50/20'
                      : partyStatement.closingBalance < 0
                      ? 'border-blue-400 bg-blue-50/20'
                      : 'border-slate-300'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">الإجمالي لتاريخ الكشف:</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        partyStatement.closingBalance > 0
                          ? 'bg-amber-100 text-amber-900'
                          : partyStatement.closingBalance < 0
                          ? 'bg-blue-100 text-blue-900'
                          : 'bg-slate-100 text-slate-800'
                      }`}>
                        {partyStatement.closingBalance > 0
                          ? (isCustomer ? 'رصيد مدين مستحق على العميل' : 'رصيد دائن مستحق للمورد')
                          : partyStatement.closingBalance < 0
                          ? (isCustomer ? 'رصيد دائن فائض للعميل' : 'رصيد مدين لنا على المورد')
                          : 'الحساب خالص'}
                      </span>
                    </div>
                    <div className="my-2 text-center">
                      <div className="text-2xl font-black font-mono text-slate-950">
                        {partyStatement.closingBalance.toFixed(2)} <span className="text-sm font-sans">{settings.currency}</span>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-600 text-center border-t border-slate-100 pt-1 font-semibold">
                      {partyStatement.openingBalance !== 0 ? (
                        <span>(رصيد سابق: {partyStatement.openingBalance.toFixed(2)} + صافي حركة الفترة: {(partyStatement.totalDebit - partyStatement.totalCredit).toFixed(2)})</span>
                      ) : (
                        <span>(صافي حركة الفترة كاملة)</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tafqeet & Closing Balance */}
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-slate-700">المبلغ كتابة وتفقيطاً:</span>
                    <span className="font-bold text-slate-900 font-mono text-sm">
                      الرصيد الإجمالي لتاريخ الكشف: {partyStatement.closingBalance.toFixed(2)} {settings.currency}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-800 bg-slate-50 p-2 rounded border border-slate-200 font-arabic">
                    {partyTafqeet}
                  </div>
                </div>
              </div>

              {/* Official Signatures Section */}
              <div className="pt-6 border-t border-slate-300 grid grid-cols-3 gap-6 text-center text-xs">
                <div className="space-y-6">
                  <span className="font-bold text-slate-700 block">إعداد وتدقيق المحاسب</span>
                  <div className="border-b border-dashed border-slate-400 w-36 mx-auto"></div>
                  <span className="text-[11px] text-slate-400 block font-mono">التوقيع والتاريخ</span>
                </div>

                <div className="space-y-6">
                  <span className="font-bold text-slate-700 block">المدير المالي والاعتماد</span>
                  <div className="border-b border-dashed border-slate-400 w-36 mx-auto"></div>
                  <span className="text-[11px] text-slate-400 block font-mono">الختم والتوقيع</span>
                </div>

                <div className="space-y-6">
                  <span className="font-bold text-slate-700 block">
                    {isCustomer ? 'توقيع وختم العميل بالمطابقة' : 'مصادقة وختم المورد'}
                  </span>
                  <div className="border-b border-dashed border-slate-400 w-36 mx-auto"></div>
                  <span className="text-[11px] text-slate-400 block font-mono">المستلم المعتمد</span>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTION 2: EMPLOYEE FINANCIAL STATEMENT (كشف مالي للموظف) */}
          {/* ========================================================= */}
          {statementMode === 'employee' && employeeStatement && (
            <div className="space-y-4">
              
              {/* Summary Badges: Entitlements, Advances, Deductions, Disbursements, Balance */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                <div className="bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-200/80">
                  <span className="text-[10px] text-emerald-700 font-semibold block">إجمالي المستحقات (رواتب/حوافز):</span>
                  <span className="text-sm font-black font-mono text-emerald-800">
                    {formatNumber(employeeStatement.totalEntitlements, 2)} {settings.currency}
                  </span>
                  <span className="text-[9px] text-emerald-600 block mt-0.5">رواتب شهرية ومكافآت</span>
                </div>

                <div className="bg-amber-50/70 p-2.5 rounded-lg border border-amber-200/80">
                  <span className="text-[10px] text-amber-700 font-semibold block">إجمالي السلف المسحوبة:</span>
                  <span className="text-sm font-black font-mono text-amber-800">
                    {formatNumber(employeeStatement.totalAdvances, 2)} {settings.currency}
                  </span>
                  <span className="text-[9px] text-amber-600 block mt-0.5">مسحوبات نقدية من الخزينة</span>
                </div>

                <div className="bg-rose-50/70 p-2.5 rounded-lg border border-rose-200/80">
                  <span className="text-[10px] text-rose-700 font-semibold block">إجمالي الخصومات والجزاءات:</span>
                  <span className="text-sm font-black font-mono text-rose-800">
                    {formatNumber(employeeStatement.totalDeductions, 2)} {settings.currency}
                  </span>
                  <span className="text-[9px] text-rose-600 block mt-0.5">خصومات غياب وتأخير</span>
                </div>

                <div className="bg-blue-50/70 p-2.5 rounded-lg border border-blue-200/80">
                  <span className="text-[10px] text-blue-700 font-semibold block">إجمالي الصرف الفعلي (المدفوع):</span>
                  <span className="text-sm font-black font-mono text-blue-800">
                    {formatNumber(employeeStatement.totalDisbursements, 2)} {settings.currency}
                  </span>
                  <span className="text-[9px] text-blue-600 block mt-0.5">سندات صرف الرواتب والسلف</span>
                </div>

                <div className={`p-2.5 rounded-lg border ${
                  employeeStatement.closingBalance > 0
                    ? 'bg-blue-50 border-blue-300 text-blue-900'
                    : employeeStatement.closingBalance < 0
                    ? 'bg-rose-50 border-rose-300 text-rose-900'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                }`}>
                  <span className="text-[10px] font-semibold block">
                    {employeeStatement.closingBalance > 0 ? 'صافي مستحق للموظف:' : employeeStatement.closingBalance < 0 ? 'متبقي سلف على الموظف:' : 'الحساب متسوي:'}
                  </span>
                  <span className="text-sm font-black font-mono">
                    {formatNumber(Math.abs(employeeStatement.closingBalance), 2)} {settings.currency}
                  </span>
                  <span className="text-[9px] font-bold block mt-0.5">
                    {employeeStatement.closingBalance > 0 ? 'مستحق الصرف' : employeeStatement.closingBalance < 0 ? 'مطلوب تسويته' : 'رصيد صفر'}
                  </span>
                </div>
              </div>

              {/* Detailed Employee Transactions Table */}
              <div className="border border-slate-200 rounded-lg overflow-x-auto">
                <table className="w-full text-right text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-300 font-bold">
                      <th className="py-2.5 px-3 w-10 text-center">م</th>
                      <th className="py-2.5 px-3 w-24">التاريخ</th>
                      <th className="py-2.5 px-3 w-24">رقم السند/المرجع</th>
                      <th className="py-2.5 px-3 w-36">نوع الحركة</th>
                      <th className="py-2.5 px-3 min-w-56">البيان والشرح</th>
                      <th className="py-2.5 px-3 w-28 text-left bg-emerald-50/50">استحقاق للموظف (دائن)</th>
                      <th className="py-2.5 px-3 w-28 text-left bg-amber-50/50">سلف وخصم (مدين)</th>
                      <th className="py-2.5 px-3 w-28 text-left bg-blue-50/50">الصرف الفعلي</th>
                      <th className="py-2.5 px-3 w-28 text-left bg-slate-100/70">الرصيد التراكمي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono">
                    {employeeStatement.rows.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-slate-400 font-sans">
                          لا توجد حركات مالية مسجلة للموظف خلال هذه الفترة المحددة.
                        </td>
                      </tr>
                    ) : (
                      employeeStatement.rows.map((row, idx) => (
                        <tr
                          key={`${row.id || 'emp-row'}-${idx}`}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                          }`}
                        >
                          <td className="py-2 px-3 text-center text-slate-400 font-sans text-[11px]">{idx + 1}</td>
                          <td className="py-2 px-3 text-slate-700 whitespace-nowrap">{row.date}</td>
                          <td className="py-2 px-3 font-bold text-slate-800 whitespace-nowrap">{row.referenceNumber}</td>
                          <td className="py-2 px-3 font-sans">
                            <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                              row.type === 'salary_accrual' ? 'bg-emerald-100 text-emerald-800' :
                              row.type === 'advance' ? 'bg-amber-100 text-amber-800' :
                              row.type === 'deduction' ? 'bg-rose-100 text-rose-800' :
                              row.type === 'incentive' ? 'bg-purple-100 text-purple-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {row.typeLabel}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-sans text-slate-800">
                            <div>{row.description}</div>
                            {row.period && (
                              <div className="text-[10px] text-slate-500 font-mono mt-0.5">عن شهر/فترة: {row.period}</div>
                            )}
                            {row.notes && (
                              <div className="text-[10px] text-slate-500 mt-0.5">ملاحظة: {row.notes}</div>
                            )}
                          </td>
                          <td className="py-2 px-3 text-left font-bold text-emerald-700">
                            {row.entitlement > 0 ? row.entitlement.toFixed(2) : '-'}
                          </td>
                          <td className="py-2 px-3 text-left font-bold text-amber-700">
                            {(row.advance + row.deduction) > 0 ? (row.advance + row.deduction).toFixed(2) : '-'}
                          </td>
                          <td className="py-2 px-3 text-left font-bold text-blue-700">
                            {row.disbursement > 0 ? row.disbursement.toFixed(2) : '-'}
                          </td>
                          <td className="py-2 px-3 text-left font-black text-slate-900 bg-slate-50/70">
                            {row.runningBalance.toFixed(2)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                      <td colSpan={5} className="py-2.5 px-3 text-left font-sans">إجمالي حركات الفترة:</td>
                      <td className="py-2.5 px-3 text-left font-mono text-emerald-800 font-black">
                        {employeeStatement.totalEntitlements.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-left font-mono text-amber-800 font-black">
                        {(employeeStatement.totalAdvances + employeeStatement.totalDeductions).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-left font-mono text-blue-800 font-black">
                        {employeeStatement.totalDisbursements.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-left font-mono text-slate-900 font-black bg-slate-200/80">
                        {employeeStatement.closingBalance.toFixed(2)} {settings.currency}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* ملخص نهاية الكشف بعد الجدول للموظف حسب طلب المستخدم */}
              <div className="mt-4 p-3.5 bg-slate-50 border-2 border-slate-800 rounded-xl space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* 1. إجمالي مدين الفترة (سلف وخصومات ومسحوبات) */}
                  <div className="p-3 bg-white border-2 border-rose-300 rounded-lg shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-900">إجمالي مدين الفترة:</span>
                      <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-bold">
                        سلف وخصومات ومسحوبات
                      </span>
                    </div>
                    <div className="my-2 text-center">
                      <div className="text-2xl font-black font-mono text-rose-700">
                        {(employeeStatement.totalAdvances + employeeStatement.totalDeductions + employeeStatement.totalDisbursements).toFixed(2)} <span className="text-sm font-sans">{settings.currency}</span>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-500 text-center border-t border-slate-100 pt-1 font-medium">
                      (وهو الرصيد للفترة فقط المحددة)
                    </div>
                  </div>

                  {/* 2. إجمالي دائن الفترة (الرواتب والمستحقات والحوافز) */}
                  <div className="p-3 bg-white border-2 border-emerald-300 rounded-lg shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-900">إجمالي دائن الفترة:</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                        رواتب ومستحقات وحوافز
                      </span>
                    </div>
                    <div className="my-2 text-center">
                      <div className="text-2xl font-black font-mono text-emerald-700">
                        {employeeStatement.totalEntitlements.toFixed(2)} <span className="text-sm font-sans">{settings.currency}</span>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-500 text-center border-t border-slate-100 pt-1 font-medium">
                      (إجمالي استحقاقات الموظف المعتمدة بالفترة)
                    </div>
                  </div>

                  {/* 3. الإجمالي لتاريخ الكشف */}
                  <div className={`p-3 bg-white border-2 rounded-lg shadow-xs flex flex-col justify-between ${
                    employeeStatement.closingBalance > 0
                      ? 'border-blue-400 bg-blue-50/20'
                      : employeeStatement.closingBalance < 0
                      ? 'border-rose-400 bg-rose-50/20'
                      : 'border-slate-300'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">الإجمالي لتاريخ الكشف:</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        employeeStatement.closingBalance > 0
                          ? 'bg-blue-100 text-blue-900'
                          : employeeStatement.closingBalance < 0
                          ? 'bg-rose-100 text-rose-900'
                          : 'bg-slate-100 text-slate-800'
                      }`}>
                        {employeeStatement.closingBalance > 0
                          ? 'صافي مستحق للموظف'
                          : employeeStatement.closingBalance < 0
                          ? 'متبقي سلف على الموظف'
                          : 'الحساب خالص'}
                      </span>
                    </div>
                    <div className="my-2 text-center">
                      <div className="text-2xl font-black font-mono text-slate-950">
                        {Math.abs(employeeStatement.closingBalance).toFixed(2)} <span className="text-sm font-sans">{settings.currency}</span>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-600 text-center border-t border-slate-100 pt-1 font-semibold">
                      <span>(صافي مستحق السداد أو التسوية لتاريخه)</span>
                    </div>
                  </div>
                </div>

                {/* Tafqeet */}
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-slate-700">المبلغ كتابة وتفقيطاً:</span>
                    <span className="font-bold text-slate-900 font-mono text-sm">
                      الرصيد الإجمالي لتاريخ الكشف: {employeeStatement.closingBalance.toFixed(2)} {settings.currency}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-800 bg-slate-50 p-2 rounded border border-slate-200 font-arabic">
                    {empTafqeet}
                  </div>
                </div>
              </div>

              {/* Signatures for Employee Statement */}
              <div className="pt-6 border-t border-slate-300 grid grid-cols-3 gap-6 text-center text-xs">
                <div className="space-y-6">
                  <span className="font-bold text-slate-700 block">إعداد وتدقيق قسم الرواتب</span>
                  <div className="border-b border-dashed border-slate-400 w-36 mx-auto"></div>
                  <span className="text-[11px] text-slate-400 block font-mono">التوقيع والتاريخ</span>
                </div>

                <div className="space-y-6">
                  <span className="font-bold text-slate-700 block">اعتماد المدير المالي والإداري</span>
                  <div className="border-b border-dashed border-slate-400 w-36 mx-auto"></div>
                  <span className="text-[11px] text-slate-400 block font-mono">الختم والتوقيع</span>
                </div>

                <div className="space-y-6">
                  <span className="font-bold text-slate-700 block">توقيع وإقرار الموظف بالمطابقة</span>
                  <div className="border-b border-dashed border-slate-400 w-36 mx-auto"></div>
                  <span className="text-[11px] text-slate-400 block font-mono">الموظف صاحب الكشف</span>
                </div>
              </div>
            </div>
          )}

          {/* Footer Official Notice */}
          <div className="text-center text-[10px] text-slate-400 pt-3 border-t border-slate-100">
            تم استخراج كشف الحساب المالي آلياً عبر نظام إدارة الحسابات والمطابع - يرجى مراجعة الإدارة المالية في حال وجود أي استفسار أو تدقيق.
          </div>
        </div>
      </div>
    </div>
  );
};
