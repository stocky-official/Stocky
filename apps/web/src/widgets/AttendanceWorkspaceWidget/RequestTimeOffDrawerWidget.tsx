'use client';

import React, { useState, useMemo } from 'react';
import type { LeaveType } from '@stocky/types';
import { SideDrawer } from '@/components/ui/SideDrawer';
import { CalendarIcon, UsersIcon, AlertCircleIcon, XIcon } from '@stocky/icons';

export interface RequestTimeOffDrawerWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  members: any[];
  onSubmit: (input: {
    leaveType: LeaveType;
    startDate: string;
    endDate: string;
    daysCount: number;
    managerUserId: string;
    reason?: string;
  }) => Promise<void>;
}

export function RequestTimeOffDrawerWidget({
  isOpen,
  onClose,
  members,
  onSubmit,
}: RequestTimeOffDrawerWidgetProps) {
  const [leaveType, setLeaveType] = useState<LeaveType>('pto');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Managers/Admins eligible for reviewing
  const managers = useMemo(() => {
    return members.filter((m) => ['owner', 'admin', 'manager'].includes(m.role));
  }, [members]);

  const [managerUserId, setManagerUserId] = useState(managers[0]?.id || members[0]?.id || '');

  // Calculate business days
  const daysCount = useMemo(() => {
    if (!startDate || !endDate || startDate > endDate) return 1;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  }, [startDate, endDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managerUserId) {
      alert('Please select your direct manager');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        leaveType,
        startDate,
        endDate,
        daysCount,
        managerUserId,
        reason: reason.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to submit leave request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SideDrawer
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel="Request Time Off"
    >
      <div className="flex items-start justify-between gap-4 border-b border-stocky-border-subtle px-5 py-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border stocky-status-info">
            <CalendarIcon size="xs" />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-medium text-stocky-text-main">Request Time Off</h2>
            <p className="mt-1 text-xs text-stocky-text-sub">
              Submit a leave request. This will automatically assign a review task to your manager.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-stocky-text-sub hover:bg-stocky-bg-global"
          aria-label="Close"
        >
          <XIcon size="xs" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col h-full justify-between p-6">
        <div className="space-y-5">
          {/* Leave Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-stocky-text-main mb-2">
              Leave Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['pto', 'sick', 'emergency', 'unpaid'] as LeaveType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setLeaveType(type)}
                  className={`h-10 rounded-widget text-xs font-semibold capitalize border transition-all cursor-pointer ${
                    leaveType === type
                      ? 'border-stocky-primary bg-stocky-primary/10 text-stocky-primary'
                      : 'border-stocky-border-subtle bg-stocky-bg-widget text-stocky-text-sub hover:border-stocky-primary/50'
                  }`}
                >
                  {type === 'pto' ? 'Annual (PTO)' : type}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stocky-text-main mb-1.5">
                Start Date
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-10 rounded-widget border border-stocky-border-subtle bg-stocky-bg-widget px-3 text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stocky-text-main mb-1.5">
                End Date
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                className="w-full h-10 rounded-widget border border-stocky-border-subtle bg-stocky-bg-widget px-3 text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="p-3 rounded-widget bg-stocky-bg-global border border-stocky-border-subtle flex items-center justify-between text-xs">
            <span className="text-stocky-text-sub font-medium">Total Duration:</span>
            <span className="font-semibold text-stocky-text-main">{daysCount} Day{daysCount !== 1 ? 's' : ''}</span>
          </div>

          {/* Direct Manager Selector */}
          <div>
            <label className="block text-xs font-semibold text-stocky-text-main mb-1.5">
              Direct Manager (Approver)
            </label>
            <select
              value={managerUserId}
              onChange={(e) => setManagerUserId(e.target.value)}
              className="w-full h-10 rounded-widget border border-stocky-border-subtle bg-stocky-bg-widget px-3 text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none cursor-pointer"
            >
              {managers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name || m.email} ({m.role})
                </option>
              ))}
            </select>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-stocky-text-main mb-1.5">
              Reason / Comments
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide context for your leave request..."
              className="w-full rounded-widget border border-stocky-border-subtle bg-stocky-bg-widget p-3 text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none resize-none"
            />
          </div>

          {/* Task Automation Alert */}
          <div className="p-3.5 rounded-widget stocky-status-info border flex items-start gap-2.5">
            <AlertCircleIcon size="xs" className="shrink-0 mt-0.5 text-stocky-primary" />
            <p className="text-[11px] leading-relaxed">
              Once submitted, a review task will automatically be created and assigned to your manager in the <strong>Tasks workspace</strong>.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-6 border-t border-stocky-border-subtle flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-full border border-stocky-border-subtle px-5 text-xs font-medium text-stocky-text-main hover:bg-stocky-bg-global transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="h-10 rounded-full bg-stocky-primary px-6 text-xs font-medium text-white hover:bg-stocky-primary-hover transition-colors cursor-pointer shadow-sm disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
    </SideDrawer>
  );
}
