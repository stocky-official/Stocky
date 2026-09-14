'use client';

import React, { useState } from 'react';
import {
  BarcodeIcon,
  BellIcon,
  ChevronDownIcon,
  SearchIcon,
  WarehouseIcon,
} from '@stocky/icons';
import type { Location } from '@stocky/types';

export interface HomeHeaderWidgetProps {
  locationName: string;
  locations: Location[];
  selectedLocationId: string;
  onSelectLocation: (id: string) => void;
  onSearch: (query: string) => void;
  onOpenScanner?: () => void;
  onOpenNotifications?: () => void;
  unreadNotificationsCount?: number;
}

export function HomeHeaderWidget({
  locationName,
  locations,
  selectedLocationId,
  onSelectLocation,
  onSearch,
  onOpenScanner,
  onOpenNotifications,
  unreadNotificationsCount = 0,
}: HomeHeaderWidgetProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  const activeLocation = locations.find((l) => l.id === selectedLocationId);

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Pill Search Bar with Embedded Scanner & Notification Bell */}
      <div className="flex items-center gap-2.5 w-full">
        <div className="relative flex-1 flex items-center bg-stocky-bg-widget rounded-full border border-stocky-border-subtle shadow-xs hover:border-stocky-border-default transition-all focus-within:border-stocky-primary focus-within:ring-2 focus-within:ring-stocky-primary/10">
          <SearchIcon size="sm" className="absolute left-3.5 text-stocky-text-sub pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search Order, Product or SKU..."
            className="w-full h-11 pl-10 pr-12 rounded-full text-xs font-medium text-stocky-text-main placeholder:text-stocky-text-sub/70 outline-none bg-transparent"
          />

          {/* Embedded Barcode Scan Icon Button inside input */}
          <button
            type="button"
            data-testid="header-barcode-scan-btn"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (onOpenScanner) {
                onOpenScanner();
              } else {
                onSearch(searchQuery || 'scan');
              }
            }}
            title="Scan barcode with camera"
            className="absolute right-2.5 w-7 h-7 rounded-full bg-stocky-bg-global hover:bg-stocky-bg-hover text-stocky-text-main flex items-center justify-center transition-colors cursor-pointer"
          >
            <BarcodeIcon size="xs" />
          </button>
        </div>

        {/* Circular Notification Bell Icon Button */}
        {onOpenNotifications && (
          <button
            type="button"
            data-testid="header-notifications-btn"
            onClick={onOpenNotifications}
            title="Open notifications"
            className="relative w-11 h-11 rounded-full bg-stocky-bg-widget border border-stocky-border-subtle hover:border-stocky-border-default text-stocky-text-main flex items-center justify-center transition-colors shadow-xs shrink-0 cursor-pointer"
          >
            <BellIcon size="sm" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
            )}
          </button>
        )}
      </div>

      {/* Store Identity Sub-bar */}
      <div className="flex items-center justify-between text-xs px-1 text-stocky-text-sub">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-medium text-stocky-text-main">
            <span className="w-5 h-5 rounded-full bg-stocky-accent/20 text-stocky-text-main flex items-center justify-center text-[10px] font-semibold">
              K
            </span>
            <span>{activeLocation ? activeLocation.name : locationName || 'All Branches'}</span>
          </div>

          <span className="text-stocky-border-default">•</span>

          <div className="flex items-center gap-1 text-[11px] text-stocky-text-sub">
            <WarehouseIcon size="xs" />
            <span>Est. 2024</span>
          </div>
        </div>

        {/* Location Switcher */}
        <div className="relative flex items-center">
          <select
            value={selectedLocationId}
            onChange={(e) => onSelectLocation(e.target.value)}
            className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
          >
            <option value="all">All Locations (Network)</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-stocky-primary hover:underline cursor-pointer"
          >
            <span>↗ Switch Branch</span>
            <ChevronDownIcon size="xs" />
          </button>
        </div>
      </div>
    </div>
  );
}
