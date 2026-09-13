'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckIcon,
  ChevronDownIcon,
  MailIcon,
  PlusIcon,
  TrashIcon,
  XIcon,
} from '@stocky/icons';
import type { Location, Product, StockLot, Supplier, SupplierContact } from '@stocky/types';

export interface ResupplyItemDetail {
  product: Product;
  lot?: StockLot | null;
  quantity: number;
  expiryDate?: string | null;
  locationName?: string;
  daysLeft?: number | null;
}

export interface SupplierResupplyModalWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  suppliers: Supplier[];
  supplierContacts?: SupplierContact[];
  products: Product[];
  lots: StockLot[];
  locations: Location[];
  selectedProductIds?: string[];
  expiringItems?: ResupplyItemDetail[];
  companyName?: string;
  userName?: string;
  userRole?: string;
  currentLocationName?: string;
  onSendRequest?: (payload: {
    supplierId?: string;
    to: string[];
    cc: string[];
    bcc: string[];
    subject: string;
    body: string;
    items: Array<{ productId: string; quantity: number; lotNumber?: string }>;
  }) => Promise<void> | void;
}

export function SupplierResupplyModalWidget({
  isOpen,
  onClose,
  suppliers = [],
  supplierContacts = [],
  products = [],
  lots = [],
  locations = [],
  selectedProductIds = [],
  expiringItems = [],
  companyName = 'Stocky Store',
  userName = 'Store Manager',
  userRole = 'Manager',
  currentLocationName = 'All Locations',
  onSendRequest,
}: SupplierResupplyModalWidgetProps) {
  const [toEmails, setToEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState('');
  const [ccEmails, setCcEmails] = useState<string[]>([]);
  const [ccInput, setCcInput] = useState('');
  const [bccEmails, setBccEmails] = useState<string[]>([]);
  const [bccInput, setBccInput] = useState('');
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  // Compute supplier email catalog
  const supplierEmailOptions = useMemo(() => {
    const list: Array<{ email: string; label: string; supplierId: string }> = [];
    suppliers.forEach((s) => {
      if (s.contactEmail) {
        list.push({
          email: s.contactEmail,
          label: `${s.name} (${s.contactEmail})`,
          supplierId: s.id,
        });
      }
    });
    supplierContacts.forEach((sc) => {
      if (sc.email) {
        const sup = suppliers.find((s) => s.id === sc.supplierId);
        const supName = sup ? sup.name : 'Supplier';
        list.push({
          email: sc.email,
          label: `${sc.name} · ${supName} (${sc.email})`,
          supplierId: sc.supplierId,
        });
      }
    });
    return list;
  }, [suppliers, supplierContacts]);

  // Determine items to include in resupply
  const itemsToResupply = useMemo<ResupplyItemDetail[]>(() => {
    if (expiringItems.length > 0) {
      return expiringItems;
    }

    const locationMap = new Map(locations.map((l) => [l.id, l.name]));

    // If specific products are selected
    if (selectedProductIds.length > 0) {
      const result: ResupplyItemDetail[] = [];
      selectedProductIds.forEach((pid) => {
        const prod = products.find((p) => p.id === pid);
        if (!prod) return;
        const productLots = lots.filter((l) => l.productId === pid && l.quantityOnHand > 0);
        if (productLots.length > 0) {
          productLots.forEach((lot) => {
            const days = lot.expiryDate
              ? Math.ceil((new Date(lot.expiryDate).getTime() - Date.now()) / 86400000)
              : null;
            result.push({
              product: prod,
              lot,
              quantity: lot.quantityOnHand,
              expiryDate: lot.expiryDate,
              locationName: locationMap.get(lot.locationId) || 'Location',
              daysLeft: days,
            });
          });
        } else {
          result.push({
            product: prod,
            lot: null,
            quantity: 0,
            expiryDate: null,
            locationName: currentLocationName,
            daysLeft: null,
          });
        }
      });
      return result;
    }

    // Default: all expiring lots (<= 14 days or expired)
    const result: ResupplyItemDetail[] = [];
    lots.forEach((lot) => {
      if (lot.quantityOnHand <= 0 || !lot.expiryDate) return;
      const days = Math.ceil((new Date(lot.expiryDate).getTime() - Date.now()) / 86400000);
      if (days <= 14) {
        const prod = products.find((p) => p.id === lot.productId);
        if (prod) {
          result.push({
            product: prod,
            lot,
            quantity: lot.quantityOnHand,
            expiryDate: lot.expiryDate,
            locationName: locationMap.get(lot.locationId) || 'Location',
            daysLeft: days,
          });
        }
      }
    });

    return result;
  }, [expiringItems, locations, selectedProductIds, products, lots, currentLocationName]);

  // Generate email body and subject template
  useEffect(() => {
    if (!isOpen) return;

    // Determine supplier if all items share one supplier
    const firstSupplierId = itemsToResupply[0]?.lot?.supplierId || itemsToResupply[0]?.product?.defaultSupplierId;
    if (firstSupplierId && !selectedSupplierId) {
      setSelectedSupplierId(firstSupplierId);
      const matched = supplierEmailOptions.find((opt) => opt.supplierId === firstSupplierId);
      if (matched && !toEmails.includes(matched.email)) {
        setToEmails([matched.email]);
      }
    }

    const supplierObj = suppliers.find((s) => s.id === selectedSupplierId);
    const supplierGreeting = supplierObj ? supplierObj.name : 'Supplier Team';

    const subjectTemplate = `[Resupply & Replacement Request] Expiring/Expired Products Pickup - ${companyName}`;
    setSubject(subjectTemplate);

    let itemsBlock = '';
    let totalUnits = 0;

    if (itemsToResupply.length > 0) {
      itemsToResupply.forEach((item, index) => {
        totalUnits += item.quantity;
        const expiryFormatted = item.expiryDate
          ? new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(item.expiryDate))
          : 'Not recorded';
        const daysText = item.daysLeft !== null && item.daysLeft !== undefined
          ? item.daysLeft < 0
            ? 'EXPIRED'
            : `${item.daysLeft} days remaining`
          : 'No date';

        itemsBlock += `${index + 1}. ${item.product.name} ${item.product.barcode ? `(Barcode: ${item.product.barcode})` : ''}\n`;
        itemsBlock += `   • Batch/Lot #: ${item.lot?.lotNumber || 'General Stock'}\n`;
        itemsBlock += `   • Quantity: ${item.quantity} ${item.product.unitName || 'units'}\n`;
        itemsBlock += `   • Expiry Date: ${expiryFormatted} [${daysText}]\n`;
        itemsBlock += `   • Location: ${item.locationName || currentLocationName}\n\n`;
      });
    } else {
      itemsBlock = '(No items currently selected or filtered)\n\n';
    }

    const bodyTemplate = `Dear ${supplierGreeting},

We are writing to request the physical pickup and replacement of the products listed below, which are approaching expiration or have expired at our facility (${currentLocationName}).

In accordance with our supplier replacement agreement, please schedule a pickup for these items and arrange for fresh replacement batches to be delivered.

--------------------------------------------------
ITEMS FOR PICKUP & REPLACEMENT:
--------------------------------------------------
${itemsBlock}--------------------------------------------------
TOTAL UNITS REQUIRING REPLACEMENT: ${totalUnits} units

Please confirm the earliest available collection date and delivery window for the replacements.

Thank you for your cooperation and prompt support.

Best regards,
${userName}
${userRole} · ${companyName}
Location: ${currentLocationName}`;

    setBody(bodyTemplate);
  }, [isOpen, selectedSupplierId, itemsToResupply, companyName, currentLocationName, userName, userRole, suppliers, supplierEmailOptions]);

  if (!isOpen) return null;

  const handleAddEmail = (type: 'to' | 'cc' | 'bcc', val: string) => {
    const trimmed = val.trim().toLowerCase();
    if (!trimmed) return;
    if (type === 'to' && !toEmails.includes(trimmed)) setToEmails([...toEmails, trimmed]);
    if (type === 'cc' && !ccEmails.includes(trimmed)) setCcEmails([...ccEmails, trimmed]);
    if (type === 'bcc' && !bccEmails.includes(trimmed)) setBccEmails([...bccEmails, trimmed]);
    if (type === 'to') setEmailInput('');
    if (type === 'cc') setCcInput('');
    if (type === 'bcc') setBccInput('');
  };

  const handleRemoveEmail = (type: 'to' | 'cc' | 'bcc', emailToRemove: string) => {
    if (type === 'to') setToEmails(toEmails.filter((e) => e !== emailToRemove));
    if (type === 'cc') setCcEmails(ccEmails.filter((e) => e !== emailToRemove));
    if (type === 'bcc') setBccEmails(bccEmails.filter((e) => e !== emailToRemove));
  };

  const handleSupplierSelect = (supId: string) => {
    setSelectedSupplierId(supId);
    if (!supId) return;
    const sup = suppliers.find((s) => s.id === supId);
    if (sup && sup.contactEmail && !toEmails.includes(sup.contactEmail)) {
      setToEmails([...toEmails, sup.contactEmail]);
    }
  };

  const handleCopy = async () => {
    try {
      const fullMessage = `To: ${toEmails.join(', ')}\nSubject: ${subject}\n\n${body}`;
      await navigator.clipboard.writeText(fullMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSend = async () => {
    if (toEmails.length === 0) {
      alert('Please add at least one recipient email in the "To" field.');
      return;
    }
    setIsSending(true);
    try {
      if (onSendRequest) {
        await onSendRequest({
          supplierId: selectedSupplierId || undefined,
          to: toEmails,
          cc: ccEmails,
          bcc: bccEmails,
          subject,
          body,
          items: itemsToResupply.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
            lotNumber: item.lot?.lotNumber || undefined,
          })),
        });
      }
      setSendSuccess(true);
      setTimeout(() => {
        setSendSuccess(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      alert(err?.message || 'Failed to submit resupply request.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-2xl max-h-[90vh] bg-white rounded-widget border border-stocky-border-subtle flex flex-col overflow-hidden animate-scale-in"
        role="dialog"
        aria-label="Resupply Email Composer"
      >
        {/* Composer Window Header (Google Style) */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-stocky-bg-global border-b border-stocky-border-subtle select-none">
          <div className="flex items-center gap-2 text-xs font-medium text-stocky-text-main">
            <MailIcon size="xs" className="text-stocky-primary" />
            <span>New Resupply & Replacement Request</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-md text-stocky-text-sub hover:bg-stocky-bg-hover hover:text-stocky-text-main transition-colors"
              aria-label="Close composer"
            >
              <XIcon size="xs" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          {/* Supplier Quick-Pick Row */}
          <div className="px-4 py-2 bg-stocky-bg-global/40 border-b border-stocky-border-subtle/70 flex items-center justify-between gap-2 text-xs">
            <span className="text-[11px] text-stocky-text-sub font-light">Target Supplier:</span>
            <select
              value={selectedSupplierId}
              onChange={(e) => handleSupplierSelect(e.target.value)}
              className="h-7 px-2 rounded-md border border-stocky-border-subtle bg-white text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none max-w-[280px]"
            >
              <option value="">Select supplier to load details...</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.contactEmail ? `(${s.contactEmail})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Recipients: To */}
          <div className="flex items-start gap-2 px-4 py-2 border-b border-stocky-border-subtle min-h-[40px] flex-wrap">
            <span className="text-xs font-medium text-stocky-text-sub w-10 pt-1">To</span>
            <div className="flex-1 flex flex-wrap items-center gap-1.5 min-w-[200px]">
              {toEmails.map((email) => (
                <span
                  key={email}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stocky-bg-global border border-stocky-border-subtle text-xs text-stocky-text-main"
                >
                  {email}
                  <button
                    type="button"
                    onClick={() => handleRemoveEmail('to', email)}
                    className="text-stocky-text-sub hover:text-red-600"
                  >
                    <XIcon size={10} />
                  </button>
                </span>
              ))}
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
                    e.preventDefault();
                    handleAddEmail('to', emailInput);
                  }
                }}
                onBlur={() => handleAddEmail('to', emailInput)}
                placeholder={toEmails.length === 0 ? 'Recipient emails (e.g. orders@supplier.com)...' : ''}
                className="flex-1 min-w-[140px] text-xs text-stocky-text-main bg-transparent outline-none placeholder:text-stocky-text-sub/50 py-1"
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-stocky-text-sub pt-1 select-none">
              {!showCc && (
                <button
                  type="button"
                  onClick={() => setShowCc(true)}
                  className="hover:text-stocky-primary transition-colors cursor-pointer"
                >
                  Cc
                </button>
              )}
              {!showBcc && (
                <button
                  type="button"
                  onClick={() => setShowBcc(true)}
                  className="hover:text-stocky-primary transition-colors cursor-pointer"
                >
                  Bcc
                </button>
              )}
            </div>
          </div>

          {/* Recipients: Cc */}
          {showCc && (
            <div className="flex items-start gap-2 px-4 py-2 border-b border-stocky-border-subtle min-h-[36px] flex-wrap bg-stocky-bg-global/20">
              <span className="text-xs font-medium text-stocky-text-sub w-10 pt-1">Cc</span>
              <div className="flex-1 flex flex-wrap items-center gap-1.5 min-w-[200px]">
                {ccEmails.map((email) => (
                  <span
                    key={email}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stocky-bg-global border border-stocky-border-subtle text-xs text-stocky-text-main"
                  >
                    {email}
                    <button
                      type="button"
                      onClick={() => handleRemoveEmail('cc', email)}
                      className="text-stocky-text-sub hover:text-red-600"
                    >
                      <XIcon size={10} />
                    </button>
                  </span>
                ))}
                <input
                  type="email"
                  value={ccInput}
                  onChange={(e) => setCcInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
                      e.preventDefault();
                      handleAddEmail('cc', ccInput);
                    }
                  }}
                  onBlur={() => handleAddEmail('cc', ccInput)}
                  placeholder="Cc recipients..."
                  className="flex-1 min-w-[140px] text-xs text-stocky-text-main bg-transparent outline-none placeholder:text-stocky-text-sub/50 py-0.5"
                />
              </div>
            </div>
          )}

          {/* Recipients: Bcc */}
          {showBcc && (
            <div className="flex items-start gap-2 px-4 py-2 border-b border-stocky-border-subtle min-h-[36px] flex-wrap bg-stocky-bg-global/20">
              <span className="text-xs font-medium text-stocky-text-sub w-10 pt-1">Bcc</span>
              <div className="flex-1 flex flex-wrap items-center gap-1.5 min-w-[200px]">
                {bccEmails.map((email) => (
                  <span
                    key={email}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stocky-bg-global border border-stocky-border-subtle text-xs text-stocky-text-main"
                  >
                    {email}
                    <button
                      type="button"
                      onClick={() => handleRemoveEmail('bcc', email)}
                      className="text-stocky-text-sub hover:text-red-600"
                    >
                      <XIcon size={10} />
                    </button>
                  </span>
                ))}
                <input
                  type="email"
                  value={bccInput}
                  onChange={(e) => setBccInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
                      e.preventDefault();
                      handleAddEmail('bcc', bccInput);
                    }
                  }}
                  onBlur={() => handleAddEmail('bcc', bccInput)}
                  placeholder="Bcc recipients..."
                  className="flex-1 min-w-[140px] text-xs text-stocky-text-main bg-transparent outline-none placeholder:text-stocky-text-sub/50 py-0.5"
                />
              </div>
            </div>
          )}

          {/* Subject Field */}
          <div className="px-4 py-2 border-b border-stocky-border-subtle">
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject..."
              className="w-full text-xs font-medium text-stocky-text-main bg-transparent outline-none placeholder:text-stocky-text-sub/50"
            />
          </div>

          {/* Email Body Editor */}
          <div className="flex-1 p-4 min-h-[260px] flex flex-col">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full flex-1 resize-none text-xs text-stocky-text-main leading-relaxed font-normal bg-transparent outline-none border-0 focus:ring-0 p-0"
              rows={14}
              aria-label="Email message body"
            />
          </div>
        </div>

        {/* Composer Footer (Google Style) */}
        <div className="flex items-center justify-between px-4 py-3 bg-stocky-bg-global/50 border-t border-stocky-border-subtle gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSend}
              disabled={isSending || sendSuccess}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-stocky-primary text-white text-xs font-medium hover:bg-stocky-primary-hover transition-colors disabled:opacity-50 cursor-pointer"
            >
              {sendSuccess ? (
                <>
                  <CheckIcon size="xs" /> Request Recorded!
                </>
              ) : isSending ? (
                'Sending…'
              ) : (
                <>
                  <MailIcon size="xs" /> Send Request
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-stocky-border-subtle bg-white text-xs font-medium text-stocky-text-main hover:bg-stocky-bg-global transition-colors cursor-pointer"
              title="Copy formatted email to clipboard to paste into Gmail, Outlook, or WhatsApp"
            >
              {copied ? (
                <>
                  <CheckIcon size="xs" className="text-emerald-600" />
                  <span className="text-emerald-600">Copied to clipboard</span>
                </>
              ) : (
                <>Copy text</>
              )}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-stocky-text-sub">
              {itemsToResupply.length} item{itemsToResupply.length === 1 ? '' : 's'} included
            </span>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-md text-stocky-text-sub hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              title="Discard draft"
            >
              <TrashIcon size="xs" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
