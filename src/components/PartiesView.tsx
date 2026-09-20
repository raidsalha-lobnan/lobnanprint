import React, { useState } from 'react';
import { useAccounting } from '../context/AccountingContext';
import { Party } from '../types';
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Building,
  Receipt,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  FileSpreadsheet,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  FileText,
  SlidersHorizontal,
  LayoutGrid,
  List,
  ShieldAlert,
  UserCheck,
  Lock,
  Hash,
  Copy,
  Check,
  Link as LinkIcon
} from 'lucide-react';
import { generateSequentialPartyCode } from '../utils/partyUtils';

export const PartiesView: React.FC = () => {
  const {
    parties,
    addParty,
    updateParty,
    deleteParty,
    setSelectedPartyForStatement,
    createPaymentVoucher,
    treasuries,
    settings,
    stats
  } = useAccounting();

  // Filters and View Mode
  const [filterCategory, setFilterCategory] = useState<'all' | 'customer' | 'supplier' | 'debtor' | 'creditor' | 'exceeded' | 'subCustomer'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Add / Edit Modal State
  const [showPartyModal, setShowPartyModal] = useState(false);
  const [editingPartyId, setEditingPartyId] = useState<string | null>(null);

  // Form Fields
  const [partyType, setPartyType] = useState<'customer' | 'supplier' | 'both'>('customer');
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [commercialRegister, setCommercialRegister] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [creditLimit, setCreditLimit] = useState<number>(5000);
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [openingBalanceType, setOpeningBalanceType] = useState<'debit' | 'credit'>('debit');
  const [openingBalanceDate, setOpeningBalanceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Voucher Modal State
  const [voucherModalParty, setVoucherModalParty] = useState<Party | null>(null);
  const [voucherType, setVoucherType] = useState<'receipt' | 'payment'>('receipt');
  const [voucherAmount, setVoucherAmount] = useState<number>(0);
  const [voucherMethod, setVoucherMethod] = useState<'cash' | 'bank_transfer'>('cash');
  const [voucherTreasuryCode, setVoucherTreasuryCode] = useState<string>('1101');
  const [voucherDesc, setVoucherDesc] = useState('');

  // Open modal for new party
  const handleOpenAddModal = (defaultType?: 'customer' | 'supplier') => {
    setEditingPartyId(null);
    setPartyType(defaultType || (filterCategory === 'supplier' ? 'supplier' : 'customer'));
    setName('');
    setContactPerson('');
    setCity('');
    setPhone('');
    setEmail('');
    setAddress('');
    setCommercialRegister('');
    setTaxNumber('');
    setCreditLimit(5000);
    setOpeningBalance(0);
    setOpeningBalanceType(defaultType === 'supplier' ? 'credit' : 'debit');
    setOpeningBalanceDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setShowPartyModal(true);
  };

  // Open modal for editing existing party
  const handleOpenEditModal = (party: Party) => {
    setEditingPartyId(party.id);
    setPartyType(party.type);
    setName(party.name);
    setContactPerson(party.contactPerson || '');
    setCity(party.city || '');
    setPhone(party.phone);
    setEmail(party.email || '');
    setAddress(party.address || '');
    setCommercialRegister(party.commercialRegister || '');
    setTaxNumber(party.taxNumber || '');
    setCreditLimit(party.creditLimit !== undefined ? party.creditLimit : 5000);
    setOpeningBalance(party.openingBalance || Math.abs(party.balance || 0));
    setOpeningBalanceType(party.openingBalanceType || (party.balance < 0 ? 'credit' : 'debit'));
    setOpeningBalanceDate(party.openingBalanceDate || new Date().toISOString().split('T')[0]);
    setNotes(party.notes || '');
    setShowPartyModal(true);
  };

  const handleSaveParty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingPartyId) {
      updateParty(editingPartyId, {
        type: partyType,
        name: name.trim(),
        contactPerson: contactPerson.trim() || undefined,
        city: city.trim() || undefined,
        phone: phone.trim(),
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        commercialRegister: commercialRegister.trim() || undefined,
        taxNumber: taxNumber.trim() || undefined,
        creditLimit: Number(creditLimit) || 0,
        openingBalance: Number(openingBalance) || 0,
        openingBalanceType,
        openingBalanceDate,
        notes: notes.trim() || undefined
      });
    } else {
      addParty({
        type: partyType,
        name: name.trim(),
        contactPerson: contactPerson.trim() || undefined,
        city: city.trim() || undefined,
        phone: phone.trim(),
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        commercialRegister: commercialRegister.trim() || undefined,
        taxNumber: taxNumber.trim() || undefined,
        creditLimit: Number(creditLimit) || 0,
        openingBalance: Number(openingBalance) || 0,
        openingBalanceType,
        openingBalanceDate,
        initialBalance: Number(openingBalance) || 0,
        notes: notes.trim() || undefined,
        isSubCustomer: false
      });
    }

    setShowPartyModal(false);
  };

  const handleDeleteParty = (id: string, partyName: string) => {
    if (window.confirm(`هل أنت متأكد من رغبتك في حذف الحساب: "${partyName}"؟ سيتم التحقق من عدم وجود قيود مالية معلقة.`)) {
      const result = deleteParty(id);
      if (!result.success) {
        alert(result.reason);
      }
    }
  };

  const handleSaveVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucherModalParty || voucherAmount <= 0) return;

    createPaymentVoucher({
      date: new Date().toISOString().split('T')[0],
      type: voucherType,
      partyId: voucherModalParty.id,
      partyName: voucherModalParty.name,
      amount: voucherAmount,
      paymentMethod: voucherMethod,
      accountCode: voucherType === 'receipt' ? '1201' : '2101',
      description: voucherDesc || `${voucherType === 'receipt' ? 'سند قبض مالي من' : 'سند صرف مالي إلى'} ${voucherModalParty.name}`
    });

    setVoucherModalParty(null);
    setVoucherAmount(0);
    setVoucherDesc('');
  };

  // Filtered Parties Logic
  const filteredParties = parties.filter(p => {
    const q = searchQuery.trim().toLowerCase();
    const matchSearch =
      !q ||
      (p.code && p.code.toLowerCase().includes(q)) ||
      p.name.toLowerCase().includes(q) ||
      p.phone.includes(q) ||
      (p.contactPerson && p.contactPerson.toLowerCase().includes(q)) ||
      (p.city && p.city.toLowerCase().includes(q)) ||
      (p.commercialRegister && p.commercialRegister.includes(q)) ||
      (p.taxNumber && p.taxNumber.includes(q));

    if (!matchSearch) return false;

    if (filterCategory === 'all') return !p.isSubCustomer;
    if (filterCategory === 'customer') return (p.type === 'customer' || p.type === 'both') && !p.isSubCustomer;
    if (filterCategory === 'supplier') return (p.type === 'supplier' || p.type === 'both') && !p.isSubCustomer;
    if (filterCategory === 'debtor') return p.balance > 0 && !p.isSubCustomer;
    if (filterCategory === 'creditor') return p.balance < 0 && !p.isSubCustomer;
    if (filterCategory === 'exceeded') {
      return p.creditLimit !== undefined && p.creditLimit > 0 && p.balance > p.creditLimit && !p.isSubCustomer;
    }
    if (filterCategory === 'subCustomer') {
      return !!p.isSubCustomer;
    }
    return true;
  });

  const totalReceivables = parties
    .filter(p => (p.type === 'customer' || p.type === 'both') && !p.isSubCustomer)
    .reduce((acc, p) => acc + (p.balance > 0 ? p.balance : 0), 0);

  const totalPayables = parties
    .filter(p => p.type === 'supplier' || p.type === 'both')
    .reduce((acc, p) => acc + (p.balance < 0 ? Math.abs(p.balance) : 0), 0);

  const exceededCount = parties.filter(
    p => p.type !== 'supplier' && p.creditLimit && p.balance > p.creditLimit
  ).length;

  return (
    <div className="space-y-3">
      {/* Top Header & Fast Action */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">دليل العملاء والموردين وكشوف الحساب</h2>
            <p className="text-[10px] text-slate-400 font-light">
              إدارة البيانات التجارية، الحدود الائتمانية، الديون السابقة، واستخراج كشوف الحسابات المستمرة A4
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenAddModal('customer')}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة عميل جديد</span>
          </button>
          <button
            onClick={() => handleOpenAddModal('supplier')}
            className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة مورد خامات</span>
          </button>
        </div>
      </div>

      {/* KPI Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-light font-semibold block">إجمالي ديون العملاء المستحقة (لنا):</span>
            <div className="text-base font-black text-amber-700 mt-0.5 font-mono">
              {totalReceivables.toLocaleString('ar-SA', { minimumFractionDigits: 2 })}{' '}
              <span className="text-[11px] font-normal text-slate-500">{settings.currency}</span>
            </div>
            <span className="text-[10px] text-slate-400">ذمم مدينة جارية للمطبعة</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <ArrowDownLeft className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-light font-semibold block">مستحقات الموردين وشركات الورق (علينا):</span>
            <div className="text-base font-black text-rose-600 mt-0.5 font-mono">
              {totalPayables.toLocaleString('ar-SA', { minimumFractionDigits: 2 })}{' '}
              <span className="text-[11px] font-normal text-slate-500">{settings.currency}</span>
            </div>
            <span className="text-[10px] text-slate-400">ذمم دائنة والتزامات خامات</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>

        <div className={`p-3 rounded-lg border shadow-xs flex items-center justify-between ${
          exceededCount > 0 ? 'bg-amber-50/70 border-amber-300' : 'bg-white border-slate-200'
        }`}>
          <div>
            <span className="text-[11px] text-slate-600 font-semibold block">تنبيهات السقف والحدود الائتمانية:</span>
            <div className="text-base font-black text-slate-900 mt-0.5 font-mono flex items-center gap-1.5">
              <span>{exceededCount}</span>
              <span className="text-[11px] font-normal text-slate-600">عميل تجاوزوا الحد المسموح</span>
            </div>
            <span className="text-[9px] text-slate-400 font-light">حماية السيولة وتجنب الديون المعدومة</span>
          </div>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            exceededCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-50 text-emerald-600'
          }`}>
            {exceededCount > 0 ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          </div>
        </div>
      </div>

      {/* Filter Tabs and Search Bar */}
      <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-2.5 text-xs">
        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-1 w-full md:w-auto">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
              filterCategory === 'all' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            الكل ({parties.filter(p => !p.isSubCustomer).length})
          </button>
          <button
            onClick={() => setFilterCategory('customer')}
            className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
              filterCategory === 'customer' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            العملاء ({parties.filter(p => (p.type === 'customer' || p.type === 'both') && !p.isSubCustomer).length})
          </button>
          <button
            onClick={() => setFilterCategory('subCustomer')}
            className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer transition-colors flex items-center gap-1 ${
              filterCategory === 'subCustomer' ? 'bg-amber-600 text-white shadow-xs' : 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100'
            }`}
          >
            <LinkIcon className="w-3 h-3 text-amber-700" />
            <span>الزبائن الفرعيين / ديون مؤقتة ({parties.filter(p => p.isSubCustomer).length})</span>
          </button>
          <button
            onClick={() => setFilterCategory('supplier')}
            className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
              filterCategory === 'supplier' ? 'bg-purple-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            الموردون ({parties.filter(p => (p.type === 'supplier' || p.type === 'both') && !p.isSubCustomer).length})
          </button>
          <button
            onClick={() => setFilterCategory('debtor')}
            className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
              filterCategory === 'debtor' ? 'bg-amber-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            عليهم مبالغ (مدينون)
          </button>
          <button
            onClick={() => setFilterCategory('creditor')}
            className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
              filterCategory === 'creditor' ? 'bg-rose-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            لهم مبالغ (دائنون)
          </button>
          {exceededCount > 0 && (
            <button
              onClick={() => setFilterCategory('exceeded')}
              className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer transition-colors flex items-center gap-1 ${
                filterCategory === 'exceeded' ? 'bg-amber-700 text-white shadow-xs' : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>تجاوزوا السقف ({exceededCount})</span>
            </button>
          )}
        </div>

        {/* Search Input & View Mode */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <div className="relative flex-1 md:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="بحث بالاسم، الجوال، السجل التجاري، المدينة..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pr-8 pl-3 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs focus:bg-white focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="bg-slate-100 p-0.5 rounded-md flex items-center">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded cursor-pointer ${viewMode === 'grid' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'}`}
              title="عرض كبطاقات"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1 rounded cursor-pointer ${viewMode === 'table' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'}`}
              title="عرض كجدول"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Parties Content: Grid View or Table View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {filteredParties.length === 0 ? (
            <div className="col-span-full bg-white p-8 rounded-lg border border-slate-200 text-center text-slate-400 text-xs">
              لم يتم العثور على عملاء أو موردين مطابقين لمعايير البحث
            </div>
          ) : (
            filteredParties.map(party => {
              const isCustomer = party.type === 'customer' || party.type === 'both';
              const isSupplier = party.type === 'supplier' || party.type === 'both';
              const isDebit = party.balance > 0;
              const isCredit = party.balance < 0;
              const isZero = party.balance === 0;
              const creditLimit = party.creditLimit || 0;
              const isLimitExceeded = creditLimit > 0 && party.balance > creditLimit;
              const creditUsagePercent = creditLimit > 0 ? Math.min(100, Math.round((Math.max(0, party.balance) / creditLimit) * 100)) : 0;

              return (
                <div
                  key={party.id}
                  className={`bg-white rounded-lg p-3.5 border shadow-xs transition-all flex flex-col justify-between space-y-3 ${
                    isLimitExceeded
                      ? 'border-amber-400 bg-amber-50/10 hover:border-amber-500'
                      : 'border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <div>
                    {/* Header: Type Badges & CR / Tax */}
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1 shadow-2xs" title="الرقم التسلسلي الآلي الصادر من النظام">
                          <Hash className="w-2.5 h-2.5 text-blue-600" />
                          <span>{party.code || 'CUST-0000'}</span>
                        </span>
                        {party.isSubCustomer ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                            <LinkIcon className="w-2.5 h-2.5 text-amber-700" />
                            <span>زبون فرعي / دين مؤقت</span>
                          </span>
                        ) : (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            party.type === 'customer' ? 'bg-blue-100 text-blue-800' :
                            party.type === 'supplier' ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {party.type === 'customer' ? 'عميل' : party.type === 'supplier' ? 'مورد خامات' : 'عميل ومورد'}
                          </span>
                        )}
                        {party.isSubCustomer && party.parentPartyId && (
                          <span className="text-[10px] bg-blue-50 text-blue-800 px-1.5 py-0.5 rounded border border-blue-200">
                            تابع لـ: {parties.find(p => p.id === party.parentPartyId)?.name || 'العميل الرئيسي'}
                          </span>
                        )}
                        {party.city && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <MapPin className="w-2.5 h-2.5 text-slate-400" />
                            <span>{party.city}</span>
                          </span>
                        )}
                      </div>

                      {isLimitExceeded && (
                        <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>تجاوز السقف</span>
                        </span>
                      )}
                    </div>

                    {/* Party Name & Contact Person */}
                    <h3 className="font-bold text-slate-900 text-xs flex items-center justify-between">
                      <span>{party.name}</span>
                      {party.contactPerson && (
                        <span className="text-[11px] font-normal text-slate-500 flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-slate-400" />
                          <span>{party.contactPerson}</span>
                        </span>
                      )}
                    </h3>

                    {/* Quick Details List */}
                    <div className="space-y-1 text-[10px] text-slate-400 font-light pt-2 mt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span className="font-mono text-slate-700 text-[11px]">{party.phone}</span>
                        </div>
                        {party.commercialRegister && (
                          <span className="text-[10px] font-mono text-slate-400">
                            س.ت: {party.commercialRegister}
                          </span>
                        )}
                      </div>

                      {party.taxNumber && (
                        <div className="text-[10px] text-slate-400 font-mono">
                          الرقم الضريبي: {party.taxNumber}
                        </div>
                      )}

                      {party.address && (
                        <div className="text-[10px] text-slate-400 font-light truncate" title={party.address}>
                          {party.address}
                        </div>
                      )}

                      {/* Credit Limit & Debt History */}
                      {creditLimit > 0 && (
                        <div className="pt-1">
                          <div className="flex justify-between text-[10px] mb-0.5">
                            <span className="text-slate-500">الحد الائتماني: {creditLimit.toLocaleString('ar-SA')} {settings.currency}</span>
                            <span className={`font-mono font-bold ${isLimitExceeded ? 'text-rose-600' : 'text-slate-600'}`}>
                              {creditUsagePercent}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isLimitExceeded ? 'bg-rose-500' : creditUsagePercent > 80 ? 'bg-amber-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${Math.min(100, creditUsagePercent)}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {party.openingBalance !== undefined && party.openingBalance > 0 && (
                        <div className="text-[10px] text-slate-400 flex justify-between pt-0.5">
                          <span>دين سابق / رصيد افتتاحي:</span>
                          <span className="font-mono">{party.openingBalance.toLocaleString('ar-SA')} {settings.currency}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Financial Balance & Action Buttons */}
                  <div className="pt-2.5 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-light font-semibold">الرصيد الجاري المستمر:</span>
                      <span
                        className={`font-mono font-bold text-xs ${
                          isDebit ? 'text-amber-700' : isCredit ? 'text-rose-600' : 'text-emerald-600'
                        }`}
                      >
                        {Math.abs(party.balance).toLocaleString('ar-SA', { minimumFractionDigits: 2 })} {settings.currency}
                        <span className="text-[10px] font-normal mr-1">
                          {isDebit ? '(لنا مطلوب منه)' : isCredit ? '(علينا مستحق له)' : '(خالص)'}
                        </span>
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-1 pt-1">
                      {/* Detailed Account Statement Button */}
                      <button
                        onClick={() => setSelectedPartyForStatement(party)}
                        className="col-span-2 flex items-center justify-center gap-1 px-2 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-md text-[11px] transition-colors cursor-pointer"
                        title="استخراج كشف حساب برصيد تراكمي مستمر وطباعته"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>كشف حساب</span>
                      </button>

                      {/* Quick Voucher Button */}
                      <button
                        onClick={() => {
                          setVoucherModalParty(party);
                          setVoucherType(isCustomer && !isSupplier ? 'receipt' : 'payment');
                          setVoucherAmount(Math.abs(party.balance));
                        }}
                        className="flex items-center justify-center gap-0.5 px-1.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-md text-[11px] transition-colors cursor-pointer"
                        title="إصدار سند قبض أو صرف سريع"
                      >
                        <Receipt className="w-3 h-3 text-slate-500" />
                        <span>سند</span>
                      </button>

                      {/* Edit / Actions */}
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEditModal(party)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                          title="تعديل البيانات والحد الائتماني"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteParty(party.id, party.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                          title="حذف الحساب"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Tabular View */
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                <th className="py-2.5 px-3 font-mono">الرقم التسلسلي</th>
                <th className="py-2.5 px-3">الاسم التجاري والجهة</th>
                <th className="py-2.5 px-3">النوع</th>
                <th className="py-2.5 px-3">الشخص المسؤول</th>
                <th className="py-2.5 px-3">الجوال / المدينة</th>
                <th className="py-2.5 px-3">السجل / الضريبي</th>
                <th className="py-2.5 px-3 font-mono">الحد الائتماني</th>
                <th className="py-2.5 px-3 font-mono">الرصيد الجاري</th>
                <th className="py-2.5 px-3 text-center">الإجراءات والعمليات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {filteredParties.map(party => {
                const isDebit = party.balance > 0;
                const isCredit = party.balance < 0;
                const creditLimit = party.creditLimit || 0;
                const isLimitExceeded = creditLimit > 0 && party.balance > creditLimit;

                return (
                  <tr key={party.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-800 text-[11px] whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        <Hash className="w-2.5 h-2.5 text-blue-600" />
                        <span>{party.code || '-'}</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">
                      <div>{party.name}</div>
                      {isLimitExceeded && (
                        <span className="text-[10px] text-rose-600 font-semibold block">
                          تجاوز الحد الائتماني!
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      {party.isSubCustomer ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                          <LinkIcon className="w-2.5 h-2.5 text-amber-700" />
                          <span>زبون فرعي</span>
                        </span>
                      ) : (
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          party.type === 'customer' ? 'bg-blue-100 text-blue-800' :
                          party.type === 'supplier' ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {party.type === 'customer' ? 'عميل' : party.type === 'supplier' ? 'مورد' : 'كلاهما'}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{party.contactPerson || '-'}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px]">
                      <div>{party.phone}</div>
                      <div className="text-[10px] text-slate-400 font-sans">{party.city || '-'}</div>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[9px] text-slate-400 font-light">
                      <div>{party.commercialRegister ? `س.ت: ${party.commercialRegister}` : ''}</div>
                      <div>{party.taxNumber ? `ض: ${party.taxNumber}` : ''}</div>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600 font-semibold">
                      {creditLimit > 0 ? `${creditLimit.toLocaleString('ar-SA')} ${settings.currency}` : '-'}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold">
                      <span className={isDebit ? 'text-amber-700' : isCredit ? 'text-rose-600' : 'text-emerald-600'}>
                        {Math.abs(party.balance).toLocaleString('ar-SA', { minimumFractionDigits: 2 })} {settings.currency}
                      </span>
                      <span className="text-[10px] font-normal block text-slate-400">
                        {isDebit ? '(لنا)' : isCredit ? '(علينا)' : '(خالص)'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setSelectedPartyForStatement(party)}
                          className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded text-[11px] flex items-center gap-1 cursor-pointer"
                          title="كشف حساب تفصيلي مستمر"
                        >
                          <FileText className="w-3 h-3" />
                          <span>كشف حساب</span>
                        </button>
                        <button
                          onClick={() => {
                            setVoucherModalParty(party);
                            setVoucherType(party.type === 'customer' ? 'receipt' : 'payment');
                            setVoucherAmount(Math.abs(party.balance));
                          }}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-[11px] flex items-center gap-1 cursor-pointer"
                          title="سند قبض أو صرف"
                        >
                          <Receipt className="w-3 h-3" />
                          <span>سند</span>
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(party)}
                          className="p-1 text-slate-400 hover:text-blue-600 rounded cursor-pointer"
                          title="تعديل"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteParty(party.id, party.name)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                          title="حذف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Add / Edit Party */}
      {showPartyModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-lg w-full p-4 shadow-xl border border-slate-200 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span>{editingPartyId ? 'تعديل بيانات الحساب والحد الائتماني' : 'تسجيل حساب جديد في الدليل'}</span>
              </h3>
              <button
                onClick={() => setShowPartyModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveParty} className="space-y-3 text-xs">
              {/* Type Selector */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1 text-[11px]">نوع وطبيعة الحساب:</label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPartyType('customer')}
                    className={`py-1.5 rounded-md font-bold text-xs cursor-pointer border transition-colors ${
                      partyType === 'customer'
                        ? 'bg-blue-50 border-blue-500 text-blue-800'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    عميل (مشتري مطبوعات)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPartyType('supplier')}
                    className={`py-1.5 rounded-md font-bold text-xs cursor-pointer border transition-colors ${
                      partyType === 'supplier'
                        ? 'bg-purple-50 border-purple-500 text-purple-800'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    مورد (خامات وأوراق)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPartyType('both')}
                    className={`py-1.5 rounded-md font-bold text-xs cursor-pointer border transition-colors ${
                      partyType === 'both'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    عميل ومورد معاً
                  </button>
                </div>
              </div>

              {/* Automatic System Serial Number (Locked & Non-editable) */}
              <div className="bg-blue-50/50 border border-blue-200 rounded-lg p-2.5">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-800 font-bold text-[11px] flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                    <span>الرقم التسلسلي للعميل / الحساب:</span>
                  </label>
                  <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                    <span>يصدر آلياً من البرنامج • محمي من التعديل والتكرار 🔒</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={
                      editingPartyId
                        ? (parties.find(p => p.id === editingPartyId)?.code || '')
                        : generateSequentialPartyCode(partyType, parties)
                    }
                    className="w-full bg-white border border-blue-300 rounded-md p-2 font-mono text-sm font-black text-blue-900 cursor-not-allowed select-all shadow-inner"
                    title="رقم تسلسلي موحد يصدره البرنامج تلقائياً ولا يمكن تغييره أو تكراره"
                  />
                </div>
                <p className="text-[9px] text-slate-400 font-light mt-1">
                  💡 يصدر هذا الرقم التسلسلي آلياً بنظام تسلسلي مستمر وفريد، ولا يمكن تغييره أو تكراره لضمان دقة قيود المحاسبة ومطابقة الكاشير.
                </p>
              </div>

              {/* Name & Contact Person */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 text-[11px]">
                    الاسم التجاري / اسم المنشأة أو العميل <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="مثال: مطبعة القدس، شركة الأندلس، مكتبة النور..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-md p-1.5 text-xs focus:bg-white focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 text-[11px]">الشخص المسؤول / ضابط الاتصال:</label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={e => setContactPerson(e.target.value)}
                    placeholder="مثال: أ. أحمد رضوان (مدير المشتريات)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-md p-1.5 text-xs focus:bg-white focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Phone, City, Email */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 text-[11px]">
                    رقم الجوال / الهاتف
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="059xxxxxxx"
                    className="w-full bg-slate-50 border border-slate-200 rounded-md p-1.5 font-mono text-xs focus:bg-white focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 text-[11px]">المدينة / المنطقة:</label>
                  <input
                    type="text"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    placeholder="القدس، رام الله، الخليل..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-md p-1.5 text-xs focus:bg-white focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 text-[11px]">البريد الإلكتروني:</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="info@domain.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-md p-1.5 text-xs focus:bg-white focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Commercial Register & Tax Number */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 text-[11px]">رقم السجل التجاري (CR):</label>
                  <input
                    type="text"
                    value={commercialRegister}
                    onChange={e => setCommercialRegister(e.target.value)}
                    placeholder="رقم السجل التجاري الرسمي"
                    className="w-full bg-slate-50 border border-slate-200 rounded-md p-1.5 font-mono text-xs focus:bg-white focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 text-[11px]">الرقم الضريبي (VAT No):</label>
                  <input
                    type="text"
                    value={taxNumber}
                    onChange={e => setTaxNumber(e.target.value)}
                    placeholder="الرقم الضريبي المعتمد للفوترة"
                    className="w-full bg-slate-50 border border-slate-200 rounded-md p-1.5 font-mono text-xs focus:bg-white focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Credit Limit & Debt Controls */}
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-2">
                <div className="flex items-center gap-1.5 text-slate-800 font-bold text-xs">
                  <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />
                  <span>إدارة السقف الائتماني والديون السابقة:</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-0.5 text-[10px]">
                      الحد الائتماني المسموح ({settings.currency}):
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={creditLimit}
                      onChange={e => setCreditLimit(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-md p-1.5 font-mono font-bold text-xs focus:ring-1 focus:ring-blue-500"
                    />
                    <span className="text-[9px] text-slate-400 block mt-0.5">سقف المديونية المسموح بها</span>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-0.5 text-[10px]">
                      الرصيد الافتتاحي / الدين السابق:
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={openingBalance}
                      onChange={e => setOpeningBalance(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-md p-1.5 font-mono font-bold text-xs focus:ring-1 focus:ring-blue-500"
                    />
                    <span className="text-[9px] text-slate-400 block mt-0.5">رصيد ما قبل افتتاح السيستم</span>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-0.5 text-[10px]">طبيعة الرصيد السابق:</label>
                    <select
                      value={openingBalanceType}
                      onChange={e => setOpeningBalanceType(e.target.value as any)}
                      className="w-full bg-white border border-slate-300 rounded-md p-1.5 text-xs focus:ring-1 focus:ring-blue-500 font-semibold"
                    >
                      <option value="debit">مدين (مطلوب منه لنا)</option>
                      <option value="credit">دائن (مستحق له علينا)</option>
                    </select>
                    <span className="text-[9px] text-slate-400 block mt-0.5">تحديد اتجاه الرصيد</span>
                  </div>
                </div>
              </div>

              {/* Detailed Address & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 text-[11px]">العنوان التفصيلي:</label>
                  <input
                    type="text"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="الشارع، البناية، الطابق، بجوار..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-md p-1.5 text-xs focus:bg-white focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 text-[11px]">ملاحظات وشروط خاصة:</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="شروط سداد خاصة، خصومات متفق عليها..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-md p-1.5 text-xs focus:bg-white focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPartyModal(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md cursor-pointer text-xs font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md shadow-xs cursor-pointer text-xs"
                >
                  {editingPartyId ? 'حفظ التعديلات' : 'تسجيل الحساب بالدليل'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Voucher (سند قبض / سند صرف) */}
      {voucherModalParty && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-xl max-w-sm w-full p-4 shadow-xl border border-slate-200">
            <h3 className="font-bold text-xs text-slate-900 mb-1 flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-blue-600" />
              <span>{voucherType === 'receipt' ? 'تحرير سند قبض مالي (استلام)' : 'تحرير سند صرف مالي (دفع)'}</span>
            </h3>
            <p className="text-[10px] text-slate-400 font-light mb-3">
              الطرف: <strong className="text-slate-900">{voucherModalParty.name}</strong> • الرصيد الحالي: {Math.abs(voucherModalParty.balance).toLocaleString('ar-SA')} {settings.currency}
            </p>

            <form onSubmit={handleSaveVoucher} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setVoucherType('receipt')}
                  className={`py-1.5 rounded-md font-bold cursor-pointer transition-colors text-xs ${
                    voucherType === 'receipt' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  سند قبض (استلام)
                </button>
                <button
                  type="button"
                  onClick={() => setVoucherType('payment')}
                  className={`py-1.5 rounded-md font-bold cursor-pointer transition-colors text-xs ${
                    voucherType === 'payment' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  سند صرف (دفع)
                </button>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1 text-[11px]">المبلغ المسدد ({settings.currency}):</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={voucherAmount}
                  onChange={e => setVoucherAmount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md p-1.5 font-bold font-mono text-slate-900 text-xs focus:bg-white focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 text-[11px]">طريقة الدفع:</label>
                  <select
                    value={voucherMethod}
                    onChange={e => setVoucherMethod(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-md p-1.5 text-xs focus:bg-white focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="cash">نقداً من الصندوق</option>
                    <option value="bank_transfer">تحويل بنكي</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1 text-[11px]">الصندوق / الخزينة:</label>
                  <select
                    value={voucherTreasuryCode}
                    onChange={e => setVoucherTreasuryCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-md p-1.5 text-xs focus:bg-white focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="1101">الخزينة الرئيسية (الكاشير)</option>
                    <option value="1102">الحساب البنكي الجاري</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1 text-[11px]">البيان والشرح المحاسبي:</label>
                <input
                  type="text"
                  value={voucherDesc}
                  onChange={e => setVoucherDesc(e.target.value)}
                  placeholder="دفعة على الحساب، سداد فاتورة توريد، تصفية رصيد..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-md p-1.5 text-xs focus:bg-white focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setVoucherModalParty(null)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md cursor-pointer text-xs font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md shadow-xs cursor-pointer text-xs"
                >
                  اعتماد السند وتحديث الرصيد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
