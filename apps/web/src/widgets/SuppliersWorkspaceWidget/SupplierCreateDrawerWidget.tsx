'use client';

import React, { useState } from 'react';
import { XIcon } from '@stocky/icons';
import { SideDrawer } from '@/components/ui/SideDrawer';

export const supplierPhoneCountries = [
  { code: '+20', country: 'Egypt', flag: '🇪🇬' },
  { code: '+1', country: 'United States / Canada', flag: '🇺🇸' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
  { code: '+971', country: 'United Arab Emirates', flag: '🇦🇪' },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+974', country: 'Qatar', flag: '🇶🇦' },
  { code: '+965', country: 'Kuwait', flag: '🇰🇼' },
  { code: '+973', country: 'Bahrain', flag: '🇧🇭' },
  { code: '+968', country: 'Oman', flag: '🇴🇲' },
  { code: '+212', country: 'Morocco', flag: '🇲🇦' },
  { code: '+213', country: 'Algeria', flag: '🇩🇿' },
  { code: '+216', country: 'Tunisia', flag: '🇹🇳' },
  { code: '+249', country: 'Sudan', flag: '🇸🇩' },
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+86', country: 'China', flag: '🇨🇳' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+81', country: 'Japan', flag: '🇯🇵' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+55', country: 'Brazil', flag: '🇧🇷' },
  { code: '+27', country: 'South Africa', flag: '🇿🇦' },
] as const;

export interface SupplierCreateDrawerWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateSupplier?: (input: {
    name: string;
    address?: string;
    contactName: string;
    contactPhone: string;
    contactEmail?: string;
    imageUrl?: string;
  }) => Promise<unknown>;
}

export function SupplierCreateDrawerWidget({
  isOpen,
  onClose,
  onCreateSupplier,
}: SupplierCreateDrawerWidgetProps) {
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [address, setAddress] = useState('');
  const [contactName, setContactName] = useState('');
  const [phoneCountryCode, setPhoneCountryCode] = useState('+20');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setImageUrl('');
    setAddress('');
    setContactName('');
    setPhoneCountryCode('+20');
    setPhoneNumber('');
    setEmail('');
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const cleanPhone = phoneNumber.trim();
    if (!name.trim() || !contactName.trim() || !cleanPhone) {
      setError('Supplier name, primary contact person, and phone number are required.');
      return;
    }

    if (!onCreateSupplier) {
      setError('Create supplier capability is not configured.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await onCreateSupplier({
        name: name.trim(),
        address: address.trim() || undefined,
        contactName: contactName.trim(),
        contactPhone: `${phoneCountryCode} ${cleanPhone}`,
        contactEmail: email.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
      });
      handleClose();
    } catch (err: any) {
      setError(err?.message || 'Could not add this supplier. Please verify the information.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SideDrawer isOpen={isOpen} onClose={handleClose} ariaLabel="Add new supplier">
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stocky-border-subtle p-5 sm:p-6">
          <div>
            <h2 className="text-base font-medium text-stocky-text-main">Add supplier</h2>
            <p className="mt-0.5 text-xs text-stocky-text-sub">
              Register a new vendor and their primary contact details.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-stocky-text-sub hover:bg-stocky-bg-global hover:text-stocky-text-main transition-colors cursor-pointer"
            aria-label="Close"
          >
            <XIcon size="xs" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto p-5 sm:p-6 gap-4">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-stocky-text-main">
              Supplier / Company name <span className="text-red-500">*</span>
            </label>
            <input
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Beverage Distributors"
              className="mt-1.5 h-10 w-full rounded-xl border border-stocky-border-subtle bg-stocky-bg-widget px-3 text-xs text-stocky-text-main placeholder:text-stocky-text-sub/50 focus:border-stocky-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stocky-text-main">
              Profile image / Logo URL <span className="text-stocky-text-sub font-normal">(optional)</span>
            </label>
            <div className="mt-1.5 flex items-center gap-3">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-stocky-border-subtle bg-stocky-bg-global text-stocky-text-sub select-none font-medium">
                {imageUrl.trim() ? (
                  <img
                    src={imageUrl.trim()}
                    alt="Preview"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <span className="text-xs font-semibold tracking-tight text-stocky-text-main">
                    {(name || 'SU').slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
                className="h-10 min-w-0 flex-1 rounded-xl border border-stocky-border-subtle bg-stocky-bg-widget px-3 text-xs text-stocky-text-main placeholder:text-stocky-text-sub/50 focus:border-stocky-primary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stocky-text-main">
              Address <span className="text-stocky-text-sub font-normal">(optional)</span>
            </label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 14 Industrial Park Road, Warehouse 3B"
              className="mt-1.5 h-10 w-full rounded-xl border border-stocky-border-subtle bg-stocky-bg-widget px-3 text-xs text-stocky-text-main placeholder:text-stocky-text-sub/50 focus:border-stocky-primary focus:outline-none"
            />
          </div>

          <div className="border-t border-stocky-border-subtle pt-4">
            <h3 className="text-xs font-medium text-stocky-text-main">Primary Contact</h3>
            <p className="text-[11px] text-stocky-text-sub mt-0.5">
              The main representative for replenishments and delivery queries.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-stocky-text-main">
              Contact person name <span className="text-red-500">*</span>
            </label>
            <input
              required
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="e.g. Tarek Mansour"
              className="mt-1.5 h-10 w-full rounded-xl border border-stocky-border-subtle bg-stocky-bg-widget px-3 text-xs text-stocky-text-main placeholder:text-stocky-text-sub/50 focus:border-stocky-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stocky-text-main">
              Phone number <span className="text-red-500">*</span>
            </label>
            <div className="mt-1.5 flex gap-2">
              <select
                value={phoneCountryCode}
                onChange={(e) => setPhoneCountryCode(e.target.value)}
                aria-label="Country calling code"
                className="h-10 w-28 shrink-0 rounded-xl border border-stocky-border-subtle bg-stocky-bg-widget px-2 text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none"
              >
                {supplierPhoneCountries.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.flag} {country.code}
                  </option>
                ))}
              </select>
              <input
                required
                type="tel"
                inputMode="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="100 123 4567"
                className="h-10 min-w-0 flex-1 rounded-xl border border-stocky-border-subtle bg-stocky-bg-widget px-3 text-xs text-stocky-text-main placeholder:text-stocky-text-sub/50 focus:border-stocky-primary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stocky-text-main">
              Email address <span className="text-stocky-text-sub font-normal">(optional)</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="orders@supplier.com"
              className="mt-1.5 h-10 w-full rounded-xl border border-stocky-border-subtle bg-stocky-bg-widget px-3 text-xs text-stocky-text-main placeholder:text-stocky-text-sub/50 focus:border-stocky-primary focus:outline-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="mt-auto flex items-center justify-end gap-2.5 pt-5 border-t border-stocky-border-subtle">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSaving}
              className="h-10 rounded-full border border-stocky-border-subtle px-5 text-xs font-medium text-stocky-text-main hover:bg-stocky-bg-global transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="h-10 rounded-full bg-stocky-primary px-6 text-xs font-medium text-white hover:bg-stocky-primary-hover transition-colors cursor-pointer shadow-sm disabled:opacity-50"
            >
              {isSaving ? 'Saving…' : 'Save supplier'}
            </button>
          </div>
        </form>
      </div>
    </SideDrawer>
  );
}
