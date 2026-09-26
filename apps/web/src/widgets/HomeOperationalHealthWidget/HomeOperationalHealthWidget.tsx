'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { AttendanceShift, Location, Product, StockLot, StockMovement, StockTask, StockTaskItem } from '@stocky/types';
import { useTranslation } from '@/lib/i18n';
import { HomeBranchMapChartWidget } from './HomeBranchMapChartWidget';
import { HomeTopMovingProductsChartWidget } from './HomeTopMovingProductsChartWidget';
import { HomeLaggingProductsChartWidget } from './HomeLaggingProductsChartWidget';
import { HomeBranchesAnalysisChartWidget } from './HomeBranchesAnalysisChartWidget';
import { HomeTeamAttendanceChartWidget } from './HomeTeamAttendanceChartWidget';
import { HomeDesktopAnalyticsWidget } from './HomeDesktopAnalyticsWidget';
import { HomeGlobalSlicersWidget, type RiskFilterOption, type TimeframeOption } from './HomeGlobalSlicersWidget';

export interface HomeOperationalHealthWidgetProps {
  locations?: Location[];
  products?: Product[];
  lots?: StockLot[];
  movements?: StockMovement[];
  tasks?: StockTask[];
  taskItems?: StockTaskItem[];
  shifts?: AttendanceShift[];
  teamMembers?: any[];
  teamAssignments?: any[];
  onOpenStock?: (locationId?: string) => void;
  onOpenProduct?: (productId: string) => void;
  onOpenAttendance?: () => void;
  onOpenExpiry?: () => void;
  canExport?: boolean;
  canViewCommercials?: boolean;
  selectedLocationId?: string;
  onLocationChange?: (locationId: string) => void;
}

export function HomeOperationalHealthWidget({
  locations = [],
  products = [],
  lots = [],
  movements = [],
  tasks = [],
  taskItems = [],
  shifts = [],
  teamMembers = [],
  teamAssignments = [],
  onOpenStock,
  onOpenProduct,
  onOpenAttendance,
  onOpenExpiry,
  canExport = true,
  canViewCommercials = true,
  selectedLocationId = 'all',
  onLocationChange,
}: HomeOperationalHealthWidgetProps) {
  const { t } = useTranslation();
  // Active slide index for mobile swipe carousel
  const [activeSlide, setActiveSlide] = useState<number>(0);
  const [mobileTimeframe, setMobileTimeframe] = useState<TimeframeOption>('30D');
  const [mobileCategory, setMobileCategory] = useState('all');
  const [mobileRisk, setMobileRisk] = useState<RiskFilterOption>('all');
  const [isDesktop, setIsDesktop] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const update = () => setIsDesktop(mediaQuery.matches);
    update();
    mediaQuery.addEventListener('change', update);
    return () => mediaQuery.removeEventListener('change', update);
  }, []);

  const mobileCategories = useMemo(() => Array.from(new Set(products.map((product) => product.categoryName).filter(Boolean))).sort(), [products]);
  const mobileScope = useMemo(() => {
    const days = mobileTimeframe === '7D' ? 7 : mobileTimeframe === '14D' ? 14 : mobileTimeframe === '90D' ? 90 : mobileTimeframe === 'YTD' ? 366 : 30;
    const cutoff = Date.now() - days * 86400000;
    const productIds = new Set(products.filter((product) => mobileCategory === 'all' || product.categoryName === mobileCategory).map((product) => product.id));
    const productMap = new Map(products.map((product) => [product.id, product]));
    const movementByLot = new Map<string, number>();
    movements.forEach((movement) => movementByLot.set(movement.stockLotId, Math.max(movementByLot.get(movement.stockLotId) || 0, new Date(movement.createdAt).getTime())));
    const visibleLots = lots.filter((lot) => {
      if (!productIds.has(lot.productId) || (selectedLocationId !== 'all' && lot.locationId !== selectedLocationId)) return false;
      if (mobileRisk === 'all') return true;
      if (mobileRisk === 'expiring') return Boolean(lot.expiryDate && new Date(lot.expiryDate).getTime() <= Date.now() + 30 * 86400000);
      if (mobileRisk === 'low_stock') return (lot.quantityOnHand || 0) <= (productMap.get(lot.productId)?.reorderPoint || 0);
      return (movementByLot.get(lot.id) || 0) < cutoff;
    });
    const visibleLotIds = new Set(visibleLots.map((lot) => lot.id));
    return {
      products: products.filter((product) => productIds.has(product.id)),
      lots: visibleLots,
      movements: movements.filter((movement) => productIds.has(movement.productId) && visibleLotIds.has(movement.stockLotId) && new Date(movement.createdAt).getTime() >= cutoff),
    };
  }, [lots, mobileCategory, mobileRisk, mobileTimeframe, movements, products, selectedLocationId]);

  const slides = [
    { id: 'map', label: t('home.branchNetwork') },
    { id: 'movers', label: t('home.topMovers') },
    { id: 'lagging', label: t('home.laggingStock') },
    { id: 'compare', label: t('home.branchCompare') },
    { id: 'attendance', label: t('home.attendance') },
  ];

  const handleScrollToSlide = (index: number) => {
    setActiveSlide(index);
    if (carouselRef.current) {
      const children = carouselRef.current.children;
      if (children[index]) {
        (children[index] as HTMLElement).scrollIntoView({
          behavior: 'smooth',
          inline: 'center',
          block: 'nearest',
        });
      }
    }
  };

  const handleScroll = () => {
    if (!carouselRef.current) return;
    const container = carouselRef.current;
    const children = Array.from(container.children) as HTMLElement[];
    const containerCenter = container.scrollLeft + container.clientWidth / 2;
    let closestIndex = 0;
    let minDistance = Infinity;
    children.forEach((child, idx) => {
      const childCenter = child.offsetLeft + child.clientWidth / 2;
      const distance = Math.abs(containerCenter - childCenter);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = idx;
      }
    });
    if (closestIndex !== activeSlide && closestIndex < slides.length) {
      setActiveSlide(closestIndex);
    }
  };

  return (
    <div className="w-full flex flex-col gap-3">
      {!isDesktop && <div>
        <HomeGlobalSlicersWidget
          locations={locations}
          categories={mobileCategories}
          selectedLocationId={selectedLocationId}
          onSelectLocation={(id) => onLocationChange?.(id)}
          timeframe={mobileTimeframe}
          onChangeTimeframe={setMobileTimeframe}
          selectedCategory={mobileCategory}
          onSelectCategory={setMobileCategory}
          selectedRiskFilter={mobileRisk}
          onSelectRiskFilter={setMobileRisk}
          onResetFilters={() => { setMobileTimeframe('30D'); setMobileCategory('all'); setMobileRisk('all'); onLocationChange?.('all'); }}
        />
      </div>}
      {/* 1. Mobile Phone View: Side-swiping Carousel with Snap Points (lg:hidden) */}
      {!isDesktop && <div
        ref={carouselRef}
        onScroll={handleScroll}
        className="flex lg:hidden overflow-x-auto snap-x snap-mandatory gap-3 scrollbar-none mx-0 px-0 pb-2"
      >
        {/* Slide 1: Map */}
        <div className="w-full max-w-full shrink-0 snap-center">
          <HomeBranchMapChartWidget
            locations={locations}
            lots={mobileScope.lots}
            teamMembers={teamMembers}
            teamAssignments={teamAssignments}
            shifts={shifts}
            canViewCommercials={canViewCommercials}
            onSelectLocation={onOpenStock}
          />
        </div>

        {/* Slide 2: Top Moving Products */}
        <div className="w-full max-w-full shrink-0 snap-center">
          <HomeTopMovingProductsChartWidget
            products={mobileScope.products}
            lots={mobileScope.lots}
            movements={mobileScope.movements}
            externalTimeframe={mobileTimeframe}
            externalLocationId={selectedLocationId}
            canExport={canExport}
            onOpenProduct={onOpenProduct}
          />
        </div>

        {/* Slide 3: Lagging Products */}
        <div className="w-full max-w-full shrink-0 snap-center">
          <HomeLaggingProductsChartWidget
            products={mobileScope.products}
            lots={mobileScope.lots}
            movements={mobileScope.movements}
            externalTimeframe={mobileTimeframe}
            externalLocationId={selectedLocationId}
            canViewCommercials={canViewCommercials}
            canExport={canExport}
            tasks={tasks}
            taskItems={taskItems}
            onOpenProduct={onOpenProduct}
          />
        </div>

        {/* Slide 4: Branch Comparative Analysis */}
        <div className="w-full max-w-full shrink-0 snap-center">
          <HomeBranchesAnalysisChartWidget
            locations={locations}
            lots={mobileScope.lots}
            movements={mobileScope.movements}
            tasks={tasks}
            teamMembers={teamMembers}
            teamAssignments={teamAssignments}
            canViewCommercials={canViewCommercials}
            canExport={canExport}
            onSelectLocation={onOpenStock}
            externalTimeframe={mobileTimeframe}
            externalLocationId={selectedLocationId}
          />
        </div>

        {/* Slide 5: Attendance Analysis */}
        <div className="w-full max-w-full shrink-0 snap-center">
          <HomeTeamAttendanceChartWidget
            shifts={shifts}
            locations={locations}
            teamMembers={teamMembers}
            teamAssignments={teamAssignments}
            onOpenAttendance={onOpenAttendance}
            canExport={canExport}
            externalTimeframe={mobileTimeframe}
            externalLocationId={selectedLocationId}
          />
        </div>
      </div>}

      {/* Mobile Swipe Pagination Dots (Phone only: flex lg:hidden) */}
      {!isDesktop && <div className="flex justify-center items-center gap-2 pt-1 pb-1">
        {slides.map((s, idx) => (
          <button
            key={s.id}
            type="button"
            onClick={() => handleScrollToSlide(idx)}
            className={`transition-all duration-200 cursor-pointer ${
              activeSlide === idx
                ? 'w-6 h-2 rounded-full bg-stocky-primary shadow-xs'
                : 'w-2 h-2 rounded-full bg-stocky-border-default hover:bg-stocky-text-sub'
            }`}
            aria-label={`Go to slide ${idx + 1}: ${s.label}`}
          />
        ))}
      </div>}

      {/* 2. Desktop View: Enterprise MECE Analytical Workspace (hidden lg:block) */}
      {isDesktop && <div className="w-full">
        <HomeDesktopAnalyticsWidget
          locations={locations}
          products={products}
          lots={lots}
          movements={movements}
          tasks={tasks}
          taskItems={taskItems}
          shifts={shifts}
          teamMembers={teamMembers}
          teamAssignments={teamAssignments}
          onOpenStock={onOpenStock}
          onOpenProduct={onOpenProduct}
          onOpenAttendance={onOpenAttendance}
          onOpenExpiry={onOpenExpiry}
          canExport={canExport}
          canViewCommercials={canViewCommercials}
          initialLocationId={selectedLocationId}
          onLocationChange={onLocationChange}
        />
      </div>}
    </div>
  );
}
