'use client';

import React, { useState, useEffect } from 'react';
import {
  CheckIcon,
  ShieldIcon,
  UsersIcon,
  WarehouseIcon,
  XIcon,
} from '@stocky/icons';
import type { CompanyUserRole, Location } from '@stocky/types';
import { SideDrawer } from '@/components/ui/SideDrawer';
import { UserAvatar } from '@/components/ui/UserAvatar';

export interface TeamMemberData {
  id: string;
  email: string;
  full_name?: string | null;
  avatar_url?: string | null;
  role: CompanyUserRole;
  status?: string;
  job_title?: string | null;
  reports_to?: string | null;
  permissions?: {
    pages?: string[];
    capabilities?: {
      can_edit_stock?: boolean;
      can_approve_transfers?: boolean;
      can_manage_team?: boolean;
      can_manage_attendance?: boolean;
    };
  } | null;
}

export interface MemberDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  member: TeamMemberData | null;
  allMembers: TeamMemberData[];
  locations: Location[];
  assignments: Array<{ id: string; user_id: string; location_id: string }>;
  canManage: boolean;
  onSave: (memberId: string, input: {
    fullName?: string;
    jobTitle?: string;
    role?: CompanyUserRole;
    reportsTo?: string | null;
    permissions?: Record<string, any>;
  }) => Promise<void>;
  onAssignLocation: (userId: string, locationId: string) => Promise<void>;
  onUnassignLocation: (assignmentId: string) => Promise<void>;
}

const AVAILABLE_PAGES = [
  { id: 'inventory', label: 'Inventory & Lots', description: 'View stock levels, batches, and reorder points' },
  { id: 'transfers', label: 'Transfers', description: 'Request, dispatch, and receive inventory transfers' },
  { id: 'suppliers', label: 'Suppliers & Requests', description: 'Manage supplier catalogs and replenishment' },
  { id: 'tasks', label: 'Tasks & Stock Counts', description: 'Execute barcode scans, audits, and shelf checks' },
  { id: 'attendance', label: 'Attendance & Shifts', description: 'Clock in/out, view timesheets, and review time off' },
  { id: 'locations', label: 'Locations Directory', description: 'Inspect branches, warehouses, and health status' },
  { id: 'team', label: 'Team & Organization', description: 'Manage members, permissions, and organizational tree' },
];

export function MemberDetailDrawer({
  isOpen,
  onClose,
  member,
  allMembers,
  locations,
  assignments,
  canManage,
  onSave,
  onAssignLocation,
  onUnassignLocation,
}: MemberDetailDrawerProps) {
  const [fullName, setFullName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [role, setRole] = useState<CompanyUserRole>('staff');
  const [reportsTo, setReportsTo] = useState<string>('');
  const [allowedPages, setAllowedPages] = useState<string[]>([]);
  const [capabilities, setCapabilities] = useState({
    can_edit_stock: false,
    can_approve_transfers: false,
    can_manage_team: false,
    can_manage_attendance: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (member) {
      setFullName(member.full_name || '');
      setJobTitle(member.job_title || '');
      setRole(member.role || 'staff');
      setReportsTo(member.reports_to || '');

      const currentPages = member.permissions?.pages || [
        'inventory',
        'transfers',
        'suppliers',
        'tasks',
        'attendance',
        'locations',
      ];
      setAllowedPages(currentPages);

      setCapabilities({
        can_edit_stock: Boolean(member.permissions?.capabilities?.can_edit_stock ?? member.role !== 'staff'),
        can_approve_transfers: Boolean(member.permissions?.capabilities?.can_approve_transfers ?? (member.role === 'owner' || member.role === 'admin')),
        can_manage_team: Boolean(member.permissions?.capabilities?.can_manage_team ?? (member.role === 'owner' || member.role === 'admin')),
        can_manage_attendance: Boolean(member.permissions?.capabilities?.can_manage_attendance ?? member.role !== 'staff'),
      });
    }
  }, [member]);

  if (!member) return null;

  const memberAssignments = assignments.filter((a) => a.user_id === member.id);
  const assignedLocationIds = new Set(memberAssignments.map((a) => a.location_id));
  const potentialManagers = allMembers.filter((m) => m.id !== member.id);

  const applyPreset = (preset: 'admin' | 'manager' | 'warehouse' | 'staff') => {
    if (preset === 'admin') {
      setRole('admin');
      setAllowedPages(AVAILABLE_PAGES.map((p) => p.id));
      setCapabilities({
        can_edit_stock: true,
        can_approve_transfers: true,
        can_manage_team: true,
        can_manage_attendance: true,
      });
    } else if (preset === 'manager') {
      setRole('manager');
      setAllowedPages(['inventory', 'transfers', 'suppliers', 'tasks', 'attendance', 'locations']);
      setCapabilities({
        can_edit_stock: true,
        can_approve_transfers: true,
        can_manage_team: false,
        can_manage_attendance: true,
      });
    } else if (preset === 'warehouse') {
      setRole('staff');
      setAllowedPages(['inventory', 'transfers', 'tasks', 'locations']);
      setCapabilities({
        can_edit_stock: true,
        can_approve_transfers: false,
        can_manage_team: false,
        can_manage_attendance: false,
      });
    } else if (preset === 'staff') {
      setRole('staff');
      setAllowedPages(['tasks', 'attendance', 'locations']);
      setCapabilities({
        can_edit_stock: false,
        can_approve_transfers: false,
        can_manage_team: false,
        can_manage_attendance: false,
      });
    }
  };

  const handleTogglePage = (pageId: string) => {
    setAllowedPages((prev) =>
      prev.includes(pageId) ? prev.filter((p) => p !== pageId) : [...prev, pageId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(member.id, {
        fullName: fullName.trim(),
        jobTitle: jobTitle.trim() || undefined,
        role,
        reportsTo: reportsTo || null,
        permissions: {
          pages: allowedPages,
          capabilities,
        },
      });
      onClose();
    } catch (err: any) {
      alert(err?.message || 'Failed to update member');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SideDrawer
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel={`Edit member profile: ${member.full_name || member.email}`}
    >
      <div className="flex h-full flex-col">
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-stocky-border-subtle px-6 py-4">
          <div className="flex items-center gap-3">
            <UserAvatar
              src={member.avatar_url}
              name={member.full_name}
              email={member.email}
              size="md"
              className="ring-2 ring-stocky-border-subtle"
            />
            <div>
              <h2 className="text-base font-semibold text-stocky-text-main">
                {member.full_name || member.email}
              </h2>
              <p className="text-xs text-stocky-text-sub">{member.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-stocky-text-sub hover:bg-stocky-bg-global hover:text-stocky-text-main cursor-pointer"
            aria-label="Close drawer"
          >
            <XIcon size="xs" />
          </button>
        </div>

        {/* Drawer Body Form */}
        <form
          id="member-detail-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-6 text-left"
        >
          {/* Section: Profile & Identity */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stocky-text-sub flex items-center gap-2">
              <UsersIcon size="xs" /> Team Member Profile
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block text-xs font-medium text-stocky-text-main">
                Full Name
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="mt-1.5 h-10 w-full rounded-xl border border-stocky-border-subtle bg-white px-3 text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none"
                />
              </label>

              <label className="block text-xs font-medium text-stocky-text-main">
                Job Title
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Operations Director, Lead Barista"
                  className="mt-1.5 h-10 w-full rounded-xl border border-stocky-border-subtle bg-white px-3 text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block text-xs font-medium text-stocky-text-main">
                Platform Role
                <select
                  value={role}
                  disabled={member.role === 'owner' || !canManage}
                  onChange={(e) => setRole(e.target.value as CompanyUserRole)}
                  className="mt-1.5 h-10 w-full rounded-xl border border-stocky-border-subtle bg-white px-3 text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none disabled:bg-stocky-bg-global"
                >
                  <option value="staff">Staff</option>
                  <option value="manager">Branch Manager</option>
                  <option value="admin">Administrator</option>
                  {member.role === 'owner' && <option value="owner">Owner</option>}
                </select>
              </label>

              <label className="block text-xs font-medium text-stocky-text-main">
                Reports To (Direct Supervisor)
                <select
                  value={reportsTo}
                  disabled={member.role === 'owner' || !canManage}
                  onChange={(e) => setReportsTo(e.target.value)}
                  className="mt-1.5 h-10 w-full rounded-xl border border-stocky-border-subtle bg-white px-3 text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none disabled:bg-stocky-bg-global"
                >
                  <option value="">None (Top of hierarchy / Reports to Owner)</option>
                  {potentialManagers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name || m.email} ({m.job_title || m.role})
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {/* Section: Location Assignments */}
          <div className="border-t border-stocky-border-subtle pt-5 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stocky-text-sub flex items-center gap-2">
              <WarehouseIcon size="xs" /> Location Assignments
            </h3>
            <p className="text-xs text-stocky-text-sub">
              Branches and warehouses where this member can receive stock, conduct counts, and clock in.
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              {memberAssignments.map((assignment) => {
                const loc = locations.find((l) => l.id === assignment.location_id);
                return (
                  <span
                    key={assignment.id}
                    className="inline-flex items-center gap-1.5 rounded-full border stocky-status-info px-3 py-1 text-xs"
                  >
                    <span>{loc?.name || 'Assigned Location'}</span>
                    {canManage && (
                      <button
                        type="button"
                        onClick={() => onUnassignLocation(assignment.id)}
                        className="text-stocky-text-sub hover:text-stocky-text-main cursor-pointer"
                        title="Remove location"
                      >
                        <XIcon size="xs" />
                      </button>
                    )}
                  </span>
                );
              })}

              {memberAssignments.length === 0 && (
                <span className="text-xs text-amber-700 font-medium py-1">
                  No location assigned yet.
                </span>
              )}
            </div>

            {canManage && (
              <div className="pt-2">
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      onAssignLocation(member.id, e.target.value);
                    }
                  }}
                  className="h-9 rounded-full border border-stocky-border-subtle bg-white px-3 text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none cursor-pointer"
                >
                  <option value="">+ Assign another location</option>
                  {locations
                    .filter((loc) => !assignedLocationIds.has(loc.id))
                    .map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} ({loc.type})
                      </option>
                    ))}
                </select>
              </div>
            )}
          </div>

          {/* Section: Granular Authorizations Matrix */}
          <div className="border-t border-stocky-border-subtle pt-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stocky-text-sub flex items-center gap-2">
                <ShieldIcon size="xs" /> Granular Authorizations & Pages
              </h3>

              {/* Quick Presets */}
              {canManage && member.role !== 'owner' && (
                <div className="flex items-center gap-1 text-[11px]">
                  <span className="text-stocky-text-sub mr-1">Presets:</span>
                  <button
                    type="button"
                    onClick={() => applyPreset('admin')}
                    className="px-2 py-0.5 rounded-full border border-stocky-border-subtle bg-white hover:bg-stocky-bg-global cursor-pointer"
                  >
                    Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('manager')}
                    className="px-2 py-0.5 rounded-full border border-stocky-border-subtle bg-white hover:bg-stocky-bg-global cursor-pointer"
                  >
                    Manager
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('warehouse')}
                    className="px-2 py-0.5 rounded-full border border-stocky-border-subtle bg-white hover:bg-stocky-bg-global cursor-pointer"
                  >
                    Warehouse
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('staff')}
                    className="px-2 py-0.5 rounded-full border border-stocky-border-subtle bg-white hover:bg-stocky-bg-global cursor-pointer"
                  >
                    Staff
                  </button>
                </div>
              )}
            </div>

            {/* Page Access Checkbox List */}
            <div className="rounded-xl border border-stocky-border-subtle divide-y divide-stocky-border-subtle overflow-hidden bg-white">
              <div className="bg-stocky-bg-global px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider text-stocky-text-sub">
                Permitted Modules & Pages
              </div>
              {AVAILABLE_PAGES.map((page) => {
                const isChecked = allowedPages.includes(page.id);
                return (
                  <label
                    key={page.id}
                    className={`flex items-start justify-between p-3 cursor-pointer hover:bg-stocky-bg-global/60 transition-colors ${isChecked ? 'bg-stocky-bg-global/30' : ''}`}
                  >
                    <div className="min-w-0 pr-3">
                      <p className="text-xs font-medium text-stocky-text-main">{page.label}</p>
                      <p className="text-[11px] text-stocky-text-sub mt-0.5">{page.description}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={member.role === 'owner' || !canManage}
                      onChange={() => handleTogglePage(page.id)}
                      className="accent-stocky-primary rounded h-4 w-4 mt-0.5 cursor-pointer shrink-0"
                    />
                  </label>
                );
              })}
            </div>

            {/* Capabilities Checkbox List */}
            <div className="rounded-xl border border-stocky-border-subtle divide-y divide-stocky-border-subtle overflow-hidden bg-white mt-3">
              <div className="bg-stocky-bg-global px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider text-stocky-text-sub">
                Operational Write Privileges
              </div>

              <label className="flex items-center justify-between p-3 cursor-pointer hover:bg-stocky-bg-global/60">
                <div>
                  <p className="text-xs font-medium text-stocky-text-main">Inventory Edit & Reorder Control</p>
                  <p className="text-[11px] text-stocky-text-sub">Can update lot batches, modify expiry dates, and edit product costs</p>
                </div>
                <input
                  type="checkbox"
                  checked={capabilities.can_edit_stock}
                  disabled={member.role === 'owner' || !canManage}
                  onChange={(e) => setCapabilities((prev) => ({ ...prev, can_edit_stock: e.target.checked }))}
                  className="accent-stocky-primary rounded h-4 w-4 cursor-pointer shrink-0"
                />
              </label>

              <label className="flex items-center justify-between p-3 cursor-pointer hover:bg-stocky-bg-global/60">
                <div>
                  <p className="text-xs font-medium text-stocky-text-main">Transfer Approvals</p>
                  <p className="text-[11px] text-stocky-text-sub">Can approve inter-branch transfers and mark dispatches as received</p>
                </div>
                <input
                  type="checkbox"
                  checked={capabilities.can_approve_transfers}
                  disabled={member.role === 'owner' || !canManage}
                  onChange={(e) => setCapabilities((prev) => ({ ...prev, can_approve_transfers: e.target.checked }))}
                  className="accent-stocky-primary rounded h-4 w-4 cursor-pointer shrink-0"
                />
              </label>

              <label className="flex items-center justify-between p-3 cursor-pointer hover:bg-stocky-bg-global/60">
                <div>
                  <p className="text-xs font-medium text-stocky-text-main">Attendance & Leave Management</p>
                  <p className="text-[11px] text-stocky-text-sub">Can approve employee leave requests and adjust timesheet logs</p>
                </div>
                <input
                  type="checkbox"
                  checked={capabilities.can_manage_attendance}
                  disabled={member.role === 'owner' || !canManage}
                  onChange={(e) => setCapabilities((prev) => ({ ...prev, can_manage_attendance: e.target.checked }))}
                  className="accent-stocky-primary rounded h-4 w-4 cursor-pointer shrink-0"
                />
              </label>

              <label className="flex items-center justify-between p-3 cursor-pointer hover:bg-stocky-bg-global/60">
                <div>
                  <p className="text-xs font-medium text-stocky-text-main">Team & Member Administration</p>
                  <p className="text-[11px] text-stocky-text-sub">Can invite teammates, assign job titles, and alter permission matrices</p>
                </div>
                <input
                  type="checkbox"
                  checked={capabilities.can_manage_team}
                  disabled={member.role === 'owner' || !canManage}
                  onChange={(e) => setCapabilities((prev) => ({ ...prev, can_manage_team: e.target.checked }))}
                  className="accent-stocky-primary rounded h-4 w-4 cursor-pointer shrink-0"
                />
              </label>
            </div>
          </div>
        </form>

        {/* Drawer Footer Actions (Standard 40px buttons) */}
        <div className="flex items-center justify-end gap-2.5 border-t border-stocky-border-subtle bg-stocky-bg-global px-6 py-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="h-10 rounded-full border border-stocky-border-subtle bg-white px-5 text-xs font-medium text-stocky-text-main hover:bg-stocky-bg-global transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="member-detail-form"
            disabled={saving}
            className="h-10 rounded-full bg-stocky-primary px-6 text-xs font-medium text-white hover:bg-stocky-primary-hover transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {saving ? 'Saving changes...' : 'Save changes'}
          </button>
        </div>
      </div>
    </SideDrawer>
  );
}
