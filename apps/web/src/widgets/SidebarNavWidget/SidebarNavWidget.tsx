'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase/client';
import {
  DashboardIcon,
  BoxesIcon,
  WarehouseIcon,
  TruckIcon,
  BellIcon,
  SettingsIcon,
} from '@stocky/icons';

export interface NavTabItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

export interface SidebarNavWidgetProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  userEmail?: string | null;
  companyName?: string;
  companyLogoUrl?: string | null;
}

/**
 * SidebarNavWidget (v0.1.0 Design System)
 * Collapsed width: strictly 48px (w-12).
 * Smoothly expands to 240px when hovered via Framer Motion spring physics.
 * Stationary icons (zero horizontal or vertical shifting between states).
 * Independent of global page scroll.
 */
export function SidebarNavWidget({
  activeTab,
  onTabChange,
  userEmail,
  companyName,
  companyLogoUrl,
}: SidebarNavWidgetProps) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);

  const mainTabs: NavTabItem[] = [
    {
      id: 'dashboard',
      label: 'Operations',
      icon: <DashboardIcon size="xs" />,
    },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: <BoxesIcon size="xs" />,
    },
    {
      id: 'branches',
      label: 'Stores & Branches',
      icon: <WarehouseIcon size="xs" />,
    },
    {
      id: 'suppliers',
      label: 'Suppliers',
      icon: <TruckIcon size="xs" />,
    },
    {
      id: 'alerts',
      label: 'Alerts',
      icon: <BellIcon size="xs" />,
    },
  ];

  const bottomTabs: NavTabItem[] = [
    {
      id: 'settings',
      label: 'Settings',
      icon: <SettingsIcon size="xs" />,
    },
  ];

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/');
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  return (
    <motion.aside
      initial={{ width: 48 }}
      animate={{ width: isHovered ? 240 : 48 }}
      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="hidden md:flex h-full shrink-0 bg-stocky-bg-widget border-r border-stocky-border-subtle flex-col justify-between py-4 select-none overflow-hidden z-30 shadow-none"
      aria-label="Sidebar Navigation"
    >
      {/* Top Brand Mark */}
      <div className="space-y-6">
        <div className="h-10 flex items-center px-1.5 overflow-hidden">
          {companyLogoUrl ? (
            <div
              className="w-9 h-9 rounded-widget border border-stocky-border-subtle bg-white overflow-hidden flex items-center justify-center shrink-0"
              title={companyName || 'Organization Workspace'}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={companyLogoUrl}
                alt={companyName || 'Logo'}
                className="w-full h-full object-contain p-0.5"
              />
            </div>
          ) : (
            <div
              className="w-9 h-9 rounded-widget bg-stocky-primary text-white flex items-center justify-center shrink-0"
              title={companyName || 'Stocky Multi-Branch Platform'}
            >
              <BoxesIcon size="xs" />
            </div>
          )}

          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="pl-2.5 min-w-0 flex-1 whitespace-nowrap overflow-hidden"
              >
                <span className="text-sm font-medium text-stocky-text-main tracking-tight block truncate">
                  {companyName || 'Stocky'}
                </span>
                <span className="text-[10px] font-normal text-stocky-text-sub block truncate">
                  {companyName ? 'Organization Workspace' : 'Multi-Branch Platform'}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation Tabs (Zero vertical shifting, no redundant Operations label) */}
        <nav className="space-y-1.5 px-1.5" aria-label="Main Navigation Tabs">
          {mainTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                title={tab.label}
                className={`w-full h-10 flex items-center rounded-widget text-xs transition-colors duration-150 cursor-pointer overflow-hidden ${
                  isActive
                    ? 'bg-stocky-primary text-white font-medium'
                    : 'text-stocky-text-sub font-normal hover:bg-stocky-bg-global hover:text-stocky-text-main'
                }`}
              >
                {/* Permanently anchored icon container - never shifts */}
                <span className="w-9 h-9 flex items-center justify-center shrink-0">
                  {tab.icon}
                </span>

                <AnimatePresence>
                  {isHovered && (
                    <motion.span
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="truncate whitespace-nowrap pl-2.5 font-normal"
                    >
                      {tab.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Area: Settings Tab & User Account */}
      <div className="space-y-2 pt-3 border-t border-stocky-border-subtle px-1.5">
        {/* Settings Tab */}
        <button
          onClick={() => onTabChange('settings')}
          title="Settings"
          className={`w-full h-10 flex items-center rounded-widget text-xs transition-colors duration-150 cursor-pointer overflow-hidden ${
            activeTab === 'settings'
              ? 'bg-stocky-primary text-white font-medium'
              : 'text-stocky-text-sub font-normal hover:bg-stocky-bg-global hover:text-stocky-text-main'
          }`}
        >
          <span className="w-9 h-9 flex items-center justify-center shrink-0">
            <SettingsIcon size="sm" />
          </span>

          <AnimatePresence>
            {isHovered && (
              <motion.span
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="truncate whitespace-nowrap pl-2.5 font-normal"
              >
                Settings
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* User Account / Avatar (Stationary, never jumps) */}
        <div className="h-10 flex items-center overflow-hidden">
          <div
            className="w-9 h-9 rounded-widget bg-stocky-bg-global border border-stocky-border-subtle flex items-center justify-center text-[11px] font-medium text-stocky-text-sub shrink-0"
            title={userEmail ? `User: ${userEmail}` : 'Preview Mode'}
          >
            {userEmail ? userEmail.charAt(0).toUpperCase() : 'G'}
          </div>

          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="pl-2.5 flex-1 min-w-0 flex items-center justify-between gap-1 overflow-hidden"
              >
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] font-medium text-stocky-text-main block truncate">
                    {userEmail || 'Guest Explorer'}
                  </span>
                  <span className="text-[9px] font-normal text-stocky-text-sub block truncate">
                    {userEmail ? 'Active Session' : 'Preview Mode'}
                  </span>
                </div>

                {userEmail ? (
                  <button
                    onClick={handleSignOut}
                    className="text-[10px] font-normal text-stocky-text-sub hover:text-red-600 px-1.5 py-0.5 rounded-widget hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                    title="Sign out"
                  >
                    Exit
                  </button>
                ) : (
                  <button
                    onClick={async () => {
                      const origin = window.location.origin;
                      await supabase.auth.signInWithOAuth({
                        provider: 'google',
                        options: { redirectTo: `${origin}/auth/callback?next=/platform` },
                      });
                    }}
                    className="text-[10px] font-medium text-stocky-primary hover:text-stocky-primary-hover px-2 py-0.5 rounded-widget bg-stocky-primary/10 hover:bg-stocky-primary/15 transition-colors cursor-pointer shrink-0"
                    title="Sign in with Google"
                  >
                    Login
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  );
}
