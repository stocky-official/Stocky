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
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
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
 * SidebarNavWidget (Bevel-Elevated Design System)
 * - Collapsed width: 64px (w-16) for balanced breathing room.
 * - Expands to 230px on hover or when pinned open.
 * - Stationary icon alignment with zero vertical or horizontal jumping.
 * - Deep slate / soft pill active indicator matching Bevel aesthetics.
 * - Hover tooltip when collapsed.
 * - Expand/collapse pin toggle.
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
  const [isPinned, setIsPinned] = useState(false);

  const isExpanded = isPinned || isHovered;

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
      initial={{ width: 64 }}
      animate={{ width: isExpanded ? 230 : 64 }}
      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="hidden md:flex h-full shrink-0 bg-white border-r border-slate-200/80 shadow-[1px_0_12px_rgba(0,0,0,0.02)] flex-col justify-between py-5 select-none overflow-hidden z-30"
      aria-label="Sidebar Navigation"
    >
      {/* Top Section: Brand Header & Main Nav */}
      <div className="space-y-6">
        {/* Brand Mark Tile */}
        <div className="h-11 flex items-center px-3 overflow-hidden">
          {companyLogoUrl ? (
            <div
              className="w-10 h-10 rounded-2xl border border-slate-200 bg-white overflow-hidden flex items-center justify-center shrink-0 shadow-sm"
              title={companyName || 'Organization Workspace'}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={companyLogoUrl}
                alt={companyName || 'Logo'}
                className="w-full h-full object-contain p-1"
              />
            </div>
          ) : (
            <div
              className="w-10 h-10 rounded-2xl bg-stocky-primary text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/20"
              title={companyName || 'Stocky Multi-Branch Platform'}
            >
              <BoxesIcon size="xs" />
            </div>
          )}

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="pl-3 min-w-0 flex-1 flex items-center justify-between whitespace-nowrap overflow-hidden"
              >
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-semibold text-slate-900 tracking-tight block truncate">
                    {companyName || 'Stocky'}
                  </span>
                  <span className="text-[10px] text-slate-400 block truncate">
                    {companyName ? 'Organization' : 'Inventory Platform'}
                  </span>
                </div>

                {/* Pin / Unpin toggle */}
                <button
                  type="button"
                  onClick={() => setIsPinned(!isPinned)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0 ml-1"
                  title={isPinned ? 'Unpin sidebar' : 'Pin sidebar open'}
                >
                  {isPinned ? <PanelLeftCloseIcon size="xs" /> : <PanelLeftOpenIcon size="xs" />}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Main Navigation Tabs */}
        <nav className="space-y-1.5 px-2.5" aria-label="Main Navigation Tabs">
          {mainTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <div key={tab.id} className="relative group">
                <button
                  type="button"
                  onClick={() => onTabChange(tab.id)}
                  className={`w-full h-10 flex items-center rounded-2xl text-xs transition-all duration-150 cursor-pointer overflow-hidden ${
                    isActive
                      ? 'bg-slate-900 text-white font-medium shadow-sm'
                      : 'text-slate-600 font-normal hover:bg-slate-100/90 hover:text-slate-900'
                  }`}
                >
                  {/* Stationary Icon Container */}
                  <span className="w-11 h-10 flex items-center justify-center shrink-0">
                    {tab.icon}
                  </span>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.span
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="truncate whitespace-nowrap pl-1.5 text-xs font-medium"
                      >
                        {tab.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>

                {/* Collapsed Tooltip */}
                {!isExpanded && (
                  <div className="absolute left-[70px] top-1/2 -translate-y-1/2 bg-slate-900 text-white text-[11px] font-medium px-2.5 py-1 rounded-xl shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50 border border-slate-800">
                    {tab.label}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Settings & User Account Profile */}
      <div className="space-y-2 pt-3 border-t border-slate-100 px-2.5">
        {/* Settings Tab */}
        <div className="relative group">
          <button
            type="button"
            onClick={() => onTabChange('settings')}
            className={`w-full h-10 flex items-center rounded-2xl text-xs transition-all duration-150 cursor-pointer overflow-hidden ${
              activeTab === 'settings'
                ? 'bg-slate-900 text-white font-medium shadow-sm'
                : 'text-slate-600 font-normal hover:bg-slate-100/90 hover:text-slate-900'
            }`}
          >
            <span className="w-11 h-10 flex items-center justify-center shrink-0">
              <SettingsIcon size="xs" />
            </span>

            <AnimatePresence>
              {isExpanded && (
                <motion.span
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="truncate whitespace-nowrap pl-1.5 text-xs font-medium"
                >
                  Settings
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {!isExpanded && (
            <div className="absolute left-[70px] top-1/2 -translate-y-1/2 bg-slate-900 text-white text-[11px] font-medium px-2.5 py-1 rounded-xl shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50 border border-slate-800">
              Settings
            </div>
          )}
        </div>

        {/* User Profile Avatar */}
        <div className="h-11 flex items-center px-0.5 overflow-hidden">
          <div
            className="w-10 h-10 rounded-2xl bg-slate-100 border border-slate-200/80 flex items-center justify-center text-xs font-semibold text-slate-700 shrink-0 shadow-2xs"
            title={userEmail ? `User: ${userEmail}` : 'Preview Mode'}
          >
            {userEmail ? userEmail.charAt(0).toUpperCase() : 'G'}
          </div>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="pl-2.5 flex-1 min-w-0 flex items-center justify-between gap-1 overflow-hidden"
              >
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] font-semibold text-slate-900 block truncate">
                    {userEmail || 'Guest Explorer'}
                  </span>
                  <span className="text-[9px] text-slate-400 block truncate">
                    {userEmail ? 'Active Session' : 'Preview Mode'}
                  </span>
                </div>

                {userEmail ? (
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="text-[10px] text-slate-400 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                    title="Sign out"
                  >
                    Exit
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      const origin = window.location.origin;
                      await supabase.auth.signInWithOAuth({
                        provider: 'google',
                        options: { redirectTo: `${origin}/auth/callback?next=/platform` },
                      });
                    }}
                    className="text-[10px] font-medium text-stocky-primary hover:text-stocky-primary-hover px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer shrink-0"
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
