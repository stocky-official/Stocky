'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircleIcon,
  ArrowUpRightIcon,
  BoxesIcon,
  BoxIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  ClockIcon,
  RefreshIcon,
  ShieldIcon,
  UsersIcon,
  WarehouseIcon,
} from '@stocky/icons';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { supabase } from '@/lib/supabase/client';
import { ALLOWED_ADMIN_EMAIL } from './AdminAuthContext';
import { useTranslation } from '@/lib/i18n';

interface AdminStats {
  total_companies: number;
  verified_companies: number;
  pending_companies: number;
  rejected_companies: number;
  total_users: number;
  total_locations: number;
  total_products: number;
  total_lots: number;
}

interface PendingApplication {
  id: string;
  company_name: string;
  company_code: string | null;
  requested_email: string;
  initial_branch_name: string | null;
  status: string;
  created_at: string;
}

export function AdminDashboardView() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<AdminStats>({
    total_companies: 0,
    verified_companies: 0,
    pending_companies: 0,
    rejected_companies: 0,
    total_users: 0,
    total_locations: 0,
    total_products: 0,
    total_lots: 0,
  });
  const [pendingApplications, setPendingApplications] = useState<PendingApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      // 1. Fetch consolidated stats
      const [
        { count: totalCompanies },
        { count: verifiedCompanies },
        { count: pendingCount },
        { count: rejectedCount },
        { count: totalUsers },
        { count: totalLocations },
        { count: totalProducts },
        { count: totalLots },
      ] = await Promise.all([
        supabase.from('companies').select('*', { count: 'exact', head: true }),
        supabase.from('companies').select('*', { count: 'exact', head: true }).eq('status', 'verified'),
        supabase.from('company_applications').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('company_applications').select('*', { count: 'exact', head: true }).in('status', ['rejected', 'withdrawn']),
        supabase.from('company_users').select('*', { count: 'exact', head: true }),
        supabase.from('locations').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('stock_lots').select('*', { count: 'exact', head: true }),
      ]);

      setStats({
        total_companies: totalCompanies || 0,
        verified_companies: verifiedCompanies || 0,
        pending_companies: pendingCount || 0,
        rejected_companies: rejectedCount || 0,
        total_users: totalUsers || 0,
        total_locations: totalLocations || 0,
        total_products: totalProducts || 0,
        total_lots: totalLots || 0,
      });

      // 2. Fetch pending company applications for pipeline queue
      const { data: applications } = await supabase
        .from('company_applications')
        .select('id, company_name, company_code, requested_email, initial_branch_name, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      setPendingApplications((applications as PendingApplication[]) || []);
    } catch (err) {
      console.error('Failed to load admin dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const pendingList = pendingApplications.filter((app) => app.status === 'pending');

  return (
    <div className="space-y-6">
      {/* 2-Tier Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-stocky-text-main tracking-tight">
            Platform Overview
          </h1>
          <p className="text-xs sm:text-sm text-stocky-text-sub mt-1">
            Real-time tenant metrics, inventory volume, and system onboarding pipeline.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing || loading}
            icon={<RefreshIcon size="xs" className={refreshing ? 'animate-spin' : ''} />}
            className="rounded-full text-xs h-9"
          >
            Refresh
          </Button>
          <Link
            href="/admin/companies"
            className="h-9 px-4 rounded-full bg-stocky-accent text-stocky-text-main text-xs font-semibold hover:bg-stocky-accent-hover transition-colors inline-flex items-center gap-1.5 shadow-2xs"
          >
            <span>Manage Companies</span>
            <ChevronRightIcon size="xs" className="rtl:rotate-180" />
          </Link>
        </div>
      </header>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Total Companies */}
        <Card className="p-4 sm:p-5 bg-white border-stocky-border-subtle rounded-2xl shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stocky-text-sub">
              Total Companies
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-stocky-bg-global text-stocky-primary border border-stocky-border-subtle">
              <WarehouseIcon size="xs" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-bold text-stocky-text-main">
              {loading ? '—' : stats.total_companies}
            </span>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-stocky-text-sub">
              <span className="text-emerald-700 font-medium">{stats.verified_companies} verified</span>
              <span>·</span>
              <span className={stats.pending_companies > 0 ? 'text-amber-700 font-bold' : ''}>
                {stats.pending_companies} pending
              </span>
            </div>
          </div>
        </Card>

        {/* Total Platform Users */}
        <Card className="p-4 sm:p-5 bg-white border-stocky-border-subtle rounded-2xl shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stocky-text-sub">
              Platform Members
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-stocky-bg-global text-stocky-primary border border-stocky-border-subtle">
              <UsersIcon size="xs" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-bold text-stocky-text-main">
              {loading ? '—' : stats.total_users}
            </span>
            <p className="mt-1 text-[11px] text-stocky-text-sub">
              Active company owners & staff
            </p>
          </div>
        </Card>

        {/* Total Facilities */}
        <Card className="p-4 sm:p-5 bg-white border-stocky-border-subtle rounded-2xl shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stocky-text-sub">
              Active Facilities
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-stocky-bg-global text-stocky-primary border border-stocky-border-subtle">
              <BoxesIcon size="xs" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-bold text-stocky-text-main">
              {loading ? '—' : stats.total_locations}
            </span>
            <p className="mt-1 text-[11px] text-stocky-text-sub">
              Warehouses & Retail Branches
            </p>
          </div>
        </Card>

        {/* Catalog SKUs & Batches */}
        <Card className="p-4 sm:p-5 bg-white border-stocky-border-subtle rounded-2xl shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stocky-text-sub">
              Tracked Inventory
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-stocky-bg-global text-stocky-primary border border-stocky-border-subtle">
              <BoxIcon size="xs" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-bold text-stocky-text-main">
              {loading ? '—' : stats.total_products}
            </span>
            <p className="mt-1 text-[11px] text-stocky-text-sub">
              {stats.total_lots} active batch lots
            </p>
          </div>
        </Card>
      </div>

      {/* Pending Verifications Banner */}
      {stats.pending_companies > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-800 shrink-0">
              <AlertCircleIcon size="sm" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-amber-950">
                {stats.pending_companies} Company Application{stats.pending_companies > 1 ? 's' : ''} Awaiting Review
              </h2>
              <p className="text-xs text-amber-800 mt-0.5">
                New organizations have registered and require administrator verification before accessing platform operations.
              </p>
            </div>
          </div>
          <Link
            href="/admin/companies?status=pending"
            className="h-9 px-4 rounded-full bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold transition-colors shrink-0 inline-flex items-center justify-center gap-1.5 shadow-2xs"
          >
            <span>Review Applications</span>
            <ChevronRightIcon size="xs" className="rtl:rotate-180" />
          </Link>
        </div>
      )}

      {/* Two Column Layout: Application Queue & Platform Security Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left (cols 1-7): Recent Onboarding Pipeline */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-stocky-text-main">
              Recent Company Applications
            </h2>
            <Link
              href="/admin/companies"
              className="text-xs font-medium text-stocky-primary hover:underline inline-flex items-center gap-1"
            >
              <span>View all</span>
              <ChevronRightIcon size="xs" className="rtl:rotate-180" />
            </Link>
          </div>

          <Card className="p-0 bg-white border border-stocky-border-subtle rounded-2xl shadow-2xs overflow-hidden">
            {pendingApplications.length === 0 ? (
              <div className="p-8 text-center text-xs text-stocky-text-sub">
                No company applications recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-stocky-border-subtle">
                {pendingApplications.map((app) => (
                  <div
                    key={app.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stocky-bg-global/40 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-stocky-text-main truncate">
                          {app.company_name}
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                            app.status === 'pending'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : app.status === 'approved'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                        >
                          {app.status}
                        </span>
                      </div>
                      <p className="text-xs text-stocky-text-sub mt-0.5 truncate">
                        {app.company_code || 'No code'} · {app.initial_branch_name || 'Main'} · Requested by {app.requested_email}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <span className="text-[11px] text-stocky-text-sub">
                        {new Date(app.created_at).toLocaleDateString()}
                      </span>
                      <Link
                        href={`/admin/companies?id=${app.id}`}
                        className="h-8 px-3 rounded-full border border-stocky-border-subtle bg-white hover:border-stocky-primary hover:text-stocky-primary text-xs font-medium text-stocky-text-main transition-colors inline-flex items-center gap-1 shadow-2xs"
                      >
                        <span>Inspect</span>
                        <ArrowUpRightIcon size="xs" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right (cols 8-12): Security & System Telemetry */}
        <div className="lg:col-span-5 space-y-3">
          <h2 className="text-sm font-bold text-stocky-text-main">
            Security & System Guard
          </h2>

          <Card className="p-4 sm:p-5 bg-white border border-stocky-border-subtle rounded-2xl shadow-2xs space-y-4">
            <div className="flex items-start gap-3 pb-3 border-b border-stocky-border-subtle">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stocky-bg-global text-stocky-primary border border-stocky-border-subtle shrink-0">
                <ShieldIcon size="sm" />
              </div>
              <div>
                <span className="text-xs font-bold text-stocky-text-main block">
                  Single-Admin Whitelist Active
                </span>
                <p className="text-[11px] text-stocky-text-sub mt-0.5 leading-relaxed">
                  Platform admin privileges are locked exclusively to:
                </p>
                <code className="text-[11px] font-mono font-semibold text-stocky-primary bg-stocky-primary/10 px-2 py-0.5 rounded-md mt-1 inline-block">
                  {ALLOWED_ADMIN_EMAIL}
                </code>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-stocky-text-sub">
              <div className="flex items-center justify-between">
                <span>PostgreSQL RLS Multi-Tenant:</span>
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                  <CheckCircleIcon size="xs" /> Enforced
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Admin RPC Security Definer:</span>
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                  <CheckCircleIcon size="xs" /> Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Tenant Isolation Mode:</span>
                <span className="font-semibold text-stocky-text-main">Strict Company ID</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Storage Media Buckets:</span>
                <span className="font-semibold text-stocky-text-main">company-logos, locations</span>
              </div>
            </div>

            <div className="pt-3 border-t border-stocky-border-subtle">
              <Link
                href="/admin/settings"
                className="text-xs font-semibold text-stocky-primary hover:underline inline-flex items-center gap-1"
              >
                <span>View Security & Policy Settings</span>
                <ChevronRightIcon size="xs" className="rtl:rotate-180" />
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
