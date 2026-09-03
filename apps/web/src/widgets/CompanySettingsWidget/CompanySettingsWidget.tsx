'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { TeamManagementWidget } from '../TeamManagementWidget/TeamManagementWidget';
import type { Branch, CompanyUserRole } from '@stocky/types';

export interface CompanySettingsWidgetProps {
  branches: Branch[];
  userEmail?: string | null;
  companyId?: string;
  companyName?: string;
  companyCode?: string | null;
  companyLogoUrl?: string | null;
  userRole?: CompanyUserRole;
}

/**
 * CompanySettingsWidget (v0.1.0 Design System)
 * Displays company profile, organization branding, and team permissions management.
 */
export function CompanySettingsWidget({
  branches,
  userEmail,
  companyId,
  companyName = 'Circle K',
  companyCode = 'CRK',
  companyLogoUrl,
  userRole = 'owner',
}: CompanySettingsWidgetProps) {
  return (
    <div className="space-y-6">
      {/* Company Profile & Authorizations Overview */}
      <Card className="p-5 bg-stocky-bg-widget border border-stocky-border-subtle rounded-widget space-y-4">
        <div className="border-b border-stocky-border-subtle pb-3">
          <h2 className="text-base font-medium text-stocky-text-main">
            Company Organization
          </h2>
          <p className="text-xs font-normal text-stocky-text-sub mt-0.5">
            Manage your organization entity, users, and operational permissions
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-widget bg-stocky-bg-global border border-stocky-border-subtle space-y-2">
            <span className="text-[11px] font-medium text-stocky-text-sub uppercase tracking-wider block">
              Organization
            </span>
            <div className="flex items-center gap-2.5">
              {companyLogoUrl && (
                <div className="w-8 h-8 rounded-widget border border-stocky-border-subtle bg-white overflow-hidden shrink-0 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={companyLogoUrl}
                    alt={companyName}
                    className="w-full h-full object-contain p-0.5"
                  />
                </div>
              )}
              <span className="text-sm font-medium text-stocky-text-main block">
                {companyName}
              </span>
            </div>
            <span className="text-xs text-stocky-text-sub block">
              Company Code: {companyCode || 'N/A'} • Live Database
            </span>
          </div>

          <div className="p-4 rounded-widget bg-stocky-bg-global border border-stocky-border-subtle space-y-2">
            <span className="text-[11px] font-medium text-stocky-text-sub uppercase tracking-wider block">
              Active User Session
            </span>
            <span className="text-sm font-medium text-stocky-text-main block">
              {userEmail || 'stocky.admin@gmail.com'}
            </span>
            <div className="flex flex-wrap gap-2 pt-1">
              <Badge className="bg-stocky-primary/10 text-stocky-primary border-stocky-primary/20">
                Role: {userRole === 'owner' ? 'Owner' : userRole === 'admin' ? 'Admin' : userRole === 'manager' ? 'Branch Manager' : 'Staff'}
              </Badge>
              <Badge className="bg-green-50 text-green-700 border-green-200">
                Tenant: {companyName} ({companyCode || 'CRK'})
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Team & RBAC Member Management */}
      <TeamManagementWidget
        branches={branches}
        currentCompanyId={companyId}
        currentUserEmail={userEmail}
        currentUserRole={userRole}
      />
    </div>
  );
}
