'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangleIcon,
  BarcodeIcon,
  CalendarIcon,
  CameraIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  SearchIcon,
  TruckIcon,
  XIcon,
} from '@stocky/icons';
import { supabase } from '@/lib/supabase/client';
import type { CompanyUserRole, Location, Product, StockLot, Supplier } from '@stocky/types';
import { SideDrawer } from '@/components/ui/SideDrawer';
import { useTranslation } from '@/lib/i18n';
import { BarcodeScannerWidget } from '../BarcodeScannerWidget/BarcodeScannerWidget';

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
  onCameraClick?: () => void;
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
  onCameraClick,
}: ReceiveSearchSelectProps) {
  const { t } = useTranslation();
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
          {onCameraClick ? (
            <>
              <span className="stocky-receive-action-divider" aria-hidden="true" />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onCameraClick();
                }}
                disabled={disabled}
                className="stocky-receive-camera-button"
                title={t('drawers.receiveStock.scanCamera')}
                aria-label={t('drawers.receiveStock.scanCamera')}
              >
                <CameraIcon size="xs" />
              </button>
            </>
          ) : null}
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
  const { t } = useTranslation();
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
  const [isScannerOpen, setIsScannerOpen] = useState(false);

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
      meta: `${product.barcode || t('drawers.receiveStock.noBarcode')} · ${product.categoryName}`,
    }));
  }, [productSearch, products, t]);

  const filteredSuppliers = useMemo(() => {
    const query = supplierSearch.trim().toLowerCase();
    return suppliers
      .filter((supplier) => !query || [supplier.name, supplier.contactName, supplier.contactEmail].filter(Boolean).some((value) => String(value).toLowerCase().includes(query)))
      .slice(0, 8)
      .map((supplier) => ({ id: supplier.id, label: supplier.name, meta: supplier.contactName || supplier.contactEmail || t('drawers.receiveStock.noSupplierContact') }));
  }, [supplierSearch, suppliers, t]);

  const filteredLocations = useMemo(() => {
    const query = locationSearch.trim().toLowerCase();
    return locations
      .filter((location) => !query || [location.name, location.address, location.type].filter(Boolean).some((value) => String(value).toLowerCase().includes(query)))
      .slice(0, 8)
      .map((location) => ({ id: location.id, label: location.name, meta: location.type === 'warehouse' ? t('drawers.receiveStock.warehouse') : t('drawers.receiveStock.branch') }));
  }, [locationSearch, locations, t]);

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

  const handleBarcodeScanned = (rawBarcode: string) => {
    const code = rawBarcode.trim();
    if (!code) return;
    setIsScannerOpen(false);
    const exactProduct = products.find(
      (p) => p.barcode?.trim().toLowerCase() === code.toLowerCase()
    );
    if (exactProduct) {
      chooseProduct({ id: exactProduct.id, label: exactProduct.name, meta: exactProduct.barcode || undefined });
    } else {
      handleProductSearchChange(code);
    }
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
    if (!name) return setError(t('drawers.receiveStock.errors.enterName'));
    if (!barcode) return setError(t('drawers.receiveStock.errors.addBarcode'));
    if (!companyId) return setError(t('drawers.receiveStock.errors.companyMissing'));

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
    if (createError || !data) return setError(createError?.message || t('drawers.receiveStock.errors.createFailed'));

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

    if (!selectedProduct) return setError(t('drawers.receiveStock.errors.selectProduct'));
    if (!locationId) return setError(t('drawers.receiveStock.errors.chooseLocation'));
    if (!supplierId) return setError(t('drawers.receiveStock.errors.chooseSupplier'));
    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) return setError(t('drawers.receiveStock.errors.validQuantity'));
    if (!receivedDate) return setError(t('drawers.receiveStock.errors.addReceivedDate'));
    if (!expiryDate && !expiryUnknown) return setError(t('drawers.receiveStock.errors.addExpiryDate'));
    if (expiryDate && (parsedDays === null || !Number.isInteger(parsedDays) || parsedDays < 0)) return setError(t('drawers.receiveStock.errors.validAlertDays'));

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
    if (saveError) return setError(saveError.message || t('drawers.receiveStock.errors.saveFailed'));
    if (data) onSaved(Array.isArray(data) ? data[0] : data);
    onClose();
  };

  const detailsDisabled = !selectedProduct;
  const unknownBarcode = Boolean(productSearch.trim() && filteredProducts.length === 0 && !selectedProduct);

  return (
    <>
      <SideDrawer isOpen={isOpen} onClose={onClose} ariaLabel={t('drawers.receiveStock.title')}>
      <div className="stocky-receive-header">
        <div>
          <h2 className="stocky-receive-title">{t('drawers.receiveStock.title')}</h2>
          <p className="stocky-receive-subtitle">{t('drawers.receiveStock.subtitle')}</p>
        </div>
        <button type="button" onClick={onClose} className="stocky-receive-close" aria-label={t('common.close')}>
          <XIcon size="xs" />
        </button>
      </div>

      <form onSubmit={handleSave} className="stocky-receive-form">
        <section className="stocky-receive-section">
          <div className="stocky-receive-section-heading">
            <span className="stocky-receive-section-number">1</span>
            <div><h3>{t('drawers.receiveStock.step1Title')}</h3><p>{t('drawers.receiveStock.step1Desc')}</p></div>
          </div>
          <div className="stocky-receive-grid stocky-receive-grid--two">
            <div>
              <ReceiveSearchSelect
                label={t('drawers.receiveStock.productOrBarcode')}
                placeholder={t('drawers.receiveStock.searchPlaceholder')}
                query={productSearch}
                onQueryChange={handleProductSearchChange}
                selected={selectedProduct ? { id: selectedProduct.id, label: selectedProduct.name, meta: selectedProduct.barcode || t('drawers.receiveStock.barcodeNotRecorded') } : null}
                options={filteredProducts}
                onSelect={chooseProduct}
                onClear={() => { setProductId(''); setCreatedProduct(null); setProductSearch(''); setSupplierId(''); }}
                required
                icon={<BarcodeIcon size="xs" />}
                emptyMessage={t('drawers.receiveStock.noMatchingProduct')}
                onCameraClick={() => setIsScannerOpen(true)}
              />
              {selectedProduct ? <p className="stocky-receive-confirmation"><CheckCircleIcon size="xs" /> {t('drawers.receiveStock.productSelected')} · {selectedProduct.categoryName}</p> : null}
              {unknownBarcode ? (
                <div className="stocky-receive-warning">
                  <AlertTriangleIcon size="xs" />
                  <div>
                    <strong>{t('drawers.receiveStock.barcodeWarning')}</strong>
                    <p>{t('drawers.receiveStock.barcodeWarningDesc')}</p>
                    {userRole !== 'staff' ? <button type="button" onClick={startCreatingProduct} className="stocky-receive-inline-action">{t('drawers.receiveStock.createProduct')}</button> : <p className="stocky-receive-warning__note">{t('drawers.receiveStock.askManager')}</p>}
                  </div>
                </div>
              ) : null}
              {isCreatingProduct ? (
                <div className="stocky-receive-create-product">
                  <div className="stocky-receive-create-product__heading"><strong>{t('drawers.receiveStock.newProductDetails')}</strong><span>{t('drawers.receiveStock.barcodeRequired')}</span></div>
                  <label className="stocky-receive-label">{t('drawers.receiveStock.productName')}<input required value={newProductName} onChange={(event) => setNewProductName(event.target.value)} placeholder={t('drawers.receiveStock.productNamePlaceholder')} className="stocky-receive-field stocky-receive-field--plain" /></label>
                  <label className="stocky-receive-label">{t('drawers.receiveStock.barcode')}<input required value={newProductBarcode} onChange={(event) => setNewProductBarcode(event.target.value)} placeholder={t('drawers.receiveStock.barcodePlaceholder')} className="stocky-receive-field stocky-receive-field--plain" /></label>
                  <label className="stocky-receive-label">{t('drawers.receiveStock.category')}<input list="stocky-receive-category-options" value={newProductCategory} onChange={(event) => setNewProductCategory(event.target.value)} placeholder={t('drawers.receiveStock.categoryOptions')} className="stocky-receive-field stocky-receive-field--plain" /><datalist id="stocky-receive-category-options">{Array.from(new Set(products.map((product) => product.categoryName).filter(Boolean))).sort().map((category) => <option key={category} value={category} />)}</datalist></label>
                  <div className="stocky-receive-create-product__actions"><button type="button" onClick={() => setIsCreatingProduct(false)} className="stocky-receive-secondary-action">{t('drawers.receiveStock.cancel')}</button><button type="button" onClick={createProduct} disabled={creatingProduct} className="stocky-receive-inline-action">{creatingProduct ? t('drawers.receiveStock.creatingProduct') : t('drawers.receiveStock.createProduct')}</button></div>
                </div>
              ) : null}
            </div>
            <ReceiveSearchSelect
              label={t('drawers.receiveStock.supplier')}
              placeholder={t('drawers.receiveStock.searchSupplier')}
              query={supplierSearch}
              onQueryChange={setSupplierSearch}
              selected={selectedSupplier ? { id: selectedSupplier.id, label: selectedSupplier.name, meta: selectedSupplier.contactName || selectedSupplier.contactEmail || '' } : null}
              options={filteredSuppliers}
              onSelect={(option) => { setSupplierId(option.id); setSupplierSearch(''); }}
              onClear={() => { setSupplierId(''); setSupplierSearch(''); }}
              disabled={detailsDisabled}
              required
              icon={<TruckIcon size="xs" />}
              emptyMessage={suppliers.length ? t('drawers.receiveStock.noSuppliersFound') : t('drawers.receiveStock.noSuppliersRegistered')}
            />
          </div>
        </section>

        <section className="stocky-receive-section">
          <div className="stocky-receive-section-heading">
            <span className="stocky-receive-section-number">2</span>
            <div><h3>{t('drawers.receiveStock.step2Title')}</h3><p>{t('drawers.receiveStock.step2Desc')}</p></div>
          </div>
          <div className="stocky-receive-grid stocky-receive-grid--two">
            <ReceiveSearchSelect
              label={t('drawers.receiveStock.location')}
              placeholder={t('drawers.receiveStock.searchLocation')}
              query={locationSearch}
              onQueryChange={setLocationSearch}
              selected={selectedLocation ? { id: selectedLocation.id, label: selectedLocation.name, meta: selectedLocation.type === 'warehouse' ? t('drawers.receiveStock.warehouse') : t('drawers.receiveStock.branch') } : null}
              options={filteredLocations}
              onSelect={(option) => { setLocationId(option.id); setLocationSearch(''); }}
              onClear={() => { setLocationId(''); setLocationSearch(''); }}
              disabled={detailsDisabled}
              required
              icon={<SearchIcon size="xs" />}
              emptyMessage={t('drawers.receiveStock.noLocationsFound')}
            />
            <label className={`stocky-receive-label ${detailsDisabled ? 'stocky-receive-label--disabled' : ''}`}>
              <span>{t('drawers.receiveStock.quantity')} <span aria-hidden="true" className="stocky-receive-required">*</span></span>
              <input required type="number" min="1" step="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} placeholder="0" disabled={detailsDisabled} className="stocky-receive-field stocky-receive-field--plain" />
            </label>
          </div>
        </section>

        <section className="stocky-receive-section">
          <div className="stocky-receive-section-heading">
            <span className="stocky-receive-section-number">3</span>
            <div><h3>{t('drawers.receiveStock.step3Title')}</h3><p>{t('drawers.receiveStock.step3Desc')}</p></div>
          </div>
          <div className="stocky-receive-grid stocky-receive-grid--three">
            <label className={`stocky-receive-label ${detailsDisabled ? 'stocky-receive-label--disabled' : ''}`}>
              <span>{t('drawers.receiveStock.receivedDate')} <span aria-hidden="true" className="stocky-receive-required">*</span></span>
              <span className="stocky-receive-date-field"><CalendarIcon size="xs" /><input required type="date" value={receivedDate} onChange={(event) => setReceivedDate(event.target.value)} disabled={detailsDisabled} className="stocky-receive-field stocky-receive-field--date" /></span>
            </label>
            <label className={`stocky-receive-label ${detailsDisabled ? 'stocky-receive-label--disabled' : ''}`}>
              <span>{t('drawers.receiveStock.expiryDate')} {!expiryUnknown ? <span aria-hidden="true" className="stocky-receive-required">*</span> : null}</span>
              <input required={!expiryUnknown} type="date" value={expiryDate} onChange={(event) => setExpiryDate(event.target.value)} disabled={detailsDisabled || expiryUnknown} className="stocky-receive-field stocky-receive-field--plain" />
            </label>
            <label className={`stocky-receive-label ${detailsDisabled || expiryUnknown ? 'stocky-receive-label--disabled' : ''}`}>
              <span>{t('drawers.receiveStock.alertDays')}</span>
              <input type="number" min="0" step="1" value={notificationDays} onChange={(event) => setNotificationDays(event.target.value)} disabled={detailsDisabled || expiryUnknown} className="stocky-receive-field stocky-receive-field--plain" />
            </label>
          </div>
          <label className={`stocky-receive-checkbox ${detailsDisabled ? 'stocky-receive-checkbox--disabled' : ''}`}><input type="checkbox" checked={expiryUnknown} onChange={(event) => { setExpiryUnknown(event.target.checked); if (event.target.checked) { setExpiryDate(''); setNotificationDays(''); } else if (!notificationDays) setNotificationDays(selectedProduct?.defaultExpiryNotificationDays == null ? '30' : String(selectedProduct.defaultExpiryNotificationDays)); }} disabled={detailsDisabled} /> <span>{t('drawers.receiveStock.noExpiry')}</span></label>
        </section>

        {error ? <p className="stocky-receive-error" role="alert">{error}</p> : null}
      </form>

      <div className="stocky-receive-footer">
        <button type="button" onClick={onClose} className="stocky-receive-secondary-action">{t('drawers.receiveStock.cancel')}</button>
        <button type="submit" onClick={handleSave} disabled={saving || !selectedProduct} className="stocky-receive-primary-action">{saving ? t('drawers.receiveStock.receiving') : t('drawers.receiveStock.confirmReceipt')}</button>
      </div>
    </SideDrawer>

    <BarcodeScannerWidget
      isOpen={isScannerOpen}
      onClose={() => setIsScannerOpen(false)}
      hideFloatingButton
      onBarcodeFound={handleBarcodeScanned}
    />
  </>
  );
}
