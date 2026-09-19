'use client';

import React from 'react';
import {
  CheckCircleIcon,
  LogOutIcon,
  ShieldIcon,
  StockyLogoIcon,
  UsersIcon,
  WarehouseIcon,
} from '@stocky/icons';
import { Card } from '@/components/ui/Card';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { LanguageSwitcher } from '@/components/ui';
import { ALLOWED_ADMIN_EMAIL, useAdminAuth } from './AdminAuthContext';
import { useTranslation } from '@/lib/i18n';

export function AdminSettingsView() {
  const { t } = useTranslation();
  const { user, adminEmail, signOut } = useAdminAuth();

  return (
    <div className="space-y-6 text-start">
      {/* 2-Tier Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-stocky-text-main tracking-tight">
            Platform & Security Settings
          </h1>
          <p className="text-xs sm:text-sm text-stocky-text-sub mt-1">
            Super administrator credentials, single-whitelist policy, and system health telemetry.
          </p>
        </div>

        <button
          type="button"
          onClick={signOut}
          className="h-9 px-4 rounded-full border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 text-xs font-semibold transition-colors inline-flex items-center gap-1.5 shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <LogOutIcon size="xs" />
          <span>Sign Out of Admin Console</span>
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (cols 1-7): Admin Identity & Whitelist Security */}
        <div className="lg:col-span-7 space-y-5">
          {/* Admin Identity Card */}
          <Card className="p-5 bg-white border border-stocky-border-subtle rounded-2xl shadow-2xs space-y-4">
            <span className="text-[11px] uppercase font-bold tracking-wider text-stocky-text-sub block">
              Super Administrator Profile
            </span>

            <div className="flex items-center gap-4">
              <UserAvatar
                name="Abdelrahman Mamdouh"
                email={adminEmail}
                size="lg"
                className="ring-2 ring-stocky-border-subtle shrink-0"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-stocky-text-main truncate">
                    Abdelrahman Mamdouh
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-stocky-primary/10 text-stocky-primary border border-stocky-primary/20">
                    <ShieldIcon size="xs" /> Super Admin
                  </span>
                </div>
                <span className="text-xs font-mono text-stocky-text-sub block mt-0.5">
                  {adminEmail}
                </span>
                <span className="text-[11px] text-stocky-text-sub block mt-1 font-mono">
                  UID: {user?.id || '5b01f8c0-1077-4c27-baf4-e60b436093d2'}
                </span>
              </div>
            </div>
          </Card>

          {/* Single-Admin Whitelist Policy Card */}
          <Card className="p-5 bg-white border border-stocky-border-subtle rounded-2xl shadow-2xs space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stocky-bg-global text-stocky-primary border border-stocky-border-subtle shrink-0">
                <ShieldIcon size="sm" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stocky-text-main">
                  Single Authorized Email Policy
                </h3>
                <p className="text-xs text-stocky-text-sub mt-1 leading-relaxed">
                  To ensure maximum governance and prevent accidental tenant elevation, the Stocky Admin Portal is strictly locked to a single administrator email address across all database RPCs and client-side guards.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-stocky-bg-global border border-stocky-border-subtle space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stocky-text-sub">Authorized Administrator:</span>
                <span className="font-mono font-bold text-stocky-text-main">
                  {ALLOWED_ADMIN_EMAIL}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-stocky-text-sub">Database Whitelist Enforcement:</span>
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                  <CheckCircleIcon size="xs" /> is_stocky_platform_admin()
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-stocky-text-sub">Client Route Guard:</span>
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                  <CheckCircleIcon size="xs" /> AdminShellLayout (403 Block)
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column (cols 8-12): Platform Environment & Localization */}
        <div className="lg:col-span-5 space-y-5">
          {/* Platform Environment Health */}
          <Card className="p-5 bg-white border border-stocky-border-subtle rounded-2xl shadow-2xs space-y-4">
            <span className="text-[11px] uppercase font-bold tracking-wider text-stocky-text-sub block">
              System & Database Telemetry
            </span>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-stocky-border-subtle">
                <span className="text-stocky-text-sub">Platform Edition:</span>
                <span className="font-semibold text-stocky-text-main">Stocky Enterprise V2</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-stocky-border-subtle">
                <span className="text-stocky-text-sub">Database Cluster:</span>
                <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                  <CheckCircleIcon size="xs" /> Supabase Pooler (eu-west-1)
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-stocky-border-subtle">
                <span className="text-stocky-text-sub">Multi-Tenant Isolation:</span>
                <span className="font-semibold text-stocky-text-main">PostgreSQL RLS Active</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-stocky-border-subtle">
                <span className="text-stocky-text-sub">Storage Buckets:</span>
                <span className="font-semibold text-stocky-text-main">company-logos, locations</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stocky-text-sub">App Environment:</span>
                <span className="font-mono text-[11px] bg-stocky-bg-global px-2 py-0.5 rounded border border-stocky-border-subtle">
                  {process.env.NODE_ENV}
                </span>
              </div>
            </div>
          </Card>

          {/* Localization Preferences */}
          <Card className="p-5 bg-white border border-stocky-border-subtle rounded-2xl shadow-2xs space-y-4">
            <span className="text-[11px] uppercase font-bold tracking-wider text-stocky-text-sub block">
              Localization & Cairo Font Preview
            </span>
            <p className="text-xs text-stocky-text-sub leading-relaxed">
              The admin console supports full bidirectional mirroring (RTL) in Arabic with Google Fonts <strong>Cairo</strong>.
            </p>

            <div className="pt-2">
              <LanguageSwitcher variant="sidebar" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
