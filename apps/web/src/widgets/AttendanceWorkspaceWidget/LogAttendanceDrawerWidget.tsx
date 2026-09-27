'use client';

import React, { useState, useMemo } from 'react';
import type { Location } from '@stocky/types';
import { SideDrawer } from '@/components/ui/SideDrawer';
import {
  ClockIcon,
  WarehouseIcon,
  UsersIcon,
  CalendarIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  PlusIcon,
  XIcon,
} from '@stocky/icons';
import { useTranslation } from '@/lib/i18n';

export interface LogAttendanceDrawerWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  members: any[];
  locations: Location[];
  currentUserId?: string | null;
  userRole: string;
  canManageAttendance?: boolean;
  onSubmit: (input: {
    companyUserId: string;
    locationId: string;
    shiftDate: string;
    clockInAt: string;
    clockOutAt?: string | null;
    status?: string;
    notes?: string;
  }) => Promise<void>;
}

export function LogAttendanceDrawerWidget({
  isOpen,
  onClose,
  members,
  locations,
  currentUserId,
  userRole,
  canManageAttendance = false,
  onSubmit,
}: LogAttendanceDrawerWidgetProps) {
  const { t, locale } = useTranslation();

  const now = new Date();
  const currentHours = String(now.getHours()).padStart(2, '0');
  const currentMinutes = String(now.getMinutes()).padStart(2, '0');
  const currentTimeStr = `${currentHours}:${currentMinutes}`;
  const todayStr = now.toISOString().slice(0, 10);

  // Eligible members
  const activeMembers = useMemo(() => {
    return members.filter((m) => m.status !== 'inactive');
  }, [members]);

  const defaultMemberId = useMemo(() => {
    if (!canManageAttendance && currentUserId) return currentUserId;
    return currentUserId || activeMembers[0]?.id || '';
  }, [canManageAttendance, currentUserId, activeMembers]);

  const [selectedMemberId, setSelectedMemberId] = useState(defaultMemberId);
  const [selectedLocationId, setSelectedLocationId] = useState(locations[0]?.id || '');
  const [shiftDate, setShiftDate] = useState(todayStr);
  const [shiftMode, setShiftMode] = useState<'clock_in' | 'completed'>('clock_in');
  const [clockInTime, setClockInTime] = useState(currentTimeStr);
  const [clockOutTime, setClockOutTime] = useState(currentTimeStr);
  const [status, setStatus] = useState<'present' | 'late' | 'overtime' | 'early_departure'>('present');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-detect late status on clock-in time change if not manually adjusted
  const handleClockInChange = (newTime: string) => {
    setClockInTime(newTime);
    const [hours, minutes] = newTime.split(':').map(Number);
    if (!isNaN(hours) && !isNaN(minutes)) {
      if (hours > 9 || (hours === 9 && minutes > 15)) {
        setStatus('late');
      } else {
        setStatus('present');
      }
    }
  };

  // Calculate duration when shiftMode === 'completed'
  const calculatedDuration = useMemo(() => {
    if (shiftMode !== 'completed' || !clockInTime || !clockOutTime) return null;
    const [inH, inM] = clockInTime.split(':').map(Number);
    const [outH, outM] = clockOutTime.split(':').map(Number);
    if (isNaN(inH) || isNaN(inM) || isNaN(outH) || isNaN(outM)) return null;

    let totalM = (outH * 60 + outM) - (inH * 60 + inM);
    if (totalM < 0) totalM += 24 * 60; // overnight shift handling
    const hours = Math.floor(totalM / 60);
    const mins = totalM % 60;
    return { hours, mins, totalMinutes: totalM };
  }, [shiftMode, clockInTime, clockOutTime]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const targetUserId = canManageAttendance ? selectedMemberId : (currentUserId || selectedMemberId);
    if (!targetUserId) {
      setError(t('attendance.employeeRequired') || 'Please select an employee');
      return;
    }
    if (!selectedLocationId) {
      setError(t('attendance.locationRequired') || 'Please select a location');
      return;
    }
    if (!shiftDate) {
      setError(t('attendance.shiftDateRequired') || 'Shift date is required');
      return;
    }
    if (!clockInTime) {
      setError(t('attendance.clockInRequired') || 'Clock-in time is required');
      return;
    }

    const clockInIso = new Date(`${shiftDate}T${clockInTime}:00`).toISOString();
    let clockOutIso: string | null = null;

    if (shiftMode === 'completed') {
      if (!clockOutTime) {
        setError(t('attendance.clockOutAfterClockIn') || 'Clock-out time must be specified');
        return;
      }
      let outDate = shiftDate;
      const [inH, inM] = clockInTime.split(':').map(Number);
      const [outH, outM] = clockOutTime.split(':').map(Number);
      // Handle overnight shift: clock out earlier than clock in
      if (outH < inH || (outH === inH && outM < inM)) {
        const nextDay = new Date(`${shiftDate}T00:00:00`);
        nextDay.setDate(nextDay.getDate() + 1);
        outDate = nextDay.toISOString().slice(0, 10);
      }
      clockOutIso = new Date(`${outDate}T${clockOutTime}:00`).toISOString();
    }

    setSubmitting(true);
    try {
      await onSubmit({
        companyUserId: targetUserId,
        locationId: selectedLocationId,
        shiftDate,
        clockInAt: clockInIso,
        clockOutAt: clockOutIso,
        status,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to log attendance. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedMember = members.find((m) => m.id === (canManageAttendance ? selectedMemberId : (currentUserId || selectedMemberId)));
  const memberName = selectedMember?.full_name || selectedMember?.email?.split('@')[0] || t('attendance.employee');

  return (
    <SideDrawer
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel={t('attendance.logAttendance')}
    >
      {/* Drawer Header */}
      <div className="flex items-start justify-between gap-4 border-b border-stocky-border-subtle px-5 py-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border stocky-status-info">
            <ClockIcon size="xs" />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-medium text-stocky-text-main">
              {t('attendance.logAttendance')}
            </h2>
            <p className="mt-1 text-xs text-stocky-text-sub">
              {t('attendance.logAttendanceSubtitle')}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-stocky-text-sub hover:bg-stocky-bg-global transition-colors"
          aria-label={t('common.close')}
        >
          <XIcon size="xs" />
        </button>
      </div>

      {/* Drawer Form Body */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
        {error && (
          <div className="flex items-center gap-2.5 p-3.5 rounded-xl border border-stocky-status-critical-border bg-stocky-status-critical-bg text-xs text-stocky-status-critical-fg">
            <AlertCircleIcon size="xs" className="shrink-0 text-stocky-status-critical-fg" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Employee Selection */}
        <div>
          <label className="text-xs font-semibold text-stocky-text-main flex items-center gap-1.5 mb-1.5">
            <UsersIcon size="xs" className="text-stocky-primary" />
            <span>{t('attendance.employee')}</span>
          </label>
          {canManageAttendance ? (
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-stocky-bg-widget border border-stocky-border-subtle text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none transition-colors cursor-pointer"
            >
              {activeMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name ? `${m.full_name} (${m.email})` : m.email} - {m.role}
                </option>
              ))}
            </select>
          ) : (
            <div className="flex items-center gap-3 p-3 rounded-xl border border-stocky-border-subtle bg-stocky-bg-global">
              <div className="w-8 h-8 rounded-full bg-stocky-primary/10 text-stocky-primary flex items-center justify-center font-bold text-xs">
                {memberName.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-stocky-text-main truncate">{memberName}</div>
                <div className="text-[11px] text-stocky-text-sub truncate">{selectedMember?.email}</div>
              </div>
            </div>
          )}
        </div>

        {/* 2. Branch / Location */}
        <div>
          <label className="text-xs font-semibold text-stocky-text-main flex items-center gap-1.5 mb-1.5">
            <WarehouseIcon size="xs" className="text-stocky-primary" />
            <span>{t('attendance.location')}</span>
          </label>
          <select
            value={selectedLocationId}
            onChange={(e) => setSelectedLocationId(e.target.value)}
            className="w-full h-10 px-3 rounded-xl bg-stocky-bg-widget border border-stocky-border-subtle text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none transition-colors cursor-pointer"
          >
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Shift Date */}
        <div>
          <label className="text-xs font-semibold text-stocky-text-main flex items-center gap-1.5 mb-1.5">
            <CalendarIcon size="xs" className="text-stocky-primary" />
            <span>{t('attendance.shiftDate')}</span>
          </label>
          <input
            type="date"
            value={shiftDate}
            onChange={(e) => setShiftDate(e.target.value)}
            className="w-full h-10 px-3 rounded-xl bg-stocky-bg-widget border border-stocky-border-subtle text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none transition-colors"
            required
          />
        </div>

        {/* 4. Shift Mode Toggle */}
        <div>
          <label className="text-xs font-semibold text-stocky-text-main flex items-center gap-1.5 mb-1.5">
            <ClockIcon size="xs" className="text-stocky-primary" />
            <span>{t('attendance.attendanceType')}</span>
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-stocky-bg-global border border-stocky-border-subtle">
            <button
              type="button"
              onClick={() => setShiftMode('clock_in')}
              className={`h-8 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                shiftMode === 'clock_in'
                  ? 'bg-stocky-bg-widget text-stocky-text-main shadow-xs font-semibold'
                  : 'text-stocky-text-sub hover:text-stocky-text-main'
              }`}
            >
              {t('attendance.clockInOnly')}
            </button>
            <button
              type="button"
              onClick={() => setShiftMode('completed')}
              className={`h-8 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                shiftMode === 'completed'
                  ? 'bg-stocky-bg-widget text-stocky-text-main shadow-xs font-semibold'
                  : 'text-stocky-text-sub hover:text-stocky-text-main'
              }`}
            >
              {t('attendance.completedShift')}
            </button>
          </div>
        </div>

        {/* 5. Timestamps: Clock-In & Optional Clock-Out */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-stocky-text-main block mb-1.5">
              {t('attendance.clockIn')}
            </label>
            <input
              type="time"
              value={clockInTime}
              onChange={(e) => handleClockInChange(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-stocky-bg-widget border border-stocky-border-subtle text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none transition-colors"
              required
            />
          </div>

          {shiftMode === 'completed' && (
            <div>
              <label className="text-xs font-semibold text-stocky-text-main block mb-1.5">
                {t('attendance.clockOut')}
              </label>
              <input
                type="time"
                value={clockOutTime}
                onChange={(e) => setClockOutTime(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-stocky-bg-widget border border-stocky-border-subtle text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none transition-colors"
                required
              />
            </div>
          )}
        </div>

        {/* Duration preview indicator for completed shifts */}
        {shiftMode === 'completed' && calculatedDuration && (
          <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-stocky-border-subtle bg-stocky-bg-global text-xs">
            <span className="text-stocky-text-sub">{t('attendance.duration')}:</span>
            <span className="font-semibold text-stocky-text-main">
              {calculatedDuration.hours}h {calculatedDuration.mins}m ({calculatedDuration.totalMinutes} min)
            </span>
          </div>
        )}

        {/* 6. Shift Status Selection */}
        <div>
          <label className="text-xs font-semibold text-stocky-text-main block mb-1.5">
            {t('common.status') || 'Status'}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'present', label: t('attendance.statusOnTime') },
              { id: 'late', label: t('attendance.statusLate') },
              { id: 'overtime', label: t('attendance.statusOvertime') },
              { id: 'early_departure', label: t('attendance.statusEarlyDeparture') },
            ].map((st) => {
              const isSelected = status === st.id;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStatus(st.id as any)}
                  className={`h-9 px-2.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer flex items-center justify-center text-center ${
                    isSelected
                      ? 'border-stocky-primary bg-stocky-primary/10 text-stocky-primary font-semibold'
                      : 'border-stocky-border-subtle bg-stocky-bg-widget text-stocky-text-main hover:border-stocky-primary/50'
                  }`}
                >
                  {st.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 7. Reason / Notes */}
        <div>
          <label className="text-xs font-semibold text-stocky-text-main block mb-1.5">
            {t('attendance.manualEntryReason')}
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('attendance.manualEntryReasonPlaceholder')}
            className="w-full h-10 px-3 rounded-xl bg-stocky-bg-widget border border-stocky-border-subtle text-xs text-stocky-text-main placeholder:text-stocky-text-sub focus:border-stocky-primary focus:outline-none transition-colors"
          />
        </div>

        {/* Drawer Actions Footer */}
        <div className="pt-4 border-t border-stocky-border-subtle flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="h-10 px-4 rounded-full border border-stocky-border-subtle text-xs font-medium text-stocky-text-main hover:bg-stocky-bg-global transition-colors cursor-pointer"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="stocky-table-toolbar-button stocky-table-toolbar-button--primary h-10 px-5 rounded-full text-xs font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer shadow-sm transition-all"
          >
            <PlusIcon size="xs" />
            <span>{submitting ? t('attendance.savingAttendance') : t('attendance.recordAttendance')}</span>
          </button>
        </div>
      </form>
    </SideDrawer>
  );
}
