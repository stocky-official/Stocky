'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { EditIcon, MailIcon, MessageCircleIcon, PlusIcon, SearchIcon, TrashIcon, XIcon } from '@stocky/icons';
import type { Product, Supplier, SupplierContact, SupplierProduct } from '@stocky/types';
import { SideDrawer } from '@/components/ui/SideDrawer';

export interface SupplierContactInput {
  supplierId: string;
  name: string;
  role?: string;
  phone: string;
  email?: string;
  isPrimary: boolean;
}

export interface SupplierContactsDrawerWidgetProps {
  supplier: Supplier | null;
  contacts: SupplierContact[];
  products: Product[];
  supplierProducts: SupplierProduct[];
  canManage: boolean;
  onClose: () => void;
  onCreate: (input: SupplierContactInput) => Promise<void>;
  onUpdate: (contact: SupplierContact, input: SupplierContactInput) => Promise<void>;
  onDelete: (contact: SupplierContact) => Promise<void>;
  onSetPrimary: (contact: SupplierContact) => Promise<void>;
  onLinkProduct: (input: { supplierId: string; productId: string; supplierSku?: string; unitCost?: number }) => Promise<void>;
  onUnlinkProduct: (supplierProductId: string) => Promise<void>;
}

const phoneCountries = [
  { code: '+20', country: 'Egypt', flag: '🇪🇬', label: '🇪🇬 Egypt (+20)' },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦', label: '🇸🇦 Saudi Arabia (+966)' },
  { code: '+971', country: 'United Arab Emirates', flag: '🇦🇪', label: '🇦🇪 UAE (+971)' },
  { code: '+1', country: 'United States / Canada', flag: '🇺🇸', label: '🇺🇸 USA (+1)' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧', label: '🇬🇧 UK (+44)' },
  { code: '+974', country: 'Qatar', flag: '🇶🇦', label: '🇶🇦 Qatar (+974)' },
  { code: '+965', country: 'Kuwait', flag: '🇰🇼', label: '🇰🇼 Kuwait (+965)' },
  { code: '+973', country: 'Bahrain', flag: '🇧🇭', label: '🇧🇭 Bahrain (+973)' },
  { code: '+968', country: 'Oman', flag: '🇴🇲', label: '🇴🇲 Oman (+968)' },
  { code: '+212', country: 'Morocco', flag: '🇲🇦', label: '🇲🇦 Morocco (+212)' },
  { code: '+213', country: 'Algeria', flag: '🇩🇿', label: '🇩🇿 Algeria (+213)' },
  { code: '+216', country: 'Tunisia', flag: '🇹🇳', label: '🇹🇳 Tunisia (+216)' },
  { code: '+249', country: 'Sudan', flag: '🇸🇩', label: '🇸🇩 Sudan (+249)' },
  { code: '+91', country: 'India', flag: '🇮🇳', label: '🇮🇳 India (+91)' },
  { code: '+86', country: 'China', flag: '🇨🇳', label: '🇨🇳 China (+86)' },
  { code: '+33', country: 'France', flag: '🇫🇷', label: '🇫🇷 France (+33)' },
  { code: '+49', country: 'Germany', flag: '🇩🇪', label: '🇩🇪 Germany (+49)' },
  { code: '+81', country: 'Japan', flag: '🇯🇵', label: '🇯🇵 Japan (+81)' },
  { code: '+61', country: 'Australia', flag: '🇦🇺', label: '🇦🇺 Australia (+61)' },
  { code: '+55', country: 'Brazil', flag: '🇧🇷', label: '🇧🇷 Brazil (+55)' },
  { code: '+27', country: 'South Africa', flag: '🇿🇦', label: '🇿🇦 South Africa (+27)' },
] as const;

function splitPhone(phone: string) {
  const match = phone.trim().match(/^(\+\d{1,3})\s*(.*)$/);
  return { countryCode: match?.[1] || '+20', number: match?.[2] || phone.trim() };
}

export function SupplierContactsDrawerWidget({ supplier, contacts, products, supplierProducts, canManage, onClose, onCreate, onUpdate, onDelete, onSetPrimary, onLinkProduct, onUnlinkProduct }: SupplierContactsDrawerWidgetProps) {
  const [activeTab, setActiveTab] = useState<'contacts' | 'products'>('contacts');
  const [editingContact, setEditingContact] = useState<SupplierContact | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [countryCode, setCountryCode] = useState('+20');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [productQuery, setProductQuery] = useState('');
  const [productMenuOpen, setProductMenuOpen] = useState(false);
  const [pendingProductIds, setPendingProductIds] = useState<string[]>([]);
  const [pendingProductLinkIds, setPendingProductLinkIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [emailContact, setEmailContact] = useState<SupplierContact | null>(null);
  const [emailCc, setEmailCc] = useState('');
  const [emailBcc, setEmailBcc] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const contactCountLabel = `${contacts.length} contact${contacts.length === 1 ? '' : 's'}`;
  const primaryContact = useMemo(() => contacts.find((contact) => contact.isPrimary), [contacts]);
  const linkedSupplierProducts = useMemo(() => supplierProducts.filter((link) => link.supplierId === supplier?.id), [supplier?.id, supplierProducts]);
  const productMap = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const linkedProductIds = useMemo(() => new Set([...linkedSupplierProducts.map((link) => link.productId), ...pendingProductIds]), [linkedSupplierProducts, pendingProductIds]);
  const matchingProducts = useMemo(() => {
    const normalizedQuery = productQuery.trim().toLowerCase();
    return products
      .filter((product) => !linkedProductIds.has(product.id))
      .filter((product) => !normalizedQuery || `${product.name} ${product.barcode || ''} ${product.categoryName}`.toLowerCase().includes(normalizedQuery))
      .slice(0, 12);
  }, [linkedProductIds, productQuery, products]);

  useEffect(() => {
    setActiveTab('contacts');
    setEditingContact(null);
    setShowForm(false);
    setProductQuery('');
    setProductMenuOpen(false);
    setPendingProductIds([]);
    setPendingProductLinkIds([]);
    setError(null);
    setConfirmDeleteId(null);
    setEmailContact(null);
    setEmailCc('');
    setEmailBcc('');
    setEmailSubject('');
    setEmailBody('');
  }, [supplier?.id]);

  useEffect(() => {
    setPendingProductIds((current) => current.filter((productId) => !linkedSupplierProducts.some((link) => link.productId === productId)));
  }, [linkedSupplierProducts]);

  const resetForm = () => {
    setEditingContact(null);
    setShowForm(false);
    setName('');
    setRole('');
    setCountryCode('+20');
    setPhoneNumber('');
    setEmail('');
    setIsPrimary(false);
    setError(null);
  };

  const startCreate = () => {
    resetForm();
    setActiveTab('contacts');
    setShowForm(true);
  };

  const startEdit = (contact: SupplierContact) => {
    const parsedPhone = splitPhone(contact.phone);
    setEditingContact(contact);
    setShowForm(true);
    setName(contact.name);
    setRole(contact.role || '');
    setCountryCode(parsedPhone.countryCode);
    setPhoneNumber(parsedPhone.number);
    setEmail(contact.email || '');
    setIsPrimary(contact.isPrimary);
    setError(null);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supplier || !name.trim() || !phoneNumber.trim()) {
      setError('A contact name and phone number are required.');
      return;
    }
    setSaving(true);
    setError(null);
    const input: SupplierContactInput = {
      supplierId: supplier.id,
      name: name.trim(),
      role: role.trim() || undefined,
      phone: `${countryCode} ${phoneNumber.trim()}`,
      email: email.trim() || undefined,
      isPrimary,
    };
    try {
      if (editingContact) await onUpdate(editingContact, input);
      else await onCreate(input);
      resetForm();
    } catch (saveError: any) {
      setError(saveError?.message || 'The contact could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (contact: SupplierContact) => {
    if (confirmDeleteId !== contact.id) {
      setConfirmDeleteId(contact.id);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onDelete(contact);
      setConfirmDeleteId(null);
    } catch (deleteError: any) {
      setError(deleteError?.message || 'The contact could not be deleted.');
    } finally {
      setSaving(false);
    }
  };

  const addProduct = async (product: Product) => {
    if (!supplier || !canManage || linkedProductIds.has(product.id) || pendingProductLinkIds.includes(product.id)) return;
    setPendingProductIds((current) => [...current, product.id]);
    setPendingProductLinkIds((current) => [...current, product.id]);
    setError(null);
    try {
      await onLinkProduct({ supplierId: supplier.id, productId: product.id });
      setProductQuery('');
    } catch (linkError: any) {
      setPendingProductIds((current) => current.filter((id) => id !== product.id));
      setError(linkError?.message || 'The product could not be added.');
    } finally {
      setPendingProductLinkIds((current) => current.filter((id) => id !== product.id));
    }
  };

  const removeProduct = async (link: SupplierProduct) => {
    if (!canManage || pendingProductLinkIds.includes(link.id)) return;
    setPendingProductLinkIds((current) => [...current, link.id]);
    setError(null);
    try {
      await onUnlinkProduct(link.id);
      setPendingProductIds((current) => current.filter((id) => id !== link.productId));
    } catch (unlinkError: any) {
      setError(unlinkError?.message || 'The product could not be removed.');
    } finally {
      setPendingProductLinkIds((current) => current.filter((id) => id !== link.id));
    }
  };

  const openEmailDraft = (contact: SupplierContact) => {
    if (!contact.email) return;
    setEmailContact(contact);
    setEmailCc('');
    setEmailBcc('');
    setEmailSubject(`Regarding ${supplier?.name || 'your company'}`);
    setEmailBody(`Hi ${contact.name},\n\n`);
  };

  const openWhatsApp = (contact: SupplierContact) => {
    const phone = contact.phone.replace(/[^\d]/g, '');
    if (!phone) return;
    window.open(`https://wa.me/${phone}`, '_blank', 'noopener,noreferrer');
  };

  const closeEmailDraft = () => {
    setEmailContact(null);
    setEmailCc('');
    setEmailBcc('');
    setEmailSubject('');
    setEmailBody('');
  };

  const sendEmailDraft = () => {
    if (!emailContact?.email) return;
    const params = new URLSearchParams({ subject: emailSubject, body: emailBody });
    if (emailCc.trim()) params.set('cc', emailCc.trim());
    if (emailBcc.trim()) params.set('bcc', emailBcc.trim());
    window.location.href = `mailto:${encodeURIComponent(emailContact.email)}?${params.toString()}`;
  };

  const lastSupplierRef = useRef(supplier);
  if (supplier) lastSupplierRef.current = supplier;
  const activeSupplier = supplier || lastSupplierRef.current;

  return (
    <SideDrawer isOpen={Boolean(supplier)} onClose={onClose} ariaLabel={activeSupplier ? `${activeSupplier.name} details` : 'Supplier details'} panelClassName="stocky-supplier-contacts-drawer">
      {activeSupplier && <>
        <header className="border-b border-stocky-border-subtle bg-white px-5 py-4 sm:px-6 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              {/* Rounded square supplier profile image / monogram avatar */}
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-stocky-border-subtle bg-stocky-bg-global text-stocky-text-sub select-none font-medium">
                {activeSupplier.imageUrl ? (
                  <img
                    src={activeSupplier.imageUrl}
                    alt={activeSupplier.name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <span className="text-sm font-semibold tracking-tight text-stocky-text-main">
                    {activeSupplier.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>

              {/* Supplier Name & Info */}
              <div className="min-w-0">
                <h2
                  className="truncate text-base font-semibold text-stocky-text-main tracking-tight leading-snug"
                  title={activeSupplier.name}
                >
                  {activeSupplier.name}
                </h2>
                <p className="mt-0.5 text-xs text-stocky-text-sub truncate">
                  {activeTab === 'contacts'
                    ? `${contactCountLabel}${primaryContact ? ` · Primary: ${primaryContact.name}` : ''}`
                    : `${linkedSupplierProducts.length + pendingProductIds.length} supplied product${
                        linkedSupplierProducts.length + pendingProductIds.length === 1 ? '' : 's'
                      }`}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close supplier details"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-stocky-text-sub hover:bg-stocky-bg-global hover:text-stocky-text-main transition-colors cursor-pointer"
            >
              <XIcon size="xs" />
            </button>
          </div>
        </header>

        <div className="flex border-b border-stocky-border-subtle px-5 sm:px-7" role="tablist" aria-label="Supplier details">
          <button type="button" role="tab" aria-selected={activeTab === 'contacts'} onClick={() => { setActiveTab('contacts'); setError(null); }} className={`border-b-2 px-1 py-3 text-xs font-medium ${activeTab === 'contacts' ? 'border-stocky-primary text-stocky-primary' : 'border-transparent text-stocky-text-sub hover:text-stocky-text-main'}`}>Contact people <span className="ml-1 text-[10px]">{contacts.length}</span></button>
          <button type="button" role="tab" aria-selected={activeTab === 'products'} onClick={() => { setActiveTab('products'); setShowForm(false); setError(null); }} className={`ml-5 border-b-2 px-1 py-3 text-xs font-medium ${activeTab === 'products' ? 'border-stocky-primary text-stocky-primary' : 'border-transparent text-stocky-text-sub hover:text-stocky-text-main'}`}>Products <span className="ml-1 text-[10px]">{linkedSupplierProducts.length + pendingProductIds.length}</span></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-7">
          {activeTab === 'contacts' ? <>
            {canManage && <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-xs text-stocky-text-sub">Keep more than one person available for receiving and replenishment.</p>
              <button type="button" onClick={startCreate} className="h-8 shrink-0 rounded-full border border-stocky-border-subtle bg-white px-3 text-[11px] font-medium text-stocky-text-main cursor-pointer"><PlusIcon size="xs" className="mr-1 inline" />Add contact</button>
            </div>}

            {showForm && canManage && <form onSubmit={save} className="mb-5 grid gap-3 rounded-xl border border-stocky-border-subtle bg-stocky-bg-global/40 p-3">
              <div className="flex items-center justify-between"><p className="text-xs font-medium text-stocky-text-main">{editingContact ? 'Edit contact' : 'New contact'}</p><button type="button" onClick={resetForm} className="text-stocky-text-sub cursor-pointer" aria-label="Close contact form"><XIcon size="xs" /></button></div>
              <label className="text-[11px] font-medium text-stocky-text-main">Name<input required autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="Contact name" className="mt-1 h-9 w-full rounded-lg border border-stocky-border-subtle bg-white px-2.5 text-xs font-normal focus:border-stocky-primary focus:outline-none" /></label>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-[11px] font-medium text-stocky-text-main">Role<input value={role} onChange={(event) => setRole(event.target.value)} placeholder="e.g. Sales" className="mt-1 h-9 w-full rounded-lg border border-stocky-border-subtle bg-white px-2.5 text-xs font-normal focus:border-stocky-primary focus:outline-none" /></label>
                <label className="text-[11px] font-medium text-stocky-text-main">Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@supplier.com" className="mt-1 h-9 w-full rounded-lg border border-stocky-border-subtle bg-white px-2.5 text-xs font-normal focus:border-stocky-primary focus:outline-none" /></label>
              </div>
              <label className="text-[11px] font-medium text-stocky-text-main">Phone<div className="mt-1 flex gap-1"><select value={countryCode} onChange={(event) => setCountryCode(event.target.value)} aria-label="Country calling code" className="h-9 w-32 sm:w-40 shrink-0 rounded-lg border border-stocky-border-subtle bg-white px-2 text-[11px] font-normal focus:border-stocky-primary focus:outline-none">{phoneCountries.map((country) => <option key={country.code} value={country.code}>{country.label}</option>)}</select><input required type="tel" inputMode="tel" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} placeholder="Phone number" className="h-9 min-w-0 flex-1 rounded-lg border border-stocky-border-subtle bg-white px-2.5 text-xs font-normal focus:border-stocky-primary focus:outline-none" /></div></label>
              <label className="flex items-center gap-2 text-[11px] font-normal text-stocky-text-main"><input type="checkbox" checked={isPrimary} onChange={(event) => setIsPrimary(event.target.checked)} className="h-3.5 w-3.5 accent-stocky-primary" />Use as primary contact</label>
              {error && <p className="rounded-lg border border-stocky-status-danger-border bg-stocky-status-danger-bg px-2.5 py-2 text-[11px] text-stocky-status-danger-fg">{error}</p>}
              <div className="flex justify-end gap-2"><button type="button" onClick={resetForm} disabled={saving} className="h-8 rounded-full border border-stocky-border-subtle bg-white px-3 text-[11px] cursor-pointer disabled:opacity-50">Cancel</button><button type="submit" disabled={saving} className="h-8 rounded-full bg-stocky-primary px-3 text-[11px] font-medium text-white cursor-pointer disabled:opacity-50">{saving ? 'Saving…' : editingContact ? 'Save changes' : 'Add contact'}</button></div>
            </form>}

            {error && !showForm && <p className="mb-4 rounded-lg border border-stocky-status-danger-border bg-stocky-status-danger-bg px-2.5 py-2 text-[11px] text-stocky-status-danger-fg">{error}</p>}
            {contacts.length === 0 ? <div className="rounded-xl border border-dashed border-stocky-border-subtle px-5 py-12 text-center"><p className="text-sm font-medium text-stocky-text-main">No contacts yet</p><p className="mt-1 text-xs text-stocky-text-sub">Add a contact when another person handles this supplier.</p></div> : <div className="overflow-hidden rounded-xl border border-stocky-border-subtle"><div className="divide-y divide-stocky-border-subtle">{contacts.map((contact) => <article key={contact.id} className="p-3.5">
              <div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="truncate text-xs font-medium text-stocky-text-main">{contact.name}</p>{contact.isPrimary && <span className="rounded-full border border-stocky-status-success-border bg-stocky-status-success-bg px-2 py-0.5 text-[10px] font-medium text-stocky-status-success-fg">Primary</span>}</div><p className="mt-1 text-[11px] text-stocky-text-sub">{contact.role || 'Contact person'}</p></div><div className="flex shrink-0 items-center gap-1">{contact.email && <button type="button" onClick={() => openEmailDraft(contact)} aria-label={`Email ${contact.name}`} title="Draft email" className="stocky-icon-button stocky-icon-button--small"><MailIcon size="xs" /></button>}{contact.phone && <button type="button" onClick={() => openWhatsApp(contact)} aria-label={`Message ${contact.name} on WhatsApp`} title="Open WhatsApp" className="stocky-icon-button stocky-icon-button--small"><MessageCircleIcon size="xs" /></button>}{canManage && <>{!contact.isPrimary && <button type="button" onClick={() => void onSetPrimary(contact)} className="h-7 rounded-full border border-stocky-border-subtle px-2 text-[10px] text-stocky-text-sub cursor-pointer">Set primary</button>}<button type="button" onClick={() => startEdit(contact)} aria-label={`Edit ${contact.name}`} className="stocky-icon-button stocky-icon-button--small"><EditIcon size="xs" /></button>{confirmDeleteId === contact.id ? <button type="button" onClick={() => void remove(contact)} disabled={saving} className="h-7 rounded-full bg-stocky-status-danger-fg px-2 text-[10px] font-medium text-white cursor-pointer disabled:opacity-50">Sure?</button> : <button type="button" onClick={() => void remove(contact)} aria-label={`Delete ${contact.name}`} className="stocky-icon-button stocky-icon-button--small stocky-icon-button--danger"><TrashIcon size="xs" /></button>}</>}</div></div>
              <div className="mt-3 grid grid-cols-1 gap-2 text-[11px] text-stocky-text-sub sm:grid-cols-2"><a href={`tel:${contact.phone}`} className="truncate hover:text-stocky-primary">{contact.phone}</a>{contact.email ? <a href={`mailto:${contact.email}`} className="truncate hover:text-stocky-primary">{contact.email}</a> : <span>Not recorded</span>}</div>
            </article>)}</div></div>}
          </> : <>
            <div className="mb-4">
              <p className="text-xs text-stocky-text-sub">Search the catalogue and select every product this supplier provides.</p>
              {canManage && <div className="relative mt-3">
                <div className="flex h-10 items-center gap-2 rounded-lg border border-stocky-border-subtle bg-white px-3 focus-within:border-stocky-primary">
                  <SearchIcon size="xs" className="shrink-0 text-stocky-text-sub" />
                  <input value={productQuery} onFocus={() => setProductMenuOpen(true)} onChange={(event) => { setProductQuery(event.target.value); setProductMenuOpen(true); }} placeholder="Search products or barcodes..." aria-label="Search supplier products" className="min-w-0 flex-1 bg-transparent text-xs font-normal text-stocky-text-main outline-none placeholder:text-stocky-text-sub/70" />
                  {productQuery && <button type="button" onClick={() => setProductQuery('')} aria-label="Clear product search" className="text-stocky-text-sub hover:text-stocky-text-main"><XIcon size="xs" /></button>}
                </div>
                {productMenuOpen && <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-y-auto rounded-lg border border-stocky-border-subtle bg-white py-1 shadow-lg">
                  {matchingProducts.length === 0 ? <p className="px-3 py-3 text-[11px] text-stocky-text-sub">{productQuery ? 'No unassigned products found.' : 'All available products are already assigned.'}</p> : matchingProducts.map((product) => <button key={product.id} type="button" onClick={() => void addProduct(product)} disabled={pendingProductLinkIds.includes(product.id)} className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-stocky-bg-global/60 disabled:opacity-50"><span className="min-w-0"><span className="block truncate text-xs font-medium text-stocky-text-main">{product.name}</span><span className="mt-0.5 block truncate text-[10px] text-stocky-text-sub">{product.barcode || 'No barcode'} · {product.categoryName}</span></span><span className="shrink-0 text-[10px] text-stocky-primary">{pendingProductLinkIds.includes(product.id) ? 'Adding…' : 'Add'}</span></button>)}
                </div>}
              </div>}
            </div>

            {error && <p className="mb-4 rounded-lg border border-stocky-status-danger-border bg-stocky-status-danger-bg px-2.5 py-2 text-[11px] text-stocky-status-danger-fg">{error}</p>}
            {linkedSupplierProducts.length === 0 && pendingProductIds.length === 0 ? (
              <div className="rounded-xl border border-dashed border-stocky-border-subtle px-5 py-12 text-center">
                <p className="text-sm font-medium text-stocky-text-main">No products assigned</p>
                <p className="mt-1 text-xs text-stocky-text-sub">Use the search field above to link products supplied by this vendor.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {linkedSupplierProducts.map((link) => {
                  const product = productMap.get(link.productId);
                  if (!product) return null;
                  const pending = pendingProductLinkIds.includes(link.id);
                  const displayCost = link.unitCost ?? product.unitCost;
                  const sku = link.supplierSku || product.barcode || product.id.slice(0, 8).toUpperCase();

                  return (
                    <article
                      key={link.id}
                      className="group flex flex-col justify-between gap-2.5 rounded-xl border border-stocky-border-subtle bg-white p-3.5 shadow-sm transition-all hover:border-stocky-border-strong sm:flex-row sm:items-center"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-xs font-semibold text-stocky-text-main">
                            {product.name}
                          </p>
                          <span className="shrink-0 rounded-md border border-stocky-border-subtle bg-stocky-bg-global px-1.5 py-0.5 font-mono text-[10px] text-stocky-text-sub">
                            SKU: {sku}
                          </span>
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-stocky-text-sub">
                          <span className="rounded bg-stocky-bg-global/70 px-1.5 py-0.5 text-[10px] font-medium text-stocky-text-main">
                            {product.categoryName}
                          </span>
                          {product.barcode && (
                            <span className="font-mono text-[10px] text-stocky-text-sub">
                              BC: {product.barcode}
                            </span>
                          )}
                          {typeof displayCost === 'number' && (
                            <span className="font-medium text-stocky-primary text-[11px]">
                              ${displayCost.toFixed(2)} / {product.unitName || 'unit'}
                            </span>
                          )}
                        </div>
                      </div>

                      {canManage && (
                        <div className="flex shrink-0 items-center justify-end border-t border-stocky-border-subtle/50 pt-2 sm:border-t-0 sm:pt-0">
                          <button
                            type="button"
                            onClick={() => void removeProduct(link)}
                            disabled={pending}
                            aria-label={`Unlink ${product.name}`}
                            title="Unlink product"
                            className="flex h-8 items-center gap-1.5 rounded-lg border border-stocky-border-subtle px-2.5 text-xs text-stocky-status-danger-fg transition-colors hover:border-stocky-status-danger-border hover:bg-stocky-status-danger-bg cursor-pointer disabled:opacity-50"
                          >
                            <TrashIcon size="xs" />
                            <span className="text-[11px] font-medium">{pending ? 'Removing…' : 'Unlink'}</span>
                          </button>
                        </div>
                      )}
                    </article>
                  );
                })}

                {pendingProductIds
                  .filter((productId) => !linkedSupplierProducts.some((link) => link.productId === productId))
                  .map((productId) => {
                    const product = productMap.get(productId);
                    if (!product) return null;
                    return (
                      <article
                        key={productId}
                        className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-stocky-border-subtle bg-stocky-bg-global/50 p-3.5"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium text-stocky-text-main">{product.name}</p>
                          <p className="mt-0.5 text-[10px] text-stocky-text-sub">Linking product to supplier…</p>
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-stocky-primary/10 px-2 py-0.5 text-[10px] font-medium text-stocky-primary">
                          Linking…
                        </span>
                      </article>
                    );
                  })}
              </div>
            )}
          </>}
        </div>
      </>}
      {emailContact && <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/25 p-4" role="dialog" aria-modal="true" aria-label={`Email ${emailContact.name}`}>
        <form onSubmit={(event) => { event.preventDefault(); sendEmailDraft(); }} className="flex max-h-full w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-stocky-border-subtle bg-white shadow-2xl">
          <header className="flex items-center justify-between border-b border-stocky-border-subtle px-4 py-3">
            <div className="flex items-center gap-2"><MailIcon size="sm" className="text-stocky-primary" /><p className="text-sm font-medium text-stocky-text-main">New message</p></div>
            <button type="button" onClick={closeEmailDraft} aria-label="Close email draft" className="stocky-icon-button stocky-icon-button--small"><XIcon size="xs" /></button>
          </header>
          <div className="min-h-0 overflow-y-auto px-4 py-2">
            <label className="flex items-center gap-3 border-b border-stocky-border-subtle py-2 text-[11px] text-stocky-text-sub"><span className="w-8 shrink-0">To</span><input readOnly value={emailContact.email || ''} className="min-w-0 flex-1 bg-transparent text-xs text-stocky-text-main outline-none" /></label>
            <label className="flex items-center gap-3 border-b border-stocky-border-subtle py-2 text-[11px] text-stocky-text-sub"><span className="w-8 shrink-0">Cc</span><input type="email" multiple value={emailCc} onChange={(event) => setEmailCc(event.target.value)} placeholder="Add recipients" className="min-w-0 flex-1 bg-transparent text-xs text-stocky-text-main outline-none placeholder:text-stocky-text-sub/70" /></label>
            <label className="flex items-center gap-3 border-b border-stocky-border-subtle py-2 text-[11px] text-stocky-text-sub"><span className="w-8 shrink-0">Bcc</span><input type="email" multiple value={emailBcc} onChange={(event) => setEmailBcc(event.target.value)} placeholder="Add recipients" className="min-w-0 flex-1 bg-transparent text-xs text-stocky-text-main outline-none placeholder:text-stocky-text-sub/70" /></label>
            <input required value={emailSubject} onChange={(event) => setEmailSubject(event.target.value)} placeholder="Subject" className="w-full border-b border-stocky-border-subtle py-3 text-xs text-stocky-text-main outline-none placeholder:text-stocky-text-sub/70" />
            <textarea required value={emailBody} onChange={(event) => setEmailBody(event.target.value)} placeholder="Write your message" rows={9} className="w-full resize-none py-3 text-xs leading-5 text-stocky-text-main outline-none placeholder:text-stocky-text-sub/70" />
          </div>
          <footer className="flex items-center justify-between gap-3 border-t border-stocky-border-subtle px-4 py-3"><p className="text-[10px] text-stocky-text-sub">Your default email app will open with this draft.</p><div className="flex shrink-0 gap-2"><button type="button" onClick={closeEmailDraft} className="h-8 rounded-full border border-stocky-border-subtle px-3 text-[11px] text-stocky-text-main cursor-pointer">Discard</button><button type="submit" className="h-8 rounded-full bg-stocky-primary px-3 text-[11px] font-medium text-white cursor-pointer">Open email app</button></div></footer>
        </form>
      </div>}
    </SideDrawer>
  );
}
