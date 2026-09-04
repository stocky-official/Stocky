'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XIcon,
  BoxesIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  ArrowDownIcon,
  RefreshIcon,
} from '@stocky/icons';
import { supabase } from '@/lib/supabase/client';
import {
  parseExcelFile,
  autoMatchColumns,
  INVENTORY_TARGET_FIELDS,
  type ParsedExcelData,
} from '@/lib/excel/import';

export interface ExcelImportModalWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBranchId: string;
  selectedBranchName: string;
  onImportSuccess: () => void;
}

export function ExcelImportModalWidget({
  isOpen,
  onClose,
  selectedBranchId,
  selectedBranchName,
  onImportSuccess,
}: ExcelImportModalWidgetProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedExcelData | null>(null);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [targetBranchId, setTargetBranchId] = useState<string>(selectedBranchId);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  // Seeding execution state
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedProgress, setSeedProgress] = useState<{ current: number; total: number } | null>(
    null
  );
  const [seedSuccessCount, setSeedSuccessCount] = useState<number | null>(null);
  const [seedError, setSeedError] = useState<string | null>(null);

  // Reset state when closed or opened
  const handleReset = () => {
    setFile(null);
    setParsedData(null);
    setColumnMapping({});
    setIsParsing(false);
    setParseError(null);
    setIsSeeding(false);
    setSeedProgress(null);
    setSeedSuccessCount(null);
    setSeedError(null);
  };

  const handleModalClose = () => {
    handleReset();
    onClose();
  };

  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setIsParsing(true);
    setParseError(null);

    try {
      const data = await parseExcelFile(selected);
      setParsedData(data);

      // Heuristic auto-match
      const autoMatched = autoMatchColumns(data.headers, INVENTORY_TARGET_FIELDS);
      setColumnMapping(autoMatched);
    } catch (err: any) {
      console.error('Error parsing spreadsheet:', err);
      setParseError(err.message || 'Failed to read file. Please ensure it is a valid Excel or CSV.');
      setParsedData(null);
    } finally {
      setIsParsing(false);
    }
  };

  const handleMappingChange = (targetKey: string, excelCol: string) => {
    setColumnMapping((prev) => {
      const next = { ...prev };
      if (!excelCol) {
        delete next[targetKey];
      } else {
        next[targetKey] = excelCol;
      }
      return next;
    });
  };

  // Preview of mapped data (first 3 rows)
  const previewRows = useMemo(() => {
    if (!parsedData || parsedData.rows.length === 0) return [];
    return parsedData.rows.slice(0, 3).map((row) => {
      const mapped: Record<string, any> = {};
      INVENTORY_TARGET_FIELDS.forEach((field) => {
        const sourceHeader = columnMapping[field.key];
        mapped[field.key] = sourceHeader ? row[sourceHeader] : '';
      });
      return mapped;
    });
  }, [parsedData, columnMapping]);

  // Execute database batch seeding
  const handleStartSeeding = async () => {
    if (!parsedData || !columnMapping.name) {
      setSeedError('Please map the required "Item Name" column before proceeding.');
      return;
    }

    setIsSeeding(true);
    setSeedError(null);
    setSeedProgress({ current: 0, total: parsedData.totalRows });

    try {
      // 1. Fetch current company ID
      const {
        data: { user },
      } = await supabase.auth.getUser();
      let companyId: string | null = null;
      if (user) {
        const { data: profile } = await supabase
          .from('company_users')
          .select('company_id')
          .or(`auth_user_id.eq.${user.id},email.eq.${user.email}`)
          .limit(1)
          .maybeSingle();
        companyId = profile?.company_id || null;
      }

      // If branch is "all", resolve to first available branch
      let effectiveBranchId = targetBranchId;
      if (!effectiveBranchId || effectiveBranchId === 'all') {
        const { data: branches } = await supabase
          .from('branches')
          .select('id')
          .limit(1);
        if (branches && branches.length > 0) {
          effectiveBranchId = branches[0].id;
        }
      }

      // 2. Transform rows
      const itemsToInsert = parsedData.rows
        .map((row) => {
          const rawName = columnMapping.name ? String(row[columnMapping.name] || '').trim() : '';
          if (!rawName) return null; // Skip empty rows

          const rawCategory = columnMapping.category_name
            ? String(row[columnMapping.category_name] || '').trim()
            : 'Uncategorized';

          const rawQty = columnMapping.quantity ? row[columnMapping.quantity] : 0;
          const cleanQty = Math.max(0, parseInt(String(rawQty).replace(/[^0-9-]/g, ''), 10) || 0);

          const rawBalance = columnMapping.balance ? row[columnMapping.balance] : 0;
          const cleanBalance = Math.max(
            0,
            parseFloat(String(rawBalance).replace(/[^0-9.-]/g, '')) || 0
          );

          const rawBarcode = columnMapping.barcode
            ? String(row[columnMapping.barcode] || '').trim()
            : null;

          let cleanExpiry: string | null = null;
          if (columnMapping.expiry_date && row[columnMapping.expiry_date]) {
            try {
              const d = new Date(row[columnMapping.expiry_date]);
              if (!isNaN(d.getTime())) {
                cleanExpiry = d.toISOString();
              }
            } catch {}
          }

          return {
            company_id: companyId,
            branch_id: effectiveBranchId,
            name: rawName,
            category_name: rawCategory || 'General',
            quantity: cleanQty,
            balance: cleanBalance,
            barcode: rawBarcode || null,
            expiry_date: cleanExpiry,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      if (itemsToInsert.length === 0) {
        throw new Error('No valid item rows found with non-empty Item Names.');
      }

      // 3. Batch insert in chunks of 50
      const CHUNK_SIZE = 50;
      let insertedCount = 0;

      for (let i = 0; i < itemsToInsert.length; i += CHUNK_SIZE) {
        const chunk = itemsToInsert.slice(i, i + CHUNK_SIZE);
        const { error } = await supabase.from('items').insert(chunk as any);
        if (error) throw error;

        insertedCount += chunk.length;
        setSeedProgress({ current: insertedCount, total: itemsToInsert.length });
      }

      setSeedSuccessCount(insertedCount);
      onImportSuccess();
    } catch (err: any) {
      console.error('Failed to seed items:', err);
      setSeedError(err.message || 'Failed to seed items to database. Please try again.');
    } finally {
      setIsSeeding(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-stocky-bg-widget border border-stocky-border-subtle rounded-widget shadow-2xl w-full max-w-2xl overflow-hidden my-8"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-stocky-border-subtle flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-widget bg-stocky-primary/10 text-stocky-primary flex items-center justify-center">
                <BoxesIcon size="sm" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-stocky-text-main">
                  Import Inventory from Excel / CSV
                </h3>
                <p className="text-xs text-stocky-text-sub">
                  Target Branch: <span className="text-stocky-text-main font-medium">{selectedBranchName}</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleModalClose}
              className="w-8 h-8 rounded-widget text-stocky-text-sub hover:text-stocky-text-main hover:bg-stocky-bg-global flex items-center justify-center transition-colors cursor-pointer"
            >
              <XIcon size="sm" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* Success State */}
            {seedSuccessCount !== null ? (
              <div className="py-8 text-center space-y-4">
                <div className="w-14 h-14 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircleIcon size="lg" />
                </div>
                <div>
                  <h4 className="text-base font-medium text-stocky-text-main">
                    Seeding Complete!
                  </h4>
                  <p className="text-xs text-stocky-text-sub mt-1">
                    Successfully imported{' '}
                    <span className="font-semibold text-green-500">
                      {seedSuccessCount} items
                    </span>{' '}
                    into {selectedBranchName}.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleModalClose}
                  className="px-6 py-2 bg-stocky-primary hover:bg-stocky-primary-hover text-white text-xs font-medium rounded-widget transition-colors cursor-pointer"
                >
                  Done & Refresh Catalog
                </button>
              </div>
            ) : (
              <>
                {/* 1. File Upload Dropzone */}
                {!parsedData && (
                  <div className="space-y-4">
                    <label className="border-2 border-dashed border-stocky-border-subtle hover:border-stocky-primary rounded-widget p-8 flex flex-col items-center justify-center gap-3 cursor-pointer bg-stocky-bg-global/40 hover:bg-stocky-bg-global transition-all text-center">
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <div className="w-12 h-12 rounded-full bg-stocky-primary/10 text-stocky-primary flex items-center justify-center">
                        <ArrowDownIcon size="md" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-stocky-text-main">
                          Click to browse or drag and drop spreadsheet
                        </p>
                        <p className="text-[11px] text-stocky-text-sub mt-0.5">
                          Supports Excel (.xlsx, .xls) and CSV (.csv) files
                        </p>
                      </div>
                    </label>

                    {isParsing && (
                      <div className="flex items-center justify-center gap-2 py-4 text-xs text-stocky-text-sub">
                        <span className="w-4 h-4 border-2 border-stocky-primary border-t-transparent rounded-full animate-spin" />
                        <span>Parsing spreadsheet columns and rows...</span>
                      </div>
                    )}

                    {parseError && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-widget text-xs text-red-400 flex items-center gap-2">
                        <AlertCircleIcon size="xs" />
                        <span>{parseError}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Column Mapping Interface */}
                {parsedData && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between pb-3 border-b border-stocky-border-subtle">
                      <div>
                        <span className="text-xs font-medium text-stocky-text-main">
                          Map Spreadsheet Columns
                        </span>
                        <p className="text-[11px] text-stocky-text-sub">
                          Detected {parsedData.headers.length} columns & {parsedData.totalRows} rows in "{file?.name}"
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleReset}
                        className="text-xs text-stocky-text-sub hover:text-stocky-text-main flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshIcon size="xs" />
                        Choose different file
                      </button>
                    </div>

                    {/* Mapping Grid */}
                    <div className="space-y-3">
                      {INVENTORY_TARGET_FIELDS.map((field) => {
                        const isMapped = !!columnMapping[field.key];
                        return (
                          <div
                            key={field.key}
                            className="p-3 bg-stocky-bg-global border border-stocky-border-subtle rounded-widget flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-medium text-stocky-text-main">
                                  {field.label}
                                </span>
                                {field.required && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-500/10 text-red-400 font-normal">
                                    Required
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-stocky-text-sub">
                                {field.description}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 sm:w-60">
                              <select
                                value={columnMapping[field.key] || ''}
                                onChange={(e) =>
                                  handleMappingChange(field.key, e.target.value)
                                }
                                className={`w-full h-8 px-2.5 bg-stocky-bg-widget border rounded-widget text-xs focus:outline-none focus:border-stocky-primary cursor-pointer ${
                                  isMapped
                                    ? 'border-stocky-primary/40 text-stocky-text-main font-medium'
                                    : field.required
                                    ? 'border-red-500/40 text-stocky-text-sub'
                                    : 'border-stocky-border-subtle text-stocky-text-sub'
                                }`}
                              >
                                <option value="">-- Do not map --</option>
                                {parsedData.headers.map((h) => (
                                  <option key={h} value={h}>
                                    {h}
                                  </option>
                                ))}
                              </select>

                              {isMapped && (
                                <CheckCircleIcon
                                  size="xs"
                                  className="text-green-500 shrink-0"
                                />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Data Preview Table */}
                    <div className="space-y-2">
                      <span className="text-xs font-medium text-stocky-text-main">
                        Sample Data Preview (First 3 Rows)
                      </span>
                      <div className="overflow-x-auto border border-stocky-border-subtle rounded-widget">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="bg-stocky-bg-global text-stocky-text-sub border-b border-stocky-border-subtle">
                              <th className="py-2 px-3 font-medium">Item Name</th>
                              <th className="py-2 px-3 font-medium">Category</th>
                              <th className="py-2 px-3 font-medium text-right">Qty</th>
                              <th className="py-2 px-3 font-medium text-right">Balance</th>
                              <th className="py-2 px-3 font-medium">Barcode</th>
                              <th className="py-2 px-3 font-medium">Expiry</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stocky-border-subtle">
                            {previewRows.map((r, i) => (
                              <tr key={i} className="hover:bg-stocky-bg-global/50">
                                <td className="py-2 px-3 font-medium text-stocky-text-main">
                                  {r.name || <span className="text-stocky-text-sub/40 italic">Empty</span>}
                                </td>
                                <td className="py-2 px-3 text-stocky-text-sub">
                                  {r.category_name || 'General'}
                                </td>
                                <td className="py-2 px-3 text-right font-mono text-stocky-text-main">
                                  {r.quantity || 0}
                                </td>
                                <td className="py-2 px-3 text-right font-mono text-stocky-text-main">
                                  ${Number(r.balance || 0).toFixed(2)}
                                </td>
                                <td className="py-2 px-3 font-mono text-stocky-text-sub">
                                  {r.barcode || '-'}
                                </td>
                                <td className="py-2 px-3 text-stocky-text-sub">
                                  {r.expiry_date || '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Progress Bar (during seeding) */}
                    {isSeeding && seedProgress && (
                      <div className="space-y-2 p-4 bg-stocky-bg-global rounded-widget border border-stocky-border-subtle">
                        <div className="flex items-center justify-between text-xs text-stocky-text-main font-medium">
                          <span>Seeding database records...</span>
                          <span>
                            {seedProgress.current} / {seedProgress.total} (
                            {Math.round(
                              (seedProgress.current / seedProgress.total) * 100
                            )}
                            %)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-stocky-bg-widget rounded-full overflow-hidden">
                          <div
                            className="h-full bg-stocky-primary transition-all duration-300"
                            style={{
                              width: `${(seedProgress.current / seedProgress.total) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {seedError && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-widget text-xs text-red-400 flex items-center gap-2">
                        <AlertCircleIcon size="xs" />
                        <span>{seedError}</span>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer Actions */}
          {seedSuccessCount === null && parsedData && (
            <div className="px-6 py-4 border-t border-stocky-border-subtle bg-stocky-bg-global/50 flex items-center justify-between">
              <button
                type="button"
                onClick={handleModalClose}
                disabled={isSeeding}
                className="px-4 py-2 border border-stocky-border-subtle rounded-widget text-xs text-stocky-text-sub hover:text-stocky-text-main transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleStartSeeding}
                disabled={isSeeding || !columnMapping.name}
                className="px-5 py-2 bg-stocky-primary hover:bg-stocky-primary-hover text-white text-xs font-medium rounded-widget transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                {isSeeding ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Seeding Records...</span>
                  </>
                ) : (
                  <>
                    <CheckCircleIcon size="xs" />
                    <span>Upload & Seed ({parsedData.totalRows} Items)</span>
                  </>
                )}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
