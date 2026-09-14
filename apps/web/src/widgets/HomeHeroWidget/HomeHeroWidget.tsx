'use client';

import React, { useEffect, useState } from 'react';
import {
  BarcodeIcon,
  BellIcon,
  ChevronDownIcon,
  SearchIcon,
} from '@stocky/icons';
import type { Location } from '@stocky/types';

export interface HomeHeroWidgetProps {
  userName?: string | null;
  locationName?: string;
  locations?: Location[];
  selectedLocationId?: string;
  companyName?: string;
  companyLogoUrl?: string | null;
  onSelectLocation?: (id: string) => void;
  onSearch?: (query: string) => void;
  onOpenScanner?: () => void;
  onOpenNotifications?: () => void;
  unreadNotificationsCount?: number;
}

/**
 * HomeHeroWidget
 * Standard luxury atmospheric hero card displaying:
 * - Fully circular company logo account badge next to "Hello {firstName},"
 * - Clean location switcher (without extra icons or dates)
 * - Frosted search bar with embedded barcode scanner button and circular notification bell below the greeting
 */
export function HomeHeroWidget({
  userName,
  locationName = 'All Branches',
  locations = [],
  selectedLocationId = 'all',
  companyName,
  companyLogoUrl,
  onSelectLocation,
  onSearch,
  onOpenScanner,
  onOpenNotifications,
  unreadNotificationsCount = 0,
}: HomeHeroWidgetProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    setLogoFailed(false);
  }, [companyLogoUrl]);

  const firstName = userName?.trim().split(/\s+/)[0] || 'Abdelrahman';
  const activeLocation = locations.find((l) => l.id === selectedLocationId);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim() && onSearch) {
      onSearch(searchQuery.trim());
    }
  };

  return (
    <div className="stocky-home-hero p-5 sm:p-7 select-none relative overflow-hidden flex flex-col gap-4 sm:gap-5">
      {/* Background Soft Atmospheric Glow Accents */}
      <div className="absolute -top-16 -right-16 w-56 h-56 bg-stocky-accent/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-stocky-primary/25 rounded-full blur-3xl pointer-events-none" />

      {/* Row 1: Fully Circular Account Badge (Company Logo) + Greeting Typography */}
      <div className="flex items-center justify-between gap-4 w-full relative z-10">
        <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
          {/* Fully Circular Company Logo Badge */}
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white p-1.5 shadow-md border border-white/30 flex items-center justify-center shrink-0 overflow-hidden">
            {companyLogoUrl && !logoFailed ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={companyLogoUrl}
                alt={companyName || 'Stocky'}
                referrerPolicy="no-referrer"
                onError={() => setLogoFailed(true)}
                className="w-full h-full object-contain rounded-full"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-stocky-primary text-white flex items-center justify-center font-bold text-base sm:text-lg tracking-tight">
                {companyName ? companyName.charAt(0).toUpperCase() : 'K'}
              </div>
            )}
          </div>

          {/* Greeting Editorial */}
          <div className="flex flex-col min-w-0">
            <h2 className="text-xl sm:text-2xl lg:text-3xl text-white font-normal tracking-tight leading-snug">
              Hello {firstName},
            </h2>
            <p className="text-white/80 text-xs sm:text-sm font-normal mt-0.5">
              Here is your live inventory status for <span className="text-white font-medium">{locationName || 'All Branches'}</span>.
            </p>
          </div>
        </div>

        {/* Branch Switcher (Desktop Right-Aligned) */}
        {locations && locations.length > 0 && onSelectLocation && (
          <div className="relative hidden sm:flex items-center shrink-0">
            <select
              value={selectedLocationId || 'all'}
              onChange={(e) => onSelectLocation(e.target.value)}
              aria-label="Switch location"
              className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
            >
              <option value="all">All Locations (Network)</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id} className="text-gray-900 bg-white">
                  {loc.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-stocky-accent hover:underline cursor-pointer bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-full border border-white/15 transition-colors backdrop-blur-md"
            >
              <span>↗ Switch Branch</span>
              <ChevronDownIcon size="xs" />
            </button>
          </div>
        )}
      </div>

      {/* Row 2 (Mobile only): Clean Location & Branch Switcher */}
      {locations && locations.length > 0 && onSelectLocation && (
        <div className="flex sm:hidden items-center justify-between text-xs px-1 text-white/80 relative z-10">
          <span className="font-medium text-white">{activeLocation ? activeLocation.name : locationName || 'All Branches'}</span>
          <div className="relative flex items-center">
            <select
              value={selectedLocationId || 'all'}
              onChange={(e) => onSelectLocation(e.target.value)}
              aria-label="Switch location"
              className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
            >
              <option value="all">All Locations (Network)</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id} className="text-gray-900 bg-white">
                  {loc.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-stocky-accent hover:underline cursor-pointer"
            >
              <span>↗ Switch Branch</span>
              <ChevronDownIcon size="xs" />
            </button>
          </div>
        </div>
      )}

      {/* Row 3: Frosted Search Bar with Embedded Scanner & Notification Bell (Below Greeting) */}
      <div className="flex items-center gap-2.5 w-full relative z-10 pt-1">
        <div className="relative flex-1 flex items-center bg-white/10 hover:bg-white/15 focus-within:bg-white/20 rounded-full border border-white/15 focus-within:border-white/30 backdrop-blur-md transition-all shadow-xs">
          <SearchIcon size="sm" className="absolute left-3.5 text-white/60 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search Order, Product or SKU..."
            aria-label="Search Order, Product or SKU"
            className="w-full h-11 pl-10 pr-12 rounded-full text-xs font-medium text-white placeholder:text-white/50 outline-none bg-transparent"
          />

          {/* Embedded Barcode Scan Icon Button */}
          <button
            type="button"
            data-testid="header-barcode-scan-btn"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (onOpenScanner) {
                onOpenScanner();
              } else if (onSearch) {
                onSearch(searchQuery || 'scan');
              }
            }}
            title="Scan barcode with camera"
            aria-label="Scan barcode with camera"
            className="absolute right-2 w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <BarcodeIcon size="xs" />
          </button>
        </div>

        {/* Circular Notification Bell Button */}
        {onOpenNotifications && (
          <button
            type="button"
            data-testid="header-notifications-btn"
            onClick={onOpenNotifications}
            title="Open notifications"
            aria-label={`Notifications${unreadNotificationsCount > 0 ? `, ${unreadNotificationsCount} unread` : ''}`}
            className="relative w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 border border-white/15 text-white flex items-center justify-center transition-all backdrop-blur-md shrink-0 cursor-pointer shadow-xs"
          >
            <BellIcon size="sm" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-black/40" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
