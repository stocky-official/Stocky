import * as XLSX from 'xlsx';

export interface ParsedExcelData {
  headers: string[];
  rows: Record<string, any>[];
  totalRows: number;
}

export interface TargetFieldDef {
  key: string;
  label: string;
  required?: boolean;
  type: 'string' | 'number' | 'date';
  description: string;
  aliases: string[];
}

export const INVENTORY_TARGET_FIELDS: TargetFieldDef[] = [
  {
    key: 'name',
    label: 'Item Name',
    required: true,
    type: 'string',
    description: 'Product or stock item name',
    aliases: ['name', 'item', 'product', 'item name', 'product name', 'title', 'desc', 'description'],
  },
  {
    key: 'category_name',
    label: 'Category',
    required: false,
    type: 'string',
    description: 'Category or product classification',
    aliases: ['category', 'cat', 'department', 'dept', 'group', 'type', 'category name'],
  },
  {
    key: 'quantity',
    label: 'Quantity (Units)',
    required: false,
    type: 'number',
    description: 'Current on-hand stock count',
    aliases: ['quantity', 'qty', 'stock', 'units', 'count', 'amount', 'on hand', 'stock count'],
  },
  {
    key: 'balance',
    label: 'Balance / Valuation ($)',
    required: false,
    type: 'number',
    description: 'Financial value or unit price',
    aliases: ['balance', 'price', 'cost', 'unit price', 'value', 'valuation', 'total', 'rate'],
  },
  {
    key: 'barcode',
    label: 'Barcode / SKU',
    required: false,
    type: 'string',
    description: 'UPC, EAN-13, or alphanumeric barcode',
    aliases: ['barcode', 'code', 'sku', 'upc', 'ean', 'bar code', 'serial', 'gtin'],
  },
  {
    key: 'expiry_date',
    label: 'Expiry Date',
    required: false,
    type: 'date',
    description: 'Expiration or best-before date',
    aliases: ['expiry', 'expiry date', 'expiration', 'exp date', 'exp', 'best before', 'bb date'],
  },
];

/**
 * Parse an uploaded Excel/CSV file
 */
export async function parseExcelFile(file: File): Promise<ParsedExcelData> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('Spreadsheet contains no sheets.');
  }

  const worksheet = workbook.Sheets[firstSheetName];
  // Parse raw JSON rows
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, {
    defval: '',
    raw: false,
    dateNF: 'yyyy-mm-dd',
  });

  if (!rawRows || rawRows.length === 0) {
    throw new Error('Spreadsheet appears to be empty.');
  }

  // Extract all unique headers across all rows
  const headersSet = new Set<string>();
  rawRows.forEach((row) => {
    Object.keys(row).forEach((k) => {
      const trimmed = k.trim();
      if (trimmed) headersSet.add(trimmed);
    });
  });

  const headers = Array.from(headersSet);
  return {
    headers,
    rows: rawRows,
    totalRows: rawRows.length,
  };
}

/**
 * Heuristic auto-matching from detected Excel headers to target database fields
 */
export function autoMatchColumns(
  excelHeaders: string[],
  targetFields: TargetFieldDef[] = INVENTORY_TARGET_FIELDS
): Record<string, string> {
  const mapping: Record<string, string> = {};

  targetFields.forEach((field) => {
    const cleanAliases = field.aliases.map((a) => a.toLowerCase().replace(/[^a-z0-9]/g, ''));

    // Try exact or alias matching
    let matchedHeader = excelHeaders.find((h) => {
      const cleanH = h.toLowerCase().replace(/[^a-z0-9]/g, '');
      return cleanAliases.includes(cleanH);
    });

    // Try partial contains matching if no exact match
    if (!matchedHeader) {
      matchedHeader = excelHeaders.find((h) => {
        const cleanH = h.toLowerCase().replace(/[^a-z0-9]/g, '');
        return cleanAliases.some((alias) => cleanH.includes(alias) || alias.includes(cleanH));
      });
    }

    if (matchedHeader) {
      mapping[field.key] = matchedHeader;
    }
  });

  return mapping;
}
