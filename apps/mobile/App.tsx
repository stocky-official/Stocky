import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from './src/lib/supabase';
import { BarcodeScannerModal } from './src/components/BarcodeScannerModal';
import { MobileTodayScreen } from './src/screens/MobileTodayScreen';
import { MobileStockScreen } from './src/screens/MobileStockScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { MobileActionModal } from './src/screens/MobileActionModal';
import type { Company, CompanyUserRole, Location, Product, StockLot } from '@stocky/types';

type AppTab = 'home' | 'stock' | 'expiry' | 'settings';

function mapLocation(row: any): Location { return { id: row.id, companyId: row.company_id, name: row.name, code: row.code, type: row.type, address: row.address, phone: row.phone, managerUserId: row.manager_user_id, isActive: Boolean(row.is_active), createdAt: row.created_at, updatedAt: row.updated_at }; }
function mapProduct(row: any): Product { return { id: row.id, companyId: row.company_id, name: row.name, barcode: row.barcode, categoryId: row.category_id, categoryName: row.category_name || 'General', unitName: row.unit_name || 'unit', reorderPoint: Number(row.reorder_point || 0), defaultExpiryNotificationDays: row.default_expiry_notification_days, defaultSupplierId: row.default_supplier_id, unitCost: Number(row.unit_cost || 0), isActive: Boolean(row.is_active), createdAt: row.created_at, updatedAt: row.updated_at }; }
function mapLot(row: any): StockLot { return { id: row.id, companyId: row.company_id, productId: row.product_id, locationId: row.location_id, supplierId: row.supplier_id, lotNumber: row.lot_number, receivedAt: row.received_at, manufacturedAt: row.manufactured_at, expiryDate: row.expiry_date, expiryNotificationDays: row.expiry_notification_days, quantityOnHand: Number(row.quantity_on_hand || 0), unitCost: Number(row.unit_cost || 0), status: row.status, notes: row.notes, createdAt: row.created_at, updatedAt: row.updated_at }; }

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<Company | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [lots, setLots] = useState<StockLot[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState('all');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<CompanyUserRole>('staff');
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [openCounts, setOpenCounts] = useState(0);
  const [action, setAction] = useState<{ mode: 'receive' | 'count'; product?: Product; lot?: StockLot } | null>(null);

  useEffect(() => {
    async function init() {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) { setLoading(false); return; }
      setUserEmail(auth.user.email || null); setUserName(auth.user.user_metadata?.full_name || auth.user.user_metadata?.name || null);
      const { data: profile } = await supabase.from('company_users').select('*').or(`auth_user_id.eq.${auth.user.id},email.eq.${auth.user.email}`).limit(1).maybeSingle();
      if (!profile?.company_id) { setLoading(false); return; }
      setUserRole(profile.role);
      const [{ data: comp }, { data: dbLocations }, { data: userLocations }, { data: dbProducts }, { data: dbLots }, { data: dbCounts }] = await Promise.all([
        supabase.from('companies').select('*').eq('id', profile.company_id).maybeSingle(),
        supabase.from('locations').select('*').eq('company_id', profile.company_id).eq('is_active', true).order('name'),
        supabase.from('user_locations').select('location_id').eq('user_id', profile.id),
        supabase.from('products').select('*').eq('company_id', profile.company_id).eq('is_active', true).order('name'),
        supabase.from('stock_lots').select('*').eq('company_id', profile.company_id).order('expiry_date'),
        supabase.from('stock_count_sessions').select('status').eq('company_id', profile.company_id).in('status', ['open', 'submitted']),
      ]);
      if (comp) setCompany({ id: comp.id, name: comp.name, code: comp.code, logoUrl: comp.logo_url, status: comp.status, verifiedAt: comp.verified_at, verifiedByAuthUserId: comp.verified_by_auth_user_id, verificationNote: comp.verification_note, createdAt: comp.created_at, updatedAt: comp.updated_at });
      const mappedLocations = (dbLocations || []).map(mapLocation); const assigned = Array.from(new Set([...(userLocations || []).map((row: any) => row.location_id), ...mappedLocations.filter((location) => location.managerUserId === profile.id).map((location) => location.id)])); const visible = profile.role === 'owner' || profile.role === 'admin' ? mappedLocations : mappedLocations.filter((location) => assigned.includes(location.id));
      setLocations(visible); setProducts((dbProducts || []).map(mapProduct)); setLots((dbLots || []).map(mapLot));
      setOpenCounts((dbCounts || []).length);
      if (profile.role !== 'owner' && profile.role !== 'admin') setSelectedLocationId(visible[0]?.id || '');
      setLoading(false);
    }
    init().catch((error) => { console.error('Mobile Stocky initialization failed', error); setLoading(false); });
  }, [reloadKey]);

  const scopedLots = useMemo(() => lots.filter((lot) => selectedLocationId === 'all' || lot.locationId === selectedLocationId), [lots, selectedLocationId]);
  const metrics = useMemo(() => { const today = Date.now(); const expiry = scopedLots.filter((lot) => lot.quantityOnHand > 0 && lot.expiryDate).map((lot) => ({ lot, days: Math.ceil((new Date(lot.expiryDate as string).getTime() - today) / 86400000) })); const totals = new Map<string, number>(); scopedLots.forEach((lot) => totals.set(lot.productId, (totals.get(lot.productId) || 0) + lot.quantityOnHand)); return { expired: expiry.filter(({ days }) => days < 0).length, expiring: expiry.filter(({ lot, days }) => days >= 0 && days <= (lot.expiryNotificationDays || 0)).length, lowStock: products.filter((product) => (totals.get(product.id) || 0) <= product.reorderPoint).length, openCounts }; }, [openCounts, products, scopedLots]);
  const currentLocation = locations.find((location) => location.id === selectedLocationId);

  if (loading) return <View style={styles.loading}><ActivityIndicator color="#0057FF" size="large" /><Text style={styles.loadingText}>Loading your Stocky workspace...</Text></View>;
  return <SafeAreaView style={styles.app}><StatusBar barStyle="dark-content" /><View style={styles.screen}>{activeTab === 'home' && <MobileTodayScreen userName={userName} userRole={userRole} location={currentLocation} metrics={metrics} onScan={() => { setActiveTab('stock'); setIsScannerOpen(true); }} onReceive={() => setActiveTab('stock')} onCount={() => setActiveTab('stock')} onOpenStock={() => setActiveTab('stock')} onOpenExpiry={() => setActiveTab('expiry')} />}{activeTab === 'stock' && <MobileStockScreen products={products} lots={lots} locations={locations} selectedLocationId={selectedLocationId} mode="stock" initialSearch={scannedBarcode} onScan={() => setIsScannerOpen(true)} onReceive={(product, lot) => setAction({ mode: 'receive', product, lot })} onCount={(product, lot) => setAction({ mode: 'count', product, lot })} />}{activeTab === 'expiry' && <MobileStockScreen products={products} lots={lots} locations={locations} selectedLocationId={selectedLocationId} mode="expiry" onScan={() => setIsScannerOpen(true)} onReceive={(product, lot) => setAction({ mode: 'receive', product, lot })} onCount={(product, lot) => setAction({ mode: 'count', product, lot })} />}{activeTab === 'settings' && <SettingsScreen company={company} userEmail={userEmail} userRole={userRole} onSignOut={() => supabase.auth.signOut()} />}</View><View style={styles.bottomNav}><TouchableOpacity onPress={() => setActiveTab('home')} style={[styles.navTab, activeTab === 'home' && styles.navActive]}><Text style={styles.navIcon}>⌂</Text><Text style={styles.navLabel}>Today</Text></TouchableOpacity><TouchableOpacity onPress={() => setActiveTab('stock')} style={[styles.navTab, activeTab === 'stock' && styles.navActive]}><Text style={styles.navIcon}>▦</Text><Text style={styles.navLabel}>Stock</Text></TouchableOpacity><TouchableOpacity onPress={() => setIsScannerOpen(true)} style={styles.scanTab}><View style={styles.scanCircle}><Text style={styles.scanIcon}>⌕</Text></View><Text style={styles.scanLabel}>Scan</Text></TouchableOpacity><TouchableOpacity onPress={() => setActiveTab('expiry')} style={[styles.navTab, activeTab === 'expiry' && styles.navActive]}><Text style={styles.navIcon}>◷</Text><Text style={styles.navLabel}>Expiring</Text></TouchableOpacity><TouchableOpacity onPress={() => setActiveTab('settings')} style={[styles.navTab, activeTab === 'settings' && styles.navActive]}><Text style={styles.navIcon}>⋯</Text><Text style={styles.navLabel}>More</Text></TouchableOpacity></View><BarcodeScannerModal visible={isScannerOpen} onClose={() => setIsScannerOpen(false)} onScanned={(barcode) => { setScannedBarcode(barcode); setIsScannerOpen(false); setActiveTab('stock'); }} /><MobileActionModal visible={Boolean(action)} mode={action?.mode || 'count'} product={action?.product} lot={action?.lot} lots={lots} barcode={scannedBarcode} locationId={selectedLocationId === 'all' ? locations[0]?.id || '' : selectedLocationId} onClose={() => setAction(null)} onSaved={() => { setAction(null); setReloadKey((value) => value + 1); }} /></SafeAreaView>;
}

const styles = StyleSheet.create({ app: { flex: 1, backgroundColor: '#F8FAFC' }, screen: { flex: 1 }, loading: { flex: 1, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', gap: 12 }, loadingText: { color: '#64748B', fontSize: 13 }, bottomNav: { position: 'absolute', bottom: 20, left: 14, right: 14, height: 64, borderRadius: 22, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', elevation: 8 }, navTab: { alignItems: 'center', justifyContent: 'center', minWidth: 52, height: 52, borderRadius: 16 }, navActive: { backgroundColor: '#EFF6FF' }, navIcon: { color: '#334155', fontSize: 19 }, navLabel: { color: '#64748B', fontSize: 10, marginTop: 3 }, scanTab: { alignItems: 'center', marginTop: -19 }, scanCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#0057FF', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#FFFFFF' }, scanIcon: { color: '#FFFFFF', fontSize: 22 }, scanLabel: { color: '#0057FF', fontSize: 10, marginTop: 3, fontWeight: '500' } });
