'use client';

import React from 'react';
import {
  ChevronRightIcon,
  EditIcon,
  ShieldIcon,
  UsersIcon,
  WarehouseIcon,
  XIcon,
} from '@stocky/icons';
import type { Location } from '@stocky/types';
import { UserAvatar } from '@/components/ui/UserAvatar';
import type { TeamMemberData } from './MemberDetailDrawer';
import { useTranslation } from '@/lib/i18n';

export interface TeamTableWidgetProps {
  members: TeamMemberData[];
  locations: Location[];
  assignments: Array<{ id: string; user_id: string; location_id: string }>;
  canManage: boolean;
  onSelectMember: (member: TeamMemberData) => void;
  onAssignLocation: (userId: string, locationId: string) => Promise<void>;
  onUnassignLocation: (assignmentId: string) => Promise<void>;
}

export function TeamTableWidget({
  members,
  locations,
  assignments,
  canManage,
  onSelectMember,
  onAssignLocation,
  onUnassignLocation,
}: TeamTableWidgetProps) {
  const { t } = useTranslation();

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return <span className="inline-flex rounded-full border stocky-status-muted px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider">{t('team.roleOwner')}</span>;
      case 'admin':
        return <span className="inline-flex rounded-full border stocky-status-info px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider">{t('team.roleAdmin')}</span>;
      case 'manager':
        return <span className="inline-flex rounded-full border stocky-status-hold px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider">{t('team.roleManager')}</span>;
      default:
        return <span className="inline-flex rounded-full border stocky-status-muted px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider">{t('team.roleStaff')}</span>;
    }
  };

  if (members.length === 0) {
    return (
      <div className="px-6 py-16 text-center">
        <UsersIcon size="md" className="mx-auto text-stocky-text-sub/50" />
        <h2 className="mt-3 text-base font-semibold text-stocky-text-main">{t('team.noMatchingMembers')}</h2>
        <p className="mt-1 text-xs text-stocky-text-sub">{t('team.noMatchingMembersDesc')}</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Desktop Table (hidden on mobile) */}
      <div className="hidden sm:block stocky-team-table-scroll overflow-x-auto w-full">
      <table className="stocky-board-table w-full min-w-[850px] text-start">
        <thead>
          <tr className="border-b border-stocky-border-subtle bg-stocky-bg-global text-[10px] font-medium uppercase tracking-wider text-stocky-text-sub h-11">
            <th className="px-4 py-2.5 whitespace-nowrap">{t('team.colMember')}</th>
            <th className="px-4 py-2.5 whitespace-nowrap">{t('team.colRoleJobTitle')}</th>
            <th className="px-4 py-2.5 whitespace-nowrap">{t('team.colReportsTo')}</th>
            <th className="px-4 py-2.5 whitespace-nowrap">{t('team.colLocations')}</th>
            <th className="px-4 py-2.5 whitespace-nowrap">{t('team.colAuthorizations')}</th>
            <th className="px-4 py-2.5 whitespace-nowrap">{t('team.colStatus')}</th>
            <th className="px-4 py-2.5 whitespace-nowrap text-end">{t('team.colActions')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stocky-border-subtle text-xs">
          {members.map((member) => {
            const memberAssignments = assignments.filter((a) => a.user_id === member.id);
            const assignedIds = new Set(memberAssignments.map((a) => a.location_id));
            const manager = member.reports_to ? members.find((m) => m.id === member.reports_to) : null;
            const allowedPages = member.permissions?.pages || ['inventory', 'transfers', 'suppliers', 'tasks', 'attendance', 'locations'];

            return (
              <tr
                key={member.id}
                className="align-middle hover:bg-stocky-bg-global/50 transition-colors"
              >
                {/* 1. Member Column */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      src={member.avatar_url}
                      name={member.full_name}
                      email={member.email}
                      size="sm"
                      className="ring-1 ring-stocky-border-subtle shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-stocky-text-main truncate max-w-[200px]">
                        {member.full_name || member.email}
                      </p>
                      <p className="text-[11px] text-stocky-text-sub truncate max-w-[220px]">
                        {member.email}
                      </p>
                    </div>
                  </div>
                </td>

                {/* 2. Role & Job Title */}
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1 items-start">
                    {getRoleBadge(member.role)}
                    <span className="text-xs font-medium text-stocky-text-main truncate max-w-[180px]">
                      {member.job_title || <span className="text-stocky-text-sub italic">{t('team.noTitleAssigned')}</span>}
                    </span>
                  </div>
                </td>

                {/* 3. Reports To */}
                <td className="px-4 py-3">
                  {manager ? (
                    <div className="flex items-center gap-2">
                      <UserAvatar
                        src={manager.avatar_url}
                        name={manager.full_name}
                        email={manager.email}
                        size="xs"
                        className="shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-stocky-text-main truncate max-w-[140px]">
                          {manager.full_name || manager.email}
                        </p>
                        <p className="text-[10px] text-stocky-text-sub truncate">
                          {manager.job_title || manager.role}
                        </p>
                      </div>
                    </div>
                  ) : member.role === 'owner' ? (
                    <span className="text-[11px] text-stocky-text-sub font-medium">
                      {t('team.topOfHierarchy')}
                    </span>
                  ) : (
                    <span className="text-[11px] text-stocky-text-sub italic">
                      {t('team.reportsToOwner')}
                    </span>
                  )}
                </td>

                {/* 4. Assigned Locations */}
                <td className="px-4 py-3">
                  <div className="flex max-w-[240px] flex-wrap items-center gap-1">
                    {memberAssignments.map((assignment) => {
                      const loc = locations.find((l) => l.id === assignment.location_id);
                      return (
                        <span
                          key={assignment.id}
                          className="inline-flex items-center gap-1 rounded-full border stocky-status-info px-2 py-0.5 text-[10px]"
                        >
                          <span className="truncate max-w-[90px]">{loc?.name || t('common.location')}</span>
                          {canManage && (
                            <button
                              type="button"
                              onClick={() => onUnassignLocation(assignment.id)}
                              className="text-stocky-text-sub hover:text-stocky-text-main cursor-pointer"
                              title={t('team.unassign')}
                            >
                              <XIcon size="xs" />
                            </button>
                          )}
                        </span>
                      );
                    })}

                    {memberAssignments.length === 0 && (
                      <span className="text-[11px] text-stocky-text-sub italic">{t('team.noLocation')}</span>
                    )}

                    {canManage && (
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value) onAssignLocation(member.id, e.target.value);
                        }}
                        className="h-6 rounded-full border border-stocky-border-subtle bg-stocky-bg-widget px-2 text-[10px] text-stocky-text-sub hover:text-stocky-text-main cursor-pointer"
                      >
                        <option value="">{t('team.assignLocationBtn')}</option>
                        {locations
                          .filter((l) => !assignedIds.has(l.id))
                          .map((l) => (
                            <option key={l.id} value={l.id}>
                              {l.name}
                            </option>
                          ))}
                      </select>
                    )}
                  </div>
                </td>

                {/* 5. Authorizations */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-stocky-bg-global px-2.5 py-0.5 text-[10px] font-medium text-stocky-text-main border border-stocky-border-subtle">
                      <ShieldIcon size="xs" className="text-stocky-primary" />
                      <span>{t('team.pagesCount', { count: allowedPages.length })}</span>
                    </span>
                    {canManage && (
                      <button
                        type="button"
                        onClick={() => onSelectMember(member)}
                        className="text-[11px] text-stocky-primary hover:underline cursor-pointer font-medium"
                      >
                        {t('team.manageBtn')}
                      </button>
                    )}
                  </div>
                </td>

                {/* 6. Status */}
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-medium border capitalize ${
                      member.status === 'active' ? 'stocky-status-success' : 'stocky-status-warning'
                    }`}
                  >
                    {member.status === 'invited' ? t('team.statusInvited') : t('team.statusActive')}
                  </span>
                </td>

                {/* 7. Actions */}
                <td className="px-4 py-3 text-end">
                  <button
                    type="button"
                    onClick={() => onSelectMember(member)}
                    className="h-8 px-3 rounded-full border border-stocky-border-subtle bg-stocky-bg-widget text-xs font-medium text-stocky-text-main hover:border-stocky-primary hover:text-stocky-primary inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <EditIcon size="xs" />
                    <span>{t('team.editBtn')}</span>
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>

      {/* Mobile Card List (sm:hidden) */}
      <div className="sm:hidden divide-y divide-stocky-border-subtle w-full">
        {members.map((member) => {
          const memberAssignments = assignments.filter((a) => a.user_id === member.id);
          const locationText =
            memberAssignments.length > 0
              ? (locations.find((l) => l.id === memberAssignments[0].location_id)?.name || t('common.location')) +
                (memberAssignments.length > 1 ? ` +${memberAssignments.length - 1}` : '')
              : t('team.allLocations');

          const subtitleText = [
            member.job_title || null,
            locationText,
          ].filter(Boolean).join(' · ') || member.email;

          return (
            <div
              key={member.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectMember(member)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectMember(member);
                }
              }}
              className="p-3.5 flex items-center justify-between gap-3 bg-stocky-bg-widget hover:bg-stocky-bg-global/30 active:bg-stocky-bg-global/50 transition-colors cursor-pointer text-start"
            >
              {/* Left Stack: Avatar + Name & Subtitle */}
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <UserAvatar
                  src={member.avatar_url}
                  name={member.full_name}
                  email={member.email}
                  size="sm"
                  className="ring-1 ring-stocky-border-subtle shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-stocky-text-main text-xs truncate leading-tight">
                    {member.full_name || member.email}
                  </p>
                  <p className="text-[11px] text-stocky-text-sub truncate mt-0.5">
                    {subtitleText}
                  </p>
                </div>
              </div>

              {/* Right Stack: Role & Status */}
              <div className="shrink-0 flex flex-col items-end gap-1">
                {getRoleBadge(member.role)}
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-medium border capitalize ${
                    member.status === 'active' ? 'stocky-status-success' : 'stocky-status-warning'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full me-1 ${
                      member.status === 'active' ? 'bg-stocky-status-success-fg' : 'bg-stocky-status-warning-fg'
                    }`}
                  />
                  {member.status === 'invited' ? t('team.statusInvited') : t('team.statusActive')}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
