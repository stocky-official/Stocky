'use client';

import React, { useEffect, useState } from 'react';
import { BoxesIcon, XIcon } from '@stocky/icons';
import type { Location, Product, StockLot, Supplier } from '@stocky/types';
import { SideDrawer } from '@/components/ui/SideDrawer';
import { useTranslation } from '@/lib/i18n';

export interface StockLotUpdateInput {
  lotNumber: string;
  receivedDate: string;
  expiryDate: string;
  expiryNotificationDays: number | null;
  supplierId: string;
  unitCost: number;
  notes: string;
}

export interface StockLotEditDrawerWidgetProps {
  isOpen: boolean;
  lot: StockLot | null;
  product: Product | null;
  location: Location | null;
  suppliers: Supplier[];
  onClose: () => void;
  onSave: (lot: StockLot, input: StockLotUpdateInput) => Promise<void>;
}

export function StockLotEditDrawerWidget({ isOpen, lot, product, location, suppliers, onClose, onSave }: StockLotEditDrawerWidgetProps) {
  const { t } = useTranslation();
  const [lotNumber, setLotNumber] = useState('');
  const [receivedDate, setReceivedDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [expiryUnknown, setExpiryUnknown] = useState(false);
  const [notificationDays, setNotificationDays] = useState('30');
  const [supplierId, setSupplierId] = useState('');
  const [unitCost, setUnitCost] = useState('0');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !lot) return;
    setLotNumber(lot.lotNumber || '');
    setReceivedDate(lot.receivedAt ? lot.receivedAt.slice(0, 10) : '');
    setExpiryDate(lot.expiryDate ? lot.expiryDate.slice(0, 10) : '');
    setExpiryUnknown(!lot.expiryDate);
    setNotificationDays(lot.expiryNotificationDays == null ? '30' : String(lot.expiryNotificationDays));
    setSupplierId(lot.supplierId || '');
    setUnitCost(String(lot.unitCost ?? 0));
    setNotes(lot.notes || '');
    setError(null);
  }, [isOpen, lot?.id]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!lot) return;
    const parsedNotificationDays = notificationDays.trim() === '' ? null : Number(notificationDays);
    const parsedUnitCost = Number(unitCost);
    if (!supplierId) return setError(t('drawers.stockLotEdit.errors.chooseSupplier'));
    if (!receivedDate) return setError(t('drawers.stockLotEdit.errors.addReceivedDate'));
    if (!expiryDate && !expiryUnknown) return setError(t('drawers.stockLotEdit.errors.addExpiryDate'));
    if (expiryDate && (parsedNotificationDays === null || !Number.isInteger(parsedNotificationDays) || parsedNotificationDays < 0)) return setError(t('drawers.stockLotEdit.errors.validNotificationWindow'));
    if (!Number.isFinite(parsedUnitCost) || parsedUnitCost < 0) return setError(t('drawers.stockLotEdit.errors.costZero'));

    setSaving(true);
    setError(null);
    try {
      await onSave(lot, {
        lotNumber: lotNumber.trim(),
        receivedDate,
        expiryDate: expiryUnknown ? '' : expiryDate,
        expiryNotificationDays: expiryUnknown ? null : parsedNotificationDays,
        supplierId,
        unitCost: parsedUnitCost,
        notes: notes.trim(),
      });
      onClose();
    } catch (saveError: any) {
      setError(saveError?.message || t('drawers.stockLotEdit.errors.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SideDrawer isOpen={isOpen} onClose={onClose} ariaLabel={t('drawers.stockLotEdit.title')}>
      <div className="stocky-receive-header">
        <div className="stocky-lot-edit-heading">
          <span className="stocky-lot-edit-icon"><BoxesIcon size="xs" /></span>
          <div>
            <h2 className="stocky-receive-title">{t('drawers.stockLotEdit.title')}</h2>
            <p className="stocky-receive-subtitle">{t('drawers.stockLotEdit.subtitle')}</p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="stocky-receive-close" aria-label={t('common.close')}><XIcon size="xs" /></button>
      </div>

      <form onSubmit={handleSubmit} className="stocky-receive-form">
        <section className="stocky-receive-section">
          <div className="stocky-receive-section-heading"><span className="stocky-receive-section-number">1</span><div><h3>{t('drawers.stockLotEdit.section1Heading')}</h3><p>{t('drawers.stockLotEdit.section1Desc')}</p></div></div>
          <div className="stocky-receive-grid stocky-receive-grid--two">
            <div className="stocky-lot-edit-readonly"><span>{t('drawers.stockLotEdit.product')}</span><strong>{product?.name || t('drawers.stockLotEdit.product')}</strong><small>{product?.barcode || t('drawers.receiveStock.noBarcode')}</small></div>
            <div className="stocky-lot-edit-readonly"><span>{t('drawers.stockLotEdit.location')}</span><strong>{location?.name || t('drawers.stockLotEdit.location')}</strong><small>{location?.type === 'warehouse' ? t('drawers.receiveStock.warehouse') : t('drawers.receiveStock.branch')}</small></div>
            <div className="stocky-lot-edit-readonly"><span>{t('drawers.stockLotEdit.currentQuantity')}</span><strong>{lot?.quantityOnHand.toLocaleString() || '0'} {lot?.quantityOnHand === 1 ? t('drawers.stockLotEdit.unit') : t('drawers.stockLotEdit.units')}</strong><small>{t('drawers.stockLotEdit.auditHint')}</small></div>
            <label className="stocky-receive-label">{t('drawers.stockLotEdit.lotNumber')}<input value={lotNumber} onChange={(event) => setLotNumber(event.target.value)} placeholder={t('drawers.stockLotEdit.lotPlaceholder')} className="stocky-receive-field stocky-receive-field--plain" /></label>
          </div>
        </section>

        <section className="stocky-receive-section">
          <div className="stocky-receive-section-heading"><span className="stocky-receive-section-number">2</span><div><h3>{t('drawers.stockLotEdit.section2Heading')}</h3><p>{t('drawers.stockLotEdit.section2Desc')}</p></div></div>
          <div className="stocky-receive-grid stocky-receive-grid--three">
            <label className="stocky-receive-label">{t('drawers.stockLotEdit.receivedDate')} <span aria-hidden="true" className="stocky-receive-required">*</span><input required type="date" value={receivedDate} onChange={(event) => setReceivedDate(event.target.value)} className="stocky-receive-field stocky-receive-field--plain" /></label>
            <label className="stocky-receive-label">{t('drawers.stockLotEdit.expiryDate')} {!expiryUnknown ? <span aria-hidden="true" className="stocky-receive-required">*</span> : null}<input required={!expiryUnknown} type="date" value={expiryDate} onChange={(event) => setExpiryDate(event.target.value)} disabled={expiryUnknown} className="stocky-receive-field stocky-receive-field--plain" /></label>
            <label className="stocky-receive-label">{t('drawers.stockLotEdit.notificationDays')}<input type="number" min="0" step="1" value={notificationDays} onChange={(event) => setNotificationDays(event.target.value)} disabled={expiryUnknown} className="stocky-receive-field stocky-receive-field--plain" /></label>
          </div>
          <label className="stocky-receive-label stocky-lot-edit-supplier">{t('drawers.stockLotEdit.supplier')} <span aria-hidden="true" className="stocky-receive-required">*</span><select required value={supplierId} onChange={(event) => setSupplierId(event.target.value)} className="stocky-receive-field stocky-receive-field--plain"><option value="">{t('drawers.stockLotEdit.chooseSupplier')}</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select></label>
          <label className="stocky-receive-checkbox"><input type="checkbox" checked={expiryUnknown} onChange={(event) => { setExpiryUnknown(event.target.checked); if (event.target.checked) { setExpiryDate(''); setNotificationDays(''); } else if (!notificationDays) setNotificationDays('30'); }} /> <span>{t('drawers.stockLotEdit.noExpiry')}</span></label>
        </section>

        <section className="stocky-receive-section">
          <div className="stocky-receive-grid stocky-receive-grid--two">
            <label className="stocky-receive-label">{t('drawers.stockLotEdit.unitCost')}<input type="number" min="0" step="0.01" value={unitCost} onChange={(event) => setUnitCost(event.target.value)} placeholder="0.00" className="stocky-receive-field stocky-receive-field--plain" /></label>
            <label className="stocky-receive-label">{t('drawers.stockLotEdit.notes')}<textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder={t('drawers.stockLotEdit.notesPlaceholder')} rows={2} className="stocky-receive-field stocky-lot-edit-notes" /></label>
          </div>
        </section>

        {error ? <p className="stocky-receive-error" role="alert">{error}</p> : null}
      </form>

      <div className="stocky-receive-footer">
        <button type="button" onClick={onClose} className="stocky-receive-secondary-action">{t('drawers.stockLotEdit.cancel')}</button>
        <button type="submit" onClick={handleSubmit} disabled={saving || !lot} className="stocky-receive-primary-action">{saving ? t('drawers.stockLotEdit.saving') : t('drawers.stockLotEdit.save')}</button>
      </div>
    </SideDrawer>
  );
}
