'use client';

import React from 'react';
import Link from 'next/link';
import { BoxesIcon } from '@stocky/icons';
import { LandingHeroWidget } from '@/widgets/LandingHeroWidget/LandingHeroWidget';

/**
 * LandingView (PageView)
 * Conforms to Critical Rule 5:
 * Controls the overall structure of the landing page and embeds LandingHeroWidget.
 */
export function LandingView() {
  return (
    <div className="min-h-screen bg-stocky-bg-global flex flex-col justify-between">
      {/* Top Brand Bar */}
      <header className="h-16 px-6 sm:px-12 flex items-center justify-between border-b border-stocky-border-subtle bg-stocky-bg-widget">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-widget bg-stocky-primary text-white flex items-center justify-center">
            <BoxesIcon size="sm" />
          </div>
          <span className="text-base font-medium text-stocky-text-main tracking-tight">
            Stocky
          </span>
        </div>

        <div className="text-xs text-stocky-text-sub font-normal">
          v0.1.0 Alpha
        </div>
      </header>

      {/* Main Landing Body */}
      <main className="flex-1 flex items-center justify-center p-6 sm:p-12 max-w-view w-full mx-auto">
        <LandingHeroWidget />
      </main>

      {/* Subtle Footer */}
      <footer className="py-6 px-6 text-center text-xs font-light text-stocky-text-sub border-t border-stocky-border-subtle bg-stocky-bg-widget">
        Stocky • Modern Stock & Inventory Management
      </footer>
    </div>
  );
}
