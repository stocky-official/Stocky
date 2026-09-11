'use client';

import React, { useState } from 'react';
import { InfoIcon, PlusIcon, UsersIcon, XIcon } from '@stocky/icons';
import type { CompanyUserRole, Location } from '@stocky/types';
import { UserAvatar } from '@/components/ui/UserAvatar';

type TeamMember = { id: string; email: string; full_name?: string | null; avatar_url?: string | null; role: CompanyUserRole; status?: string };
type Assignment = { id: string; user_id: string; location_id: string };

export interface TeamAccessWidgetProps {
  members: TeamMember[];
  locations: Location[];
  assignments: Assignment[];
  canManage: boolean;
  isInviteOpen?: boolean;
  onToggleInvite?: () => void;
  onInvite: (input: { email: string; fullName?: string; role: CompanyUserRole; locationId?: string }) => Promise<void>;
  onRoleChange: (memberId: string, role: CompanyUserRole) => Promise<void>;
  onAssign: (memberId: string, locationId: string) => Promise<void>;
  onUnassign: (assignmentId: string) => Promise<void>;
}

export function TeamAccessWidget({ members, locations, assignments, canManage, isInviteOpen, onToggleInvite, onInvite, onRoleChange, onAssign, onUnassign }: TeamAccessWidgetProps) {
  const [showInvite, setShowInvite] = useState(false);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<CompanyUserRole>('staff');
  const [locationId, setLocationId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roleHelpOpen, setRoleHelpOpen] = useState(false);
  const [roleHelpPinned, setRoleHelpPinned] = useState(false);
  const roleHelpVisible = roleHelpOpen || roleHelpPinned;

  const roleDefinitions: Array<[string, string]> = [
    ['Owner', 'Everything across the company'],
    ['Admin', 'Company-wide operations and team management'],
    ['Branch manager', 'Assigned location operations, approvals, and counts'],
    ['Staff', 'Receive, scan, count, and review expiry tasks'],
  ];

  const memberAvatar = (member: TeamMember) => (
    <UserAvatar
      src={member.avatar_url}
      name={member.full_name}
      email={member.email}
      size="md"
    />
  );

  const invite = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return setError('Enter the team member email.');
    setSaving(true); setError(null);
    try { await onInvite({ email: email.trim().toLowerCase(), fullName: fullName.trim() || undefined, role, locationId: locationId || undefined }); setEmail(''); setFullName(''); setRole('staff'); setLocationId(''); setShowInvite(false); } catch (inviteError: any) { setError(inviteError?.message || 'Could not invite this team member.'); } finally { setSaving(false); }
  };

  const effectiveShowInvite = isInviteOpen !== undefined ? isInviteOpen : showInvite;
  const closeInvite = () => {
    if (onToggleInvite) onToggleInvite();
    else setShowInvite(false);
  };

  return (
    <div className="stocky-team-workspace flex flex-col gap-4">
      {canManage && (
        <div className="flex items-center justify-end gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setRoleHelpPinned((current) => !current)}
              onMouseEnter={() => setRoleHelpOpen(true)}
              onMouseLeave={() => setRoleHelpOpen(false)}
              onFocus={() => setRoleHelpOpen(true)}
              aria-label="Explain team roles"
              aria-expanded={roleHelpVisible}
              title="Role definitions"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-stocky-border-subtle bg-white text-stocky-text-sub hover:border-stocky-primary hover:text-stocky-primary cursor-pointer"
            >
              <InfoIcon size="xs" />
            </button>
            {roleHelpVisible && (
              <div
                onMouseEnter={() => setRoleHelpOpen(true)}
                onMouseLeave={() => setRoleHelpOpen(false)}
                className="absolute right-0 top-[calc(100%+8px)] z-20 w-72 rounded-xl border border-stocky-border-subtle bg-white p-2 shadow-xl"
              >
                <p className="px-2 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-stocky-primary">
                  Role definitions
                </p>
                {roleDefinitions.map(([label, description]) => (
                  <div key={label} className="rounded-lg px-2 py-2 hover:bg-stocky-bg-global">
                    <p className="text-xs font-medium text-stocky-text-main">{label}</p>
                    <p className="mt-0.5 text-[10px] text-stocky-text-sub">{description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {effectiveShowInvite && (
        <form onSubmit={invite} className="grid grid-cols-1 gap-3 rounded-2xl border border-stocky-border-subtle bg-white p-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="text-xs font-medium text-stocky-text-main">
            Email
            <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@company.com" className="mt-1.5 h-9 w-full rounded-xl border border-stocky-border-subtle px-3 text-xs focus:border-stocky-primary focus:outline-none" />
          </label>
          <label className="text-xs font-medium text-stocky-text-main">
            Name
            <input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Optional" className="mt-1.5 h-9 w-full rounded-xl border border-stocky-border-subtle px-3 text-xs focus:border-stocky-primary focus:outline-none" />
          </label>
          <label className="text-xs font-medium text-stocky-text-main">
            Role
            <select value={role} onChange={(event) => setRole(event.target.value as CompanyUserRole)} className="mt-1.5 h-9 w-full rounded-xl border border-stocky-border-subtle px-3 text-xs focus:border-stocky-primary focus:outline-none">
              <option value="staff">Staff</option>
              <option value="manager">Branch manager</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <label className="text-xs font-medium text-stocky-text-main">
            First location
            <select value={locationId} onChange={(event) => setLocationId(event.target.value)} className="mt-1.5 h-9 w-full rounded-xl border border-stocky-border-subtle px-3 text-xs focus:border-stocky-primary focus:outline-none">
              <option value="">Assign later</option>
              {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
            </select>
          </label>
          <div className="flex items-center justify-end gap-2 md:col-span-2 xl:col-span-4">
            {error && <p className="mr-auto text-xs text-red-700">{error}</p>}
            <button type="button" onClick={closeInvite} className="h-9 rounded-full border border-stocky-border-subtle px-3 text-xs cursor-pointer">Cancel</button>
            <button type="submit" disabled={saving} className="h-9 rounded-full bg-stocky-primary px-3 text-xs font-medium text-white disabled:opacity-60 cursor-pointer">{saving ? 'Inviting...' : 'Send invite'}</button>
          </div>
        </form>
      )}

      <div className="stocky-team-table-shell overflow-hidden rounded-2xl border border-stocky-border-subtle bg-white">
        {members.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <UsersIcon size="md" className="mx-auto text-stocky-text-sub/50" />
            <h2 className="mt-3 text-base font-medium text-stocky-text-main">No team members yet</h2>
            <p className="mt-1 text-sm font-normal text-stocky-text-sub">Invite the first person who will help operate the company.</p>
          </div>
        ) : (
          <div className="stocky-team-table-scroll overflow-x-auto">
            <table className="stocky-team-table w-full min-w-[760px] text-left">
              <thead className="bg-stocky-bg-global">
                <tr className="border-b border-stocky-border-subtle text-[10px] font-medium uppercase tracking-wide text-stocky-text-sub">
                  <th className="px-4 py-2.5">Member</th>
                  <th className="px-4 py-2.5">Role</th>
                  <th className="px-4 py-2.5">Locations</th>
                  <th className="px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stocky-border-subtle">
                {members.map((member) => {
                  const memberAssignments = assignments.filter((assignment) => assignment.user_id === member.id);
                  const assignedIds = new Set(memberAssignments.map((assignment) => assignment.location_id));
                  return (
                    <tr key={member.id} className="align-middle hover:bg-stocky-bg-global/60">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          {memberAvatar(member)}
                          <div className="min-w-0">
                            <p className="max-w-[250px] truncate text-xs font-medium text-stocky-text-main">{member.full_name || member.email}</p>
                            <p className="mt-0.5 max-w-[280px] truncate text-[10px] text-stocky-text-sub">{member.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        {member.role === 'owner' || !canManage ? (
                          <span className="inline-flex rounded-full border stocky-status-muted px-2 py-1 text-[10px] font-medium capitalize">{member.role}</span>
                        ) : (
                          <select value={member.role} onChange={(event) => onRoleChange(member.id, event.target.value as CompanyUserRole)} className="h-7 rounded-full border border-stocky-border-subtle px-2 text-[10px] capitalize">
                            <option value="admin">Admin</option>
                            <option value="manager">Branch manager</option>
                            <option value="staff">Staff</option>
                          </select>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex max-w-[360px] flex-wrap items-center gap-1">
                          {memberAssignments.map((assignment) => (
                            <span key={assignment.id} className="inline-flex items-center gap-1 rounded-full border stocky-status-info px-2 py-1 text-[10px]">
                              {locations.find((location) => location.id === assignment.location_id)?.name || 'Location'}
                              {canManage && <button type="button" onClick={() => onUnassign(assignment.id)} className="stocky-text-info hover:text-stocky-text-main cursor-pointer" aria-label="Remove location"><XIcon size="xs" /></button>}
                            </span>
                          ))}
                          {memberAssignments.length === 0 && <span className="text-[10px] stocky-text-warning">No location assigned</span>}
                          {canManage && (
                            <select value="" onChange={(event) => { if (event.target.value) onAssign(member.id, event.target.value); }} className="h-7 rounded-full border border-stocky-border-subtle px-2 text-[10px]">
                              <option value="">+ Assign</option>
                              {locations.filter((location) => !assignedIds.has(location.id)).map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
                            </select>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex rounded-full border px-2 py-1 text-[10px] capitalize ${member.status === 'active' ? 'stocky-status-success' : 'stocky-status-warning'}`}>{member.status || 'active'}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
