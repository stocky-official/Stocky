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
import { useTranslation } from '@/lib/i18n';

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
  { id: 'inventory', labelKey: 'drawers.memberDetail.pages.inventory', descKey: 'drawers.memberDetail.pages.inventoryDesc' },
  { id: 'transfers', labelKey: 'drawers.memberDetail.pages.transfers', descKey: 'drawers.memberDetail.pages.transfersDesc' },
  { id: 'suppliers', labelKey: 'drawers.memberDetail.pages.suppliers', descKey: 'drawers.memberDetail.pages.suppliersDesc' },
  { id: 'tasks', labelKey: 'drawers.memberDetail.pages.tasks', descKey: 'drawers.memberDetail.pages.tasksDesc' },
  { id: 'attendance', labelKey: 'drawers.memberDetail.pages.attendance', descKey: 'drawers.memberDetail.pages.attendanceDesc' },
  { id: 'locations', labelKey: 'drawers.memberDetail.pages.locations', descKey: 'drawers.memberDetail.pages.locationsDesc' },
  { id: 'team', labelKey: 'drawers.memberDetail.pages.team', descKey: 'drawers.memberDetail.pages.teamDesc' },
];

const defaultPagesForRole = (memberRole: CompanyUserRole) => {
  if (memberRole === 'owner' || memberRole === 'admin') return AVAILABLE_PAGES.map((page) => page.id);
  if (memberRole === 'manager') return ['inventory', 'transfers', 'suppliers', 'tasks', 'attendance', 'locations'];
  return ['tasks', 'attendance', 'locations'];
};

const defaultCapabilitiesForRole = (memberRole: CompanyUserRole) => ({
  can_edit_stock: memberRole !== 'staff',
  can_approve_transfers: memberRole === 'owner' || memberRole === 'admin' || memberRole === 'manager',
  can_manage_team: memberRole === 'owner' || memberRole === 'admin',
  can_manage_attendance: memberRole === 'owner' || memberRole === 'admin' || memberRole === 'manager',
});

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
  const { t } = useTranslation();
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

      const currentPages = member.permissions?.pages || defaultPagesForRole(member.role || 'staff');
      setAllowedPages(currentPages);

      const defaults = defaultCapabilitiesForRole(member.role || 'staff');
      setCapabilities({
        can_edit_stock: Boolean(member.permissions?.capabilities?.can_edit_stock ?? defaults.can_edit_stock),
        can_approve_transfers: Boolean(member.permissions?.capabilities?.can_approve_transfers ?? defaults.can_approve_transfers),
        can_manage_team: Boolean(member.permissions?.capabilities?.can_manage_team ?? defaults.can_manage_team),
        can_manage_attendance: Boolean(member.permissions?.capabilities?.can_manage_attendance ?? defaults.can_manage_attendance),
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

  const handleRoleChange = (nextRole: CompanyUserRole) => {
    setRole(nextRole);
    setAllowedPages(defaultPagesForRole(nextRole));
    setCapabilities(defaultCapabilitiesForRole(nextRole));
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
      alert(err?.message || t('drawers.memberDetail.errors.updateFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SideDrawer
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel={`${t('drawers.memberDetail.title')}: ${member.full_name || member.email}`}
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
            aria-label={t('drawers.memberDetail.close')}
          >
            <XIcon size="xs" />
          </button>
        </div>

        {/* Drawer Body Form */}
        <form
          id="member-detail-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-6 text-start"
        >
          {/* Section: Profile & Identity */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stocky-text-sub flex items-center gap-2">
              <UsersIcon size="xs" /> {t('drawers.memberDetail.profileTitle')}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block text-xs font-medium text-stocky-text-main">
                {t('drawers.memberDetail.fullName')}
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t('drawers.memberDetail.fullNamePlaceholder')}
                  className="mt-1.5 h-10 w-full rounded-xl border border-stocky-border-subtle bg-stocky-bg-widget px-3 text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none"
                />
              </label>

              <label className="block text-xs font-medium text-stocky-text-main">
                {t('drawers.memberDetail.jobTitle')}
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder={t('drawers.memberDetail.jobTitlePlaceholder')}
                  className="mt-1.5 h-10 w-full rounded-xl border border-stocky-border-subtle bg-stocky-bg-widget px-3 text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block text-xs font-medium text-stocky-text-main">
                {t('drawers.memberDetail.role')}
                <select
                  value={role}
                  disabled={member.role === 'owner' || !canManage}
                  onChange={(e) => handleRoleChange(e.target.value as CompanyUserRole)}
                  className="mt-1.5 h-10 w-full rounded-xl border border-stocky-border-subtle bg-stocky-bg-widget px-3 text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none disabled:bg-stocky-bg-global"
                >
                  <option value="staff">{t('drawers.memberDetail.roles.staff')}</option>
                  <option value="manager">{t('drawers.memberDetail.roles.manager')}</option>
                  <option value="admin">{t('drawers.memberDetail.roles.admin')}</option>
                  {member.role === 'owner' && <option value="owner">{t('drawers.memberDetail.roles.owner')}</option>}
                </select>
              </label>

              <label className="block text-xs font-medium text-stocky-text-main">
                {t('drawers.memberDetail.reportsTo')}
                <select
                  value={reportsTo}
                  disabled={member.role === 'owner' || !canManage}
                  onChange={(e) => setReportsTo(e.target.value)}
                  className="mt-1.5 h-10 w-full rounded-xl border border-stocky-border-subtle bg-stocky-bg-widget px-3 text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none disabled:bg-stocky-bg-global"
                >
                  <option value="">{t('drawers.memberDetail.reportsToNone')}</option>
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
              <WarehouseIcon size="xs" /> {t('drawers.memberDetail.locationAssignments')}
            </h3>
            <p className="text-xs text-stocky-text-sub">
              {t('drawers.memberDetail.locationAssignmentsDesc')}
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              {memberAssignments.map((assignment) => {
                const loc = locations.find((l) => l.id === assignment.location_id);
                return (
                  <span
                    key={assignment.id}
                    className="inline-flex items-center gap-1.5 rounded-full border stocky-status-info px-3 py-1 text-xs"
                  >
                    <span>{loc?.name || t('drawers.memberDetail.assignedLocation')}</span>
                    {canManage && (
                      <button
                        type="button"
                        onClick={() => onUnassignLocation(assignment.id)}
                        className="text-stocky-text-sub hover:text-stocky-text-main cursor-pointer"
                        title={t('drawers.memberDetail.removeLocation')}
                      >
                        <XIcon size="xs" />
                      </button>
                    )}
                  </span>
                );
              })}

              {memberAssignments.length === 0 && (
                <span className="text-xs text-stocky-status-warning-fg font-medium py-1">
                  {t('drawers.memberDetail.noLocationAssigned')}
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
                  className="h-9 rounded-full border border-stocky-border-subtle bg-stocky-bg-widget px-3 text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none cursor-pointer"
                >
                  <option value="">{t('drawers.memberDetail.assignAnotherLocation')}</option>
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
                <ShieldIcon size="xs" /> {t('drawers.memberDetail.granularAuthorizations')}
              </h3>

              {/* Quick Presets */}
              {canManage && member.role !== 'owner' && (
                <div className="flex items-center gap-1 text-[11px]">
                  <span className="text-stocky-text-sub me-1">{t('drawers.memberDetail.presets')}</span>
                  <button
                    type="button"
                    onClick={() => applyPreset('admin')}
                    className="px-2 py-0.5 rounded-full border border-stocky-border-subtle bg-stocky-bg-widget hover:bg-stocky-bg-global cursor-pointer"
                  >
                    {t('drawers.memberDetail.presetsAdmin')}
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('manager')}
                    className="px-2 py-0.5 rounded-full border border-stocky-border-subtle bg-stocky-bg-widget hover:bg-stocky-bg-global cursor-pointer"
                  >
                    {t('drawers.memberDetail.presetsManager')}
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('warehouse')}
                    className="px-2 py-0.5 rounded-full border border-stocky-border-subtle bg-stocky-bg-widget hover:bg-stocky-bg-global cursor-pointer"
                  >
                    {t('drawers.memberDetail.presetsWarehouse')}
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('staff')}
                    className="px-2 py-0.5 rounded-full border border-stocky-border-subtle bg-stocky-bg-widget hover:bg-stocky-bg-global cursor-pointer"
                  >
                    {t('drawers.memberDetail.presetsStaff')}
                  </button>
                </div>
              )}
            </div>

            {/* Page Access Checkbox List */}
            <div className="rounded-xl border border-stocky-border-subtle divide-y divide-stocky-border-subtle overflow-hidden bg-stocky-bg-widget">
              <div className="bg-stocky-bg-global px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider text-stocky-text-sub">
                {t('drawers.memberDetail.permittedModules')}
              </div>
              {AVAILABLE_PAGES.map((page) => {
                const isChecked = allowedPages.includes(page.id);
                return (
                  <label
                    key={page.id}
                    className={`flex items-start justify-between p-3 cursor-pointer hover:bg-stocky-bg-global/60 transition-colors ${isChecked ? 'bg-stocky-bg-global/30' : ''}`}
                  >
                    <div className="min-w-0 pe-3">
                      <p className="text-xs font-medium text-stocky-text-main">{t(page.labelKey)}</p>
                      <p className="text-[11px] text-stocky-text-sub mt-0.5">{t(page.descKey)}</p>
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
            <div className="rounded-xl border border-stocky-border-subtle divide-y divide-stocky-border-subtle overflow-hidden bg-stocky-bg-widget mt-3">
              <div className="bg-stocky-bg-global px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider text-stocky-text-sub">
                {t('drawers.memberDetail.operationalPrivileges')}
              </div>

              <label className="flex items-center justify-between p-3 cursor-pointer hover:bg-stocky-bg-global/60">
                <div>
                  <p className="text-xs font-medium text-stocky-text-main">{t('drawers.memberDetail.inventoryEdit')}</p>
                  <p className="text-[11px] text-stocky-text-sub">{t('drawers.memberDetail.inventoryEditDesc')}</p>
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
                  <p className="text-xs font-medium text-stocky-text-main">{t('drawers.memberDetail.transferApprovals')}</p>
                  <p className="text-[11px] text-stocky-text-sub">{t('drawers.memberDetail.transferApprovalsDesc')}</p>
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
                  <p className="text-xs font-medium text-stocky-text-main">{t('drawers.memberDetail.attendanceLeave')}</p>
                  <p className="text-[11px] text-stocky-text-sub">{t('drawers.memberDetail.attendanceLeaveDesc')}</p>
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
                  <p className="text-xs font-medium text-stocky-text-main">{t('drawers.memberDetail.teamAdmin')}</p>
                  <p className="text-[11px] text-stocky-text-sub">{t('drawers.memberDetail.teamAdminDesc')}</p>
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
            className="h-10 rounded-full border border-stocky-border-subtle bg-stocky-bg-widget px-5 text-xs font-medium text-stocky-text-main hover:bg-stocky-bg-global transition-colors cursor-pointer"
          >
            {t('drawers.memberDetail.cancel')}
          </button>
          <button
            type="submit"
            form="member-detail-form"
            disabled={saving}
            className="h-10 rounded-full bg-stocky-primary px-6 text-xs font-medium text-stocky-text-inverse hover:bg-stocky-primary-hover transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {saving ? t('drawers.memberDetail.saving') : t('drawers.memberDetail.save')}
          </button>
        </div>
      </div>
    </SideDrawer>
  );
}
