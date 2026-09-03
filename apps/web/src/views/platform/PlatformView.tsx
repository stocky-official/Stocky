'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import {
  SidebarNavWidget,
  BranchSelectorWidget,
  BranchInsightsWidget,
  InventoryTableWidget,
  BranchesManagementWidget,
  SuppliersManagementWidget,
  AlertsPlaceholderWidget,
  CompanySettingsWidget,
  MobileTopBarWidget,
  MobileBottomNavWidget,
  BarcodeScannerWidget,
  RecordEditDrawerWidget,
} from '@/widgets';
import type { Branch, Item, Supplier, Company, CompanyUserRole } from '@stocky/types';

/**
 * PlatformView (PageView)
 * Conforms to Critical Rule 5:
 * Controls the overall structure of the Platform and orchestrates:
 * - SidebarNavWidget (Dashboard, Inventory, Stores & Branches, Suppliers, Alerts TBD, Settings)
 * - BranchSelectorWidget (Filter by All Branches or individual Store)
 * - BranchInsightsWidget (Dashboard KPIs & Comparisons)
 * - InventoryTableWidget (Category, Name, Barcode, Balance, Quantity, Pagination)
 * - BranchesManagementWidget (Stores & Branches directory)
 * - SuppliersManagementWidget (Suppliers directory & contact person)
 * - AlertsPlaceholderWidget (Alerts TBD)
 * - CompanySettingsWidget (Settings, Team RBAC, Authorizations)
 */
export function PlatformView() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedBranchId, setSelectedBranchId] = useState('all');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<CompanyUserRole>('owner');
  const [userAssignedBranchIds, setUserAssignedBranchIds] = useState<string[]>([]);
  const [companyId, setCompanyId] = useState<string>('');
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  // Live Database States
  const [branches, setBranches] = useState<Branch[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [totalDatabaseItems, setTotalDatabaseItems] = useState<number>(0);

  // Scanned Product state for Drawer
  const [scannedItem, setScannedItem] = useState<Item | null>(null);
  const [isScannedDrawerOpen, setIsScannedDrawerOpen] = useState<boolean>(false);

  const handleProductScanned = (item: Item) => {
    setScannedItem(item);
    setIsScannedDrawerOpen(true);
  };

  const handleScannedDrawerSaveSuccess = (updatedItem: any) => {
    setScannedItem((prev) => (prev ? { ...prev, ...updatedItem } : null));
    setItems((prev) =>
      prev.map((i) => (i.id === updatedItem.id ? { ...i, ...updatedItem } : i))
    );
  };


  // Mobile Floating Bottom Nav scroll-aware visibility
  const [isBottomNavVisible, setIsBottomNavVisible] = useState(true);
  const lastScrollY = useRef(0);

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    const currentY = e.currentTarget.scrollTop;
    if (currentY > lastScrollY.current + 8 && currentY > 40) {
      setIsBottomNavVisible(false);
    } else if (currentY < lastScrollY.current - 8) {
      setIsBottomNavVisible(true);
    }
    lastScrollY.current = currentY;
  };

  useEffect(() => {
    async function loadData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email ?? null);

        // Fetch User RBAC profile & role
        const { data: userProfile } = await supabase
          .from('company_users')
          .select('*')
          .or(`auth_user_id.eq.${user.id},email.eq.${user.email}`)
          .limit(1)
          .maybeSingle();

        if (userProfile && userProfile.company_id) {
          setUserRole(userProfile.role);
          setCompanyId(userProfile.company_id);

          // Fetch company details (name, code, logo)
          const { data: comp } = await supabase
            .from('companies')
            .select('*')
            .eq('id', userProfile.company_id)
            .maybeSingle();

          if (comp) {
            setCompany({
              id: comp.id,
              name: comp.name,
              code: comp.code,
              logoUrl: comp.logo_url,
              createdAt: comp.created_at,
              updatedAt: comp.updated_at,
            });
          }

          // Fetch user assigned branch scopes
          const { data: branchRows } = await supabase
            .from('user_branches')
            .select('branch_id')
            .eq('user_id', userProfile.id);

          if (branchRows && branchRows.length > 0) {
            setUserAssignedBranchIds(branchRows.map((r: any) => r.branch_id));
          }
        } else {
          // User is authenticated but does not belong to an organization
          router.replace('/onboarding');
          return;
        }
      } else {
        setUserEmail(null);
      }

      try {
        // 1. Fetch Real Branches
        const { data: dbBranches } = await supabase
          .from('branches')
          .select('*')
          .order('name');

        if (dbBranches && dbBranches.length > 0) {
          const mappedBranches: Branch[] = dbBranches.map((b: any) => ({
            id: b.id,
            companyId: b.company_id,
            name: b.name,
            code: b.code,
            address: b.address,
            phone: b.phone,
            isActive: b.is_active,
            createdAt: b.created_at,
            updatedAt: b.updated_at,
          }));
          setBranches(mappedBranches);
        }

        // 2. Fetch All 42 Real Categories
        const { data: dbCategories } = await supabase
          .from('categories')
          .select('name')
          .order('name');

        if (dbCategories) {
          setCategories(dbCategories.map((c: any) => c.name));
        }

        // 3. Get exact total item count from DB (31,488)
        const { count: exactCount } = await supabase
          .from('items')
          .select('*', { count: 'exact', head: true });

        if (exactCount) {
          setTotalDatabaseItems(exactCount);
        }

        // 4. Fetch real items (initial large slice of up to 5,000 for instant client interaction)
        const { data: dbItems } = await supabase
          .from('items')
          .select('*')
          .range(0, 4999)
          .order('category_name');

        if (dbItems && dbItems.length > 0) {
          const mappedItems: Item[] = dbItems.map((i: any) => ({
            id: i.id,
            companyId: i.company_id,
            branchId: i.branch_id,
            categoryId: i.category_id,
            categoryName: i.category_name,
            name: i.name,
            barcode: i.barcode,
            balance: Number(i.balance),
            quantity: i.quantity,
            expiryDate: i.expiry_date,
            createdAt: i.created_at,
            updatedAt: i.updated_at,
          }));
          setItems(mappedItems);
        }

        // 5. Fetch Suppliers from live database view
        const { data: dbSuppliers } = await supabase
          .from('suppliers_summary')
          .select('*')
          .order('name');

        if (dbSuppliers && dbSuppliers.length > 0) {
          const mappedSuppliers: Supplier[] = dbSuppliers.map((s: any) => ({
            id: s.id,
            companyId: s.company_id,
            name: s.name,
            contactName: s.contact_name,
            contactPhone: s.contact_phone,
            contactEmail: s.contact_email,
            itemsSupplied: s.items_supplied || [],
            itemCount: s.item_count || 0,
            createdAt: s.created_at,
            updatedAt: s.updated_at,
          }));
          setSuppliers(mappedSuppliers);
        }
      } catch (err) {
        console.error('Error fetching real data from Supabase:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  // RBAC Branch Scoping: Filter visible branches for Managers and Staff
  const visibleBranches = useMemo(() => {
    if (userRole === 'owner' || userRole === 'admin') {
      return branches;
    }
    if (userAssignedBranchIds.length === 0) {
      return branches;
    }
    return branches.filter((b) => userAssignedBranchIds.includes(b.id));
  }, [branches, userRole, userAssignedBranchIds]);

  // Lock branch selector if user is scoped to specific branch(es)
  useEffect(() => {
    if ((userRole === 'manager' || userRole === 'staff') && visibleBranches.length > 0) {
      if (selectedBranchId === 'all' || !userAssignedBranchIds.includes(selectedBranchId)) {
        setSelectedBranchId(visibleBranches[0].id);
      }
    }
  }, [userRole, visibleBranches, userAssignedBranchIds, selectedBranchId]);

  // Branch filtering logic
  const currentBranchItems = useMemo(() => {
    if (selectedBranchId === 'all') return items;
    return items.filter((item) => item.branchId === selectedBranchId);
  }, [items, selectedBranchId]);

  const selectedBranchName = useMemo(() => {
    if (selectedBranchId === 'all') return 'All Branches';
    const found = visibleBranches.find((b) => b.id === selectedBranchId);
    return found ? found.name : 'Branch';
  }, [visibleBranches, selectedBranchId]);


  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Operations Dashboard';
      case 'inventory':
        return 'Branch Inventory';
      case 'branches':
        return 'Stores & Branches';
      case 'suppliers':
        return 'Suppliers & Vendors';
      case 'alerts':
        return 'Stock Alerts';
      case 'settings':
        return 'Platform Settings';
      default:
        return 'Stocky Platform';
    }
  };

  const getTabDescription = () => {
    switch (activeTab) {
      case 'dashboard':
        return `Real-time analytics and inventory valuation for ${selectedBranchName}`;
      case 'inventory':
        return `Comprehensive stock catalog and balance tracking for ${selectedBranchName}`;
      case 'branches':
        return 'Operating distribution hubs, retail branches, and location status';
      case 'suppliers':
        return 'Registered distributors, supplied items catalog, and procurement contacts';
      case 'alerts':
        return 'Threshold alerts and automated reorder notifications';
      case 'settings':
        return 'Company profile and user authorizations';
      default:
        return 'Stock and inventory management';
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-stocky-bg-global flex flex-col md:flex-row">
      {/* Mobile Top Bar (User Profile + Search + Notification Bell) */}
      <MobileTopBarWidget
        userEmail={userEmail}
      />

      {/* Left Sidebar Navigation Widget (Desktop only) */}
      <SidebarNavWidget
        activeTab={activeTab}
        onTabChange={setActiveTab}
        userEmail={userEmail}
        companyName={company?.name}
        companyLogoUrl={company?.logoUrl}
      />

      {/* Main Content Workspace (1920x1080 Viewport Optimized) */}
      <main
        onScroll={handleScroll}
        className="flex-1 h-[calc(100vh-3.5rem)] md:h-screen flex flex-col min-w-0 overflow-y-auto"
      >
        <div className="max-w-view w-full mx-auto p-4 sm:p-6 md:p-8 space-y-6 pb-28 md:pb-8">
          {/* Top Bar with Title & Branch Filter */}
          <div className="pb-4 border-b border-stocky-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-medium text-stocky-text-main tracking-tight">
                  {getTabTitle()}
                </h1>
                {totalDatabaseItems > 0 && (
                  <span className="text-[11px] px-2 py-0.5 rounded-widget bg-stocky-bg-widget border border-stocky-border-subtle text-stocky-text-sub font-normal">
                    {totalDatabaseItems.toLocaleString()} SKUs live
                  </span>
                )}
              </div>
              <p className="text-sm font-normal text-stocky-text-sub mt-0.5">
                {getTabDescription()}
              </p>
            </div>

            {/* Show Branch Selector on Dashboard & Inventory tabs */}
            {(activeTab === 'dashboard' || activeTab === 'inventory') && (
              <BranchSelectorWidget
                branches={visibleBranches}
                selectedBranchId={selectedBranchId}
                onSelectBranch={setSelectedBranchId}
              />
            )}
          </div>

          {/* Tab Views or Loading State */}
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 rounded-widget border-2 border-stocky-primary border-t-transparent animate-spin" />
              <span className="text-xs text-stocky-text-sub font-normal">
                Connecting to live inventory catalog...
              </span>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <BranchInsightsWidget
                  branches={visibleBranches}
                  items={currentBranchItems}
                  selectedBranchId={selectedBranchId}
                  selectedBranchName={selectedBranchName}
                  totalDatabaseItems={totalDatabaseItems}
                />
              )}

              {activeTab === 'inventory' && (
                <InventoryTableWidget
                  selectedBranchId={selectedBranchId}
                  selectedBranchName={selectedBranchName}
                  allCategories={categories}
                  userRole={userRole}
                />
              )}

              {activeTab === 'branches' && (
                <BranchesManagementWidget
                  branches={visibleBranches}
                  items={items}
                  totalDatabaseItems={totalDatabaseItems}
                />
              )}

              {activeTab === 'suppliers' && (
                <SuppliersManagementWidget
                  suppliers={suppliers}
                />
              )}

              {activeTab === 'alerts' && <AlertsPlaceholderWidget />}

              {activeTab === 'settings' && (
                <CompanySettingsWidget
                  branches={branches}
                  userEmail={userEmail}
                  companyId={companyId || branches[0]?.companyId}
                  companyName={company?.name}
                  companyCode={company?.code}
                  companyLogoUrl={company?.logoUrl}
                  userRole={userRole}
                />
              )}
            </>
          )}
        </div>
      </main>

      {/* Mobile Floating Bottom Nav (Auto-hides on scroll down) */}
      <MobileBottomNavWidget
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isVisible={isBottomNavVisible}
      />

      {/* Floating Barcode Scanner Camera (Mobile Phones) */}
      <BarcodeScannerWidget onProductFound={handleProductScanned} />

      {/* Scanned Product Details / Edit Drawer */}
      <RecordEditDrawerWidget
        isOpen={isScannedDrawerOpen}
        onClose={() => setIsScannedDrawerOpen(false)}
        recordType="item"
        recordData={scannedItem}
        allCategories={categories}
        userRole={userRole}
        onSaveSuccess={handleScannedDrawerSaveSuccess}
      />
    </div>
  );
}
