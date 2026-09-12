export interface PosTableColumnConfig {
  showIndex: boolean;
  showBarcode: boolean;
  showNotes: boolean;
  showDimensions: boolean; // Length, Width
  showCount: boolean;      // العدد
  showQuantity: boolean;
  showUnit: boolean;
  showUnitPrice: boolean;
  showDiscount: boolean;
  showTax: boolean;
  showAttachments: boolean;
  showDeleteButton: boolean;
}

export interface PosLayoutConfig {
  // Screen Sections Visibility (إظهار وإخفاء أقسام الشاشة)
  showTopToolbar: boolean;
  showCustomerHeader: boolean;
  showExtraHeaderOptions: boolean; // مندوب، شحن، فئة السعر
  showFavoritesSidebar: boolean;   // شريط مفضلة الكاشير الأيمن الممتد
  showQuickShortcutsBar: boolean;  // شريط الاختصارات السريعة المخصص
  showTableStatsFooter: boolean;   // شريط إحصائيات الجدول (عدد الأصناف، القطع)
  showTotalsBreakdown: boolean;    // تفاصيل الإجمالي والخصم والضريبة
  showPaymentConsole: boolean;     // لوحة الدفع والصندوق والعملة الشاملة

  // Table Columns Visibility (إظهار وإخفاء أعمدة الجدول)
  tableColumns: PosTableColumnConfig;

  // Visual Comfort & Sizing (الكثافة وحجم الخط)
  uiDensity: 'compact' | 'normal' | 'spacious';
  fontSize: 'small' | 'medium' | 'large';

  // Bottom Area Arrangement (ترتيب قسم الدفع في الأسفل)
  bottomLayoutOrder: 'payment_first' | 'standard' | 'totals_first';
}

export const DEFAULT_POS_LAYOUT_CONFIG: PosLayoutConfig = {
  showTopToolbar: true,
  showCustomerHeader: true,
  showExtraHeaderOptions: true,
  showFavoritesSidebar: true,
  showQuickShortcutsBar: true,
  showTableStatsFooter: true,
  showTotalsBreakdown: true,
  showPaymentConsole: true,

  tableColumns: {
    showIndex: true,
    showBarcode: false,
    showNotes: true,
    showDimensions: true,
    showCount: true,
    showQuantity: true,
    showUnit: true,
    showUnitPrice: true,
    showDiscount: true,
    showTax: true,
    showAttachments: true,
    showDeleteButton: true
  },

  uiDensity: 'normal',
  fontSize: 'medium',
  bottomLayoutOrder: 'payment_first'
};

const STORAGE_KEY = 'pos_layout_config_v3';

export function loadPosLayoutConfig(): PosLayoutConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_POS_LAYOUT_CONFIG;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return DEFAULT_POS_LAYOUT_CONFIG;
    return {
      ...DEFAULT_POS_LAYOUT_CONFIG,
      ...parsed,
      showFavoritesSidebar: parsed.showFavoritesSidebar !== undefined ? Boolean(parsed.showFavoritesSidebar) : true,
      tableColumns: {
        ...DEFAULT_POS_LAYOUT_CONFIG.tableColumns,
        ...(parsed.tableColumns && typeof parsed.tableColumns === 'object' ? parsed.tableColumns : {}),
        showCount: parsed.tableColumns?.showCount !== undefined ? Boolean(parsed.tableColumns.showCount) : true
      }
    };
  } catch (err) {
    console.error('Failed to load pos layout config', err);
    return DEFAULT_POS_LAYOUT_CONFIG;
  }
}

export function savePosLayoutConfig(config: PosLayoutConfig): void {
  try {
    if (!config || typeof config !== 'object') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save pos layout config', err);
  }
}

export function resetPosLayoutConfigToDefault(): PosLayoutConfig {
  savePosLayoutConfig(DEFAULT_POS_LAYOUT_CONFIG);
  return DEFAULT_POS_LAYOUT_CONFIG;
}
