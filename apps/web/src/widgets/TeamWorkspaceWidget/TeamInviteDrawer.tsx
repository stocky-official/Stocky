'use client';

import React, { useState } from 'react';
import { MailIcon, PlusIcon, WarehouseIcon, XIcon } from '@stocky/icons';
import type { CompanyUserRole, Location } from '@stocky/types';
import { SideDrawer } from '@/components/ui/SideDrawer';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useTranslation } from '@/lib/i18n';
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
  const { t } = useTranslation();
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
      setError(t('drawers.teamInvite.errors.emailRequired'));
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
      setError(err?.message || t('drawers.teamInvite.errors.inviteFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SideDrawer isOpen={isOpen} onClose={onClose} ariaLabel={t('drawers.teamInvite.title')}>
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stocky-border-subtle px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-stocky-accent/20 text-stocky-text-main">
              <PlusIcon size="xs" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-stocky-text-main">{t('drawers.teamInvite.title')}</h2>
              <p className="text-xs text-stocky-text-sub">{t('drawers.teamInvite.subtitle')}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-stocky-text-sub hover:bg-stocky-bg-global hover:text-stocky-text-main cursor-pointer"
            aria-label={t('drawers.teamInvite.close')}
          >
            <XIcon size="xs" />
          </button>
        </div>

        {/* Form */}
        <form
          id="team-invite-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-4 text-start"
        >
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              {error}
            </div>
          )}

          <label className="block text-xs font-medium text-stocky-text-main">
            {t('drawers.teamInvite.email')}
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('drawers.teamInvite.emailPlaceholder')}
              className="mt-1.5 h-10 w-full rounded-xl border border-stocky-border-subtle bg-white px-3 text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none"
            />
          </label>

          <label className="block text-xs font-medium text-stocky-text-main">
            {t('drawers.teamInvite.fullName')}
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t('drawers.teamInvite.fullNamePlaceholder')}
              className="mt-1.5 h-10 w-full rounded-xl border border-stocky-border-subtle bg-white px-3 text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none"
            />
          </label>

          <label className="block text-xs font-medium text-stocky-text-main">
            {t('drawers.teamInvite.jobTitle')}
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder={t('drawers.teamInvite.jobTitlePlaceholder')}
              className="mt-1.5 h-10 w-full rounded-xl border border-stocky-border-subtle bg-white px-3 text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none"
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block text-xs font-medium text-stocky-text-main">
              {t('drawers.teamInvite.role')}
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as CompanyUserRole)}
                className="mt-1.5 h-10 w-full rounded-xl border border-stocky-border-subtle bg-white px-3 text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none"
              >
                <option value="staff">{t('drawers.teamInvite.roles.staff')}</option>
                <option value="manager">{t('drawers.teamInvite.roles.manager')}</option>
                <option value="admin">{t('drawers.teamInvite.roles.admin')}</option>
              </select>
            </label>

            <label className="block text-xs font-medium text-stocky-text-main">
              {t('drawers.teamInvite.location')}
              <select
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className="mt-1.5 h-10 w-full rounded-xl border border-stocky-border-subtle bg-white px-3 text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none"
              >
                <option value="">{t('drawers.teamInvite.assignLater')}</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.type})
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block text-xs font-medium text-stocky-text-main">
            {t('drawers.teamInvite.reportsTo')}
            <select
              value={reportsTo}
              onChange={(e) => setReportsTo(e.target.value)}
              className="mt-1.5 h-10 w-full rounded-xl border border-stocky-border-subtle bg-white px-3 text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none"
            >
              <option value="">{t('drawers.teamInvite.reportsToNone')}</option>
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
            {t('drawers.teamInvite.cancel')}
          </button>
          <button
            type="submit"
            form="team-invite-form"
            disabled={saving || !email.trim()}
            className="h-10 rounded-full bg-stocky-primary px-6 text-xs font-medium text-white hover:bg-stocky-primary-hover transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {saving ? t('drawers.teamInvite.sending') : t('drawers.teamInvite.sendInvite')}
          </button>
        </div>
      </div>
    </SideDrawer>
  );
}

