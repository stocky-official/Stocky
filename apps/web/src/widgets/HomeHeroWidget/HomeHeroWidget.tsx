'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  BarcodeIcon,
  BellIcon,
  CheckIcon,
  ChevronDownIcon,
  ArrowUpRightIcon,
  SearchIcon,
} from '@stocky/icons';
import type { Location } from '@stocky/types';
import { useTranslation } from '@/lib/i18n';
import { LanguageSwitcher } from '@/components/ui';

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

interface BranchSwitcherProps {
  locations: Location[];
  selectedLocationId: string;
  onSelectLocation: (id: string) => void;
  mobile?: boolean;
}

function BranchSwitcher({
  locations,
  selectedLocationId,
  onSelectLocation,
  mobile = false,
}: BranchSwitcherProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (locationId: string) => {
    onSelectLocation(locationId);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls="stocky-branch-menu"
        className={mobile
          ? 'inline-flex items-center gap-1 text-[11px] font-medium text-stocky-accent hover:text-stocky-accent/80 cursor-pointer transition-colors'
          : 'stocky-home-hero__glass-surface inline-flex items-center gap-1.5 text-xs font-medium text-stocky-accent hover:text-stocky-accent/80 cursor-pointer px-3 py-1.5 rounded-full transition-colors'}
      >
        <span className="inline-flex items-center gap-1">
          <ArrowUpRightIcon size="xs" className="rtl:rotate-180" />
          {t('home.switchBranch')}
        </span>
        <ChevronDownIcon
          size="xs"
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div
          id="stocky-branch-menu"
          role="listbox"
          aria-label={t('home.switchBranch')}
          className="absolute end-0 top-full z-50 mt-2 min-w-[220px] rounded-2xl border border-stocky-border-subtle bg-stocky-bg-widget p-1.5 text-start shadow-bevel-float"
        >
          <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-stocky-text-sub">
            {t('home.switchBranch')}
          </div>
          <button
            type="button"
            role="option"
            aria-selected={selectedLocationId === 'all'}
            onClick={() => handleSelect('all')}
            className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm text-stocky-text-main transition-colors hover:bg-stocky-bg-global"
          >
            <span>{t('home.allLocationsNetwork')}</span>
            {selectedLocationId === 'all' && <CheckIcon size="xs" className="text-stocky-accent" />}
          </button>
          {locations.map((location) => (
            <button
              key={location.id}
              type="button"
              role="option"
              aria-selected={selectedLocationId === location.id}
              onClick={() => handleSelect(location.id)}
              className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm text-stocky-text-main transition-colors hover:bg-stocky-bg-global"
            >
              <span className="truncate">{location.name}</span>
              {selectedLocationId === location.id && <CheckIcon size="xs" className="text-stocky-accent" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * HomeHeroWidget
 * Full-bleed solid luxury forest hero with Talabat-style smooth wavy bottom edge:
 * - Solid brand background extending flush to top, left, and right edges
 * - Fully circular company logo badge next to personalized greeting
 * - Clean branch switcher without redundant tags or dates
 * - Frosted pill search bar & notification bell below the greeting
 * - Smooth wavy organic SVG curve transitioning into the page canvas
 */
export function HomeHeroWidget({
  userName,
  locationName,
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
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    setLogoFailed(false);
  }, [companyLogoUrl]);

  const firstName = userName?.trim().split(/\s+/)[0] || 'Abdelrahman';
  const activeLocation = locations.find((l) => l.id === selectedLocationId);
  const displayLocation = locationName || t('home.allBranches');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim() && onSearch) {
      onSearch(searchQuery.trim());
    }
  };

  return (
    <div className="stocky-home-hero select-none relative overflow-visible">
      <div className="w-full max-w-[var(--stocky-page-max-width)] mx-auto px-4 sm:px-6 lg:px-8 pt-[max(1.25rem,calc(env(safe-area-inset-top,0px)+0.5rem))] pb-8 sm:pb-12 flex flex-col gap-4 sm:gap-5 relative z-10">
        {/* Row 1: Fully Circular Account Badge (Company Logo) + Greeting Typography */}
        <div className="flex items-center justify-between gap-4 w-full">
          <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
            {/* Fully Circular Company Logo Badge */}
            <div className="stocky-home-hero__logo-shell w-12 h-12 sm:w-14 sm:h-14 rounded-full p-1.5 shadow-md flex items-center justify-center shrink-0 overflow-hidden">
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
                <div className="w-full h-full rounded-full bg-stocky-primary text-stocky-text-inverse flex items-center justify-center font-bold text-base sm:text-lg tracking-tight">
                  {companyName ? companyName.charAt(0).toUpperCase() : 'K'}
                </div>
              )}
            </div>

            {/* Greeting Editorial */}
            <div className="flex flex-col min-w-0">
              <h2 className="text-xl sm:text-2xl lg:text-3xl text-stocky-text-inverse font-normal tracking-tight leading-snug">
                {t('home.greeting', { name: '' })}<bdi>{firstName}</bdi>
              </h2>
              <p className="stocky-home-hero__soft-text text-xs sm:text-sm font-normal mt-0.5">
                {t('home.liveStatus', { location: '' })}<bdi>{displayLocation}</bdi>
              </p>
            </div>
          </div>

          {/* Branch Switcher (Desktop Right-Aligned) */}
          {locations && locations.length > 0 && onSelectLocation && (
            <div className="relative hidden sm:flex items-center gap-2 shrink-0">
              <LanguageSwitcher variant="compact" />
              {locations.length > 1 && (
                <BranchSwitcher
                  locations={locations}
                  selectedLocationId={selectedLocationId || 'all'}
                  onSelectLocation={onSelectLocation}
                />
              )}
            </div>
          )}
        </div>

        {/* Row 2 (Mobile only): Clean Location & Branch Switcher */}
        {locations && locations.length > 0 && onSelectLocation && (
          <div className="stocky-home-hero__soft-text flex sm:hidden items-center justify-between text-xs px-1">
            <span className="font-medium text-stocky-text-inverse">{activeLocation ? activeLocation.name : displayLocation}</span>
            <div className="relative flex items-center gap-2">
              <LanguageSwitcher variant="compact" />
              {locations.length > 1 && (
                <BranchSwitcher
                  locations={locations}
                  selectedLocationId={selectedLocationId || 'all'}
                  onSelectLocation={onSelectLocation}
                  mobile
                />
              )}
            </div>
          </div>
        )}

        {/* Row 3: Frosted Search Bar with Embedded Scanner & Notification Bell (Below Greeting) */}
        <div className="flex items-center gap-2.5 w-full pt-1">
          <div className="stocky-home-hero__search-shell relative flex-1 flex items-center rounded-full transition-all shadow-xs">
            <SearchIcon size="sm" className="stocky-home-hero__muted-text absolute left-3.5 rtl:left-auto rtl:right-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('home.searchPlaceholder')}
              aria-label={t('home.searchPlaceholder')}
              className="stocky-home-hero__search-input w-full h-11 pl-10 pr-12 rtl:pl-12 rtl:pr-10 rounded-full text-xs font-medium outline-none"
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
              title={t('common.scan')}
              aria-label={t('common.scan')}
              className="stocky-home-hero__icon-button absolute right-2 rtl:right-auto rtl:left-2 w-7 h-7 rounded-full active:scale-95 flex items-center justify-center transition-all cursor-pointer"
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
              title={t('nav.notifications')}
              aria-label={`${t('nav.notifications')}${unreadNotificationsCount > 0 ? `, ${unreadNotificationsCount} unread` : ''}`}
              className="stocky-home-hero__glass-surface relative w-11 h-11 rounded-full active:scale-95 text-stocky-text-inverse flex items-center justify-center transition-all shrink-0 cursor-pointer shadow-xs"
            >
              <BellIcon size="sm" />
              {unreadNotificationsCount > 0 && (
                <span className="stocky-home-hero__notification-dot absolute top-2.5 right-2.5 rtl:right-auto rtl:left-2.5 w-2.5 h-2.5 rounded-full" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Smooth Wavy Bottom Edge (Talabat-style organic wave transition) */}
      <div className="absolute -bottom-px left-0 right-0 w-full overflow-hidden leading-none pointer-events-none z-20">
        <svg
          viewBox="0 0 1440 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          className="w-full h-6 sm:h-9 block text-stocky-bg-global"
        >
          <path
            d="M0,18 C220,38 460,38 720,22 C980,6 1220,20 1440,24 L1440,64 L0,64 Z"
            fill="currentColor"
          />
        </svg>
      </div>
    </div>
  );
}
