'use client';

import React, { useState } from 'react';
import { SearchIcon, BellIcon, XIcon } from '@stocky/icons';
import { signInWithGoogle, signOutUser } from '@/lib/auth';

export interface MobileTopBarWidgetProps {
  userEmail?: string | null;
  onSearch?: (query: string) => void;
  onNotificationsClick?: () => void;
  onProfileClick?: () => void;
}

/**
 * MobileTopBarWidget (v0.1.0 Design System)
 * Fixed top bar on mobile screens with:
 * - User profile avatar icon
 * - Compact integrated search bar with clear button
 * - Notification bell icon with unread indicator
 */
export function MobileTopBarWidget({
  userEmail,
  onSearch,
  onNotificationsClick,
  onProfileClick,
}: MobileTopBarWidgetProps) {
  const [searchValue, setSearchValue] = useState('');

  const handleSearchChange = (val: string) => {
    setSearchValue(val);
    if (onSearch) onSearch(val);
  };

  const handleClear = () => {
    setSearchValue('');
    if (onSearch) onSearch('');
  };

  const handleProfilePress = async () => {
    if (onProfileClick) {
      onProfileClick();
      return;
    }
    if (!userEmail) {
      await signInWithGoogle('/platform');
    } else {
      await signOutUser();
    }
  };

  return (
    <header className="h-14 px-3.5 bg-stocky-bg-widget border-b border-stocky-border-subtle flex items-center justify-between gap-2.5 shrink-0 sticky top-0 z-30 md:hidden select-none">
      {/* 1. User Profile Icon */}
      <button
        type="button"
        onClick={handleProfilePress}
        className="w-8 h-8 rounded-widget bg-stocky-bg-global border border-stocky-border-subtle flex items-center justify-center text-xs font-medium text-stocky-text-sub shrink-0 cursor-pointer"
        title={userEmail ? `User: ${userEmail}` : 'Sign in'}
      >
        {userEmail ? userEmail.charAt(0).toUpperCase() : 'G'}
      </button>

      {/* 2. Compact Search Bar */}
      <div className="relative flex-1 min-w-0">
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stocky-text-sub pointer-events-none">
          <SearchIcon size="xs" />
        </span>
        <input
          type="text"
          placeholder="Search catalog, suppliers..."
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full h-8 bg-stocky-bg-global border border-stocky-border-subtle rounded-widget pl-7 pr-7 text-xs text-stocky-text-main placeholder:text-stocky-text-sub focus:outline-none focus:border-stocky-primary transition-colors"
        />
        {searchValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-stocky-text-sub hover:text-stocky-text-main p-0.5 cursor-pointer"
            title="Clear search"
          >
            <XIcon size="xs" />
          </button>
        )}
      </div>

      {/* 3. Notification Bell Icon */}
      <button
        type="button"
        onClick={onNotificationsClick}
        className="relative w-8 h-8 rounded-widget bg-stocky-bg-global border border-stocky-border-subtle flex items-center justify-center text-stocky-text-sub hover:text-stocky-text-main shrink-0 cursor-pointer"
        title="Notifications"
      >
        <BellIcon size="xs" />
        {/* Unread indicator dot */}
        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-stocky-primary" />
      </button>
    </header>
  );
}
