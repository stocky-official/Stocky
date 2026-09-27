'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircleIcon, SearchIcon, XIcon } from '@stocky/icons';
import { supabase } from '@/lib/supabase/client';
import type { CompanyUserRole, Location, Product, StockLot } from '@stocky/types';
import { SideDrawer } from '@/components/ui/SideDrawer';
import { useTranslation } from '@/lib/i18n';

export interface StockCountWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  lots: StockLot[];
  locations: Location[];
  selectedLocationId: string;
  userRole: CompanyUserRole;
  draftKey?: string;
  onSaved: () => void;
}

interface CountRow { productId: string; expected: number; counted: string; reason: string; }

export function StockCountWidget({ isOpen, onClose, products, lots, locations, selectedLocationId, userRole, draftKey = 'user', onSaved }: StockCountWidgetProps) {
  const { t } = useTranslation();
  const [locationId, setLocationId] = useState(selectedLocationId === 'all' ? locations[0]?.id || '' : selectedLocationId);
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<CountRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const productMap = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const scopedProducts = useMemo(() => products.filter((product) => lots.some((lot) => lot.productId === product.id && lot.locationId === locationId)), [lots, locationId, products]);

  useEffect(() => {
    if (!isOpen) return;
    const nextLocation = selectedLocationId === 'all' ? lots.find((lot) => lot.quantityOnHand > 0)?.locationId || locations[0]?.id || '' : selectedLocationId;
    setLocationId(nextLocation);
    setSearch('');
    setError(null);
  }, [isOpen, locations, selectedLocationId, lots]);

  useEffect(() => {
    if (!isOpen || !locationId) return;
    const grouped = new Map<string, number>();
    lots.filter((lot) => lot.locationId === locationId).forEach((lot) => grouped.set(lot.productId, (grouped.get(lot.productId) || 0) + Math.max(0, lot.quantityOnHand)));
    const initialRows = scopedProducts.map((product) => {
      const expected = grouped.get(product.id) || 0;
      return { productId: product.id, expected, counted: userRole === 'staff' ? '' : String(expected), reason: '' };
    });
    try {
      const storageKey = `stocky-count-draft:${draftKey}:${locationId}`;
      const saved = window.localStorage.getItem(storageKey);
      const parsed = saved ? JSON.parse(saved) as CountRow[] : null;
      const savedByProduct = new Map((parsed || []).map((row) => [row.productId, row]));
      setRows(initialRows.map((row) => savedByProduct.get(row.productId) ? { ...row, counted: savedByProduct.get(row.productId)!.counted, reason: savedByProduct.get(row.productId)!.reason } : row));
    } catch {
      setRows(initialRows);
    }
  }, [isOpen, locationId, lots, scopedProducts]);

  useEffect(() => {
    if (!isOpen || !locationId || rows.length === 0) return;
    window.localStorage.setItem(`stocky-count-draft:${draftKey}:${locationId}`, JSON.stringify(rows));
  }, [draftKey, isOpen, locationId, rows]);

  const visibleRows = rows.filter((row) => {
    const product = productMap.get(row.productId);
    const query = search.trim().toLowerCase();
    return !query || [product?.name, product?.barcode, product?.categoryName].filter(Boolean).some((value) => String(value).toLowerCase().includes(query));
  });

  const updateCount = (productId: string, counted: string) => setRows((current) => current.map((row) => row.productId === productId ? { ...row, counted } : row));
  const updateReason = (productId: string, reason: string) => setRows((current) => current.map((row) => row.productId === productId ? { ...row, reason } : row));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!locationId) return setError(t('stockCount.chooseLocationError'));
    if (rows.some((row) => row.counted === '' || !Number.isInteger(Number(row.counted)) || Number(row.counted) < 0)) return setError(t('stockCount.wholeNumberError'));
    if (userRole !== 'staff' && rows.some((row) => Number(row.counted) !== row.expected && !row.reason.trim())) return setError(t('stockCount.reasonRequiredError'));
    setSaving(true);
    const { data: sessionId, error: startError } = await supabase.rpc('start_stock_count', { p_location_id: locationId });
    if (startError) { setSaving(false); return setError(startError.message); }
    const { error: submitError } = await supabase.rpc('submit_stock_count', {
      p_session_id: sessionId,
      p_lines: rows.map((row) => ({ product_id: row.productId, counted_quantity: Number(row.counted), variance_reason: row.reason.trim() || null })),
    });
    setSaving(false);
    if (submitError) return setError(submitError.message);
    window.localStorage.removeItem(`stocky-count-draft:${draftKey}:${locationId}`);
    onSaved();
    onClose();
  };

  return <SideDrawer isOpen={isOpen} onClose={onClose} ariaLabel={t('stockCount.drawerAria')}>
      <div className="px-5 py-4 border-b border-stocky-border-subtle flex items-start justify-between gap-4 text-start">
        <div><p className="text-xs font-medium text-stocky-primary uppercase tracking-[0.12em]">{t('stockCount.eyebrow')}</p><h2 className="text-lg font-medium text-stocky-text-main mt-1">{t('stockCount.title')}</h2><p className="text-xs text-stocky-text-sub mt-1">{t('stockCount.subtitle')}</p></div>
        <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-stocky-bg-global flex items-center justify-center text-stocky-text-sub cursor-pointer" aria-label={t('stockCount.closeAria')}><XIcon size="xs" /></button>
      </div>
      <form onSubmit={submit} className="flex-1 overflow-y-auto p-5 space-y-4 text-start">
        <label className="block text-xs font-medium text-stocky-text-main">{t('stockCount.location')}<select value={locationId} onChange={(event) => setLocationId(event.target.value)} className="mt-1.5 w-full h-10 rounded-xl border border-stocky-border-subtle px-3 text-sm focus:outline-none focus:border-stocky-primary"><option value="">{t('stockCount.chooseLocation')}</option>{locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label>
         <div className="relative"><SearchIcon size="xs" className="absolute start-3 top-1/2 -translate-y-1/2 text-stocky-text-sub pointer-events-none" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('stockCount.searchPlaceholder')} className="w-full h-10 rounded-xl border border-stocky-border-subtle ps-9 pe-3 text-sm focus:outline-none focus:border-stocky-primary" /></div>
         {locationId && rows.length > 0 && <p className="text-[11px] text-stocky-text-sub">{t('stockCount.progressSaved')}</p>}
        <div className="rounded-xl border border-stocky-border-subtle overflow-hidden">
          {visibleRows.length === 0 ? <div className="px-4 py-10 text-center text-sm text-stocky-text-sub">{t('stockCount.noProducts')}</div> : visibleRows.map((row) => { const product = productMap.get(row.productId); const variance = userRole === 'staff' || row.counted === '' ? 0 : Number(row.counted) - row.expected; return <div key={row.productId} className="px-4 py-3 border-b last:border-b-0 border-stocky-border-subtle flex flex-col gap-2"><div className="flex items-center gap-3"><div className="min-w-0 flex-1"><p className="text-sm font-medium text-stocky-text-main truncate">{product?.name || t('inventory.productName')}</p>{userRole === 'staff' ? <p className="text-[11px] text-stocky-text-sub mt-0.5">{t('stockCount.staffCountPrompt')}</p> : <p className="text-[11px] text-stocky-text-sub mt-0.5">{t('stockCount.expected', { count: row.expected, unit: product?.unitName || t('common.items') })}{variance !== 0 ? <span className={variance > 0 ? 'text-stocky-status-success-fg' : 'text-stocky-status-critical-fg'}> · {t('stockCount.differenceCount', { sign: variance > 0 ? '+' : '', diff: variance })}</span> : null}</p>}</div><input aria-label={t('stockCount.countAria', { product: product?.name || t('inventory.productName') })} type="number" min="0" step="1" value={row.counted} onChange={(event) => updateCount(row.productId, event.target.value)} className="w-24 h-9 rounded-lg border border-stocky-border-subtle px-2 text-sm text-end focus:outline-none focus:border-stocky-primary" /></div>{(variance !== 0 || userRole === 'staff') && <input aria-label={t('stockCount.reasonAria', { product: product?.name || t('inventory.productName') })} value={row.reason} onChange={(event) => updateReason(row.productId, event.target.value)} placeholder={t('stockCount.reasonPlaceholder')} className="w-full h-9 rounded-lg border border-stocky-status-warning-border bg-stocky-status-warning-bg px-3 text-xs focus:outline-none focus:border-stocky-status-warning-border" />}</div>; })}
        </div>
        {error && <p className="rounded-lg stocky-status-critical border px-3 py-2 text-xs">{error}</p>}
        {userRole === 'staff' && <p className="text-[11px] text-stocky-text-sub flex items-center gap-1"><CheckCircleIcon size="xs" /> {t('stockCount.staffNotice')}</p>}
      </form>
      <div className="p-5 border-t border-stocky-border-subtle flex gap-2"><button type="button" onClick={onClose} className="flex-1 h-10 rounded-xl border border-stocky-border-subtle text-sm cursor-pointer">{t('common.cancel')}</button><button type="submit" onClick={submit} disabled={saving} className="flex-1 h-10 rounded-xl bg-stocky-primary text-stocky-text-inverse text-sm font-medium disabled:opacity-60 cursor-pointer">{saving ? t('stockCount.submitting') : t('stockCount.submitCount')}</button></div>
    </SideDrawer>;
}
