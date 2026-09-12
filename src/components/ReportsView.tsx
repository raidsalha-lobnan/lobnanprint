import React, { useState, useMemo, useEffect } from 'react';
import { useAccounting } from '../context/AccountingContext';
import {
  BarChart3,
  Printer,
  FileSpreadsheet,
  TrendingUp,
  Percent,
  DollarSign,
  ShieldCheck,
  Calendar,
  Users,
  Truck,
  Boxes,
  Wallet,
  Receipt,
  UserCheck,
  CreditCard,
  Landmark,
  Layers,
  Search,
  Filter,
  Download,
  CheckCircle,
  FileText,
  Building,
  ChevronDown
} from 'lucide-react';
import { Party } from '../types';
import { generateAccountStatement, generateEmployeeStatement, StatementRow } from '../utils/statementGenerator';
import { tafqeetArabic } from '../utils/tafqeet';

export type ReportType =
  | 'customer_statement'
  | 'customer_items'
  | 'supplier_statement'
  | 'supplier_items'
  | 'receipt_vouchers'
  | 'payment_vouchers'
  | 'employee_statement'
  | 'payroll_sheets'
  | 'treasuries_movement'
  | 'income'
  | 'balance_sheet'
  | 'vat';

interface ReportsViewProps {
  initialReport?: ReportType;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ initialReport }) => {
  const {
    accounts,
    settings,
    invoices,
    salesReturns,
    purchases,
    purchaseReturns,
    vouchers,
    parties,
    employees,
    payrollSheets,
    treasuries,
    journalEntries,
    currencies,
    employeeAdvances,
    employeeDeductions,
    employeeIncentives
  } = useAccounting();

  const [activeReport, setActiveReport] = useState<ReportType>(initialReport || 'customer_statement');

  useEffect(() => {
    if (initialReport) {
      setActiveReport(initialReport);
    }
  }, [initialReport]);

  // Common filters
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 1 & 2: Customer selection (Main & Sub)
  const mainCustomers = useMemo(() => {
    return parties.filter(p => (p.type === 'customer' || p.type === 'both') && !p.parentPartyId);
  }, [parties]);

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(mainCustomers[0]?.id || '');
  const [selectedSubCustomerId, setSelectedSubCustomerId] = useState<string>('all');

  const subCustomersForSelected = useMemo(() => {
    if (!selectedCustomerId) return [];
    return parties.filter(p => p.parentPartyId === selectedCustomerId);
  }, [parties, selectedCustomerId]);

  // 3 & 4: Supplier selection (Main & Sub)
  const mainSuppliers = useMemo(() => {
    return parties.filter(p => (p.type === 'supplier' || p.type === 'both') && !p.parentPartyId);
  }, [parties]);

  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(mainSuppliers[0]?.id || '');
  const [selectedSubSupplierId, setSelectedSubSupplierId] = useState<string>('all');

  const subSuppliersForSelected = useMemo(() => {
    if (!selectedSupplierId) return [];
    return parties.filter(p => p.parentPartyId === selectedSupplierId);
  }, [parties, selectedSupplierId]);

  // 5: Receipt vouchers treasury filter
  const [receiptTreasuryFilter, setReceiptTreasuryFilter] = useState<string>('all');

  // 6: Payment vouchers treasury filter
  const [paymentTreasuryFilter, setPaymentTreasuryFilter] = useState<string>('all');

  // 7: Employee selection
  const [selectedEmpId, setSelectedEmpId] = useState<string>(employees[0]?.id || '');

  // 9: Treasuries selection
  const [selectedTreasuryCode, setSelectedTreasuryCode] = useState<string>('all');

  // Print helper
  const handlePrint = () => {
    window.print();
  };

  // Export CSV helper
  const downloadCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // -------------------------------------------------------------
  // REPORT 1: Detailed Customer Statement (كشف حساب تفصيلي عميل)
  // -------------------------------------------------------------
  const [showStatementItemDetails, setShowStatementItemDetails] = useState<boolean>(true);

  const selectedSubCustObj = useMemo(() => {
    if (!selectedSubCustomerId || selectedSubCustomerId === 'all') return null;
    return subCustomersForSelected.find(s => s.id === selectedSubCustomerId);
  }, [subCustomersForSelected, selectedSubCustomerId]);

  const selectedSubSuppObj = useMemo(() => {
    if (!selectedSubSupplierId || selectedSubSupplierId === 'all') return null;
    return subSuppliersForSelected.find(s => s.id === selectedSubSupplierId);
  }, [subSuppliersForSelected, selectedSubSupplierId]);

  const customerStatementData = useMemo(() => {
    const cust = parties.find(p => p.id === selectedCustomerId);
    if (!cust) return { party: null, rows: [], totalDebit: 0, totalCredit: 0, balance: 0, openingBalance: 0, fromDate, toDate };

    const statement = generateAccountStatement({
      party: cust,
      invoices,
      purchases,
      purchaseReturns,
      salesReturns,
      vouchers,
      journalEntries,
      debtClearings: (window as any).__debtClearings || [],
      fromDate,
      toDate,
      subCustomerId: selectedSubCustomerId,
      subCustomers: subCustomersForSelected
    });

    return {
      party: cust,
      rows: statement.rows,
      totalDebit: statement.totalDebit,
      totalCredit: statement.totalCredit,
      balance: statement.closingBalance,
      openingBalance: statement.openingBalance,
      fromDate,
      toDate
    };
  }, [parties, selectedCustomerId, selectedSubCustomerId, subCustomersForSelected, invoices, purchases, purchaseReturns, salesReturns, vouchers, journalEntries, fromDate, toDate]);

  // -----------------------------------------------------------------------------------
  // REPORT 2: Customer Items Aggregated (كشف حساب الأصناف للعميل مع تجميع الأصناف المتشابهة)
  // -----------------------------------------------------------------------------------
  const customerItemsData = useMemo(() => {
    const cust = parties.find(p => p.id === selectedCustomerId);
    if (!cust) return { party: null, items: [], totalQuantity: 0, totalAmount: 0 };

    const targetCustomerIds = new Set<string>();
    targetCustomerIds.add(cust.id);
    if (selectedSubCustomerId === 'all') {
      subCustomersForSelected.forEach(sub => targetCustomerIds.add(sub.id));
    } else if (selectedSubCustomerId) {
      targetCustomerIds.clear();
      targetCustomerIds.add(selectedSubCustomerId);
    }

    // Map: itemKey -> aggregated data
    const map = new Map<string, {
      itemId: string;
      itemCode: string;
      itemName: string;
      description?: string;
      notes?: string;
      unit: string;
      category: string;
      totalQuantity: number;
      totalAmount: number;
      lastDate: string;
      invoiceCount: number;
    }>();

    invoices.forEach(inv => {
      const isMatch = (inv.customerId && targetCustomerIds.has(inv.customerId)) ||
                      (inv.subCustomerId && targetCustomerIds.has(inv.subCustomerId)) ||
                      (cust.name && inv.customerName === cust.name);
      if (!isMatch) return;
      if (fromDate && inv.date < fromDate) return;
      if (toDate && inv.date > toDate) return;

      inv.items.forEach(line => {
        const key = line.item?.id || line.description || 'unknown';
        const name = line.item?.name || line.description || 'صنف غير محدد';
        const code = line.item?.code || '-';
        const unit = line.unit || line.item?.unit || 'قطعة';
        const category = line.item?.category || 'عام';
        const qty = line.quantity || 1;
        const lineTotal = (line.unitPrice || line.item?.price || 0) * qty - (line.discount || 0);
        const noteText = line.notes || (line as any).note || '';
        const descText = line.description && line.description !== name ? line.description : '';

        if (!map.has(key)) {
          map.set(key, {
            itemId: key,
            itemCode: code,
            itemName: name,
            description: descText,
            notes: noteText,
            unit,
            category,
            totalQuantity: qty,
            totalAmount: lineTotal,
            lastDate: inv.date,
            invoiceCount: 1
          });
        } else {
          const prev = map.get(key)!;
          prev.totalQuantity += qty;
          prev.totalAmount += lineTotal;
          prev.invoiceCount += 1;
          if (!prev.notes && noteText) prev.notes = noteText;
          if (!prev.description && descText) prev.description = descText;
          if (inv.date > prev.lastDate) {
            prev.lastDate = inv.date;
          }
        }
      });
    });

    const items = Array.from(map.values()).sort((a, b) => b.totalAmount - a.totalAmount);
    const totalQuantity = items.reduce((s, i) => s + i.totalQuantity, 0);
    const totalAmount = items.reduce((s, i) => s + i.totalAmount, 0);

    return {
      party: cust,
      items,
      totalQuantity,
      totalAmount
    };
  }, [parties, selectedCustomerId, selectedSubCustomerId, subCustomersForSelected, invoices, fromDate, toDate]);

  // -------------------------------------------------------------
  // REPORT 3: Detailed Supplier Statement (كشف حساب تفصيلي مورد)
  // -------------------------------------------------------------
  const supplierStatementData = useMemo(() => {
    const supp = parties.find(p => p.id === selectedSupplierId);
    if (!supp) return { party: null, rows: [], totalDebit: 0, totalCredit: 0, balance: 0, openingBalance: 0, fromDate, toDate };

    const statement = generateAccountStatement({
      party: supp,
      invoices,
      purchases,
      purchaseReturns,
      salesReturns,
      vouchers,
      journalEntries,
      debtClearings: (window as any).__debtClearings || [],
      fromDate,
      toDate,
      subCustomerId: selectedSubSupplierId,
      subCustomers: subSuppliersForSelected
    });

    return {
      party: supp,
      rows: statement.rows,
      totalDebit: statement.totalDebit,
      totalCredit: statement.totalCredit,
      balance: statement.closingBalance,
      openingBalance: statement.openingBalance,
      fromDate,
      toDate
    };
  }, [parties, selectedSupplierId, selectedSubSupplierId, subSuppliersForSelected, invoices, purchases, purchaseReturns, salesReturns, vouchers, journalEntries, fromDate, toDate]);

  // -----------------------------------------------------------------------------------
  // REPORT 4: Supplier Items Aggregated (كشف حساب الأصناف للمورد مع تجميع الأصناف المتشابهة)
  // -----------------------------------------------------------------------------------
  const supplierItemsData = useMemo(() => {
    const supp = parties.find(p => p.id === selectedSupplierId);
    if (!supp) return { party: null, items: [], totalQuantity: 0, totalAmount: 0 };

    const targetSuppIds = new Set<string>();
    targetSuppIds.add(supp.id);
    if (selectedSubSupplierId === 'all') {
      subSuppliersForSelected.forEach(sub => targetSuppIds.add(sub.id));
    } else if (selectedSubSupplierId) {
      targetSuppIds.clear();
      targetSuppIds.add(selectedSubSupplierId);
    }

    const map = new Map<string, {
      itemId: string;
      itemName: string;
      description?: string;
      notes?: string;
      totalQuantity: number;
      totalAmount: number;
      lastDate: string;
      invoiceCount: number;
    }>();

    purchases.forEach(pur => {
      const isMatch = (pur.supplierId && targetSuppIds.has(pur.supplierId)) || (pur.supplierName === supp.name);
      if (!isMatch) return;
      if (fromDate && pur.date < fromDate) return;
      if (toDate && pur.date > toDate) return;

      pur.items.forEach(line => {
        const key = line.itemId || line.itemName;
        const name = line.itemName;
        const qty = line.quantity || 1;
        const lineTotal = line.unitPrice * qty;
        const noteText = (line as any).notes || (line as any).note || '';
        const descText = (line as any).description && (line as any).description !== name ? (line as any).description : '';

        if (!map.has(key)) {
          map.set(key, {
            itemId: key,
            itemName: name,
            description: descText,
            notes: noteText,
            totalQuantity: qty,
            totalAmount: lineTotal,
            lastDate: pur.date,
            invoiceCount: 1
          });
        } else {
          const prev = map.get(key)!;
          prev.totalQuantity += qty;
          prev.totalAmount += lineTotal;
          prev.invoiceCount += 1;
          if (!prev.notes && noteText) prev.notes = noteText;
          if (!prev.description && descText) prev.description = descText;
          if (pur.date > prev.lastDate) {
            prev.lastDate = pur.date;
          }
        }
      });
    });

    const items = Array.from(map.values()).sort((a, b) => b.totalAmount - a.totalAmount);
    const totalQuantity = items.reduce((s, i) => s + i.totalQuantity, 0);
    const totalAmount = items.reduce((s, i) => s + i.totalAmount, 0);

    return {
      party: supp,
      items,
      totalQuantity,
      totalAmount
    };
  }, [parties, selectedSupplierId, selectedSubSupplierId, subSuppliersForSelected, purchases, fromDate, toDate]);

  // -------------------------------------------------------------
  // REPORT 5: Detailed Receipt Vouchers (كشف تفصيلي سندات القبض)
  // -------------------------------------------------------------
  const receiptVouchersData = useMemo(() => {
    return vouchers.filter(v => {
      if (v.type !== 'receipt') return false;
      if (receiptTreasuryFilter !== 'all' && v.accountCode !== receiptTreasuryFilter && v.treasuryAccountCode !== receiptTreasuryFilter) return false;
      if (fromDate && v.date < fromDate) return false;
      if (toDate && v.date > toDate) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          v.voucherNumber.toLowerCase().includes(q) ||
          (v.partyName && v.partyName.toLowerCase().includes(q)) ||
          (v.description && v.description.toLowerCase().includes(q))
        );
      }
      return true;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [vouchers, receiptTreasuryFilter, fromDate, toDate, searchQuery]);

  // -------------------------------------------------------------
  // REPORT 6: Detailed Payment Vouchers (كشف تفصيلي سندات الصرف)
  // -------------------------------------------------------------
  const paymentVouchersData = useMemo(() => {
    return vouchers.filter(v => {
      if (v.type !== 'payment') return false;
      if (paymentTreasuryFilter !== 'all' && v.accountCode !== paymentTreasuryFilter && v.treasuryAccountCode !== paymentTreasuryFilter) return false;
      if (fromDate && v.date < fromDate) return false;
      if (toDate && v.date > toDate) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          v.voucherNumber.toLowerCase().includes(q) ||
          (v.partyName && v.partyName.toLowerCase().includes(q)) ||
          (v.description && v.description.toLowerCase().includes(q))
        );
      }
      return true;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [vouchers, paymentTreasuryFilter, fromDate, toDate, searchQuery]);

  // -------------------------------------------------------------
  // REPORT 7: Detailed Employee Statement (كشف حساب تفصيلي موظف)
  // -------------------------------------------------------------
  const employeeStatementData = useMemo(() => {
    const emp = employees.find(e => e.id === selectedEmpId);
    if (!emp) return { employee: null, rows: [], totalDue: 0, totalPaid: 0, netBalance: 0 };

    interface EmpRow {
      date: string;
      type: string;
      refNumber: string;
      description: string;
      dueAmount: number; // استحقاق للموظف (راتب / حافز / بدلات)
      paidAmount: number; // منصرف له أو مخصوم (سلف / خصومات / صرف رواتب)
    }

    const rows: EmpRow[] = [];

    // Advances
    employeeAdvances.filter(a => a.employeeId === emp.id).forEach(adv => {
      rows.push({
        date: adv.date,
        type: 'سلفة نقدية منصرفة',
        refNumber: `ADV-${adv.id.slice(-4)}`,
        description: `سلفة على الراتب (${adv.notes || 'سلفة عاجلة'})`,
        dueAmount: 0,
        paidAmount: adv.amount
      });
    });

    // Deductions
    employeeDeductions.filter(d => d.employeeId === emp.id).forEach(ded => {
      rows.push({
        date: ded.date,
        type: 'استقطاع / غياب / جزاء',
        refNumber: `DED-${ded.id.slice(-4)}`,
        description: `${ded.reason} (${ded.notes || ''})`,
        dueAmount: 0,
        paidAmount: ded.amount
      });
    });

    // Incentives / Bonuses
    employeeIncentives.filter(inc => inc.employeeId === emp.id).forEach(inc => {
      rows.push({
        date: inc.date,
        type: 'مكافأة وحافز إنجاز',
        refNumber: `INC-${inc.id.slice(-4)}`,
        description: `${inc.reason} (${inc.notes || ''})`,
        dueAmount: inc.amount,
        paidAmount: 0
      });
    });

    // Payroll sheet line
    (payrollSheets || []).forEach(sheet => {
      const sheetItems = (sheet as any).items || (sheet as any).lines || [];
      const line = sheetItems.find((l: any) => l.employeeId === emp.id);
      if (line) {
        rows.push({
          date: sheet.createdAt || sheet.disbursedAt || (sheet as any).periodMonth || '2026-09-01',
          type: sheet.status === 'approved' ? 'مسير راتب معتمد' : 'مسودة مسير راتب',
          refNumber: sheet.sheetNumber,
          description: `راتب شهر ${sheet.period || (sheet as any).periodMonth || ''} (أساسي: ${line.basicSalary || 0}، بدلات: ${line.allowances || line.allowancesTotal || 0}، استقطاعات: ${line.deductions || line.deductionsTotal || 0})`,
          dueAmount: line.netSalary,
          paidAmount: sheet.status === 'approved' ? line.netSalary : 0
        });
      }
    });

    const filtered = rows.filter(r => {
      if (fromDate && r.date < fromDate) return false;
      if (toDate && r.date > toDate) return false;
      return true;
    }).sort((a, b) => a.date.localeCompare(b.date));

    let running = 0;
    const computedRows = filtered.map(r => {
      running += (r.dueAmount - r.paidAmount);
      return {
        ...r,
        runningBalance: running
      };
    });

    const totalDue = computedRows.reduce((s, r) => s + r.dueAmount, 0);
    const totalPaid = computedRows.reduce((s, r) => s + r.paidAmount, 0);

    return {
      employee: emp,
      rows: computedRows,
      totalDue,
      totalPaid,
      netBalance: totalDue - totalPaid
    };
  }, [employees, selectedEmpId, employeeAdvances, employeeDeductions, employeeIncentives, payrollSheets, fromDate, toDate]);

  // -------------------------------------------------------------
  // REPORT 8: Payroll Sheets Report (كشف رواتب الموظفين)
  // -------------------------------------------------------------
  const payrollSheetsData = useMemo(() => {
    return (payrollSheets || []).filter(sheet => {
      const sheetDate = sheet.createdAt || sheet.disbursedAt || (sheet as any).periodMonth || '';
      if (fromDate && sheetDate < fromDate) return false;
      if (toDate && sheetDate > toDate) return false;
      return true;
    }).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }, [payrollSheets, fromDate, toDate]);

  // -------------------------------------------------------------
  // REPORT 9: Treasuries Movement Report (كشف تفصيلي للصناديق)
  // -------------------------------------------------------------
  const treasuriesMovementData = useMemo(() => {
    const targetTreasuries = selectedTreasuryCode === 'all'
      ? treasuries
      : treasuries.filter(t => t.accountCode === selectedTreasuryCode);

    interface TreasuryRow {
      date: string;
      treasuryName: string;
      type: string;
      docNumber: string;
      partyName: string;
      actualCurrency: string;
      actualAmount: number;
      exchangeRate: number;
      inflow: number;  // مقبوضات واردة بالعملة الأساسية (شيكل)
      outflow: number; // مدفوعات منصرفة بالعملة الأساسية (شيكل)
      notes: string;
    }

    const rows: TreasuryRow[] = [];

    // 1. Vouchers (قبض وصرف)
    vouchers.forEach(v => {
      const isMatch = selectedTreasuryCode === 'all' || v.accountCode === selectedTreasuryCode || v.treasuryAccountCode === selectedTreasuryCode;
      if (isMatch) {
        const treasury = treasuries.find(t => t.accountCode === v.accountCode || t.accountCode === v.treasuryAccountCode);
        const actualCurr = v.currency || 'ILS';
        const rate = v.exchangeRate || 1.0;
        const actualAmt = v.amount;
        const baseAmt = v.baseAmount ?? (actualAmt * rate);

        rows.push({
          date: v.date,
          treasuryName: treasury?.name || 'الخزينة',
          type: v.type === 'receipt' ? 'سند قبض' : 'سند صرف',
          docNumber: v.voucherNumber,
          partyName: v.partyName || '-',
          actualCurrency: actualCurr,
          actualAmount: actualAmt,
          exchangeRate: rate,
          inflow: v.type === 'receipt' ? baseAmt : 0,
          outflow: v.type === 'payment' ? baseAmt : 0,
          notes: v.description || '-'
        });
      }
    });

    // 2. Treasury Internal Transfers (تحويلات الخزائن)
    targetTreasuries.forEach(t => {
      (t.transactions || []).forEach(tx => {
        if (tx.referenceType === 'transfer' || tx.type === 'transfer_in' || tx.type === 'transfer_out') {
          const actualCurr = tx.actualCurrency || 'ILS';
          const rate = tx.exchangeRate || 1.0;
          const actualAmt = tx.actualAmount ?? tx.amount;
          const baseAmt = tx.baseAmount ?? (actualAmt * rate);
          const isIncome = tx.type === 'transfer_in' || tx.type === 'deposit';

          rows.push({
            date: tx.date,
            treasuryName: t.name,
            type: tx.type === 'transfer_in' ? 'تحويل وارد' : 'تحويل صادر',
            docNumber: tx.id.slice(0, 8),
            partyName: tx.targetTreasuryName ? `طرف آخر: ${tx.targetTreasuryName}` : '-',
            actualCurrency: actualCurr,
            actualAmount: actualAmt,
            exchangeRate: rate,
            inflow: isIncome ? baseAmt : 0,
            outflow: !isIncome ? baseAmt : 0,
            notes: tx.description || 'تحويل مالي بين الصناديق'
          });
        }
      });
    });

    const filtered = rows.filter(r => {
      if (fromDate && r.date < fromDate) return false;
      if (toDate && r.date > toDate) return false;
      return true;
    }).sort((a, b) => b.date.localeCompare(a.date));

    const totalInflow = filtered.reduce((s, r) => s + r.inflow, 0);
    const totalOutflow = filtered.reduce((s, r) => s + r.outflow, 0);

    // Target holdings by currency
    const targetHoldings: Record<string, number> = {};
    targetTreasuries.forEach(t => {
      if (t.currencyBalances && Object.keys(t.currencyBalances).length > 0) {
        Object.entries(t.currencyBalances).forEach(([c, amt]) => {
          targetHoldings[c] = (targetHoldings[c] || 0) + (Number(amt) || 0);
        });
      } else {
        targetHoldings['ILS'] = (targetHoldings['ILS'] || 0) + (t.balance || 0);
      }
    });

    // Net movements grouped by actual currency
    const currencyMovements: Record<string, { in: number; out: number }> = {};
    filtered.forEach(r => {
      if (!currencyMovements[r.actualCurrency]) {
        currencyMovements[r.actualCurrency] = { in: 0, out: 0 };
      }
      if (r.inflow > 0) {
        currencyMovements[r.actualCurrency].in += r.actualAmount;
      }
      if (r.outflow > 0) {
        currencyMovements[r.actualCurrency].out += r.actualAmount;
      }
    });

    return {
      targetTreasuries,
      rows: filtered,
      totalInflow,
      totalOutflow,
      netMovement: totalInflow - totalOutflow,
      targetHoldings,
      currencyMovements
    };
  }, [treasuries, selectedTreasuryCode, vouchers, fromDate, toDate]);

  // -------------------------------------------------------------
  // Financial Statements Data (Income & Balance Sheet)
  // -------------------------------------------------------------
  const revBookstore = accounts.find(a => a.code === '4101')?.balance || 0;
  const revPrinting = accounts.find(a => a.code === '4102')?.balance || 0;
  const revServices = accounts.find(a => a.code === '4103')?.balance || 0;
  const totalRevenues = revBookstore + revPrinting + revServices;

  const cogsBookstore = accounts.find(a => a.code === '5101')?.balance || 0;
  const cogsPrinting = accounts.find(a => a.code === '5102')?.balance || 0;
  const totalCogs = cogsBookstore + cogsPrinting;

  const grossProfit = totalRevenues - totalCogs;

  const expSalaries = accounts.find(a => a.code === '5201')?.balance || 0;
  const expRent = accounts.find(a => a.code === '5202')?.balance || 0;
  const expMaintenance = accounts.find(a => a.code === '5203')?.balance || 0;
  const expUtilities = accounts.find(a => a.code === '5204')?.balance || 0;
  const expGeneral = accounts.find(a => a.code === '5205')?.balance || 0;
  const totalExpenses = expSalaries + expRent + expMaintenance + expUtilities + expGeneral;

  const netProfit = grossProfit - totalExpenses;

  const assetCash = accounts.find(a => a.code === '1101')?.balance || 0;
  const assetBank = accounts.find(a => a.code === '1102')?.balance || 0;
  const assetReceivables = accounts.find(a => a.code === '1201')?.balance || 0;
  const assetInventoryBooks = accounts.find(a => a.code === '1301')?.balance || 0;
  const assetInventoryPrint = accounts.find(a => a.code === '1302')?.balance || 0;
  const assetMachines = accounts.find(a => a.code === '1501')?.balance || 0;

  const totalCurrentAssets = assetCash + assetBank + assetReceivables + assetInventoryBooks + assetInventoryPrint;
  const totalFixedAssets = assetMachines;
  const totalAssets = totalCurrentAssets + totalFixedAssets;

  const liabPayables = accounts.find(a => a.code === '2101')?.balance || 0;
  const liabVat = accounts.find(a => a.code === '2103')?.balance || 0;
  const totalLiabilities = liabPayables + liabVat;

  const eqCapital = accounts.find(a => a.code === '3101')?.balance || 0;
  const eqRetained = accounts.find(a => a.code === '3201')?.balance || 0;
  const totalEquity = eqCapital + eqRetained + netProfit;

  // VAT calculations
  const totalSalesTaxable = invoices.reduce((acc, inv) => acc + (inv.subtotal - inv.discountTotal), 0);
  const totalOutputVat = invoices.reduce((acc, inv) => acc + inv.taxAmount, 0);
  const totalPurchasesTaxable = purchases.reduce((acc, p) => acc + p.subtotal, 0);
  const totalInputVat = purchases.reduce((acc, p) => acc + p.taxAmount, 0);
  const netVatPayable = totalOutputVat - totalInputVat;

  // Report navigation tabs metadata
  interface ReportTabItem {
    id: ReportType;
    name: string;
    icon: React.ElementType;
  }

  interface ReportCategory {
    group: string;
    items: ReportTabItem[];
  }

  const reportsCategories: ReportCategory[] = [
    {
      group: 'تقارير العملاء والمبيعات',
      items: [
        { id: 'customer_statement' as const, name: '1. كشف حساب تفصيلي عميل', icon: Users },
        { id: 'customer_items' as const, name: '2. كشف حساب الأصناف للعميل', icon: Boxes }
      ]
    },
    {
      group: 'تقارير الموردين والمشتريات',
      items: [
        { id: 'supplier_statement' as const, name: '3. كشف حساب تفصيلي مورد', icon: Truck },
        { id: 'supplier_items' as const, name: '4. كشف حساب الأصناف للمورد', icon: Boxes }
      ]
    },
    {
      group: 'سندات القبض والصرف',
      items: [
        { id: 'receipt_vouchers' as const, name: '5. كشف تفصيلي سندات القبض', icon: Receipt },
        { id: 'payment_vouchers' as const, name: '6. كشف تفصيلي سندات الصرف', icon: Wallet }
      ]
    },
    {
      group: 'الموظفون والخزائن',
      items: [
        { id: 'employee_statement' as const, name: '7. كشف حساب تفصيلي موظف', icon: UserCheck },
        { id: 'payroll_sheets' as const, name: '8. كشف رواتب الموظفين', icon: FileSpreadsheet },
        { id: 'treasuries_movement' as const, name: '9. كشف تفصيلي للصناديق', icon: Landmark }
      ]
    },
    {
      group: 'القوائم الختامية والضريبية',
      items: [
        { id: 'income' as const, name: 'قائمة الدخل والأرباح', icon: TrendingUp },
        { id: 'balance_sheet' as const, name: 'الميزانية العمومية', icon: BarChart3 },
        { id: 'vat' as const, name: 'الإقرار الضريبي المعتمد', icon: Percent }
      ]
    }
  ];

  return (
    <div className="space-y-5" dir="rtl">
      {/* Top Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900">مركز التقارير المحاسبية والتفصيلية</h1>
            <p className="text-[11px] text-slate-500">
              كشوفات الحسابات المعتمدة، حركات وتجميع الأصناف، سندات القبض والصرف، الرواتب والصناديق والقوائم المالية
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة التقرير</span>
          </button>
        </div>
      </div>

      {/* Reports Navigation Bar (Tabs Selector) */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs print:hidden space-y-2">
        <div className="flex items-center gap-1 text-[11px] text-slate-400 font-bold mb-1">
          <span>اختر التقرير المطلوب:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {reportsCategories.flatMap(cat => cat.items).map(item => {
            const Icon = item.icon;
            const isSelected = activeReport === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveReport(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Common Filters Bar (Dates & Entities) */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 print:hidden text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Customer Selector if activeReport is customer_statement or customer_items */}
          {(activeReport === 'customer_statement' || activeReport === 'customer_items') && (
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">العميل الرئيسي:</span>
              <select
                value={selectedCustomerId}
                onChange={e => {
                  setSelectedCustomerId(e.target.value);
                  setSelectedSubCustomerId('all');
                }}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800"
              >
                {mainCustomers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>

              {subCustomersForSelected.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-500">الفرعي:</span>
                  <select
                    value={selectedSubCustomerId}
                    onChange={e => setSelectedSubCustomerId(e.target.value)}
                    className="bg-blue-50 border border-blue-200 rounded-lg px-2.5 py-1.5 text-xs text-blue-900 font-semibold"
                  >
                    <option value="all">كل الزبائن الفرعيين والتابعِين</option>
                    {subCustomersForSelected.map(sub => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Supplier Selector if activeReport is supplier_statement or supplier_items */}
          {(activeReport === 'supplier_statement' || activeReport === 'supplier_items') && (
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">المورد الرئيسي:</span>
              <select
                value={selectedSupplierId}
                onChange={e => {
                  setSelectedSupplierId(e.target.value);
                  setSelectedSubSupplierId('all');
                }}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800"
              >
                {mainSuppliers.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>

              {subSuppliersForSelected.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-500">الفرعي:</span>
                  <select
                    value={selectedSubSupplierId}
                    onChange={e => setSelectedSubSupplierId(e.target.value)}
                    className="bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 text-xs text-amber-900 font-semibold"
                  >
                    <option value="all">كل الفروع التابعة</option>
                    {subSuppliersForSelected.map(sub => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Employee Selector if activeReport is employee_statement */}
          {activeReport === 'employee_statement' && (
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">الموظف:</span>
              <select
                value={selectedEmpId}
                onChange={e => setSelectedEmpId(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800"
              >
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} - {emp.jobTitle}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Treasury Filter if activeReport is treasuries_movement, receipt_vouchers, or payment_vouchers */}
          {(activeReport === 'treasuries_movement' || activeReport === 'receipt_vouchers' || activeReport === 'payment_vouchers') && (
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">الخزينة / الحساب:</span>
              <select
                value={
                  activeReport === 'treasuries_movement'
                    ? selectedTreasuryCode
                    : activeReport === 'receipt_vouchers'
                    ? receiptTreasuryFilter
                    : paymentTreasuryFilter
                }
                onChange={e => {
                  const val = e.target.value;
                  if (activeReport === 'treasuries_movement') setSelectedTreasuryCode(val);
                  else if (activeReport === 'receipt_vouchers') setReceiptTreasuryFilter(val);
                  else setPaymentTreasuryFilter(val);
                }}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
              >
                <option value="all">كل الخزائن والحسابات البنكية</option>
                {treasuries.map(t => (
                  <option key={t.id} value={t.accountCode}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Date Filter Inputs */}
        <div className="flex items-center gap-2 text-slate-600">
          <span className="text-[11px] text-slate-400">من:</span>
          <input
            type="date"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs"
          />
          <span className="text-[11px] text-slate-400">إلى:</span>
          <input
            type="date"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs"
          />
          {(fromDate || toDate) && (
            <button
              onClick={() => {
                setFromDate('');
                setToDate('');
              }}
              className="text-rose-600 text-[11px] font-bold hover:underline cursor-pointer"
            >
              إلغاء
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. كشف حساب تفصيلي عميل */}
      {/* ========================================================================= */}
      {activeReport === 'customer_statement' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4 print:p-0 print:border-0 print:shadow-none">
          {/* 1. ترويسة كشف الحساب حسب إعدادات البرنامج */}
          <div className="border-b-2 border-slate-800 pb-3 flex items-start justify-between">
            <div>
              <h1 className="text-xl font-black text-slate-900">{settings.name || 'مؤسسة الدعاية والإعلان'}</h1>
              <div className="text-xs text-slate-600 mt-0.5 space-x-2 space-x-reverse">
                {settings.commercialRegister && <span>س.ت: <strong className="font-mono">{settings.commercialRegister}</strong></span>}
                {settings.taxNumber && <span> | الرقم الضريبي: <strong className="font-mono">{settings.taxNumber}</strong></span>}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {settings.address && <span>{settings.address}</span>}
                {settings.phone && <span> | هاتف: <span className="font-mono">{settings.phone}</span></span>}
              </div>
            </div>
            <div className="text-center">
              <div className="inline-block bg-slate-900 text-white px-4 py-1 rounded-md text-base font-black shadow-xs">
                كشف حساب عميل تفصيلي
              </div>
              <div className="text-[11px] text-slate-500 font-mono mt-1">
                تاريخ الاستخراج: {new Date().toISOString().split('T')[0]}
              </div>
            </div>
            {settings.logo ? (
              <img src={settings.logo} alt="Logo" className="w-16 h-16 object-contain" />
            ) : (
              <div className="w-16 h-16 bg-slate-100 border border-slate-300 rounded flex items-center justify-center text-[10px] text-slate-400 font-bold">
                شعار المنشأة
              </div>
            )}
          </div>

          {/* 2. بيانات العميل والفترة */}
          <div className="bg-slate-50 border border-slate-300 rounded-lg p-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <div className="text-sm font-black text-slate-900 flex items-center gap-1.5 flex-wrap">
                <span>اسم العميل:</span>
                <span className="text-blue-900 font-extrabold">{customerStatementData.party?.name || 'غير محدد'}</span>
                {selectedSubCustObj && (
                  <span className="text-blue-700 bg-blue-100 px-2 py-0.5 rounded text-xs font-bold">
                    / الزبون الفرعي: {selectedSubCustObj.name}
                  </span>
                )}
              </div>
              <div className="text-slate-600">
                <span>كود الحساب: </span>
                <strong className="font-mono text-slate-900">{customerStatementData.party?.code || '-'}</strong>
                {customerStatementData.party?.phone && (
                  <span className="mr-3">
                    الهاتف: <strong className="font-mono text-slate-800">{customerStatementData.party.phone}</strong>
                  </span>
                )}
              </div>
            </div>
            <div className="space-y-1 sm:text-left">
              <div className="font-bold text-slate-800">
                الفترة من: <span className="font-mono text-blue-950">{fromDate || 'بداية التعامل'}</span> إلى: <span className="font-mono text-blue-950">{toDate || 'تاريخ اليوم'}</span>
              </div>
              <div className="text-slate-600">
                العملة: <strong className="text-slate-900 font-bold">{settings.currency}</strong>
              </div>
            </div>
          </div>

          {/* شريط أدوات الكشف (عرض/إخفاء بنود الفواتير) */}
          <div className="flex items-center justify-between print:hidden bg-slate-50 p-2 rounded-lg border border-slate-200 text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowStatementItemDetails(prev => !prev)}
                className={`px-3 py-1.5 rounded font-bold cursor-pointer transition-colors flex items-center gap-1 ${
                  showStatementItemDetails
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                }`}
              >
                <span>{showStatementItemDetails ? 'إخفاء تفاصيل بنود الفواتير' : 'إظهار تفاصيل بنود الفواتير والمقاسات'}</span>
              </button>
              <span className="text-[11px] text-slate-500">
                (الصنف، البيان، الطول، العرض، العدد، الكمية، السعر)
              </span>
            </div>
            <div className="text-[11px] text-slate-500">
              عدد الحركات: <strong className="font-mono text-slate-900">{customerStatementData.rows.length}</strong>
            </div>
          </div>

          {/* 3. جدول الحركات المالي المفصل */}
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs border-collapse border border-slate-300">
              <thead className="bg-slate-800 text-white text-[11px]">
                <tr>
                  <th className="py-2 px-1.5 border border-slate-700 text-center w-8">م</th>
                  <th className="py-2 px-2 border border-slate-700 text-center w-24">التاريخ</th>
                  <th className="py-2 px-2 border border-slate-700 text-center w-24">رقم الحركة</th>
                  <th className="py-2 px-2 border border-slate-700 w-28">نوع العملية</th>
                  <th className="py-2 px-2 border border-slate-700">البيان والشرح والتفاصيل الكاملة</th>
                  <th className="py-2 px-2 border border-slate-700 text-left w-24">مدين (عليه)</th>
                  <th className="py-2 px-2 border border-slate-700 text-left w-24">دائن (له)</th>
                  <th className="py-2 px-2 border border-slate-700 text-left w-28">الرصيد التراكمي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {customerStatementData.rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400 font-bold">
                      لا توجد حركات مالية مسجلة للعميل خلال الفترة المحددة
                    </td>
                  </tr>
                ) : (
                  customerStatementData.rows.map((row: StatementRow, idx: number) => (
                    <tr
                      key={row.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        row.type === 'opening'
                          ? 'bg-slate-100/90 font-bold'
                          : idx % 2 === 1
                          ? 'bg-slate-50/40'
                          : 'bg-white'
                      }`}
                    >
                      <td className="py-2.5 px-1.5 text-center text-slate-500 font-mono text-[11px] align-top">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-2 font-mono text-slate-700 text-center align-top whitespace-nowrap">
                        {row.date}
                      </td>
                      <td className="py-2.5 px-2 font-mono font-bold text-slate-900 text-center align-top whitespace-nowrap">
                        {row.referenceNumber}
                      </td>
                      <td className="py-2.5 px-2 align-top">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            row.type === 'invoice'
                              ? 'bg-blue-100 text-blue-900'
                              : row.type === 'receipt'
                              ? 'bg-emerald-100 text-emerald-900'
                              : row.type === 'payment'
                              ? 'bg-amber-100 text-amber-900'
                              : row.type === 'clearance'
                              ? 'bg-teal-100 text-teal-900'
                              : row.type === 'sales_return'
                              ? 'bg-rose-100 text-rose-900'
                              : 'bg-slate-200 text-slate-800'
                          }`}
                        >
                          {row.typeLabel || row.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 align-top">
                        {/* البيان الأساسي للحركة */}
                        <div className="font-semibold text-slate-900 leading-snug">
                          {row.description}
                        </div>

                        {/* تفاصيل بنود الفاتورة المفصلة بالكامل */}
                        {row.type === 'invoice' && row.items && row.items.length > 0 && showStatementItemDetails && (
                          <div className="mt-2 border border-slate-200 rounded-md overflow-hidden bg-slate-50/80 text-[11px]">
                            <table className="w-full text-right border-collapse">
                              <thead className="bg-slate-200/90 text-slate-800 text-[10px] font-black border-b border-slate-300">
                                <tr>
                                  <th className="p-1.5">الصنف</th>
                                  <th className="p-1.5">البيان</th>
                                  <th className="p-1.5 text-center">الطول</th>
                                  <th className="p-1.5 text-center">العرض</th>
                                  <th className="p-1.5 text-center">العدد</th>
                                  <th className="p-1.5 text-center">الكمية</th>
                                  <th className="p-1.5 text-left">السعر</th>
                                  <th className="p-1.5 text-left">الإجمالي</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200/70 bg-white">
                                {row.items.map((it, itemIdx) => (
                                  <tr key={it.itemId || itemIdx} className="hover:bg-blue-50/30">
                                    <td className="p-1.5 font-bold text-slate-900">
                                      {it.itemName}
                                      {it.itemCode && <span className="text-[9px] text-slate-400 mr-1 font-mono">({it.itemCode})</span>}
                                    </td>
                                    <td className="p-1.5 text-slate-700">
                                      {it.description || '-'}
                                      {it.notes && (
                                        <div className="text-[10px] text-amber-800 bg-amber-50 px-1 rounded inline-block mt-0.5">
                                          {it.notes}
                                        </div>
                                      )}
                                    </td>
                                    <td className="p-1.5 text-center font-mono">{it.length ?? '-'}</td>
                                    <td className="p-1.5 text-center font-mono">{it.width ?? '-'}</td>
                                    <td className="p-1.5 text-center font-mono font-bold text-slate-800">{it.count ?? '-'}</td>
                                    <td className="p-1.5 text-center font-mono font-bold text-blue-900">
                                      {it.quantity} {it.unit && <span className="text-[9px] font-sans text-slate-500">{it.unit}</span>}
                                    </td>
                                    <td className="p-1.5 text-left font-mono font-semibold text-slate-800">
                                      {it.unitPrice.toFixed(2)}
                                    </td>
                                    <td className="p-1.5 text-left font-mono font-bold text-slate-900">
                                      {it.total.toFixed(2)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot className="bg-slate-100/90 border-t border-slate-300 text-[10px] font-bold">
                                <tr>
                                  <td colSpan={4} className="p-1.5 text-slate-700">
                                    {row.subCustomerName && (
                                      <span className="text-blue-900 font-bold mr-2">
                                        الزبون الفرعي: {row.subCustomerName}
                                      </span>
                                    )}
                                    {row.invoiceNotes && (
                                      <span className="text-amber-900 font-medium">
                                        ملاحظات الفاتورة: {row.invoiceNotes}
                                      </span>
                                    )}
                                  </td>
                                  <td colSpan={2} className="p-1.5 text-left text-slate-600">
                                    {row.discountAmount && row.discountAmount > 0 ? (
                                      <span className="text-rose-700">الخصم: {row.discountAmount.toFixed(2)}</span>
                                    ) : null}
                                    {row.taxAmount && row.taxAmount > 0 ? (
                                      <span className="mr-2 text-slate-600">الضريبة: {row.taxAmount.toFixed(2)}</span>
                                    ) : null}
                                  </td>
                                  <td colSpan={2} className="p-1.5 text-left font-mono font-black text-blue-950">
                                    صافي الفاتورة: {row.debit.toFixed(2)} {settings.currency}
                                  </td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        )}

                        {/* تفاصيل سند القبض الكاملة مع الملاحظات */}
                        {row.type === 'receipt' && (
                          <div className="mt-1 p-2 bg-blue-50/70 border border-blue-200 rounded text-xs space-y-1">
                            <div className="flex items-center justify-between border-b border-blue-200 pb-1">
                              <div className="flex items-center gap-2 font-bold text-blue-900">
                                <span className="bg-blue-700 text-white px-2 py-0.5 rounded text-[10px]">سند قبض نقدية</span>
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
                      <td className="py-2.5 px-2 font-mono font-bold text-rose-700 text-left align-top">
                        {row.debit > 0 ? row.debit.toFixed(2) : '-'}
                      </td>
                      <td className="py-2.5 px-2 font-mono font-bold text-emerald-700 text-left align-top">
                        {row.credit > 0 ? row.credit.toFixed(2) : '-'}
                      </td>
                      <td className="py-2.5 px-2 font-mono font-black text-slate-900 text-left bg-slate-50/70 align-top">
                        {row.runningBalance.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                <tr>
                  <td colSpan={5} className="py-2.5 px-3 text-left font-sans">الإجمالي العام للحركات بالفترة:</td>
                  <td className="py-2.5 px-2 text-left font-mono text-rose-800 font-black">
                    {customerStatementData.totalDebit.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-2 text-left font-mono text-emerald-800 font-black">
                    {customerStatementData.totalCredit.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-2 text-left font-mono text-slate-900 font-black bg-slate-200/80">
                    {customerStatementData.balance.toFixed(2)} {settings.currency}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* 4. ملخص نهاية الكشف بعد الجدول حسب طلب المستخدم الدقيق: */}
          {/* إجمالي مدين الفترة :وهو الرصيد للفترة فقط المحددة -- إجمالي دائن الفترة -- الإجمالي لتاريخ الكشف */}
          <div className="mt-4 p-3.5 bg-slate-50 border-2 border-slate-800 rounded-xl space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* 1. إجمالي مدين الفترة */}
              <div className="p-3 bg-white border-2 border-rose-300 rounded-lg shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-900">إجمالي مدين الفترة:</span>
                  <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-bold">
                    سحوبات وفواتير
                  </span>
                </div>
                <div className="my-2 text-center">
                  <div className="text-2xl font-black font-mono text-rose-700">
                    {customerStatementData.totalDebit.toFixed(2)} <span className="text-sm font-sans">{settings.currency}</span>
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
                    مقبوضات وتحصيلات
                  </span>
                </div>
                <div className="my-2 text-center">
                  <div className="text-2xl font-black font-mono text-emerald-700">
                    {customerStatementData.totalCredit.toFixed(2)} <span className="text-sm font-sans">{settings.currency}</span>
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 text-center border-t border-slate-100 pt-1 font-medium">
                  (إجمالي المقبوضات والحركات الدائنة للفترة)
                </div>
              </div>

              {/* 3. الإجمالي لتاريخ الكشف */}
              <div className={`p-3 bg-white border-2 rounded-lg shadow-xs flex flex-col justify-between ${
                customerStatementData.balance > 0
                  ? 'border-amber-400 bg-amber-50/20'
                  : customerStatementData.balance < 0
                  ? 'border-blue-400 bg-blue-50/20'
                  : 'border-slate-300'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">الإجمالي لتاريخ الكشف:</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                    customerStatementData.balance > 0
                      ? 'bg-amber-100 text-amber-900'
                      : customerStatementData.balance < 0
                      ? 'bg-blue-100 text-blue-900'
                      : 'bg-slate-100 text-slate-800'
                  }`}>
                    {customerStatementData.balance > 0
                      ? 'رصيد مدين مستحق على العميل'
                      : customerStatementData.balance < 0
                      ? 'رصيد دائن مسدد مقدماً من العميل'
                      : 'حساب متزن ومسدد بالكامل'}
                  </span>
                </div>
                <div className="my-2 text-center">
                  <div className={`text-2xl font-black font-mono ${
                    customerStatementData.balance > 0
                      ? 'text-amber-800'
                      : customerStatementData.balance < 0
                      ? 'text-blue-800'
                      : 'text-slate-700'
                  }`}>
                    {Math.abs(customerStatementData.balance).toFixed(2)} <span className="text-sm font-sans">{settings.currency}</span>
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 text-center border-t border-slate-100 pt-1 font-medium">
                  (الرصيد الصافي التراكمي حتى تاريخ اليوم)
                </div>
              </div>
            </div>

            {/* كتابة المبلغ وتفقيطه */}
            <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs flex items-center gap-2">
              <span className="font-bold text-slate-700 shrink-0">المبلغ كتابة وتفقيطاً:</span>
              <span className="font-semibold text-slate-900 bg-slate-50 px-2 py-1 rounded border border-slate-200 flex-1">
                {tafqeetArabic(Math.abs(customerStatementData.balance), settings.currency)}
              </span>
            </div>

            {/* التوقيعات والاعتمادات الرسمية */}
            <div className="grid grid-cols-3 gap-4 pt-3 border-t border-slate-300 text-center text-xs">
              <div>
                <div className="font-bold text-slate-800 mb-6">إعداد وتدقيق الحسابات</div>
                <div className="border-t border-dashed border-slate-400 pt-1 text-[11px] text-slate-500">التوقيع / التاريخ</div>
              </div>
              <div>
                <div className="font-bold text-slate-800 mb-6">اعتماد الإدارة المالية</div>
                <div className="border-t border-dashed border-slate-400 pt-1 text-[11px] text-slate-500">الختم والاعتماد</div>
              </div>
              <div>
                <div className="font-bold text-slate-800 mb-6">توقيع وإقرار العميل بالمطابقة</div>
                <div className="border-t border-dashed border-slate-400 pt-1 text-[11px] text-slate-500">التوقيع والاستلام</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. كشف حساب الأصناف للعميل (تجميع الأصناف المتشابهة للفترة) */}
      {/* ========================================================================= */}
      {activeReport === 'customer_items' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded">تقرير مبيعات الأصناف التراكمي</span>
              <h2 className="text-base font-bold text-slate-900 mt-1">
                كشف الأصناف المسحوبة للعميل: {customerItemsData.party?.name}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                تجميع كميات وقيم الأصناف ومواد الطباعة المسحوبة من قبل العميل للفترة المحددة
              </p>
            </div>

            <div className="text-left">
              <span className="text-[11px] text-slate-400 block">إجمالي قيمة المشتريات:</span>
              <strong className="text-xl font-mono font-bold text-indigo-600">
                {customerItemsData.totalAmount.toLocaleString('ar-SA')} {settings.currency}
              </strong>
              <span className="text-[10px] text-slate-400 block font-mono">
                إجمالي الوحدات: {customerItemsData.totalQuantity.toLocaleString('ar-SA')}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b">
                <tr>
                  <th className="p-2.5">كود الصنف</th>
                  <th className="p-2.5">اسم الصنف / المطبوع</th>
                  <th className="p-2.5">التصنيف</th>
                  <th className="p-2.5">الوحدة</th>
                  <th className="p-2.5">إجمالي الكمية المسحوبة</th>
                  <th className="p-2.5">متوسط سعر البيع</th>
                  <th className="p-2.5">إجمالي القيمة</th>
                  <th className="p-2.5">آخر تاريخ سحب</th>
                  <th className="p-2.5">عدد الفواتير</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {customerItemsData.items.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-6 text-center text-slate-400">لا توجد مسحوبات أصناف لهذا العميل خلال الفترة</td>
                  </tr>
                ) : (
                  customerItemsData.items.map(item => {
                    const avgPrice = item.totalQuantity > 0 ? item.totalAmount / item.totalQuantity : 0;
                    return (
                      <tr key={item.itemId} className="hover:bg-slate-50">
                        <td className="p-2.5 font-mono text-slate-500">{item.itemCode}</td>
                        <td className="p-2.5">
                          <div className="font-bold text-slate-900">{item.itemName}</div>
                          {/* ملاحظات البيان والصنف تظهر تحت اسم الصنف */}
                          {(item.description || item.notes) && (
                            <div className="mt-0.5 space-y-0.5 text-[10px]">
                              {item.description && (
                                <div className="text-slate-600 font-medium">
                                  <span className="font-bold text-slate-700">البيان:</span> {item.description}
                                </div>
                              )}
                              {item.notes && (
                                <div className="text-amber-900 bg-amber-50 border border-amber-200/70 rounded px-1.5 py-0.5 inline-flex items-center gap-1 font-medium">
                                  <span className="font-bold text-amber-800">ملاحظة الصنف:</span>
                                  <span>{item.notes}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="p-2.5 text-slate-600">{item.category}</td>
                        <td className="p-2.5 text-slate-500">{item.unit}</td>
                        <td className="p-2.5 font-mono font-bold text-indigo-700 text-sm">
                          {item.totalQuantity.toLocaleString('ar-SA')}
                        </td>
                        <td className="p-2.5 font-mono text-slate-700">
                          {avgPrice.toLocaleString('ar-SA', { maximumFractionDigits: 2 })} {settings.currency}
                        </td>
                        <td className="p-2.5 font-mono font-bold text-slate-900 text-sm">
                          {item.totalAmount.toLocaleString('ar-SA')} {settings.currency}
                        </td>
                        <td className="p-2.5 font-mono text-slate-500">{item.lastDate}</td>
                        <td className="p-2.5 font-mono text-blue-600 font-semibold">{item.invoiceCount}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot className="bg-slate-100/70 font-bold border-t border-slate-200">
                <tr>
                  <td colSpan={4} className="p-2.5 text-slate-800">الإجمالي العام:</td>
                  <td className="p-2.5 font-mono text-indigo-700 font-black">{customerItemsData.totalQuantity.toLocaleString('ar-SA')}</td>
                  <td></td>
                  <td className="p-2.5 font-mono text-slate-900 font-black">{customerItemsData.totalAmount.toLocaleString('ar-SA')} {settings.currency}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. كشف حساب تفصيلي مورد */}
      {/* ========================================================================= */}
      {activeReport === 'supplier_statement' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4 print:p-0 print:border-0 print:shadow-none">
          {/* 1. ترويسة كشف الحساب حسب إعدادات البرنامج */}
          <div className="border-b-2 border-slate-800 pb-3 flex items-start justify-between">
            <div>
              <h1 className="text-xl font-black text-slate-900">{settings.name || 'مؤسسة الدعاية والإعلان'}</h1>
              <div className="text-xs text-slate-600 mt-0.5 space-x-2 space-x-reverse">
                {settings.commercialRegister && <span>س.ت: <strong className="font-mono">{settings.commercialRegister}</strong></span>}
                {settings.taxNumber && <span> | الرقم الضريبي: <strong className="font-mono">{settings.taxNumber}</strong></span>}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {settings.address && <span>{settings.address}</span>}
                {settings.phone && <span> | هاتف: <span className="font-mono">{settings.phone}</span></span>}
              </div>
            </div>
            <div className="text-center">
              <div className="inline-block bg-slate-900 text-white px-4 py-1 rounded-md text-base font-black shadow-xs">
                كشف حساب مورد تفصيلي معتمد
              </div>
              <div className="text-[11px] text-slate-500 font-mono mt-1">
                تاريخ الاستخراج: {new Date().toISOString().split('T')[0]}
              </div>
            </div>
            {settings.logo ? (
              <img src={settings.logo} alt="Logo" className="w-16 h-16 object-contain" />
            ) : (
              <div className="w-16 h-16 bg-slate-100 border border-slate-300 rounded flex items-center justify-center text-[10px] text-slate-400 font-bold">
                شعار المنشأة
              </div>
            )}
          </div>

          {/* 2. بيانات المورد والفترة */}
          <div className="bg-slate-50 border border-slate-300 rounded-lg p-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <div className="text-sm font-black text-slate-900 flex items-center gap-1.5 flex-wrap">
                <span>اسم المورد:</span>
                <span className="text-amber-900 font-extrabold">{supplierStatementData.party?.name || 'غير محدد'}</span>
                {selectedSubSuppObj && (
                  <span className="text-amber-700 bg-amber-100 px-2 py-0.5 rounded text-xs font-bold">
                    / الفرع: {selectedSubSuppObj.name}
                  </span>
                )}
              </div>
              <div className="text-slate-600">
                <span>كود الحساب: </span>
                <strong className="font-mono text-slate-900">{supplierStatementData.party?.code || '-'}</strong>
                {supplierStatementData.party?.phone && (
                  <span className="mr-3">
                    الهاتف: <strong className="font-mono text-slate-800">{supplierStatementData.party.phone}</strong>
                  </span>
                )}
              </div>
            </div>
            <div className="space-y-1 sm:text-left">
              <div className="font-bold text-slate-800">
                الفترة من: <span className="font-mono text-amber-950">{fromDate || 'بداية التعامل'}</span> إلى: <span className="font-mono text-amber-950">{toDate || 'تاريخ اليوم'}</span>
              </div>
              <div className="text-slate-600">
                العملة: <strong className="text-slate-900 font-bold">{settings.currency}</strong>
              </div>
            </div>
          </div>

          {/* شريط أدوات الكشف (عرض/إخفاء بنود الفواتير) */}
          <div className="flex items-center justify-between print:hidden bg-slate-50 p-2 rounded-lg border border-slate-200 text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowStatementItemDetails(prev => !prev)}
                className={`px-3 py-1.5 rounded font-bold cursor-pointer transition-colors flex items-center gap-1 ${
                  showStatementItemDetails
                    ? 'bg-amber-700 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                }`}
              >
                <span>{showStatementItemDetails ? 'إخفاء تفاصيل بنود الفواتير' : 'إظهار تفاصيل بنود الفواتير والمقاسات'}</span>
              </button>
              <span className="text-[11px] text-slate-500">
                (الصنف، البيان، الطول، العرض، العدد، الكمية، السعر)
              </span>
            </div>
            <div className="text-[11px] text-slate-500">
              عدد الحركات: <strong className="font-mono text-slate-900">{supplierStatementData.rows.length}</strong>
            </div>
          </div>

          {/* 3. جدول الحركات المالي المفصل للمورد */}
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs border-collapse border border-slate-300">
              <thead className="bg-slate-800 text-white text-[11px]">
                <tr>
                  <th className="py-2 px-1.5 border border-slate-700 text-center w-8">م</th>
                  <th className="py-2 px-2 border border-slate-700 text-center w-24">التاريخ</th>
                  <th className="py-2 px-2 border border-slate-700 text-center w-24">رقم الحركة</th>
                  <th className="py-2 px-2 border border-slate-700 w-28">نوع العملية</th>
                  <th className="py-2 px-2 border border-slate-700">البيان والشرح والتفاصيل الكاملة</th>
                  <th className="py-2 px-2 border border-slate-700 text-left w-24">مدين (سداد له)</th>
                  <th className="py-2 px-2 border border-slate-700 text-left w-24">دائن (توريد منه)</th>
                  <th className="py-2 px-2 border border-slate-700 text-left w-28">الرصيد المستحق</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {supplierStatementData.rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400 font-bold">
                      لا توجد حركات مالية مسجلة للمورد خلال الفترة المحددة
                    </td>
                  </tr>
                ) : (
                  supplierStatementData.rows.map((row: StatementRow, idx: number) => (
                    <tr
                      key={row.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        row.type === 'opening'
                          ? 'bg-slate-100/90 font-bold'
                          : idx % 2 === 1
                          ? 'bg-slate-50/40'
                          : 'bg-white'
                      }`}
                    >
                      <td className="py-2.5 px-1.5 text-center text-slate-500 font-mono text-[11px] align-top">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-2 font-mono text-slate-700 text-center align-top whitespace-nowrap">
                        {row.date}
                      </td>
                      <td className="py-2.5 px-2 font-mono font-bold text-slate-900 text-center align-top whitespace-nowrap">
                        {row.referenceNumber}
                      </td>
                      <td className="py-2.5 px-2 align-top">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            row.type === 'purchase'
                              ? 'bg-amber-100 text-amber-900'
                              : row.type === 'payment'
                              ? 'bg-emerald-100 text-emerald-900'
                              : row.type === 'receipt'
                              ? 'bg-blue-100 text-blue-900'
                              : row.type === 'clearance'
                              ? 'bg-teal-100 text-teal-900'
                              : row.type === 'purchase_return'
                              ? 'bg-rose-100 text-rose-900'
                              : 'bg-slate-200 text-slate-800'
                          }`}
                        >
                          {row.typeLabel || row.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 align-top">
                        <div className="font-semibold text-slate-900 leading-snug">
                          {row.description}
                        </div>

                        {/* تفاصيل بنود فاتورة المشتريات */}
                        {row.type === 'purchase' && row.items && row.items.length > 0 && showStatementItemDetails && (
                          <div className="mt-2 border border-slate-200 rounded-md overflow-hidden bg-slate-50/80 text-[11px]">
                            <table className="w-full text-right border-collapse">
                              <thead className="bg-slate-200/90 text-slate-800 text-[10px] font-black border-b border-slate-300">
                                <tr>
                                  <th className="p-1.5">الصنف</th>
                                  <th className="p-1.5">البيان</th>
                                  <th className="p-1.5 text-center">الطول</th>
                                  <th className="p-1.5 text-center">العرض</th>
                                  <th className="p-1.5 text-center">العدد</th>
                                  <th className="p-1.5 text-center">الكمية</th>
                                  <th className="p-1.5 text-left">السعر</th>
                                  <th className="p-1.5 text-left">الإجمالي</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200/70 bg-white">
                                {row.items.map((it, itemIdx) => (
                                  <tr key={it.itemId || itemIdx} className="hover:bg-amber-50/30">
                                    <td className="p-1.5 font-bold text-slate-900">
                                      {it.itemName}
                                      {it.itemCode && <span className="text-[9px] text-slate-400 mr-1 font-mono">({it.itemCode})</span>}
                                    </td>
                                    <td className="p-1.5 text-slate-700">
                                      {it.description || '-'}
                                      {it.notes && (
                                        <div className="text-[10px] text-amber-800 bg-amber-50 px-1 rounded inline-block mt-0.5">
                                          {it.notes}
                                        </div>
                                      )}
                                    </td>
                                    <td className="p-1.5 text-center font-mono">{it.length ?? '-'}</td>
                                    <td className="p-1.5 text-center font-mono">{it.width ?? '-'}</td>
                                    <td className="p-1.5 text-center font-mono font-bold text-slate-800">{it.count ?? '-'}</td>
                                    <td className="p-1.5 text-center font-mono font-bold text-amber-900">
                                      {it.quantity} {it.unit && <span className="text-[9px] font-sans text-slate-500">{it.unit}</span>}
                                    </td>
                                    <td className="p-1.5 text-left font-mono font-semibold text-slate-800">
                                      {it.unitPrice.toFixed(2)}
                                    </td>
                                    <td className="p-1.5 text-left font-mono font-bold text-slate-900">
                                      {it.total.toFixed(2)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot className="bg-slate-100/90 border-t border-slate-300 text-[10px] font-bold">
                                <tr>
                                  <td colSpan={4} className="p-1.5 text-slate-700">
                                    {row.invoiceNotes && (
                                      <span className="text-amber-900 font-medium">
                                        ملاحظات الفاتورة: {row.invoiceNotes}
                                      </span>
                                    )}
                                  </td>
                                  <td colSpan={2} className="p-1.5 text-left text-slate-600">
                                    {row.discountAmount && row.discountAmount > 0 ? (
                                      <span className="text-rose-700">الخصم: {row.discountAmount.toFixed(2)}</span>
                                    ) : null}
                                    {row.taxAmount && row.taxAmount > 0 ? (
                                      <span className="mr-2 text-slate-600">الضريبة: {row.taxAmount.toFixed(2)}</span>
                                    ) : null}
                                  </td>
                                  <td colSpan={2} className="p-1.5 text-left font-mono font-black text-amber-950">
                                    صافي الفاتورة: {row.credit.toFixed(2)} {settings.currency}
                                  </td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        )}

                        {/* تفاصيل سند الصرف للمورد */}
                        {row.type === 'payment' && (
                          <div className="mt-1 p-2 bg-emerald-50/70 border border-emerald-200 rounded text-xs space-y-1">
                            <div className="flex items-center justify-between border-b border-emerald-200 pb-1">
                              <div className="flex items-center gap-2 font-bold text-emerald-900">
                                <span className="bg-emerald-700 text-white px-2 py-0.5 rounded text-[10px]">سند صرف وسداد</span>
                                <span>رقم السند: <strong className="font-mono">{row.referenceNumber}</strong></span>
                              </div>
                              <div className="font-mono font-bold text-emerald-950 text-xs">
                                المبلغ المسدد للمورد: <span className="text-emerald-700 font-black text-sm">{row.debit.toFixed(2)}</span> {settings.currency}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] pt-0.5">
                              <div>
                                <span className="text-slate-500">طريقة السداد: </span>
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
                                  <span className="text-slate-500">الخزينة المنصرف منها: </span>
                                  <span className="font-mono text-slate-800">{row.accountCode}</span>
                                </div>
                              )}
                            </div>
                            {(row.voucherNotes || row.description) && (
                              <div className="mt-1 pt-1 border-t border-emerald-200/80 flex items-start gap-1.5 text-[11px]">
                                <span className="font-bold text-emerald-900 shrink-0">📝 البيان والملاحظات:</span>
                                <span className="text-slate-900 font-medium">{row.voucherNotes || row.description}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* تفاصيل المقاصة للمورد */}
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
                                مبلغ المقاصة: <span className="font-black text-teal-800 text-sm">{(row.debit || row.credit).toFixed(2)}</span> {settings.currency}
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

                        {/* أي عملية أخرى */}
                        {row.type !== 'purchase' && row.type !== 'payment' && row.type !== 'clearance' && row.voucherNotes && (
                          <div className="mt-1 text-[11px] text-slate-700 bg-slate-100 p-1.5 rounded border border-slate-200">
                            <span className="font-bold text-slate-800">ملاحظات وتفاصيل العملية: </span>
                            <span>{row.voucherNotes}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-2 font-mono font-bold text-emerald-700 text-left align-top">
                        {row.debit > 0 ? row.debit.toFixed(2) : '-'}
                      </td>
                      <td className="py-2.5 px-2 font-mono font-bold text-rose-700 text-left align-top">
                        {row.credit > 0 ? row.credit.toFixed(2) : '-'}
                      </td>
                      <td className="py-2.5 px-2 font-mono font-black text-slate-900 text-left bg-slate-50/70 align-top">
                        {row.runningBalance.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                <tr>
                  <td colSpan={5} className="py-2.5 px-3 text-left font-sans">الإجمالي العام للحركات بالفترة:</td>
                  <td className="py-2.5 px-2 text-left font-mono text-emerald-800 font-black">
                    {supplierStatementData.totalDebit.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-2 text-left font-mono text-rose-800 font-black">
                    {supplierStatementData.totalCredit.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-2 text-left font-mono text-slate-900 font-black bg-slate-200/80">
                    {supplierStatementData.balance.toFixed(2)} {settings.currency}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* 4. ملخص نهاية الكشف بعد الجدول حسب طلب المستخدم */}
          <div className="mt-4 p-3.5 bg-slate-50 border-2 border-slate-800 rounded-xl space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* 1. إجمالي مدين الفترة */}
              <div className="p-3 bg-white border-2 border-emerald-300 rounded-lg shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900">إجمالي مدين الفترة:</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                    سدادات ومدفوعات له
                  </span>
                </div>
                <div className="my-2 text-center">
                  <div className="text-2xl font-black font-mono text-emerald-700">
                    {supplierStatementData.totalDebit.toFixed(2)} <span className="text-sm font-sans">{settings.currency}</span>
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 text-center border-t border-slate-100 pt-1 font-medium">
                  (وهو الرصيد للفترة فقط المحددة)
                </div>
              </div>

              {/* 2. إجمالي دائن الفترة */}
              <div className="p-3 bg-white border-2 border-rose-300 rounded-lg shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-900">إجمالي دائن الفترة:</span>
                  <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-bold">
                    فواتير وتوريدات
                  </span>
                </div>
                <div className="my-2 text-center">
                  <div className="text-2xl font-black font-mono text-rose-700">
                    {supplierStatementData.totalCredit.toFixed(2)} <span className="text-sm font-sans">{settings.currency}</span>
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 text-center border-t border-slate-100 pt-1 font-medium">
                  (إجمالي التوريدات والمشتريات الدائنة للفترة)
                </div>
              </div>

              {/* 3. الإجمالي لتاريخ الكشف */}
              <div className={`p-3 bg-white border-2 rounded-lg shadow-xs flex flex-col justify-between ${
                supplierStatementData.balance > 0
                  ? 'border-rose-400 bg-rose-50/20'
                  : supplierStatementData.balance < 0
                  ? 'border-emerald-400 bg-emerald-50/20'
                  : 'border-slate-300'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">الإجمالي لتاريخ الكشف:</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                    supplierStatementData.balance > 0
                      ? 'bg-rose-100 text-rose-900'
                      : supplierStatementData.balance < 0
                      ? 'bg-emerald-100 text-emerald-900'
                      : 'bg-slate-100 text-slate-800'
                  }`}>
                    {supplierStatementData.balance > 0
                      ? 'رصيد مستحق للمورد في ذمة الشركة'
                      : supplierStatementData.balance < 0
                      ? 'رصيد مدفوع للمورد مقدماً'
                      : 'حساب متزن ومسدد بالكامل'}
                  </span>
                </div>
                <div className="my-2 text-center">
                  <div className={`text-2xl font-black font-mono ${
                    supplierStatementData.balance > 0
                      ? 'text-rose-800'
                      : supplierStatementData.balance < 0
                      ? 'text-emerald-800'
                      : 'text-slate-700'
                  }`}>
                    {Math.abs(supplierStatementData.balance).toFixed(2)} <span className="text-sm font-sans">{settings.currency}</span>
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 text-center border-t border-slate-100 pt-1 font-medium">
                  (صافي الرصيد المستحق حتى تاريخ اليوم)
                </div>
              </div>
            </div>

            {/* كتابة المبلغ وتفقيطه */}
            <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs flex items-center gap-2">
              <span className="font-bold text-slate-700 shrink-0">المبلغ كتابة وتفقيطاً:</span>
              <span className="font-semibold text-slate-900 bg-slate-50 px-2 py-1 rounded border border-slate-200 flex-1">
                {tafqeetArabic(Math.abs(supplierStatementData.balance), settings.currency)}
              </span>
            </div>

            {/* التوقيعات الرسمية */}
            <div className="grid grid-cols-3 gap-4 pt-3 border-t border-slate-300 text-center text-xs">
              <div>
                <div className="font-bold text-slate-800 mb-6">إعداد وتدقيق الحسابات</div>
                <div className="border-t border-dashed border-slate-400 pt-1 text-[11px] text-slate-500">التوقيع / التاريخ</div>
              </div>
              <div>
                <div className="font-bold text-slate-800 mb-6">اعتماد الإدارة المالية</div>
                <div className="border-t border-dashed border-slate-400 pt-1 text-[11px] text-slate-500">الختم والاعتماد</div>
              </div>
              <div>
                <div className="font-bold text-slate-800 mb-6">توقيع وإقرار المورد بالمطابقة</div>
                <div className="border-t border-dashed border-slate-400 pt-1 text-[11px] text-slate-500">التوقيع والاستلام</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. كشف حساب الأصناف للمورد (تجميع الأصناف المتشابهة للفترة) */}
      {/* ========================================================================= */}
      {activeReport === 'supplier_items' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded">تقرير خامات ومشتريات المورد التراكمي</span>
              <h2 className="text-base font-bold text-slate-900 mt-1">
                كشف الخامات الموردة من: {supplierItemsData.party?.name}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                تجميع الخامات ومستلزمات الإنتاج وألواح الورق الموردة من هذا المورد خلال الفترة المحددة
              </p>
            </div>

            <div className="text-left">
              <span className="text-[11px] text-slate-400 block">إجمالي قيمة التوريدات:</span>
              <strong className="text-xl font-mono font-bold text-amber-700">
                {supplierItemsData.totalAmount.toLocaleString('ar-SA')} {settings.currency}
              </strong>
              <span className="text-[10px] text-slate-400 block font-mono">
                إجمالي الكميات: {supplierItemsData.totalQuantity.toLocaleString('ar-SA')}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b">
                <tr>
                  <th className="p-2.5">اسم الخامة / الصنف</th>
                  <th className="p-2.5">إجمالي الكمية الموردة</th>
                  <th className="p-2.5">متوسط سعر التكلفة للوحدة</th>
                  <th className="p-2.5">إجمالي القيمة</th>
                  <th className="p-2.5">آخر تاريخ توريد</th>
                  <th className="p-2.5">عدد فواتير الشراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {supplierItemsData.items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-400">لا توجد توريدات أصناف من هذا المورد خلال الفترة</td>
                  </tr>
                ) : (
                  supplierItemsData.items.map(item => {
                    const avgCost = item.totalQuantity > 0 ? item.totalAmount / item.totalQuantity : 0;
                    return (
                      <tr key={item.itemId} className="hover:bg-slate-50">
                        <td className="p-2.5">
                          <div className="font-bold text-slate-900">{item.itemName}</div>
                          {/* ملاحظات البيان والصنف تظهر تحت اسم الصنف */}
                          {(item.description || item.notes) && (
                            <div className="mt-0.5 space-y-0.5 text-[10px]">
                              {item.description && (
                                <div className="text-slate-600 font-medium">
                                  <span className="font-bold text-slate-700">البيان:</span> {item.description}
                                </div>
                              )}
                              {item.notes && (
                                <div className="text-amber-900 bg-amber-50 border border-amber-200/70 rounded px-1.5 py-0.5 inline-flex items-center gap-1 font-medium">
                                  <span className="font-bold text-amber-800">ملاحظة الصنف:</span>
                                  <span>{item.notes}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="p-2.5 font-mono font-bold text-amber-700 text-sm">
                          {item.totalQuantity.toLocaleString('ar-SA')}
                        </td>
                        <td className="p-2.5 font-mono text-slate-700">
                          {avgCost.toLocaleString('ar-SA', { maximumFractionDigits: 2 })} {settings.currency}
                        </td>
                        <td className="p-2.5 font-mono font-bold text-slate-900 text-sm">
                          {item.totalAmount.toLocaleString('ar-SA')} {settings.currency}
                        </td>
                        <td className="p-2.5 font-mono text-slate-500">{item.lastDate}</td>
                        <td className="p-2.5 font-mono text-amber-600 font-semibold">{item.invoiceCount}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot className="bg-slate-100/70 font-bold border-t border-slate-200">
                <tr>
                  <td className="p-2.5 text-slate-800">الإجمالي العام:</td>
                  <td className="p-2.5 font-mono text-amber-700 font-black">{supplierItemsData.totalQuantity.toLocaleString('ar-SA')}</td>
                  <td></td>
                  <td className="p-2.5 font-mono text-slate-900 font-black">{supplierItemsData.totalAmount.toLocaleString('ar-SA')} {settings.currency}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. كشف تفصيلي سندات القبض */}
      {/* ========================================================================= */}
      {activeReport === 'receipt_vouchers' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">تقرير التحصيلات والمقبوضات</span>
              <h2 className="text-base font-bold text-slate-900 mt-1">كشف تفصيلي لسندات القبض</h2>
              <p className="text-xs text-slate-500 mt-0.5">سجل كافة المبالغ المقبوضة من العملاء وجهات التحصيل المختلفة</p>
            </div>

            <div className="text-left">
              <span className="text-[11px] text-slate-400 block">إجمالي المقبوضات:</span>
              <strong className="text-xl font-mono font-bold text-emerald-600">
                {receiptVouchersData.reduce((s, v) => s + v.amount, 0).toLocaleString('ar-SA')} {settings.currency}
              </strong>
              <span className="text-[10px] text-slate-400 block">عدد السندات: {receiptVouchersData.length}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b">
                <tr>
                  <th className="p-2.5">رقم السند</th>
                  <th className="p-2.5">التاريخ</th>
                  <th className="p-2.5">اسم العميل / المستلم منه</th>
                  <th className="p-2.5">البيان والشرح</th>
                  <th className="p-2.5">طريقة القبض</th>
                  <th className="p-2.5">الخزينة المودع بها</th>
                  <th className="p-2.5">المبلغ المقبوض</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {receiptVouchersData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-400">لا توجد سندات قبض مطابقة</td>
                  </tr>
                ) : (
                  receiptVouchersData.map(v => (
                    <tr key={v.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-mono font-bold text-emerald-700">{v.voucherNumber}</td>
                      <td className="p-2.5 font-mono text-slate-600">{v.date}</td>
                      <td className="p-2.5 font-semibold text-slate-900">{v.partyName}</td>
                      <td className="p-2.5 text-slate-600 max-w-[240px] truncate">{v.description}</td>
                      <td className="p-2.5">
                        <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded text-[11px] font-medium">
                          {v.paymentMethod === 'cash' ? 'نقداً' : v.paymentMethod === 'bank_transfer' ? 'تحويل بنكي' : 'شيك'}
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-600 font-medium">
                        {treasuries.find(t => t.accountCode === v.accountCode || t.accountCode === v.treasuryAccountCode)?.name || 'الخزينة'}
                      </td>
                      <td className="p-2.5 font-mono font-bold text-emerald-700 text-sm">
                        {v.amount.toLocaleString('ar-SA')} {settings.currency}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. كشف تفصيلي سندات الصرف */}
      {/* ========================================================================= */}
      {activeReport === 'payment_vouchers' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <span className="text-[10px] text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded">تقرير المدفوعات والمنصرفات</span>
              <h2 className="text-base font-bold text-slate-900 mt-1">كشف تفصيلي لسندات الصرف</h2>
              <p className="text-xs text-slate-500 mt-0.5">سجل المبالغ المسددة للموردين والمصروفات والعهد النقدية والبنكية</p>
            </div>

            <div className="text-left">
              <span className="text-[11px] text-slate-400 block">إجمالي المنصرفات:</span>
              <strong className="text-xl font-mono font-bold text-rose-600">
                {paymentVouchersData.reduce((s, v) => s + v.amount, 0).toLocaleString('ar-SA')} {settings.currency}
              </strong>
              <span className="text-[10px] text-slate-400 block">عدد السندات: {paymentVouchersData.length}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b">
                <tr>
                  <th className="p-2.5">رقم السند</th>
                  <th className="p-2.5">التاريخ</th>
                  <th className="p-2.5">المستفيد / المورد</th>
                  <th className="p-2.5">البيان والشرح</th>
                  <th className="p-2.5">طريقة الصرف</th>
                  <th className="p-2.5">الخزينة المنصرف منها</th>
                  <th className="p-2.5">المبلغ المصروف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paymentVouchersData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-400">لا توجد سندات صرف مطابقة</td>
                  </tr>
                ) : (
                  paymentVouchersData.map(v => (
                    <tr key={v.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-mono font-bold text-rose-700">{v.voucherNumber}</td>
                      <td className="p-2.5 font-mono text-slate-600">{v.date}</td>
                      <td className="p-2.5 font-semibold text-slate-900">{v.partyName}</td>
                      <td className="p-2.5 text-slate-600 max-w-[240px] truncate">{v.description}</td>
                      <td className="p-2.5">
                        <span className="bg-rose-50 text-rose-800 px-2 py-0.5 rounded text-[11px] font-medium">
                          {v.paymentMethod === 'cash' ? 'نقداً' : v.paymentMethod === 'bank_transfer' ? 'تحويل بنكي' : 'شيك'}
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-600 font-medium">
                        {treasuries.find(t => t.accountCode === v.accountCode || t.accountCode === v.treasuryAccountCode)?.name || 'الخزينة'}
                      </td>
                      <td className="p-2.5 font-mono font-bold text-rose-700 text-sm">
                        {v.amount.toLocaleString('ar-SA')} {settings.currency}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. كشف حساب تفصيلي موظف */}
      {/* ========================================================================= */}
      {activeReport === 'employee_statement' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4 print:p-0 print:border-0 print:shadow-none">
          {/* 1. ترويسة كشف الحساب حسب إعدادات البرنامج */}
          <div className="border-b-2 border-slate-800 pb-3 flex items-start justify-between">
            <div>
              <h1 className="text-xl font-black text-slate-900">{settings.name || 'مؤسسة الدعاية والإعلان'}</h1>
              <div className="text-xs text-slate-600 mt-0.5 space-x-2 space-x-reverse">
                {settings.commercialRegister && <span>س.ت: <strong className="font-mono">{settings.commercialRegister}</strong></span>}
                {settings.taxNumber && <span> | الرقم الضريبي: <strong className="font-mono">{settings.taxNumber}</strong></span>}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {settings.address && <span>{settings.address}</span>}
                {settings.phone && <span> | هاتف: <span className="font-mono">{settings.phone}</span></span>}
              </div>
            </div>
            <div className="text-center">
              <div className="inline-block bg-slate-900 text-white px-4 py-1 rounded-md text-base font-black shadow-xs">
                كشف حساب ومستحقات موظف
              </div>
              <div className="text-[11px] text-slate-500 font-mono mt-1">
                تاريخ الاستخراج: {new Date().toISOString().split('T')[0]}
              </div>
            </div>
            {settings.logo ? (
              <img src={settings.logo} alt="Logo" className="w-16 h-16 object-contain" />
            ) : (
              <div className="w-16 h-16 bg-slate-100 border border-slate-300 rounded flex items-center justify-center text-[10px] text-slate-400 font-bold">
                شعار المنشأة
              </div>
            )}
          </div>

          {/* 2. بيانات الموظف والفترة */}
          <div className="bg-slate-50 border border-slate-300 rounded-lg p-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <div className="text-sm font-black text-slate-900 flex items-center gap-1.5 flex-wrap">
                <span>اسم الموظف:</span>
                <span className="text-purple-900 font-extrabold">{employeeStatementData.employee?.name || 'غير محدد'}</span>
              </div>
              <div className="text-slate-600">
                <span>المسمى الوظيفي: </span>
                <strong className="text-slate-900">{employeeStatementData.employee?.jobTitle || '-'}</strong>
                <span className="mr-3">
                  الراتب الأساسي: <strong className="font-mono text-slate-900">{employeeStatementData.employee?.salary.toLocaleString('ar-SA')} {settings.currency}</strong>
                </span>
              </div>
            </div>
            <div className="space-y-1 sm:text-left">
              <div className="font-bold text-slate-800">
                الفترة من: <span className="font-mono text-purple-950">{fromDate || 'بداية التعيين'}</span> إلى: <span className="font-mono text-purple-950">{toDate || 'تاريخ اليوم'}</span>
              </div>
              <div className="text-slate-600">
                العملة: <strong className="text-slate-900 font-bold">{settings.currency}</strong>
              </div>
            </div>
          </div>

          {/* 3. جدول الحركات المالي المفصل للموظف */}
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs border-collapse border border-slate-300">
              <thead className="bg-slate-800 text-white text-[11px]">
                <tr>
                  <th className="py-2 px-1.5 border border-slate-700 text-center w-8">م</th>
                  <th className="py-2 px-2 border border-slate-700 text-center w-24">التاريخ</th>
                  <th className="py-2 px-2 border border-slate-700 text-center w-24">رقم الحركة</th>
                  <th className="py-2 px-2 border border-slate-700 w-28">نوع العملية</th>
                  <th className="py-2 px-2 border border-slate-700">البيان والشرح والتفاصيل الكاملة</th>
                  <th className="py-2 px-2 border border-slate-700 text-left w-24">استحقاق له (+)</th>
                  <th className="py-2 px-2 border border-slate-700 text-left w-24">منصرف / مخصوم (-)</th>
                  <th className="py-2 px-2 border border-slate-700 text-left w-28">الرصيد المتبقي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {employeeStatementData.rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400 font-bold">
                      لا توجد حركات مسجلة لهذا الموظف خلال الفترة المحددة
                    </td>
                  </tr>
                ) : (
                  employeeStatementData.rows.map((row: any, idx: number) => (
                    <tr
                      key={idx}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        idx % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'
                      }`}
                    >
                      <td className="py-2.5 px-1.5 text-center text-slate-500 font-mono text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-2 font-mono text-slate-700 text-center whitespace-nowrap">
                        {row.date}
                      </td>
                      <td className="py-2.5 px-2 font-mono font-bold text-slate-900 text-center whitespace-nowrap">
                        {row.refNumber}
                      </td>
                      <td className="py-2.5 px-2">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-900">
                          {row.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 font-semibold text-slate-800">
                        {row.description}
                      </td>
                      <td className="py-2.5 px-2 font-mono font-bold text-purple-700 text-left">
                        {row.dueAmount > 0 ? row.dueAmount.toFixed(2) : '-'}
                      </td>
                      <td className="py-2.5 px-2 font-mono font-bold text-rose-700 text-left">
                        {row.paidAmount > 0 ? row.paidAmount.toFixed(2) : '-'}
                      </td>
                      <td className="py-2.5 px-2 font-mono font-black text-slate-900 text-left bg-slate-50/70">
                        {row.runningBalance.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                <tr>
                  <td colSpan={5} className="py-2.5 px-3 text-left font-sans">الإجمالي العام للحركات بالفترة:</td>
                  <td className="py-2.5 px-2 text-left font-mono text-purple-800 font-black">
                    {employeeStatementData.totalDue.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-2 text-left font-mono text-rose-800 font-black">
                    {employeeStatementData.totalPaid.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-2 text-left font-mono text-slate-900 font-black bg-slate-200/80">
                    {employeeStatementData.netBalance.toFixed(2)} {settings.currency}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* 4. ملخص نهاية الكشف بعد الجدول */}
          <div className="mt-4 p-3.5 bg-slate-50 border-2 border-slate-800 rounded-xl space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* 1. إجمالي استحقاقات الفترة */}
              <div className="p-3 bg-white border-2 border-purple-300 rounded-lg shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-900">إجمالي مستحقات الفترة:</span>
                  <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-bold">
                    رواتب ومكافآت
                  </span>
                </div>
                <div className="my-2 text-center">
                  <div className="text-2xl font-black font-mono text-purple-700">
                    {employeeStatementData.totalDue.toFixed(2)} <span className="text-sm font-sans">{settings.currency}</span>
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 text-center border-t border-slate-100 pt-1 font-medium">
                  (وهو الرصيد للفترة فقط المحددة)
                </div>
              </div>

              {/* 2. إجمالي المنصرف والمسدد للفترة */}
              <div className="p-3 bg-white border-2 border-rose-300 rounded-lg shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-900">إجمالي المنصرف للفترة:</span>
                  <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-bold">
                    سلف واستقطاعات
                  </span>
                </div>
                <div className="my-2 text-center">
                  <div className="text-2xl font-black font-mono text-rose-700">
                    {employeeStatementData.totalPaid.toFixed(2)} <span className="text-sm font-sans">{settings.currency}</span>
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 text-center border-t border-slate-100 pt-1 font-medium">
                  (إجمالي المدفوعات والخصومات للفترة)
                </div>
              </div>

              {/* 3. الإجمالي لتاريخ الكشف */}
              <div className={`p-3 bg-white border-2 rounded-lg shadow-xs flex flex-col justify-between ${
                employeeStatementData.netBalance > 0
                  ? 'border-purple-400 bg-purple-50/20'
                  : employeeStatementData.netBalance < 0
                  ? 'border-rose-400 bg-rose-50/20'
                  : 'border-slate-300'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">الإجمالي لتاريخ الكشف:</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                    employeeStatementData.netBalance > 0
                      ? 'bg-purple-100 text-purple-900'
                      : employeeStatementData.netBalance < 0
                      ? 'bg-rose-100 text-rose-900'
                      : 'bg-slate-100 text-slate-800'
                  }`}>
                    {employeeStatementData.netBalance > 0
                      ? 'مستحق للموظف في ذمة المنشأة'
                      : employeeStatementData.netBalance < 0
                      ? 'مستحق على الموظف (سلف فائضة)'
                      : 'حساب مسدد بالكامل'}
                  </span>
                </div>
                <div className="my-2 text-center">
                  <div className={`text-2xl font-black font-mono ${
                    employeeStatementData.netBalance > 0
                      ? 'text-purple-800'
                      : employeeStatementData.netBalance < 0
                      ? 'text-rose-800'
                      : 'text-slate-700'
                  }`}>
                    {Math.abs(employeeStatementData.netBalance).toFixed(2)} <span className="text-sm font-sans">{settings.currency}</span>
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 text-center border-t border-slate-100 pt-1 font-medium">
                  (صافي الرصيد المستحق حتى تاريخ اليوم)
                </div>
              </div>
            </div>

            {/* كتابة المبلغ وتفقيطه */}
            <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs flex items-center gap-2">
              <span className="font-bold text-slate-700 shrink-0">المبلغ كتابة وتفقيطاً:</span>
              <span className="font-semibold text-slate-900 bg-slate-50 px-2 py-1 rounded border border-slate-200 flex-1">
                {tafqeetArabic(Math.abs(employeeStatementData.netBalance), settings.currency)}
              </span>
            </div>

            {/* التوقيعات الرسمية */}
            <div className="grid grid-cols-3 gap-4 pt-3 border-t border-slate-300 text-center text-xs">
              <div>
                <div className="font-bold text-slate-800 mb-6">مسؤول الرواتب وشؤون الموظفين</div>
                <div className="border-t border-dashed border-slate-400 pt-1 text-[11px] text-slate-500">التوقيع / التاريخ</div>
              </div>
              <div>
                <div className="font-bold text-slate-800 mb-6">اعتماد الإدارة المالية</div>
                <div className="border-t border-dashed border-slate-400 pt-1 text-[11px] text-slate-500">الختم والاعتماد</div>
              </div>
              <div>
                <div className="font-bold text-slate-800 mb-6">توقيع وإقرار الموظف بالمطابقة</div>
                <div className="border-t border-dashed border-slate-400 pt-1 text-[11px] text-slate-500">التوقيع والاستلام</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. كشف رواتب الموظفين */}
      {/* ========================================================================= */}
      {activeReport === 'payroll_sheets' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded">شؤون الموظفين والرواتب</span>
              <h2 className="text-base font-bold text-slate-900 mt-1">كشف مسيرات الرواتب الشهرية</h2>
              <p className="text-xs text-slate-500 mt-0.5">ملخص المسيرات المعتمدة والمسودات ومبالغ الرواتب الإجمالية والصافية</p>
            </div>

            <div className="text-left">
              <span className="text-[11px] text-slate-400 block">إجمالي الرواتب المصروفة:</span>
              <strong className="text-xl font-mono font-bold text-blue-700">
                {payrollSheetsData.filter(s => s.status === 'approved').reduce((s, p) => s + p.totalNet, 0).toLocaleString('ar-SA')} {settings.currency}
              </strong>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b">
                <tr>
                  <th className="p-2.5">رقم المسير</th>
                  <th className="p-2.5">شهر الاستحقاق</th>
                  <th className="p-2.5">الحالة</th>
                  <th className="p-2.5">عدد الموظفين</th>
                  <th className="p-2.5">إجمالي الأساسي</th>
                  <th className="p-2.5">البدلات والحوافز</th>
                  <th className="p-2.5">الاستقطاعات والسلف</th>
                  <th className="p-2.5">صافي الرواتب</th>
                  <th className="p-2.5">تاريخ الاعتماد</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {payrollSheetsData.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-6 text-center text-slate-400">لا توجد مسيرات رواتب مسجلة</td>
                  </tr>
                ) : (
                  payrollSheetsData.map(sheet => {
                    const sheetItems = (sheet as any).items || (sheet as any).lines || [];
                    const employeesCount = sheetItems.length || sheet.employeesCount || 0;
                    return (
                      <tr key={sheet.id} className="hover:bg-slate-50">
                        <td className="p-2.5 font-mono font-bold text-blue-600">{sheet.sheetNumber}</td>
                        <td className="p-2.5 font-mono font-bold text-slate-900">{sheet.period || (sheet as any).periodMonth || sheet.title}</td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            sheet.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {sheet.status === 'approved' ? 'معتمد ومصروف' : 'مسودة قيد المراجعة'}
                          </span>
                        </td>
                        <td className="p-2.5 font-mono">{employeesCount} موظف</td>
                        <td className="p-2.5 font-mono text-slate-700">{sheet.totalBasic.toLocaleString('ar-SA')}</td>
                        <td className="p-2.5 font-mono text-emerald-700">+{sheet.totalAllowances.toLocaleString('ar-SA')}</td>
                        <td className="p-2.5 font-mono text-rose-700">-{sheet.totalDeductions.toLocaleString('ar-SA')}</td>
                        <td className="p-2.5 font-mono font-bold text-slate-900 text-sm">{sheet.totalNet.toLocaleString('ar-SA')} {settings.currency}</td>
                        <td className="p-2.5 font-mono text-slate-500">{sheet.disbursedAt || (sheet as any).approvedAt || sheet.createdAt || '-'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. كشف تفصيلي للصناديق */}
      {/* ========================================================================= */}
      {activeReport === 'treasuries_movement' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-4 gap-3">
            <div>
              <span className="text-[10px] text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded">إدارة السيولة والخزائن</span>
              <h2 className="text-base font-bold text-slate-900 mt-1">كشف حركات الصناديق والحسابات البنكية</h2>
              <p className="text-xs text-slate-500 mt-0.5">تفاصيل التدفقات النقدية الداخلة والخارجة وحركات العملات الفعلية وأسعار الصرف</p>
            </div>

            {/* Holdings breakdown by currency */}
            <div className="text-right sm:text-left space-y-1">
              <span className="text-[11px] text-slate-500 block font-semibold">الموجودات الفعلية في الصناديق المختارة:</span>
              <div className="flex flex-wrap items-center gap-1.5 justify-end">
                {Object.entries(treasuriesMovementData.targetHoldings).map(([currCode, amt]) => {
                  const currObj = currencies.find(c => c.code === currCode);
                  const sym = currCode === 'ILS' ? '₪' : (currObj?.symbol || currCode);
                  const name = currObj?.name || currCode;
                  const num = Number(amt) || 0;
                  return (
                    <div key={currCode} className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-xs flex items-center gap-1">
                      <span className="text-slate-500 font-sans">{name}:</span>
                      <strong className="font-mono text-slate-900">{num.toLocaleString('ar-SA')} {sym}</strong>
                    </div>
                  );
                })}
              </div>
              <div className="text-[11px] text-slate-400">
                المعادل المحاسبي الإجمالي: <strong className="font-mono text-teal-700 font-bold">{treasuriesMovementData.targetTreasuries.reduce((s, t) => s + t.balance, 0).toLocaleString('ar-SA')} ₪</strong>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b">
                <tr>
                  <th className="p-2.5">التاريخ</th>
                  <th className="p-2.5">اسم الصندوق / الحساب</th>
                  <th className="p-2.5">نوع الحركة</th>
                  <th className="p-2.5">رقم السند</th>
                  <th className="p-2.5">الطرف المستفيد / الدافع</th>
                  <th className="p-2.5 text-slate-800">المبلغ الفعلي</th>
                  <th className="p-2.5 text-center">سعر الصرف</th>
                  <th className="p-2.5 text-emerald-600">وارد مكافئ (₪)</th>
                  <th className="p-2.5 text-rose-600">منصرف مكافئ (₪)</th>
                  <th className="p-2.5">البيان والشرح</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {treasuriesMovementData.rows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-6 text-center text-slate-400">لا توجد حركات مسجلة للصناديق خلال الفترة</td>
                  </tr>
                ) : (
                  treasuriesMovementData.rows.map((row, idx) => {
                    const currObj = currencies.find(c => c.code === row.actualCurrency);
                    const sym = row.actualCurrency === 'ILS' ? '₪' : (currObj?.symbol || row.actualCurrency);

                    return (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2.5 font-mono text-slate-600 whitespace-nowrap">{row.date}</td>
                        <td className="p-2.5 font-semibold text-slate-900">{row.treasuryName}</td>
                        <td className="p-2.5 font-medium whitespace-nowrap">{row.type}</td>
                        <td className="p-2.5 font-mono text-blue-600 font-bold whitespace-nowrap">{row.docNumber}</td>
                        <td className="p-2.5 text-slate-700">{row.partyName}</td>
                        <td className="p-2.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                          {row.actualAmount.toLocaleString('ar-SA')} {sym}
                        </td>
                        <td className="p-2.5 font-mono text-center text-slate-500 whitespace-nowrap">
                          {row.exchangeRate.toFixed(4)}
                        </td>
                        <td className="p-2.5 font-mono font-bold text-emerald-700 whitespace-nowrap">
                          {row.inflow > 0 ? row.inflow.toLocaleString('ar-SA') : '-'}
                        </td>
                        <td className="p-2.5 font-mono font-bold text-rose-700 whitespace-nowrap">
                          {row.outflow > 0 ? row.outflow.toLocaleString('ar-SA') : '-'}
                        </td>
                        <td className="p-2.5 text-slate-500 max-w-[200px] truncate">{row.notes}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot className="bg-slate-100/70 font-bold border-t border-slate-200">
                <tr>
                  <td colSpan={7} className="p-2.5 text-slate-800">
                    <div className="space-y-1">
                      <span>إجمالي التدفقات المكافئة (شيكل):</span>
                      {/* Currency Movements Breakdown */}
                      <div className="flex flex-wrap gap-2 text-[11px] font-normal text-slate-600">
                        <span>صافي حركة العملات الفعلية:</span>
                        {Object.entries(treasuriesMovementData.currencyMovements).map(([currCode, mov]) => {
                          const m = mov as { in: number; out: number };
                          const net = m.in - m.out;
                          const currObj = currencies.find(c => c.code === currCode);
                          const sym = currCode === 'ILS' ? '₪' : (currObj?.symbol || currCode);
                          return (
                            <span key={currCode} className={`font-mono font-bold px-1.5 py-0.5 rounded ${net >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                              {currCode}: {net >= 0 ? '+' : ''}{net.toLocaleString('ar-SA')} {sym}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </td>
                  <td className="p-2.5 font-mono text-emerald-700 font-black whitespace-nowrap">
                    +{treasuriesMovementData.totalInflow.toLocaleString('ar-SA')} ₪
                  </td>
                  <td className="p-2.5 font-mono text-rose-700 font-black whitespace-nowrap">
                    -{treasuriesMovementData.totalOutflow.toLocaleString('ar-SA')} ₪
                  </td>
                  <td className="p-2.5 font-mono text-teal-700 font-black whitespace-nowrap">
                    صافي: {treasuriesMovementData.netMovement.toLocaleString('ar-SA')} ₪
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FINANCIAL STATEMENTS: Income Statement */}
      {/* ========================================================================= */}
      {activeReport === 'income' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 w-full max-w-5xl mx-auto space-y-4">
          <div className="text-center border-b pb-4">
            <h3 className="text-base font-bold text-slate-900">{settings.businessName}</h3>
            <h4 className="text-xs font-bold text-blue-700 mt-0.5">قائمة الدخل والأرباح والخسائر (Income Statement)</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">للفترة المنتهية في {new Date().toLocaleDateString('ar-SA')}</p>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <div className="font-bold text-xs text-slate-900 bg-slate-50 p-2 rounded-md mb-1.5 flex justify-between border border-slate-200">
                <span>أولاً: الإيرادات التشغيلية (Revenues)</span>
                <span className="font-mono text-blue-700 font-black">{totalRevenues.toLocaleString('ar-SA')} {settings.currency}</span>
              </div>
              <div className="space-y-1 px-2 text-[11px]">
                <div className="flex justify-between text-slate-700">
                  <span>إيرادات أعمال ومطبوعات المطبعة:</span>
                  <span className="font-mono font-semibold">{revPrinting.toLocaleString('ar-SA')} {settings.currency}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>إيرادات مبيعات المكتبة والقرطاسية:</span>
                  <span className="font-mono font-semibold">{revBookstore.toLocaleString('ar-SA')} {settings.currency}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>إيرادات خدمات التصوير والتجليد:</span>
                  <span className="font-mono font-semibold">{revServices.toLocaleString('ar-SA')} {settings.currency}</span>
                </div>
              </div>
            </div>

            <div>
              <div className="font-bold text-xs text-slate-900 bg-slate-50 p-2 rounded-md mb-1.5 flex justify-between border border-slate-200">
                <span>ثانياً: تكلفة المبيعات والخامات (Cost of Goods Sold)</span>
                <span className="font-mono text-rose-600 font-black">({totalCogs.toLocaleString('ar-SA')}) {settings.currency}</span>
              </div>
              <div className="space-y-1 px-2 text-[11px]">
                <div className="flex justify-between text-slate-700">
                  <span>تكلفة خامات وأحبار ومستهلكات الطباعة:</span>
                  <span className="font-mono font-semibold">{cogsPrinting.toLocaleString('ar-SA')} {settings.currency}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>تكلفة بضاعة مبيعات القرطاسية والكتب:</span>
                  <span className="font-mono font-semibold">{cogsBookstore.toLocaleString('ar-SA')} {settings.currency}</span>
                </div>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 p-2 rounded-md flex justify-between text-xs font-bold text-emerald-900">
              <span>مجمل الربح (Gross Profit):</span>
              <span className="font-mono font-black">{grossProfit.toLocaleString('ar-SA')} {settings.currency}</span>
            </div>

            <div>
              <div className="font-bold text-xs text-slate-900 bg-slate-50 p-2 rounded-md mb-1.5 flex justify-between border border-slate-200">
                <span>ثالثاً: المصروفات التشغيلية والعمومية (Operating Expenses)</span>
                <span className="font-mono text-rose-600 font-black">({totalExpenses.toLocaleString('ar-SA')}) {settings.currency}</span>
              </div>
              <div className="space-y-1 px-2 text-[11px]">
                <div className="flex justify-between text-slate-700">
                  <span>مصروفات الرواتب والأجور:</span>
                  <span className="font-mono font-semibold">{expSalaries.toLocaleString('ar-SA')} {settings.currency}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>إيجار المعرض والمطبعة:</span>
                  <span className="font-mono font-semibold">{expRent.toLocaleString('ar-SA')} {settings.currency}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>مصروفات صيانة ماكينات الطباعة:</span>
                  <span className="font-mono font-semibold">{expMaintenance.toLocaleString('ar-SA')} {settings.currency}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>فواتير الكهرباء والمياه:</span>
                  <span className="font-mono font-semibold">{expUtilities.toLocaleString('ar-SA')} {settings.currency}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>مصروفات عمومية وتسويق:</span>
                  <span className="font-mono font-semibold">{expGeneral.toLocaleString('ar-SA')} {settings.currency}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 text-white p-3 rounded-md flex justify-between text-sm font-bold">
              <span>صافي الربح للفترة (Net Profit):</span>
              <span className="font-mono font-black text-emerald-400">{netProfit.toLocaleString('ar-SA')} {settings.currency}</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FINANCIAL STATEMENTS: Balance Sheet */}
      {/* ========================================================================= */}
      {activeReport === 'balance_sheet' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 w-full max-w-5xl mx-auto space-y-4">
          <div className="text-center border-b pb-4">
            <h3 className="text-base font-bold text-slate-900">{settings.businessName}</h3>
            <h4 className="text-xs font-bold text-blue-700 mt-0.5">الميزانية العمومية (Balance Sheet)</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">كما في تاريخ {new Date().toLocaleDateString('ar-SA')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 bg-slate-50 p-2 rounded-md border border-slate-200">
                الجانب الأيمن: الأصول (Assets)
              </h4>
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>نقدية بالصندوق (الكاشير):</span>
                  <span className="font-mono font-semibold">{assetCash.toLocaleString('ar-SA')}</span>
                </div>
                <div className="flex justify-between">
                  <span>أرصدة البنوك:</span>
                  <span className="font-mono font-semibold">{assetBank.toLocaleString('ar-SA')}</span>
                </div>
                <div className="flex justify-between">
                  <span>العملاء والذمم المدينة:</span>
                  <span className="font-mono font-semibold">{assetReceivables.toLocaleString('ar-SA')}</span>
                </div>
                <div className="flex justify-between">
                  <span>مخزون الكتب والقرطاسية:</span>
                  <span className="font-mono font-semibold">{assetInventoryBooks.toLocaleString('ar-SA')}</span>
                </div>
                <div className="flex justify-between">
                  <span>مخزون الورق وخامات الطباعة:</span>
                  <span className="font-mono font-semibold">{assetInventoryPrint.toLocaleString('ar-SA')}</span>
                </div>
                <div className="flex justify-between pt-1 border-t font-bold">
                  <span>إجمالي الأصول المتداولة:</span>
                  <span className="font-mono text-blue-700">{totalCurrentAssets.toLocaleString('ar-SA')}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span>آلات ومعدات الطباعة (أصول ثابتة):</span>
                  <span className="font-mono font-semibold">{totalFixedAssets.toLocaleString('ar-SA')}</span>
                </div>
                <div className="flex justify-between bg-blue-50 p-2 rounded font-bold text-blue-900 mt-2">
                  <span>مجموع الأصول:</span>
                  <span className="font-mono">{totalAssets.toLocaleString('ar-SA')} {settings.currency}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 bg-slate-50 p-2 rounded-md border border-slate-200">
                الجانب الأيسر: الخصوم وحقوق الملكية
              </h4>
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>الموردون والذمم الدائنة:</span>
                  <span className="font-mono font-semibold">{liabPayables.toLocaleString('ar-SA')}</span>
                </div>
                <div className="flex justify-between">
                  <span>أمانات ضريبة القيمة المضافة:</span>
                  <span className="font-mono font-semibold">{liabVat.toLocaleString('ar-SA')}</span>
                </div>
                <div className="flex justify-between pt-1 border-t font-bold">
                  <span>إجمالي الخصوم والالتزامات:</span>
                  <span className="font-mono text-rose-700">{totalLiabilities.toLocaleString('ar-SA')}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span>رأس المال المدفوع:</span>
                  <span className="font-mono font-semibold">{eqCapital.toLocaleString('ar-SA')}</span>
                </div>
                <div className="flex justify-between">
                  <span>الأرباح المبقاة / المحتجزة:</span>
                  <span className="font-mono font-semibold">{eqRetained.toLocaleString('ar-SA')}</span>
                </div>
                <div className="flex justify-between">
                  <span>أرباح الفترة الحالية:</span>
                  <span className="font-mono font-semibold text-emerald-600">{netProfit.toLocaleString('ar-SA')}</span>
                </div>
                <div className="flex justify-between bg-blue-50 p-2 rounded font-bold text-blue-900 mt-2">
                  <span>مجموع الخصوم وحقوق الملكية:</span>
                  <span className="font-mono">{totalEquity.toLocaleString('ar-SA')} {settings.currency}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FINANCIAL STATEMENTS: VAT Return */}
      {/* ========================================================================= */}
      {activeReport === 'vat' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 w-full max-w-5xl mx-auto space-y-4">
          <div className="text-center border-b pb-4">
            <h3 className="text-base font-bold text-slate-900">{settings.businessName}</h3>
            <h4 className="text-xs font-bold text-blue-700 mt-0.5">إقرار ضريبة القيمة المضافة المعتمد</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">الرقم الضريبي: {settings.taxNumber || '300000000000003'}</p>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <div className="font-bold text-xs text-slate-900 bg-slate-50 p-2 rounded-md mb-1.5 flex justify-between border border-slate-200">
                <span>1. المبيعات وضريبة المخرجات:</span>
                <span className="font-mono text-blue-700 font-black">{totalOutputVat.toLocaleString('ar-SA')} {settings.currency}</span>
              </div>
              <div className="space-y-1 px-2 text-[11px]">
                <div className="flex justify-between">
                  <span>المبيعات الخاضعة للنسبة الأساسية ({settings.vatRate || 0}%):</span>
                  <span className="font-mono font-semibold">{totalSalesTaxable.toLocaleString('ar-SA')} {settings.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span>ضريبة المخرجات المستحقة:</span>
                  <span className="font-mono font-semibold text-blue-600">{totalOutputVat.toLocaleString('ar-SA')} {settings.currency}</span>
                </div>
              </div>
            </div>

            <div>
              <div className="font-bold text-xs text-slate-900 bg-slate-50 p-2 rounded-md mb-1.5 flex justify-between border border-slate-200">
                <span>2. المشتريات وضريبة المدخلات:</span>
                <span className="font-mono text-emerald-700 font-black">{totalInputVat.toLocaleString('ar-SA')} {settings.currency}</span>
              </div>
              <div className="space-y-1 px-2 text-[11px]">
                <div className="flex justify-between">
                  <span>المشتريات الخاضعة للنسبة الأساسية:</span>
                  <span className="font-mono font-semibold">{totalPurchasesTaxable.toLocaleString('ar-SA')} {settings.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span>ضريبة المدخلات القابلة للخصم:</span>
                  <span className="font-mono font-semibold text-emerald-600">{totalInputVat.toLocaleString('ar-SA')} {settings.currency}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 text-white p-3 rounded-md flex justify-between text-sm font-bold">
              <span>صافي الضريبة المستحقة للسداد:</span>
              <span className="font-mono font-black text-amber-400">{netVatPayable.toLocaleString('ar-SA')} {settings.currency}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
