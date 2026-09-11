'use client';

import React, { useEffect, useState } from 'react';
import {
  BoxesIcon,
  SearchIcon,
  XIcon,
} from '@stocky/icons';
import { PlatformAccountMenuWidget } from '../PlatformAccountMenuWidget/PlatformAccountMenuWidget';

export interface PlatformTopBarWidgetProps {
  userEmail?: string | null;
  userName?: string | null;
  userTitle?: string | null;
  userAvatarUrl?: string | null;
  companyName?: string;
  companyLogoUrl?: string | null;
  searchValue?: string;
  onSearch?: (query: string) => void;
  onSettingsClick?: () => void;
  hidden?: boolean;
}

/**
 * PlatformTopBarWidget
 * Keeps global navigation actions in one predictable 48px-high utility bar.
 */
export function PlatformTopBarWidget({
  userEmail,
  userName,
  userTitle,
  userAvatarUrl,
  companyName,
  companyLogoUrl,
  searchValue = '',
  onSearch,
  onSettingsClick,
  hidden = false,
}: PlatformTopBarWidgetProps) {
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    setLogoFailed(false);
  }, [companyLogoUrl]);

  const handleSearchChange = (value: string) => {
    onSearch?.(value);
  };

  return (
    <header className={`stocky-topbar relative h-12 w-full shrink-0 bg-white border-b border-stocky-border-subtle flex items-center z-40 select-none transition-transform duration-300 ease-out ${hidden ? 'stocky-topbar--hidden' : 'translate-y-0'}`}>
      <div className="stocky-topbar-brand w-12 h-12 shrink-0 border-r border-stocky-border-subtle flex items-center justify-center">
        {companyLogoUrl && !logoFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={companyLogoUrl}
            alt={companyName || 'Stocky'}
            referrerPolicy="no-referrer"
            onError={() => setLogoFailed(true)}
            className="w-7 h-7 object-contain"
          />
        ) : (
          <div
            className="w-7 h-7 rounded-lg bg-stocky-primary text-white flex items-center justify-center"
            title={companyName || 'Stocky'}
          >
            <BoxesIcon size="xs" />
          </div>
        )}
      </div>

      <div className="stocky-topbar-mobile-search flex-1 min-w-0 px-2 sm:px-4 items-center md:hidden">
        <div className="relative w-full max-w-2xl">
          <SearchIcon
            size="xs"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-stocky-text-sub pointer-events-none"
          />
          <input
            type="search"
            value={searchValue}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Search products or barcodes..."
            aria-label="Search Stocky"
            className="w-full h-8 rounded-full bg-stocky-bg-global border border-stocky-border-subtle pl-8 pr-8 text-xs text-stocky-text-main placeholder:text-stocky-text-sub focus:outline-none focus:border-stocky-primary focus:ring-2 focus:ring-stocky-primary/10 transition-colors"
          />
          {searchValue && (
            <button
              type="button"
              onClick={() => handleSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stocky-text-sub hover:text-stocky-text-main p-0.5 cursor-pointer"
              title="Clear search"
              aria-label="Clear search"
            >
              <XIcon size="xs" />
            </button>
          )}
        </div>
      </div>

      <div className="stocky-topbar-account h-full flex items-center gap-0.5 px-1 sm:px-2 md:hidden">
        <PlatformAccountMenuWidget
          userEmail={userEmail}
          userName={userName}
          userTitle={userTitle}
          userAvatarUrl={userAvatarUrl}
          onSettingsClick={onSettingsClick}
        />
      </div>
    </header>
  );
}
