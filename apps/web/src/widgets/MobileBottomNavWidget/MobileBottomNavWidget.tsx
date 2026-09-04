'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  DashboardIcon,
  BoxesIcon,
  WarehouseIcon,
  TruckIcon,
  BellIcon,
  SettingsIcon,
  SearchIcon,
  SparklesIcon,
} from '@stocky/icons';

export interface MobileBottomNavWidgetProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  isVisible: boolean;
  onQuickSearch?: () => void;
  onQuickAudit?: () => void;
}

/**
 * MobileBottomNavWidget (Bevel-Elevated Design System)
 * Floating frosted glass dock with:
 * - Rounded-full capsule layout with 20px blur and specular border
 * - Floating "Search catalog or SKU..." capsule pill above dock
 * - Spring-animated tab highlights
 */
export function MobileBottomNavWidget({
  activeTab,
  onTabChange,
  isVisible,
  onQuickSearch,
  onQuickAudit,
}: MobileBottomNavWidgetProps) {
  const tabs = [
    { id: 'dashboard', label: 'Insights', icon: <DashboardIcon size="xs" /> },
    { id: 'inventory', label: 'Catalog', icon: <BoxesIcon size="xs" /> },
    { id: 'branches', label: 'Hubs', icon: <WarehouseIcon size="xs" /> },
    { id: 'suppliers', label: 'Vendors', icon: <TruckIcon size="xs" /> },
    { id: 'alerts', label: 'Alerts', icon: <BellIcon size="xs" /> },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon size="xs" /> },
  ];

  return (
    <motion.div
      initial={false}
      animate={{
        y: isVisible ? 0 : 120,
        opacity: isVisible ? 1 : 0,
      }}
      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
      className="fixed bottom-4 inset-x-4 max-w-sm mx-auto z-40 md:hidden flex flex-col gap-2 pointer-events-auto select-none"
    >
      {/* Floating Prompt Pill (Bevel "Ask Bevel anything" translated to Stocky catalog search) */}
      <div
        onClick={onQuickSearch || (() => onTabChange('inventory'))}
        className="bevel-glass-dock rounded-full py-2 px-4 flex items-center justify-between cursor-pointer shadow-bevel transition-all active:scale-98"
      >
        <div className="flex items-center gap-2 text-slate-500">
          <SparklesIcon size="xs" className="text-stocky-primary" />
          <span className="text-xs font-medium text-slate-700">
            Search catalog, SKU, barcode...
          </span>
        </div>
        <span className="text-[10px] font-medium bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200">
          ⌘K
        </span>
      </div>

      {/* Floating Frosted Glass Dock */}
      <nav
        className="bevel-glass-dock rounded-full p-1.5 flex items-center justify-between shadow-bevel-dock"
        aria-label="Mobile Bottom Navigation"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center py-2 px-2.5 rounded-full transition-all duration-200 cursor-pointer flex-1 ${
                isActive
                  ? 'bg-slate-900 text-white shadow-md font-semibold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span className="shrink-0">{tab.icon}</span>
              <span className="text-[9px] mt-0.5 leading-none truncate max-w-[45px]">
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </motion.div>
  );
}

