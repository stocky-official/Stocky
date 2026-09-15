'use client';

import React, { useRef, useState } from 'react';
import type { AttendanceShift, Location, Product, StockLot, StockMovement, StockTask, StockTaskItem } from '@stocky/types';
import { HomeBranchMapChartWidget } from './HomeBranchMapChartWidget';
import { HomeTopMovingProductsChartWidget } from './HomeTopMovingProductsChartWidget';
import { HomeLaggingProductsChartWidget } from './HomeLaggingProductsChartWidget';
import { HomeBranchesAnalysisChartWidget } from './HomeBranchesAnalysisChartWidget';
import { HomeTeamAttendanceChartWidget } from './HomeTeamAttendanceChartWidget';

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
}: HomeOperationalHealthWidgetProps) {
  // Active slide index for mobile swipe carousel
  const [activeSlide, setActiveSlide] = useState<number>(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  const slides = [
    { id: 'map', label: 'Branch Network' },
    { id: 'movers', label: 'Top Movers' },
    { id: 'lagging', label: 'Lagging Stock' },
    { id: 'compare', label: 'Branch Compare' },
    { id: 'attendance', label: 'Attendance' },
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
    const { scrollLeft, clientWidth } = carouselRef.current;
    const index = Math.round(scrollLeft / (clientWidth * 0.85));
    if (index >= 0 && index < slides.length && index !== activeSlide) {
      setActiveSlide(index);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Mobile Slide Jump Pills (Phone only: block lg:hidden) */}
      <div className="block lg:hidden w-full overflow-x-auto scrollbar-none pb-1">
        <div className="inline-flex items-center gap-1.5 bg-stocky-bg-widget p-1 rounded-xl border border-stocky-border-subtle">
          {slides.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              onClick={() => handleScrollToSlide(idx)}
              className={`h-7 px-3 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                activeSlide === idx
                  ? 'bg-stocky-primary text-white font-semibold shadow-xs'
                  : 'text-stocky-text-sub hover:text-stocky-text-main'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* 1. Mobile Phone View: Side-swiping Carousel with Snap Points (lg:hidden) */}
      <div
        ref={carouselRef}
        onScroll={handleScroll}
        className="flex lg:hidden overflow-x-auto snap-x snap-mandatory gap-4 scrollbar-none -mx-4 px-4 sm:-mx-6 sm:px-6 pb-2"
      >
        {/* Slide 1: Map */}
        <div className="w-[88vw] max-w-[345px] shrink-0 snap-center">
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
        <div className="w-[88vw] max-w-[345px] shrink-0 snap-center">
          <HomeTopMovingProductsChartWidget
            products={products}
            lots={lots}
            movements={movements}
            onOpenProduct={onOpenProduct}
          />
        </div>

        {/* Slide 3: Lagging Products */}
        <div className="w-[88vw] max-w-[345px] shrink-0 snap-center">
          <HomeLaggingProductsChartWidget
            products={products}
            lots={lots}
            tasks={tasks}
            taskItems={taskItems}
            onOpenProduct={onOpenProduct}
          />
        </div>

        {/* Slide 4: Branch Comparative Analysis */}
        <div className="w-[88vw] max-w-[345px] shrink-0 snap-center">
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
        <div className="w-[88vw] max-w-[345px] shrink-0 snap-center">
          <HomeTeamAttendanceChartWidget
            shifts={shifts}
            locations={locations}
            teamMembers={teamMembers}
            teamAssignments={teamAssignments}
            onOpenAttendance={onOpenAttendance}
          />
        </div>
      </div>

      {/* 2. Desktop View: Spacious Multi-Column Structured Dashboard Grid (hidden lg:grid) */}
      <div className="hidden lg:grid grid-cols-12 gap-5 sm:gap-6 w-full items-start">
        {/* Row 1: Branches Map (7 cols) + Branch Comparative Analysis (5 cols) */}
        <div className="col-span-7 flex flex-col">
          <HomeBranchMapChartWidget
            locations={locations}
            lots={lots}
            teamMembers={teamMembers}
            teamAssignments={teamAssignments}
            shifts={shifts}
            onSelectLocation={onOpenStock}
          />
        </div>

        <div className="col-span-5 flex flex-col">
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

        {/* Row 2: Top Moving Products (6 cols) + Lagging Products (6 cols) */}
        <div className="col-span-6 flex flex-col">
          <HomeTopMovingProductsChartWidget
            products={products}
            lots={lots}
            movements={movements}
            onOpenProduct={onOpenProduct}
          />
        </div>

        <div className="col-span-6 flex flex-col">
          <HomeLaggingProductsChartWidget
            products={products}
            lots={lots}
            tasks={tasks}
            taskItems={taskItems}
            onOpenProduct={onOpenProduct}
          />
        </div>

        {/* Row 3: Team Attendance Dynamics (Full 12 cols) */}
        <div className="col-span-12 flex flex-col">
          <HomeTeamAttendanceChartWidget
            shifts={shifts}
            locations={locations}
            teamMembers={teamMembers}
            teamAssignments={teamAssignments}
            onOpenAttendance={onOpenAttendance}
          />
        </div>
      </div>
    </div>
  );
}
