'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircleIcon, ArrowDownIcon, BoxesIcon, CheckCircleIcon, RefreshIcon, XIcon } from '@stocky/icons';
import type { Location, Product } from '@stocky/types';
import { supabase } from '@/lib/supabase/client';
import { autoMatchColumns, parseExcelFile, type ParsedExcelData, type TargetFieldDef } from '@/lib/excel/import';
import { useTranslation } from '@/lib/i18n';

type StockImportFieldKey = 'barcode' | 'name' | 'quantity' | 'location_name' | 'category_name' | 'unit_name' | 'lot_number' | 'expiry_date' | 'expiry_notification_days' | 'unit_cost' | 'reorder_point';

const STOCK_IMPORT_FIELDS: TargetFieldDef[] = [
  { key: 'barcode', label: 'Barcode', required: true, type: 'string', description: 'Used to find and update the product.', aliases: ['barcode', 'bar code', 'code', 'sku', 'upc', 'ean', 'gtin'] },
  { key: 'name', label: 'Product name', required: true, type: 'string', description: 'Required for new products and used to refresh the product name.', aliases: ['name', 'item', 'product', 'item name', 'product name', 'title'] },
  { key: 'quantity', label: 'Quantity', required: true, type: 'number', description: 'Final on-hand quantity at the selected location.', aliases: ['quantity', 'qty', 'stock', 'units', 'count', 'amount', 'on hand', 'stock count'] },
  { key: 'location_name', label: 'Location', type: 'string', description: 'Optional when using one default location.', aliases: ['location', 'branch', 'warehouse', 'store', 'site'] },
  { key: 'category_name', label: 'Category', type: 'string', description: 'Product category; defaults to General.', aliases: ['category', 'cat', 'department', 'dept', 'group', 'type', 'category name'] },
  { key: 'unit_name', label: 'Unit', type: 'string', description: 'For example: piece, box, kg, or bottle.', aliases: ['unit', 'unit name', 'measure', 'uom'] },
  { key: 'lot_number', label: 'Batch / lot', type: 'string', description: 'Use this when the same product has multiple batches.', aliases: ['lot', 'lot number', 'batch', 'batch number', 'batch / lot'] },
  { key: 'expiry_date', label: 'Expiry date', type: 'date', description: 'Date for this batch; leave blank when not applicable.', aliases: ['expiry', 'expiry date', 'expiration', 'expiration date', 'exp date', 'best before'] },
  { key: 'expiry_notification_days', label: 'Alert days', type: 'number', description: 'Days before expiry to create an alert.', aliases: ['notification days', 'notify before', 'alert days', 'days before expiry'] },
  { key: 'unit_cost', label: 'Unit cost', type: 'number', description: 'Optional cost used in stock valuation.', aliases: ['cost', 'unit cost', 'price', 'unit price', 'value'] },
  { key: 'reorder_point', label: 'Reorder point', type: 'number', description: 'Quantity at or below which the product needs replenishment.', aliases: ['reorder point', 'reorder', 'minimum', 'min stock', 'par level'] },
];

interface ImportRow {
  index: number;
  barcode: string;
  name: string;
  quantity: number | null;
  locationId: string | null;
  locationName: string;
  categoryName: string;
  unitName: string;
  lotNumber: string;
  expiryDate: string | null;
  expiryNotificationDays: number | null;
  unitCost: number | null;
  reorderPoint: number | null;
  errors: string[];
}

export interface InventoryImportModalWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  products: Product[];
  locations: Location[];
  selectedLocationId: string;
  onImportSuccess: () => void;
}

export type StockImportModalWidgetProps = InventoryImportModalWidgetProps;

function cleanNumber(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value.replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

function cleanDate(value: string) {
  if (!value.trim()) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export function InventoryImportModalWidget({ isOpen, onClose, companyId, products, locations, selectedLocationId, onImportSuccess }: InventoryImportModalWidgetProps) {
  const { t, locale, isRtl } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedExcelData | null>(null);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [defaultLocationId, setDefaultLocationId] = useState(selectedLocationId === 'all' ? '' : selectedLocationId);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [success, setSuccess] = useState<{ importedCount: number; createdProductCount: number; updatedProductCount: number; createdLotCount: number } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDefaultLocationId(selectedLocationId === 'all' ? '' : selectedLocationId);
      setError(null);
    }
  }, [isOpen, selectedLocationId]);

  const reset = () => {
    setFile(null);
    setParsedData(null);
    setColumnMapping({});
    setIsParsing(false);
    setIsImporting(false);
    setError(null);
    setProgress({ current: 0, total: 0 });
    setSuccess(null);
  };

  const close = () => {
    if (isImporting) return;
    reset();
    onClose();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setParsedData(null);
    setSuccess(null);
    setError(null);
    setIsParsing(true);
    try {
      const data = await parseExcelFile(selectedFile);
      setParsedData(data);
      setColumnMapping(autoMatchColumns(data.headers, STOCK_IMPORT_FIELDS));
    } catch (parseError: any) {
      setError(parseError?.message || t('modals.import.errors.couldNotRead'));
    } finally {
      setIsParsing(false);
    }
  };

  const locationByName = useMemo(() => {
    const map = new Map<string, Location>();
    locations.forEach((location) => {
      map.set(location.name.trim().toLowerCase(), location);
      if (location.code) map.set(location.code.trim().toLowerCase(), location);
    });
    return map;
  }, [locations]);
  const productBarcodes = useMemo(() => new Set(products.map((product) => product.barcode?.trim()).filter(Boolean)), [products]);

  const importRows = useMemo<ImportRow[]>(() => {
    if (!parsedData) return [];
    const getValue = (row: Record<string, any>, key: StockImportFieldKey) => columnMapping[key] ? String(row[columnMapping[key]] ?? '').trim() : '';
    return parsedData.rows.map((row, index) => {
      const barcode = getValue(row, 'barcode');
      const name = getValue(row, 'name');
      const quantityRaw = getValue(row, 'quantity');
      const quantityNumber = cleanNumber(quantityRaw);
      const locationText = getValue(row, 'location_name');
      const location = locationText ? locationByName.get(locationText.toLowerCase()) : locations.find((item) => item.id === defaultLocationId);
      const expiryText = getValue(row, 'expiry_date');
      const expiryDate = cleanDate(expiryText);
      const alertText = getValue(row, 'expiry_notification_days');
      const alertDaysNumber = cleanNumber(alertText);
      const unitCostText = getValue(row, 'unit_cost');
      const reorderText = getValue(row, 'reorder_point');
      const errors: string[] = [];
      if (!barcode) errors.push(t('modals.import.errors.missingBarcode'));
      if (!name) errors.push(t('modals.import.errors.missingName'));
      if (quantityNumber === null || !Number.isInteger(quantityNumber) || quantityNumber < 0) errors.push(t('modals.import.errors.quantityInvalid'));
      if (!location) errors.push(locationText ? t('modals.import.errors.locationNotFound', { location: locationText }) : t('modals.import.errors.chooseDefaultLocation'));
      if (expiryText && !expiryDate) errors.push(t('modals.import.errors.expiryInvalid'));
      if (alertText && (alertDaysNumber === null || !Number.isInteger(alertDaysNumber) || alertDaysNumber < 0)) errors.push(t('modals.import.errors.alertDaysInvalid'));
      if (unitCostText && (cleanNumber(unitCostText) === null || Number(cleanNumber(unitCostText)) < 0)) errors.push(t('modals.import.errors.unitCostInvalid'));
      if (reorderText && (cleanNumber(reorderText) === null || !Number.isInteger(cleanNumber(reorderText)) || Number(cleanNumber(reorderText)) < 0)) errors.push(t('modals.import.errors.reorderPointInvalid'));
      return {
        index: index + 2,
        barcode,
        name,
        quantity: quantityNumber === null ? null : Math.round(quantityNumber),
        locationId: location?.id || null,
        locationName: location?.name || locationText,
        categoryName: getValue(row, 'category_name'),
        unitName: getValue(row, 'unit_name'),
        lotNumber: getValue(row, 'lot_number'),
        expiryDate,
        expiryNotificationDays: alertDaysNumber === null ? null : Math.round(alertDaysNumber),
        unitCost: unitCostText ? cleanNumber(unitCostText) : null,
        reorderPoint: reorderText ? cleanNumber(reorderText) : null,
        errors,
      };
    });
  }, [columnMapping, defaultLocationId, locationByName, locations, parsedData, t]);

  const missingRequiredMappings = STOCK_IMPORT_FIELDS.filter((field) => field.required && !columnMapping[field.key]);
  const validationErrors = importRows.flatMap((row) => row.errors.map((message) => `${t('modals.import.tableRow')} ${row.index}: ${message}`));
  const duplicateKeys = useMemo(() => {
    const counts = new Map<string, number>();
    importRows.forEach((row) => {
      if (row.barcode && row.locationId) {
        const key = `${row.barcode}|${row.locationId}|${row.lotNumber}|${row.expiryDate || ''}`;
        counts.set(key, (counts.get(key) || 0) + 1);
      }
    });
    return new Set(Array.from(counts.entries()).filter(([, count]) => count > 1).map(([key]) => key));
  }, [importRows]);
  const validRows = importRows.filter((row) => {
    const key = `${row.barcode}|${row.locationId}|${row.lotNumber}|${row.expiryDate || ''}`;
    return row.errors.length === 0 && !duplicateKeys.has(key);
  });
  const previewRows = importRows.slice(0, 8);

  const startImport = async () => {
    if (!companyId || !parsedData || missingRequiredMappings.length > 0 || validationErrors.length > 0 || duplicateKeys.size > 0 || validRows.length === 0) {
      setError(duplicateKeys.size > 0 ? t('modals.import.errors.fixDuplicateRows') : t('modals.import.errors.fixHighlightedRows'));
      return;
    }
    const groupedRows = Array.from(new Map(validRows.map((row) => [row.locationId as string, validRows.filter((candidate) => candidate.locationId === row.locationId)])).values());
    setIsImporting(true);
    setError(null);
    setProgress({ current: 0, total: groupedRows.length });
    try {
      let result = { importedCount: 0, createdProductCount: 0, updatedProductCount: 0, createdLotCount: 0 };
      for (let index = 0; index < groupedRows.length; index += 1) {
        const group = groupedRows[index];
        const { data, error: rpcError } = await supabase.rpc('import_stock_snapshot', {
          p_location_id: group[0].locationId,
          p_rows: group.map((row) => ({ barcode: row.barcode, name: row.name, quantity: row.quantity, category_name: row.categoryName, unit_name: row.unitName, lot_number: row.lotNumber || null, expiry_date: row.expiryDate, expiry_notification_days: row.expiryNotificationDays, unit_cost: row.unitCost, reorder_point: row.reorderPoint })),
        });
        if (rpcError) throw rpcError;
        const batchResult = (data || {}) as Partial<typeof result>;
        result = {
          importedCount: result.importedCount + Number(batchResult.importedCount || 0),
          createdProductCount: result.createdProductCount + Number(batchResult.createdProductCount || 0),
          updatedProductCount: result.updatedProductCount + Number(batchResult.updatedProductCount || 0),
          createdLotCount: result.createdLotCount + Number(batchResult.createdLotCount || 0),
        };
        setProgress({ current: index + 1, total: groupedRows.length });
      }
      setSuccess(result);
      onImportSuccess();
    } catch (importError: any) {
      const message = importError?.message || t('modals.import.errors.importFailed');
      setError(message.includes('import_stock_snapshot') ? t('modals.import.errors.dbFunctionMissing') : message);
    } finally {
      setIsImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="stock-import-title" dir={isRtl ? 'rtl' : 'ltr'} style={{ fontFamily: isRtl ? 'Cairo, sans-serif' : undefined }}>
      <section className="flex max-h-[min(92vh,900px)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-stocky-border-subtle bg-stocky-bg-widget shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-stocky-border-subtle px-5 py-4 sm:px-6">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-stocky-primary/10 text-stocky-primary">
              <BoxesIcon size="sm" />
            </span>
            <div>
              <h2 id="stock-import-title" className="text-lg font-medium text-stocky-text-main">
                {t('modals.import.title')}
              </h2>
              <p className="mt-1 max-w-2xl text-xs text-stocky-text-sub">
                {t('modals.import.subtitle')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={close}
            disabled={isImporting}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-stocky-text-sub hover:bg-stocky-bg-global hover:text-stocky-text-main disabled:opacity-50"
            aria-label={t('modals.import.close')}
          >
            <XIcon size="xs" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
          {success ? (
            <div className="flex min-h-80 flex-col items-center justify-center text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                <CheckCircleIcon size="lg" />
              </span>
              <h3 className="mt-4 text-base font-medium text-stocky-text-main">
                {t('modals.import.successTitle')}
              </h3>
              <p className="mt-2 max-w-md text-xs text-stocky-text-sub">
                {t('modals.import.successDesc', {
                  imported: success.importedCount,
                  created: success.createdProductCount,
                  lots: success.createdLotCount,
                })}
              </p>
              <button
                type="button"
                onClick={close}
                className="mt-5 h-9 rounded-full bg-stocky-primary px-5 text-xs font-medium text-white"
              >
                {t('modals.import.done')}
              </button>
            </div>
          ) : !parsedData ? (
            <label className="flex min-h-80 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stocky-border-subtle bg-stocky-bg-global/50 p-8 text-center transition-colors hover:border-stocky-primary hover:bg-stocky-primary/5">
              <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} className="hidden" />
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-stocky-primary/10 text-stocky-primary">
                <ArrowDownIcon size="md" />
              </span>
              <span className="mt-4 text-sm font-medium text-stocky-text-main">
                {t('modals.import.chooseFile')}
              </span>
              <span className="mt-1 text-xs text-stocky-text-sub">
                {t('modals.import.fileHint')}
              </span>
              {isParsing && (
                <span className="mt-4 text-xs text-stocky-text-sub">
                  {t('modals.import.readingFile')}
                </span>
              )}
            </label>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-col gap-3 rounded-xl border border-stocky-border-subtle bg-stocky-bg-global/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-medium text-stocky-text-main">{file?.name}</p>
                  <p className="mt-1 text-[11px] text-stocky-text-sub">
                    {t('modals.import.rowsColumnsDetected', {
                      rows: parsedData.totalRows.toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-US'),
                      columns: parsedData.headers.length,
                    })}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={reset}
                  disabled={isImporting}
                  className="inline-flex h-8 items-center gap-1.5 self-start rounded-full border border-stocky-border-subtle px-3 text-[11px] font-medium text-stocky-text-main disabled:opacity-50"
                >
                  <RefreshIcon size="xs" /> {t('modals.import.chooseAnotherFile')}
                </button>
              </div>

              <div className="rounded-xl border border-stocky-primary/20 bg-stocky-primary/5 p-3 text-xs text-stocky-text-sub leading-relaxed">
                {t('modals.import.howItWorks')}
              </div>

              {(selectedLocationId === 'all' || columnMapping.location_name) && (
                <label className="block">
                  <span className="text-xs font-medium text-stocky-text-main">
                    {t('modals.import.defaultLocation')} {!columnMapping.location_name && <span className="text-red-600">*</span>}
                  </span>
                  <select
                    value={defaultLocationId}
                    onChange={(event) => setDefaultLocationId(event.target.value)}
                    disabled={Boolean(columnMapping.location_name)}
                    className="stocky-compact-select mt-1.5 h-10 w-full rounded-xl border border-stocky-border-subtle bg-stocky-bg-widget px-3 text-stocky-text-main disabled:opacity-60"
                  >
                    <option value="">{t('modals.import.chooseLocation')}</option>
                    {locations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))}
                  </select>
                  {columnMapping.location_name && (
                    <span className="mt-1 block text-[11px] text-stocky-text-sub">
                      {t('modals.import.locationColumnHint')}
                    </span>
                  )}
                </label>
              )}

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-medium text-stocky-text-main">
                      {t('modals.import.matchColumns')}
                    </h3>
                    <p className="mt-1 text-[11px] text-stocky-text-sub">
                      {t('modals.import.matchColumnsHint')}
                    </p>
                  </div>
                  <span className="text-[11px] text-stocky-text-sub">
                    {missingRequiredMappings.length
                      ? t('modals.import.requiredCount', { count: missingRequiredMappings.length })
                      : t('modals.import.allRequiredMatched')}
                  </span>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  {STOCK_IMPORT_FIELDS.map((field) => {
                    const translatedLabel = t(`modals.import.fields.${field.key}` as any) || field.label;
                    const translatedDesc = t(`modals.import.fields.${field.key}Desc` as any) || field.description;
                    return (
                      <label
                        key={field.key}
                        className="flex items-center gap-3 rounded-xl border border-stocky-border-subtle bg-stocky-bg-global/50 p-3"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block text-xs font-medium text-stocky-text-main">
                            {translatedLabel} {field.required && <span className="text-red-600">*</span>}
                          </span>
                          <span className="mt-0.5 block text-[10px] text-stocky-text-sub">
                            {translatedDesc}
                          </span>
                        </span>
                        <select
                          value={columnMapping[field.key] || ''}
                          onChange={(event) =>
                            setColumnMapping((current) => ({ ...current, [field.key]: event.target.value }))
                          }
                          className="stocky-compact-select h-8 w-40 min-w-0 rounded-lg border border-stocky-border-subtle bg-stocky-bg-widget px-2 text-stocky-text-main"
                        >
                          <option value="">{t('modals.import.doNotImport')}</option>
                          {parsedData.headers.map((header) => (
                            <option key={header} value={header}>
                              {header}
                            </option>
                          ))}
                        </select>
                      </label>
                    );
                  })}
                </div>
              </div>

              {missingRequiredMappings.length > 0 || validationErrors.length > 0 || duplicateKeys.size > 0 ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
                  <div className="flex items-start gap-2">
                    <AlertCircleIcon size="xs" />
                    <div>
                      <p className="font-medium">{t('modals.import.fixBeforeImport')}</p>
                      <ul className="mt-1 list-disc ps-4 space-y-0.5">
                        {missingRequiredMappings.length > 0 && (
                          <li>
                            {t('modals.import.mapRequiredColumns', {
                              columns: missingRequiredMappings
                                .map((field) => t(`modals.import.fields.${field.key}` as any) || field.label)
                                .join(', '),
                            })}
                          </li>
                        )}
                        {validationErrors.slice(0, 5).map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                        {duplicateKeys.size > 0 && (
                          <li>{t('modals.import.duplicateCombinations', { count: duplicateKeys.size })}</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : null}

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-medium text-stocky-text-main">
                    {t('modals.import.preview')}
                  </h3>
                  <span className="text-[11px] text-stocky-text-sub">
                    {t('modals.import.showingRows', {
                      count: Math.min(previewRows.length, 8),
                      total: importRows.length,
                    })}
                  </span>
                </div>
                <div className="overflow-x-auto rounded-xl border border-stocky-border-subtle">
                  <table className="min-w-[780px] w-full text-start">
                    <thead className="bg-stocky-bg-global">
                      <tr className="text-[10px] uppercase tracking-wide text-stocky-text-sub">
                        <th className="px-3 py-2.5 text-start">{t('modals.import.tableRow')}</th>
                        <th className="px-3 py-2.5 text-start">{t('modals.import.tableProductBarcode')}</th>
                        <th className="px-3 py-2.5 text-start">{t('modals.import.tableLocation')}</th>
                        <th className="px-3 py-2.5 text-end">{t('modals.import.tableQuantity')}</th>
                        <th className="px-3 py-2.5 text-start">{t('modals.import.tableBatchExpiry')}</th>
                        <th className="px-3 py-2.5 text-start">{t('modals.import.tableResult')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stocky-border-subtle">
                      {previewRows.map((row) => (
                        <tr key={row.index} className="text-[11px]">
                          <td className="px-3 py-3 text-start text-stocky-text-sub">{row.index}</td>
                          <td className="px-3 py-3 text-start">
                            <p className="font-medium text-stocky-text-main">
                              {row.name || t('modals.import.unnamedProduct')}
                            </p>
                            <p className="mt-0.5 text-stocky-text-sub">
                              {row.barcode || t('modals.import.missingBarcode')}
                            </p>
                          </td>
                          <td className="px-3 py-3 text-start text-stocky-text-sub">
                            {row.locationName || t('modals.import.notSelected')}
                          </td>
                          <td className="px-3 py-3 text-end font-medium text-stocky-text-main">
                            {row.quantity ?? '—'}
                          </td>
                          <td className="px-3 py-3 text-start text-stocky-text-sub">
                            {row.lotNumber || t('modals.import.noLot')}
                            {row.expiryDate
                              ? ` · ${new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                }).format(new Date(row.expiryDate))}`
                              : ''}
                          </td>
                          <td className="px-3 py-3 text-start">
                            {row.errors.length ? (
                              <span className="text-red-700">{t('modals.import.needsFixing')}</span>
                            ) : duplicateKeys.has(`${row.barcode}|${row.locationId}|${row.lotNumber}|${row.expiryDate || ''}`) ? (
                              <span className="text-red-700">{t('modals.import.duplicate')}</span>
                            ) : (
                              <span className="text-emerald-700">
                                {productBarcodes.has(row.barcode)
                                  ? t('modals.import.updateExisting')
                                  : t('modals.import.createProduct')}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {isImporting && (
                <div className="rounded-xl border border-stocky-border-subtle bg-stocky-bg-global p-3">
                  <div className="flex items-center justify-between text-xs font-medium text-stocky-text-main">
                    <span>{t('modals.import.updatingStock')}</span>
                    <span>
                      {t('modals.import.locationsProgress', {
                        current: progress.current,
                        total: progress.total,
                      })}
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-stocky-border-subtle">
                    <div
                      className="h-full bg-stocky-primary transition-all"
                      style={{ width: `${progress.total ? (progress.current / progress.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
          {error && !success && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
              <AlertCircleIcon size="xs" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {!success && parsedData && (
          <footer className="flex flex-col-reverse gap-2 border-t border-stocky-border-subtle bg-stocky-bg-global/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-[11px] text-stocky-text-sub">
              {t('modals.import.validRowsReady', {
                count: validRows.length.toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-US'),
              })}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={close}
                disabled={isImporting}
                className="h-9 flex-1 rounded-full border border-stocky-border-subtle px-4 text-xs font-medium text-stocky-text-main disabled:opacity-50 sm:flex-none"
              >
                {t('modals.import.cancel')}
              </button>
              <button
                type="button"
                onClick={startImport}
                disabled={
                  isImporting ||
                  missingRequiredMappings.length > 0 ||
                  validationErrors.length > 0 ||
                  duplicateKeys.size > 0 ||
                  validRows.length === 0
                }
                className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full bg-stocky-primary px-4 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
              >
                <CheckCircleIcon size="xs" />
                {isImporting
                  ? t('modals.import.updating')
                  : t('modals.import.updateRowsBtn', {
                      count: validRows.length.toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-US'),
                    })}
              </button>
            </div>
          </footer>
        )}
      </section>
    </div>
  );
}

export const StockImportModalWidget = InventoryImportModalWidget;
