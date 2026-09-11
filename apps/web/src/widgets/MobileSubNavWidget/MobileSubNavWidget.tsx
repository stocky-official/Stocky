'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import type { CompanyUserRole } from '@stocky/types';
import { getActivePlatformGroup, getPlatformNavigation } from '../platformNavigation';

export interface MobileSubNavWidgetProps {
  activeTab: string;
  userRole: CompanyUserRole;
  hidden?: boolean;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export function MobileSubNavWidget({
  activeTab,
  userRole,
  hidden = false,
  onTabChange,
  className = '',
}: MobileSubNavWidgetProps) {
  const groups = useMemo(() => getPlatformNavigation(userRole), [userRole]);
  const activeGroup = getActivePlatformGroup(groups, activeTab);
  const activePillRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (activePillRef.current && typeof window !== 'undefined') {
      activePillRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [activeTab]);

  // Only display subtabs if the workspace has 2 or more operational views
  if (!activeGroup || activeGroup.items.length < 2) return null;

  return (
    <nav
      aria-label={`${activeGroup.label} navigation`}
      className={`stocky-mobile-subnav md:hidden w-full shrink-0 select-none z-30 transition-all duration-300 ease-out ${
        hidden ? 'stocky-mobile-subnav--hidden' : ''
      } ${className}`.trim()}
    >
      <div className="stocky-mobile-pill-rail flex items-center gap-1.5 overflow-x-auto px-4 py-2">
        {activeGroup.items.map((item) => {
          const isActive = item.id === activeTab;
          return (
            <button
              key={item.id}
              ref={isActive ? activePillRef : null}
              type="button"
              onClick={() => onTabChange(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`stocky-mobile-pill shrink-0 inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full text-xs font-medium cursor-pointer transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stocky-primary/40 ${
                isActive
                  ? 'stocky-mobile-pill--active'
                  : 'stocky-mobile-pill--inactive'
              }`}
            >
              {item.icon && (
                <span className={`shrink-0 transition-opacity ${isActive ? 'opacity-100' : 'opacity-65'}`}>
                  {item.icon}
                </span>
              )}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
