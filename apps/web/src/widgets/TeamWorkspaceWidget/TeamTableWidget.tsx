'use client';

import React from 'react';
import {
  EditIcon,
  ShieldIcon,
  UsersIcon,
  WarehouseIcon,
  XIcon,
} from '@stocky/icons';
import type { Location } from '@stocky/types';
import { UserAvatar } from '@/components/ui/UserAvatar';
import type { TeamMemberData } from './MemberDetailDrawer';

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
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return <span className="inline-flex rounded-full border stocky-status-muted px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider">Owner</span>;
      case 'admin':
        return <span className="inline-flex rounded-full border stocky-status-info px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider">Admin</span>;
      case 'manager':
        return <span className="inline-flex rounded-full border stocky-status-hold px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider">Manager</span>;
      default:
        return <span className="inline-flex rounded-full border stocky-status-muted px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider">Staff</span>;
    }
  };

  if (members.length === 0) {
    return (
      <div className="px-6 py-16 text-center">
        <UsersIcon size="md" className="mx-auto text-stocky-text-sub/50" />
        <h2 className="mt-3 text-base font-semibold text-stocky-text-main">No team members match your filters</h2>
        <p className="mt-1 text-xs text-stocky-text-sub">Try searching with a different name, email, or role filter.</p>
      </div>
    );
  }

  return (
    <div className="stocky-team-table-scroll overflow-x-auto w-full">
      <table className="stocky-board-table w-full min-w-[850px] text-left">
        <thead>
          <tr className="border-b border-stocky-border-subtle bg-stocky-bg-global text-[10px] font-medium uppercase tracking-wider text-stocky-text-sub h-11">
            <th className="px-4 py-2.5 whitespace-nowrap">Member</th>
            <th className="px-4 py-2.5 whitespace-nowrap">Role & Job Title</th>
            <th className="px-4 py-2.5 whitespace-nowrap">Reports To</th>
            <th className="px-4 py-2.5 whitespace-nowrap">Locations</th>
            <th className="px-4 py-2.5 whitespace-nowrap">Authorizations</th>
            <th className="px-4 py-2.5 whitespace-nowrap">Status</th>
            <th className="px-4 py-2.5 whitespace-nowrap text-right">Actions</th>
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
                      {member.job_title || <span className="text-stocky-text-sub italic">No title assigned</span>}
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
                      Top of hierarchy
                    </span>
                  ) : (
                    <span className="text-[11px] text-stocky-text-sub italic">
                      Reports to Owner
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
                          <span className="truncate max-w-[90px]">{loc?.name || 'Location'}</span>
                          {canManage && (
                            <button
                              type="button"
                              onClick={() => onUnassignLocation(assignment.id)}
                              className="text-stocky-text-sub hover:text-stocky-text-main cursor-pointer"
                              title="Unassign"
                            >
                              <XIcon size="xs" />
                            </button>
                          )}
                        </span>
                      );
                    })}

                    {memberAssignments.length === 0 && (
                      <span className="text-[11px] text-stocky-text-sub italic">No location</span>
                    )}

                    {canManage && (
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value) onAssignLocation(member.id, e.target.value);
                        }}
                        className="h-6 rounded-full border border-stocky-border-subtle bg-white px-2 text-[10px] text-stocky-text-sub hover:text-stocky-text-main cursor-pointer"
                      >
                        <option value="">+ Assign</option>
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
                      <span>{allowedPages.length} pages</span>
                    </span>
                    {canManage && (
                      <button
                        type="button"
                        onClick={() => onSelectMember(member)}
                        className="text-[11px] text-stocky-primary hover:underline cursor-pointer font-medium"
                      >
                        Manage
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
                    {member.status || 'active'}
                  </span>
                </td>

                {/* 7. Actions */}
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => onSelectMember(member)}
                    className="h-8 px-3 rounded-full border border-stocky-border-subtle bg-white text-xs font-medium text-stocky-text-main hover:border-stocky-primary hover:text-stocky-primary inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <EditIcon size="xs" />
                    <span>Edit</span>
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
