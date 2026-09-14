'use client';

import React, { useState, useMemo } from 'react';
import {
  CloudDownloadIcon,
  NetworkIcon,
  PlusIcon,
  SearchIcon,
  TableIcon,
  UsersIcon,
  XIcon,
} from '@stocky/icons';
import type { CompanyUserRole, Location } from '@stocky/types';
import { TeamTableWidget } from './TeamTableWidget';
import { OrgStructureWidget } from './OrgStructureWidget';
import { MemberDetailDrawer, type TeamMemberData } from './MemberDetailDrawer';
import { TeamInviteDrawer } from './TeamInviteDrawer';

export interface TeamWorkspaceWidgetProps {
  members: TeamMemberData[];
  locations: Location[];
  assignments: Array<{ id: string; user_id: string; location_id: string }>;
  canManage: boolean;
  onInvite: (input: {
    email: string;
    fullName?: string;
    jobTitle?: string;
    role: CompanyUserRole;
    locationId?: string;
    reportsTo?: string;
  }) => Promise<void>;
  onUpdateMember?: (
    memberId: string,
    input: {
      fullName?: string;
      jobTitle?: string;
      role?: CompanyUserRole;
      reportsTo?: string | null;
      permissions?: Record<string, any>;
    }
  ) => Promise<void>;
  onRoleChange: (memberId: string, role: CompanyUserRole) => Promise<void>;
  onAssign: (memberId: string, locationId: string) => Promise<void>;
  onUnassign: (assignmentId: string) => Promise<void>;
}

export function TeamWorkspaceWidget({
  members,
  locations,
  assignments,
  canManage,
  onInvite,
  onUpdateMember,
  onRoleChange,
  onAssign,
  onUnassign,
}: TeamWorkspaceWidgetProps) {
  const [viewMode, setViewMode] = useState<'table' | 'org'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'manager' | 'staff'>('all');

  // Drawers
  const [selectedMember, setSelectedMember] = useState<TeamMemberData | null>(null);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  // Filtered members list
  const filteredMembers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return members.filter((m) => {
      if (roleFilter !== 'all' && m.role !== roleFilter) return false;
      if (q) {
        const matchesName = Boolean(m.full_name?.toLowerCase().includes(q));
        const matchesEmail = Boolean(m.email?.toLowerCase().includes(q));
        const matchesTitle = Boolean(m.job_title?.toLowerCase().includes(q));
        if (!matchesName && !matchesEmail && !matchesTitle) return false;
      }
      return true;
    });
  }, [members, roleFilter, searchQuery]);

  const handleSaveMember = async (
    memberId: string,
    input: {
      fullName?: string;
      jobTitle?: string;
      role?: CompanyUserRole;
      reportsTo?: string | null;
      permissions?: Record<string, any>;
    }
  ) => {
    if (onUpdateMember) {
      await onUpdateMember(memberId, input);
    } else if (input.role) {
      await onRoleChange(memberId, input.role);
    }
  };

  const exportTeamCsv = () => {
    const rows = [
      ['Name', 'Email', 'Role', 'Job Title', 'Reports To', 'Locations', 'Status'],
      ...members.map((m) => {
        const memberAssignments = assignments.filter((a) => a.user_id === m.id);
        const locNames = memberAssignments
          .map((a) => locations.find((l) => l.id === a.location_id)?.name || '')
          .filter(Boolean)
          .join('; ');
        const manager = m.reports_to ? members.find((lead) => lead.id === m.reports_to) : null;
        return [
          m.full_name || '',
          m.email,
          m.role,
          m.job_title || '',
          manager ? (manager.full_name || manager.email) : '',
          locNames,
          m.status || 'active',
        ];
      }),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((r) => r.map((cell) => `"${cell}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `stocky-team-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="stocky-team-workspace flex flex-col gap-6">
      {/* Unified Workspace Card */}
      <div className="stocky-stock-unified-card rounded-2xl bg-white border border-stocky-border-subtle shadow-xs flex flex-col relative z-20 overflow-visible">
        {/* Integrated Toolbar Header */}
        <div className="p-3 sm:p-3.5 border-b border-stocky-border-subtle relative z-30">
          <div className="stocky-stock-table-toolbar relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Search Input Group */}
            <div className="stocky-stock-table-toolbar__search-group flex items-center gap-2 min-w-0 flex-1">
              <div className="relative min-w-0 flex-1">
                <SearchIcon size="xs" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stocky-text-sub" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search team members by name, email, or job title..."
                  className="w-full h-10 rounded-full border border-stocky-border-subtle bg-stocky-bg-widget pl-9 pr-9 text-xs text-stocky-text-main placeholder:text-stocky-text-sub focus:border-stocky-primary focus:outline-none transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stocky-text-sub hover:text-stocky-text-main cursor-pointer"
                  >
                    <XIcon size="xs" />
                  </button>
                )}
              </div>
            </div>

            {/* Actions & View Switcher Group */}
            <div className="stocky-stock-table-toolbar__actions flex flex-wrap items-center gap-2 justify-between sm:justify-end">
              {/* 2-View Switcher Pill */}
              <div className="inline-flex items-center gap-1.5" role="tablist" aria-label="View switcher">
                <button
                  type="button"
                  role="tab"
                  aria-selected={viewMode === 'table'}
                  onClick={() => setViewMode('table')}
                  className={`stocky-table-toolbar-button h-10 px-4 rounded-full text-xs font-medium inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
                    viewMode === 'table'
                      ? 'stocky-table-toolbar-button--active border-stocky-primary bg-stocky-primary/10 text-stocky-primary font-semibold'
                      : 'border border-stocky-border-subtle bg-white text-stocky-text-main hover:border-stocky-primary hover:text-stocky-primary'
                  }`}
                >
                  <TableIcon size="xs" />
                  <span>Table view</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={viewMode === 'org'}
                  onClick={() => setViewMode('org')}
                  className={`stocky-table-toolbar-button h-10 px-4 rounded-full text-xs font-medium inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
                    viewMode === 'org'
                      ? 'stocky-table-toolbar-button--active border-stocky-primary bg-stocky-primary/10 text-stocky-primary font-semibold'
                      : 'border border-stocky-border-subtle bg-white text-stocky-text-main hover:border-stocky-primary hover:text-stocky-primary'
                  }`}
                >
                  <NetworkIcon size="xs" />
                  <span>Org structure</span>
                </button>
              </div>

              {/* Role Queue Tabs (shown in table mode) */}
              {viewMode === 'table' && (
                <div className="hidden lg:inline-flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setRoleFilter('all')}
                    className={`h-10 px-3 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                      roleFilter === 'all'
                        ? 'border-stocky-primary bg-stocky-primary/10 text-stocky-primary font-semibold border'
                        : 'border border-stocky-border-subtle bg-white text-stocky-text-sub hover:text-stocky-text-main'
                    }`}
                  >
                    All ({members.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRoleFilter('admin')}
                    className={`h-10 px-3 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                      roleFilter === 'admin'
                        ? 'border-stocky-primary bg-stocky-primary/10 text-stocky-primary font-semibold border'
                        : 'border border-stocky-border-subtle bg-white text-stocky-text-sub hover:text-stocky-text-main'
                    }`}
                  >
                    Admins ({members.filter((m) => m.role === 'admin' || m.role === 'owner').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRoleFilter('manager')}
                    className={`h-10 px-3 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                      roleFilter === 'manager'
                        ? 'border-stocky-primary bg-stocky-primary/10 text-stocky-primary font-semibold border'
                        : 'border border-stocky-border-subtle bg-white text-stocky-text-sub hover:text-stocky-text-main'
                    }`}
                  >
                    Managers ({members.filter((m) => m.role === 'manager').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRoleFilter('staff')}
                    className={`h-10 px-3 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                      roleFilter === 'staff'
                        ? 'border-stocky-primary bg-stocky-primary/10 text-stocky-primary font-semibold border'
                        : 'border border-stocky-border-subtle bg-white text-stocky-text-sub hover:text-stocky-text-main'
                    }`}
                  >
                    Staff ({members.filter((m) => m.role === 'staff').length})
                  </button>
                </div>
              )}

              {/* Export Button */}
              <button
                type="button"
                onClick={exportTeamCsv}
                className="stocky-table-toolbar-button h-10 px-4 rounded-full border border-stocky-border-subtle bg-white text-xs font-medium text-stocky-text-main hover:border-stocky-primary hover:text-stocky-primary inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Export team directory CSV"
              >
                <CloudDownloadIcon size="xs" /> <span>Export</span>
              </button>

              {/* Primary Action Button */}
              {canManage && (
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(true)}
                  className="stocky-table-toolbar-button stocky-table-toolbar-button--primary h-10 px-4 rounded-full text-xs font-medium inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
                >
                  <PlusIcon size="xs" /> <span>Invite member</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Integrated Body: Table or Org View */}
        <div className="w-full">
          {viewMode === 'table' ? (
            <TeamTableWidget
              members={filteredMembers}
              locations={locations}
              assignments={assignments}
              canManage={canManage}
              onSelectMember={(m) => setSelectedMember(m)}
              onAssignLocation={onAssign}
              onUnassignLocation={onUnassign}
            />
          ) : (
            <OrgStructureWidget
              members={members}
              locations={locations}
              assignments={assignments}
              canManage={canManage}
              onSelectMember={(m) => setSelectedMember(m)}
            />
          )}
        </div>
      </div>

      {/* Member Detail & Authorizations Drawer */}
      <MemberDetailDrawer
        isOpen={Boolean(selectedMember)}
        onClose={() => setSelectedMember(null)}
        member={selectedMember}
        allMembers={members}
        locations={locations}
        assignments={assignments}
        canManage={canManage}
        onSave={handleSaveMember}
        onAssignLocation={onAssign}
        onUnassignLocation={onUnassign}
      />

      {/* Team Invite Drawer */}
      <TeamInviteDrawer
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        locations={locations}
        allMembers={members}
        onInvite={onInvite}
      />
    </div>
  );
}
