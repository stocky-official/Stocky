'use client';

import React from 'react';
import { BottomSheet } from './BottomSheet';
import { useTranslation } from '@/lib/i18n';

export interface ActionItem {
  id?: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  onClick: () => void;
  tone?: 'default' | 'critical';
  disabled?: boolean;
}

export interface ActionsBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  actions: ActionItem[];
  mobileOnly?: boolean;
}

/**
 * Standardized ActionsBottomSheet drawer.
 * Displays secondary page actions in a clean, thumb-friendly list
 * with icons, labels, and helper descriptions.
 */
export function ActionsBottomSheet({
  isOpen,
  onClose,
  title,
  subtitle,
  actions,
  mobileOnly = false,
}: ActionsBottomSheetProps) {
  const { t } = useTranslation();
  const resolvedTitle = title || t('common.actions');

  const handleActionClick = (action: ActionItem) => {
    if (action.disabled) return;
    onClose();
    action.onClick();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={resolvedTitle}
      subtitle={subtitle}
      panelClassName="sm:max-w-sm"
      mobileOnly={mobileOnly}
    >
      <div className="flex flex-col gap-1 py-1" role="menu">
        {actions.map((action, idx) => {
          const isCritical = action.tone === 'critical';
          return (
            <button
              key={action.id || action.label || idx}
              type="button"
              role="menuitem"
              disabled={action.disabled}
              onClick={() => handleActionClick(action)}
              className={`w-full flex items-center gap-3 p-2.5 rounded-2xl text-start transition-all duration-150 cursor-pointer select-none ${
                action.disabled
                  ? 'opacity-40 cursor-not-allowed'
                  : isCritical
                  ? 'hover:bg-stocky-status-critical-bg active:bg-stocky-status-critical-bg text-stocky-status-critical-fg'
                  : 'hover:bg-stocky-bg-global active:bg-stocky-border-subtle/50 text-stocky-text-main'
              }`}
            >
              {action.icon && (
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    isCritical
                      ? 'bg-stocky-status-critical-bg text-stocky-status-critical-fg'
                      : 'bg-stocky-bg-global text-stocky-text-main border border-stocky-border-subtle'
                  }`}
                >
                  {action.icon}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div
                  className={`text-xs font-semibold truncate ${
                    isCritical ? 'text-stocky-status-critical-fg' : 'text-stocky-text-main'
                  }`}
                >
                  {action.label}
                </div>
                {action.description && (
                  <div className="text-[11px] text-stocky-text-sub truncate mt-0.5">
                    {action.description}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </BottomSheet>
  );
}
