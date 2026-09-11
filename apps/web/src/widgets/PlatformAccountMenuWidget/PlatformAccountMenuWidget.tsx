'use client';

import React, { useEffect, useRef, useState } from 'react';
import { signInWithGoogle, signOutUser } from '@/lib/auth';
import { ChevronDownIcon, LogOutIcon, SettingsIcon } from '@stocky/icons';
import { UserAvatar } from '@/components/ui/UserAvatar';

export interface PlatformAccountMenuWidgetProps {
  userEmail?: string | null;
  userName?: string | null;
  userTitle?: string | null;
  userAvatarUrl?: string | null;
  onSettingsClick?: () => void;
  className?: string;
  menuPlacement?: 'bottom' | 'top';
}

function formatFallbackName(email?: string | null) {
  const localPart = email?.split('@')[0];
  if (!localPart) return 'Guest';

  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function PlatformAccountMenuWidget({
  userEmail,
  userName,
  userTitle,
  userAvatarUrl,
  onSettingsClick,
  className = '',
  menuPlacement = 'bottom',
}: PlatformAccountMenuWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const displayName = userName || formatFallbackName(userEmail);
  const displayTitle = userTitle || (userEmail ? 'Team member' : 'Sign in to Stocky');

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleSignIn = async () => {
    await signInWithGoogle('/platform');
  };

  const handleSignOut = async () => {
    setIsOpen(false);
    await signOutUser();
  };

  const handleTriggerClick = async () => {
    if (!userEmail) {
      await handleSignIn();
      return;
    }
    setIsOpen((current) => !current);
  };

  return (
    <div ref={menuRef} className={`relative min-w-0 ${className}`}>
      <button
        type="button"
        onClick={handleTriggerClick}
        className={`stocky-account-trigger ${isOpen ? 'stocky-account-trigger--open' : ''}`}
        title={userEmail ? `Account: ${userEmail}` : 'Sign in'}
        aria-label={userEmail ? 'Open account menu' : 'Sign in'}
        aria-expanded={userEmail ? isOpen : undefined}
        aria-haspopup={userEmail ? 'menu' : undefined}
      >
        <span className="stocky-account-trigger__avatar">
          <UserAvatar
            src={userAvatarUrl}
            name={displayName}
            email={userEmail}
            size="sm"
            className="w-full h-full border-0 rounded-full"
          />
        </span>
        <span className="stocky-account-trigger__copy">
          <span className="stocky-account-trigger__name">{displayName}</span>
          <span className="stocky-account-trigger__title">{displayTitle}</span>
        </span>
        <ChevronDownIcon size="xs" className={`stocky-account-trigger__chevron ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && userEmail && (
        <div
          role="menu"
          aria-label="Account menu"
          className={`stocky-account-menu stocky-dropdown-panel absolute z-50 w-60 rounded-xl border border-stocky-border-subtle bg-white p-1.5 ${menuPlacement === 'top' ? 'bottom-[calc(100%+6px)] left-0 top-auto' : 'right-0 top-[calc(100%+6px)]'}`}
        >
          <div className="border-b border-stocky-border-subtle px-3 py-2.5 mb-1.5">
            <p className="text-xs font-medium text-stocky-text-main truncate">{displayName}</p>
            <p className="text-[10px] text-stocky-text-sub truncate mt-0.5">{displayTitle}</p>
            <p className="text-[10px] text-stocky-text-sub truncate mt-0.5">{userEmail}</p>
          </div>
          <button type="button" role="menuitem" onClick={() => { setIsOpen(false); onSettingsClick?.(); }} className="stocky-dropdown-item w-full h-9 px-3 rounded-lg gap-2 text-stocky-text-main hover:bg-stocky-bg-global transition-colors cursor-pointer">
            <SettingsIcon size="xs" className="text-stocky-text-sub" />
            Settings
          </button>
          <button type="button" role="menuitem" onClick={handleSignOut} className="stocky-dropdown-item w-full h-9 px-3 rounded-lg gap-2 text-red-600 hover:bg-red-50 transition-colors cursor-pointer">
            <LogOutIcon size="xs" />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
