'use client';

import React, { useState } from 'react';
import { MailIcon, PlusIcon, WarehouseIcon, XIcon } from '@stocky/icons';
import type { CompanyUserRole, Location } from '@stocky/types';
import { SideDrawer } from '@/components/ui/SideDrawer';
import { UserAvatar } from '@/components/ui/UserAvatar';
import type { TeamMemberData } from './MemberDetailDrawer';

export interface TeamInviteDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  locations: Location[];
  allMembers: TeamMemberData[];
  onInvite: (input: {
    email: string;
    fullName?: string;
    jobTitle?: string;
    role: CompanyUserRole;
    locationId?: string;
    reportsTo?: string;
  }) => Promise<void>;
}

export function TeamInviteDrawer({
  isOpen,
  onClose,
  locations,
  allMembers,
  onInvite,
}: TeamInviteDrawerProps) {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [role, setRole] = useState<CompanyUserRole>('staff');
  const [locationId, setLocationId] = useState('');
  const [reportsTo, setReportsTo] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please provide a valid work email.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onInvite({
        email: email.trim().toLowerCase(),
        fullName: fullName.trim() || undefined,
        jobTitle: jobTitle.trim() || undefined,
        role,
        locationId: locationId || undefined,
        reportsTo: reportsTo || undefined,
      });
      setEmail('');
      setFullName('');
      setJobTitle('');
      setRole('staff');
      setLocationId('');
      setReportsTo('');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to send invitation.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SideDrawer isOpen={isOpen} onClose={onClose} ariaLabel="Invite team member">
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stocky-border-subtle px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-stocky-accent/20 text-stocky-text-main">
              <PlusIcon size="xs" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-stocky-text-main">Invite Team Member</h2>
              <p className="text-xs text-stocky-text-sub">Add a teammate with assigned role, title, and initial location.</p>
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

        {/* Form */}
        <form
          id="team-invite-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-4 text-left"
        >
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              {error}
            </div>
          )}

          <label className="block text-xs font-medium text-stocky-text-main">
            Email Address *
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@company.com"
              className="mt-1.5 h-10 w-full rounded-xl border border-stocky-border-subtle bg-white px-3 text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none"
            />
          </label>

          <label className="block text-xs font-medium text-stocky-text-main">
            Full Name
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Sarah Jenkins"
              className="mt-1.5 h-10 w-full rounded-xl border border-stocky-border-subtle bg-white px-3 text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none"
            />
          </label>

          <label className="block text-xs font-medium text-stocky-text-main">
            Official Job Title
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. Inventory Supervisor, Lead Barista"
              className="mt-1.5 h-10 w-full rounded-xl border border-stocky-border-subtle bg-white px-3 text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none"
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block text-xs font-medium text-stocky-text-main">
              Platform Role
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as CompanyUserRole)}
                className="mt-1.5 h-10 w-full rounded-xl border border-stocky-border-subtle bg-white px-3 text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none"
              >
                <option value="staff">Staff (Floor / Scans / Clock in)</option>
                <option value="manager">Branch Manager (Approvals / Counts)</option>
                <option value="admin">Administrator (Company-wide)</option>
              </select>
            </label>

            <label className="block text-xs font-medium text-stocky-text-main">
              Primary Location
              <select
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className="mt-1.5 h-10 w-full rounded-xl border border-stocky-border-subtle bg-white px-3 text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none"
              >
                <option value="">Assign later</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.type})
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block text-xs font-medium text-stocky-text-main">
            Reports To (Direct Supervisor)
            <select
              value={reportsTo}
              onChange={(e) => setReportsTo(e.target.value)}
              className="mt-1.5 h-10 w-full rounded-xl border border-stocky-border-subtle bg-white px-3 text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none"
            >
              <option value="">None (Top of hierarchy / Reports to Owner)</option>
              {allMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name || m.email} ({m.job_title || m.role})
                </option>
              ))}
            </select>
          </label>
        </form>

        {/* Footer (Standard 40px buttons) */}
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
            form="team-invite-form"
            disabled={saving || !email.trim()}
            className="h-10 rounded-full bg-stocky-primary px-6 text-xs font-medium text-white hover:bg-stocky-primary-hover transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {saving ? 'Sending invitation...' : 'Send invitation'}
          </button>
        </div>
      </div>
    </SideDrawer>
  );
}
