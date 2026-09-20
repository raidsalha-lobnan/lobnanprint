import { CATEGORY_DEFINITIONS } from '../utils/barcodeGenerator';
import {
  Account,
  InventoryItem,
  Party,
  PrintJobOrder,
  Invoice,
  PurchaseInvoice,
  PurchaseReturn,
  SalesReturn,
  JournalEntry,
  PaymentVoucher,
  BusinessSettings,
  Employee,
  EmployeeAdvance,
  EmployeeDeduction,
  EmployeeIncentive,
  PayrollSheet,
  Treasury,
  StockMovement,
  ExpenseItem
} from '../types';
import { defaultCurrencies } from '../utils/currencies';
import { defaultUnitsOfMeasure } from '../utils/unitsOfMeasure';

export const initialSettings: BusinessSettings = {
  categories: Object.values(CATEGORY_DEFINITIONS),
  businessName: 'مكتبة ومطبعة النور الحديثة',
  businessNameEn: 'Al-Noor Modern Press & Bookstore',
  activityType: 'خدمات الطباعة والنشر والقرطاسية والأدوات المدرسية',
  taxNumber: '310984725100003',
  crNumber: '1010729384',
  phone: '02-2987654 / 0599123456',
  email: 'info@alnoorpress.com',
  address: 'فلسطين - رام الله / القدس / نابلس',
  addresses: [
    'الفرع الرئيسي والمطبعة: رام الله - شارع الإرسال - عمارة النور',
    'فرع المكتبة والقرطاسية: القدس - شارع صلاح الدين',
    'فرع المبيعات والتوزيع: نابلس - رفيديا'
  ],
  phones: [
    '02-2987654 (الإدارة العامة والفاكس)',
    '0599-123456 (مبيعات وقرطاسية)',
    '0568-987654 (خدمات الطباعة والتصاميم)'
  ],
  name: 'مكتبة ومطبعة النور الحديثة',
  description: 'طباعة أوفست وديجيتال - خامات ومطبوعات وأدوات قرطاسية متكاملة',
  currency: '₪',
  baseCurrencyCode: 'ILS',
  vatRate: 16,
  invoiceFooterNote: 'شكراً لتعاملكم معنا. المواد المطبوعة بحسب المواصفات المعتمدة لا ترد ولا تستبدل بعد التسليم.',
  logoText: 'النور',
  currencies: defaultCurrencies,
  unitsOfMeasure: defaultUnitsOfMeasure,
  sqlServerConfig: {
    enabled: false,
    serverUrl: 'http://localhost:3000/api/sync',
    dbType: 'postgres',
    dbName: 'alnoor_press_db',
    autoSync: false,
    syncIntervalMinutes: 30
  },
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
};

export const initialAccounts: Account[] = [
  // 1. الأصول (Assets)
  { code: '1101', name: 'الصندوق النقدي (الكاشير)', type: 'asset', balance: 14250, isSystem: true, description: 'السيولة النقدية في خزينة المطبعة والمكتبة' },
  { code: '1102', name: 'الحساب البنكي (مصرف الراجحي)', type: 'asset', balance: 85600, isSystem: true, description: 'الحساب الجاري الرئيسي ومبيعات نقاط الدفع الإلكتروني (مدى)' },
  { code: '1103', name: 'جهاز نقاط البيع ومدى (POS)', type: 'asset', balance: 18400, isSystem: true, description: 'متحصلات شبكة مدى وبطاقات الدفع في الكاشير' },
  { code: '1105', name: 'تطبيق STC Pay للأعمال', type: 'asset', balance: 6500, isSystem: true, description: 'محفظة رقمية للمدفوعات السريعة عبر رمز QR' },
  { code: '1104', name: 'سلف ومستحقات الموظفين', type: 'asset', balance: 500, isSystem: true, description: 'سلف الموظفين المعلقة للخصم من الرواتب' },
  { code: '1201', name: 'العملاء والذمم المدينة', type: 'asset', balance: 12400, isSystem: true, description: 'مستحقات آجلة وعرابين متبقية على عملاء الشركات والأفراد' },
  { code: '1301', name: 'مخزون الكتب والقرطاسية', type: 'asset', balance: 42000, isSystem: true, description: 'قيمة مخزون الأدوات المدرسية والكتب المتاحة للبيع' },
  { code: '1302', name: 'مخزون خامات وأوراق المطبعة', type: 'asset', balance: 28500, isSystem: true, description: 'رولات الورق الكوشيه والبانر وأحبار ماكينات الطباعة' },
  { code: '1501', name: 'ماكينات ومعدات الطباعة', type: 'asset', balance: 165000, isSystem: true, description: 'ماكينات الطباعة الرقمية والأوفست ومقصات الورق وآلات التجليد' },
  
  // 2. الخصوم (Liabilities)
  { code: '2101', name: 'الموردون والذمم الدائنة', type: 'liability', balance: 18500, isSystem: true, description: 'مستحقات شركات الورق ودور النشر وموردي الأحبار' },
  { code: '2103', name: 'أمانات ضريبة القيمة المضافة المستحقة (VAT)', type: 'liability', balance: 3450, isSystem: true, description: 'صافي الضريبة الواجب توريدها لهيئة الزكاة والضريبة والجمارك' },
  
  // 3. حقوق الملكية (Equity)
  { code: '3101', name: 'رأس المال المدفوع', type: 'equity', balance: 300000, isSystem: true, description: 'رأس المال المؤسس للمنشأة' },
  { code: '3102', name: 'جاري المالك / مسحوبات الشركاء', type: 'equity', balance: 0, isSystem: true, description: 'المسحوبات الشخصية وتغذية رأس المال الخاصة بمالك المنشأة والشركاء' },
  { code: '3201', name: 'الأرباح المبقاة والمرحلة', type: 'equity', balance: 25800, isSystem: true, description: 'أرباح متراكمة من الفترات السابقة' },
  
  // 4. الإيرادات (Revenue)
  { code: '4101', name: 'إيرادات مبيعات المكتبة والقرطاسية', type: 'revenue', balance: 48900, isSystem: true, description: 'مبيعات الكاشير من الأدوات المدرسية والروايات واللوازم المكتبية' },
  { code: '4102', name: 'إيرادات أعمال ومطبوعات المطبعة', type: 'revenue', balance: 76500, isSystem: true, description: 'إيرادات عقود الكروت والبروشورات والبانرات وملازم المدارس' },
  { code: '4103', name: 'إيرادات خدمات التصوير والتجليد الفوري', type: 'revenue', balance: 11200, isSystem: true, description: 'تصوير مستندات، طباعة رسائل، تغليف حراري' },
  { code: '4201', name: 'إيرادات نقدية متنوعة وأخرى', type: 'revenue', balance: 0, isSystem: true, description: 'إيرادات متفرقة غير تشغيلية وأرباح نقدية متنوعة' },
  
  // 5. المصروفات وتكلفة البضاعة (Expenses & COGS)
  { code: '5101', name: 'تكلفة مبيعات القرطاسية والكتب', type: 'expense', balance: 28400, isSystem: true, description: 'تكلفة شراء الأصناف المباعة في المكتبة' },
  { code: '5102', name: 'تكلفة خامات وأحبار ومستهلكات الطباعة', type: 'expense', balance: 34800, isSystem: true, description: 'قيمة الأوراق والزنكات والأحبار المستهلكة في عمليات الطباعة' },
  { code: '5201', name: 'مصروفات الرواتب والأجور', type: 'expense', balance: 22000, isSystem: true, description: 'رواتب موظفي المكتبة وفنيي المطبعة' },
  { code: '5202', name: 'إيجار المعرض والمطبعة', type: 'expense', balance: 15000, isSystem: true, description: 'إيجار المقر' },
  { code: '5203', name: 'مصروفات الصيانة وقطع غيار الماكينات', type: 'expense', balance: 4500, isSystem: true, description: 'صيانة دورية لطابعات Konica و Heidelberg والمقص الهيدروليكي' },
  { code: '5204', name: 'الكهرباء والمياه والإنترنت', type: 'expense', balance: 3200, isSystem: true, description: 'فواتير الطاقة والمرافق' },
  { code: '5205', name: 'مصروفات عمومية وتسويق', type: 'expense', balance: 2100, isSystem: true, description: 'مصاريف تسويقية وضيافة وأدوات نظافة' },
];

export const initialInventory: InventoryItem[] = [
  // قرطاسية ومكتبة
  {
    id: 'inv-1',
    code: 'STAT-0001',
    barcode: '62810010001',
    name: 'دفتر سلك جامعي 200 صفحة مسطر فاخر',
    category: 'stationery',
    unit: 'حبة',
    purchasePrice: 8.5,
    sellingPrice: 15.0,
    sellingPrice2: 13.0,
    sellingPrice3: 11.5,
    customerSpecialPrices: [
      {
        customerId: 'pt-1',
        customerName: 'عميل كاشير نقدي',
        customerCode: 'CUST-0001',
        price: 11.0,
        notes: 'سعر خاص عميل تعاقدي دائم'
      },
      {
        customerId: 'pt-2',
        customerName: 'مدارس رواد الغد الأهلية',
        customerCode: 'CUST-0002',
        price: 10.5,
        notes: 'سعر خاص توريد مدارس وطلاب'
      }
    ],
    stockQuantity: 180,
    minAlertQuantity: 30,
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=60',
    isFavorite: true,
    description: 'غلاف مقوى، ورق أبيض 80 جرام، جودة ممتازة'
  },
  {
    id: 'inv-2',
    code: 'STAT-0002',
    barcode: '62810010002',
    name: 'طقم أقلام حبر جاف أزرق روكو (علبة 50 قلم)',
    category: 'stationery',
    unit: 'علبة',
    purchasePrice: 22.0,
    sellingPrice: 35.0,
    sellingPrice2: 30.0,
    sellingPrice3: 28.0,
    customerSpecialPrices: [
      {
        customerId: 'pt-1',
        customerName: 'عميل كاشير نقدي',
        customerCode: 'CUST-0001',
        price: 27.0,
        notes: 'سعر مخصص للطلبات الدورية'
      }
    ],
    stockQuantity: 45,
    minAlertQuantity: 10,
    imageUrl: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400&auto=format&fit=crop&q=60',
    isFavorite: true,
    description: 'أقلام كتابة ناعمة 0.7 ملم'
  },
  {
    id: 'inv-3',
    code: 'STAT-0003',
    barcode: '62810010003',
    name: 'كرتون ورق تصوير A4 رويال 80 جرام (5 رزم)',
    category: 'stationery',
    unit: 'كرتونة',
    purchasePrice: 75.0,
    sellingPrice: 95.0,
    sellingPrice2: 88.0,
    sellingPrice3: 84.0,
    customerSpecialPrices: [
      {
        customerId: 'pt-2',
        customerName: 'مدارس رواد الغد الأهلية',
        customerCode: 'CUST-0002',
        price: 82.0,
        notes: 'سعر توريد الامتحانات السنوي'
      }
    ],
    stockQuantity: 65,
    minAlertQuantity: 15,
    imageUrl: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=400&auto=format&fit=crop&q=60',
    isFavorite: true,
    description: 'بياض عالي 100% مناسب لكافة أنواع الطابعات والفاكس'
  },
  {
    id: 'inv-4',
    code: 'STAT-0004',
    barcode: '62810010004',
    name: 'آلة حاسبة علمية كاسيو fx-991ARX الأصلية',
    category: 'stationery',
    unit: 'حبة',
    purchasePrice: 85.0,
    sellingPrice: 120.0,
    stockQuantity: 24,
    minAlertQuantity: 5,
    imageUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&auto=format&fit=crop&q=60',
    isFavorite: true,
    description: 'تدعم اللغة العربية، 552 دالة علمية'
  },
  {
    id: 'inv-5',
    code: 'BOOK-0001',
    barcode: '97860301001',
    name: 'كتاب "قوة العادات" - تشارلز دويج (مترجم)',
    category: 'books',
    unit: 'كتاب',
    purchasePrice: 35.0,
    sellingPrice: 55.0,
    stockQuantity: 18,
    minAlertQuantity: 4,
    imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&auto=format&fit=crop&q=60',
    isFavorite: true,
    description: 'تطوير الذات وإدارة الوقت'
  },
  {
    id: 'inv-6',
    code: 'BOOK-0002',
    barcode: '97860301002',
    name: 'رواية "ثلاثية غرناطة" - رضوى عاشور',
    category: 'books',
    unit: 'كتاب',
    purchasePrice: 40.0,
    sellingPrice: 65.0,
    stockQuantity: 12,
    minAlertQuantity: 3,
    imageUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&auto=format&fit=crop&q=60',
    isFavorite: true,
    description: 'أدب وروايات تاريخية'
  },

  // خامات ومواد خام للمطبعة
  {
    id: 'raw-1',
    code: 'RAW-0001',
    barcode: '7001000001',
    name: 'رول ورق كوشيه مطفي 300 جرام مقاس 70×100 (باندة)',
    category: 'print_raw',
    unit: 'باندة (500 فرخ)',
    purchasePrice: 420.0,
    sellingPrice: 580.0,
    stockQuantity: 14,
    minAlertQuantity: 4,
    isRawMaterial: true,
    description: 'مخصص لطباعة الكروت الفاخرة وأغلفة الكتب والبروشورات'
  },
  {
    id: 'raw-2',
    code: 'RAW-0002',
    barcode: '7001000002',
    name: 'ورق كوشيه لامع 150 جرام مقاس 70×100',
    category: 'print_raw',
    unit: 'باندة (500 فرخ)',
    purchasePrice: 260.0,
    sellingPrice: 370.0,
    stockQuantity: 22,
    minAlertQuantity: 5,
    isRawMaterial: true,
    description: 'مخصص للفلايرات والبروشورات التسويقية والكتالوجات'
  },
  {
    id: 'raw-3',
    code: 'RAW-0003',
    barcode: '7001000003',
    name: 'رول بانر كوري أوت دور وزن 440 جرام مقاس 3.2م × 50م',
    category: 'print_raw',
    unit: 'رول',
    purchasePrice: 380.0,
    sellingPrice: 600.0,
    stockQuantity: 8,
    minAlertQuantity: 2,
    isRawMaterial: true,
    description: 'مقاوم للشمس والعوامل الجوية للوحات واليفط'
  },
  {
    id: 'raw-4',
    code: 'RAW-0004',
    barcode: '7001000004',
    name: 'طقم أحبار كونيكا مينولتا ليزر رقمي أصلي (C-M-Y-K)',
    category: 'print_raw',
    unit: 'طقم',
    purchasePrice: 1450.0,
    sellingPrice: 1900.0,
    stockQuantity: 5,
    minAlertQuantity: 2,
    isRawMaterial: true,
    description: 'تكفي حتى 45,000 صفحة تغطية 5%'
  },
  {
    id: 'raw-5',
    code: 'RAW-0005',
    barcode: '7001000005',
    name: 'رول سلوفان حراري مطفي (سيلفر مات) 35 ميكرون',
    category: 'print_raw',
    unit: 'رول',
    purchasePrice: 180.0,
    sellingPrice: 280.0,
    stockQuantity: 9,
    minAlertQuantity: 3,
    isRawMaterial: true,
    description: 'للتغليف والتشطيب الفاخر للكروت والبروشورات'
  },

  // خدمات تصوير وطباعة فورية
  {
    id: 'srv-1',
    code: 'SRV-0001',
    barcode: '9901000001',
    name: 'تصوير مستندات A4 أبيض وأسود وجه واحد',
    category: 'copy_scan',
    unit: 'صفحة',
    purchasePrice: 0.05,
    sellingPrice: 0.25,
    stockQuantity: 9999,
    minAlertQuantity: 0,
    description: 'تصوير سريع بالماكينة الرقمية'
  },
  {
    id: 'srv-2',
    code: 'SRV-0002',
    barcode: '9901000002',
    name: 'طباعة ليزر ملونة A4 جودة عالية دقة 1200 DPI',
    category: 'copy_scan',
    unit: 'صفحة',
    purchasePrice: 0.20,
    sellingPrice: 1.00,
    stockQuantity: 9999,
    minAlertQuantity: 0,
    description: 'طباعة بحوث وتقارير وعروض تقديمية'
  },
  {
    id: 'srv-3',
    code: 'SRV-0003',
    barcode: '9901000003',
    name: 'تجليد سلك لولبي حلزوني مع غلاف شفاف وكرتون مقوى',
    category: 'copy_scan',
    unit: 'كتاب/ملزمة',
    purchasePrice: 1.5,
    sellingPrice: 6.0,
    stockQuantity: 350,
    minAlertQuantity: 40,
    description: 'تجميع وتخريم ملازم دراسية وأبحاث'
  }
];

export const initialParties: Party[] = [
  {
    id: 'pt-1',
    code: 'CUST-0001',
    type: 'customer',
    name: 'عميل كاشير نقدي',
    phone: '0551122334',
    email: 'info@alsahab.com',
    taxNumber: '300998877600003',
    commercialRegister: '1010897654',
    contactPerson: 'عبدالعزيز العتيبي (مدير المشتريات)',
    city: 'الرياض',
    address: 'طريق التخصصي، حي المعذر',
    balance: 1850.0,
    openingBalance: 1200.0,
    openingBalanceDate: '2026-01-01',
    openingBalanceType: 'debit',
    creditLimit: 5000,
    notes: 'عميل دائم لطباعة المنيو والفواتير والستيكرات ومواد التعبئة'
  },
  {
    id: 'pt-sub-1',
    code: 'SUB-0001',
    type: 'customer',
    name: 'محمود أحمد',
    phone: '01557735502',
    parentPartyId: 'pt-1',
    isSubCustomer: true,
    city: 'الرياض',
    address: 'فرع التخصصي',
    balance: 380.0,
    openingBalance: 380.0,
    openingBalanceDate: '2026-01-01',
    openingBalanceType: 'debit',
    creditLimit: 2000,
    notes: 'زبون فرعي / دين مؤقت متصل بعميل كاشير نقدي'
  },
  {
    id: 'pt-2',
    code: 'CUST-0002',
    type: 'customer',
    name: 'مدارس رواد الغد الأهلية',
    phone: '0544332211',
    email: 'finance@rowad-school.edu.sa',
    taxNumber: '301223344500003',
    commercialRegister: '1010344556',
    contactPerson: 'أ. فهد الشمري (المشرف المالي)',
    city: 'الرياض',
    address: 'حي النزهة، شارع الأمير مقرن',
    balance: 4600.0,
    openingBalance: 3000.0,
    openingBalanceDate: '2026-01-01',
    openingBalanceType: 'debit',
    creditLimit: 15000,
    notes: 'طباعة ملازم الاختبارات ودفاتر المتابعة وشهادات التكريم'
  },
  {
    id: 'pt-3',
    code: 'CUST-0003',
    type: 'customer',
    name: 'مؤسسة أفق التقنية للتجارة',
    phone: '0509988112',
    email: 'contact@ofoqtech.com',
    taxNumber: '302334455600003',
    commercialRegister: '1010655443',
    contactPerson: 'المهندس رائد المالكي',
    city: 'الرياض',
    address: 'طريق الملك عبدالله، حي الواحة',
    balance: 0.0,
    openingBalance: 0.0,
    openingBalanceDate: '2026-01-01',
    openingBalanceType: 'debit',
    creditLimit: 3000,
    notes: 'كروت شخصية وبروشورات تسويقية'
  },
  {
    id: 'pt-4',
    code: 'SUPP-0001',
    type: 'supplier',
    name: 'شركة روائع الورق للتجارة والتوزيع',
    phone: '0112233445',
    email: 'sales@paperwonders.sa',
    taxNumber: '310112233400003',
    commercialRegister: '1010998877',
    contactPerson: 'خالد عبد الوهاب (مسؤول المبيعات)',
    city: 'الرياض',
    address: 'المنطقة الصناعية الثانية، مخرج 15',
    balance: -8200.0, // دائن (له علينا)
    openingBalance: 3885.0,
    openingBalanceDate: '2026-01-01',
    openingBalanceType: 'credit',
    creditLimit: 25000,
    notes: 'المورد الرئيسي لورق الكوشيه والرويال ورولات البانر والمقوى'
  },
  {
    id: 'pt-5',
    code: 'SUPP-0002',
    type: 'supplier',
    name: 'مؤسسة التقنية للأحبار ومستلزمات المطابع',
    phone: '0113344556',
    email: 'info@inks-tech.com',
    taxNumber: '310556677800003',
    commercialRegister: '1010887766',
    contactPerson: 'م. حسام غانم',
    city: 'الرياض',
    address: 'حي السلي، شارع اسطنبول',
    balance: -3500.0,
    openingBalance: 3500.0,
    openingBalanceDate: '2026-01-01',
    openingBalanceType: 'credit',
    creditLimit: 15000,
    notes: 'توريد أحبار كونيكا وأحبار الايكوسولفنت وقطع الغيار الأصلية'
  }
];

export const initialPrintOrders: PrintJobOrder[] = [
  {
    id: 'job-101',
    orderNumber: 'JOB-2026-0084',
    customerId: 'pt-1',
    customerName: 'عميل كاشير نقدي',
    customerPhone: '0551122334',
    title: 'طباعة منيو طعام فاخر مقاس A4 مطوي وجهين',
    serviceType: 'flyer_brochure',
    paperType: 'كوشيه 300 جرام فاخر',
    dimensions: 'A4 مفتوح (21×29.7 سم)',
    quantity: 1000,
    colorType: 'ألوان كاملة 4/4 وجهين',
    finishingOptions: ['سلوفان مطفي مقاوم للمياه', 'ريجة وثني نصفي', 'قص زوايا دائرية'],
    unitCost: 1.10,
    totalPrice: 1955.0, // شامل الضريبة
    depositPaid: 1000.0,
    remainingBalance: 955.0,
    status: 'printing',
    notes: 'التأكد من تشبع ألوان صور الوجبات وتجربة بروفة أولية قبل السحب الكامل',
    createdAt: '2026-09-02',
    deliveryDate: '2026-09-06'
  },
  {
    id: 'job-102',
    orderNumber: 'JOB-2026-0085',
    customerId: 'pt-3',
    customerName: 'مؤسسة أفق التقنية للتجارة',
    customerPhone: '0509988112',
    title: 'كروت شخصية للمديرين التنفيذيين مع بصمة ذهبية',
    serviceType: 'business_cards',
    paperType: 'كوشيه 350 جرام مستورد',
    dimensions: '9 × 5.5 سم',
    quantity: 2000,
    colorType: 'وجهين ألوان كاملة + بصمة ذهب فلاش',
    finishingOptions: ['سلوفان حراري ناعم الملمس Soft Touch', 'بصمة حرارية ذهبية للشعار', 'سبوت يو في موضعي Spot UV'],
    unitCost: 0.35,
    totalPrice: 1380.0,
    depositPaid: 1380.0,
    remainingBalance: 0.0,
    status: 'finishing',
    notes: 'الشعار يحتاج زنكة خاصة للبصمة الحرارية - تم تجهيزها',
    createdAt: '2026-09-03',
    deliveryDate: '2026-09-05'
  },
  {
    id: 'job-103',
    orderNumber: 'JOB-2026-0086',
    customerId: 'pt-2',
    customerName: 'مدارس رواد الغد الأهلية',
    customerPhone: '0544332211',
    title: 'طباعة وتجليد ملازم ومذكرات الفصل الدراسي الأول',
    serviceType: 'books_booklets',
    paperType: 'داخلي 80g أبيض + غلاف كوشيه 250g سيلفر',
    dimensions: 'A4 كتابي 80 صفحة',
    quantity: 500,
    colorType: 'الغلاف ألوان كاملة - الداخلي أسود',
    finishingOptions: ['تجليد غراء حراري كوري (Perfect Binding)', 'سلوفان لامع للغلاف'],
    unitCost: 6.80,
    totalPrice: 5750.0,
    depositPaid: 2000.0,
    remainingBalance: 3750.0,
    status: 'design',
    notes: 'العميل بصدد مراجعة ملف PDF النهائي للتنسيق الداخلي قبل البدء',
    createdAt: '2026-09-04',
    deliveryDate: '2026-09-10'
  },
  {
    id: 'job-104',
    orderNumber: 'JOB-2026-0087',
    customerId: 'pt-1',
    customerName: 'عميل كاشير نقدي',
    customerPhone: '0551122334',
    title: 'لوحة فليكس مضيئة مع حديد ومحولات إضاءة',
    serviceType: 'banner_flex',
    paperType: 'فليكس كوري أصلي مضيء',
    dimensions: '400 × 120 سم',
    quantity: 1,
    colorType: 'ألوان فوتوغرافية دقة عالية خارجي',
    finishingOptions: ['حلقات معدنية وزوايا تثبيت', 'شاسيه حديد مع أجنحة تركيب'],
    unitCost: 320.0,
    totalPrice: 862.5,
    depositPaid: 500.0,
    remainingBalance: 362.5,
    status: 'ready',
    notes: 'جاهزة في مستودع التسليم مع المسامير والملحقات',
    createdAt: '2026-09-01',
    deliveryDate: '2026-09-04'
  }
];

export const initialInvoices: Invoice[] = [
  {
    id: 'inv-pos-1001',
    invoiceNumber: 'INV-2026-1001',
    date: '2026-09-04',
    customerName: 'عميل كاشير نقدي',
    type: 'pos',
    items: [
      { itemId: 'inv-1', itemName: 'دفتر سلك جامعي 200 صفحة مسطر فاخر', quantity: 2, unitPrice: 15.0, discount: 0, tax: 4.5, total: 34.5 },
      { itemId: 'inv-2', itemName: 'طقم أقلام حبر جاف أزرق روكو', quantity: 1, unitPrice: 35.0, discount: 0, tax: 5.25, total: 40.25 },
      { itemId: 'srv-1', itemName: 'تصوير مستندات A4 أبيض وأسود', quantity: 40, unitPrice: 0.25, discount: 0, tax: 1.5, total: 11.5 }
    ],
    subtotal: 75.0,
    discountTotal: 0,
    taxRate: 15,
    taxAmount: 11.25,
    totalAmount: 86.25,
    paidAmount: 86.25,
    remainingAmount: 0,
    paymentMethod: 'card',
    status: 'paid'
  },
  {
    id: 'inv-pos-1002',
    invoiceNumber: 'INV-2026-1002',
    date: '2026-09-04',
    customerName: 'الأستاذ فهد القحطاني',
    type: 'pos',
    items: [
      { itemId: 'inv-4', itemName: 'آلة حاسبة علمية كاسيو fx-991ARX الأصلية', quantity: 1, unitPrice: 120.0, discount: 10.0, tax: 16.5, total: 126.5 },
      { itemId: 'inv-5', itemName: 'كتاب "قوة العادات" - تشارلز دويج', quantity: 1, unitPrice: 55.0, discount: 0, tax: 8.25, total: 63.25 }
    ],
    subtotal: 165.0,
    discountTotal: 10.0,
    taxRate: 15,
    taxAmount: 24.75,
    totalAmount: 189.75,
    paidAmount: 189.75,
    remainingAmount: 0,
    paymentMethod: 'cash',
    status: 'paid'
  },
  {
    id: 'inv-job-1003',
    invoiceNumber: 'INV-2026-1003',
    date: '2026-09-03',
    customerId: 'pt-3',
    customerName: 'مؤسسة أفق التقنية للتجارة',
    customerPhone: '0509988112',
    customerTaxNumber: '302334455600003',
    type: 'print_order',
    printJobId: 'job-102',
    items: [
      { itemId: 'job-102', itemName: 'كروت شخصية للمديرين التنفيذيين مع بصمة ذهبية (2000 كرت)', quantity: 1, unitPrice: 1200.0, discount: 0, tax: 180.0, total: 1380.0 }
    ],
    subtotal: 1200.0,
    discountTotal: 0,
    taxRate: 15,
    taxAmount: 180.0,
    totalAmount: 1380.0,
    paidAmount: 1380.0,
    remainingAmount: 0,
    paymentMethod: 'bank_transfer',
    status: 'paid',
    workflowStatus: 'ready',
    subCustomerName: 'الإدارة التنفيذية',
    deliveryDate: '2026-09-05',
    notes: 'كروت شخصية فاخرة مع بصمة ذهب وسلوفان ناعم'
  },
  {
    id: 'inv-wk-1004',
    invoiceNumber: 'INV-2026-1004',
    date: '2026-09-04',
    customerId: 'pt-1',
    customerName: 'شركة إعمار الأندلس للمقاولات',
    customerPhone: '0551122334',
    subCustomerName: 'إدارة المشاريع والتخطيط',
    deliveryDate: '2026-09-12',
    workflowStatus: 'design',
    status: 'paid',
    type: 'print_order',
    notes: 'مطلوب الالتزام بالألوان المعتمدة ومراجعة مواضع الشعار بدقة قبل الاعتماد النهائي',
    items: [
      {
        itemId: 'ds-1',
        itemName: 'كتيب بروفايل الشركة الفاخر مقاس A4',
        dimensions: 'A4 مغلق (21×29.7 سم)',
        quantity: 500,
        unit: 'كتيب',
        unitPrice: 12.0,
        discount: 0,
        tax: 900,
        total: 6900,
        notes: 'غلاف كوشيه 350g سلوفان مطفي + داخلي 150g كوشيه لامع مع تجليد سلك مخفي',
        attachments: [
          {
            id: 'att-orig-1',
            name: 'الهوية_البصرية_والشعار_الرسمي_V1.pdf',
            size: 4520000,
            type: 'application/pdf',
            uploadedAt: '2026-09-04 10:30',
            isOriginal: true,
            uploadedBy: 'أحمد النجار (قسم المبيعات)'
          }
        ]
      }
    ],
    technicalNotes: [
      {
        id: 'tn-1',
        userName: 'م. سليم (مصمم جرافيك)',
        text: 'تم الانتهاء من المسودة الأولى للغلاف، بانتظار استلام النصوص المعدلة للصفحات الداخلية من العميل.',
        createdAt: '2026-09-04 14:15'
      }
    ],
    subtotal: 6000.0,
    discountTotal: 0,
    taxRate: 15,
    taxAmount: 900.0,
    totalAmount: 6900.0,
    paidAmount: 6900.0,
    remainingAmount: 0,
    paymentMethod: 'bank_transfer'
  },
  {
    id: 'inv-wk-1005',
    invoiceNumber: 'INV-2026-1005',
    date: '2026-09-04',
    customerId: 'pt-2',
    customerName: 'مدارس رواد الغد الأهلية',
    customerPhone: '0544332211',
    subCustomerName: 'المرحلة الابتدائية - قسم الأنشطة',
    deliveryDate: '2026-09-10',
    workflowStatus: 'pending_approval',
    status: 'partial',
    type: 'print_order',
    notes: 'تم إرسال بروفة رقمية عبر الواتساب للمدير المالي وننتظر الموافقة الخطية للبدء الفعلي',
    items: [
      {
        itemId: 'ds-2',
        itemName: 'شهادات تقدير وتفوق مع فولدرات مقوى بصمة ذهبية',
        dimensions: 'A4 فاخر',
        quantity: 300,
        unit: 'طقم',
        unitPrice: 8.5,
        discount: 0,
        tax: 382.5,
        total: 2932.5,
        notes: 'ورق فابريانو إيطالي 280 جرام مع كليشة بصمة ساخنة ذهبي فلاش',
        attachments: [
          {
            id: 'att-orig-2',
            name: 'تصميم_شهادة_التقدير_المعتمد_مبدئيا.pdf',
            size: 3120000,
            type: 'application/pdf',
            uploadedAt: '2026-09-04 09:15',
            isOriginal: true,
            uploadedBy: 'أحمد النجار (قسم المبيعات)'
          },
          {
            id: 'att-rev-1',
            name: 'بروفة_تصحيح_أسماء_الطلاب_المتفوقين.xlsx',
            size: 140000,
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            uploadedAt: '2026-09-04 11:20',
            isOriginal: false,
            uploadedBy: 'رامي الكردي (فني تدقيق)'
          }
        ]
      }
    ],
    technicalNotes: [
      {
        id: 'tn-2',
        userName: 'م. طارق (مشرف الإنتاج)',
        text: 'زنكة البصمة جاهزة في الدرج رقم 4، فقط ننتظر إشارة الاعتماد من إدارة المدرسة للبدء فوراً.',
        createdAt: '2026-09-04 12:40'
      }
    ],
    subtotal: 2550.0,
    discountTotal: 0,
    taxRate: 15,
    taxAmount: 382.5,
    totalAmount: 2932.5,
    paidAmount: 1500.0,
    remainingAmount: 1432.5,
    paymentMethod: 'cash'
  },
  {
    id: 'inv-wk-1006',
    invoiceNumber: 'INV-2026-1006',
    date: '2026-09-03',
    customerName: 'مجموعة الميدان للتطوير والاستثمار',
    customerPhone: '0567788990',
    subCustomerName: 'معرض أبراج النخيل السكني',
    deliveryDate: '2026-09-09',
    workflowStatus: 'print_external',
    status: 'paid',
    type: 'print_order',
    notes: 'لوحات فلكس عملاقة مع هياكل حديدية، تم التنسيق مع ورشة الحسام الخارجية للطباعة واللحام',
    items: [
      {
        itemId: 'ds-3',
        itemName: 'لوحة فلكس عملاقة مع شاسيه حديد وأذرع إضاءة ليد',
        dimensions: '600 × 300 سم (18 م²)',
        quantity: 2,
        unit: 'لوحة',
        unitPrice: 1600.0,
        discount: 0,
        tax: 480.0,
        total: 3680.0,
        notes: 'فلكس كوري ثقيل مقاوم للأشعة فوق البنفسجية طباعة UV خارجية مع حلقات نحاسية',
        attachments: [
          {
            id: 'att-orig-3',
            name: 'ملف_الطباعة_النهائي_دقة_عالية_أبراج_النخيل.tiff',
            size: 18500000,
            type: 'image/tiff',
            uploadedAt: '2026-09-03 16:00',
            isOriginal: true,
            uploadedBy: 'سالم الدوسري'
          }
        ]
      }
    ],
    technicalNotes: [
      {
        id: 'tn-3',
        userName: 'سامي مرعي (مسؤول التوريدات الخارجية)',
        text: 'تم تسليم الملفات والحديد لورشة الحسام الخارجية، وتأكيد موعد استلام اللوحات المطبوعة صباح الغد.',
        createdAt: '2026-09-04 08:30'
      }
    ],
    subtotal: 3200.0,
    discountTotal: 0,
    taxRate: 15,
    taxAmount: 480.0,
    totalAmount: 3680.0,
    paidAmount: 3680.0,
    remainingAmount: 0,
    paymentMethod: 'bank_transfer'
  },
  {
    id: 'inv-wk-1007',
    invoiceNumber: 'INV-2026-1007',
    date: '2026-09-03',
    customerId: 'pt-1',
    customerName: 'عميل كاشير نقدي',
    customerPhone: '0551122334',
    subCustomerName: 'فرع الكورنيش الشمالي',
    deliveryDate: '2026-09-08',
    workflowStatus: 'print_internal',
    printStartedAt: '2026-09-04 10:00',
    printStartedBy: 'أبو خالد (فني ماكينة الهايدلبرغ)',
    status: 'paid',
    type: 'print_order',
    notes: 'منيو طعام مقوى مقاوم للسوائل مع ريجة وسلوفان مطفي ناعم عالي المتانة',
    items: [
      {
        itemId: 'ds-4',
        itemName: 'منيو طعام مطوي 3 طيات مقاس A3 مفتوح',
        dimensions: '42 × 29.7 سم',
        quantity: 1000,
        unit: 'منيو',
        unitPrice: 2.2,
        discount: 0,
        tax: 330.0,
        total: 2530.0,
        notes: 'كوشيه 350g ألماني، طباعة أوفست 4 ألوان وجهين + سلوفان حراري مطفي وجهين',
        attachments: [
          {
            id: 'att-orig-4',
            name: 'Menu_Alsahab_HighRes_PressReady.pdf',
            size: 9200000,
            type: 'application/pdf',
            uploadedAt: '2026-09-03 17:30',
            isOriginal: true,
            uploadedBy: 'محمد المبيعات'
          }
        ]
      }
    ],
    technicalNotes: [
      {
        id: 'tn-4',
        userName: 'أبو خالد (فني الطباعة)',
        text: 'الماكينة تعمل الآن على سحب الوجه الثاني، الألوان متطابقة تماماً مع عينة الكود اللوني.',
        createdAt: '2026-09-04 11:45'
      }
    ],
    subtotal: 2200.0,
    discountTotal: 0,
    taxRate: 15,
    taxAmount: 330.0,
    totalAmount: 2530.0,
    paidAmount: 2530.0,
    remainingAmount: 0,
    paymentMethod: 'bank_transfer'
  },
  {
    id: 'inv-wk-1008',
    invoiceNumber: 'INV-2026-1008',
    date: '2026-09-02',
    customerId: 'pt-3',
    customerName: 'مؤسسة أفق التقنية للتجارة',
    customerPhone: '0509988112',
    subCustomerName: 'قسم العلاقات العامة والمعارض',
    deliveryDate: '2026-09-07',
    workflowStatus: 'ready',
    printFinishedAt: '2026-09-04 13:00',
    printFinishedBy: 'أبو خالد (فني الطباعة)',
    status: 'paid',
    type: 'print_order',
    notes: 'أكياس ورقية هدايا فاخرة مع حبال حرير وبصمة سيلفر للشعار',
    items: [
      {
        itemId: 'ds-5',
        itemName: 'أكياس هدايا فاخرة كرافت أبيض مع يد حبل قطن',
        dimensions: '35 × 25 × 10 سم',
        quantity: 500,
        unit: 'كيس',
        unitPrice: 3.5,
        discount: 0,
        tax: 262.5,
        total: 2012.5,
        notes: 'ورق كرافت أبيض 220 جرام مع بصمة فضية هولوجرامية للشعار وتخريم مقوى',
        attachments: [
          {
            id: 'att-orig-5',
            name: 'قالب_القص_والتكسير_لكيس_الهدايا_أفق.ai',
            size: 5400000,
            type: 'application/illustrator',
            uploadedAt: '2026-09-02 11:00',
            isOriginal: true,
            uploadedBy: 'رامي الكردي'
          }
        ]
      }
    ],
    technicalNotes: [
      {
        id: 'tn-5',
        userName: 'هشام (مسؤول التغليف والتسليم)',
        text: 'تم فحص الجودة والتغليف في 10 كراتين مغلقة ومعلمة برقم الفاتورة، موجودة في قسم التسليم.',
        createdAt: '2026-09-04 13:15'
      }
    ],
    subtotal: 1750.0,
    discountTotal: 0,
    taxRate: 15,
    taxAmount: 262.5,
    totalAmount: 2012.5,
    paidAmount: 2012.5,
    remainingAmount: 0,
    paymentMethod: 'bank_transfer'
  }
];

export const initialPurchases: PurchaseInvoice[] = [
  {
    id: 'pur-2026-01',
    invoiceNumber: 'PUR-2026-0042',
    supplierInvoiceNumber: 'INV-RAW-9921',
    date: '2026-09-01',
    supplierId: 'pt-4',
    supplierName: 'شركة روائع الورق للتجارة والتوزيع',
    items: [
      { itemId: 'raw-1', itemName: 'رول ورق كوشيه مطفي 300 جرام مقاس 70×100', quantity: 10, unitPrice: 420.0, total: 4200.0 },
      { itemId: 'raw-2', itemName: 'ورق كوشيه لامع 150 جرام مقاس 70×100', quantity: 15, unitPrice: 260.0, total: 3900.0 }
    ],
    subtotal: 8100.0,
    taxRate: 15,
    taxAmount: 1215.0,
    totalAmount: 9315.0,
    paidAmount: 5000.0,
    paymentMethod: 'bank_transfer',
    status: 'partial',
    warehouse: 'مستودع الخامات الرئيسي',
    notes: 'متبقي 4315 ر.س يسدد خلال 30 يوماً'
  }
];

export const initialPurchaseReturns: PurchaseReturn[] = [
  {
    id: 'prn-2026-01',
    returnNumber: 'PRN-2026-0001',
    date: '2026-09-03',
    purchaseInvoiceId: 'pur-2026-01',
    purchaseInvoiceNumber: 'PUR-2026-0042',
    supplierId: 'pt-4',
    supplierName: 'شركة روائع الورق للتجارة والتوزيع',
    items: [
      {
        itemId: 'raw-2',
        itemName: 'ورق كوشيه لامع 150 جرام مقاس 70×100',
        quantity: 2,
        unitPrice: 260.0,
        total: 520.0,
        reason: 'تلف في حواف الرزم بسبب سوء التخزين أثناء النقل'
      }
    ],
    subtotal: 520.0,
    taxRate: 15,
    taxAmount: 78.0,
    totalAmount: 598.0,
    settlementType: 'credit_balance',
    notes: 'تم خصم القيمة من الرصيد المستحق للمورد بموجب إشعار مدين معتمد',
    createdAt: '2026-09-03'
  }
];

export const initialSalesReturns: SalesReturn[] = [
  {
    id: 'srn-2026-01',
    returnNumber: 'SR-2026-0001',
    date: '2026-09-04',
    invoiceId: 'inv-001',
    invoiceNumber: 'INV-2026-0001',
    customerId: 'pt-1',
    customerName: 'مؤسسة الأفق للدعاية والإعلان',
    items: [
      {
        itemId: 'item-2',
        itemName: 'بروشورات دعائية مطوية A4 فاخرة',
        quantity: 1,
        unitPrice: 350.0,
        total: 350.0,
        reason: 'زيادة طفيفة عن حاجة العميل'
      }
    ],
    subtotal: 350.0,
    taxRate: 15,
    taxAmount: 52.5,
    totalAmount: 402.5,
    settlementType: 'credit_balance',
    notes: 'تم قيد المبلغ كرصيد دائن في حساب العميل بموجب إشعار دائن ضريبي معتمد',
    createdAt: '2026-09-04'
  }
];

export const initialJournalEntries: JournalEntry[] = [
  {
    id: 'je-001',
    entryNumber: 'JE-2026-0001',
    date: '2026-09-01',
    description: 'قيد إثبات فاتورة مشتريات ورق ومواد خام من شركة روائع الورق',
    referenceType: 'purchase',
    referenceId: 'pur-2026-01',
    createdAt: '2026-09-01',
    lines: [
      { accountCode: '1302', accountName: 'مخزون خامات وأوراق المطبعة', debit: 8100.0, credit: 0, description: 'إضافة الورق إلى مخزن الخامات' },
      { accountCode: '2103', accountName: 'أمانات ضريبة القيمة المضافة المستحقة (VAT)', debit: 1215.0, credit: 0, description: 'ضريبة المدخلات القابلة للخصم' },
      { accountCode: '1102', accountName: 'الحساب البنكي (مصرف الراجحي)', debit: 0, credit: 5000.0, description: 'دفعة مسددة تحويل بنكي' },
      { accountCode: '2101', accountName: 'الموردون والذمم الدائنة', debit: 0, credit: 4315.0, description: 'المتبقي للمورد في حسابه' }
    ]
  },
  {
    id: 'je-002',
    entryNumber: 'JE-2026-0002',
    date: '2026-09-03',
    description: 'قيد إثبات إيراد أمر طباعة كروت شخصية فاخرة لمؤسسة أفق التقنية',
    referenceType: 'print_order',
    referenceId: 'job-102',
    createdAt: '2026-09-03',
    lines: [
      { accountCode: '1102', accountName: 'الحساب البنكي (مصرف الراجحي)', debit: 1380.0, credit: 0, description: 'استلام قيمة الفاتورة بنكياً' },
      { accountCode: '4102', accountName: 'إيرادات أعمال ومطبوعات المطبعة', debit: 0, credit: 1200.0, description: 'صافي إيراد الطباعة' },
      { accountCode: '2103', accountName: 'أمانات ضريبة القيمة المضافة المستحقة (VAT)', debit: 0, credit: 180.0, description: 'ضريبة المخرجات 15%' }
    ]
  },
  {
    id: 'je-003',
    entryNumber: 'JE-2026-0003',
    date: '2026-09-04',
    description: 'قيد إثبات مبيعات نقطة البيع النقدية والشبكة (إقفال وردية كاشير)',
    referenceType: 'pos_invoice',
    referenceId: 'inv-pos-1001',
    createdAt: '2026-09-04',
    lines: [
      { accountCode: '1102', accountName: 'الحساب البنكي (مصرف الراجحي)', debit: 86.25, credit: 0, description: 'مقبوضات شبكة مدى' },
      { accountCode: '1101', accountName: 'الصندوق النقدي (الكاشير)', debit: 189.75, credit: 0, description: 'مقبوضات كاش الصندوق' },
      { accountCode: '4101', accountName: 'إيرادات مبيعات المكتبة والقرطاسية', debit: 0, credit: 230.0, description: 'مبيعات القرطاسية والكتب' },
      { accountCode: '4103', accountName: 'إيرادات خدمات التصوير والتجليد الفوري', debit: 0, credit: 10.0, description: 'خدمات تصوير مستندات' },
      { accountCode: '2103', accountName: 'أمانات ضريبة القيمة المضافة المستحقة (VAT)', debit: 0, credit: 36.0, description: 'ضريبة القيمة المضافة 15%' }
    ]
  }
];

export const initialEmployees: Employee[] = [
  {
    id: 'emp-1',
    code: 'EMP-001',
    name: 'أحمد محمود النجار',
    jobTitle: 'كبير فنيي طباعة أوفست وديجيتال',
    department: 'printing',
    nationalId: '2398471920',
    phone: '0551122334',
    email: 'ahmed.print@alnoorpress.com',
    salaryType: 'monthly',
    salaryAmount: 4800,
    allowances: 700,
    hireDate: '2023-01-15',
    status: 'active',
    paymentMethod: 'bank_transfer',
    bankName: 'مصرف الراجحي',
    iban: 'SA0380000201608010111111',
    emergencyContactName: 'محمود النجار',
    emergencyContactPhone: '0559988776',
    emergencyRelation: 'الأب',
    notes: 'خبير في تشغيل ماكينات هايدلبرغ وماكينات كونيكا مينولتا الحديثة.',
    paymentHistory: [
      {
        id: 'sp-1',
        date: '2026-08-30',
        amount: 5500,
        type: 'salary',
        period: 'راتب شهر أغسطس 2026',
        paymentMethod: 'bank_transfer',
        voucherNumber: 'PV-SAL-001',
        notes: 'راتب أساسي 4800 + بدلات 700'
      }
    ]
  },
  {
    id: 'emp-2',
    code: 'EMP-002',
    name: 'سارة عبد الرحمن الشهري',
    jobTitle: 'مصممة جرافيك وهوية بصرية وتجهيز طباعي',
    department: 'design',
    nationalId: '1098234716',
    phone: '0562233445',
    email: 'sara.design@alnoorpress.com',
    salaryType: 'monthly',
    salaryAmount: 4200,
    allowances: 500,
    hireDate: '2023-06-01',
    status: 'active',
    paymentMethod: 'bank_transfer',
    bankName: 'البنك الأهلي السعودي',
    iban: 'SA4410000001234567890123',
    emergencyContactName: 'عبد الرحمن الشهري',
    emergencyContactPhone: '0501112233',
    emergencyRelation: 'الوالد',
    notes: 'مسؤولة عن مراجعة ملفات العملاء والتأكد من ألوان CMYK وفواصل القص والزنكات.',
    paymentHistory: [
      {
        id: 'sp-2',
        date: '2026-08-30',
        amount: 4700,
        type: 'salary',
        period: 'راتب شهر أغسطس 2026',
        paymentMethod: 'bank_transfer',
        voucherNumber: 'PV-SAL-002',
        notes: 'راتب أساسي 4200 + بدلات 500'
      }
    ]
  },
  {
    id: 'emp-3',
    code: 'EMP-003',
    name: 'محمد خالد الدوسري',
    jobTitle: 'كاشير ومسؤول مبيعات القرطاسية',
    department: 'sales_pos',
    nationalId: '1087654321',
    phone: '0543344556',
    email: 'm.dossary@alnoorpress.com',
    salaryType: 'monthly',
    salaryAmount: 3500,
    allowances: 400,
    hireDate: '2024-02-10',
    status: 'active',
    paymentMethod: 'cash',
    emergencyContactName: 'خالد الدوسري',
    emergencyContactPhone: '0503334455',
    emergencyRelation: 'الأب',
    notes: 'مسؤول نقطة البيع الرئيسية والتعامل مع استفسارات زوار المكتبة ومبيعات اليوم.',
    paymentHistory: [
      {
        id: 'sp-3',
        date: '2026-08-30',
        amount: 3900,
        type: 'salary',
        period: 'راتب شهر أغسطس 2026',
        paymentMethod: 'cash',
        voucherNumber: 'PV-SAL-003',
        notes: 'تم التسليم نقداً من صندوق الكاشير'
      }
    ]
  },
  {
    id: 'emp-4',
    code: 'EMP-004',
    name: 'إبراهيم صابر حامد',
    jobTitle: 'فني تجليد وتشطيب وسلوفان ومقص هيدروليكي',
    department: 'finishing',
    nationalId: '2411559988',
    phone: '0574455667',
    email: 'ibrahim.finish@alnoorpress.com',
    salaryType: 'weekly',
    salaryAmount: 850,
    allowances: 100,
    hireDate: '2024-05-01',
    status: 'active',
    paymentMethod: 'cash',
    notes: 'راتب أسبوعي يُصرف كل يوم خميس، متخصص في التجليد الفاخر وتكسير العلب والعلب الكرتونية.',
    paymentHistory: [
      {
        id: 'sp-4',
        date: '2026-09-02',
        amount: 950,
        type: 'salary',
        period: 'الأسبوع 35 (28 أغسطس - 3 سبتمبر)',
        paymentMethod: 'cash',
        voucherNumber: 'PV-SAL-004',
        notes: 'تسليم نقدي نهاية الأسبوع'
      }
    ]
  },
  {
    id: 'emp-5',
    code: 'EMP-005',
    name: 'حسام الدين عثمان',
    jobTitle: 'عامل مساعد لفرز الورق وتحميل الطلبات',
    department: 'printing',
    nationalId: '2455667788',
    phone: '0595566778',
    salaryType: 'daily',
    salaryAmount: 120,
    allowances: 0,
    hireDate: '2024-07-20',
    status: 'active',
    paymentMethod: 'cash',
    notes: 'نظام محاسبة يومية (يومية عمل)، يتم صرفها يومياً أو أسبوعياً حسب أيام الحضور المعتمدة.',
    paymentHistory: [
      {
        id: 'sp-5',
        date: '2026-09-03',
        amount: 120,
        type: 'salary',
        period: 'يومية عمل 3 سبتمبر 2026',
        paymentMethod: 'cash',
        voucherNumber: 'PV-SAL-005',
        notes: 'يومية كاملة 8 ساعات'
      }
    ]
  }
];

export const initialEmployeeAdvances: EmployeeAdvance[] = [
  {
    id: 'adv-1',
    employeeId: 'emp-1',
    employeeName: 'محمد عبد الله الشمري',
    date: '2026-09-01',
    amount: 500,
    treasuryAccountCode: '1101',
    treasuryName: 'الصندوق النقدي (الكاشير)',
    reason: 'سلفة طارئة لشراء مستلزمات شخصية',
    status: 'pending',
    disbursedImmediately: true,
    voucherNumber: 'PV-ADV-2026-0001'
  }
];

export const initialEmployeeDeductions: EmployeeDeduction[] = [
  {
    id: 'ded-1',
    employeeId: 'emp-2',
    employeeName: 'كريم أحمد طارق',
    date: '2026-09-02',
    amount: 150,
    reason: 'خصم تأخير متكرر عن موعد بدء وردية تجهيز ملفات الفرز والطباعة',
    status: 'pending'
  }
];

export const initialEmployeeIncentives: EmployeeIncentive[] = [
  {
    id: 'inc-1',
    employeeId: 'emp-3',
    employeeName: 'سارة خالد المنصور',
    date: '2026-09-03',
    amount: 250,
    reason: 'حافز تميز في خدمة العملاء ومبيعات الأدوات المدرسية والقرطاسية',
    status: 'pending'
  }
];

export const initialPayrollSheets: PayrollSheet[] = [
  {
    id: 'prs-aug-2026',
    sheetNumber: 'PR-2026-0801',
    title: 'مسير رواتب شهر أغسطس 2026 (شهري)',
    salaryType: 'monthly',
    period: 'أغسطس 2026',
    createdAt: '2026-08-30',
    status: 'approved',
    disbursedAt: '2026-08-30',
    treasuryAccountCode: '1102',
    treasuryName: 'الحساب البنكي (مصرف الراجحي)',
    voucherNumber: 'PV-SAL-2026-0801',
    notes: 'تم اعتماد وصرف مسير رواتب الموظفين ذوي الرواتب الشهرية عن شهر أغسطس 2026 بنجاح',
    totalBasic: 12500,
    totalAllowances: 1300,
    totalIncentives: 400,
    totalDeductions: 0,
    totalAdvances: 300,
    totalNet: 13900,
    employeesCount: 3,
    items: [
      {
        employeeId: 'emp-1',
        employeeName: 'محمد عبد الله الشمري',
        employeeCode: 'EMP-001',
        jobTitle: 'كبير فنيي ومشغلي ماكينات الطباعة الرقمية والأوفست',
        department: 'printing',
        salaryType: 'monthly',
        basicSalary: 4500,
        allowances: 500,
        incentives: 200,
        deductions: 0,
        advancesDeducted: 300,
        netSalary: 4900,
        isIncluded: true,
        notes: 'خصم سلفة 300 ريال + حافز 200 ريال'
      },
      {
        employeeId: 'emp-2',
        employeeName: 'كريم أحمد طارق',
        employeeCode: 'EMP-002',
        jobTitle: 'مصمم جرافيك ومسؤول فرز الألوان ومونتاج الطباعة',
        department: 'design',
        salaryType: 'monthly',
        basicSalary: 4200,
        allowances: 400,
        incentives: 0,
        deductions: 0,
        advancesDeducted: 0,
        netSalary: 4600,
        isIncluded: true
      },
      {
        employeeId: 'emp-3',
        employeeName: 'سارة خالد المنصور',
        employeeCode: 'EMP-003',
        jobTitle: 'كاشيرة ومسؤولة مبيعات القرطاسية والخدمات الطلابية',
        department: 'sales_pos',
        salaryType: 'monthly',
        basicSalary: 3800,
        allowances: 400,
        incentives: 200,
        deductions: 0,
        advancesDeducted: 0,
        netSalary: 4400,
        isIncluded: true,
        notes: 'مكافأة تميز مبيعات 200 ريال'
      }
    ]
  }
];

export const initialTreasuries: Treasury[] = [
  {
    id: 'treasury-cash-main',
    name: 'الصندوق النقدي (الخزينة الرئيسية)',
    type: 'cash_box',
    accountCode: '1101',
    balance: 6560, // القيمة التقديرية بالعملة الأساسية (1000 + 800*3.70 + 500*5.20 = 6,560 ₪)
    currencyBalances: {
      ILS: 1000,
      USD: 800,
      JOD: 500
    },
    isDefault: true,
    status: 'active',
    notes: 'الخزينة النقدية الرئيسية لمكتب المبيعات والكاشير والسيولة متعددة العملات (شيكل، دولار، دينار)',
    createdAt: '2026-01-01',
    transactions: [
      {
        id: 'tx-rc-1',
        treasuryId: 'treasury-cash-main',
        treasuryName: 'الصندوق النقدي (الخزينة الرئيسية)',
        date: '2026-09-10',
        type: 'deposit',
        amount: 1000,
        currency: 'ILS',
        currencySymbol: '₪',
        exchangeRate: 1.0,
        baseCurrency: 'ILS',
        baseAmount: 1000,
        balanceAfter: 1000,
        balanceAfterCurrency: 1000,
        voucherNumber: 'RC-1',
        partyName: 'عميل نقدي',
        description: 'سند قبض مبيعات نقدية',
        referenceType: 'receipt'
      },
      {
        id: 'tx-rc-2',
        treasuryId: 'treasury-cash-main',
        treasuryName: 'الصندوق النقدي (الخزينة الرئيسية)',
        date: '2026-09-10',
        type: 'deposit',
        amount: 1000,
        currency: 'USD',
        currencySymbol: '$',
        exchangeRate: 3.70,
        baseCurrency: 'ILS',
        baseAmount: 3700,
        balanceAfter: 4700,
        balanceAfterCurrency: 1000,
        voucherNumber: 'RC-2',
        partyName: 'شركة النور للدعاية',
        description: 'سند قبض - دفعة حساب عميل بالدولار',
        referenceType: 'receipt'
      },
      {
        id: 'tx-pv-1',
        treasuryId: 'treasury-cash-main',
        treasuryName: 'الصندوق النقدي (الخزينة الرئيسية)',
        date: '2026-09-10',
        type: 'withdrawal',
        amount: 200,
        currency: 'USD',
        currencySymbol: '$',
        exchangeRate: 3.70,
        baseCurrency: 'ILS',
        baseAmount: -740,
        balanceAfter: 3960,
        balanceAfterCurrency: 800,
        voucherNumber: 'PV-1',
        partyName: 'مصروفات تشغيلية ونثريات',
        description: 'سند صرف مصروفات تشغيلية بالدولار',
        referenceType: 'expense'
      },
      {
        id: 'tx-rc-3',
        treasuryId: 'treasury-cash-main',
        treasuryName: 'الصندوق النقدي (الخزينة الرئيسية)',
        date: '2026-09-10',
        type: 'deposit',
        amount: 500,
        currency: 'JOD',
        currencySymbol: 'د.أ',
        exchangeRate: 5.20,
        baseCurrency: 'ILS',
        baseAmount: 2600,
        balanceAfter: 6560,
        balanceAfterCurrency: 500,
        voucherNumber: 'RC-3',
        partyName: 'مكتب القدس للاستشارات',
        description: 'سند قبض - عميل بالدينار الأردني',
        referenceType: 'receipt'
      }
    ]
  },
  {
    id: 'treasury-bank-rajhi',
    name: 'تطبيق مصرف الراجحي للأعمال',
    type: 'bank_app',
    accountCode: '1102',
    balance: 94850,
    currencyBalances: {
      ILS: 85600,
      USD: 2500
    },
    bankName: 'مصرف الراجحي',
    accountNumber: 'SA0380000201608010099999',
    status: 'active',
    notes: 'حساب التطبيق البنكي للتحويلات الفورية السريعة وسداد الموردين والرواتب',
    createdAt: '2026-01-01',
    transactions: [
      {
        id: 'tx-2',
        treasuryId: 'treasury-bank-rajhi',
        treasuryName: 'تطبيق مصرف الراجحي للأعمال',
        date: '2026-09-01',
        type: 'deposit',
        amount: 85600,
        currency: 'ILS',
        currencySymbol: '₪',
        exchangeRate: 1.0,
        baseCurrency: 'ILS',
        baseAmount: 85600,
        balanceAfter: 85600,
        balanceAfterCurrency: 85600,
        voucherNumber: 'OB-01',
        description: 'رصيد افتتاحي في الحساب البنكي بالشيكل',
        referenceType: 'opening'
      }
    ]
  },
  {
    id: 'treasury-pos-mada',
    name: 'جهاز نقاط البيع ومدى (POS)',
    type: 'pos_terminal',
    accountCode: '1103',
    balance: 18400,
    currencyBalances: {
      ILS: 18400
    },
    bankName: 'شبكة المدفوعات السعودية (مدى)',
    accountNumber: 'POS-TERM-8841',
    status: 'active',
    notes: 'متحصلات شبكة مدى والبطاقات البنكية في الكاشير',
    createdAt: '2026-01-10',
    transactions: [
      {
        id: 'tx-3',
        treasuryId: 'treasury-pos-mada',
        treasuryName: 'جهاز نقاط البيع ومدى (POS)',
        date: '2026-09-01',
        type: 'deposit',
        amount: 18400,
        currency: 'ILS',
        currencySymbol: '₪',
        exchangeRate: 1.0,
        baseCurrency: 'ILS',
        baseAmount: 18400,
        balanceAfter: 18400,
        balanceAfterCurrency: 18400,
        voucherNumber: 'POS-01',
        description: 'رصيد عمليات مدى المرحلة',
        referenceType: 'opening'
      }
    ]
  },
  {
    id: 'treasury-wallet-stcpay',
    name: 'تطبيق STC Pay للأعمال',
    type: 'digital_wallet',
    accountCode: '1105',
    balance: 6500,
    currencyBalances: {
      ILS: 6500
    },
    bankName: 'stc pay / بنك STC',
    accountNumber: '0501234567',
    status: 'active',
    notes: 'محفظة رقمية للمدفوعات السريعة عبر رمز الاستجابة QR',
    createdAt: '2026-02-01',
    transactions: [
      {
        id: 'tx-4',
        treasuryId: 'treasury-wallet-stcpay',
        treasuryName: 'تطبيق STC Pay للأعمال',
        date: '2026-09-01',
        type: 'deposit',
        amount: 6500,
        currency: 'ILS',
        currencySymbol: '₪',
        exchangeRate: 1.0,
        baseCurrency: 'ILS',
        baseAmount: 6500,
        balanceAfter: 6500,
        balanceAfterCurrency: 6500,
        voucherNumber: 'WAL-01',
        description: 'رصيد المحفظة الإلكترونية',
        referenceType: 'opening'
      }
    ]
  }
];

export const initialVouchers: PaymentVoucher[] = [
  {
    id: 'vch-init-1',
    voucherNumber: 'RCT-2026-0001',
    type: 'receipt',
    date: '2026-09-02',
    partyId: 'pt-1',
    partyName: 'عميل كاشير نقدي',
    amount: 1300.0,
    paymentMethod: 'bank_transfer',
    accountCode: '1201',
    description: 'سند قبض دفعة على الحساب تحويل لحساب مصرف الراجحي'
  },
  {
    id: 'vch-init-2',
    voucherNumber: 'RCT-2026-0002',
    type: 'receipt',
    date: '2026-09-03',
    partyId: 'pt-2',
    partyName: 'مدارس رواد الغد الأهلية',
    amount: 2000.0,
    paymentMethod: 'bank_transfer',
    accountCode: '1201',
    description: 'سداد دفعة تحت حساب طباعة الملازم ودفاتر المتابعة'
  },
  {
    id: 'vch-init-3',
    voucherNumber: 'PAY-2026-0001',
    type: 'payment',
    date: '2026-09-01',
    partyId: 'pt-4',
    partyName: 'شركة روائع الورق للتجارة والتوزيع',
    amount: 5000.0,
    paymentMethod: 'bank_transfer',
    accountCode: '2101',
    description: 'سند صرف دفعة مسددة من فاتورة توريد الورق PUR-2026-0042'
  },
  {
    id: 'vch-init-4',
    voucherNumber: 'PAY-2026-0002',
    type: 'payment',
    date: '2026-09-02',
    partyId: 'pt-5',
    partyName: 'مؤسسة التقنية للأحبار ومستلزمات المطابع',
    amount: 2000.0,
    paymentMethod: 'bank_transfer',
    accountCode: '2101',
    description: 'سداد دفعة على الحساب من مستحقات أحبار المطبعة'
  }
];

export const initialStockMovements: StockMovement[] = [
  // 1. دفتر سلك جامعي 200 صفحة (STAT-0001)
  {
    id: 'sm-1',
    itemId: 'inv-1',
    itemCode: 'STAT-0001',
    itemName: 'دفتر سلك جامعي 200 صفحة مسطر فاخر',
    category: 'stationery',
    date: '2026-08-15',
    time: '09:00',
    type: 'in_opening',
    quantity: 150,
    balanceBefore: 0,
    balanceAfter: 150,
    unitPrice: 8.5,
    totalValue: 1275,
    referenceType: 'opening',
    referenceNumber: 'OP-2026',
    reason: 'رصيد افتتاحي لبداية الفترة المالية',
    performedBy: 'أمين المستودع'
  },
  {
    id: 'sm-2',
    itemId: 'inv-1',
    itemCode: 'STAT-0001',
    itemName: 'دفتر سلك جامعي 200 صفحة مسطر فاخر',
    category: 'stationery',
    date: '2026-08-25',
    time: '11:30',
    type: 'in_purchase',
    quantity: 50,
    balanceBefore: 150,
    balanceAfter: 200,
    unitPrice: 8.5,
    totalValue: 425,
    referenceType: 'purchase',
    referenceNumber: 'PUR-2026-0038',
    reason: 'توريد دفعة جديدة مع بدء العام الدراسي',
    performedBy: 'مشتريات'
  },
  {
    id: 'sm-3',
    itemId: 'inv-1',
    itemCode: 'STAT-0001',
    itemName: 'دفتر سلك جامعي 200 صفحة مسطر فاخر',
    category: 'stationery',
    date: '2026-08-28',
    time: '14:20',
    type: 'out_sale',
    quantity: 15,
    balanceBefore: 200,
    balanceAfter: 185,
    unitPrice: 15.0,
    totalValue: 225,
    referenceType: 'pos_invoice',
    referenceNumber: 'INV-2026-0089',
    reason: 'مبيعات كاشير المعرض',
    performedBy: 'كاشير 1'
  },
  {
    id: 'sm-4',
    itemId: 'inv-1',
    itemCode: 'STAT-0001',
    itemName: 'دفتر سلك جامعي 200 صفحة مسطر فاخر',
    category: 'stationery',
    date: '2026-09-02',
    time: '16:45',
    type: 'out_sale',
    quantity: 5,
    balanceBefore: 185,
    balanceAfter: 180,
    unitPrice: 15.0,
    totalValue: 75,
    referenceType: 'pos_invoice',
    referenceNumber: 'INV-2026-0102',
    reason: 'مبيعات كاشير للطلاب',
    performedBy: 'كاشير 2'
  },

  // 2. رول ورق كوشيه مطفي 300 جرام (RAW-0001)
  {
    id: 'sm-5',
    itemId: 'raw-1',
    itemCode: 'RAW-0001',
    itemName: 'رول ورق كوشيه مطفي 300 جرام مقاس 70×100 (باندة)',
    category: 'print_raw',
    date: '2026-08-10',
    time: '08:30',
    type: 'in_opening',
    quantity: 10,
    balanceBefore: 0,
    balanceAfter: 10,
    unitPrice: 420.0,
    totalValue: 4200,
    referenceType: 'opening',
    referenceNumber: 'OP-2026',
    reason: 'رصيد افتتاحي مستودع خامات المطبعة',
    performedBy: 'مسؤول المستودع'
  },
  {
    id: 'sm-6',
    itemId: 'raw-1',
    itemCode: 'RAW-0001',
    itemName: 'رول ورق كوشيه مطفي 300 جرام مقاس 70×100 (باندة)',
    category: 'print_raw',
    date: '2026-08-22',
    time: '10:15',
    type: 'in_purchase',
    quantity: 8,
    balanceBefore: 10,
    balanceAfter: 18,
    unitPrice: 420.0,
    totalValue: 3360,
    referenceType: 'purchase',
    referenceNumber: 'PUR-2026-0040',
    reason: 'توريد خامات من شركة روائع الورق',
    performedBy: 'قسم المشتريات'
  },
  {
    id: 'sm-7',
    itemId: 'raw-1',
    itemCode: 'RAW-0001',
    itemName: 'رول ورق كوشيه مطفي 300 جرام مقاس 70×100 (باندة)',
    category: 'print_raw',
    date: '2026-08-27',
    time: '13:00',
    type: 'out_print_job',
    quantity: 3,
    balanceBefore: 18,
    balanceAfter: 15,
    unitPrice: 420.0,
    totalValue: 1260,
    referenceType: 'print_order',
    referenceNumber: 'JOB-2026-001',
    reason: 'صرف للإنتاج: طباعة كروت وبطاقات دعائية',
    performedBy: 'فني المطبعة'
  },
  {
    id: 'sm-8',
    itemId: 'raw-1',
    itemCode: 'RAW-0001',
    itemName: 'رول ورق كوشيه مطفي 300 جرام مقاس 70×100 (باندة)',
    category: 'print_raw',
    date: '2026-09-03',
    time: '15:30',
    type: 'out_adjustment',
    quantity: 1,
    balanceBefore: 15,
    balanceAfter: 14,
    unitPrice: 420.0,
    totalValue: 420,
    referenceType: 'adjustment',
    referenceNumber: 'ADJ-2026-003',
    reason: 'عجز وتسوية جرد: تالف وهالك تجارب ضبط ألوان الماكينة',
    performedBy: 'لجنة الجرد والمراقبة'
  },

  // 3. كرتون ورق تصوير A4 رويال 80 جرام (STAT-003)
  {
    id: 'sm-9',
    itemId: 'inv-3',
    itemCode: 'STAT-003',
    itemName: 'كرتون ورق تصوير A4 رويال 80 جرام (5 رزم)',
    category: 'stationery',
    date: '2026-08-18',
    time: '09:45',
    type: 'in_opening',
    quantity: 40,
    balanceBefore: 0,
    balanceAfter: 40,
    unitPrice: 75.0,
    totalValue: 3000,
    referenceType: 'opening',
    referenceNumber: 'OP-2026',
    reason: 'رصيد مخزني مدور',
    performedBy: 'أمين المستودع'
  },
  {
    id: 'sm-10',
    itemId: 'inv-3',
    itemCode: 'STAT-003',
    itemName: 'كرتون ورق تصوير A4 رويال 80 جرام (5 رزم)',
    category: 'stationery',
    date: '2026-08-26',
    time: '12:10',
    type: 'in_purchase',
    quantity: 30,
    balanceBefore: 40,
    balanceAfter: 70,
    unitPrice: 75.0,
    totalValue: 2250,
    referenceType: 'purchase',
    referenceNumber: 'PUR-2026-0042',
    reason: 'طلب توريد كميات إضافية',
    performedBy: 'مشتريات'
  },
  {
    id: 'sm-11',
    itemId: 'inv-3',
    itemCode: 'STAT-003',
    itemName: 'كرتون ورق تصوير A4 رويال 80 جرام (5 رزم)',
    category: 'stationery',
    date: '2026-09-01',
    time: '17:00',
    type: 'out_sale',
    quantity: 5,
    balanceBefore: 70,
    balanceAfter: 65,
    unitPrice: 95.0,
    totalValue: 475,
    referenceType: 'pos_invoice',
    referenceNumber: 'INV-2026-0098',
    reason: 'بيع جملة لمكتب هندسي',
    performedBy: 'كاشير 1'
  },

  // 4. رول بانر كوري أوت دور (RAW-003) - تحت حد الطلب
  {
    id: 'sm-12',
    itemId: 'raw-3',
    itemCode: 'RAW-003',
    itemName: 'رول بانر كوري أوت دور وزن 440 جرام مقاس 3.2م × 50م',
    category: 'print_raw',
    date: '2026-08-10',
    time: '08:30',
    type: 'in_opening',
    quantity: 12,
    balanceBefore: 0,
    balanceAfter: 12,
    unitPrice: 380.0,
    totalValue: 4560,
    referenceType: 'opening',
    referenceNumber: 'OP-2026',
    reason: 'رصيد افتتاحي مستودع اللوحات',
    performedBy: 'مسؤول المستودع'
  },
  {
    id: 'sm-13',
    itemId: 'raw-3',
    itemCode: 'RAW-003',
    itemName: 'رول بانر كوري أوت دور وزن 440 جرام مقاس 3.2م × 50م',
    category: 'print_raw',
    date: '2026-08-25',
    time: '14:30',
    type: 'out_print_job',
    quantity: 4,
    balanceBefore: 12,
    balanceAfter: 8,
    unitPrice: 380.0,
    totalValue: 1520,
    referenceType: 'print_order',
    referenceNumber: 'JOB-2026-003',
    reason: 'صرف لتشغيل لوحات إعلانية انتخابية وترويجية (وصل لحد الطلب 8 رولات)',
    performedBy: 'فني طابعات الفليكس'
  },

  // 5. كتاب "قوة العادات" (BOOK-001)
  {
    id: 'sm-14',
    itemId: 'inv-5',
    itemCode: 'BOOK-001',
    itemName: 'كتاب "قوة العادات" - تشارلز دويج (مترجم)',
    category: 'books',
    date: '2026-08-12',
    time: '10:00',
    type: 'in_opening',
    quantity: 25,
    balanceBefore: 0,
    balanceAfter: 25,
    unitPrice: 35.0,
    totalValue: 875,
    referenceType: 'opening',
    referenceNumber: 'OP-2026',
    reason: 'رصيد افتتاحي ركن الكتب',
    performedBy: 'مسؤول المكتبة'
  },
  {
    id: 'sm-15',
    itemId: 'inv-5',
    itemCode: 'BOOK-001',
    itemName: 'كتاب "قوة العادات" - تشارلز دويج (مترجم)',
    category: 'books',
    date: '2026-08-29',
    time: '18:15',
    type: 'out_sale',
    quantity: 7,
    balanceBefore: 25,
    balanceAfter: 18,
    unitPrice: 55.0,
    totalValue: 385,
    referenceType: 'pos_invoice',
    referenceNumber: 'INV-2026-0092',
    reason: 'مبيعات معرض الكتاب الداخلي',
    performedBy: 'كاشير 2'
  }
];

export const initialExpenses: ExpenseItem[] = [
  {
    id: 'exp-1',
    date: '2026-09-13',
    expenseAccountCode: '5203',
    expenseAccountName: 'مصروفات الصيانة وقطع غيار الماكينات',
    category: 'maintenance',
    categoryName: 'صيانة ماكينات',
    amount: 450,
    paymentMethod: 'cash',
    treasuryAccountCode: '1101',
    treasuryName: 'الصندوق الرئيسي (كاش)',
    beneficiary: 'فني صيانة ماكينات Heidelberg',
    taxInvoiceNumber: 'INV-MT-8841',
    notes: 'صيانة دورية للمقص الهيدروليكي وتبديل حساس الأمان',
    createdAt: '2026-09-13T10:00:00.000Z'
  },
  {
    id: 'exp-2',
    date: '2026-09-13',
    expenseAccountCode: '5205',
    expenseAccountName: 'مصروفات عمومية وتسويق',
    category: 'hospitality',
    categoryName: 'ضيافة وبوفيه',
    amount: 180,
    paymentMethod: 'cash',
    treasuryAccountCode: '1101',
    treasuryName: 'الصندوق الرئيسي (كاش)',
    beneficiary: 'سوبرماركت المدينة',
    taxInvoiceNumber: 'REC-992',
    notes: 'شراء شاي وقهوة ومستلزمات نظافة للمطبعة والمكتبة',
    createdAt: '2026-09-13T11:30:00.000Z'
  },
  {
    id: 'exp-3',
    date: '2026-09-11',
    expenseAccountCode: '5204',
    expenseAccountName: 'مصروفات الكهرباء والماء والمرافق',
    category: 'utilities',
    categoryName: 'كهرباء ومرافق',
    amount: 1250,
    paymentMethod: 'bank_transfer',
    treasuryAccountCode: '1102',
    treasuryName: 'بنك فلسطين - جاري',
    beneficiary: 'شركة توزيع الكهرباء',
    taxInvoiceNumber: 'ELEC-2026-09',
    notes: 'سداد فاتورة استهلاك كهرباء خط الورشة والمطبعة',
    createdAt: '2026-09-11T14:00:00.000Z'
  },
  {
    id: 'exp-4',
    date: '2026-09-08',
    expenseAccountCode: '5205',
    expenseAccountName: 'مصروفات عمومية وتسويق',
    category: 'marketing',
    categoryName: 'تسويق وإعلانات',
    amount: 600,
    paymentMethod: 'bank_transfer',
    treasuryAccountCode: '1102',
    treasuryName: 'بنك فلسطين - جاري',
    beneficiary: 'وكالة الإعلان الرقمي',
    taxInvoiceNumber: 'ADS-1049',
    notes: 'حملة إعلانية ممولة على منصات التواصل لموسم المدارس والطباعة',
    createdAt: '2026-09-08T09:15:00.000Z'
  }
];


