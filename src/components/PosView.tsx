import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react'; // Trigger Sync
import { DateInput } from '../components/common/DateInput';
import { useAccounting } from '../context/AccountingContext';
import { useIsMobile } from '../hooks/useIsMobile';
import { MobilePosView } from './pos/MobilePosView';
import { InventoryItem, PaymentMethod, Invoice, InvoiceItem, Party } from '../types';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { CalculatorModal } from './pos/CalculatorModal';
import { QuickAddItemModal } from './pos/QuickAddItemModal';
import { PriceEditModal } from './pos/PriceEditModal';
import { CustomerLedgerModal } from './pos/CustomerLedgerModal';
import { RequisitionModal } from './pos/RequisitionModal';
import { FavoriteItemsDrawer } from './pos/FavoriteItemsDrawer';
import { InvoicesReviewModal } from './pos/InvoicesReviewModal';
import { HeldInvoicesModal, HeldInvoiceData } from './pos/HeldInvoicesModal';
import { ItemSearchModal } from './pos/ItemSearchModal';
import { ItemAutocompleteInput } from './pos/ItemAutocompleteInput';
import { PosCustomerSearchInput } from './pos/PosCustomerSearchInput';
import { AutocompleteCombobox, ComboboxOption } from './common/AutocompleteCombobox';
import { PosFavoritesSidebar } from './pos/PosFavoritesSidebar';
import { posSound } from '../utils/audio';
import { useHardwareBarcodeScanner } from '../utils/useBarcodeScanner';
import { matchItemByBarcode } from '../utils/barcodeGenerator';
import { findPartyByCodeOrNumber } from '../utils/partyUtils';
import { getAvailableUnitsOfMeasure } from '../utils/unitsOfMeasure';
import {
  Search,
  Barcode,
  Trash2,
  Plus,
  Printer,
  Save,
  RotateCcw,
  SkipBack,
  ChevronRight,
  ChevronLeft,
  SkipForward,
  PauseCircle,
  CreditCard,
  Banknote,
  Percent,
  X,
  Check,
  User,
  Users,
  Building,
  Package,
  Calendar,
  Layers,
  FileText,
  DollarSign,
  HelpCircle,
  Info,
  Tag,
  Star,
  ShoppingBag,
  GitBranch,
  Calculator,
  Truck,
  ArrowRight,
  Camera,
  AlertCircle,
  Coins,
  Sliders,
  Layout,
  Eye,
  EyeOff,
  Palette,
  Columns,
  Maximize2,
  Lock,
  Scan,
  Zap,
  Sparkles,
  Clock,
  CheckCircle2,
  Ruler,
  Paperclip,
  RefreshCw
} from 'lucide-react';
import { PosCustomButton, loadPosCustomButtons, savePosCustomButtons } from '../types/posCustomizer';
import { PosLayoutConfig, DEFAULT_POS_LAYOUT_CONFIG, loadPosLayoutConfig, savePosLayoutConfig } from '../types/posLayoutCustomizer';
import { PosCustomButtonRenderer } from './pos/PosCustomButtonRenderer';
import { DayInvoicesNavigator } from './pos/DayInvoicesNavigator';
import { PosButtonCustomizerModal } from './pos/PosButtonCustomizerModal';
import { PosLayoutDesignerDrawer } from './pos/PosLayoutDesignerDrawer';
import { PosBottomPaymentConsole } from './pos/PosBottomPaymentConsole';
import { SubCustomerField } from './pos/SubCustomerField';
import { PosInlineBarcodeScanner } from './pos/PosInlineBarcodeScanner';
import { CustomerSpecialPricesModal } from './pos/CustomerSpecialPricesModal';
import { PosDailyInvoicesSidebar } from './pos/PosDailyInvoicesSidebar';
import { LineAttachmentsModal } from './pos/LineAttachmentsModal';
import { PosInvoiceWorkflowStatus, LineAttachment } from '../types';
import {
  WORKFLOW_STATUS_OPTIONS,
  getInvoiceWorkflowStatusMeta,
  computeInvoicePaymentStatus,
  getInvoicePaymentStatusMeta,
  isInvoiceAccountingEligible
} from '../utils/invoiceStatusUtils';

export interface PosTableLine {
  id: string;
  barcode: string;
  itemName: string;        // الصنف
  description: string;     // الوصف
  notes: string;           // الملاحظات
  hasDimensions: boolean;  // هل الصنف يحتاج أبعاداً (طول × عرض × عدد)
  length: number;          // الطول
  width: number;           // العرض
  count: number;           // العدد
  quantity: number;        // الكمية
  unit: string;            // الوحدة
  unitPrice: number;       // السعر
  discount: number;        // الخصم
  tax: number;             // الضريبة
  taxRate?: number;        // نسبة الضريبة
  total: number;           // الإجمالي
  attachments: LineAttachment[]; // المرفقات
  inventoryItemId?: string;
}

const generateUniqueLineId = () => `line-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

// Helper to compute strictly sequential and non-repeating invoice numbers
const getNextSequentialInvoiceNumber = (allInvoices: Invoice[]): string => {
  let maxSeq = 0;
  for (const inv of allInvoices || []) {
    if (inv.invoiceNumber) {
      const match = inv.invoiceNumber.match(/\d+/g);
      if (match && match.length > 0) {
        for (const m of match) {
          const num = parseInt(m, 10);
          if (!isNaN(num) && num > maxSeq && num < 100000) {
            maxSeq = num;
          }
        }
      }
    }
  }

  let storedMax = 0;
  try {
    storedMax = parseInt(localStorage.getItem('pos_max_invoice_seq') || '0', 10);
  } catch {
    storedMax = 0;
  }

  const nextSeq = Math.max(maxSeq, storedMax, (allInvoices || []).length) + 1;
  return String(nextSeq);
};

const DraggableDigitalDisplay = ({ amount }: { amount: number }) => {
  const [position] = useState(() => {
    const saved = localStorage.getItem('pos_digital_display_state');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch(e) {}
    }
    return { x: 8, y: 8, w: 226, h: 113 };
  });

  const displayRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, initialX: 0, initialY: 0 });

  useEffect(() => {
    if (displayRef.current) {
      displayRef.current.style.left = `${position.x}px`;
      displayRef.current.style.top = `${position.y}px`;
      displayRef.current.style.width = `${position.w}px`;
      displayRef.current.style.height = `${position.h}px`;
    }
  }, []);

  const saveState = () => {
    if (!displayRef.current) return;
    const newState = {
      x: displayRef.current.offsetLeft,
      y: displayRef.current.offsetTop,
      w: displayRef.current.offsetWidth,
      h: displayRef.current.offsetHeight,
    };
    localStorage.setItem('pos_digital_display_state', JSON.stringify(newState));
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const isResizeZone = e.clientY > rect.bottom - 20 && (e.clientX < rect.left + 20 || e.clientX > rect.right - 20);
    
    if (isResizeZone) {
       const handleResizeEnd = () => {
          saveState();
          window.removeEventListener('mouseup', handleResizeEnd);
       };
       window.addEventListener('mouseup', handleResizeEnd);
       return;
    }

    isDragging.current = true;
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      initialX: displayRef.current?.offsetLeft || 0,
      initialY: displayRef.current?.offsetTop || 0
    };
    
    if (displayRef.current) {
      displayRef.current.style.cursor = 'grabbing';
      displayRef.current.style.opacity = '0.9';
    }

    const handleMouseMove = (ev: MouseEvent) => {
      if (!isDragging.current || !displayRef.current) return;
      ev.preventDefault();
      const dx = ev.clientX - dragStart.current.x;
      const dy = ev.clientY - dragStart.current.y;
      
      const newX = Math.max(0, dragStart.current.initialX + dx);
      const newY = Math.max(0, dragStart.current.initialY + dy);
      
      displayRef.current.style.left = `${newX}px`;
      displayRef.current.style.top = `${newY}px`;
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      if (displayRef.current) {
        displayRef.current.style.cursor = 'grab';
        displayRef.current.style.opacity = '1';
      }
      saveState();
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div 
      ref={displayRef}
      onMouseDown={handleMouseDown}
      className="absolute bg-black border-2 border-slate-700 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.4)] z-[60] px-2 cursor-grab select-none"
      style={{ 
        resize: 'both',
        overflow: 'hidden',
        minWidth: '100px',
        minHeight: '50px'
      }}
    >
      <div className="w-full h-full flex items-center justify-center pointer-events-none">
        <svg viewBox="0 0 100 40" className="w-full h-full drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]">
          <text 
            x="50" 
            y="28" 
            textAnchor="middle" 
            className="fill-red-500 font-black font-mono tabular-nums tracking-tighter"
            style={{ fontSize: amount.toFixed(2).length > 7 ? '22px' : '28px' }}
          >
            {amount.toFixed(2)}
          </text>
        </svg>
      </div>
      
      {/* Icon to indicate dragging capability */}
      <div className="absolute top-1 left-1 opacity-40 pointer-events-none text-slate-500">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 9l-3 3 3 3M9 5l3-3 3 3M9 19l3 3 3-3M19 9l3 3-3 3M2 12h20M12 2v20"/></svg>
      </div>
    </div>
  );
};

export const PosView: React.FC = () => {
  const {
    inventory,
    parties,
    addParty,
    updateParty,
    invoices,
    updateInvoice,
    createPrintOrder,
    settings,
    createPosSale,
    deleteInvoice,
    setSelectedInvoiceForPrint,
    setDirectPrintOptions,
    setSelectedInvoiceForLifecycle,
    setSelectedPartyForStatement,
    setActiveTab,
    employees,
    addEmployee,
    setSelectedEmployeeForStatement,
    treasuries,
    currencies,
    branches,
    activeBranchId,
    currentUser,
    warehouses,
    activeWarehouseId,
    updateSettings,
    hasPermission,
    getItemPriceForCustomer,
    getCurrentUserPricePolicy,
    editingPosInvoiceId,
    setEditingPosInvoiceId
  } = useAccounting();

  // Single-Entry automation notification state
  const [lastSavedInvoiceNotice, setLastSavedInvoiceNotice] = useState<Invoice | null>(null);

  // Multi-Currency State (العملة الأساسية: الشيكل الفلسطيني ₪)
  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState<string>(settings.baseCurrencyCode || 'ILS');
  const activeCurrency = useMemo(() => {
    return currencies.find(c => c.code === selectedCurrencyCode) || currencies.find(c => c.isBase) || {
      code: 'ILS',
      name: 'شيكل',
      symbol: '₪',
      rateAgainstBase: 1.0,
      isBase: true,
      isActive: true
    };
  }, [currencies, selectedCurrencyCode]);

  const [customExchangeRate, setCustomExchangeRate] = useState<number>(activeCurrency.rateAgainstBase || 1.0);

  // Synchronize exchange rate when currency changes
  useEffect(() => {
    setCustomExchangeRate(activeCurrency.rateAgainstBase || 1.0);
  }, [activeCurrency.rateAgainstBase, selectedCurrencyCode]);

  // Active top tab in POS window
  const [activeWindowTab, setActiveWindowTab] = useState<'pos' | 'items' | 'parties' | 'ledger' | 'home'>('pos');

  // Customer & Invoice Header State (Strictly main customers, sub-customers are completely separate)
  const customers = useMemo(() => parties.filter(p => (p.type === 'customer' || p.type === 'both') && !p.isSubCustomer), [parties]);
  const suppliers = useMemo(() => parties.filter(p => p.type === 'supplier' || p.type === 'both'), [parties]);
  const defaultCustomer = customers.find(c => c.name.includes('وقف فلسطين') || c.name.includes('أبو يوسف')) || customers[0];

  // الطرف المستهدف في الكاشير: عميل أو مورد أو موظف
  const [posTargetType, setPosTargetType] = useState<'customer' | 'supplier' | 'employee'>('customer');

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerCode, setCustomerCode] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('عميل كاشير نقدي');
  const [pricingTier, setPricingTier] = useState<'retail' | 'wholesale' | 'special'>('retail');

  // تعيين العميل الافتراضي (CUST-0001) كزبون كاشير رئيسي
  useEffect(() => {
    if (!selectedCustomerId && !editingPosInvoiceId && posTargetType === 'customer' && customerName === 'عميل كاشير نقدي') {
      const defaultCashCust = customers.find(c => c.code === 'CUST-0001' || c.code === '1');
      if (defaultCashCust) {
        setSelectedCustomerId(defaultCashCust.id);
        setCustomerName(defaultCashCust.name);
        setCustomerCode(defaultCashCust.code);
      }
    }
  }, [customers, posTargetType]); // Removed selectedCustomerId and editingPosInvoiceId to prevent blocking manual clear


  // خيارات البحث والمطابقة الذكية حسب نوع الطرف المختار (عميل - مورد - موظف)
  const targetComboboxOptions: ComboboxOption[] = useMemo(() => {
    if (posTargetType === 'customer') {
      return customers.map(c => ({
        id: c.id,
        name: c.name,
        code: c.code,
        subText: c.phone ? `هاتف: ${c.phone}` : (c.address || undefined),
        badge: c.balance ? `${c.balance.toFixed(2)} ₪` : undefined,
        extraSearchCorpus: `${c.phone || ''} ${c.address || ''}`,
        raw: c
      }));
    } else if (posTargetType === 'supplier') {
      return suppliers.map(s => ({
        id: s.id,
        name: s.name,
        code: s.code,
        subText: s.phone ? `هاتف: ${s.phone}` : 'مورد معتمد',
        badge: s.balance ? `${Math.abs(s.balance).toFixed(2)} ₪` : undefined,
        extraSearchCorpus: `${s.phone || ''}`,
        raw: s
      }));
    } else {
      return employees.map(emp => ({
        id: emp.id,
        name: emp.name,
        code: emp.id,
        subText: `${emp.jobTitle || 'موظف'} - ${emp.department || 'عام'}`,
        badge: emp.phone || undefined,
        extraSearchCorpus: `${emp.phone || ''} ${emp.jobTitle || ''}`,
        raw: emp
      }));
    }
  }, [posTargetType, customers, suppliers, employees]);

  // Pricing policies based on current user permissions & role
  const userPricePolicy = useMemo(() => {
    return getCurrentUserPricePolicy(currentUser);
  }, [getCurrentUserPricePolicy, currentUser]);

  const canUserEditPrices = userPricePolicy.canEditPrice;

  // Enforce allowed price tier if user is restricted
  useEffect(() => {
    if (userPricePolicy.allowedTier === 'price1' && pricingTier !== 'retail') {
      setPricingTier('retail');
    } else if (userPricePolicy.allowedTier === 'price2' && pricingTier !== 'wholesale') {
      setPricingTier('wholesale');
    } else if (userPricePolicy.allowedTier === 'price3' && pricingTier !== 'special') {
      setPricingTier('special');
    }
  }, [userPricePolicy.allowedTier, pricingTier]);
  const [transactionType, setTransactionType] = useState<'cash' | 'credit'>('cash');
  const [customCustomerText, setCustomCustomerText] = useState<string>('');
  const [subCustomerId, setSubCustomerId] = useState<string>('');
  const [subCustomerName, setSubCustomerName] = useState<string>('');
  const [subCustomerPhone, setSubCustomerPhone] = useState<string>('');

  // Checkboxes from screenshot
  const [aggregateDuplicateItems, setAggregateDuplicateItems] = useState<boolean>(true);
  const [useLastCustomerPrice, setUseLastCustomerPrice] = useState<boolean>(false);

  // اعتماد كافة وحدات الأصناف المدخلة في البرنامج لجدول الكاشير
  const programUnits = useMemo(() => {
    return getAvailableUnitsOfMeasure(inventory, settings.unitsOfMeasure);
  }, [inventory, settings.unitsOfMeasure]);

  // Left header metadata
  const [branch, setBranch] = useState<string>(() => {
    if (branches && branches.length > 0) {
      const b = branches.find(br => br.id === activeBranchId) || branches[0];
      return b.name;
    }
    return 'الفرع الرئيسي';
  });
  const [warehouse, setWarehouse] = useState<string>(() => {
    if (warehouses && warehouses.length > 0) {
      const w = warehouses.find(wh => wh.id === activeWarehouseId) || warehouses[0];
      return w.name;
    }
    return 'المخزن الرئيسي';
  });
  const [invoiceSeqNumber, setInvoiceSeqNumber] = useState<string>(() => {
    return getNextSequentialInvoiceNumber(invoices);
  });
  const [invoiceDate, setInvoiceDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Header Sub-tools State & Modals
  const [representative, setRepresentative] = useState<string>('مندوب المبيعات الرئيسي');
  const [taxRate, setTaxRate] = useState<number>(settings.vatRate || 0);
  const [taxEnabled, setTaxEnabled] = useState<boolean>(true);
  const [additionalCharges, setAdditionalCharges] = useState<number>(0);
  const [overallDiscount, setOverallDiscount] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'amount' | 'percent'>('amount');
  const [invoiceNotes, setInvoiceNotes] = useState<string>('');
  const [shippingDetails, setShippingDetails] = useState<{ carrier: string; tracking: string; address: string }>({
    carrier: 'توصيل محلي',
    tracking: '',
    address: 'الرياض'
  });

  // Modals for Header Sub-tools
  const [activeHeaderSubModal, setActiveHeaderSubModal] = useState<
    'representative' | 'tax' | 'additional' | 'discount' | 'notes' | 'shipping' | 'details' | 'currency' | null
  >(null);

  // Table Lines State - تصفير شاشة الكاشير عند فتحها كل مرة
  const [tableLines, setTableLines] = useState<PosTableLine[]>([
    {
      id: generateUniqueLineId(),
      barcode: '',
      itemName: '',
      description: '',
      notes: '',
      hasDimensions: false,
      length: 1,
      width: 1,
      count: 1,
      quantity: 1,
      unit: 'حبة',
      unitPrice: 0,
      discount: 0,
      tax: 0,
      total: 0,
      attachments: []
    }
  ]);

  const [activeRowId, setActiveRowId] = useState<string | null>(null);
  const [activeLineForAttachments, setActiveLineForAttachments] = useState<PosTableLine | null>(null);

  // Add delivery service item automatically to table (يحدد له ملاحظات وسعر فقط)
  const handleAddDeliveryServiceLine = useCallback(() => {
    posSound.beep();
    const deliveryLine: PosTableLine = {
      id: generateUniqueLineId(),
      barcode: 'DELIVERY',
      itemName: 'خدمة توصيل',
      description: '',
      notes: 'خدمة توصيل مباشر',
      hasDimensions: false,
      length: 0,
      width: 0,
      count: 1,
      quantity: 1,
      unit: 'خدمة',
      unitPrice: 15,
      discount: 0,
      tax: 0,
      total: 15,
      attachments: [],
      inventoryItemId: 'srv-delivery'
    };

    setTableLines(prev => {
      if (prev.length === 1 && !prev[0].itemName.trim() && prev[0].unitPrice === 0) {
        return [{ ...deliveryLine, id: prev[0].id }];
      }
      return [deliveryLine, ...prev];
    });
    setActiveRowId(deliveryLine.id);
  }, []);

  // Bottom Payment State (الدفع النقدي، الدفع البنكي، العملات، والصناديق)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [selectedTreasuryCode, setSelectedTreasuryCode] = useState<string>('1101');

  // 1. Cash Payment State (المبلغ، العملة، سعر الصرف، الصندوق)
  const [cashAmountInput, setCashAmountInput] = useState<string>('0');
  const currentEditingInvoiceIdRef = useRef<string | null>(null);
  
  useEffect(() => {
    currentEditingInvoiceIdRef.current = editingPosInvoiceId;
  }, [editingPosInvoiceId]);
  const [cashCurrencyCode, setCashCurrencyCode] = useState<string>('ILS');
  const [cashExchangeRate, setCashExchangeRate] = useState<number>(1.0);
  const [cashTreasuryCode, setCashTreasuryCode] = useState<string>(() => {
    const def = treasuries?.find(t => t.type === 'cash_box' || t.isDefault);
    return def?.accountCode || '1101';
  });

  // 2. Bank Payment State (المبلغ، عملة الدفع، سعر الصرف، الصندوق)
  const [bankAmountInput, setBankAmountInput] = useState<string>('0');
  const [bankCurrencyCode, setBankCurrencyCode] = useState<string>('ILS');
  const [bankExchangeRate, setBankExchangeRate] = useState<number>(1.0);
  const [bankTreasuryCode, setBankTreasuryCode] = useState<string>(() => {
    const def = treasuries?.find(t => t.type === 'bank_account' || t.type === 'bank_app' || t.type === 'pos_terminal' || t.accountCode === '1102');
    return def?.accountCode || '1102';
  });

  // Handle invoice exchange rate updates
  const handleExchangeRateChange = (newRate: number) => {
    const validRate = newRate > 0 ? newRate : 1.0;
    setCustomExchangeRate(validRate);
  };

  // Modals from Left Action Panel
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddInitialName, setQuickAddInitialName] = useState<string>('');
  const [isPriceEditOpen, setIsPriceEditOpen] = useState(false);
  const [isCustomerLedgerOpen, setIsCustomerLedgerOpen] = useState(false);
  const [isRequisitionOpen, setIsRequisitionOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [isInvoicesReviewOpen, setIsInvoicesReviewOpen] = useState(false);
  const [isHeldInvoicesOpen, setIsHeldInvoicesOpen] = useState(false);
  const [isItemSearchOpen, setIsItemSearchOpen] = useState(false);
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);

  // Barcode Hand Mode (تفعيل يد الباركود والكاميرا الذكية)
  const [isBarcodeHandMode, setIsBarcodeHandMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('pos_barcode_hand_mode') === 'true';
    } catch {
      return false;
    }
  });

  const [quickBarcodeVal, setQuickBarcodeVal] = useState<string>('');
  const [isInlineCameraOpen, setIsInlineCameraOpen] = useState<boolean>(false);
  const [barcodeNotFoundAlert, setBarcodeNotFoundAlert] = useState<string | null>(null);

  useEffect(() => {
    if (barcodeNotFoundAlert) {
      const timer = setTimeout(() => {
        setBarcodeNotFoundAlert(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [barcodeNotFoundAlert]);

  // Invoice Workflow Status (حالة فاتورة الكاشير: جديدة، قيد التصميم، قيد التنفيذ، جاهزة للتسليم، مسلمة)
  const [invoiceWorkflowStatus, setInvoiceWorkflowStatus] = useState<PosInvoiceWorkflowStatus>('new');

  // Customer Special Prices Modal
  const [isSpecialPricesModalOpen, setIsSpecialPricesModalOpen] = useState(false);

  // Daily Invoices & Statuses Sidebar
  const [isDailyInvoicesOpen, setIsDailyInvoicesOpen] = useState(false);

  // Refs for auto-focusing inputs and 5-second inactivity timer
  const barcodeInputRef = useRef<HTMLInputElement | null>(null);
  const quantityInputRef = useRef<HTMLInputElement | null>(null);
  const customerInputRef = useRef<HTMLInputElement | null>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  // POS Buttons & UI Customization State (خاصة بكل مستخدم)
  const [posButtons, setPosButtons] = useState<PosCustomButton[]>(() => loadPosCustomButtons(currentUser?.id));
  const [isLiveCustomizing, setIsLiveCustomizing] = useState<boolean>(false);
  const [isButtonCustomizerOpen, setIsButtonCustomizerOpen] = useState<boolean>(false);

  // POS Screen Layout & Designer State (خاصة بكل مستخدم)
  const [posLayoutConfig, setPosLayoutConfig] = useState<PosLayoutConfig>(() => {
    try {
      if (settings?.defaultPosLayout && typeof settings.defaultPosLayout === 'object') {
        return {
          ...DEFAULT_POS_LAYOUT_CONFIG,
          ...settings.defaultPosLayout,
          showFavoritesSidebar: settings.defaultPosLayout.showFavoritesSidebar !== undefined ? Boolean(settings.defaultPosLayout.showFavoritesSidebar) : true,
          tableColumns: {
            ...DEFAULT_POS_LAYOUT_CONFIG.tableColumns,
            ...(settings.defaultPosLayout.tableColumns || {}),
            showCount: settings.defaultPosLayout.tableColumns?.showCount !== undefined ? Boolean(settings.defaultPosLayout.tableColumns.showCount) : true
          }
        };
      }
      const cfg = loadPosLayoutConfig(currentUser?.id);
      return cfg && typeof cfg === 'object' ? cfg : DEFAULT_POS_LAYOUT_CONFIG;
    } catch {
      return DEFAULT_POS_LAYOUT_CONFIG;
    }
  });

  // Re-sync layout and buttons if user switches
  useEffect(() => {
    if (currentUser?.id) {
      const userButtons = loadPosCustomButtons(currentUser.id);
      setPosButtons(userButtons);
      const userConfig = loadPosLayoutConfig(currentUser.id);
      setPosLayoutConfig(userConfig);
      if (userConfig.isDateLocked && userConfig.lockedDate) {
        setInvoiceDate(userConfig.lockedDate);
      }
    }
  }, [currentUser?.id]);

  const [isLayoutDesignerOpen, setIsLayoutDesignerOpen] = useState<boolean>(false);

  const handleSavePosLayoutConfig = (newConfig: PosLayoutConfig) => {
    const safeConfig = newConfig && typeof newConfig === 'object' ? newConfig : DEFAULT_POS_LAYOUT_CONFIG;
    setPosLayoutConfig(safeConfig);
    savePosLayoutConfig(safeConfig, currentUser?.id);
  };

  const handleToggleLayoutSection = (key: keyof PosLayoutConfig) => {
    setPosLayoutConfig(prev => {
      const base = prev || DEFAULT_POS_LAYOUT_CONFIG;
      const updated = {
        ...base,
        [key]: !base[key]
      };
      savePosLayoutConfig(updated, currentUser?.id);
      return updated;
    });
  };

  const handleSavePosButtons = (newButtons: PosCustomButton[]) => {
    setPosButtons(newButtons);
    savePosCustomButtons(newButtons, currentUser?.id);
  };

  // Live in-place button reordering (swap with adjacent button)
  const handleMoveButtonInLive = (buttonId: string, direction: 'left' | 'right') => {
    setPosButtons(prev => {
      const targetBtn = prev.find(b => b.id === buttonId);
      if (!targetBtn) return prev;

      const sectionButtons = prev
        .filter(b => b.location === targetBtn.location)
        .sort((a, b) => a.order - b.order);

      const currentIndex = sectionButtons.findIndex(b => b.id === buttonId);
      if (currentIndex === -1) return prev;

      // In RTL display: 'right' means towards beginning (previous in list), 'left' means towards end (next in list)
      const targetIndex = direction === 'right' ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= sectionButtons.length) return prev;

      const reordered = [...sectionButtons];
      const temp = reordered[currentIndex];
      reordered[currentIndex] = reordered[targetIndex];
      reordered[targetIndex] = temp;

      const updatedSection = reordered.map((btn, idx) => ({ ...btn, order: idx + 1 }));
      const others = prev.filter(b => b.location !== targetBtn.location);
      const combined = [...others, ...updatedSection];
      savePosCustomButtons(combined);
      return combined;
    });
  };

  const handleDeleteButtonInLive = (buttonId: string) => {
    if (confirm('هل ترغب في إخفاء أو حذف هذا الزر من الواجهة؟')) {
      setPosButtons(prev => {
        const filtered = prev.filter(b => b.id !== buttonId);
        savePosCustomButtons(filtered);
        return filtered;
      });
    }
  };

  // Dynamic Button Action Dispatcher
  const handleExecuteButtonAction = (button: PosCustomButton) => {
    switch (button.actionType) {
      case 'save_invoice':
        handleSaveInvoice('none', true);
        break;
      case 'save_and_print':
        handleSaveInvoice('prompt', true);
        break;
      case 'save_and_print_a4_custom':
        handleSaveInvoice('a4-custom-direct', true);
        break;
      case 'quick_pay_cash':
        handleQuickPayCash('none');
        break;
      case 'pay_cash_and_print':
        handleQuickPayCash('prompt');
        break;
      case 'pay_cash_and_print_a4_custom':
        handleQuickPayCash('a4-custom-direct');
        break;
      case 'quick_pay_card':
        handleQuickPayCard('prompt');
        break;
      case 'hold_invoice':
        handleHoldInvoice();
        break;
      case 'held_invoices_list':
        setIsHeldInvoicesOpen(true);
        break;
      case 'clear_invoice':
        handleClearInvoice();
        break;
      case 'nav_first':
        handleNavFirst();
        break;
      case 'nav_prev':
        handleNavPrev();
        break;
      case 'nav_next':
        handleNavNext();
        break;
      case 'nav_last':
        handleNavLast();
        break;
      case 'delete_invoice':
        if (invoices.length > 0 && confirm('هل ترغب في حذف آخر فاتورة مسجلة؟')) {
          deleteInvoice(invoices[0].id);
        }
        break;
      case 'refresh_data':
        window.location.reload();
        break;
      case 'search_invoices':
        setIsInvoicesReviewOpen(true);
        break;
      case 'open_customer_ledger':
        setIsCustomerLedgerOpen(true);
        break;
      case 'open_favorite_drawer':
        setIsFavoritesOpen(true);
        break;
      case 'open_item_search':
        setIsItemSearchOpen(true);
        break;
      case 'open_calculator':
        setIsCalculatorOpen(true);
        break;
      case 'open_camera_scanner':
        setIsInlineCameraOpen(prev => !prev);
        break;
      case 'open_cash_drawer':
        posSound.playCashBeep();
        alert('تم فتح درج النقدية بنجاح ⛁');
        break;
      case 'quick_discount_percent': {
        const pct = Number(button.actionPayload) || 5;
        setDiscountType('percent');
        setOverallDiscount(pct);
        posSound.beep();
        break;
      }
      case 'quick_discount_amount': {
        const amt = Number(button.actionPayload) || 10;
        setDiscountType('amount');
        setOverallDiscount(amt);
        posSound.beep();
        break;
      }
      case 'insert_item': {
        const it = inventory.find(i => i.id === button.actionPayload);
        if (it) {
          posSound.playCashBeep();
          handleAddItemToTable(it);
        }
        break;
      }
      case 'sound_test':
        posSound.playCashBeep();
        break;
      case 'open_invoice_details':
        handleOpenInvoiceDetailsPreview();
        break;
      case 'open_daily_invoices':
        setIsDailyInvoicesOpen(true);
        break;
      case 'add_delivery_service':
        handleAddDeliveryServiceLine();
        break;
      default:
        console.log('Action type not mapped:', button.actionType);
    }
  };

  // Held invoices with localStorage persistence
  const [heldInvoices, setHeldInvoices] = useState<HeldInvoiceData[]>(() => {
    try {
      const raw = localStorage.getItem('pos_held_invoices');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('pos_held_invoices', JSON.stringify(heldInvoices));
    } catch (e) {
      console.error(e);
    }
  }, [heldInvoices]);

  // Selected customer object
  const currentCustomer = parties.find(p => p.id === selectedCustomerId);

  // Sync customer code and balance when customer selection changes
  useEffect(() => {
    if (currentCustomer) {
      setCustomerName(currentCustomer.name);
      setCustomerCode(currentCustomer.code || '');
      // Removed auto-filling of customCustomerText based on user request
    }
  }, [selectedCustomerId, currentCustomer]);

  // Financial Calculations
  const calculatedSubtotal = useMemo(() => {
    return tableLines.reduce((sum, line) => sum + line.total, 0);
  }, [tableLines]);

  const activeTableLines = useMemo(() => {
    return tableLines.filter(l => (l.itemName && l.itemName.trim() !== '') || l.unitPrice > 0 || l.total > 0);
  }, [tableLines]);

  const activeItemsCount = activeTableLines.length;

  const totalPiecesCount = useMemo(() => {
    return activeTableLines.reduce((sum, l) => sum + (Number(l.quantity) || 0), 0);
  }, [activeTableLines]);

  const calculatedDiscountTotal = useMemo(() => {
    if (discountType === 'percent') {
      return (calculatedSubtotal * overallDiscount) / 100;
    }
    return overallDiscount;
  }, [calculatedSubtotal, overallDiscount, discountType]);

  const effectiveTaxRate = taxEnabled ? taxRate : 0;
  const netBeforeTax = Math.max(0, calculatedSubtotal - calculatedDiscountTotal);
  
  const calculatedTaxAmount = useMemo(() => {
    if (effectiveTaxRate > 0) {
      return Number(((netBeforeTax * effectiveTaxRate) / 100).toFixed(2));
    }
    // إذا لم تكن هناك ضريبة عامة، يتم حساب مجموع ضرائب البنود
    return tableLines.reduce((acc, line) => acc + (Number(line.tax) || 0), 0);
  }, [effectiveTaxRate, netBeforeTax, tableLines]);

  const calculatedTotalAmount = Number((netBeforeTax + calculatedTaxAmount + additionalCharges).toFixed(2));

  // Calculate Cash and Bank Payments in Base Currency (₪)
  const numCashAmount = parseFloat(cashAmountInput) || 0;
  const numCashRate = cashExchangeRate > 0 ? cashExchangeRate : 1.0;
  const cashPaidBase = Number((numCashAmount * numCashRate).toFixed(2));

  const numBankAmount = parseFloat(bankAmountInput) || 0;
  const numBankRate = bankExchangeRate > 0 ? bankExchangeRate : 1.0;
  const bankPaidBase = Number((numBankAmount * numBankRate).toFixed(2));

  const parsedPaidAmount = Number((cashPaidBase + bankPaidBase).toFixed(2));
  const calculatedRemaining = Math.max(0, Number((calculatedTotalAmount - parsedPaidAmount).toFixed(2)));

  const currentPaymentStatus = computeInvoicePaymentStatus({
    totalAmount: calculatedTotalAmount,
    paidAmount: parsedPaidAmount,
    remainingAmount: calculatedRemaining,
    cashPaidAmount: cashPaidBase,
    bankPaidAmount: bankPaidBase,
    paymentMethod: parsedPaidAmount <= 0 ? 'credit' : (bankPaidBase > 0 ? 'card' : 'cash'),
  });
  const currentPaymentStatusMeta = getInvoicePaymentStatusMeta(currentPaymentStatus);

  // Track latest state in a ref for safe auto-hold when cashier leaves, switches screens or closes tab
  const latestPosStateRef = useRef({
    tableLines,
    customerName,
    selectedCustomerId,
    customCustomerText,
    calculatedTotalAmount,
    invoiceNotes,
    invoiceSeqNumber
  });

  useEffect(() => {
    latestPosStateRef.current = {
      tableLines,
      customerName,
      selectedCustomerId,
      customCustomerText,
      calculatedTotalAmount,
      invoiceNotes,
      invoiceSeqNumber
    };
  });

  // Auto-hold current invoice if screen is closed/unmounted with items present (حال إغلاق شاشة الكاشير لأي سبب ووجود أصناف مدرجة يتم وضع الفاتورة كمعلقة)
  const autoHoldIfItemsPresent = useCallback(() => {
    const s = latestPosStateRef.current;
    const activeLines = (s.tableLines || []).filter(
      l => (l.itemName && l.itemName.trim() !== '') || l.unitPrice > 0 || l.total > 0
    );

    if (activeLines.length > 0) {
      const autoHeld: HeldInvoiceData = {
        id: 'held-' + Date.now(),
        heldAt: new Date().toLocaleTimeString('ar-SA'),
        customerName: s.customerName || s.customCustomerText || 'عميل كاشير',
        customerId: s.selectedCustomerId,
        customCustomerText: s.customCustomerText,
        lines: activeLines,
        totalAmount: s.calculatedTotalAmount,
        notes: s.invoiceNotes ? `معلقة تلقائياً: ${s.invoiceNotes}` : 'معلقة تلقائياً عند إغلاق أو مغادرة شاشة الكاشير'
      };

      try {
        const raw = localStorage.getItem('pos_held_invoices');
        const list: HeldInvoiceData[] = raw ? JSON.parse(raw) : [];
        const isDuplicate = list.some(
          h => h.totalAmount === autoHeld.totalAmount && h.lines.length === autoHeld.lines.length
        );
        if (!isDuplicate) {
          list.unshift(autoHeld);
          localStorage.setItem('pos_held_invoices', JSON.stringify(list));
        }
      } catch (e) {
        console.error('Error auto-holding on close', e);
      }
    }
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      autoHoldIfItemsPresent();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      autoHoldIfItemsPresent();
    };
  }, [autoHoldIfItemsPresent]);

  // Quick Action Helpers - زر كامل يضع قيمة المتبقي مع الاحتفاظ بأي قيمة دفع أخرى موجودة
  const handleQuickFullCash = () => {
    // 1. حساب المبلغ المدفوع بالبنك حالياً بالعملة الأساسية (الشيكل)
    const currentBankAmount = parseFloat(bankAmountInput) || 0;
    const bRate = bankExchangeRate > 0 ? bankExchangeRate : 1.0;
    const currentBankPaidBase = Number((currentBankAmount * bRate).toFixed(2));

    // 2. حساب المبلغ المتبقي بعد خصم أي مدفوعات بنكية سابقة
    const remainingBase = Math.max(0, Number((calculatedTotalAmount - currentBankPaidBase).toFixed(2)));

    // 3. تحويل المبلغ المتبقي لعملة الدفع النقدي المختارة
    const cRate = cashExchangeRate > 0 ? cashExchangeRate : 1.0;
    const reqCash = Number((remainingBase / cRate).toFixed(2));

    // 4. تعيين المتبقي في خانة الدفع النقدي مع الاحتفاظ بالدفع البنكي كما هو دون تصفيره
    setCashAmountInput(String(reqCash));

    // 5. تحديد طريقة الدفع المناسبة
    if (currentBankAmount > 0 && reqCash > 0) {
      setPaymentMethod('split');
    } else if (reqCash > 0) {
      setPaymentMethod('cash');
    } else if (currentBankAmount > 0) {
      setPaymentMethod('card');
    } else {
      setPaymentMethod('cash');
    }
  };

  const handleQuickFullBank = () => {
    // 1. حساب المبلغ المدفوع نقداً حالياً بالعملة الأساسية (الشيكل)
    const currentCashAmount = parseFloat(cashAmountInput) || 0;
    const cRate = cashExchangeRate > 0 ? cashExchangeRate : 1.0;
    const currentCashPaidBase = Number((currentCashAmount * cRate).toFixed(2));

    // 2. حساب المبلغ المتبقي بعد خصم أي مدفوعات نقدية سابقة
    const remainingBase = Math.max(0, Number((calculatedTotalAmount - currentCashPaidBase).toFixed(2)));

    // 3. تحويل المبلغ المتبقي لعملة الدفع البنكي المختارة
    const bRate = bankExchangeRate > 0 ? bankExchangeRate : 1.0;
    const reqBank = Number((remainingBase / bRate).toFixed(2));

    // 4. تعيين المتبقي في خانة الدفع البنكي مع الاحتفاظ بالدفع النقدي كما هو دون تصفيره
    setBankAmountInput(String(reqBank));

    // 5. تحديد طريقة الدفع المناسبة
    if (currentCashAmount > 0 && reqBank > 0) {
      setPaymentMethod('split');
    } else if (reqBank > 0) {
      setPaymentMethod('card');
    } else if (currentCashAmount > 0) {
      setPaymentMethod('cash');
    } else {
      setPaymentMethod('card');
    }
  };

  const handleQuickCredit = () => {
    setCashAmountInput('0');
    setBankAmountInput('0');
    setPaymentMethod('credit');
  };

  // Quantity and Area Totals for table footer (synced with active lines)
  const totalItemsCount = activeItemsCount;

  // Formula to calculate row values based on user specifications:
  // حساب الأبعاد
  // إذا كان الصنف يحتاج أبعاداً:
  // الكمية = الطول × العرض × العدد
  // مثال: 2 متر × 3 متر × 2 = 12 متر مربع. إذا كان السعر 25: 12 × 25 = 300.
  // أما الصنف العادي فيستخدم كمية مباشرة.
  const calculateLineValues = useCallback((
    hasDimensions: boolean,
    length: number,
    width: number,
    count: number,
    rawQuantity: number,
    unitPrice: number,
    discount: number = 0,
    lineTax?: number
  ) => {
    let effectiveQuantity = Number(rawQuantity) || 1;
    if (hasDimensions) {
      const l = Number(length) || 0;
      const w = Number(width) || 0;
      const c = Number(count) || 1;
      effectiveQuantity = Number((l * w * c).toFixed(3));
    }

    const price = Number(unitPrice) || 0;
    const subtotal = effectiveQuantity * price;
    const lineDiscount = Number(discount) || 0;
    const net = Math.max(0, subtotal - lineDiscount);
    const lineTaxRate = taxEnabled ? taxRate : 0;
    const calculatedTax = lineTax !== undefined ? lineTax : Number(((net * lineTaxRate) / 100).toFixed(2));
    const total = Number((net + calculatedTax).toFixed(2));

    return {
      quantity: effectiveQuantity,
      subtotal: Number(subtotal.toFixed(2)),
      tax: calculatedTax,
      total
    };
  }, [taxEnabled, taxRate]);

  const calculateLineTotal = (
    length: number,
    width: number,
    qty: number,
    price: number,
    count: number = 1,
    hasDimensions: boolean = false,
    discount: number = 0,
    tax: number = 0
  ) => {
    return calculateLineValues(hasDimensions, length, width, count, qty, price, discount, tax).total;
  };

  // Add new empty row
  const handleAddNewRow = () => {
    const newLine: PosTableLine = {
      id: generateUniqueLineId(),
      barcode: '',
      itemName: '',
      description: '',
      notes: '',
      hasDimensions: false,
      length: 1,
      width: 1,
      count: 1,
      quantity: 1,
      unit: 'حبة',
      unitPrice: 0,
      discount: 0,
      tax: 0,
      total: 0,
      attachments: []
    };
    setTableLines(prev => [newLine, ...prev]);
    setActiveRowId(newLine.id);
    return newLine.id;
  };

  const isCashCustomer = useMemo(() => {
    return !selectedCustomerId ||
      selectedCustomerId === 'pt-cust-1' ||
      customerCode === '1' ||
      customerCode === 'CUST-0001' ||
      customerName.trim() === 'عميل كاشير نقدي' ||
      customerName.trim() === 'عميل نقدي' ||
      customerName.trim() === 'زبون عام';
  }, [selectedCustomerId, customerCode, customerName]);

  const effectivePricingCustomerId = useMemo(() => {
    if (subCustomerId) return subCustomerId;
    if (isCashCustomer) return undefined;
    return selectedCustomerId;
  }, [subCustomerId, isCashCustomer, selectedCustomerId]);

  const effectivePricingCustomerObj = useMemo(() => {
    return parties.find(p => p.id === effectivePricingCustomerId) || null;
  }, [parties, effectivePricingCustomerId]);

  // Current customer object for special pricing lookup
  const selectedCustomerObj = useMemo(() => {
    return parties.find(p => p.id === selectedCustomerId) || null;
  }, [parties, selectedCustomerId]);

  // Compute item effective price honoring customer special prices & pricing tier
  const getItemEffectivePrice = useCallback((item: InventoryItem, tier: string = pricingTier): number => {
    const res = getItemPriceForCustomer(item, effectivePricingCustomerId, tier as any);
    return res.price;
  }, [getItemPriceForCustomer, effectivePricingCustomerId, pricingTier]);

  // Apply customer specific pricing to all lines currently in the table
  const applyCustomerPricingToLines = useCallback((
    customer: Party | null | undefined,
    currentLines: PosTableLine[],
    tierOverride?: 'retail' | 'wholesale' | 'special'
  ): PosTableLine[] => {
    const activeTier = tierOverride || pricingTier;
    return currentLines.map(line => {
      const item = inventory.find(i => 
        (line.inventoryItemId && i.id === line.inventoryItemId) || 
        (line.barcode && matchItemByBarcode(i, line.barcode)) || 
        i.name === line.itemName
      );
      if (!item) return line;

      const res = getItemPriceForCustomer(item, customer?.id, activeTier);
      const effectivePrice = res.price;

      const calc = calculateLineValues(
        line.hasDimensions,
        Number(line.length) || 0,
        Number(line.width) || 0,
        Number(line.count) || 1,
        Number(line.quantity) || 1,
        effectivePrice,
        Number(line.discount) || 0,
        (taxEnabled && taxRate > 0) ? undefined : line.tax
      );

      return {
        ...line,
        inventoryItemId: item.id,
        unitPrice: effectivePrice,
        quantity: calc.quantity,
        tax: calc.tax,
        total: calc.total
      };
    });
  }, [inventory, pricingTier, calculateLineValues, getItemPriceForCustomer]);

  // 10-second Inactivity timer: automatically returns focus to barcode input when in Barcode Hand Mode
  const resetInactivityTimer = useCallback(() => {
    if (!isBarcodeHandMode) return;
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    inactivityTimerRef.current = setTimeout(() => {
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus();
        barcodeInputRef.current.select();
      }
    }, 10000); // 10 seconds of no mouse or keyboard movement
  }, [isBarcodeHandMode]);

  // Track mouse and keyboard activity when Barcode Hand Mode is active
  useEffect(() => {
    if (!isBarcodeHandMode) {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      return;
    }

    const handleUserActivity = () => {
      resetInactivityTimer();
    };

    window.addEventListener('mousemove', handleUserActivity, { passive: true });
    window.addEventListener('keydown', handleUserActivity, { passive: true });
    window.addEventListener('pointerdown', handleUserActivity, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('pointerdown', handleUserActivity);
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [isBarcodeHandMode, resetInactivityTimer]);

  // Toggle Barcode Hand Mode
  const toggleBarcodeHandMode = (val: boolean) => {
    setIsBarcodeHandMode(val);
    try {
      localStorage.setItem('pos_barcode_hand_mode', String(val));
    } catch {}
    if (val) {
      posSound.beep();
      setTimeout(() => {
        if (barcodeInputRef.current) {
          barcodeInputRef.current.focus();
          barcodeInputRef.current.select();
        }
      }, 100);
    }
  };

  // Update line field with full dimension and calculation support
  const handleUpdateLine = (id: string, field: keyof PosTableLine, value: any) => {
    resetInactivityTimer();
    setTableLines(prev =>
      prev.map(line => {
        if (line.id !== id) return line;

        const updated = { ...line, [field]: value };

        // If user enters length or width and hasDimensions was false, auto-enable hasDimensions
        if ((field === 'length' || field === 'width') && Number(value) > 0 && !line.hasDimensions) {
          updated.hasDimensions = true;
          if (!updated.unit || updated.unit === 'حبة' || updated.unit === 'قطعة') {
            updated.unit = 'م²';
          }
        }

        // If toggling hasDimensions on, ensure length/width/count have reasonable defaults
        if (field === 'hasDimensions' && value === true) {
          if (!updated.length || updated.length <= 0) updated.length = 1;
          if (!updated.width || updated.width <= 0) updated.width = 1;
          if (!updated.count || updated.count <= 0) updated.count = 1;
          if (!updated.unit || updated.unit === 'حبة' || updated.unit === 'قطعة') {
            updated.unit = 'م²';
          }
        }

        // Recalculate line totals and dimensional quantities
        if (['length', 'width', 'count', 'quantity', 'unitPrice', 'discount', 'tax', 'hasDimensions'].includes(field)) {
          const isQtyDirectEdit = field === 'quantity' && !updated.hasDimensions;
          const rawQty = isQtyDirectEdit ? (Number(value) || 1) : updated.quantity;

          const calc = calculateLineValues(
            updated.hasDimensions,
            Number(updated.length) || 0,
            Number(updated.width) || 0,
            Number(updated.count) || 1,
            rawQty,
            Number(updated.unitPrice) || 0,
            Number(updated.discount) || 0,
            field === 'tax' ? Number(value) : ((taxEnabled && taxRate > 0) ? undefined : updated.tax)
          );

          updated.quantity = calc.quantity;
          if (field !== 'tax') {
            updated.tax = calc.tax;
          }
          updated.total = calc.total;
        }

        // If unit price was updated for a registered customer, automatically adopt it as their special price
        if (field === 'unitPrice' && effectivePricingCustomerId && Number(value) > 0) {
          const item = inventory.find(i => 
            (line.inventoryItemId && i.id === line.inventoryItemId) ||
            (line.barcode && matchItemByBarcode(i, line.barcode)) ||
            i.name === line.itemName
          );
          if (item && effectivePricingCustomerObj) {
            const currentSpecial = effectivePricingCustomerObj.specialPrices || {};
            const updatedSpecial = { ...currentSpecial, [item.id]: Number(value) };
            updateParty(effectivePricingCustomerId, { specialPrices: updatedSpecial });
          }
        }

        return updated;
      })
    );
  };

  // Delete line
  const handleDeleteLine = (id: string) => {
    posSound.error();
    setTableLines(prev => prev.filter(l => l.id !== id));
  };

  // Add item from search or favorites into table
  const handleAddItemToTable = useCallback((item: InventoryItem) => {
    posSound.beep();
    const price = getItemEffectivePrice(item);

    const isDimensionItem = Boolean(
      item.unitCalculationType === 'area' || 
      item.unitCalculationType === 'linear' ||
      item.category === 'print_raw' || 
      item.category === 'print_service' ||
      item.name.includes('متر') || 
      item.name.includes('بنر') || 
      item.name.includes('فلكس') || 
      item.name.includes('لوحة') || 
      item.name.includes('استيكر') ||
      item.unit === 'م²' || 
      item.unit === 'متر مربع'
    );

    if (aggregateDuplicateItems) {
      const existingLine = tableLines.find(
        l => l.inventoryItemId === item.id || (l.barcode && matchItemByBarcode(item, l.barcode)) || l.itemName === item.name
      );

      if (existingLine) {
        if (existingLine.hasDimensions) {
          const newCount = (existingLine.count || 1) + 1;
          const calc = calculateLineValues(
            true,
            existingLine.length,
            existingLine.width,
            newCount,
            existingLine.quantity,
            existingLine.unitPrice,
            existingLine.discount,
            (taxEnabled && taxRate > 0) ? undefined : existingLine.tax
          );
          setTableLines(prev =>
            prev.map(l => (l.id === existingLine.id ? { ...l, count: newCount, quantity: calc.quantity, total: calc.total } : l))
          );
        } else {
          const newQty = existingLine.quantity + 1;
          const calc = calculateLineValues(
            false,
            existingLine.length,
            existingLine.width,
            existingLine.count,
            newQty,
            existingLine.unitPrice,
            existingLine.discount,
            (taxEnabled && taxRate > 0) ? undefined : existingLine.tax
          );
          setTableLines(prev =>
            prev.map(l => (l.id === existingLine.id ? { ...l, quantity: calc.quantity, total: calc.total } : l))
          );
        }
        setActiveRowId(existingLine.id);
        return;
      }
    }

    const defaultLength = isDimensionItem ? 1 : 0;
    const defaultWidth = isDimensionItem ? 1 : 0;
    const defaultCount = 1;
    const initialQty = isDimensionItem ? (defaultLength * defaultWidth * defaultCount) : 1;
    const initialTotal = Number((initialQty * price).toFixed(2));

    const newLine: PosTableLine = {
      id: generateUniqueLineId(),
      barcode: item.barcode || '',
      itemName: item.name,
      description: item.category === 'shields_gifts' ? 'شكر وعرفان وتكريم' : '',
      notes: '',
      hasDimensions: isDimensionItem,
      length: defaultLength,
      width: defaultWidth,
      count: defaultCount,
      quantity: initialQty,
      unit: item.unit || (isDimensionItem ? 'م²' : 'حبة'),
      unitPrice: price,
      discount: 0,
      tax: 0,
      total: initialTotal,
      attachments: [],
      inventoryItemId: item.id
    };

    // If table currently has only one empty line, replace it with the chosen item
    if (tableLines.length === 1 && !tableLines[0].itemName.trim() && tableLines[0].unitPrice === 0) {
      setTableLines([{ ...newLine, id: tableLines[0].id }]);
      setActiveRowId(tableLines[0].id);
      return;
    }

    setTableLines(prev => [newLine, ...prev]);
    setActiveRowId(newLine.id);
  }, [aggregateDuplicateItems, getItemEffectivePrice, tableLines, calculateLineValues]);

  // Unified barcode scanned handler (from hardware USB gun or camera)
  const handleBarcodeScanned = useCallback((scannedCode: string) => {
    const cleanCode = scannedCode.trim();
    if (!cleanCode) return;
    const item = inventory.find(i => matchItemByBarcode(i, cleanCode));
    if (item) {
      setBarcodeNotFoundAlert(null);
      handleAddItemToTable(item);
      // Auto transition cursor to Quantity field ONLY when Barcode Hand Mode is active
      if (isBarcodeHandMode) {
        setTimeout(() => {
          if (quantityInputRef.current) {
            quantityInputRef.current.focus();
            quantityInputRef.current.select();
          }
          resetInactivityTimer();
        }, 80);
      }
    } else {
      posSound.error();
      setBarcodeNotFoundAlert(cleanCode);
      alert(`الصنف غير موجود\nالباركود: [${cleanCode}]`);
    }
  }, [inventory, handleAddItemToTable, isBarcodeHandMode, resetInactivityTimer]);

  // Barcode Lookup in row (supports primary & multi-barcodes)
  const handleBarcodeChangeInRow = (id: string, code: string) => {
    handleUpdateLine(id, 'barcode', code);

    if (!code) return;
    const item = inventory.find(i => matchItemByBarcode(i, code));
    if (item) {
      posSound.beep();
      const price = getItemEffectivePrice(item);
      setTableLines(prev =>
        prev.map(line => {
          if (line.id !== id) return line;
          const isDimensionItem = Boolean(
            item.unitCalculationType === 'area' || 
            item.unitCalculationType === 'linear' ||
            item.category === 'print_raw' || 
            item.category === 'print_service' ||
            item.name.includes('متر') || 
            item.name.includes('بنر') || 
            item.name.includes('فلكس') || 
            item.name.includes('لوحة') || 
            item.name.includes('استيكر') ||
            item.unit === 'م²' || 
            item.unit === 'متر مربع'
          );
          const hasDims = line.hasDimensions || isDimensionItem;
          const length = hasDims ? (line.length > 0 ? line.length : 1) : line.length;
          const width = hasDims ? (line.width > 0 ? line.width : 1) : line.width;
          const count = line.count || 1;
          const calc = calculateLineValues(
            hasDims,
            length,
            width,
            count,
            line.quantity,
            price,
            line.discount,
            (taxEnabled && taxRate > 0) ? undefined : line.tax
          );
          return {
            ...line,
            itemName: item.name,
            unitPrice: price,
            inventoryItemId: item.id,
            hasDimensions: hasDims,
            length,
            width,
            count,
            quantity: calc.quantity,
            tax: calc.tax,
            total: calc.total,
            unit: item.unit || (hasDims ? 'م²' : line.unit || 'حبة')
          };
        })
      );
      // If Hand Mode is active, transition cursor to quantity field
      if (isBarcodeHandMode) {
        setTimeout(() => {
          if (quantityInputRef.current) {
            quantityInputRef.current.focus();
            quantityInputRef.current.select();
          }
          resetInactivityTimer();
        }, 70);
      }
    } else {
      posSound.error();
      setBarcodeNotFoundAlert(code);
      alert(`الصنف غير موجود\nالباركود: [${code}]`);
    }
  };

  // Hardware Scanner Integration for POS Cashier (USB / Bluetooth)
  useHardwareBarcodeScanner({
    enabled: !isCameraScannerOpen && !isItemSearchOpen,
    minChars: 3,
    playSound: false,
    onScan: (scannedCode) => {
      handleBarcodeScanned(scannedCode);
    }
  });

  // Save Invoice Action
  const handleSaveInvoice = (printMode: 'none' | 'prompt' | 'thermal-direct' | 'a4-direct' | 'a4-custom-direct' = 'none', isExplicitSave: boolean = false) => {
    if (tableLines.length === 0 || calculatedTotalAmount <= 0) {
      alert('الرجاء إدراج أصناف في الفاتورة قبل الحفظ.');
      return;
    }

    // 1. Validation for cash customers without sub-customer name:
    const hasSubCustomerName = !!(subCustomerName?.trim() || customCustomerText?.trim());

    if (isExplicitSave && isCashCustomer && !hasSubCustomerName) {
      posSound.error();
      alert(
        'تنبيه نظامي: لا يمكن الحفظ المباشر إذا كان العميل نقدي ولا يوجد اسم للعميل الفرعي.\nيرجى تسديد المبلغ أو تحديد اسم العميل الفرعي.'
      );
      return;
    }

    if (!isExplicitSave && isCashCustomer && !hasSubCustomerName && calculatedRemaining > 0.05) {
      posSound.error();
      alert(
        'تنبيه نظامي: الزبون نقدي عام ولا يوجد اسم زبون فرعي.\nلا يمكن حفظ الفاتورة كـ (آجل) غير مدفوعة بالكامل.\nيرجى تسديد كامل المبلغ أو تحديد اسم زبون فرعي / اختيار عميل مسجل في النظام.'
      );
      return;
    }

    const itemsForContext = tableLines.map(line => {
      const isDelivery = line.inventoryItemId === 'srv-delivery' || line.barcode === 'DELIVERY' || line.itemName === 'خدمة توصيل' || line.itemName?.trim().startsWith('توصيل');
      const matchedInv: InventoryItem = inventory.find(i => i.id === line.inventoryItemId || (line.barcode && i.barcode === line.barcode)) || {
        id: line.inventoryItemId || (isDelivery ? 'srv-delivery' : 'custom-' + Date.now()),
        code: isDelivery ? 'DELIVERY' : ('ITM-' + line.id),
        name: line.itemName,
        category: isDelivery ? 'services' : 'stationery',
        unit: isDelivery ? 'خدمة' : 'قطعة',
        purchasePrice: isDelivery ? line.unitPrice : (line.unitPrice * 0.7), // خدمة التوصيل تحمل على الزبون بالتكلفة الأصلية دون مربح
        sellingPrice: line.unitPrice,
        stockQuantity: isDelivery ? 0 : 100, // ليس لها مخزن ولا رصيد
        minAlertQuantity: 0,
        barcode: line.barcode
      };

      if (isDelivery) {
        matchedInv.purchasePrice = line.unitPrice;
        matchedInv.sellingPrice = line.unitPrice;
        matchedInv.stockQuantity = 0;
      }

      return {
        item: matchedInv,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        description: line.description,
        notes: line.notes,
        hasDimensions: line.hasDimensions,
        length: line.length,
        width: line.width,
        count: line.count,
        unit: line.unit,
        discount: line.discount,
        tax: line.tax,
        taxRate: line.taxRate,
        attachments: line.attachments
      };
    });

    const cashVal = parseFloat(cashAmountInput) || 0;
    const bankVal = parseFloat(bankAmountInput) || 0;
    const cBase = cashVal * (cashExchangeRate || 1.0);
    const bBase = bankVal * (bankExchangeRate || 1.0);
    const tPaidBase = cBase + bBase;

    let effectiveMethod: PaymentMethod = 'credit';
    if (cBase > 0 && bBase === 0) effectiveMethod = 'cash';
    else if (bBase > 0 && cBase === 0) effectiveMethod = 'card';
    else if (cBase > 0 && bBase > 0) effectiveMethod = 'cash';
    else effectiveMethod = 'credit';

    const savedInvoice = createPosSale(
      itemsForContext,
      customerName || customCustomerText || 'عميل كاشير نقدي',
      effectiveMethod,
      selectedCustomerId || undefined,
      invoiceNotes,
      {
        invoiceNumber: `INV-${invoiceSeqNumber.padStart(4, '0')}`,
        date: invoiceDate,
        additionalCharges,
        overallDiscount: calculatedDiscountTotal,
        taxRate: effectiveTaxRate,
        paidAmount: customExchangeRate > 0 ? Number((tPaidBase / customExchangeRate).toFixed(2)) : tPaidBase,
        representative,
        branch,
        branchId: branches.find(b => b.name === branch)?.id || activeBranchId,
        warehouse,
        userId: currentUser?.id,
        userName: currentUser?.fullName || currentUser?.username,
        editingInvoiceId: currentEditingInvoiceIdRef.current || editingPosInvoiceId || undefined,
        customCustomerText,
        subCustomerId: subCustomerId || undefined,
        subCustomerName: subCustomerName || undefined,
        subCustomerPhone: subCustomerPhone || undefined,
        treasuryAccountCode: bBase > cBase ? bankTreasuryCode : cashTreasuryCode,
        currency: activeCurrency.code,
        currencySymbol: activeCurrency.symbol,
        exchangeRate: customExchangeRate > 0 ? customExchangeRate : 1.0,
        cashPaidAmount: cashVal,
        cashCurrency: cashCurrencyCode,
        cashExchangeRate: cashExchangeRate,
        cashTreasuryCode: cashTreasuryCode,
        bankPaidAmount: bankVal,
        bankCurrency: bankCurrencyCode,
        bankExchangeRate: bankExchangeRate,
        bankTreasuryCode: bankTreasuryCode,
        workflowStatus: invoiceWorkflowStatus
      }
    );

    posSound.success();

    // Auto-save any customer modified special prices so they are permanently retained
    if (effectivePricingCustomerId) {
      const updatedSpecial = { ...(effectivePricingCustomerObj?.specialPrices || {}) };
      let hasPriceChanges = false;
      tableLines.forEach(l => {
        const item = inventory.find(i => 
          (l.inventoryItemId && i.id === l.inventoryItemId) || 
          (l.barcode && matchItemByBarcode(i, l.barcode)) || 
          i.name === l.itemName
        );
        if (item && l.unitPrice > 0 && l.unitPrice !== item.sellingPrice) {
          updatedSpecial[item.id] = l.unitPrice;
          hasPriceChanges = true;
        }
      });
      if (hasPriceChanges) {
        updateParty(effectivePricingCustomerId, { specialPrices: updatedSpecial });
      }
    }

    // Automatically link with Workshop and Print Job Orders
    if (savedInvoice) {
      const hasPrintSpecs = tableLines.some(l => (l.length > 1 || l.width > 1 || l.description || l.unitPrice > 0));
      if (hasPrintSpecs) {
        const firstLine = tableLines.find(l => l.description || l.length > 1 || l.width > 1) || tableLines[0];
        const linkedJobId = createPrintOrder({
          customerName: customerName || customCustomerText || 'عميل كاشير نقدي',
          customerPhone: subCustomerPhone || selectedCustomerObj?.phone || '',
          customerId: selectedCustomerId || undefined,
          title: firstLine.description || firstLine.itemName || `طلبية فاتورة #${savedInvoice.invoiceNumber}`,
          serviceType: 'custom_print',
          paperType: 'حسب مواصفات الفاتورة',
          dimensions: `${firstLine.length} × ${firstLine.width} سم`,
          quantity: firstLine.quantity,
          colorType: 'ألوان كاملة',
          finishingOptions: [],
          unitCost: Number((firstLine.unitPrice * 0.7).toFixed(2)),
          totalPrice: savedInvoice.totalAmount,
          depositPaid: savedInvoice.paidAmount,
          remainingBalance: savedInvoice.remainingAmount,
          status: invoiceWorkflowStatus === 'design' || invoiceWorkflowStatus === 'designing' ? 'design'
            : invoiceWorkflowStatus === 'pending_approval' ? 'pending_approval'
            : invoiceWorkflowStatus === 'print_external' || invoiceWorkflowStatus === 'in_progress_external' ? 'in_progress_external'
            : invoiceWorkflowStatus === 'print_internal' || invoiceWorkflowStatus === 'in_progress_internal' ? 'in_progress_internal'
            : invoiceWorkflowStatus === 'ready' ? 'ready'
            : invoiceWorkflowStatus === 'delivered' ? 'delivered'
            : 'new',
          notes: invoiceNotes || firstLine.description,
          deliveryDate: invoiceDate,
          associatedInvoiceId: savedInvoice.id
        });
        updateInvoice(savedInvoice.id, { printJobId: linkedJobId });
      }
    }

    if (printMode !== 'none') {
      if (printMode === 'thermal-direct') {
        setDirectPrintOptions({ format: 'thermal', autoPrint: true });
      } else if (printMode === 'a4-direct') {
        setDirectPrintOptions({ format: 'a4', autoPrint: true });
      } else if (printMode === 'a4-custom-direct') {
        setDirectPrintOptions({ format: 'a4-custom', autoPrint: true });
      } else {
        setDirectPrintOptions(null);
      }
      setSelectedInvoiceForPrint(savedInvoice);
    }

    // Set notification for single-entry automated cycle review
    if (savedInvoice) {
      setLastSavedInvoiceNotice(savedInvoice);
    }

    // Reset to a fresh blank invoice with sequential non-repeating sequence
    if (currentEditingInvoiceIdRef.current || editingPosInvoiceId) {
      setInvoiceSeqNumber(getNextSequentialInvoiceNumber(invoices));
    } else {
      const currentNum = parseInt(invoiceSeqNumber, 10) || 1;
      try {
        localStorage.setItem('pos_max_invoice_seq', String(currentNum));
      } catch (e) {
        console.error(e);
      }
      setInvoiceSeqNumber(String(currentNum + 1));
    }

    setTableLines([
      {
        id: generateUniqueLineId(),
        barcode: '',
        itemName: '',
        description: '',
        notes: '',
        hasDimensions: false,
        length: 1,
        width: 1,
        count: 1,
        quantity: 1,
        unit: 'حبة',
        unitPrice: 0,
        discount: 0,
        tax: 0,
        total: 0,
        attachments: []
      }
    ]);
    setAdditionalCharges(0);
    setOverallDiscount(0);
    setInvoiceNotes('');
    setCashAmountInput('0');
    setBankAmountInput('0');
    setInvoiceWorkflowStatus('new');

    if (currentEditingInvoiceIdRef.current || editingPosInvoiceId) {
      setEditingPosInvoiceId(null);
      currentEditingInvoiceIdRef.current = null;
      // setActiveTab('invoices'); // Removed so the screen stays as is
    }
  };

  // Direct Pay Cash (زر دفع يتم احتساب الفاتورة كمدفوعة وبالعملة الرئيسية للبرنامج والصندوق الرئيسي وهو الشيكل)
  const handleQuickPayCash = (printMode: 'none' | 'prompt' | 'thermal-direct' | 'a4-direct' | 'a4-custom-direct' = 'none') => {
    const validLines = tableLines.filter(
      l => (l.itemName && l.itemName.trim() !== '') || l.unitPrice > 0 || l.total > 0
    );
    if (validLines.length === 0 || calculatedTotalAmount <= 0) {
      alert('الرجاء إدراج أصناف في الفاتورة قبل الدفع.');
      return;
    }

    // 1. Force Base Currency: Palestinian Shekel (ILS ₪) with rate 1.0
    setSelectedCurrencyCode('ILS');
    setCustomExchangeRate(1.0);
    setCashCurrencyCode('ILS');
    setCashExchangeRate(1.0);

    // 2. Force Main Cash Treasury (الصندوق الرئيسي 1101)
    const mainCashTreasury = treasuries?.find(t => t.type === 'cash_box' || t.isDefault)?.accountCode || '1101';
    setCashTreasuryCode(mainCashTreasury);
    setSelectedTreasuryCode(mainCashTreasury);

    // 3. Mark invoice as fully paid
    setPaymentMethod('cash');
    setCashAmountInput(String(calculatedTotalAmount));
    setBankAmountInput('0');

    posSound.playCashBeep();
    setTimeout(() => {
      handleSaveInvoice(printMode);
    }, 60);
  };

  // Direct Pay Visa / Card
  const handleQuickPayCard = (printMode: 'none' | 'prompt' | 'thermal-direct' | 'a4-direct' | 'a4-custom-direct' = 'prompt') => {
    setPaymentMethod('card');
    const rate = bankExchangeRate > 0 ? bankExchangeRate : 1.0;
    const req = Number((calculatedTotalAmount / rate).toFixed(2));
    setBankAmountInput(String(req));
    setCashAmountInput('0');
    setTimeout(() => {
      handleSaveInvoice(printMode);
    }, 50);
  };

  // معاينة وطباعة تفاصيل الفاتورة ومراجعة بنودها مع العميل قبل الحفظ أو السداد
  const handleOpenInvoiceDetailsPreview = () => {
    const linesToUse = activeTableLines.length > 0 ? activeTableLines : tableLines;
    if (linesToUse.length === 0 || (linesToUse.length === 1 && !linesToUse[0].itemName && linesToUse[0].unitPrice === 0)) {
      posSound.beep();
    }

    const itemsForInvoice: InvoiceItem[] = linesToUse.map((line, idx) => {
      const hasDims = Boolean(
        line.hasDimensions || (line.length && line.width && (line.length !== 1 || line.width !== 1 || (line.count && line.count > 1)))
      );
      return {
        id: line.id || `line-${idx}`,
        itemId: line.inventoryItemId || `item-${idx}`,
        itemName: line.itemName || 'صنف',
        quantity: Number(line.quantity) || 1,
        unitPrice: Number(line.unitPrice) || 0,
        total: Number(line.total) || 0,
        length: line.length,
        width: line.width,
        count: line.count || 1,
        unit: line.unit || (hasDims ? 'م²' : 'حبة'),
        discount: Number(line.discount) || 0,
        tax: Number(line.tax) || 0,
        taxRate: Number(line.taxRate) || 0,
        description: line.notes || line.description,
        hasDimensions: hasDims,
        attachments: line.attachments
      };
    });

    const cashVal = parseFloat(cashAmountInput) || 0;
    const bankVal = parseFloat(bankAmountInput) || 0;
    const cBase = cashVal * (cashExchangeRate || 1.0);
    const bBase = bankVal * (bankExchangeRate || 1.0);
    const tPaidBase = cBase + bBase;
    const effectivePaid = customExchangeRate > 0 ? Number((tPaidBase / customExchangeRate).toFixed(2)) : tPaidBase;

    let effectiveMethod: PaymentMethod = 'credit';
    if (cBase > 0 && bBase === 0) effectiveMethod = 'cash';
    else if (bBase > 0 && cBase === 0) effectiveMethod = 'card';
    else if (cBase > 0 && bBase > 0) effectiveMethod = 'cash';
    else effectiveMethod = 'credit';

    const selectedCust = parties.find(p => p.id === selectedCustomerId);

    const draftInvoice: Invoice = {
      id: currentEditingInvoiceIdRef.current || editingPosInvoiceId || 'draft-pos-preview',
      invoiceNumber: `INV-${invoiceSeqNumber.padStart(4, '0')}`,
      date: invoiceDate || new Date().toISOString().split('T')[0],
      customerId: selectedCustomerId || undefined,
      customerName: customerName || customCustomerText || 'عميل كاشير نقدي',
      customerPhone: subCustomerPhone || selectedCust?.phone || '',
      customerTaxNumber: selectedCust?.taxNumber || '',
      type: 'pos',
      items: itemsForInvoice,
      subtotal: calculatedSubtotal,
      discountTotal: calculatedDiscountTotal,
      taxRate: effectiveTaxRate,
      taxAmount: calculatedTaxAmount,
      totalAmount: calculatedTotalAmount,
      paidAmount: effectivePaid,
      remainingAmount: calculatedRemaining,
      paymentMethod: effectiveMethod,
      notes: invoiceNotes,
      status: effectivePaid >= calculatedTotalAmount ? 'paid' : (effectivePaid > 0 ? 'partial' : 'unpaid'),
      customCustomerText: customCustomerText,
      subCustomerId: subCustomerId || undefined,
      subCustomerName: subCustomerName || undefined,
      subCustomerPhone: subCustomerPhone || undefined,
      representative: representative,
      branch: branch,
      branchId: branches.find(b => b.name === branch)?.id || activeBranchId,
      warehouse: warehouse,
      userId: currentUser?.id,
      userName: currentUser?.fullName || currentUser?.username,
      currency: activeCurrency.code,
      currencySymbol: activeCurrency.symbol,
      exchangeRate: customExchangeRate > 0 ? customExchangeRate : 1.0,
      baseTotalAmount: (customExchangeRate > 0 ? calculatedTotalAmount * customExchangeRate : calculatedTotalAmount),
      basePaidAmount: tPaidBase,
      cashPaidAmount: cashVal,
      bankPaidAmount: bankVal,
      cashTreasuryCode: cashTreasuryCode,
      bankTreasuryCode: bankTreasuryCode,
      workflowStatus: invoiceWorkflowStatus
    };

    setDirectPrintOptions(null);
    setSelectedInvoiceForPrint(draftInvoice);
  };

  // Hold Invoice (F9)
  const handleHoldInvoice = () => {
    if (tableLines.length === 0) return;
    
    if (heldInvoices.length >= 50) {
      posSound.error();
      alert('تم الوصول للحد الأقصى للفواتير المعلقة (50 فاتورة). يرجى استئناف أو حذف بعض الفواتير المعلقة.');
      return;
    }

    const newHeld: HeldInvoiceData = {
      id: 'held-' + Date.now(),
      heldAt: new Date().toLocaleTimeString('ar-SA'),
      customerName,
      customerId: selectedCustomerId,
      customCustomerText,
      lines: [...tableLines],
      totalAmount: calculatedTotalAmount,
      notes: invoiceNotes
    };

    setHeldInvoices(prev => [newHeld, ...prev]);
    posSound.beep();

    // Reset to clean invoice
    setTableLines([
      {
        id: generateUniqueLineId(),
        barcode: '',
        itemName: '',
        description: '',
        notes: '',
        hasDimensions: false,
        length: 1,
        width: 1,
        count: 1,
        quantity: 1,
        unit: 'حبة',
        unitPrice: 0,
        discount: 0,
        tax: 0,
        total: 0,
        attachments: []
      }
    ]);
  };

  // Resume Held Invoice
  const handleResumeHeldInvoice = (held: HeldInvoiceData) => {
    setTableLines(held.lines);
    setCustomerName(held.customerName);
    if (held.customerId) setSelectedCustomerId(held.customerId);
    if (held.customCustomerText) setCustomCustomerText(held.customCustomerText);
    if (held.notes) setInvoiceNotes(held.notes);
    setHeldInvoices(prev => prev.filter(h => h.id !== held.id));
    posSound.success();
  };

  // Navigation across previous invoices
  const [currentNavInvoiceIndex, setCurrentNavInvoiceIndex] = useState<number>(-1);

  const loadInvoiceToScreen = (inv: Invoice) => {
    setCustomerName(inv.customerName);
    if (inv.customerId) setSelectedCustomerId(inv.customerId);
    if (inv.customCustomerText) setCustomCustomerText(inv.customCustomerText);
    if (inv.subCustomerId) setSubCustomerId(inv.subCustomerId);
    if (inv.subCustomerName) setSubCustomerName(inv.subCustomerName);
    if (inv.subCustomerPhone) setSubCustomerPhone(inv.subCustomerPhone);
    if (inv.notes) setInvoiceNotes(inv.notes);
    if (inv.workflowStatus) setInvoiceWorkflowStatus(inv.workflowStatus);
    
    setInvoiceSeqNumber(inv.invoiceNumber.replace(/\D/g, '') || '1');
    setInvoiceDate(inv.date);
    setAdditionalCharges(inv.additionalCharges || 0);
    setOverallDiscount(inv.discountTotal || 0);
    setPaymentMethod(inv.paymentMethod);
    if (inv.cashPaidAmount !== undefined || inv.bankPaidAmount !== undefined) {
      setCashAmountInput(String(inv.cashPaidAmount || 0));
      setBankAmountInput(String(inv.bankPaidAmount || 0));
    } else {
      if (inv.paymentMethod === 'card' || inv.paymentMethod === 'bank_transfer') {
        setBankAmountInput(String(inv.paidAmount || 0));
        setCashAmountInput('0');
      } else if (inv.paymentMethod === 'cash') {
        setCashAmountInput(String(inv.paidAmount || 0));
        setBankAmountInput('0');
      } else {
        setCashAmountInput('0');
        setBankAmountInput('0');
      }
    }
    if (inv.currency) {
      setSelectedCurrencyCode(inv.currency);
    }
    if (inv.exchangeRate) {
      setCustomExchangeRate(inv.exchangeRate);
    }

    const loadedLines: PosTableLine[] = inv.items.map((it, idx) => ({
      id: 'loaded-' + idx,
      barcode: it.barcode || '',
      itemName: it.itemName,
      description: it.description || '',
      notes: it.notes || '',
      hasDimensions: Boolean(it.hasDimensions || (it.length && it.width && (it.length !== 1 || it.width !== 1))),
      length: it.length || 0,
      width: it.width || 0,
      count: it.count || 1,
      quantity: it.quantity,
      unit: it.unit || (it.hasDimensions ? 'م²' : 'حبة'),
      unitPrice: it.unitPrice,
      discount: it.discount || 0,
      tax: it.tax || 0,
      taxRate: it.taxRate,
      total: it.total,
      attachments: it.attachments || [],
      inventoryItemId: it.itemId
    }));

    setTableLines(loadedLines);
    setEditingPosInvoiceId(inv.id);
  };

  
  // Handle Edit Mode from InvoicesView
  useEffect(() => {
    if (currentEditingInvoiceIdRef.current || editingPosInvoiceId) {
      const invToEdit = invoices.find(inv => inv.id === editingPosInvoiceId);
      if (invToEdit) {
        loadInvoiceToScreen(invToEdit);
      }
    }
  }, [editingPosInvoiceId, invoices]);

  const invoicesForDate = useMemo(() => {
    return (invoices || [])
      .filter(inv => inv.date === invoiceDate)
      .sort((a, b) => {
        const numA = parseInt((a.invoiceNumber || '').replace(/\D/g, ''), 10) || 0;
        const numB = parseInt((b.invoiceNumber || '').replace(/\D/g, ''), 10) || 0;
        if (numA !== numB) return numA - numB;
        return (a.createdAt || '').localeCompare(b.createdAt || '');
      });
  }, [invoices, invoiceDate]);

  const currentInvoiceIndexForDate = useMemo(() => {
    if (!editingPosInvoiceId) return -1;
    return invoicesForDate.findIndex(inv => inv.id === editingPosInvoiceId);
  }, [invoicesForDate, editingPosInvoiceId]);

  const handleNavFirst = () => {
    if (invoicesForDate.length === 0) return;
    loadInvoiceToScreen(invoicesForDate[0]);
    posSound.beep();
  };

  const handleNavPrev = () => {
    if (invoicesForDate.length === 0) return;
    if (currentInvoiceIndexForDate === -1) {
      // إذا كان المستخدم في وضع إدخال فاتورة جديدة، الانتقال للسابق يفتح آخر فاتورة لليوم
      loadInvoiceToScreen(invoicesForDate[invoicesForDate.length - 1]);
    } else {
      const idx = Math.max(0, currentInvoiceIndexForDate - 1);
      loadInvoiceToScreen(invoicesForDate[idx]);
    }
    posSound.beep();
  };

  const handleNavNext = () => {
    if (invoicesForDate.length === 0) return;
    if (currentInvoiceIndexForDate === -1) return;
    if (currentInvoiceIndexForDate < invoicesForDate.length - 1) {
      loadInvoiceToScreen(invoicesForDate[currentInvoiceIndexForDate + 1]);
    } else {
      // عند الوصول لآخر فاتورة اليوم، التالي ينقل المستخدم لإدخال فاتورة جديدة
      handleClearInvoiceDirect(true);
    }
    posSound.beep();
  };

  const handleNavLast = () => {
    if (invoicesForDate.length === 0) return;
    loadInvoiceToScreen(invoicesForDate[invoicesForDate.length - 1]);
    posSound.beep();
  };

  const handleJumpToInvoiceIndex = (index1Based: number) => {
    if (invoicesForDate.length === 0) return;
    const targetIdx = index1Based - 1;
    if (targetIdx >= 0 && targetIdx < invoicesForDate.length) {
      loadInvoiceToScreen(invoicesForDate[targetIdx]);
      posSound.beep();
    } else if (targetIdx >= invoicesForDate.length) {
      handleClearInvoiceDirect(true);
      posSound.beep();
    }
  };

  const handleClearInvoiceDirect = (silent = false) => {
    setEditingPosInvoiceId(null);
    setTableLines([
      {
        id: generateUniqueLineId(),
        barcode: '',
        itemName: '',
        description: '',
        length: 1,
        width: 1,
        quantity: 1,
        unitPrice: 0,
        total: 0
      }
    ]);
    setAdditionalCharges(0);
    setOverallDiscount(0);
    setInvoiceNotes('');
    setCashAmountInput('0');
    setBankAmountInput('0');

    const defaultCashCust = customers.find(c => c.code === 'CUST-0001' || c.code === '1');
    if (defaultCashCust && posTargetType === 'customer') {
      setSelectedCustomerId(defaultCashCust.id);
      setCustomerName(defaultCashCust.name);
      setCustomerCode(defaultCashCust.code);
    } else {
      setSelectedCustomerId('');
      setCustomerName('عميل كاشير نقدي');
      setCustomerCode('');
    }
  };

  // Focus customer input and clear entered customer name (Space key shortcut)
  const handleFocusAndClearCustomer = useCallback(() => {
    setSelectedCustomerId('');
    setCustomerName('');
    setCustomerCode('');
    setSubCustomerId('');
    setSubCustomerName('');
    setSubCustomerPhone('');
    setCustomCustomerText('');
    setTimeout(() => {
      if (customerInputRef.current) {
        customerInputRef.current.focus();
        customerInputRef.current.select();
      }
    }, 20);
  }, []);

  // Clear / Void Invoice (إلغاء)
  const handleClearInvoice = () => {
    if (confirm(editingPosInvoiceId ? 'هل ترغب في إلغاء التعديل والعودة إلى الكشف؟' : 'هل ترغب في تفريغ بيانات الفاتورة والبدء بفاتورة جديدة؟')) {
      if (editingPosInvoiceId) {
        setEditingPosInvoiceId(null);
        // setActiveTab('invoices'); // Removed so the screen stays as is
        return;
      }
      setTableLines([
        {
          id: generateUniqueLineId(),
          barcode: '',
          itemName: '',
          description: '',
          length: 1,
          width: 1,
          quantity: 1,
          unitPrice: 0,
          total: 0
        }
      ]);
      setAdditionalCharges(0);
      setOverallDiscount(0);
      setInvoiceNotes('');
      setCashAmountInput('0');
      setBankAmountInput('0');
      
      const defaultCashCust = customers.find(c => c.code === 'CUST-0001' || c.code === '1');
      if (defaultCashCust && posTargetType === 'customer') {
        setSelectedCustomerId(defaultCashCust.id);
        setCustomerName(defaultCashCust.name);
        setCustomerCode(defaultCashCust.code);
      } else {
        setSelectedCustomerId('');
        setCustomerName('عميل كاشير نقدي');
        setCustomerCode('');
      }

      setSubCustomerId('');
      setSubCustomerName('');
      setSubCustomerPhone('');
      setCustomCustomerText('');
      posSound.beep();
    }
  };

  // Keyboard Shortcuts (F5, F9, F10 and custom button shortcuts)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Dynamic button shortcut check
      const matchingBtn = posButtons.find(
        b => b.isVisible && b.shortcut && b.shortcut.trim().toUpperCase() === e.key.toUpperCase()
      );
      if (matchingBtn) {
        e.preventDefault();
        handleExecuteButtonAction(matchingBtn);
        return;
      }

      // Space key shortcut: Focus customer input and clear entered customer name
      if (e.key === ' ' || e.code === 'Space') {
        const target = e.target as HTMLElement | null;
        const isTypingText =
          target &&
          (target.tagName === 'TEXTAREA' ||
            (target.tagName === 'INPUT' &&
              (target as HTMLInputElement).type === 'text' &&
              target !== customerInputRef.current &&
              target !== barcodeInputRef.current &&
              !(target as HTMLInputElement).readOnly));

        if (!isTypingText) {
          if (target === customerInputRef.current) {
            if (customerName === 'عميل كاشير نقدي' || customerName === 'عميل نقدي' || selectedCustomerId) {
              e.preventDefault();
              handleFocusAndClearCustomer();
            }
          } else {
            e.preventDefault();
            handleFocusAndClearCustomer();
          }
          return;
        }
      }

      if (e.key === 'F2') {
        e.preventDefault();
        handleAddNewRow();
      } else if (e.key === 'F5') {
        e.preventDefault();
        handleQuickPayCash('none');
      } else if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        handleQuickPayCash('thermal-direct');
      } else if (e.ctrlKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        handleSaveInvoice('none', true);
      } else if (e.ctrlKey && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        handleSaveInvoice('a4-direct', true); // User said: وطباعة الفاتورة مباشرة دون شاشات منبثقة بحجم A4
      } else if (e.altKey && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        handleSaveInvoice('prompt', true); // User said: وطباعة الفاتورة بشاشة الاختيار حراري أو A4
      } else if (e.key === 'F9') {
        e.preventDefault();
        handleHoldInvoice();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [posButtons, handleSaveInvoice, handleHoldInvoice, handleExecuteButtonAction, handleAddNewRow, handleQuickPayCash, handleFocusAndClearCustomer, customerName, selectedCustomerId]);

  const isPhone = useIsMobile(768);
  const [forceDesktopMode, setForceDesktopMode] = useState<boolean>(() => {
    return typeof sessionStorage !== 'undefined' && sessionStorage.getItem('pos_force_desktop') === 'true';
  });

  if (isPhone && !forceDesktopMode) {
    return (
      <MobilePosView
        onSwitchToDesktop={() => {
          setForceDesktopMode(true);
          sessionStorage.setItem('pos_force_desktop', 'true');
        }}
      />
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-[#dbe4ef] text-slate-800 text-xs font-sans select-none relative overflow-hidden" dir="rtl">
      {/* Mobile Switch Back Bar */}
      {isPhone && forceDesktopMode && (
        <div className="bg-amber-500 text-slate-950 px-2 py-0.5 text-xs font-bold flex items-center justify-between z-50">
          <span>أنت الآن في وضع سطح المكتب الكامل</span>
          <button
            onClick={() => {
              setForceDesktopMode(false);
              sessionStorage.setItem('pos_force_desktop', 'false');
            }}
            className="bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded-md font-bold"
          >
            📱 العودة لكاشير الهاتف السريع
          </button>
        </div>
      )}
      {/* كاميرا الباركود العائمة (PiP) */}
      <PosInlineBarcodeScanner
        isActive={isInlineCameraOpen}
        inventory={inventory}
        onScan={(code) => {
          handleBarcodeScanned(code);
        }}
        onClose={() => setIsInlineCameraOpen(false)}
        onOpenFullModal={() => {
          setIsInlineCameraOpen(false);
          setIsCameraScannerOpen(true);
        }}
      />
      
      {/* شاشة رقمية للإجمالي */}
      <DraggableDigitalDisplay amount={calculatedTotalAmount} />

      {/* تنبيه: الصنف غير موجود */}
      {barcodeNotFoundAlert && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[200] bg-rose-600 text-white px-5 py-2.5 rounded-xl shadow-2xl flex items-center gap-3 border-2 border-rose-300 animate-bounce">
          <AlertCircle className="w-6 h-6 text-white shrink-0" />
          <div className="text-right">
            <div className="font-black text-sm">الصنف غير موجود</div>
            <div className="text-xs text-rose-100 font-mono font-bold">الباركود: [{barcodeNotFoundAlert}]</div>
          </div>
          <button
            type="button"
            onClick={() => setBarcodeNotFoundAlert(null)}
            className="mr-2 bg-white/20 hover:bg-white/30 text-white text-xs px-1.5 py-0.5 rounded cursor-pointer font-bold"
          >
            إغلاق
          </button>
        </div>
      )}
      {/* ========================================================= */}
      {/* 1. TOP TOOLBAR (شريط الأدوات العلوي) */}
      {/* ========================================================= */}
      <div className="bg-[#1f4a7c] text-white flex flex-col border-b border-[#143254]">
        {/* Navigation & Action Icon Toolbar */}
        {posLayoutConfig.showTopToolbar && (
          <div className="bg-[#eef4fb] text-slate-800 px-2.5 py-1.5 flex items-center justify-between border-b border-slate-300 shadow-2xs flex-nowrap overflow-x-auto gap-1.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="flex items-center gap-1.5 flex-nowrap">
              {/* مجموعة أزرار شريط الأدوات العلوي مع أداة التنقل والتعداد التسلسلي المصغرة لفواتير اليوم المحدد */}
              {(() => {
                const toolbarButtons = posButtons
                  .filter(b => b.location === 'top_toolbar' && b.isVisible)
                  .sort((a, b) => a.order - b.order);
                
                const hasNavFirst = toolbarButtons.some(b => b.actionType === 'nav_first');

                return (
                  <>
                    {toolbarButtons.map((btn, idx, arr) => {
                      if (btn.actionType === 'nav_first') {
                        return (
                          <DayInvoicesNavigator
                            key="day-invoices-nav"
                            invoiceDate={invoiceDate}
                            invoicesForDate={invoicesForDate}
                            currentInvoiceIndex={currentInvoiceIndexForDate}
                            onNavFirst={handleNavFirst}
                            onNavPrev={handleNavPrev}
                            onNavNext={handleNavNext}
                            onNavLast={handleNavLast}
                            onJumpToIndex={handleJumpToInvoiceIndex}
                            onNewInvoice={() => handleClearInvoiceDirect(true)}
                          />
                        );
                      }
                      // تخطي أزرار التنقل الفردية الأخرى لأنها مدمجة بالكامل في المكون الموحد المصغر
                      if (btn.actionType === 'nav_prev' || btn.actionType === 'nav_next' || btn.actionType === 'nav_last') {
                        return null;
                      }

                      return (
                        <PosCustomButtonRenderer
                          key={btn.id}
                          button={btn}
                          isEditMode={isLiveCustomizing}
                          onExecuteAction={handleExecuteButtonAction}
                          onMoveRight={() => handleMoveButtonInLive(btn.id, 'right')}
                          onMoveLeft={() => handleMoveButtonInLive(btn.id, 'left')}
                          onEdit={() => setIsButtonCustomizerOpen(true)}
                          onDelete={() => handleDeleteButtonInLive(btn.id)}
                          canMoveRight={idx > 0}
                          canMoveLeft={idx < arr.length - 1}
                        />
                      );
                    })}

                    {!hasNavFirst && (
                      <DayInvoicesNavigator
                        key="day-invoices-nav-fallback"
                        invoiceDate={invoiceDate}
                        invoicesForDate={invoicesForDate}
                        currentInvoiceIndex={currentInvoiceIndexForDate}
                        onNavFirst={handleNavFirst}
                        onNavPrev={handleNavPrev}
                        onNavNext={handleNavNext}
                        onNavLast={handleNavLast}
                        onJumpToIndex={handleJumpToInvoiceIndex}
                        onNewInvoice={() => handleClearInvoiceDirect(true)}
                      />
                    )}
                  </>
                );
              })()}

              {/* فاصل رأسي خفيف */}
              <span className="w-px h-6 bg-slate-300 mx-1" />

              {/* زر تفاصيل الفاتورة (مرفوع لشريط الأزرار العلوي) */}
              <button
                type="button"
                onClick={handleOpenInvoiceDetailsPreview}
                className="h-8 px-2.5 py-1 bg-white hover:bg-blue-50 border border-blue-300 hover:border-blue-400 text-blue-800 rounded-lg font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all whitespace-nowrap active:scale-95"
                title="معاينة وطباعة مسودة الفاتورة لمراجعة البنود والأسعار مع الزبون قبل الحفظ"
              >
                <Printer className="w-3.5 h-3.5 text-blue-600" />
                <span>تفاصيل الفاتورة</span>
              </button>

              {/* زر سجل فواتير اليوم (مرفوع لشريط الأزرار العلوي) */}
              <button
                type="button"
                onClick={() => setIsDailyInvoicesOpen(true)}
                className="h-8 px-2.5 py-1 bg-[#1f4a7c] hover:bg-[#183a62] text-white rounded-lg font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all whitespace-nowrap active:scale-95"
                title="سجل فواتير اليوم وحالاتها (جديدة، قيد التصميم، تنفيذ، جاهزة، مسلمة)"
              >
                <FileText className="w-3.5 h-3.5 text-blue-200" />
                <span>سجل فواتير اليوم</span>
              </button>

              {/* زر تخصيص الشاشة ومصمم الواجهة */}
              <button
                type="button"
                onClick={() => setIsLayoutDesignerOpen(true)}
                className="pos-layout-customizer-btn pos-advanced-config h-8 px-2.5 py-1 bg-white hover:bg-indigo-50 border border-indigo-300 hover:border-indigo-400 text-indigo-900 rounded-lg font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all whitespace-nowrap active:scale-95"
                title="تخصيص وإخفاء أو إظهار أقسام وأعمدة شاشة الكاشير"
              >
                <Layout className="w-3.5 h-3.5 text-indigo-600" />
                <span>تخصيص الشاشة 🎨</span>
              </button>

              {isLiveCustomizing && (
                <button
                  type="button"
                  onClick={() => setIsButtonCustomizerOpen(true)}
                  className="h-8 px-2.5 py-1 bg-amber-200 hover:bg-amber-300 text-amber-900 font-bold rounded-lg text-xs border border-dashed border-amber-500 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ زر بالشريط العلوي</span>
                </button>
              )}
            </div>

            {isLiveCustomizing && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleLayoutSection('showTopToolbar')}
                  className="text-[10px] bg-rose-500/80 hover:bg-rose-600 text-white px-1.5 py-0.5 rounded cursor-pointer"
                  title="إخفاء شريط الأدوات العلوي"
                >
                  ✕ إخفاء
                </button>
              </div>
            )}
          </div>
        )}

        {/* Live In-place Customization Mode Alert Banner */}
        {isLiveCustomizing && (
          <div className="bg-amber-100 border-b border-amber-300 px-3 py-2 text-amber-950 text-xs font-bold flex items-center justify-between flex-wrap gap-2 animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
              <span>
                وضع تخصيص الشاشة التفاعلي مُفعّل: يمكنك نقل الأزرار بالأسهم، أو النقر على [مصمم الواجهة 🎨] لحذف أو إظهار أي قسم وأعمدة الجدول والدفع.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsLayoutDesignerOpen(true)}
                className="px-2 py-0.5 bg-amber-400 hover:bg-amber-500 text-amber-950 font-black rounded-lg text-xs flex items-center gap-1 cursor-pointer shadow-xs"
              >
                <Layout className="w-3.5 h-3.5" />
                <span>مصمم الشاشة 🎨</span>
              </button>
              <button
                type="button"
                onClick={() => setIsButtonCustomizerOpen(true)}
                className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ إضافة زر مخصص</span>
              </button>
              <button
                type="button"
                onClick={() => setIsLiveCustomizing(false)}
                className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>حفظ وإنهاء التخصيص</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Single-Entry Automated Lifecycle Notification Bar */}
      {lastSavedInvoiceNotice && (
        <div className="mx-2 my-1 bg-slate-900 text-white p-3 px-4 rounded-xl shadow-md border border-slate-700 flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold">تم تسجيل وترحيل الفاتورة بنجاح: #{lastSavedInvoiceNotice.invoiceNumber}</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono font-bold">
                  {lastSavedInvoiceNotice.totalAmount.toLocaleString('ar-SA')} {settings.currency}
                </span>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded">
                  العميل: {lastSavedInvoiceNotice.customerName}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                اكتملت دورة الإدخال الواحد: الفاتورة ← المخزون ← العميل ← الخزينة ← تكلفة المبيعات ← الحسابات ← التقارير
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedInvoiceForLifecycle(lastSavedInvoiceNotice)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>معاينة مسار الحركة الآلية (7 مراحل)</span>
            </button>
            <button
              onClick={() => setSelectedInvoiceForPrint(lastSavedInvoiceNotice)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة الفاتورة</span>
            </button>
            <button
              onClick={() => setLastSavedInvoiceNotice(null)}
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
              title="إغلاق التنبيه"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. MAIN POS WORKSPACE: FAVORITES SIDEBAR (RIGHT) & INVOICE WORKSPACE (LEFT) */}
      {/* مفضلة الكاشير تمتد لأعلى مقابل رقم الفاتورة */}
      {/* ========================================================= */}
      <div className="flex flex-col flex-1 min-h-0 gap-2 p-2 w-full lg:overflow-hidden overflow-y-auto">
        <div className="flex flex-col lg:flex-row gap-2.5 items-stretch w-full lg:h-full min-h-0">
          
          {isDailyInvoicesOpen && (
            <div className="shrink-0 w-full lg:w-[20%] lg:min-w-[20%] lg:max-w-[20%] min-w-[320px] overflow-x-hidden order-first flex flex-col lg:h-full min-h-[500px] lg:min-h-0 border border-slate-300 rounded-xl overflow-hidden shadow-2xs z-10 bg-white">
              <PosDailyInvoicesSidebar
                isOpen={isDailyInvoicesOpen}
                onClose={() => setIsDailyInvoicesOpen(false)}
                onSelectInvoiceToLoad={(inv) => {
                  loadInvoiceToScreen(inv);
                  // setIsDailyInvoicesOpen(false); // Removed so sidebar stays open
                }}
                onPrintInvoice={(inv) => {
                  setSelectedInvoiceForPrint(inv);
                }}
                className="w-full h-full"
              />
            </div>
          )}

          {/* المفضلة في الكاشير: قائمة تظهر بالجانب الأيمن وتمتد لأعلى مقابل رقم الفاتورة وعلى كامل الارتفاع */}
          {(posLayoutConfig.showFavoritesSidebar !== false || isLiveCustomizing) && (
            <div className="relative shrink-0 w-full lg:w-80 xl:w-92 order-first flex flex-col lg:h-full min-h-[300px] lg:min-h-0">
              {isLiveCustomizing && (
                <div className="flex items-center justify-between bg-amber-200/95 px-1.5 py-0.5 rounded-lg mb-1 text-[11px] text-amber-950 font-bold border border-amber-300 shadow-2xs">
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-700 fill-amber-700" />
                    <span>مفضلة الكاشير (الممتدة لأعلى)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleToggleLayoutSection('showFavoritesSidebar')}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-1.5 py-0.5 rounded text-[10px] cursor-pointer"
                    title={posLayoutConfig.showFavoritesSidebar !== false ? 'إخفاء شريط المفضلة' : 'إظهار شريط المفضلة'}
                  >
                    {posLayoutConfig.showFavoritesSidebar !== false ? '✕ إخفاء' : '✓ إظهار'}
                  </button>
                </div>
              )}
              {posLayoutConfig.showFavoritesSidebar !== false ? (
                <PosFavoritesSidebar
                  onSelectItem={handleAddItemToTable}
                  className="w-full flex-1 h-full min-h-0"
                />
              ) : (
                <div className="border-2 border-dashed border-amber-400 bg-amber-50/70 p-4 rounded-xl text-center text-amber-900 text-xs font-bold">
                  (مفضلة الكاشير مخفية حالياً - يمكنك إظهارها من مصمم الشاشة)
                </div>
              )}
            </div>
          )}

          {/* مساحة الفاتورة الرئيسية (يسار المفضلة في واجهة RTL): رأس الفاتورة في الأعلى وجدول الأصناف في الأسفل */}
          <div className="flex-1 min-w-0 flex flex-col gap-1 lg:h-full lg:min-h-0">
            {/* 2A. INVOICE HEADER SECTION (رأس الفاتورة - تفاصيل العميل والفرع ورقم الفاتورة) */}
            {posLayoutConfig.showCustomerHeader && (
              <div className="bg-[#d3dfed] p-1 border border-slate-300 rounded-xl shadow-2xs w-fit">
          {isLiveCustomizing && (
            <div className="flex items-center justify-between bg-amber-200/90 px-2 py-0.5 rounded mb-2 text-xs text-amber-950 font-bold border border-amber-300">
              <span className="flex items-center gap-1.5">
                <Layout className="w-3.5 h-3.5 text-amber-800" />
                <span>قسم رأس الفاتورة والعميل (يمكنك إخفاؤه لزيادة مساحة جدول الكاشير)</span>
              </span>
              <button
                type="button"
                onClick={() => handleToggleLayoutSection('showCustomerHeader')}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-2 py-0.5 rounded text-[11px] cursor-pointer"
                title="إخفاء قسم رأس الفاتورة"
              >
                ✕ إخفاء هذا القسم
              </button>
            </div>
          )}
          {/* Main Top Header System Strip (أعلى شاشة الكاشير): الفرع | المستخدم | رقم الفاتورة | التاريخ | حالة الفاتورة */}
          <div className="bg-white/90 border border-slate-300 rounded-lg p-1 mb-1 shadow-2xs w-fit overflow-hidden">
            <div className="flex flex-nowrap items-center justify-between gap-2.5 text-sm w-fit overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              
              {/* 1. رقم الفاتورة (تسلسلي موحد غير مكرر لكل حالات الفاتورة) */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-lg px-2 py-0.5 shrink-0">
                <span className="font-bold text-slate-700 text-[14px] shrink-0">رقم الفاتورة:</span>
                <div
                  className={`bg-blue-600 text-white font-mono font-black text-[14px] px-2.5 py-0.5 rounded shadow-2xs flex items-center gap-1`}
                  title="رقم الفاتورة تلقائي يفرزه البرنامج بشكل تسلسلي ولا يتكرر لكل حالات الفاتورة"
                >
                  <Lock className={`w-3.5 h-3.5 text-blue-200`} />
                  <span>#{invoiceSeqNumber.padStart(4, '0')}</span>
                </div>
              </div>

              {/* 4. التاريخ (تلقائياً وقت الجهاز المعتمد مع إمكانية تثبيت التاريخ) */}
              <div className={`flex items-center gap-1.5 border rounded-lg px-2 py-0.5 shrink-0 ml-[245px] transition-colors ${
                posLayoutConfig.isDateLocked ? 'bg-amber-50/90 border-amber-400 ring-1 ring-amber-300' : 'bg-slate-50 border-slate-300'
              }`}>
                <Calendar className={`w-4 h-4 shrink-0 ${posLayoutConfig.isDateLocked ? 'text-amber-700' : 'text-emerald-700'}`} />
                <span className="font-bold text-slate-700 text-[14px] shrink-0">التاريخ:</span>
                <DateInput
                  value={invoiceDate}
                  onChange={e => {
                    const newDate = e.target.value;
                    setInvoiceDate(newDate);
                    if (posLayoutConfig.isDateLocked) {
                      const updated = { ...posLayoutConfig, lockedDate: newDate };
                      setPosLayoutConfig(updated);
                      savePosLayoutConfig(updated, currentUser?.id);
                    }
                  }}
                  className="bg-transparent border-none font-mono text-[14px] font-bold text-slate-800 focus:outline-none cursor-pointer w-[102px]"
                  title={
                    posLayoutConfig.isDateLocked
                      ? 'التاريخ مثبت على هذا اليوم لجميع العمليات الجديدة حتى إلغاء التثبيت'
                      : 'تلقائياً يتم استخدام وقت الكمبيوتر أو الهاتف أو التابلت المعتمد'
                  }
                />

                {/* زر التثبيت (أيقونة تك صغيرة لتثبيت التاريخ في كل العمليات أو إلغاء التثبيت) */}
                <button
                  type="button"
                  onClick={() => {
                    const nextLocked = !posLayoutConfig.isDateLocked;
                    const dateToLock = nextLocked ? (invoiceDate || new Date().toISOString().split('T')[0]) : '';
                    if (!nextLocked) {
                      // عند إلغاء التثبيت نعود لتاريخ اليوم الفعلي للجهاز
                      setInvoiceDate(new Date().toISOString().split('T')[0]);
                    }
                    const updated = {
                      ...posLayoutConfig,
                      isDateLocked: nextLocked,
                      lockedDate: dateToLock
                    };
                    setPosLayoutConfig(updated);
                    savePosLayoutConfig(updated, currentUser?.id);
                    posSound.click();
                  }}
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-all border ${
                    posLayoutConfig.isDateLocked
                      ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-700 shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-300'
                  }`}
                  title={
                    posLayoutConfig.isDateLocked
                      ? 'التاريخ مثبت حالياً لكل العمليات - انقر لإلغاء التثبيت والعودة لتاريخ الجهاز'
                      : 'انقر لتثبيت هذا التاريخ في كافة الفواتير والعمليات القادمة'
                  }
                >
                  <Check className={`w-3 h-3 ${posLayoutConfig.isDateLocked ? 'text-white stroke-[3]' : 'text-slate-400 stroke-[2]'}`} />
                  <span className="text-[10px] whitespace-nowrap">
                    {posLayoutConfig.isDateLocked ? 'تاريخ مثبت' : 'تثبيت'}
                  </span>
                </button>
              </div>

              {/* 5. حالة الفاتورة (قائمة منسدلة معتمدة وموحدة) */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-lg px-2 py-0.5 shrink-0 ml-0 -mr-[250px]">
                <span className="font-bold text-slate-700 text-[14px] shrink-0">حالة الفاتورة:</span>
                <select
                  value={invoiceWorkflowStatus}
                  onChange={e => {
                    setInvoiceWorkflowStatus(e.target.value as PosInvoiceWorkflowStatus);
                    posSound.click();
                  }}
                  className={`text-[14px] font-black px-2.5 py-0.5 rounded border cursor-pointer focus:outline-none w-[122px] ${
                    getInvoiceWorkflowStatusMeta(invoiceWorkflowStatus).bgColor
                  } ${getInvoiceWorkflowStatusMeta(invoiceWorkflowStatus).color} ${getInvoiceWorkflowStatusMeta(invoiceWorkflowStatus).borderColor}`}
                  title={getInvoiceWorkflowStatusMeta(invoiceWorkflowStatus).description}
                >
                  {WORKFLOW_STATUS_OPTIONS.map(opt => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label} {opt.isAccounting ? '●' : '○'}
                    </option>
                  ))}
                </select>
                {invoiceWorkflowStatus === 'quotation' && (
                  <span className="text-xs bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded border border-amber-300">
                    عرض سعر (غير محاسبي)
                  </span>
                )}
              </div>

              {/* 6. المخزن */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-lg px-2 py-0.5 shrink-0">
                <Package className="w-4 h-4 text-amber-700 shrink-0" />
                <span className="font-bold text-slate-700 text-[14px] shrink-0">المخزن:</span>
                <select
                  value={warehouse}
                  onChange={e => setWarehouse(e.target.value)}
                  className="bg-transparent border-none text-[14px] font-bold text-slate-800 focus:outline-none cursor-pointer"
                  title="اختر المستودع"
                >
                  {warehouses && warehouses.length > 0 ? (
                    warehouses.map(w => (
                      <option key={w.id} value={w.name}>
                        {w.name} ({w.code})
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="المخزن الرئيسي">المخزن الرئيسي</option>
                      <option value="مستودع الخامات">مستودع الخامات</option>
                    </>
                  )}
                </select>
              </div>

              {/* 7. سعر البيع */}
              <div className={`flex items-center gap-1.5 border rounded-lg px-2 py-0.5 shrink-0 -mr-2 ml-[250px] ${
                userPricePolicy.allowedTier !== 'all' 
                  ? 'bg-amber-50/60 border-amber-300' 
                  : 'bg-slate-50 border-slate-300'
              }`}>
                <Tag className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="font-bold text-slate-700 text-[14px] shrink-0">سعر البيع:</span>
                <select
                  value={pricingTier}
                  disabled={userPricePolicy.allowedTier !== 'all'}
                  onChange={e => {
                    const newTier = e.target.value as 'retail' | 'wholesale' | 'special';
                    setPricingTier(newTier);
                    setTableLines(prev => applyCustomerPricingToLines(effectivePricingCustomerObj, prev, newTier));
                  }}
                  className="bg-transparent border-none text-[14px] font-bold text-emerald-900 focus:outline-none cursor-pointer disabled:opacity-85 disabled:cursor-not-allowed w-[70px]"
                  title={userPricePolicy.allowedTier !== 'all' ? `محدد ومقيد لصلاحية المستخدم (${userPricePolicy.allowedTier})` : 'فئة سعر البيع المعتمدة بالفاتورة'}
                >
                  {(userPricePolicy.allowedTier === 'all' || userPricePolicy.allowedTier === 'price1') && (
                    <option value="retail">سعر بيع</option>
                  )}
                  {(userPricePolicy.allowedTier === 'all' || userPricePolicy.allowedTier === 'price2') && (
                    <option value="wholesale">سعر بيع 1</option>
                  )}
                  {(userPricePolicy.allowedTier === 'all' || userPricePolicy.allowedTier === 'price3') && (
                    <option value="special">سعر بيع 2</option>
                  )}
                </select>
                {userPricePolicy.allowedTier !== 'all' && (
                  <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" title="تم قفل فئة السعر وفق صلاحيات المستخدم" />
                )}
              </div>

            </div>
          </div>

        {/* Customer, Sub-Customer, Balance & Order Options - ALL IN ONE SINGLE ROW */}
        <div className="bg-white/80 px-2 py-0.5 mb-1 rounded-xl border border-slate-300 flex items-center gap-4 flex-wrap text-sm shadow-sm w-fit">
          {/* 1. زر تبديل دائري لاختيار الطرف (عميل - مورد - موظف) */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="font-bold text-slate-700 text-[14px] shrink-0">الطرف:</span>
            <button
              type="button"
              onClick={() => {
                const types: ('customer' | 'supplier' | 'employee')[] = ['customer', 'supplier', 'employee'];
                const currentIndex = types.indexOf(posTargetType);
                const newType = types[(currentIndex + 1) % types.length];
                setPosTargetType(newType);
                setSelectedCustomerId('');
                setCustomerCode('');
                setCustomerName(newType === 'customer' ? 'عميل كاشير نقدي' : '');
              }}
              className="bg-blue-50/80 hover:bg-blue-100 border border-blue-300 text-blue-900 rounded-lg px-1.5 py-0.5.5 text-[14px] font-bold focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-xs transition-colors outline-none flex items-center gap-1 select-none min-w-[70px] justify-center"
              title="اضغط للتبديل بين عميل / مورد / موظف"
            >
              <RefreshCw className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>{posTargetType === 'customer' ? 'عميل' : posTargetType === 'supplier' ? 'مورد' : 'موظف'}</span>
            </button>
          </div>

          {/* 2. خانة إدخال وبحث ومطابقة أحرف وإمكانية الإضافة السريعة */}
          <div className="flex items-center gap-2 min-w-[280px] max-w-[400px] flex-1">
            <div className="flex-1 min-w-0 relative group">
              <AutocompleteCombobox
                items={targetComboboxOptions}
                selectedId={selectedCustomerId}
                value={customerName}
                entityType={posTargetType}
                showCode={false}
                inputRef={customerInputRef}
                inputClassName="text-[14px] font-bold h-9 w-[324.631px]"
                placeholder={
                  posTargetType === 'customer'
                    ? 'اكتب اسم العميل للبحث...'
                    : posTargetType === 'supplier'
                    ? 'اكتب اسم المورد للبحث...'
                    : 'اكتب اسم الموظف للبحث...'
                }
                onSelect={opt => {
                  if (!opt.id) {
                    setSelectedCustomerId('');
                    setCustomerName('');
                    setCustomerCode('');
                    return;
                  }
                  setSelectedCustomerId(opt.id);
                  setCustomerName(opt.name);
                  setCustomerCode(opt.code || opt.id);
                  if (opt.raw && posTargetType === 'customer') {
                    setTableLines(prev => applyCustomerPricingToLines(opt.raw, prev));
                  }
                  // Reset sub-customer
                  setSubCustomerId('');
                  setSubCustomerName('');
                  setSubCustomerPhone('');
                  setCustomCustomerText('');
                }}
                onChangeText={name => {
                  setCustomerName(name);
                  if (!name.trim()) {
                    setSelectedCustomerId('');
                    setCustomerCode('');
                  }
                }}
                onQuickAdd={async name => {
                  // No-op if they try to add from combobox directly, we use the + button now.
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => {
                  const trimmed = customerName.trim();
                  if (!trimmed) {
                    alert('يرجى كتابة اسم لإضافته');
                    return;
                  }
                  if (posTargetType === 'customer') {
                    const created = addParty({
                      name: trimmed,
                      type: 'customer',
                      phone: '',
                      initialBalance: 0
                    });
                    setSelectedCustomerId(created.id);
                    setCustomerName(created.name);
                    setCustomerCode(created.code);
                  } else if (posTargetType === 'supplier') {
                    const created = addParty({
                      name: trimmed,
                      type: 'supplier',
                      phone: '',
                      initialBalance: 0
                    });
                    setSelectedCustomerId(created.id);
                    setCustomerName(created.name);
                    setCustomerCode(created.code);
                  } else if (posTargetType === 'employee') {
                    const created = addEmployee({
                      name: trimmed,
                      jobTitle: 'موظف',
                      department: 'عام',
                      salaryType: 'monthly',
                      salaryAmount: 0,
                      status: 'active',
                      hireDate: new Date().toISOString().split('T')[0]
                    });
                    setSelectedCustomerId(created.id);
                    setCustomerName(created.name);
                    setCustomerCode(created.id);
                  }
              }}
              className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm shrink-0 cursor-pointer transition-colors"
              title="إضافة جديد بالاسم المكتوب"
            >
              <Plus className="w-[14.5px] h-[17.5px] ml-[1px] pr-[-5px] -mr-[9px] -ml-[2px] pl-[-1px] pt-[-7px]" />
            </button>
            {selectedCustomerId && (
              <button
                type="button"
                onClick={() => {
                  if (posTargetType === 'employee') {
                    const emp = employees.find(e => e.id === selectedCustomerId);
                    if (emp) setSelectedEmployeeForStatement(emp);
                  } else {
                    const p = parties.find(pt => pt.id === selectedCustomerId);
                    if (p) setSelectedPartyForStatement(p);
                  }
                }}
                title="كشف حساب"
                className="p-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-blue-700 rounded-lg cursor-pointer shrink-0 transition-colors"
              >
                <Search className="w-[16.2437px] h-[19.2437px] pl-[3px] ml-[6px]" />
              </button>
            )}
          </div>

          {/* 3. العميل الفرعي */}
          <div className="flex items-center gap-2 min-w-[240px] max-w-[350px] flex-1">
            <span className="font-bold text-slate-700 text-[14px] shrink-0">الفرعي:</span>
            <div className="flex-1 min-w-0 flex items-center gap-2">
              <SubCustomerField
                compact={false}
                parentCustomerId={selectedCustomerId}
                parentCustomerName={customerName}
                parties={parties}
                customCustomerText={customCustomerText}
                onChangeCustomText={setCustomCustomerText}
                subCustomerId={subCustomerId}
                onSelectSubCustomer={sub => {
                  if (sub) {
                    setSubCustomerId(sub.id);
                    setSubCustomerName(sub.name);
                    setSubCustomerPhone(sub.phone || '');
                    setTableLines(prev => applyCustomerPricingToLines(sub, prev));
                  } else {
                    setSubCustomerId('');
                    // Revert to main customer pricing
                    const mainCust = parties.find(p => p.id === selectedCustomerId);
                    setTableLines(prev => applyCustomerPricingToLines(mainCust, prev));
                  }
                }}
                subCustomerName={subCustomerName}
                onChangeSubCustomerName={setSubCustomerName}
                subCustomerPhone={subCustomerPhone}
                onChangeSubCustomerPhone={setSubCustomerPhone}
                onOpenSubCustomerStatement={sub => {
                  setSelectedPartyForStatement(sub);
                }}
                onSelectMainCustomer={cust => {
                  setSelectedCustomerId(cust.id);
                  setCustomerName(cust.name);
                  setCustomerCode(cust.code || cust.id);
                  setTableLines(prev => applyCustomerPricingToLines(cust, prev));
                  setCustomCustomerText('');
                  setSubCustomerId('');
                  setSubCustomerName('');
                  setSubCustomerPhone('');
                }}
                onQuickAddSub={(name, phone) => {
                    if (!selectedCustomerId) {
                        return; // Needs a parent
                    }
                    const createdSub = addParty({
                        name: name,
                        type: 'customer',
                        phone: phone || '',
                        isSubCustomer: true,
                        parentCustomerId: selectedCustomerId,
                        parentCustomerName: customerName,
                        initialBalance: 0
                    });
                    setSubCustomerId(createdSub.id);
                    setSubCustomerName(createdSub.name);
                    setSubCustomerPhone(createdSub.phone || '');
                    setTableLines(prev => applyCustomerPricingToLines(createdSub, prev));
                }}
              />
              <button
                type="button"
                onClick={() => {
                    const trimmedName = subCustomerName.trim() || customCustomerText.trim();
                    if (!trimmedName) {
                       alert('يرجى كتابة اسم الزبون الفرعي أولاً لإضافته');
                       return;
                    }
                    if (!selectedCustomerId) {
                        alert('يرجى اختيار العميل الرئيسي أولاً قبل إضافة زبون فرعي له');
                        return;
                    }
                    const createdSub = addParty({
                        name: trimmedName,
                        type: 'customer',
                        phone: subCustomerPhone || '',
                        isSubCustomer: true,
                        parentCustomerId: selectedCustomerId,
                        parentCustomerName: customerName,
                        initialBalance: 0
                    });
                    setSubCustomerId(createdSub.id);
                    setSubCustomerName(createdSub.name);
                    setSubCustomerPhone(createdSub.phone || '');
                    setTableLines(prev => applyCustomerPricingToLines(createdSub, prev));
                }}
                className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm shrink-0 cursor-pointer transition-colors"
                title="إضافة وحفظ الزبون الفرعي"
              >
                <Plus className="w-[14.5px] h-[17.5px] ml-[1px] pr-[-5px] -mr-[9px] -ml-[2px] pl-[-1px] pt-[-7px]" />
              </button>
            </div>
          </div>

          {/* 4. الرصيد المستحق */}
          <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-lg shrink-0 shadow-2xs">
            <span className="text-[14px] text-red-600 font-bold shrink-0">
              {subCustomerId ? 'رصيد الفرعي:' : 'الرصيد المستحق:'}
            </span>
            <span className="font-mono font-black text-red-600 text-[14px] sm:text-base">
              {((subCustomerId ? parties.find(p => p.id === subCustomerId)?.balance : currentCustomer?.balance) ?? currentCustomer?.balance ?? 380).toFixed(2)} ₪
            </span>
            {subCustomerId && (
              <button
                type="button"
                onClick={() => {
                  const sub = parties.find(p => p.id === subCustomerId);
                  if (sub) setSelectedPartyForStatement(sub);
                }}
                className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-0.5 rounded font-bold cursor-pointer transition-colors"
                title="كشف حساب الزبون الفرعي"
              >
                كشف
              </button>
            )}
          </div>
        </div>

        {/* Sub-tools Toolbar Row: ملاحظات الفاتورة | خدمة التوصيل | يد الباركود | سطر الباركود | كاميرا الباركود | تجميع الكميات | آخر سعر | الأسعار الخاصة */}
        {posLayoutConfig.showExtraHeaderOptions && (
          <div className="mt-0.5 pt-0.5 border-t border-slate-300/80 flex flex-nowrap overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] items-center justify-between gap-2 text-sm w-fit">
            <div className="flex items-center gap-2 flex-nowrap flex-1 min-w-0">
              {/* خانة ملاحظات الفاتورة ككل (تظهر في كشف حساب العميل) */}
              <div
                className="flex items-center gap-2 bg-white border border-slate-300 hover:border-blue-400 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-400 rounded-xl px-3 py-1.5 transition-all shadow-sm flex-1 min-w-[320px] lg:min-w-[420px] max-w-3xl"
                title="ملاحظة عامة خاصة بالفاتورة ككل وتظهر في كشف حساب العميل"
              >
                <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                <input
                  type="text"
                  value={invoiceNotes}
                  onChange={e => setInvoiceNotes(e.target.value)}
                  placeholder="ملاحظات الفاتورة (تظهر في كشف الحساب)..."
                  className="w-full text-[14px] text-slate-800 placeholder:text-slate-400 focus:outline-hidden bg-transparent font-medium h-7"
                />
                {invoiceNotes && (
                  <button
                    type="button"
                    onClick={() => setInvoiceNotes('')}
                    className="text-slate-400 hover:text-rose-600 text-[14px] font-bold px-1.5 cursor-pointer shrink-0 transition-colors"
                    title="مسح الملاحظة"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* زر خدمة توصيل (تنزل تلقائي كصنف يحدد له ملاحظات وسعر فقط) */}
              <button
                type="button"
                onClick={handleAddDeliveryServiceLine}
                className="px-1.5 py-0.5.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[14px] cursor-pointer shadow-xs flex items-center gap-1.5 transition-colors shrink-0"
                title="إضافة خدمة توصيل تلقائياً كصنف في الفاتورة لتحديد الملاحظات والسعر"
              >
                <Truck className="w-4 h-4 text-emerald-100" />
                <span>+ خدمة توصيل</span>
              </button>

              <span className="w-px h-5 bg-slate-300 mx-0.5 shrink-0 hidden sm:block" />

              {/* سطر الباركود - خانة الباركود (تم تكبيرها بالعرض) */}
              <div className="relative w-[551px] shrink-0">
                <input
                  ref={barcodeInputRef}
                  type="text"
                  value={quickBarcodeVal}
                  onChange={e => {
                    setQuickBarcodeVal(e.target.value);
                    resetInactivityTimer();
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && quickBarcodeVal.trim()) {
                      e.preventDefault();
                      handleBarcodeScanned(quickBarcodeVal);
                      setQuickBarcodeVal('');
                    }
                  }}
                  placeholder="باركود..."
                  className="w-full pl-8 pr-2.5 py-1 text-[14px] bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono shadow-inner text-center font-bold h-[35px]"
                  title="اكتب أو امسح الباركود ثم اضغط Enter"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (barcodeInputRef.current) {
                      barcodeInputRef.current.focus();
                      barcodeInputRef.current.select();
                    }
                  }}
                  className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-600 p-0.5 cursor-pointer"
                  title="رمز الباركود - انقر للتركيز"
                >
                  <Barcode className="w-4 h-4" />
                </button>
              </div>

              {/* كاميرا الباركود (فقط لوقو كاميرا) */}
              <button
                type="button"
                onClick={() => setIsInlineCameraOpen(prev => !prev)}
                className={`p-2 rounded-lg border flex items-center justify-center cursor-pointer transition-all shrink-0 ${
                  isInlineCameraOpen
                    ? 'bg-blue-600 text-white border-blue-700 shadow-inner ring-2 ring-blue-300'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:border-blue-400 shadow-2xs'
                }`}
                title={isInlineCameraOpen ? 'إيقاف كاميرا الباركود' : 'تشغيل كاميرا الباركود'}
              >
                <Camera className={`w-5 h-5 ${isInlineCameraOpen ? 'text-emerald-300 animate-pulse' : 'text-blue-600'}`} />
                {isInlineCameraOpen && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping mr-1" />}
              </button>

              {/* تجميع الكميات */}
              <label className="pos-advanced-config flex items-center gap-1.5 cursor-pointer shrink-0 text-[14px] text-slate-700 font-bold bg-white hover:bg-slate-50 px-1.5 py-0.5 rounded-lg border border-slate-300 select-none shadow-2xs transition-colors ml-2">
                <input
                  type="checkbox"
                  checked={aggregateDuplicateItems}
                  onChange={e => setAggregateDuplicateItems(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                <span>تجميع الكميات</span>
              </label>

              {/* استخدام آخر سعر */}
              <label className="pos-advanced-config flex items-center gap-1.5 cursor-pointer shrink-0 text-[14px] text-slate-700 font-bold bg-white hover:bg-slate-50 px-1.5 py-0.5 rounded-lg border border-slate-300 select-none shadow-2xs transition-colors">
                <input
                  type="checkbox"
                  checked={useLastCustomerPrice}
                  onChange={e => setUseLastCustomerPrice(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                <span>استخدام آخر سعر</span>
              </label>

              {/* Special Prices Button for current customer */}
              {effectivePricingCustomerId && (
                <button
                  type="button"
                  onClick={() => setIsSpecialPricesModalOpen(true)}
                  className="pos-advanced-config px-1.5 py-0.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-lg font-bold text-[14px] cursor-pointer shadow-2xs flex items-center gap-1 shrink-0"
                  title="تحديد أو تعديل الأسعار الخاصة لهذا العميل"
                >
                  <DollarSign className="w-4 h-4 text-amber-700" />
                  <span>الأسعار الخاصة</span>
                </button>
              )}
            </div>

            {isLiveCustomizing && (
              <button
                type="button"
                onClick={() => handleToggleLayoutSection('showExtraHeaderOptions')}
                className="text-[10px] bg-rose-500 hover:bg-rose-600 text-white px-1.5 py-0.5 rounded cursor-pointer"
                title="إخفاء شريط خيارات الرأس الإضافية"
              >
                ✕ إخفاء الشريط
              </button>
            )}
          </div>
        )}
      </div>
      )}

            {/* ========================================================= */}
            {/* 3. MAIN WORKSPACE: LEFT ACTION PANEL + CENTER ITEMS TABLE */}
            {/* ========================================================= */}
            <div className="flex-1 flex flex-col md:flex-row gap-2 overflow-hidden items-stretch">
              {/* ========================================================= */}
              {/* 3B. CENTER ITEMS TABLE (جدول أصناف الفاتورة بالمطابع) */}
              {/* ========================================================= */}
              <div className="flex-1 min-h-0 flex flex-col bg-white overflow-hidden border border-slate-300 rounded-xl shadow-2xs">
          {/* The Data Table */}
          <div className="flex-1 overflow-x-auto overflow-y-auto min-h-0 w-full">
            <table className="w-full text-right border-collapse text-xs min-w-[980px] lg:min-w-full">
              {/* Table Header matching user specifications:
                  الصنف - الوصف - الملاحظات - الطول - العرض - العدد - الكمية - الوحدة - السعر - الخصم - الضريبة - الإجمالي - المرفقات - حذف */}
              <thead className="bg-[#b3cbe3] text-slate-900 font-black border-b border-slate-400 sticky top-0 z-10 select-none shadow-2xs">
                <tr>
                  {posLayoutConfig.tableColumns.showIndex && (
                    <th className="p-2 w-8 text-center border-l border-slate-300">#</th>
                  )}
                  {/* 1. الصنف */}
                  <th className="p-2 min-w-[200px] border-l border-slate-300">الصنف</th>
                  {/* 3. الملاحظات */}
                  {posLayoutConfig.tableColumns.showNotes && (
                    <th className="p-2 w-full min-w-[250px] border-l border-slate-300">الملاحظات</th>
                  )}
                  {/* 4 & 5. الطول والعرض */}
                  {posLayoutConfig.tableColumns.showDimensions && (
                    <>
                      <th className="p-2 w-14 text-center border-l border-slate-300">الطول</th>
                      <th className="p-2 w-14 text-center border-l border-slate-300">العرض</th>
                    </>
                  )}
                  {/* 6. العدد */}
                  {posLayoutConfig.tableColumns.showCount && (
                    <th className="p-2 w-14 text-center border-l border-slate-300">العدد</th>
                  )}
                  {/* 7. الكمية */}
                  {posLayoutConfig.tableColumns.showQuantity && (
                    <th className="p-2 w-20 text-center border-l border-slate-300">الكمية</th>
                  )}
                  {/* 8. الوحدة */}
                  {posLayoutConfig.tableColumns.showUnit && (
                    <th className="p-2 w-16 text-center border-l border-slate-300">الوحدة</th>
                  )}
                  {/* 9. السعر */}
                  {posLayoutConfig.tableColumns.showUnitPrice && (
                    <th className="p-2 w-20 text-left border-l border-slate-300">السعر</th>
                  )}
                  {/* 10. الخصم */}
                  {posLayoutConfig.tableColumns.showDiscount && (
                    <th className="p-2 w-16 text-left border-l border-slate-300">الخصم</th>
                  )}
                  {/* 11. الضريبة */}
                  {posLayoutConfig.tableColumns.showTax && (
                    <th className="p-2 w-20 text-left border-l border-slate-300">الضريبة</th>
                  )}
                  {/* 12. الإجمالي */}
                  <th className="p-2 w-24 text-left border-l border-slate-300">الإجمالي</th>
                  {/* 13. المرفقات */}
                  {posLayoutConfig.tableColumns.showAttachments && (
                    <th className="p-2 w-20 text-center border-l border-slate-300">
                      <span className="flex items-center justify-center gap-1">
                        <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                        <span>مرفق</span>
                      </span>
                    </th>
                  )}
                  {/* 14. حذف */}
                  {posLayoutConfig.tableColumns.showDeleteButton && (
                    <th className="p-2 w-12 text-center">حذف</th>
                  )}
                </tr>
              </thead>

              <tbody 
                className="divide-y divide-slate-200 font-sans"
                onKeyDown={(e) => {
                  if (e.key === 'Tab' && !e.shiftKey) {
                    const target = e.target as HTMLElement;
                    const rows = Array.from(e.currentTarget.querySelectorAll('tr'));
                    const firstRow = rows[0] as HTMLTableRowElement | undefined;
                    
                    if (firstRow && firstRow.contains(target)) {
                      const focusableElements = Array.from(firstRow.querySelectorAll('button:not([disabled]), [href], input:not([disabled]):not([readonly]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')) as HTMLElement[];
                      const lastFocusable = focusableElements[focusableElements.length - 1];
                      
                      if (target === lastFocusable || target.closest('td:last-child')) {
                        e.preventDefault();
                        const newRowId = handleAddNewRow();
                        setTimeout(() => {
                          if (isBarcodeHandMode) {
                            const barcodeInput = document.getElementById(`barcode-input-${newRowId}`);
                            if (barcodeInput) barcodeInput.focus();
                          } else {
                            const itemInput = document.getElementById(`item-input-${newRowId}`);
                            if (itemInput) itemInput.focus();
                          }
                        }, 100);
                      }
                    }
                  }
                }}
              >
                {[...tableLines].reverse().map((line, idx) => {
                  const isActive = activeRowId === line.id;
                  return (
                    <tr
                      key={line.id}
                      onClick={() => setActiveRowId(line.id)}
                      className={`transition-colors ${
                        isActive ? 'bg-[#ebf4ff] font-semibold ring-1 ring-blue-300' : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Row Index */}
                      {posLayoutConfig.tableColumns.showIndex && (
                        <td className="p-1 text-center font-mono text-slate-500 border-l border-slate-200">
                          {tableLines.length - idx}
                        </td>
                      )}

                      {/* 1. الصنف - Item Name with autocomplete + dimension toggle badge */}
                      <td className="p-1 border-l border-slate-200">
                        {line.inventoryItemId === 'srv-delivery' || line.itemName === 'خدمة توصيل' ? (
                          <div className="flex items-center gap-1.5 px-1.5 py-0.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded font-bold text-xs">
                            <Truck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>خدمة توصيل</span>
                            <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1 py-0.5 rounded font-normal mr-auto">
                              (خدمة بلا مخزن - بالتكلفة الأصلية)
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <div className="flex-1">
                              <ItemAutocompleteInput
                                value={line.itemName}
                                lineId={line.id}
                                inventoryItemId={line.inventoryItemId}
                                barcode={line.barcode}
                                inventory={inventory}
                                pricingTier={pricingTier}
                                currency={settings.currency}
                                isActiveRow={isActive}
                                onChangeText={text => handleUpdateLine(line.id, 'itemName', text)}
                                onSelectItem={item => {
                                  posSound.beep();
                                  const price = pricingTier === 'wholesale'
                                    ? Number((item.sellingPrice * 0.9).toFixed(2))
                                    : item.sellingPrice;

                                  const isDimensionItem = Boolean(
                                    item.unitCalculationType === 'area' || 
                                    item.unitCalculationType === 'linear' ||
                                    item.category === 'print_raw' || 
                                    item.category === 'print_service' ||
                                    item.name.includes('متر') || 
                                    item.name.includes('بنر') || 
                                    item.name.includes('فلكس') || 
                                    item.name.includes('لوحة') || 
                                    item.name.includes('استيكر') ||
                                    item.unit === 'م²' || 
                                    item.unit === 'متر مربع'
                                  );

                                  const hasDims = line.hasDimensions || isDimensionItem;
                                  const l = hasDims ? (line.length > 0 ? line.length : 1) : line.length;
                                  const w = hasDims ? (line.width > 0 ? line.width : 1) : line.width;
                                  const c = line.count || 1;
                                  const calc = calculateLineValues(
                                    hasDims,
                                    l,
                                    w,
                                    c,
                                    line.quantity,
                                    price,
                                    line.discount,
                                    (taxEnabled && taxRate > 0) ? undefined : line.tax
                                  );

                                  setTableLines(prev =>
                                    prev.map(row => {
                                      if (row.id !== line.id) return row;
                                      return {
                                        ...row,
                                        itemName: item.name,
                                        barcode: item.barcode || '',
                                        inventoryItemId: item.id,
                                        unitPrice: price,
                                        hasDimensions: hasDims,
                                        length: l,
                                        width: w,
                                        count: c,
                                        quantity: calc.quantity,
                                        tax: calc.tax,
                                        total: calc.total,
                                        unit: item.unit || (hasDims ? 'م²' : 'حبة'),
                                        description: item.category === 'shields_gifts' ? 'شكر وعرفان وتكريم' : (row.description || '')
                                      };
                                    })
                                  );

                                  setTimeout(() => {
                                    const notesInput = document.getElementById(`notes-input-${line.id}`);
                                    if (notesInput) {
                                      notesInput.focus();
                                    }
                                  }, 50);
                                }}
                                onQuickAdd={nameQuery => {
                                  setQuickAddInitialName(nameQuery);
                                  setIsQuickAddOpen(true);
                                }}
                                onOpenSearchModal={() => setIsItemSearchOpen(true)}
                              />
                            </div>

                            {/* Dimension Mode Toggle Icon */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateLine(line.id, 'hasDimensions', !line.hasDimensions);
                              }}
                              className={`shrink-0 p-1 rounded transition-colors cursor-pointer ${
                                line.hasDimensions
                                  ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                                  : 'text-slate-400 bg-slate-50 hover:bg-slate-100'
                              }`}
                              title={line.hasDimensions ? 'حساب أبعاد (طول×عرض×عدد)' : 'كمية مباشرة'}
                            >
                              {line.hasDimensions ? <Ruler className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                            </button>
                          </div>
                        )}
                      </td>

                      {/* 3. الملاحظات */}
                      {posLayoutConfig.tableColumns.showNotes && (
                        <td className="p-1 border-l border-slate-200">
                          <input
                            id={`notes-input-${line.id}`}
                            type="text"
                            value={line.notes}
                            onChange={e => handleUpdateLine(line.id, 'notes', e.target.value)}
                            placeholder="ملاحظات البند..."
                            className="w-full px-1.5 py-1 bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white rounded text-xs text-slate-700"
                          />
                        </td>
                      )}

                      {/* 4 & 5. الطول والعرض */}
                      {posLayoutConfig.tableColumns.showDimensions && (
                        <>
                          <td className="p-1 border-l border-slate-200 text-center">
                            {line.inventoryItemId === 'srv-delivery' || line.itemName === 'خدمة توصيل' ? (
                              <span className="text-slate-400 font-bold select-none text-xs">—</span>
                            ) : (
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={line.length}
                                onChange={e => handleUpdateLine(line.id, 'length', parseFloat(e.target.value) || 0)}
                                className={`w-full px-1 py-1 text-center rounded font-mono text-xs font-bold ${
                                  line.hasDimensions
                                    ? 'bg-blue-50/50 border border-blue-200 focus:bg-white focus:border-blue-500 text-blue-900'
                                    : 'bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white text-slate-700'
                                }`}
                                placeholder="الطول"
                              />
                            )}
                          </td>
                          <td className="p-1 border-l border-slate-200 text-center">
                            {line.inventoryItemId === 'srv-delivery' || line.itemName === 'خدمة توصيل' ? (
                              <span className="text-slate-400 font-bold select-none text-xs">—</span>
                            ) : (
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={line.width}
                                onChange={e => handleUpdateLine(line.id, 'width', parseFloat(e.target.value) || 0)}
                                className={`w-full px-1 py-1 text-center rounded font-mono text-xs font-bold ${
                                  line.hasDimensions
                                    ? 'bg-blue-50/50 border border-blue-200 focus:bg-white focus:border-blue-500 text-blue-900'
                                    : 'bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white text-slate-700'
                                }`}
                                placeholder="العرض"
                              />
                            )}
                          </td>
                        </>
                      )}

                      {/* 6. العدد */}
                      {posLayoutConfig.tableColumns.showCount && (
                        <td className="p-1 border-l border-slate-200 text-center">
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={line.count || 1}
                            onChange={e => handleUpdateLine(line.id, 'count', parseInt(e.target.value, 10) || 1)}
                            className="w-full px-1 py-1 text-center bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white rounded font-mono text-xs font-bold text-slate-800"
                            placeholder="العدد"
                          />
                        </td>
                      )}

                      {/* 7. الكمية */}
                      {posLayoutConfig.tableColumns.showQuantity && (
                        <td className="p-1 border-l border-slate-200">
                          {line.hasDimensions ? (
                            <div className="relative flex flex-col items-center">
                              <input
                                ref={isActive ? quantityInputRef : undefined}
                                type="number"
                                step="0.001"
                                min="0"
                                value={line.quantity}
                                onChange={e => {
                                  handleUpdateLine(line.id, 'quantity', parseFloat(e.target.value) || 0);
                                  resetInactivityTimer();
                                }}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    if (inactivityTimerRef.current) {
                                      clearTimeout(inactivityTimerRef.current);
                                    }
                                    if (barcodeInputRef.current) {
                                      barcodeInputRef.current.focus();
                                      barcodeInputRef.current.select();
                                    }
                                  }
                                }}
                                className="w-full px-1 py-1 text-center bg-blue-50/80 border border-blue-200 hover:border-blue-400 focus:border-blue-600 focus:bg-white rounded font-mono text-xs font-black text-blue-900"
                                title={`حساب الأبعاد: ${line.length} × ${line.width} × ${line.count || 1} = ${line.quantity}`}
                              />
                              <span className="text-[9px] text-blue-700 font-mono font-bold scale-90 whitespace-nowrap mt-0.5">
                                {line.length}×{line.width}×{line.count || 1}
                              </span>
                            </div>
                          ) : (
                            <input
                              ref={isActive ? quantityInputRef : undefined}
                              type="number"
                              min="1"
                              value={line.quantity}
                              onChange={e => {
                                handleUpdateLine(line.id, 'quantity', parseInt(e.target.value, 10) || 1);
                                resetInactivityTimer();
                              }}
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  if (inactivityTimerRef.current) {
                                    clearTimeout(inactivityTimerRef.current);
                                  }
                                  if (barcodeInputRef.current) {
                                    barcodeInputRef.current.focus();
                                    barcodeInputRef.current.select();
                                  }
                                }
                              }}
                              className="w-full px-1 py-1 text-center bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white rounded font-mono text-xs font-black text-blue-800"
                            />
                          )}
                        </td>
                      )}

                      {/* 8. الوحدة */}
                      {posLayoutConfig.tableColumns.showUnit && (
                        <td className="p-1 border-l border-slate-200 text-center">
                          <input
                            list="pos-units-datalist"
                            type="text"
                            value={line.unit || (line.hasDimensions ? 'م²' : 'حبة')}
                            onChange={e => handleUpdateLine(line.id, 'unit', e.target.value)}
                            className="w-full px-1 py-1 text-center bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white rounded text-xs text-slate-700 font-medium"
                            placeholder="الوحدة"
                            title="اختيار أو كتابة الوحدة المناسبة"
                          />
                        </td>
                      )}

                      {/* 9. السعر */}
                      {posLayoutConfig.tableColumns.showUnitPrice && (
                        <td className="p-1 border-l border-slate-200">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              readOnly={!canUserEditPrices}
                              disabled={!canUserEditPrices}
                              value={line.unitPrice}
                              onChange={e => {
                                if (canUserEditPrices) {
                                  handleUpdateLine(line.id, 'unitPrice', parseFloat(e.target.value) || 0);
                                }
                              }}
                              className={`w-full px-1.5 py-1 text-left rounded font-mono text-xs font-bold ${
                                !canUserEditPrices
                                  ? "bg-slate-100/90 text-slate-500 cursor-not-allowed border border-slate-200"
                                  : line.inventoryItemId === 'srv-delivery' || line.itemName === 'خدمة توصيل'
                                  ? "bg-emerald-50 border border-emerald-400 text-emerald-900 focus:bg-white focus:border-emerald-600 font-black text-sm"
                                  : "bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white text-slate-800"
                              }`}
                              title={!canUserEditPrices ? "تعديل السعر مقفل وغير مسموح به لصلاحية هذا المستخدم" : "سعر الوحدة"}
                            />
                            {!canUserEditPrices && (
                              <Lock className="w-3 h-3 text-slate-400 shrink-0" title="تعديل السعر مقفل للمستخدم" />
                            )}
                            {(() => {
                              const matchedItem = inventory.find(i => 
                                (line.inventoryItemId && i.id === line.inventoryItemId) || 
                                (line.barcode && matchItemByBarcode(i, line.barcode)) || 
                                i.name === line.itemName
                              );
                              const specialFromCustomer = effectivePricingCustomerObj?.specialPrices && line.inventoryItemId && effectivePricingCustomerObj.specialPrices[line.inventoryItemId] !== undefined;
                              const specialFromItem = Boolean(matchedItem?.customerSpecialPrices && effectivePricingCustomerId && matchedItem.customerSpecialPrices.some(p => p.customerId === effectivePricingCustomerId));
                              
                              if (specialFromCustomer || specialFromItem) {
                                return (
                                  <span 
                                    className="shrink-0 text-[9px] bg-amber-100 text-amber-900 border border-amber-300 px-1 py-0.5 rounded font-bold whitespace-nowrap flex items-center gap-0.5" 
                                    title={specialFromItem ? "سعر خاص معتمد لهذا العميل في كارتة الصنف" : "سعر خاص مسجل في ملف العميل"}
                                  >
                                    <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-600" />
                                    خاص
                                  </span>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        </td>
                      )}

                      {/* 10. الخصم */}
                      {posLayoutConfig.tableColumns.showDiscount && (
                        <td className="p-1 border-l border-slate-200">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={line.discount || 0}
                            onChange={e => handleUpdateLine(line.id, 'discount', parseFloat(e.target.value) || 0)}
                            className="w-full px-1.5 py-1 text-left bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white rounded font-mono text-xs font-medium text-rose-600"
                            placeholder="0.00"
                          />
                        </td>
                      )}

                      {/* 11. الضريبة */}
                      {posLayoutConfig.tableColumns.showTax && (
                        <td className="p-1 border-l border-slate-200">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={line.tax || 0}
                            onChange={e => handleUpdateLine(line.id, 'tax', parseFloat(e.target.value) || 0)}
                            className="w-full px-1.5 py-1 text-left bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white rounded font-mono text-xs font-medium text-indigo-700"
                            placeholder="0.00"
                          />
                        </td>
                      )}

                      {/* 12. الإجمالي */}
                      <td className="p-2 text-left font-mono font-black text-sm text-[#1f4a7c] border-l border-slate-200">
                        {line.total.toFixed(2)}
                      </td>

                      {/* 13. المرفقات */}
                      {posLayoutConfig.tableColumns.showAttachments && (
                        <td className="p-1 text-center border-l border-slate-200">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveLineForAttachments(line);
                            }}
                            className={`px-1.5 py-0.5 rounded-lg border text-xs font-bold flex items-center justify-center gap-1 mx-auto cursor-pointer transition-all shadow-2xs ${
                              line.attachments && line.attachments.length > 0
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700 ring-2 ring-emerald-300'
                                : 'bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border-slate-300 hover:border-blue-400'
                            }`}
                            title={`مرفقات البند (${line.attachments?.length || 0}) - رفع ملف خاص بالبند (PDF, JPG, PNG, AI, PSD, EPS, SVG)`}
                          >
                            <Paperclip className="w-3.5 h-3.5 shrink-0" />
                            <span className="whitespace-nowrap">مرفق</span>
                            {line.attachments && line.attachments.length > 0 && (
                              <span className="text-[10px] font-mono font-black bg-white text-emerald-800 rounded-full px-1.5 py-0.2 leading-tight">
                                {line.attachments.length}
                              </span>
                            )}
                          </button>
                        </td>
                      )}

                      {/* 14. حذف */}
                      {posLayoutConfig.tableColumns.showDeleteButton && (
                        <td className="p-1 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteLine(line.id)}
                            className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded cursor-pointer transition-colors"
                            title="حذف هذا البند"
                          >
                            <X className="w-3.5 h-3.5 mx-auto" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Datalist for Units based on all adopted program units */}
            <datalist id="pos-units-datalist">
              {programUnits.map(u => (
                <option key={u} value={u} />
              ))}
            </datalist>

            {/* Click to add new line row as shown in screenshot ("اضغط هنا لإضافة صنف جديد") */}
            <div
              onClick={handleAddNewRow}
              className="p-2.5 bg-slate-50 hover:bg-blue-50/70 border-b border-dashed border-slate-300 text-center text-slate-500 hover:text-blue-700 font-bold text-xs cursor-pointer transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4 text-blue-600" />
              <span>اضغط هنا لإضافة صنف جديد إلى جدول الفاتورة</span>
            </div>
          </div>

          {/* Table Summary Footer: عدد الأصناف - إجمالي القطع - الإجمالي - الخصم - الإضافي - الضريبة - المدفوع - المتبقي - سطر جديد */}
          {posLayoutConfig.showTableStatsFooter && (
            <div className="bg-[#b7cde3] p-0.5 border-t-2 border-slate-400 flex flex-wrap items-center justify-between gap-2 select-none shadow-xs">
              {/* Totals Breakdown Badges (عدد الأصناف | إجمالي القطع | الإجمالي | الخصم | الإضافي | الضريبة | المدفوع | المتبقي | سطر جديد) */}
              <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
                {/* 1. عدد الأصناف */}
                <div
                  className="bg-white text-slate-700 px-1.5 py-0.5 rounded-lg border border-slate-300 shadow-2xs flex items-center gap-1"
                  title="عدد الأصناف المسجلة في الفاتورة"
                >
                  <span className="text-[9px] text-slate-400 font-light font-sans font-bold">عدد الأصناف:</span>
                  <span className="font-bold text-xs text-blue-700">{activeItemsCount}</span>
                </div>

                {/* 2. إجمالي القطع */}
                <div
                  className="bg-white text-slate-700 px-1.5 py-0.5 rounded-lg border border-slate-300 shadow-2xs flex items-center gap-1"
                  title="إجمالي عدد القطع والكميات"
                >
                  <span className="text-[9px] text-slate-400 font-light font-sans font-bold">إجمالي القطع:</span>
                  <span className="font-bold text-xs text-emerald-700">{totalPiecesCount}</span>
                </div>

                {/* 3. الإجمالي */}
                <div
                  className="bg-[#122b49] text-white px-1.5 py-0.5 rounded-lg border border-blue-900/60 shadow-2xs flex items-center gap-1.5"
                  title="مجموع بنود الفاتورة قبل الخصم والإضافات"
                >
                  <span className="text-[10px] text-blue-200 font-sans font-bold">الإجمالي:</span>
                  <span className="font-black text-xs sm:text-sm text-white">{calculatedSubtotal.toFixed(2)}</span>
                  <span className="text-[10px] text-blue-200 font-sans">₪</span>
                  {selectedCurrencyCode !== 'ILS' && (
                    <span className="text-[9px] text-amber-300 font-sans border-r border-blue-700 pr-1">
                      ≈ {(calculatedSubtotal / (customExchangeRate || 1)).toFixed(2)} {activeCurrency.symbol}
                    </span>
                  )}
                </div>

                {/* 4. الخصم */}
                <div
                  className="bg-white text-rose-700 px-1.5 py-0.5 rounded-lg border border-rose-300 shadow-2xs flex items-center gap-1"
                  title="إجمالي الخصم الممنوح"
                >
                  <span className="text-[10px] text-rose-500 font-sans font-bold">الخصم:</span>
                  <span className="font-bold text-xs">{calculatedDiscountTotal.toFixed(2)}</span>
                </div>

                {/* 5. الإضافي */}
                <div
                  className="bg-white text-amber-800 px-1.5 py-0.5 rounded-lg border border-amber-300 shadow-2xs flex items-center gap-1"
                  title="المصاريف أو الرسوم الإضافية"
                >
                  <span className="text-[10px] text-amber-600 font-sans font-bold">الإضافي:</span>
                  <span className="font-bold text-xs">{additionalCharges.toFixed(2)}</span>
                </div>

                {/* 6. الضريبة */}
                <div
                  className="bg-white text-blue-800 px-1.5 py-0.5 rounded-lg border border-blue-300 shadow-2xs flex items-center gap-1"
                  title="مبلغ ضريبة القيمة المضافة"
                >
                  <span className="text-[10px] text-blue-500 font-sans font-bold">الضريبة:</span>
                  <span className="font-bold text-xs">{calculatedTaxAmount.toFixed(2)}</span>
                </div>

                {/* 7. المدفوع */}
                <div
                  className="bg-white text-emerald-800 px-1.5 py-0.5 rounded-lg border border-emerald-400 shadow-2xs flex items-center gap-1.5"
                  title="المبلغ المدفوع فعلياً نقداً وبنكياً"
                >
                  <span className="text-[10px] text-emerald-600 font-sans font-bold">المدفوع:</span>
                  <span className="font-black text-xs text-emerald-700">{parsedPaidAmount.toFixed(2)}</span>
                </div>

                {/* 8. المتبقي (بارز جداً لسرعة التحصيل) */}
                <div
                  className={`px-2 py-0.5 rounded-lg border shadow-xs flex items-center gap-1.5 transition-all ${
                    calculatedRemaining > 0
                      ? 'bg-rose-600 text-white border-rose-700 ring-2 ring-rose-400/50'
                      : 'bg-emerald-600 text-white border-emerald-700'
                  }`}
                  title="المبلغ المتبقي المطلوب سداده أو تسجليه ذمم آجل"
                >
                  <span className="text-[10px] text-rose-100 font-sans font-bold">المتبقي:</span>
                  <span className="font-black text-xs sm:text-sm tracking-wider">{calculatedRemaining.toFixed(2)}</span>
                  <span className="text-[10px] text-white font-sans">₪</span>
                  {selectedCurrencyCode !== 'ILS' && (
                    <span className="text-[9px] text-amber-200 font-sans border-r border-rose-400/50 pr-1">
                      ≈ {(calculatedRemaining / (customExchangeRate || 1)).toFixed(2)} {activeCurrency.symbol}
                    </span>
                  )}
                </div>

                {/* 9. حالة الدفع (تم رفعها للسطر الأعلى بجانب المتبقي) */}
                <div
                  className="bg-white/95 text-slate-800 px-1.5 py-0.5 rounded-lg border border-slate-300 shadow-2xs flex items-center gap-1.5 shrink-0"
                  title="حالة دفع الفاتورة الحالية"
                >
                  <span className="text-[10px] text-slate-600 font-sans font-bold">حالة الدفع:</span>
                  <div className={`px-2 py-0.5 rounded-lg text-[11px] font-bold border flex items-center gap-1 ${currentPaymentStatusMeta.badgeBg} ${currentPaymentStatusMeta.badgeText} ${currentPaymentStatusMeta.badgeBorder}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                    <span>{currentPaymentStatusMeta.label}</span>
                  </div>
                </div>
              </div>

              {/* Right: Hide Button */}
              <div className="flex items-center gap-2">
                {isLiveCustomizing && (
                  <button
                    type="button"
                    onClick={() => handleToggleLayoutSection('showTableStatsFooter')}
                    className="text-[10px] bg-rose-500 hover:bg-rose-600 text-white px-1.5 py-0.5 rounded-md cursor-pointer font-sans font-bold"
                    title="إخفاء شريط إحصائيات الجدول"
                  >
                    ✕ إخفاء الشريط
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>


      {/* ========================================================= */}
      {/* 4. BOTTOM PAYMENT, TREASURY & TOTALS CONSOLE */}
      {/* (شريط الحسابات، الصندوق، ألية وعملة الدفع، والإجمالي) */}
      {/* ========================================================= */}
      <div className="bg-[#193a61] text-white p-1 border-t-2 border-[#143254] shadow-lg flex flex-col gap-1">
        {/* 4A. Integrated Payment, Treasury & Currency Console (عملة الفاتورة وسعر الصرف، الدفع النقدي، الدفع البنكي، الصناديق، سطر الملاحظات) */}
        {posLayoutConfig.showPaymentConsole && (
          <PosBottomPaymentConsole
            currencies={currencies}
            overallDiscount={overallDiscount}
            onChangeOverallDiscount={setOverallDiscount}
            discountType={discountType}
            onChangeDiscountType={setDiscountType}
            invoiceCurrencyCode={selectedCurrencyCode}
            onSelectInvoiceCurrency={code => {
              setSelectedCurrencyCode(code);
              const found = currencies.find(c => c.code === code);
              if (found) {
                handleExchangeRateChange(code === 'ILS' ? 1.0 : (found.rateAgainstBase || 1.0));
              }
            }}
            invoiceExchangeRate={customExchangeRate}
            onChangeInvoiceExchangeRate={handleExchangeRateChange}
            activeInvoiceCurrency={activeCurrency}
            cashAmount={cashAmountInput}
            onChangeCashAmount={setCashAmountInput}
            cashCurrencyCode={cashCurrencyCode}
            onChangeCashCurrency={setCashCurrencyCode}
            cashExchangeRate={cashExchangeRate}
            onChangeCashExchangeRate={setCashExchangeRate}
            cashTreasuryCode={cashTreasuryCode}
            onChangeCashTreasury={setCashTreasuryCode}
            bankAmount={bankAmountInput}
            onChangeBankAmount={setBankAmountInput}
            bankCurrencyCode={bankCurrencyCode}
            onChangeBankCurrency={setBankCurrencyCode}
            bankExchangeRate={bankExchangeRate}
            onChangeBankExchangeRate={setBankExchangeRate}
            bankTreasuryCode={bankTreasuryCode}
            onChangeBankTreasury={setBankTreasuryCode}
            treasuries={treasuries}
            invoiceNotes={invoiceNotes}
            onChangeInvoiceNotes={setInvoiceNotes}
            calculatedTotalAmount={calculatedTotalAmount}
            onQuickFullCash={handleQuickFullCash}
            onQuickFullBank={handleQuickFullBank}
            onQuickCredit={handleQuickCredit}
            baseCurrencySymbol="₪"
            isEditMode={isLiveCustomizing}
            onToggleVisibility={() => handleToggleLayoutSection('showPaymentConsole')}
          />
        )}

        {/* 4B. Action Buttons - Full width across bottom row (إعطاء اتساع كامل للشاشة وإخفاء زر تخصيص الأسفل) */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 border-t border-[#1f4a7c] w-full">
          {/* Big Colorful Action Buttons (Customizable) */}
          <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2 w-full">
            {isLiveCustomizing && (
              <button
                type="button"
                onClick={() => setIsButtonCustomizerOpen(true)}
                className="px-1.5 py-0.5.5 bg-amber-400 hover:bg-amber-500 text-amber-950 font-bold rounded-xl text-xs border border-dashed border-amber-600 flex items-center gap-1 cursor-pointer shadow-xs ml-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ زر أسفل الشاشة</span>
              </button>
            )}
            {posButtons
              .filter(b => b.location === 'bottom_bar' && b.isVisible)
              .sort((a, b) => a.order - b.order)
              .map((btn, idx, arr) => (
                <PosCustomButtonRenderer
                  key={btn.id}
                  button={btn}
                  isEditMode={isLiveCustomizing}
                  onExecuteAction={handleExecuteButtonAction}
                  onMoveRight={() => handleMoveButtonInLive(btn.id, 'right')}
                  onMoveLeft={() => handleMoveButtonInLive(btn.id, 'left')}
                  onEdit={() => setIsButtonCustomizerOpen(true)}
                  onDelete={() => handleDeleteButtonInLive(btn.id)}
                  canMoveRight={idx > 0}
                  canMoveLeft={idx < arr.length - 1}
                />
              ))}
          </div>
        </div>
      </div>
      </div>

      {/* ========================================================= */}
      {/* 5. MODALS & SUB-POPOVERS (مترابطة مع كل أزرار الشاشة) */}
      {/* ========================================================= */}

      {/* Header Sub-tools Modals */}
      {activeHeaderSubModal === 'currency' && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-5 max-w-md w-full text-slate-800 space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Coins className="w-5 h-5 text-emerald-600" />
              <span>تعديل عملة الفاتورة وسعر الصرف</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-600 mb-1 text-[11px] font-semibold">
                  اختيار عملة الفاتورة:
                </label>
                <select
                  value={selectedCurrencyCode}
                  onChange={e => {
                    const code = e.target.value;
                    setSelectedCurrencyCode(code);
                    const found = currencies.find(c => c.code === code);
                    if (found) {
                      handleExchangeRateChange(found.rateAgainstBase || 1.0);
                    }
                  }}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold bg-white text-slate-800 cursor-pointer"
                >
                  {currencies.map(curr => (
                    <option key={curr.code} value={curr.code}>
                      {curr.symbol} {curr.name} ({curr.code}) {curr.isBase ? '- العملة الأساسية' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 text-[11px] font-semibold">
                  سعر الصرف المباشر (1 {activeCurrency.symbol} مقابل الشيكل ₪):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    disabled={selectedCurrencyCode === 'ILS'}
                    value={selectedCurrencyCode === 'ILS' ? 1.0 : customExchangeRate}
                    onChange={e => handleExchangeRateChange(parseFloat(e.target.value) || 1.0)}
                    className={`flex-1 border rounded-xl px-3 py-2 text-xs font-mono font-bold ${
                      selectedCurrencyCode === 'ILS'
                        ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                        : 'bg-white border-amber-400 text-slate-900 focus:ring-2 focus:ring-amber-300'
                    }`}
                  />
                  <span className="text-sm font-bold text-slate-700">₪ شيكل</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  {selectedCurrencyCode === 'ILS'
                    ? 'الشيكل الفلسطيني هو العملة الأساسية لكافة العمليات المحاسبية وسعر صرفه دائماً 1.0.'
                    : `سعر صرف ${activeCurrency.name} حر وقابل للتعديل المباشر على مستوى الفاتورة.`}
                </p>
              </div>

              {/* أزرار أسعار صرف شائعة سريعة */}
              {selectedCurrencyCode !== 'ILS' && (
                <div>
                  <span className="block text-[10px] text-slate-400 font-light mb-1 font-semibold">أسعار صرف مقترحة سريعة:</span>
                  <div className="flex gap-2 flex-wrap">
                    {(selectedCurrencyCode === 'USD' ? [3.65, 3.68, 3.70, 3.72, 3.75] :
                      selectedCurrencyCode === 'JOD' ? [5.15, 5.18, 5.20, 5.22, 5.25] :
                      selectedCurrencyCode === 'EUR' ? [3.95, 4.00, 4.05, 4.10] : [activeCurrency.rateAgainstBase]).map(r => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => handleExchangeRateChange(r)}
                        className={`px-1.5 py-0.5 text-xs font-mono font-bold rounded-lg border cursor-pointer transition-colors ${
                          customExchangeRate === r ? 'bg-amber-100 border-amber-500 text-amber-900' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        {r.toFixed(2)} ₪
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ملخص التحويل المباشر */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-600">إجمالي الفاتورة الأساسي بالشيكل:</span>
                  <span className="font-bold font-mono text-slate-900">{calculatedTotalAmount.toFixed(2)} ₪</span>
                </div>
                {selectedCurrencyCode !== 'ILS' && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>ما يعادل بالعملة المختارة ({activeCurrency.name}):</span>
                    <span className="font-mono">
                      {(calculatedTotalAmount / (customExchangeRate || 1)).toFixed(2)} {activeCurrency.symbol}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setActiveHeaderSubModal(null)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer shadow-xs text-xs"
              >
                تأكيد واعتماد
              </button>
            </div>
          </div>
        </div>
      )}

      {activeHeaderSubModal === 'representative' && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-5 max-w-sm w-full text-slate-800 space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span>اختيار مندوب المبيعات</span>
            </h3>
            <div className="space-y-2">
              {['مندوب المبيعات الرئيسي', 'كاشير الصالة', 'مندوب التوصيل', 'مسؤول التعاقدات الخارجية'].map(rep => (
                <div
                  key={rep}
                  onClick={() => {
                    setRepresentative(rep);
                    setActiveHeaderSubModal(null);
                  }}
                  className={`p-2.5 rounded-xl border cursor-pointer font-semibold text-xs transition-colors ${
                    representative === rep ? 'bg-blue-50 border-blue-500 text-blue-800' : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {rep}
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setActiveHeaderSubModal(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {activeHeaderSubModal === 'tax' && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-5 max-w-sm w-full text-slate-800 space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Percent className="w-4 h-4 text-indigo-600" />
              <span>إعدادات ضريبة القيمة المضافة (VAT)</span>
            </h3>
            <div className="space-y-3">
              <label className="flex items-center gap-2 font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={taxEnabled}
                  onChange={e => setTaxEnabled(e.target.checked)}
                  className="rounded text-indigo-600 w-4 h-4 cursor-pointer"
                />
                <span>تطبيق الضريبة على هذه الفاتورة</span>
              </label>

              {taxEnabled && (
                <div>
                  <label className="block text-slate-600 mb-1 text-[11px] font-semibold">نسبة الضريبة (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={taxRate}
                    onChange={e => setTaxRate(parseFloat(e.target.value) || 0)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-mono font-bold"
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setActiveHeaderSubModal(null)}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl cursor-pointer"
              >
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}

      {activeHeaderSubModal === 'additional' && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-5 max-w-sm w-full text-slate-800 space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-amber-600" />
              <span>المبالغ والمصاريف الإضافية</span>
            </h3>
            <div>
              <label className="block text-slate-600 mb-1 text-[11px] font-semibold">
                قيمة المصاريف الإضافية (توصيل، تركيب، تغليف):
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={additionalCharges}
                onChange={e => setAdditionalCharges(parseFloat(e.target.value) || 0)}
                className="w-full border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-mono font-bold"
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setActiveHeaderSubModal(null)}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl cursor-pointer"
              >
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}

      {activeHeaderSubModal === 'discount' && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-5 max-w-sm w-full text-slate-800 space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Tag className="w-4 h-4 text-rose-600" />
              <span>تطبيق خصم عام على الفاتورة</span>
            </h3>
            <div className="space-y-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDiscountType('amount')}
                  className={`flex-1 py-1.5 rounded-xl font-bold text-xs cursor-pointer ${
                    discountType === 'amount' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  خصم بمبلغ ثابت
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountType('percent')}
                  className={`flex-1 py-1.5 rounded-xl font-bold text-xs cursor-pointer ${
                    discountType === 'percent' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  خصم بنسبة مئوية (%)
                </button>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 text-[11px] font-semibold">
                  قيمة الخصم ({discountType === 'percent' ? '%' : settings.currency}):
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={overallDiscount}
                  onChange={e => setOverallDiscount(parseFloat(e.target.value) || 0)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-mono font-bold"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setActiveHeaderSubModal(null)}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl cursor-pointer"
              >
                تطبيق الخصم
              </button>
            </div>
          </div>
        </div>
      )}

      {activeHeaderSubModal === 'shipping' && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-5 max-w-sm w-full text-slate-800 space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-600" />
              <span>بيانات الشحن والتوصيل</span>
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-slate-600 mb-1 text-[11px] font-semibold">شركة / مندوب الشحن:</label>
                <input
                  type="text"
                  value={shippingDetails.carrier}
                  onChange={e => setShippingDetails(prev => ({ ...prev, carrier: e.target.value }))}
                  className="w-full border border-slate-300 rounded-xl px-3 py-1.5 text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1 text-[11px] font-semibold">عنوان التوصيل:</label>
                <input
                  type="text"
                  value={shippingDetails.address}
                  onChange={e => setShippingDetails(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full border border-slate-300 rounded-xl px-3 py-1.5 text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1 text-[11px] font-semibold">رقم التتبع / البوليصة:</label>
                <input
                  type="text"
                  value={shippingDetails.tracking}
                  onChange={e => setShippingDetails(prev => ({ ...prev, tracking: e.target.value }))}
                  className="w-full border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-mono"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setActiveHeaderSubModal(null)}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl cursor-pointer"
              >
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}

      {activeHeaderSubModal === 'notes' && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-5 max-w-sm w-full text-slate-800 space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>ملاحظات الفاتورة</span>
            </h3>
            <textarea
              rows={4}
              value={invoiceNotes}
              onChange={e => setInvoiceNotes(e.target.value)}
              placeholder="اكتب أي شروط أو ملاحظات خاصة بالفاتورة..."
              className="w-full border border-slate-300 rounded-xl p-3 text-xs bg-slate-50"
            />
            <div className="flex justify-end">
              <button
                onClick={() => setActiveHeaderSubModal(null)}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl cursor-pointer"
              >
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Panels Modals */}
      <CalculatorModal
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
        onApplyResult={val => {
          if (activeRowId) {
            handleUpdateLine(activeRowId, 'unitPrice', val);
          }
        }}
      />

      <QuickAddItemModal
        isOpen={isQuickAddOpen}
        onClose={() => {
          setIsQuickAddOpen(false);
          setQuickAddInitialName('');
        }}
        initialName={quickAddInitialName}
        onItemCreatedAndAdd={item => {
          if (activeRowId) {
            const line = tableLines.find(l => l.id === activeRowId);
            if (line && (!line.itemName || line.itemName === quickAddInitialName)) {
              const price = pricingTier === 'wholesale'
                ? Number((item.sellingPrice * 0.9).toFixed(2))
                : item.sellingPrice;
              setTableLines(prev =>
                prev.map(l =>
                  l.id === activeRowId
                    ? {
                        ...l,
                        itemName: item.name,
                        barcode: item.barcode || '',
                        inventoryItemId: item.id,
                        unitPrice: price,
                        total: calculateLineTotal(l.length, l.width, l.quantity, price)
                      }
                    : l
                )
              );
              posSound.beep();
              return;
            }
          }
          handleAddItemToTable(item);
        }}
      />

      <PriceEditModal
        isOpen={isPriceEditOpen}
        onClose={() => setIsPriceEditOpen(false)}
        onPriceUpdated={(itemId, newPrice) => {
          setTableLines(prev =>
            prev.map(line => {
              if (line.inventoryItemId === itemId) {
                return {
                  ...line,
                  unitPrice: newPrice,
                  total: calculateLineTotal(line.length, line.width, line.quantity, newPrice)
                };
              }
              return line;
            })
          );
        }}
      />

      <CustomerLedgerModal
        isOpen={isCustomerLedgerOpen}
        onClose={() => setIsCustomerLedgerOpen(false)}
        currentCustomer={currentCustomer}
      />

      <RequisitionModal
        isOpen={isRequisitionOpen}
        onClose={() => setIsRequisitionOpen(false)}
      />

      <FavoriteItemsDrawer
        isOpen={isFavoritesOpen}
        onClose={() => setIsFavoritesOpen(false)}
        onSelectItem={item => handleAddItemToTable(item)}
      />

      <InvoicesReviewModal
        isOpen={isInvoicesReviewOpen}
        onClose={() => setIsInvoicesReviewOpen(false)}
        onLoadInvoiceToScreen={inv => loadInvoiceToScreen(inv)}
      />

      <HeldInvoicesModal
        isOpen={isHeldInvoicesOpen}
        onClose={() => setIsHeldInvoicesOpen(false)}
        heldInvoices={heldInvoices}
        onResumeInvoice={held => handleResumeHeldInvoice(held)}
        onDeleteHeldInvoice={id => setHeldInvoices(prev => prev.filter(h => h.id !== id))}
      />

      <ItemSearchModal
        isOpen={isItemSearchOpen}
        onClose={() => setIsItemSearchOpen(false)}
        onSelectItem={item => handleAddItemToTable(item)}
      />

      <BarcodeScannerModal
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        inventory={inventory}
        onScanItem={item => {
          handleAddItemToTable(item);
        }}
        onScanBarcode={barcode => {
          const item = (inventory || []).find(i => matchItemByBarcode(i, barcode));
          if (item) {
            setBarcodeNotFoundAlert(null);
            handleAddItemToTable(item);
          } else {
            posSound.error();
            setBarcodeNotFoundAlert(barcode);
            alert(`الصنف غير موجود\nالباركود: [${barcode}]`);
          }
        }}
      />

      {/* POS Buttons & Interface Layout Customizer Modal */}
      <PosButtonCustomizerModal
        isOpen={isButtonCustomizerOpen}
        onClose={() => setIsButtonCustomizerOpen(false)}
        buttons={posButtons}
        onSaveButtons={handleSavePosButtons}
        onToggleLiveEdit={() => setIsLiveCustomizing(prev => !prev)}
        isLiveEditActive={isLiveCustomizing}
        inventory={inventory}
      />

      {/* POS Full Layout Designer Drawer */}
      <PosLayoutDesignerDrawer
        isOpen={isLayoutDesignerOpen}
        onClose={() => setIsLayoutDesignerOpen(false)}
        config={posLayoutConfig}
        layoutConfig={posLayoutConfig}
        onSaveConfig={handleSavePosLayoutConfig}
        onUpdateLayoutConfig={handleSavePosLayoutConfig}
        onOpenButtonCustomizer={() => {
          setIsLayoutDesignerOpen(false);
          setIsButtonCustomizerOpen(true);
        }}
        isLiveEditActive={isLiveCustomizing}
        isLiveCustomizing={isLiveCustomizing}
        onToggleLiveEdit={() => setIsLiveCustomizing(prev => !prev)}
        onToggleLiveCustomizing={() => setIsLiveCustomizing(prev => !prev)}
      />

      {/* Customer Special Prices Modal */}
      <CustomerSpecialPricesModal
        party={effectivePricingCustomerObj}
        isOpen={isSpecialPricesModalOpen}
        onClose={() => setIsSpecialPricesModalOpen(false)}
        onSavePrices={(prices) => {
          if (effectivePricingCustomerObj) {
            updateParty(effectivePricingCustomerObj.id, {
              specialPrices: prices
            });
            setTableLines(prev => applyCustomerPricingToLines({ ...effectivePricingCustomerObj, specialPrices: prices }, prev));
          }
        }}
      />



      {/* Item Line Attachments Modal */}
      {activeLineForAttachments && (
        <LineAttachmentsModal
          isOpen={Boolean(activeLineForAttachments)}
          onClose={() => setActiveLineForAttachments(null)}
          itemName={activeLineForAttachments.itemName || 'بند الفاتورة'}
          attachments={activeLineForAttachments.attachments || []}
          onSaveAttachments={(newAttachments) => {
            handleUpdateLine(activeLineForAttachments.id, 'attachments', newAttachments);
            setActiveLineForAttachments(null);
          }}
        />
      )}
    
    </div>
  </div></div>
  );
};
