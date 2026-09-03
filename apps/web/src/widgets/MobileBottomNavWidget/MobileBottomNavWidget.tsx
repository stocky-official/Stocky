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
} from '@stocky/icons';

export interface MobileBottomNavWidgetProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  isVisible: boolean;
}

/**
 * MobileBottomNavWidget (v0.1.0 Design System)
 * Floating bottom navigation pill for mobile screens:
 * - Fixed bottom-4, centered with max-w-sm
 * - Smooth Framer Motion hide/reveal on scroll direction
 * - Instant tab switching
 */
export function MobileBottomNavWidget({
  activeTab,
  onTabChange,
  isVisible,
}: MobileBottomNavWidgetProps) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon size="xs" /> },
    { id: 'inventory', label: 'Inventory', icon: <BoxesIcon size="xs" /> },
    { id: 'branches', label: 'Branches', icon: <WarehouseIcon size="xs" /> },
    { id: 'suppliers', label: 'Suppliers', icon: <TruckIcon size="xs" /> },
    { id: 'alerts', label: 'Alerts', icon: <BellIcon size="xs" /> },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon size="xs" /> },
  ];

  return (
    <motion.nav
      initial={false}
      animate={{
        y: isVisible ? 0 : 96,
        opacity: isVisible ? 1 : 0,
      }}
      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
      className="fixed bottom-4 inset-x-4 max-w-sm mx-auto z-40 md:hidden bg-stocky-bg-widget border border-stocky-border-subtle rounded-widget p-1.5 flex items-center justify-between pointer-events-auto select-none"
      aria-label="Mobile Bottom Navigation"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-widget transition-colors cursor-pointer flex-1 ${
              isActive
                ? 'bg-stocky-primary text-white font-medium'
                : 'text-stocky-text-sub hover:text-stocky-text-main'
            }`}
          >
            <span className="shrink-0">{tab.icon}</span>
            <span className="text-[10px] mt-0.5 leading-none truncate max-w-[50px]">
              {tab.label}
            </span>
          </button>
        );
      })}
    </motion.nav>
  );
}
