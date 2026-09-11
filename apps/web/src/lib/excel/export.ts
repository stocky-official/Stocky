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
