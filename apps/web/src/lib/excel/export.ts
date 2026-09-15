import * as XLSX from 'xlsx';
import type { Item, Supplier, Branch } from '@stocky/types';

/**
 * Format date nicely for Excel cells
 */
function formatDate(dateStr?: string | null): string {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toISOString().split('T')[0];
  } catch {
    return dateStr;
  }
}

/**
 * Auto-fit column widths based on contents
 */
function autoFitColumns(data: any[], worksheet: XLSX.WorkSheet) {
  if (!data || data.length === 0) return;
  const colWidths = Object.keys(data[0]).map((key) => {
    const maxLen = data.reduce((max, row) => {
      const val = row[key] !== undefined && row[key] !== null ? String(row[key]) : '';
      return Math.max(max, val.length);
    }, key.length);
    return { wch: Math.min(Math.max(maxLen + 3, 10), 45) };
  });
  worksheet['!cols'] = colWidths;
}

/**
 * Export Inventory Items to .xlsx
 */
export function exportInventoryToExcel(
  items: Item[],
  branchName: string = 'All Branches'
) {
  const sanitizedBranch = branchName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Stocky_Inventory_${sanitizedBranch}_${new Date().toISOString().split('T')[0]}.xlsx`;

  const rows = items.map((item, idx) => ({
    '#': idx + 1,
    'Item Name': item.name,
    'Category': item.categoryName || 'Uncategorized',
    'Quantity': item.quantity,
    'Balance ($)': Number(item.balance).toFixed(2),
    'Barcode': item.barcode || 'N/A',
    'Expiry Date': formatDate(item.expiryDate),
    'Notify Before Expiry (Days)': item.expiryNotificationDays ?? 'N/A',
    'Created At': formatDate(item.createdAt),
    'Updated At': formatDate(item.updatedAt),
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  autoFitColumns(rows, worksheet);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory Catalog');
  XLSX.writeFile(workbook, filename);
}

/**
 * Export Suppliers Directory to .xlsx
 */
export function exportSuppliersToExcel(suppliers: Supplier[], customPrefix?: string) {
  const prefix = customPrefix || 'Stocky_Suppliers';
  const filename = `${prefix}_${new Date().toISOString().split('T')[0]}.xlsx`;

  const rows = suppliers.map((sup, idx) => ({
    '#': idx + 1,
    'Supplier Name': sup.name,
    'Contact Person': sup.contactName,
    'Phone': sup.contactPhone,
    'Email': sup.contactEmail || 'N/A',
    'Supplied Categories / Items': (sup.itemsSupplied || []).join(', ') || 'General',
    'Total Items Supplied': sup.itemCount || 0,
    'Created At': formatDate(sup.createdAt),
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  autoFitColumns(rows, worksheet);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Suppliers Directory');
  XLSX.writeFile(workbook, filename);
}

/**
 * Export Branches to .xlsx
 */
export function exportBranchesToExcel(branches: Branch[], customPrefix?: string) {
  const prefix = customPrefix || 'Stocky_Branches';
  const filename = `${prefix}_${new Date().toISOString().split('T')[0]}.xlsx`;

  const rows = branches.map((b, idx) => ({
    '#': idx + 1,
    'Branch Name': b.name,
    'Branch Code': b.code,
    'Address / City': b.address || 'N/A',
    'Phone': b.phone || 'N/A',
    'Created At': formatDate(b.createdAt),
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  autoFitColumns(rows, worksheet);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Stores & Branches');
  XLSX.writeFile(workbook, filename);
}

export interface TimesheetExportRow {
  employeeName?: string | null;
  employeeEmail?: string | null;
  locationName?: string | null;
  shiftDate: string;
  clockInAt: string;
  clockOutAt?: string | null;
  totalMinutes?: number | null;
  status: string;
  punchInMethod?: string | null;
  notes?: string | null;
}

/**
 * Export Timesheets to .xlsx
 */
export function exportTimesheetsToExcel(
  shifts: TimesheetExportRow[],
  dateRangeLabel?: string,
  branchName: string = 'All Branches'
) {
  const sanitizedBranch = branchName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const dateSuffix = dateRangeLabel
    ? dateRangeLabel.replace(/[^a-zA-Z0-9_-]/g, '_')
    : new Date().toISOString().split('T')[0];
  const filename = `Stocky_Timesheets_${sanitizedBranch}_${dateSuffix}.xlsx`;

  const rows = shifts.map((s, idx) => {
    const hoursWorked = s.totalMinutes
      ? `${Math.floor(s.totalMinutes / 60)}h ${s.totalMinutes % 60}m`
      : s.clockOutAt
      ? '0h 0m'
      : 'In Progress';

    const formatTime = (ts?: string | null) => {
      if (!ts) return '--:--';
      try {
        return new Intl.DateTimeFormat('en', {
          hour: '2-digit',
          minute: '2-digit',
        }).format(new Date(ts));
      } catch {
        return ts;
      }
    };

    return {
      '#': idx + 1,
      'Employee Name': s.employeeName || 'Unknown',
      'Email': s.employeeEmail || 'N/A',
      'Branch / Location': s.locationName || 'N/A',
      'Shift Date': s.shiftDate,
      'Clock In': formatTime(s.clockInAt),
      'Clock Out': formatTime(s.clockOutAt),
      'Total Hours Worked': hoursWorked,
      'Status': s.status.toUpperCase(),
      'Punch Method': s.punchInMethod || 'QR Scan',
      'Notes': s.notes || '',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  autoFitColumns(rows, worksheet);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Shift Timesheets');
  XLSX.writeFile(workbook, filename);
}

export interface VisualExportOptions {
  reportTitle: string;
  filenamePrefix: string;
  sheetName?: string;
  appliedFilters?: Record<string, string | number | undefined>;
  rows: Record<string, any>[];
}

/**
 * Universal exporter for Power BI visual cards.
 * Generates formatted .xlsx with column autofitting and clean timestamp.
 */
export function exportVisualDataToExcel({
  reportTitle,
  filenamePrefix,
  sheetName = 'Data Extract',
  appliedFilters = {},
  rows,
}: VisualExportOptions) {
  if (!rows || rows.length === 0) return;

  const todayStr = new Date().toISOString().split('T')[0];
  const filename = `${filenamePrefix}_${todayStr}.xlsx`;

  const formattedRows = rows.map((r, idx) => {
    const formatted: Record<string, any> = { '#': idx + 1 };
    for (const [k, v] of Object.entries(r)) {
      if (v === null || v === undefined) {
        formatted[k] = '';
      } else if (typeof v === 'number') {
        formatted[k] = Number.isInteger(v) ? v : Number(v.toFixed(2));
      } else {
        formatted[k] = v;
      }
    }
    return formatted;
  });

  const worksheet = XLSX.utils.json_to_sheet(formattedRows);
  autoFitColumns(formattedRows, worksheet);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));
  XLSX.writeFile(workbook, filename);
}

export interface DashboardSheetPayload {
  sheetName: string;
  rows: Record<string, any>[];
}

/**
 * Multi-sheet dashboard exporter for Power BI command center.
 */
export function exportFullDashboardToExcel({
  dashboardName = 'Stocky_Executive_Dashboard',
  sheets,
}: {
  dashboardName?: string;
  sheets: DashboardSheetPayload[];
}) {
  const todayStr = new Date().toISOString().split('T')[0];
  const filename = `${dashboardName}_${todayStr}.xlsx`;
  const workbook = XLSX.utils.book_new();

  sheets.forEach((sheet) => {
    if (sheet.rows && sheet.rows.length > 0) {
      const formattedRows = sheet.rows.map((r, idx) => ({ '#': idx + 1, ...r }));
      const worksheet = XLSX.utils.json_to_sheet(formattedRows);
      autoFitColumns(formattedRows, worksheet);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheet.sheetName.slice(0, 31));
    }
  });

  XLSX.writeFile(workbook, filename);
}

