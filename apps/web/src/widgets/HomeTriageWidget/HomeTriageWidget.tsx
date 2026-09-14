'use client';

import React, { useState } from 'react';
import {
  AlertCircleIcon,
  ArrowUpDownIcon,
  CheckCircleIcon,
  ClockIcon,
  PlusIcon,
  SearchIcon,
  TruckIcon,
} from '@stocky/icons';

export interface UrgentTriageItem {
  id: string;
  type: 'expired' | 'expiring' | 'stockout' | 'task_review' | 'transfer_pending' | 'supplier_request';
  title: string;
  subtitle: string;
  priority: 'critical' | 'high' | 'medium';
  actionLabel: string;
  onAction: () => void;
}

export interface HomeTriageWidgetProps {
  items: UrgentTriageItem[];
  onSearch: (query: string) => void;
  onOpenReceive: () => void;
  onOpenCount: () => void;
  onOpenTransfers: () => void;
}

export function HomeTriageWidget({
  items,
  onSearch,
  onOpenReceive,
  onOpenCount,
  onOpenTransfers,
}: HomeTriageWidgetProps) {
  const [query, setQuery] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) {
      onSearch(query.trim());
    }
  };

  const getPriorityBadge = (priority: UrgentTriageItem['priority']) => {
    if (priority === 'critical') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase stocky-status-critical border">
          Critical
        </span>
      );
    }
    if (priority === 'high') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase stocky-status-warning border">
          High Priority
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase stocky-status-info border">
        Action Required
      </span>
    );
  };

  const getIcon = (type: UrgentTriageItem['type']) => {
    switch (type) {
      case 'expired':
        return <AlertCircleIcon size="xs" className="text-rose-600" />;
      case 'expiring':
        return <ClockIcon size="xs" className="text-amber-600" />;
      case 'stockout':
        return <AlertCircleIcon size="xs" className="text-amber-600" />;
      case 'task_review':
        return <CheckCircleIcon size="xs" className="text-emerald-600" />;
      case 'transfer_pending':
        return <ArrowUpDownIcon size="xs" className="text-blue-600" />;
      case 'supplier_request':
        return <TruckIcon size="xs" className="text-purple-600" />;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Top Search & Rapid Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-stocky-bg-widget rounded-2xl border border-stocky-border-subtle shadow-xs">
        <div className="relative flex-1 flex items-center">
          <SearchIcon size="xs" className="absolute left-3 text-stocky-text-sub pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Quick Spotlight Search (e.g. Milk, SKU #8812, Shelf B)..."
            className="w-full h-9 pl-9 pr-20 rounded-xl bg-stocky-bg-global border border-transparent focus:border-stocky-primary focus:bg-stocky-bg-widget text-xs font-medium text-stocky-text-main placeholder:text-stocky-text-sub/70 outline-none transition-all"
          />
          {query.trim() && (
            <button
              type="button"
              onClick={() => onSearch(query.trim())}
              className="absolute right-2 px-2 py-0.5 rounded-lg bg-stocky-primary text-white text-[11px] font-medium hover:bg-stocky-primary-hover cursor-pointer"
            >
              Search
            </button>
          )}
        </div>

        {/* Rapid Actions */}
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5 sm:pb-0">
          <button
            type="button"
            onClick={onOpenReceive}
            className="h-8 px-3 rounded-xl bg-stocky-accent hover:bg-stocky-accent-hover text-stocky-text-main text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors shadow-xs"
          >
            <PlusIcon size="xs" />
            <span>Receive stock</span>
          </button>
          <button
            type="button"
            onClick={onOpenCount}
            className="h-8 px-3 rounded-xl bg-stocky-bg-widget hover:bg-stocky-bg-global border border-stocky-border-subtle text-stocky-text-main text-xs font-medium inline-flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors"
          >
            <CheckCircleIcon size="xs" className="text-emerald-600" />
            <span>Count audit</span>
          </button>
          <button
            type="button"
            onClick={onOpenTransfers}
            className="h-8 px-3 rounded-xl bg-stocky-bg-widget hover:bg-stocky-bg-global border border-stocky-border-subtle text-stocky-text-main text-xs font-medium inline-flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors"
          >
            <ArrowUpDownIcon size="xs" className="text-blue-600" />
            <span>Transfer</span>
          </button>
        </div>
      </div>

      {/* Urgent Triage Deck */}
      {items.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-stocky-text-sub">
              Needs Immediate Attention ({items.length})
            </h2>
            <span className="text-[11px] text-stocky-text-sub font-medium">
              High-risk operational triage
            </span>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x">
            {items.map((item) => (
              <div
                key={item.id}
                className="snap-start min-w-[280px] sm:min-w-[320px] max-w-[340px] flex-1 rounded-2xl bg-stocky-bg-widget border border-stocky-border-subtle p-4 flex flex-col justify-between shadow-xs hover:border-stocky-border-default transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded-lg bg-stocky-bg-global shrink-0">
                        {getIcon(item.type)}
                      </span>
                      <span className="text-xs font-semibold text-stocky-text-main truncate">
                        {item.title}
                      </span>
                    </div>
                    {getPriorityBadge(item.priority)}
                  </div>
                  <p className="text-xs text-stocky-text-sub line-clamp-2 mt-1">
                    {item.subtitle}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-stocky-border-subtle flex items-center justify-end">
                  <button
                    type="button"
                    onClick={item.onAction}
                    className="h-7 px-3 rounded-lg bg-stocky-primary hover:bg-stocky-primary-hover text-white text-xs font-medium cursor-pointer transition-colors"
                  >
                    {item.actionLabel}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
