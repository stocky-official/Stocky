'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  CloudDownloadIcon,
  FilterIcon,
  NetworkIcon,
  PlusIcon,
  SearchIcon,
  TableIcon,
  UsersIcon,
  XIcon,
} from '@stocky/icons';
import type { CompanyUserRole, Location } from '@stocky/types';
import { SideDrawer } from '@/components/ui/SideDrawer';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { StandardToolbarWidget } from '../StandardToolbarWidget/StandardToolbarWidget';
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
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'manager' | 'staff'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'invited'>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [searchFields, setSearchFields] = useState({ name: true, email: true, title: true });

  const filterPanelRef = useRef<HTMLDivElement | null>(null);
  const searchWrapRef = useRef<HTMLDivElement | null>(null);

  // Drawers
  const [selectedMember, setSelectedMember] = useState<TeamMemberData | null>(null);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  // Close filter panel on outside click or Escape
  useEffect(() => {
    if (!isFilterPanelOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        filterPanelRef.current &&
        !filterPanelRef.current.contains(e.target as Node) &&
        searchWrapRef.current &&
        !searchWrapRef.current.contains(e.target as Node)
      ) {
        setIsFilterPanelOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFilterPanelOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFilterPanelOpen]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (roleFilter !== 'all') count++;
    if (statusFilter !== 'all') count++;
    if (locationFilter !== 'all') count++;
    if (!searchFields.name || !searchFields.email || !searchFields.title) count++;
    return count;
  }, [roleFilter, statusFilter, locationFilter, searchFields]);

  const resetFilters = () => {
    setRoleFilter('all');
    setStatusFilter('all');
    setLocationFilter('all');
    setSearchFields({ name: true, email: true, title: true });
  };

  // Filtered members list
  const filteredMembers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return members.filter((m) => {
      if (roleFilter !== 'all') {
        if (roleFilter === 'admin' && m.role !== 'admin' && m.role !== 'owner') return false;
        if (roleFilter !== 'admin' && m.role !== roleFilter) return false;
      }
      if (statusFilter !== 'all') {
        const memberStatus = m.status || 'active';
        if (statusFilter === 'active' && memberStatus !== 'active') return false;
        if (statusFilter === 'invited' && memberStatus !== 'invited' && memberStatus !== 'pending') return false;
      }
      if (locationFilter !== 'all') {
        const isAssigned = assignments.some((a) => a.user_id === m.id && a.location_id === locationFilter);
        if (!isAssigned) return false;
      }
      if (q) {
        const matchesName = searchFields.name && Boolean(m.full_name?.toLowerCase().includes(q));
        const matchesEmail = searchFields.email && Boolean(m.email?.toLowerCase().includes(q));
        const matchesTitle = searchFields.title && Boolean(m.job_title?.toLowerCase().includes(q));
        if (!matchesName && !matchesEmail && !matchesTitle) return false;
      }
      return true;
    });
  }, [members, roleFilter, statusFilter, locationFilter, searchFields, searchQuery, assignments]);

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

  const teamFilterContent = (
    <div className="space-y-4">
      {/* Search in Fields */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-stocky-text-sub">Search In Fields</span>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setSearchFields((f) => ({ ...f, name: !f.name }))}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
              searchFields.name
                ? 'border-stocky-primary bg-stocky-primary/10 text-stocky-primary font-semibold'
                : 'border-stocky-border-subtle bg-white text-stocky-text-sub hover:text-stocky-text-main'
            }`}
          >
            Name
          </button>
          <button
            type="button"
            onClick={() => setSearchFields((f) => ({ ...f, email: !f.email }))}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
              searchFields.email
                ? 'border-stocky-primary bg-stocky-primary/10 text-stocky-primary font-semibold'
                : 'border-stocky-border-subtle bg-white text-stocky-text-sub hover:text-stocky-text-main'
            }`}
          >
            Email
          </button>
          <button
            type="button"
            onClick={() => setSearchFields((f) => ({ ...f, title: !f.title }))}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
              searchFields.title
                ? 'border-stocky-primary bg-stocky-primary/10 text-stocky-primary font-semibold'
                : 'border-stocky-border-subtle bg-white text-stocky-text-sub hover:text-stocky-text-main'
            }`}
          >
            Job Title
          </button>
        </div>
      </div>

      {/* Role Filter */}
      <div className="space-y-1.5 pt-3 border-t border-stocky-border-subtle">
        <span className="text-[10px] font-bold uppercase tracking-wider text-stocky-text-sub">Role</span>
        <div className="flex flex-wrap gap-1.5">
          {(['all', 'admin', 'manager', 'staff'] as const).map((r) => {
            const count =
              r === 'all'
                ? members.length
                : r === 'admin'
                ? members.filter((m) => m.role === 'admin' || m.role === 'owner').length
                : members.filter((m) => m.role === r).length;
            const isSelected = roleFilter === r;
            const label = r === 'all' ? 'All Roles' : r === 'admin' ? 'Admins' : r === 'manager' ? 'Managers' : 'Staff';
            return (
              <button
                key={r}
                type="button"
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                  isSelected
                    ? 'border-stocky-primary bg-stocky-primary/10 text-stocky-primary font-semibold'
                    : 'border-stocky-border-subtle bg-white text-stocky-text-sub hover:text-stocky-text-main'
                }`}
              >
                {label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Location Filter */}
      {locations.length > 0 && (
        <div className="space-y-1.5 pt-3 border-t border-stocky-border-subtle">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stocky-text-sub">Assigned Location</span>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setLocationFilter('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                locationFilter === 'all'
                  ? 'border-stocky-primary bg-stocky-primary/10 text-stocky-primary font-semibold'
                  : 'border-stocky-border-subtle bg-white text-stocky-text-sub hover:text-stocky-text-main'
              }`}
            >
              All Locations
            </button>
            {locations.map((loc) => (
              <button
                key={loc.id}
                type="button"
                onClick={() => setLocationFilter(loc.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                  locationFilter === loc.id
                    ? 'border-stocky-primary bg-stocky-primary/10 text-stocky-primary font-semibold'
                    : 'border-stocky-border-subtle bg-white text-stocky-text-sub hover:text-stocky-text-main'
                }`}
              >
                {loc.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Status Filter */}
      <div className="space-y-1.5 pt-3 border-t border-stocky-border-subtle">
        <span className="text-[10px] font-bold uppercase tracking-wider text-stocky-text-sub">Account Status</span>
        <div className="flex flex-wrap gap-1.5">
          {(['all', 'active', 'invited'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                statusFilter === s
                  ? 'border-stocky-primary bg-stocky-primary/10 text-stocky-primary font-semibold'
                  : 'border-stocky-border-subtle bg-white text-stocky-text-sub hover:text-stocky-text-main'
              }`}
            >
              {s === 'all' ? 'All Statuses' : s === 'active' ? 'Active' : 'Invited / Pending'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="stocky-team-workspace flex flex-col gap-6">
      {/* Unified Workspace Card */}
      <div className="stocky-stock-unified-card rounded-2xl bg-white border border-stocky-border-subtle shadow-xs flex flex-col relative z-20 overflow-visible">
        {/* Integrated Toolbar Header */}
        <div className="p-3 sm:p-3.5 border-b border-stocky-border-subtle relative z-30">
          <StandardToolbarWidget
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search team members by name, email, or job title..."
            activeFilterCount={activeFilterCount}
            isFilterOpen={isFilterPanelOpen}
            onToggleFilter={() => setIsFilterPanelOpen((open) => !open)}
            viewSwitcher={
              <div className="flex items-center gap-1 p-1 bg-stocky-bg-global rounded-full border border-stocky-border-subtle shrink-0" role="tablist" aria-label="View switcher">
                <button
                  type="button"
                  role="tab"
                  aria-selected={viewMode === 'table'}
                  onClick={() => setViewMode('table')}
                  className={`h-8 px-2.5 sm:px-3 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-white text-stocky-text-main shadow-xs'
                      : 'text-stocky-text-sub hover:text-stocky-text-main'
                  }`}
                  title="Table view"
                >
                  <TableIcon size="xs" />
                  <span className="hidden sm:inline">Table</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={viewMode === 'org'}
                  onClick={() => setViewMode('org')}
                  className={`h-8 px-2.5 sm:px-3 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                    viewMode === 'org'
                      ? 'bg-white text-stocky-text-main shadow-xs'
                      : 'text-stocky-text-sub hover:text-stocky-text-main'
                  }`}
                  title="Org structure"
                >
                  <NetworkIcon size="xs" />
                  <span className="hidden sm:inline">Org</span>
                </button>
              </div>
            }
            primaryAction={
              canManage
                ? {
                    label: 'Invite member',
                    shortLabel: 'Invite',
                    icon: <PlusIcon size="xs" />,
                    onClick: () => setIsInviteOpen(true),
                    title: 'Invite team member',
                  }
                : undefined
            }
            moreActions={[
              {
                label: 'Export team',
                icon: <CloudDownloadIcon size="xs" />,
                onClick: exportTeamCsv,
                description: 'Download team directory CSV',
              },
            ]}
          />

          {/* Floating Column Filter Panel (Desktop) */}
          {isFilterPanelOpen && (
            <div
              ref={filterPanelRef}
              className="hidden sm:flex stocky-column-filter-panel absolute top-full left-3 sm:left-3.5 mt-1 z-40"
              role="dialog"
              aria-label="Team member filters"
            >
              {/* Sticky Header */}
              <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-stocky-border-subtle bg-white px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <FilterIcon size="xs" className="text-stocky-primary" />
                  <h3 className="text-xs font-semibold text-stocky-text-main">Team Filters</h3>
                  {activeFilterCount > 0 && (
                    <span className="rounded-full bg-stocky-primary/10 px-2 py-0.5 text-[10px] font-semibold text-stocky-primary">
                      {activeFilterCount} active
                    </span>
                  )}
                </div>
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="text-[11px] font-medium text-stocky-primary hover:underline cursor-pointer"
                  >
                    Reset all
                  </button>
                )}
              </div>

              <div className="stocky-column-filter-panel__body p-4">
                {teamFilterContent}
              </div>

              {/* Sticky Footer */}
              <div className="sticky bottom-0 z-10 flex shrink-0 items-center justify-between border-t border-stocky-border-subtle bg-stocky-bg-global px-4 py-2">
                <span className="text-[11px] font-medium text-stocky-text-sub">
                  Showing <span className="font-semibold text-stocky-text-main">{filteredMembers.length}</span> of {members.length} members
                </span>
                <button
                  type="button"
                  onClick={() => setIsFilterPanelOpen(false)}
                  className="h-7 rounded-full bg-stocky-primary px-3 text-xs font-medium text-white hover:bg-stocky-primary-hover cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Filter Bottom Sheet */}
        <div className="sm:hidden">
          <BottomSheet
            mobileOnly
            isOpen={isFilterPanelOpen}
            onClose={() => setIsFilterPanelOpen(false)}
            title="Team Filters"
            activeCount={activeFilterCount}
            onReset={activeFilterCount > 0 ? resetFilters : undefined}
            footer={
              <div className="flex items-center justify-between w-full">
                <span className="text-xs text-stocky-text-sub">
                  Showing <span className="font-semibold text-stocky-text-main">{filteredMembers.length}</span> of {members.length} members
                </span>
                <button
                  type="button"
                  onClick={() => setIsFilterPanelOpen(false)}
                  className="h-9 px-5 rounded-full bg-stocky-primary text-white text-xs font-semibold cursor-pointer"
                >
                  Apply filters
                </button>
              </div>
            }
          >
            <div className="p-1">
              {teamFilterContent}
            </div>
          </BottomSheet>
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
