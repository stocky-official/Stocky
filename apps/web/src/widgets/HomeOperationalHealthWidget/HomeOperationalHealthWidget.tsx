'use client';

import React, { useRef, useState } from 'react';
import type { AttendanceShift, Location, Product, StockLot, StockMovement, StockTask, StockTaskItem } from '@stocky/types';
import { useTranslation } from '@/lib/i18n';
import { HomeBranchMapChartWidget } from './HomeBranchMapChartWidget';
import { HomeTopMovingProductsChartWidget } from './HomeTopMovingProductsChartWidget';
import { HomeLaggingProductsChartWidget } from './HomeLaggingProductsChartWidget';
import { HomeBranchesAnalysisChartWidget } from './HomeBranchesAnalysisChartWidget';
import { HomeTeamAttendanceChartWidget } from './HomeTeamAttendanceChartWidget';
import { HomeDesktopAnalyticsWidget } from './HomeDesktopAnalyticsWidget';

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
}: HomeOperationalHealthWidgetProps) {
  const { t } = useTranslation();
  // Active slide index for mobile swipe carousel
  const [activeSlide, setActiveSlide] = useState<number>(0);
  const carouselRef = useRef<HTMLDivElement>(null);

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
      {/* 1. Mobile Phone View: Side-swiping Carousel with Snap Points (lg:hidden) */}
      <div
        ref={carouselRef}
        onScroll={handleScroll}
        className="flex lg:hidden overflow-x-auto snap-x snap-mandatory gap-4 scrollbar-none -mx-4 px-4 sm:-mx-6 sm:px-6 pb-2"
      >
        {/* Slide 1: Map */}
        <div className="w-[calc(100vw-2rem)] max-w-full shrink-0 snap-center">
          <HomeBranchMapChartWidget
            locations={locations}
            lots={lots}
            teamMembers={teamMembers}
            teamAssignments={teamAssignments}
            shifts={shifts}
            onSelectLocation={onOpenStock}
          />
        </div>

        {/* Slide 2: Top Moving Products */}
        <div className="w-[calc(100vw-2rem)] max-w-full shrink-0 snap-center">
          <HomeTopMovingProductsChartWidget
            products={products}
            lots={lots}
            movements={movements}
            onOpenProduct={onOpenProduct}
          />
        </div>

        {/* Slide 3: Lagging Products */}
        <div className="w-[calc(100vw-2rem)] max-w-full shrink-0 snap-center">
          <HomeLaggingProductsChartWidget
            products={products}
            lots={lots}
            tasks={tasks}
            taskItems={taskItems}
            onOpenProduct={onOpenProduct}
          />
        </div>

        {/* Slide 4: Branch Comparative Analysis */}
        <div className="w-[calc(100vw-2rem)] max-w-full shrink-0 snap-center">
          <HomeBranchesAnalysisChartWidget
            locations={locations}
            lots={lots}
            movements={movements}
            tasks={tasks}
            teamMembers={teamMembers}
            teamAssignments={teamAssignments}
            onSelectLocation={onOpenStock}
          />
        </div>

        {/* Slide 5: Attendance Analysis */}
        <div className="w-[calc(100vw-2rem)] max-w-full shrink-0 snap-center">
          <HomeTeamAttendanceChartWidget
            shifts={shifts}
            locations={locations}
            teamMembers={teamMembers}
            teamAssignments={teamAssignments}
            onOpenAttendance={onOpenAttendance}
          />
        </div>
      </div>

      {/* Mobile Swipe Pagination Dots (Phone only: flex lg:hidden) */}
      <div className="flex lg:hidden justify-center items-center gap-2 pt-1 pb-1">
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
      </div>

      {/* 2. Desktop View: Enterprise MECE Analytical Workspace (hidden lg:block) */}
      <div className="hidden lg:block w-full">
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
        />
      </div>
    </div>
  );
}
