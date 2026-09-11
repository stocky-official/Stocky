'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangleIcon,
  BarcodeIcon,
  CalendarIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  SearchIcon,
  TruckIcon,
  XIcon,
} from '@stocky/icons';
import { supabase } from '@/lib/supabase/client';
import type { CompanyUserRole, Location, Product, StockLot, Supplier } from '@stocky/types';
import { SideDrawer } from '@/components/ui/SideDrawer';

export interface ReceiveStockDrawerWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  locations: Location[];
  suppliers: Supplier[];
  companyId: string;
  userRole: CompanyUserRole;
  defaultProductId?: string;
  defaultProductSearch?: string;
  defaultLocationId?: string;
  onSaved: (lot: StockLot) => void;
}

interface SearchOption {
  id: string;
  label: string;
  meta?: string;
}

interface ReceiveSearchSelectProps {
  label: string;
  placeholder: string;
  query: string;
  onQueryChange: (value: string) => void;
  selected: SearchOption | null;
  options: SearchOption[];
  onSelect: (option: SearchOption) => void;
  onClear: () => void;
  disabled?: boolean;
  required?: boolean;
  icon: React.ReactNode;
  emptyMessage: string;
}

function ReceiveSearchSelect({
  label,
  placeholder,
  query,
  onQueryChange,
  selected,
  options,
  onSelect,
  onClear,
  disabled = false,
  required = false,
  icon,
  emptyMessage,
}: ReceiveSearchSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutsidePointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('pointerdown', handleOutsidePointer);
    return () => document.removeEventListener('pointerdown', handleOutsidePointer);
  }, [isOpen]);

  return (
    <div ref={rootRef} className="stocky-receive-field-group">
      <label className="stocky-receive-label">
        <span>{label}{required ? <span aria-hidden="true" className="stocky-receive-required"> *</span> : null}</span>
      </label>
      <div className="stocky-receive-picker">
        <div className={`stocky-receive-field ${disabled ? 'stocky-receive-field--disabled' : ''}`}>
          <span className="stocky-receive-field__icon" aria-hidden="true">{icon}</span>
          {selected ? (
            <button
              type="button"
              className="stocky-receive-selected-value"
              onClick={() => !disabled && setIsOpen(true)}
              disabled={disabled}
              aria-label={`Change ${label.toLowerCase()}`}
            >
              <span className="stocky-receive-selected-value__label">{selected.label}</span>
              {selected.meta ? <span className="stocky-receive-selected-value__meta">{selected.meta}</span> : null}
            </button>
          ) : (
            <input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              onFocus={() => !disabled && setIsOpen(true)}
              placeholder={placeholder}
              disabled={disabled}
              aria-required={required}
              className="stocky-receive-field__input"
            />
          )}
          {selected ? (
            <button type="button" onClick={onClear} disabled={disabled} className="stocky-receive-clear" aria-label={`Clear ${label.toLowerCase()}`}>
              <XIcon size="xs" />
            </button>
          ) : (
            <ChevronDownIcon size="xs" className="stocky-receive-field__chevron" aria-hidden="true" />
          )}
        </div>
        {isOpen && !disabled ? (
          <div className="stocky-receive-picker-menu" role="listbox" aria-label={`${label} options`}>
            {options.length > 0 ? options.map((option) => (
              <button
                key={option.id}
                type="button"
                role="option"
                aria-selected={selected?.id === option.id}
                className="stocky-receive-picker-option"
                onClick={() => { onSelect(option); setIsOpen(false); }}
              >
                <span className="stocky-receive-picker-option__copy">
                  <span>{option.label}</span>
                  {option.meta ? <small>{option.meta}</small> : null}
                </span>
                {selected?.id === option.id ? <CheckCircleIcon size="xs" /> : null}
              </button>
            )) : <p className="stocky-receive-picker-empty">{emptyMessage}</p>}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function getTodayInputValue() {
  const now = new Date();
  const localNow = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return localNow.toISOString().slice(0, 10);
}

function toDateTime(value: string) {
  return value ? new Date(`${value}T12:00:00`).toISOString() : null;
}

export function ReceiveStockDrawerWidget({
  isOpen,
  onClose,
  products,
  locations,
  suppliers,
  companyId,
  userRole,
  defaultProductId,
  defaultProductSearch,
  defaultLocationId,
  onSaved,
}: ReceiveStockDrawerWidgetProps) {
  const wasOpenRef = useRef(false);
  const [productId, setProductId] = useState(defaultProductId || '');
  const [locationId, setLocationId] = useState(defaultLocationId || locations[0]?.id || '');
  const [supplierId, setSupplierId] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [supplierSearch, setSupplierSearch] = useState('');
  const [locationSearch, setLocationSearch] = useState('');
  const [quantity, setQuantity] = useState('');
  const [receivedDate, setReceivedDate] = useState(getTodayInputValue);
  const [expiryDate, setExpiryDate] = useState('');
  const [expiryUnknown, setExpiryUnknown] = useState(false);
  const [notificationDays, setNotificationDays] = useState('30');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdProduct, setCreatedProduct] = useState<Product | null>(null);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductBarcode, setNewProductBarcode] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('General');
  const [creatingProduct, setCreatingProduct] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      wasOpenRef.current = false;
      return;
    }
    if (wasOpenRef.current) return;
    wasOpenRef.current = true;
    const defaultProduct = defaultProductId
      ? products.find((product) => product.id === defaultProductId)
      : products.find((product) => product.barcode?.trim().toLowerCase() === defaultProductSearch?.trim().toLowerCase());
    const initialSupplierId = defaultProduct?.defaultSupplierId && suppliers.some((supplier) => supplier.id === defaultProduct.defaultSupplierId)
      ? defaultProduct.defaultSupplierId
      : '';

    setProductId(defaultProduct?.id || defaultProductId || '');
    setLocationId(defaultLocationId || locations[0]?.id || '');
    setSupplierId(initialSupplierId);
    setProductSearch(defaultProduct ? '' : defaultProductSearch || '');
    setSupplierSearch('');
    setLocationSearch('');
    setQuantity('');
    setReceivedDate(getTodayInputValue());
    setExpiryDate('');
    setExpiryUnknown(false);
    setNotificationDays(defaultProduct?.defaultExpiryNotificationDays == null ? '30' : String(defaultProduct.defaultExpiryNotificationDays));
    setError(null);
    setCreatedProduct(null);
    setIsCreatingProduct(false);
    setNewProductName('');
    setNewProductBarcode(defaultProductSearch || '');
    setNewProductCategory('General');
  }, [defaultLocationId, defaultProductId, defaultProductSearch, isOpen, locations, products, suppliers]);

  const selectedProduct = products.find((product) => product.id === productId) || (createdProduct?.id === productId ? createdProduct : undefined);
  const selectedSupplier = suppliers.find((supplier) => supplier.id === supplierId);
  const selectedLocation = locations.find((location) => location.id === locationId);

  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase();
    const matchingProducts = !query
      ? products
      : products.filter((product) => [product.name, product.barcode, product.categoryName].filter(Boolean).some((value) => String(value).toLowerCase().includes(query)));
    return matchingProducts.slice(0, 8).map((product) => ({
      id: product.id,
      label: product.name,
      meta: `${product.barcode || 'No barcode'} · ${product.categoryName}`,
    }));
  }, [productSearch, products]);

  const filteredSuppliers = useMemo(() => {
    const query = supplierSearch.trim().toLowerCase();
    return suppliers
      .filter((supplier) => !query || [supplier.name, supplier.contactName, supplier.contactEmail].filter(Boolean).some((value) => String(value).toLowerCase().includes(query)))
      .slice(0, 8)
      .map((supplier) => ({ id: supplier.id, label: supplier.name, meta: supplier.contactName || supplier.contactEmail || 'Supplier contact not recorded' }));
  }, [supplierSearch, suppliers]);

  const filteredLocations = useMemo(() => {
    const query = locationSearch.trim().toLowerCase();
    return locations
      .filter((location) => !query || [location.name, location.address, location.type].filter(Boolean).some((value) => String(value).toLowerCase().includes(query)))
      .slice(0, 8)
      .map((location) => ({ id: location.id, label: location.name, meta: location.type === 'warehouse' ? 'Warehouse' : 'Branch' }));
  }, [locationSearch, locations]);

  const chooseProduct = (option: SearchOption) => {
    const product = products.find((candidate) => candidate.id === option.id);
    if (!product) return;
    setProductId(product.id);
    setCreatedProduct(null);
    setProductSearch('');
    setSupplierSearch('');
    const defaultSupplier = product.defaultSupplierId && suppliers.some((supplier) => supplier.id === product.defaultSupplierId) ? product.defaultSupplierId : '';
    setSupplierId(defaultSupplier);
    setNotificationDays(product.defaultExpiryNotificationDays == null ? '30' : String(product.defaultExpiryNotificationDays));
  };

  const handleProductSearchChange = (value: string) => {
    setProductId('');
    setCreatedProduct(null);
    setProductSearch(value);
    setIsCreatingProduct(false);
    const exactProduct = products.find((product) => product.barcode?.trim().toLowerCase() === value.trim().toLowerCase());
    if (exactProduct) chooseProduct({ id: exactProduct.id, label: exactProduct.name });
  };

  const startCreatingProduct = () => {
    const barcode = productSearch.trim();
    setNewProductName('');
    setNewProductBarcode(barcode);
    setIsCreatingProduct(true);
    setError(null);
  };

  const createProduct = async () => {
    const name = newProductName.trim();
    const barcode = newProductBarcode.trim();
    if (!name) return setError('Enter a product name first.');
    if (!barcode) return setError('Add the barcode so it is saved to the product record.');
    if (!companyId) return setError('Your company could not be identified.');

    setCreatingProduct(true);
    const { data, error: createError } = await supabase.from('products').insert({
      company_id: companyId,
      name,
      barcode,
      category_name: newProductCategory.trim() || 'General',
      unit_name: 'unit',
      reorder_point: 0,
      default_expiry_notification_days: 30,
      unit_cost: 0,
      is_active: true,
    }).select('*').single();
    setCreatingProduct(false);
    if (createError || !data) return setError(createError?.message || 'Could not create the product.');

    const nextProduct: Product = {
      id: data.id,
      companyId: data.company_id,
      name: data.name,
      barcode: data.barcode,
      categoryId: data.category_id,
      categoryName: data.category_name,
      unitName: data.unit_name,
      reorderPoint: Number(data.reorder_point || 0),
      defaultExpiryNotificationDays: data.default_expiry_notification_days,
      defaultSupplierId: data.default_supplier_id,
      unitCost: Number(data.unit_cost || 0),
      isActive: Boolean(data.is_active),
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
    setCreatedProduct(nextProduct);
    setProductId(nextProduct.id);
    setProductSearch('');
    setIsCreatingProduct(false);
    setNotificationDays(nextProduct.defaultExpiryNotificationDays == null ? '30' : String(nextProduct.defaultExpiryNotificationDays));
  };

  const handleSave = async (event?: React.FormEvent | React.MouseEvent) => {
    event?.preventDefault();
    setError(null);
    const parsedQuantity = Number(quantity);
    const parsedDays = notificationDays === '' ? null : Number(notificationDays);

    if (!selectedProduct) return setError('Search for a product or scan its barcode first.');
    if (!locationId) return setError('Choose where this stock will be placed.');
    if (!supplierId) return setError('Choose the supplier for this delivery.');
    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) return setError('Quantity must be a whole number greater than zero.');
    if (!receivedDate) return setError('Add the date this stock was received.');
    if (!expiryDate && !expiryUnknown) return setError('Add a stock expiry date, or choose “No expiry date”.');
    if (expiryDate && (parsedDays === null || !Number.isInteger(parsedDays) || parsedDays < 0)) return setError('Enter a valid expiry notification window.');

    setSaving(true);
    const { data, error: saveError } = await supabase.rpc('receive_stock_with_received_at', {
      p_product_id: selectedProduct.id,
      p_location_id: locationId,
      p_quantity: parsedQuantity,
      p_lot_number: null,
      p_expiry_date: toDateTime(expiryDate),
      p_expiry_notification_days: parsedDays,
      p_supplier_id: supplierId,
      p_unit_cost: selectedProduct.unitCost || 0,
      p_notes: null,
      p_received_at: toDateTime(receivedDate),
    });
    setSaving(false);
    if (saveError) return setError(saveError.message || 'Could not add this stock.');
    if (data) onSaved(Array.isArray(data) ? data[0] : data);
    onClose();
  };

  const detailsDisabled = !selectedProduct;
  const unknownBarcode = Boolean(productSearch.trim() && filteredProducts.length === 0 && !selectedProduct);

  return (
    <SideDrawer isOpen={isOpen} onClose={onClose} ariaLabel="Add stock">
      <div className="stocky-receive-header">
        <div>
          <p className="stocky-receive-eyebrow">Stock in</p>
          <h2 className="stocky-receive-title">Add stock</h2>
          <p className="stocky-receive-subtitle">Find the product, then record where this delivery belongs.</p>
        </div>
        <button type="button" onClick={onClose} className="stocky-receive-close" aria-label="Close">
          <XIcon size="xs" />
        </button>
      </div>

      <form onSubmit={handleSave} className="stocky-receive-form">
        <section className="stocky-receive-section">
          <div className="stocky-receive-section-heading">
            <span className="stocky-receive-section-number">1</span>
            <div><h3>Find the product</h3><p>Search by name or scan the barcode.</p></div>
          </div>
          <div className="stocky-receive-grid stocky-receive-grid--two">
            <div>
              <ReceiveSearchSelect
                label="Product / barcode"
                placeholder="Search or scan barcode..."
                query={productSearch}
                onQueryChange={handleProductSearchChange}
                selected={selectedProduct ? { id: selectedProduct.id, label: selectedProduct.name, meta: selectedProduct.barcode || 'Barcode not recorded' } : null}
                options={filteredProducts}
                onSelect={chooseProduct}
                onClear={() => { setProductId(''); setCreatedProduct(null); setProductSearch(''); setSupplierId(''); }}
                required
                icon={<BarcodeIcon size="xs" />}
                emptyMessage="No matching product in your catalog."
              />
              {selectedProduct ? <p className="stocky-receive-confirmation"><CheckCircleIcon size="xs" /> Product selected · {selectedProduct.categoryName}</p> : null}
              {unknownBarcode ? (
                <div className="stocky-receive-warning">
                  <AlertTriangleIcon size="xs" />
                  <div>
                    <strong>Barcode not in your records</strong>
                    <p>This barcode will be saved as a new product barcode when you create the product.</p>
                    {userRole !== 'staff' ? <button type="button" onClick={startCreatingProduct} className="stocky-receive-inline-action">Create new product</button> : <p className="stocky-receive-warning__note">Ask a manager to add this product to the catalog.</p>}
                  </div>
                </div>
              ) : null}
              {isCreatingProduct ? (
                <div className="stocky-receive-create-product">
                  <div className="stocky-receive-create-product__heading"><strong>New product details</strong><span>Barcode is required</span></div>
                  <label className="stocky-receive-label">Product name<input required value={newProductName} onChange={(event) => setNewProductName(event.target.value)} placeholder="e.g. Fresh milk" className="stocky-receive-field stocky-receive-field--plain" /></label>
                  <label className="stocky-receive-label">Barcode<input required value={newProductBarcode} onChange={(event) => setNewProductBarcode(event.target.value)} placeholder="Scan or type barcode" className="stocky-receive-field stocky-receive-field--plain" /></label>
                  <label className="stocky-receive-label">Category<input list="stocky-receive-category-options" value={newProductCategory} onChange={(event) => setNewProductCategory(event.target.value)} placeholder="Search or add category" className="stocky-receive-field stocky-receive-field--plain" /><datalist id="stocky-receive-category-options">{Array.from(new Set(products.map((product) => product.categoryName).filter(Boolean))).sort().map((category) => <option key={category} value={category} />)}</datalist></label>
                  <div className="stocky-receive-create-product__actions"><button type="button" onClick={() => setIsCreatingProduct(false)} className="stocky-receive-secondary-action">Cancel</button><button type="button" onClick={createProduct} disabled={creatingProduct} className="stocky-receive-inline-action">{creatingProduct ? 'Creating...' : 'Create product'}</button></div>
                </div>
              ) : null}
            </div>
            <ReceiveSearchSelect
              label="Supplier"
              placeholder="Search supplier..."
              query={supplierSearch}
              onQueryChange={setSupplierSearch}
              selected={selectedSupplier ? { id: selectedSupplier.id, label: selectedSupplier.name, meta: selectedSupplier.contactName || selectedSupplier.contactEmail || '' } : null}
              options={filteredSuppliers}
              onSelect={(option) => { setSupplierId(option.id); setSupplierSearch(''); }}
              onClear={() => { setSupplierId(''); setSupplierSearch(''); }}
              disabled={detailsDisabled}
              required
              icon={<TruckIcon size="xs" />}
              emptyMessage={suppliers.length ? 'No suppliers match this search.' : 'Add a supplier in Suppliers first.'}
            />
          </div>
        </section>

        <section className="stocky-receive-section">
          <div className="stocky-receive-section-heading">
            <span className="stocky-receive-section-number">2</span>
            <div><h3>Place the stock</h3><p>Tell Stocky where this delivery is going and how much arrived.</p></div>
          </div>
          <div className="stocky-receive-grid stocky-receive-grid--two">
            <ReceiveSearchSelect
              label="Location"
              placeholder="Search location..."
              query={locationSearch}
              onQueryChange={setLocationSearch}
              selected={selectedLocation ? { id: selectedLocation.id, label: selectedLocation.name, meta: selectedLocation.type === 'warehouse' ? 'Warehouse' : 'Branch' } : null}
              options={filteredLocations}
              onSelect={(option) => { setLocationId(option.id); setLocationSearch(''); }}
              onClear={() => { setLocationId(''); setLocationSearch(''); }}
              disabled={detailsDisabled}
              required
              icon={<SearchIcon size="xs" />}
              emptyMessage="No locations match this search."
            />
            <label className={`stocky-receive-label ${detailsDisabled ? 'stocky-receive-label--disabled' : ''}`}>
              <span>Quantity <span aria-hidden="true" className="stocky-receive-required">*</span></span>
              <input required type="number" min="1" step="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} placeholder="0" disabled={detailsDisabled} className="stocky-receive-field stocky-receive-field--plain" />
            </label>
          </div>
        </section>

        <section className="stocky-receive-section">
          <div className="stocky-receive-section-heading">
            <span className="stocky-receive-section-number">3</span>
            <div><h3>Record the dates</h3><p>Each receipt creates a new stock lot under the selected product.</p></div>
          </div>
          <div className="stocky-receive-grid stocky-receive-grid--three">
            <label className={`stocky-receive-label ${detailsDisabled ? 'stocky-receive-label--disabled' : ''}`}>
              <span>Date received <span aria-hidden="true" className="stocky-receive-required">*</span></span>
              <span className="stocky-receive-date-field"><CalendarIcon size="xs" /><input required type="date" value={receivedDate} onChange={(event) => setReceivedDate(event.target.value)} disabled={detailsDisabled} className="stocky-receive-field stocky-receive-field--date" /></span>
            </label>
            <label className={`stocky-receive-label ${detailsDisabled ? 'stocky-receive-label--disabled' : ''}`}>
              <span>Stock expiry date {!expiryUnknown ? <span aria-hidden="true" className="stocky-receive-required">*</span> : null}</span>
              <input required={!expiryUnknown} type="date" value={expiryDate} onChange={(event) => setExpiryDate(event.target.value)} disabled={detailsDisabled || expiryUnknown} className="stocky-receive-field stocky-receive-field--plain" />
            </label>
            <label className={`stocky-receive-label ${detailsDisabled || expiryUnknown ? 'stocky-receive-label--disabled' : ''}`}>
              <span>Notify before (days)</span>
              <input type="number" min="0" step="1" value={notificationDays} onChange={(event) => setNotificationDays(event.target.value)} disabled={detailsDisabled || expiryUnknown} className="stocky-receive-field stocky-receive-field--plain" />
            </label>
          </div>
          <label className={`stocky-receive-checkbox ${detailsDisabled ? 'stocky-receive-checkbox--disabled' : ''}`}><input type="checkbox" checked={expiryUnknown} onChange={(event) => { setExpiryUnknown(event.target.checked); if (event.target.checked) { setExpiryDate(''); setNotificationDays(''); } else if (!notificationDays) setNotificationDays(selectedProduct?.defaultExpiryNotificationDays == null ? '30' : String(selectedProduct.defaultExpiryNotificationDays)); }} disabled={detailsDisabled} /> <span>No expiry date available for this product</span></label>
        </section>

        {error ? <p className="stocky-receive-error" role="alert">{error}</p> : null}
      </form>

      <div className="stocky-receive-footer">
        <button type="button" onClick={onClose} className="stocky-receive-secondary-action">Cancel</button>
        <button type="submit" onClick={handleSave} disabled={saving || !selectedProduct} className="stocky-receive-primary-action">{saving ? 'Adding...' : 'Add to stock'}</button>
      </div>
    </SideDrawer>
  );
}
