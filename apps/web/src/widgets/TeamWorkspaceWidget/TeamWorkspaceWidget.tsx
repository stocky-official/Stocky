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

  return (
    <div className="stocky-team-workspace flex flex-col gap-6">
      {/* Unified Workspace Card */}
      <div className="stocky-stock-unified-card rounded-2xl bg-white border border-stocky-border-subtle shadow-xs flex flex-col relative z-20 overflow-visible">
        {/* Integrated Toolbar Header */}
        <div className="p-3 sm:p-3.5 border-b border-stocky-border-subtle relative z-30">
          <div className="stocky-stock-table-toolbar relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Split Search Field & Filter Button */}
            <div ref={searchWrapRef} className="stocky-stock-table-toolbar__search-group relative flex items-center min-w-0 flex-1">
              <div className="stocky-split-search-field">
                <div className="stocky-split-search-field__input-wrap">
                  <SearchIcon size="xs" className="text-stocky-text-sub shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search team members by name, email, or job title..."
                    className="stocky-split-search-field__input"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="text-stocky-text-sub hover:text-stocky-text-main cursor-pointer shrink-0"
                      aria-label="Clear search"
                    >
                      <XIcon size="xs" />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setIsFilterPanelOpen((open) => !open)}
                  aria-label="Filter team members"
                  aria-expanded={isFilterPanelOpen}
                  className={`stocky-split-search-field__filter-btn ${isFilterPanelOpen || activeFilterCount > 0 ? 'stocky-split-search-field__filter-btn--active' : ''}`}
                  title="Filter team members"
                >
                  <FilterIcon size="xs" />
                  {activeFilterCount > 0 && (
                    <span className="stocky-split-search-field__badge">{activeFilterCount}</span>
                  )}
                </button>
              </div>

              {/* Floating Column Filter Panel (Desktop) */}
              {isFilterPanelOpen && (
                <div ref={filterPanelRef} className="hidden sm:flex stocky-column-filter-panel" role="dialog" aria-label="Team member filters">
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

                  <div className="stocky-column-filter-panel__body space-y-3">
                    {/* Search in Fields */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-stocky-text-sub">Search In Fields</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSearchFields((f) => ({ ...f, name: !f.name }))}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${searchFields.name ? 'border-stocky-primary bg-stocky-primary/10 text-stocky-primary font-semibold' : 'border-stocky-border-subtle bg-white text-stocky-text-sub hover:text-stocky-text-main'}`}
                        >
                          Name
                        </button>
                        <button
                          type="button"
                          onClick={() => setSearchFields((f) => ({ ...f, email: !f.email }))}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${searchFields.email ? 'border-stocky-primary bg-stocky-primary/10 text-stocky-primary font-semibold' : 'border-stocky-border-subtle bg-white text-stocky-text-sub hover:text-stocky-text-main'}`}
                        >
                          Email
                        </button>
                        <button
                          type="button"
                          onClick={() => setSearchFields((f) => ({ ...f, title: !f.title }))}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${searchFields.title ? 'border-stocky-primary bg-stocky-primary/10 text-stocky-primary font-semibold' : 'border-stocky-border-subtle bg-white text-stocky-text-sub hover:text-stocky-text-main'}`}
                        >
                          Job Title
                        </button>
                      </div>
                    </div>

                    {/* Role Filter */}
                    <div className="space-y-1.5 pt-2 border-t border-stocky-border-subtle">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stocky-text-sub">Role</span>
                      <div className="flex flex-wrap gap-1.5">
                        {(['all', 'admin', 'manager', 'staff'] as const).map((r) => {
                          const count = r === 'all'
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
                              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${isSelected ? 'border-stocky-primary bg-stocky-primary/10 text-stocky-primary font-semibold' : 'border-stocky-border-subtle bg-white text-stocky-text-sub hover:text-stocky-text-main'}`}
                            >
                              {label} ({count})
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Location Filter */}
                    {locations.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-stocky-border-subtle">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-stocky-text-sub">Assigned Location</span>
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() => setLocationFilter('all')}
                            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${locationFilter === 'all' ? 'border-stocky-primary bg-stocky-primary/10 text-stocky-primary font-semibold' : 'border-stocky-border-subtle bg-white text-stocky-text-sub hover:text-stocky-text-main'}`}
                          >
                            All Locations
                          </button>
                          {locations.map((loc) => (
                            <button
                              key={loc.id}
                              type="button"
                              onClick={() => setLocationFilter(loc.id)}
                              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${locationFilter === loc.id ? 'border-stocky-primary bg-stocky-primary/10 text-stocky-primary font-semibold' : 'border-stocky-border-subtle bg-white text-stocky-text-sub hover:text-stocky-text-main'}`}
                            >
                              {loc.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Status Filter */}
                    <div className="space-y-1.5 pt-2 border-t border-stocky-border-subtle">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stocky-text-sub">Account Status</span>
                      <div className="flex flex-wrap gap-1.5">
                        {(['all', 'active', 'invited'] as const).map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setStatusFilter(s)}
                            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${statusFilter === s ? 'border-stocky-primary bg-stocky-primary/10 text-stocky-primary font-semibold' : 'border-stocky-border-subtle bg-white text-stocky-text-sub hover:text-stocky-text-main'}`}
                          >
                            {s === 'all' ? 'All Statuses' : s === 'active' ? 'Active' : 'Invited / Pending'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Panel Footer */}
                  <div className="border-t border-stocky-border-subtle bg-stocky-bg-global/40 px-4 py-2 flex items-center justify-between">
                    <span className="text-[11px] text-stocky-text-sub">
                      Showing <span className="font-semibold text-stocky-text-main">{filteredMembers.length}</span> of {members.length} members
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsFilterPanelOpen(false)}
                      className="h-7 px-3 rounded-full bg-stocky-text-main text-white text-xs font-medium hover:bg-black transition-colors cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Actions & View Switcher Group */}
            <div className="stocky-stock-table-toolbar__actions stocky-mobile-pill-rail flex items-center gap-2 overflow-x-auto py-0.5 justify-between sm:justify-end">
              {/* 2-View Switcher Pill */}
              <div className="inline-flex items-center gap-1.5 shrink-0" role="tablist" aria-label="View switcher">
                <button
                  type="button"
                  role="tab"
                  aria-selected={viewMode === 'table'}
                  onClick={() => setViewMode('table')}
                  className={`stocky-table-toolbar-button shrink-0 h-10 px-4 rounded-full text-xs font-medium inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
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
                  className={`stocky-table-toolbar-button shrink-0 h-10 px-4 rounded-full text-xs font-medium inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
                    viewMode === 'org'
                      ? 'stocky-table-toolbar-button--active border-stocky-primary bg-stocky-primary/10 text-stocky-primary font-semibold'
                      : 'border border-stocky-border-subtle bg-white text-stocky-text-main hover:border-stocky-primary hover:text-stocky-primary'
                  }`}
                >
                  <NetworkIcon size="xs" />
                  <span>Org structure</span>
                </button>
              </div>

              {/* Export Button */}
              <button
                type="button"
                onClick={exportTeamCsv}
                className="stocky-table-toolbar-button shrink-0 h-10 px-4 rounded-full border border-stocky-border-subtle bg-white text-xs font-medium text-stocky-text-main hover:border-stocky-primary hover:text-stocky-primary inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Export team directory CSV"
              >
                <CloudDownloadIcon size="xs" />
                <span>Export</span>
              </button>

              {/* Primary CTA: Invite Member (Signature Lime Accent) */}
              {canManage && (
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(true)}
                  className="stocky-table-toolbar-button stocky-table-toolbar-button--primary shrink-0 h-10 px-4 rounded-full text-xs font-medium inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
                >
                  <PlusIcon size="xs" />
                  <span>Invite member</span>
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

      {/* Mobile Team Filter Drawer */}
      <SideDrawer
        isOpen={isFilterPanelOpen}
        onClose={() => setIsFilterPanelOpen(false)}
        ariaLabel="Filter team members"
        panelClassName="sm:hidden flex flex-col"
      >
        <div className="flex h-full flex-col min-h-0 bg-white">
          <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-stocky-border-subtle bg-white px-5 py-4">
            <div className="flex items-center gap-2">
              <FilterIcon size="xs" className="text-stocky-primary" />
              <h3 className="text-sm font-semibold text-stocky-text-main">Team Filters</h3>
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-stocky-primary/10 px-2 py-0.5 text-[10px] font-semibold text-stocky-primary">
                  {activeFilterCount} active
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-xs font-medium text-stocky-primary hover:underline cursor-pointer"
                >
                  Reset all
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsFilterPanelOpen(false)}
                aria-label="Close team filters"
                className="w-8 h-8 rounded-full flex items-center justify-center text-stocky-text-sub hover:text-stocky-text-main hover:bg-stocky-bg-global transition-colors cursor-pointer"
              >
                <XIcon size="xs" />
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-5">
            {/* Search in Fields */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-stocky-text-main">Search In Fields</span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSearchFields((f) => ({ ...f, name: !f.name }))}
                  className={`h-8 px-3 rounded-full text-xs font-medium border transition-colors cursor-pointer ${searchFields.name ? 'border-stocky-primary bg-stocky-primary/10 text-stocky-primary font-semibold' : 'border-stocky-border-subtle bg-white text-stocky-text-sub hover:text-stocky-text-main'}`}
                >
                  Name
                </button>
                <button
                  type="button"
                  onClick={() => setSearchFields((f) => ({ ...f, email: !f.email }))}
                  className={`h-8 px-3 rounded-full text-xs font-medium border transition-colors cursor-pointer ${searchFields.email ? 'border-stocky-primary bg-stocky-primary/10 text-stocky-primary font-semibold' : 'border-stocky-border-subtle bg-white text-stocky-text-sub hover:text-stocky-text-main'}`}
                >
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => setSearchFields((f) => ({ ...f, title: !f.title }))}
                  className={`h-8 px-3 rounded-full text-xs font-medium border transition-colors cursor-pointer ${searchFields.title ? 'border-stocky-primary bg-stocky-primary/10 text-stocky-primary font-semibold' : 'border-stocky-border-subtle bg-white text-stocky-text-sub hover:text-stocky-text-main'}`}
                >
                  Job Title
                </button>
              </div>
            </div>

            {/* Role Filter */}
            <div className="space-y-2 pt-3 border-t border-stocky-border-subtle">
              <span className="text-xs font-semibold text-stocky-text-main">Role</span>
              <div className="flex flex-wrap gap-2">
                {(['all', 'admin', 'manager', 'staff'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRoleFilter(r)}
                    className={`h-8 px-3 rounded-full text-xs font-medium border transition-colors cursor-pointer ${roleFilter === r ? 'border-stocky-primary bg-stocky-primary/10 text-stocky-primary font-semibold' : 'border-stocky-border-subtle bg-white text-stocky-text-sub hover:text-stocky-text-main'}`}
                  >
                    {r === 'all' ? 'All Roles' : r.charAt(0).toUpperCase() + r.slice(1) + 's'}
                  </button>
                ))}
              </div>
            </div>

            {/* Location Filter */}
            {locations.length > 0 && (
              <div className="space-y-2 pt-3 border-t border-stocky-border-subtle">
                <span className="text-xs font-semibold text-stocky-text-main">Assigned Location</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setLocationFilter('all')}
                    className={`h-8 px-3 rounded-full text-xs font-medium border transition-colors cursor-pointer ${locationFilter === 'all' ? 'border-stocky-primary bg-stocky-primary/10 text-stocky-primary font-semibold' : 'border-stocky-border-subtle bg-white text-stocky-text-sub hover:text-stocky-text-main'}`}
                  >
                    All Locations
                  </button>
                  {locations.map((loc) => (
                    <button
                      key={loc.id}
                      type="button"
                      onClick={() => setLocationFilter(loc.id)}
                      className={`h-8 px-3 rounded-full text-xs font-medium border transition-colors cursor-pointer ${locationFilter === loc.id ? 'border-stocky-primary bg-stocky-primary/10 text-stocky-primary font-semibold' : 'border-stocky-border-subtle bg-white text-stocky-text-sub hover:text-stocky-text-main'}`}
                    >
                      {loc.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Status Filter */}
            <div className="space-y-2 pt-3 border-t border-stocky-border-subtle">
              <span className="text-xs font-semibold text-stocky-text-main">Account Status</span>
              <div className="flex flex-wrap gap-2">
                {(['all', 'active', 'invited'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatusFilter(s)}
                    className={`h-8 px-3 rounded-full text-xs font-medium border transition-colors cursor-pointer ${statusFilter === s ? 'border-stocky-primary bg-stocky-primary/10 text-stocky-primary font-semibold' : 'border-stocky-border-subtle bg-white text-stocky-text-sub hover:text-stocky-text-main'}`}
                  >
                    {s === 'all' ? 'All Statuses' : s === 'active' ? 'Active' : 'Invited / Pending'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Panel Footer */}
          <div className="border-t border-stocky-border-subtle bg-white px-5 py-3.5 flex items-center justify-between shrink-0">
            <span className="text-xs text-stocky-text-sub">
              Showing <span className="font-semibold text-stocky-text-main">{filteredMembers.length}</span> of {members.length} members
            </span>
            <button
              type="button"
              onClick={() => setIsFilterPanelOpen(false)}
              className="h-8 px-5 rounded-full bg-stocky-text-main text-white text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
            >
              Done
            </button>
          </div>
        </div>
      </SideDrawer>
    </div>
  );
}
