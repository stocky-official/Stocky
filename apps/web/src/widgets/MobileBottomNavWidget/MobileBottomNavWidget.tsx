'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import type { CompanyUserRole } from '@stocky/types';

export interface MobileBottomNavWidgetProps {
  activeTab: string;
  userRole?: CompanyUserRole;
  hidden?: boolean;
  onTabChange: (tabId: string) => void;
  userAvatarUrl?: string | null;
  userName?: string | null;
  notificationCount?: number;
  onPostClick?: () => void;
}

type NavItemId = 'dashboard' | 'stock' | 'suppliers' | 'attendance' | 'settings';

interface NavItemConfig {
  id: NavItemId;
  label: string;
  routeTab: string;
}

const NAV_ITEMS: NavItemConfig[] = [
  { id: 'dashboard', label: 'Dashboard', routeTab: 'home' },
  { id: 'stock', label: 'Stock', routeTab: 'stock' },
  { id: 'suppliers', label: 'Suppliers', routeTab: 'suppliers' },
  { id: 'attendance', label: 'Attendance', routeTab: 'attendance' },
  { id: 'settings', label: 'Settings', routeTab: 'settings' },
];

/**
 * MobileBottomNavWidget
 * 1-to-1 reproduction of the phone navigation bar in navbarphone.gif adapted for Stocky:
 * - 5 core operational pages: Dashboard, Stock, Suppliers, Attendance & Timesheets, Settings
 * - Edge-to-edge solid white bar with flat top line (#EAEAEA) and safe-area inset padding
 * - Elevated circular dark bubble (#191B1F, 50px) with 3.5px solid white ring that pops above the top edge
 * - Instant optimistic tab switching + route prefetching (zero perceived lag)
 * - Smooth Framer Motion spring physics (stiffness: 420, damping: 30)
 * - Micro-interactions:
 *   - Dashboard: layout quad-grid with subtle fill
 *   - Stock: 3D inventory package with sparkling star
 *   - Suppliers: delivery truck with spring drive micro-bounce
 *   - Attendance: calendar and timesheet schedule with glowing presence markers
 *   - Settings: sleek gear icon with spring rotation micro-animation
 */
export function MobileBottomNavWidget({
  activeTab,
  hidden = false,
  onTabChange,
  notificationCount = 0,
}: MobileBottomNavWidgetProps) {
  const router = useRouter();
  const [optimisticNavId, setOptimisticNavId] = useState<NavItemId | null>(null);

  // Map platform activeTab to the corresponding navigation destination
  const routeNavId = useMemo<NavItemId | null>(() => {
    if (
      activeTab === 'home' ||
      activeTab === 'dashboard' ||
      activeTab === 'logs' ||
      activeTab === 'activity'
    ) {
      return 'dashboard';
    }
    if (
      activeTab === 'stock' ||
      activeTab === 'inventory' ||
      activeTab === 'transfers' ||
      activeTab === 'expiry' ||
      activeTab === 'expiring' ||
      activeTab === 'tasks' ||
      activeTab === 'receive'
    ) {
      return 'stock';
    }
    if (activeTab === 'suppliers' || activeTab === 'supplier-requests') {
      return 'suppliers';
    }
    if (activeTab === 'attendance' || activeTab === 'timesheets') {
      return 'attendance';
    }
    if (activeTab === 'settings' || activeTab === 'team' || activeTab === 'locations') {
      return 'settings';
    }
    if (activeTab === 'notifications') {
      return null;
    }
    return 'dashboard';
  }, [activeTab]);

  // Reset optimistic state once the actual route tab catches up
  useEffect(() => {
    setOptimisticNavId(null);
  }, [activeTab]);

  const currentNavId = optimisticNavId ?? routeNavId;

  // Prefetch all platform tab routes on mobile so navigation is instant
  useEffect(() => {
    NAV_ITEMS.forEach((item) => {
      const path = item.routeTab === 'home' ? '/platform' : `/platform/${item.routeTab}`;
      router.prefetch(path);
    });
  }, [router]);

  const handleItemClick = (item: NavItemConfig) => {
    setOptimisticNavId(item.id);
    onTabChange(item.routeTab);
  };

  const renderInactiveIcon = (id: NavItemId) => {
    switch (id) {
      case 'dashboard':
        return (
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#191B1F"
            strokeWidth="1.85"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="7" height="9" x="3" y="3" rx="1.5" />
            <rect width="7" height="5" x="14" y="3" rx="1.5" />
            <rect width="7" height="9" x="14" y="12" rx="1.5" />
            <rect width="7" height="5" x="3" y="16" rx="1.5" />
          </svg>
        );
      case 'stock':
        return (
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#191B1F"
            strokeWidth="1.85"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
            <path d="m3.3 7 8.7 5 8.7-5" />
            <path d="M12 22V12" />
          </svg>
        );
      case 'suppliers':
        return (
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#191B1F"
            strokeWidth="1.85"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
            <path d="M15 18H9" />
            <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14v10Z" />
            <circle cx="7" cy="18" r="2" />
            <circle cx="17" cy="18" r="2" />
          </svg>
        );
      case 'attendance':
        return (
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#191B1F"
            strokeWidth="1.85"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="18" height="18" x="3" y="4" rx="2" />
            <line x1="16" x2="16" y1="2" y2="6" />
            <line x1="8" x2="8" y1="2" y2="6" />
            <line x1="3" x2="21" y1="10" y2="10" />
            <circle cx="8" cy="14" r="1" fill="#191B1F" stroke="none" />
            <circle cx="12" cy="14" r="1" fill="#191B1F" stroke="none" />
            <circle cx="16" cy="14" r="1" fill="#191B1F" stroke="none" />
            <circle cx="8" cy="18" r="1" fill="#191B1F" stroke="none" />
            <circle cx="12" cy="18" r="1" fill="#191B1F" stroke="none" />
            <circle cx="16" cy="18" r="1" fill="#191B1F" stroke="none" />
          </svg>
        );
      case 'settings':
        return (
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#191B1F"
            strokeWidth="1.85"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        );
    }
  };

  const renderActiveIcon = (id: NavItemId) => {
    switch (id) {
      case 'dashboard':
        return (
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.25 }}
            className="relative flex items-center justify-center"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="7" height="9" x="3" y="3" rx="1.5" fill="white" fillOpacity="0.25" />
              <rect width="7" height="5" x="14" y="3" rx="1.5" fill="white" fillOpacity="0.25" />
              <rect width="7" height="9" x="14" y="12" rx="1.5" fill="white" fillOpacity="0.25" />
              <rect width="7" height="5" x="3" y="16" rx="1.5" fill="white" fillOpacity="0.25" />
            </svg>
          </motion.div>
        );
      case 'stock':
        return (
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.25 }}
            className="relative flex items-center justify-center"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="1.85"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
              <path d="m3.3 7 8.7 5 8.7-5" />
              <path d="M12 22V12" />
              {/* 4-point sparkle star */}
              <path
                d="M17 4 C17 5.2 17 5.2 18.2 5.2 C17 5.2 17 5.2 17 6.4 C17 5.2 17 5.2 15.8 5.2 C17 5.2 17 5.2 17 4 Z"
                fill="white"
                stroke="none"
              />
            </svg>
          </motion.div>
        );
      case 'suppliers':
        return (
          <motion.div
            initial={{ x: -3, scale: 0.85 }}
            animate={{ x: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="relative flex items-center justify-center"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
              <path d="M15 18H9" />
              <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14v10Z" />
              <circle cx="7" cy="18" r="2" fill="white" />
              <circle cx="17" cy="18" r="2" fill="white" />
            </svg>
          </motion.div>
        );
      case 'attendance':
        return (
          <motion.div
            initial={{ scale: 0.85 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.25 }}
            className="relative flex items-center justify-center"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="1.85"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="18" height="18" x="3" y="4" rx="2" fill="white" fillOpacity="0.2" />
              <line x1="16" x2="16" y1="2" y2="6" />
              <line x1="8" x2="8" y1="2" y2="6" />
              <line x1="3" x2="21" y1="10" y2="10" />
              <circle cx="8" cy="14" r="1.2" fill="white" stroke="none" />
              <circle cx="12" cy="14" r="1.2" fill="white" stroke="none" />
              <circle cx="16" cy="14" r="1.2" fill="white" stroke="none" />
              <circle cx="8" cy="18" r="1.2" fill="white" stroke="none" />
              <circle cx="12" cy="18" r="1.2" fill="white" stroke="none" />
              <circle cx="16" cy="18" r="1.2" fill="white" stroke="none" />
            </svg>
          </motion.div>
        );
      case 'settings':
        return (
          <motion.div
            initial={{ rotate: -40, scale: 0.85 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 420, damping: 24 }}
            className="relative flex items-center justify-center"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </motion.div>
        );
    }
  };

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 md:hidden transition-transform duration-300 ease-out select-none ${
        hidden ? 'translate-y-[calc(100%+1rem)] pointer-events-none' : 'translate-y-0'
      }`}
      aria-label="Mobile navigation"
    >
      <nav className="relative bg-white border-t border-[#EAEAEA] shadow-[0_-2px_12px_rgba(0,0,0,0.04)] pb-[max(env(safe-area-inset-bottom),0.5rem)] overflow-visible">
        <div className="h-[62px] flex items-stretch relative px-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = currentNavId === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleItemClick(item)}
                aria-current={isActive ? 'page' : undefined}
                className="flex-1 relative flex flex-col items-center justify-end pb-2 pt-1 h-full cursor-pointer group focus:outline-none min-w-0"
              >
                {isActive ? (
                  <>
                    {/* Elevated circular bubble popping above navbar */}
                    <motion.div
                      layoutId="mobileActiveNavBubble"
                      className="absolute -top-3.5 w-[50px] h-[50px] rounded-full bg-[#191B1F] ring-[3.5px] ring-white shadow-[0_4px_14px_rgba(0,0,0,0.18)] flex items-center justify-center overflow-hidden z-10"
                      transition={{
                        type: 'spring',
                        stiffness: 420,
                        damping: 30,
                        mass: 0.8,
                      }}
                    >
                      {renderActiveIcon(item.id)}
                    </motion.div>
                    {/* Placeholder space in the default icon position */}
                    <div className="h-[24px] w-[24px] mb-1 opacity-0 pointer-events-none" aria-hidden="true" />
                  </>
                ) : (
                  <div className="h-[24px] w-[24px] mb-1 flex items-center justify-center transition-transform group-active:scale-90">
                    {renderInactiveIcon(item.id)}
                  </div>
                )}

                {/* Typography Label */}
                <span
                  className={`text-[10px] sm:text-[11px] tracking-tight leading-none transition-all truncate max-w-[70px] ${
                    isActive ? 'font-bold text-[#191B1F]' : 'font-medium text-[#191B1F]/75'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
