'use client';

import React, { type UIEvent, useRef, useState, useEffect } from 'react';
import { PlatformProvider, usePlatform } from '@/views/platform/PlatformContext';
import { PageLayout } from '@/components/ui/PageLayout';
import { signOutUser } from '@/lib/auth';
import {
  BarcodeScannerWidget,
  MobileBottomNavWidget,
  MobileSubNavWidget,
  PlatformTopBarWidget,
  PlatformWorkspaceSkeleton,
  ProductEditDrawerWidget,
  ReceiveStockDrawerWidget,
  SidebarNavWidget,
} from '@/widgets';

function PlatformShell({ children }: { children?: React.ReactNode }) {
  const platform = usePlatform();
  const [isChromeVisible, setIsChromeVisible] = useState(true);
  const lastScrollTopRef = useRef(0);
  const chromeVisibilityRef = useRef(true);
  const chromeTransitionTimerRef = useRef<number | null>(null);

  const handleMainScroll = (event: UIEvent<HTMLElement>) => {
    const scroller = event.currentTarget;
    const nextScrollTop = scroller.scrollTop;
    if (chromeTransitionTimerRef.current !== null) {
      lastScrollTopRef.current = nextScrollTop;
      return;
    }
    const previousScrollTop = lastScrollTopRef.current;
    if (nextScrollTop <= 8 || nextScrollTop < previousScrollTop - 6) {
      if (!chromeVisibilityRef.current) {
        chromeVisibilityRef.current = true;
        setIsChromeVisible(true);
        chromeTransitionTimerRef.current = window.setTimeout(() => {
          chromeTransitionTimerRef.current = null;
          lastScrollTopRef.current = scroller.scrollTop;
        }, 240);
      }
    } else if (nextScrollTop > previousScrollTop + 6) {
      if (chromeVisibilityRef.current) {
        chromeVisibilityRef.current = false;
        setIsChromeVisible(false);
        chromeTransitionTimerRef.current = window.setTimeout(() => {
          chromeTransitionTimerRef.current = null;
          lastScrollTopRef.current = scroller.scrollTop;
        }, 240);
      }
    }
    lastScrollTopRef.current = nextScrollTop;
  };

  useEffect(() => {
    chromeVisibilityRef.current = true;
    setIsChromeVisible(true);
    lastScrollTopRef.current = 0;
  }, [platform.activeTab]);

  useEffect(() => () => {
    if (chromeTransitionTimerRef.current !== null) window.clearTimeout(chromeTransitionTimerRef.current);
  }, []);

  if (platform.unauthorizedTenant) {
    const { requestedCompanyName, requestedTenantCode, userCompanyName, userCompanyCode } = platform.unauthorizedTenant;
    const hasUserCompany = Boolean(userCompanyCode && userCompanyCode !== 'platform');
    return (
      <PageLayout className="stocky-platform-shell flex items-center justify-center min-h-screen p-4 bg-stocky-bg-global select-none">
        <div className="max-w-md w-full bg-white border border-stocky-border-subtle rounded-2xl p-6 shadow-bevel text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto text-xl font-bold">
            !
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-stocky-text-main">
              Workspace Access Restricted
            </h2>
            <p className="text-xs text-stocky-text-sub leading-relaxed">
              You are signed in as <span className="font-medium text-stocky-text-main">{platform.userEmail}</span>, but your account is not authorized to access the <span className="font-medium text-stocky-text-main">{requestedCompanyName || requestedTenantCode}</span> workspace.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2">
            {hasUserCompany ? (
              <button
                type="button"
                onClick={() => { window.location.href = `/${userCompanyCode}`; }}
                className="w-full py-2.5 px-4 rounded-xl bg-stocky-primary text-white text-xs font-medium hover:opacity-95 transition-opacity cursor-pointer shadow-sm"
              >
                Go to {userCompanyName} Workspace
              </button>
            ) : (
              <button
                type="button"
                onClick={() => { window.location.href = '/onboarding'; }}
                className="w-full py-2.5 px-4 rounded-xl bg-stocky-primary text-white text-xs font-medium hover:opacity-95 transition-opacity cursor-pointer shadow-sm"
              >
                Go to Onboarding
              </button>
            )}
            <button
              type="button"
              onClick={() => signOutUser()}
              className="w-full py-2.5 px-4 rounded-xl border border-stocky-border-subtle text-xs font-medium text-stocky-text-sub hover:bg-stocky-bg-global transition-colors cursor-pointer"
            >
              Sign Out / Switch Account
            </button>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout className="stocky-platform-shell">
      <PlatformTopBarWidget
        userEmail={platform.userEmail}
        userName={platform.userName}
        userTitle={platform.userTitle}
        userAvatarUrl={platform.userAvatarUrl}
        companyName={platform.company?.name}
        companyLogoUrl={platform.company?.logo_url}
        searchValue={platform.globalSearchQuery}
        hidden={!isChromeVisible}
        onSearch={(query) => {
          platform.setGlobalSearchQuery(query);
          if (query.trim()) platform.navigateToTab('stock');
        }}
        onSettingsClick={() => platform.navigateToTab('settings')}
      />
      <MobileSubNavWidget
        activeTab={platform.activeTab}
        userRole={platform.userRole}
        hidden={!isChromeVisible}
        onTabChange={platform.navigateToTab}
        supplierTab={platform.supplierTab}
        onSupplierTabChange={platform.setSupplierTab}
        taskTab={platform.taskTab}
        onTaskTabChange={platform.setTaskTab}
      />
      <div className="stocky-platform-body flex flex-1 min-h-0 min-w-0">
        <SidebarNavWidget
          activeTab={platform.activeTab}
          onTabChange={platform.navigateToTab}
          userRole={platform.userRole}
          companyName={platform.company?.name}
          companyLogoUrl={platform.company?.logo_url}
          notificationCount={platform.notificationItems.length}
          onNotificationsClick={() => platform.navigateToTab('notifications')}
          searchQuery={platform.globalSearchQuery}
          onSearch={(query) => {
            platform.setGlobalSearchQuery(query);
            if (query.trim()) platform.navigateToTab('stock');
          }}
          userEmail={platform.userEmail}
          userName={platform.userName}
          userTitle={platform.userTitle}
          userAvatarUrl={platform.userAvatarUrl}
          onSettingsClick={() => platform.navigateToTab('settings')}
        />
        <main
          className="stocky-platform-content flex-1 overflow-y-auto min-w-0"
          onScroll={handleMainScroll}
        >
          {platform.loading || !platform.companyId || !platform.userEmail ? (
            <PlatformWorkspaceSkeleton variant={platform.activeTab as any} />
          ) : (
            children
          )}
        </main>
      </div>
      <ReceiveStockDrawerWidget
        isOpen={platform.receiveOpen}
        onClose={() => platform.setReceiveOpen(false)}
        products={platform.products}
        locations={platform.visibleLocations}
        suppliers={platform.suppliers}
        companyId={platform.companyId}
        userRole={platform.userRole}
        defaultProductId={platform.receiveProductId}
        defaultProductSearch={platform.receiveProductSearch}
        defaultLocationId={platform.locationScope === 'all' ? platform.visibleLocations[0]?.id : platform.locationScope}
        onSaved={platform.refresh}
      />
      <ProductEditDrawerWidget
        isOpen={platform.productEditOpen}
        product={platform.editingProduct}
        categories={Array.from(new Set(platform.products.map((product) => product.categoryName).filter(Boolean)))}
        suppliers={platform.suppliers}
        onClose={platform.closeProductEdit}
        onSave={platform.updateProduct}
      />
      <BarcodeScannerWidget
        onProductFound={() => undefined}
        onBarcodeFound={(barcode) => {
          platform.setGlobalSearchQuery(barcode);
          platform.setTaskScanQuery(barcode);
          platform.navigateToTab('stock');
        }}
        onCodeNotFound={(barcode) => {
          platform.openReceive(undefined, barcode);
        }}
      />
      <MobileBottomNavWidget
        activeTab={platform.activeTab}
        userRole={platform.userRole}
        hidden={!isChromeVisible}
        onTabChange={platform.navigateToTab}
        userAvatarUrl={platform.userAvatarUrl}
        userName={platform.userName}
        notificationCount={platform.notificationItems.length}
        onPostClick={() => platform.openReceive()}
      />
    </PageLayout>
  );
}

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PlatformProvider tenantPrefix="/platform">
      <PlatformShell>{children}</PlatformShell>
    </PlatformProvider>
  );
}
