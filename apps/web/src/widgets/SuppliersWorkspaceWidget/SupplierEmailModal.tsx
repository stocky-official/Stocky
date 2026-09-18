'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { MailIcon, XIcon, CheckIcon } from '@stocky/icons';
import type { Location, Product, Supplier, SupplierRequest } from '@stocky/types';
import { useTranslation } from '@/lib/i18n';

export interface SupplierEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: Supplier | null;
  product?: Product | null;
  request?: SupplierRequest | null;
  location?: Location | null;
  onMarkContacted?: (request: SupplierRequest) => void;
}

export function SupplierEmailModal({
  isOpen,
  onClose,
  supplier,
  product,
  request,
  location,
  onMarkContacted,
}: SupplierEmailModalProps) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const buildBody = () => {
    const greeting = t('supplierEmail.defaultGreeting', {
      name: supplier?.contactName || supplier?.name || t('supplierEmail.externalVendor'),
    });
    const intro = t('supplierEmail.defaultIntro', {
      type: request?.requestType || 'replenishment',
    });
    const prodLine = t('supplierEmail.productLine', {
      product: product?.name || 'Stock Item',
      barcode: product?.barcode || 'N/A',
    });
    const qtyLine = t('supplierEmail.quantityLine', {
      quantity: request?.quantityRequested || 'Standard reorder',
      unit: product?.unitName || 'units',
    });
    const destLine = t('supplierEmail.destinationLine', {
      location: `${location?.name || 'Main Warehouse'} ${location?.address ? `(${location.address})` : ''}`.trim(),
    });
    const notesPart = request?.notes
      ? `\n${t('supplierEmail.notesLine', { notes: request.notes })}`
      : '';
    const closing = t('supplierEmail.defaultClosing');
    const signature = t('supplierEmail.defaultSignature');

    return `${greeting}\n\n${intro}\n\n${prodLine}\n${qtyLine}\n${destLine}${notesPart}\n\n${closing}\n\n${signature}`;
  };

  const buildSubject = () => {
    return t('supplierEmail.defaultSubject', {
      type: request?.requestType ? request.requestType.toUpperCase() : 'REPLENISH',
      product: product?.name || 'Inventory Order',
      location: location?.name || 'Store',
    });
  };

  const defaultTo = supplier?.contactEmail || '';
  const defaultSubject = buildSubject();
  const defaultBody = buildBody();

  const [to, setTo] = useState(defaultTo);
  const [cc, setCc] = useState('');
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState(defaultBody);
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setTo(supplier?.contactEmail || '');
      setCc('');
      setSubject(buildSubject());
      setBody(buildBody());
      setCopied(false);
    }
  }, [isOpen, supplier, product, request, location]);

  if (!isOpen || !mounted || typeof document === 'undefined') return null;

  const handleCopy = async () => {
    const fullText = `To: ${to}\n${cc ? `Cc: ${cc}\n` : ''}Subject: ${subject}\n\n${body}`;
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleSendMailto = (event: React.FormEvent) => {
    event.preventDefault();
    const mailtoUrl = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}${cc ? `&cc=${encodeURIComponent(cc)}` : ''}`;
    window.location.href = mailtoUrl;

    if (request && onMarkContacted && request.status === 'open') {
      onMarkContacted(request);
    }
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="email-modal-title"
    >
      <div className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-stocky-border-subtle bg-white shadow-2xl">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-stocky-border-subtle px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stocky-primary/10 text-stocky-primary">
              <MailIcon size="sm" />
            </div>
            <div className="text-start">
              <h3 id="email-modal-title" className="text-sm font-semibold text-stocky-text-main">
                {t('supplierEmail.title')}
              </h3>
              <p className="text-[11px] text-stocky-text-sub">
                {t('supplierEmail.subtitle', { name: supplier?.name || t('supplierEmail.externalVendor') })}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('supplierEmail.closeAria')}
            className="flex h-8 w-8 items-center justify-center rounded-full text-stocky-text-sub hover:bg-stocky-bg-global hover:text-stocky-text-main transition-colors cursor-pointer"
          >
            <XIcon size="xs" />
          </button>
        </header>

        {/* Content */}
        <form onSubmit={handleSendMailto} className="flex min-h-0 flex-1 flex-col text-start">
          <div className="overflow-y-auto p-5 space-y-3">
            {/* Recipient info banner */}
            {!to && (
              <div className="rounded-xl border border-stocky-status-warning-border bg-stocky-status-warning-bg p-3 text-xs text-stocky-status-warning-fg">
                {t('supplierEmail.noEmailBanner')}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-stocky-text-main">{t('supplierEmail.to')}</label>
              <input
                required
                type="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="supplier@company.com"
                className="mt-1 h-9 w-full rounded-xl border border-stocky-border-subtle bg-stocky-bg-widget px-3 text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stocky-text-main">
                {t('supplierEmail.cc')} <span className="text-stocky-text-sub font-normal">({t('common.optional')})</span>
              </label>
              <input
                type="text"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                placeholder="orders@internal.com"
                className="mt-1 h-9 w-full rounded-xl border border-stocky-border-subtle bg-stocky-bg-widget px-3 text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stocky-text-main">{t('supplierEmail.subject')}</label>
              <input
                required
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="mt-1 h-9 w-full rounded-xl border border-stocky-border-subtle bg-stocky-bg-widget px-3 text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stocky-text-main">{t('supplierEmail.messageBody')}</label>
              <textarea
                required
                rows={8}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="mt-1 w-full resize-none rounded-xl border border-stocky-border-subtle bg-stocky-bg-widget p-3 text-xs leading-5 text-stocky-text-main focus:border-stocky-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-stocky-border-subtle bg-stocky-bg-global/30 px-5 py-3.5">
            <button
              type="button"
              onClick={handleCopy}
              className="flex h-9 items-center gap-1.5 rounded-full border border-stocky-border-subtle bg-white px-3.5 text-xs font-medium text-stocky-text-main hover:bg-stocky-bg-global transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <CheckIcon size="xs" className="text-stocky-status-success-fg" />
                  <span className="text-stocky-status-success-fg font-semibold">{t('supplierEmail.copiedToClipboard')}</span>
                </>
              ) : (
                <span>{t('supplierEmail.copyFullEmail')}</span>
              )}
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="h-9 rounded-full border border-stocky-border-subtle bg-white px-4 text-xs font-medium text-stocky-text-main hover:bg-stocky-bg-global transition-colors cursor-pointer"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                className="flex h-9 items-center gap-1.5 rounded-full bg-stocky-primary px-4 text-xs font-medium text-white hover:bg-stocky-primary-hover shadow-sm transition-colors cursor-pointer"
              >
                <MailIcon size="xs" />
                <span>{t('supplierEmail.openMailClient')}</span>
              </button>
            </div>
          </footer>
        </form>
      </div>
    </div>,
    document.body
  );
}
