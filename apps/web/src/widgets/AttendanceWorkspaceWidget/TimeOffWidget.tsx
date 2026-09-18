'use client';

import React, { useState } from 'react';
import type { LeaveBalance, LeaveRequest } from '@stocky/types';
import {
  CalendarIcon,
  UsersIcon,
  CheckCircleIcon,
  XIcon,
  ClockIcon,
  PlusIcon,
  CheckIcon,
} from '@stocky/icons';
import { useTranslation } from '@/lib/i18n';

export interface TimeOffWidgetProps {
  leaves: LeaveRequest[];
  balances: LeaveBalance[];
  members: any[];
  currentUserId?: string | null;
  userRole?: string;
  canManageAttendance?: boolean;
  onRequestLeave: () => void;
  onReviewLeave: (requestId: string, approve: boolean, note?: string) => Promise<void>;
}

export function TimeOffWidget({
  leaves,
  balances,
  members,
  currentUserId,
  userRole,
  canManageAttendance,
  onRequestLeave,
  onReviewLeave,
}: TimeOffWidgetProps) {
  const { t } = useTranslation();
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const memberMap = new Map(members.map((m) => [m.id, m]));
  const canReview = userRole === 'owner' || userRole === 'admin' || userRole === 'manager' || Boolean(canManageAttendance);

  // Compute balance for current user or company average
  const userBalance = balances.find((b) => b.companyUserId === currentUserId) || balances[0] || {
    ptoAllowance: 21,
    ptoUsed: 0,
    sickAllowance: 10,
    sickUsed: 0,
  };

  const ptoRemaining = Math.max(0, userBalance.ptoAllowance - userBalance.ptoUsed);
  const sickRemaining = Math.max(0, userBalance.sickAllowance - userBalance.sickUsed);

  const handleReview = async (requestId: string, approve: boolean) => {
    setReviewingId(requestId);
    try {
      await onReviewLeave(requestId, approve);
    } catch (err: any) {
      alert(err.message || 'Failed to update leave request');
    } finally {
      setReviewingId(null);
    }
  };

  return (
    <div className="flex flex-col w-full text-start">
      {/* Balance Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-stocky-bg-global/40 border-b border-stocky-border-subtle">
        {/* Annual PTO Card */}
        <div className="bg-stocky-bg-widget p-4 rounded-widget border border-stocky-border-subtle shadow-sm flex flex-col justify-between text-start">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-widget stocky-status-info border flex items-center justify-center">
                <CalendarIcon size="xs" />
              </div>
              <span className="text-xs font-semibold text-stocky-text-main">{t('timeOff.annualPto')}</span>
            </div>
            <span className="text-xs font-semibold text-stocky-primary">{t('timeOff.daysLeft', { count: ptoRemaining })}</span>
          </div>
          <div>
            <div className="flex items-baseline justify-between text-xs mb-1.5">
              <span className="text-stocky-text-sub">{t('timeOff.usedDays', { count: userBalance.ptoUsed })}</span>
              <span className="font-semibold text-stocky-text-main">{t('timeOff.allowanceDays', { count: userBalance.ptoAllowance })}</span>
            </div>
            <div className="w-full h-2 rounded-full bg-stocky-bg-global overflow-hidden">
              <div
                className="h-full bg-stocky-primary rounded-full transition-all"
                style={{ width: `${Math.min(100, (userBalance.ptoUsed / userBalance.ptoAllowance) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Sick Leave Card */}
        <div className="bg-stocky-bg-widget p-4 rounded-widget border border-stocky-border-subtle shadow-sm flex flex-col justify-between text-start">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-widget stocky-status-critical border flex items-center justify-center">
                <ClockIcon size="xs" />
              </div>
              <span className="text-xs font-semibold text-stocky-text-main">{t('timeOff.sickLeave')}</span>
            </div>
            <span className="text-xs font-semibold text-stocky-status-critical-fg">{t('timeOff.daysLeft', { count: sickRemaining })}</span>
          </div>
          <div>
            <div className="flex items-baseline justify-between text-xs mb-1.5">
              <span className="text-stocky-text-sub">{t('timeOff.usedDays', { count: userBalance.sickUsed })}</span>
              <span className="font-semibold text-stocky-text-main">{t('timeOff.allowanceDays', { count: userBalance.sickAllowance })}</span>
            </div>
            <div className="w-full h-2 rounded-full bg-stocky-bg-global overflow-hidden">
              <div
                className="h-full bg-stocky-status-critical-fg rounded-full transition-all"
                style={{ width: `${Math.min(100, (userBalance.sickUsed / userBalance.sickAllowance) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Pending Requests / Action Card */}
        <div className="bg-stocky-bg-widget p-4 rounded-widget border border-stocky-border-subtle shadow-sm flex items-center justify-between text-start">
          <div>
            <div className="text-xs font-semibold text-stocky-text-main">{t('timeOff.policyTitle')}</div>
            <p className="text-[11px] text-stocky-text-sub mt-1 leading-relaxed">
              {t('timeOff.policyDesc')}
            </p>
          </div>
          <button
            type="button"
            onClick={onRequestLeave}
            className="stocky-table-toolbar-button stocky-table-toolbar-button--primary h-10 px-4 rounded-full text-xs font-medium inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0 ms-3"
          >
            <PlusIcon size="xs" />
            <span>{t('timeOff.requestTimeOff')}</span>
          </button>
        </div>
      </div>

      {/* Requests Table & Mobile Cards */}
      {leaves.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="w-12 h-12 rounded-widget bg-stocky-bg-global border border-stocky-border-subtle shadow-sm flex items-center justify-center text-stocky-text-sub mb-3">
            <UsersIcon size="sm" />
          </div>
          <h3 className="text-sm font-semibold text-stocky-text-main">{t('timeOff.noRequests')}</h3>
          <p className="text-xs text-stocky-text-sub max-w-xs mt-1">
            {t('timeOff.policyDesc')}
          </p>
          <button
            type="button"
            onClick={onRequestLeave}
            className="mt-4 stocky-table-toolbar-button stocky-table-toolbar-button--primary h-10 px-4 rounded-full text-xs font-medium inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <PlusIcon size="xs" />
            <span>{t('timeOff.submitFirstRequest')}</span>
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden sm:block w-full overflow-x-auto">
            <table className="stocky-board-table min-w-[800px] w-full text-start border-collapse">
              <thead>
                <tr className="border-b border-stocky-border-subtle bg-stocky-bg-global/30 h-11">
                  <th className="stocky-board-table__header-cell px-4 text-start text-[11px] font-semibold text-stocky-text-sub tracking-wider uppercase whitespace-nowrap">
                    {t('team.colMember')}
                  </th>
                  <th className="stocky-board-table__header-cell px-4 text-start text-[11px] font-semibold text-stocky-text-sub tracking-wider uppercase whitespace-nowrap">
                    {t('common.type')}
                  </th>
                  <th className="stocky-board-table__header-cell px-4 text-start text-[11px] font-semibold text-stocky-text-sub tracking-wider uppercase whitespace-nowrap">
                    {t('timeOff.periodAndDays')}
                  </th>
                  <th className="stocky-board-table__header-cell px-4 text-start text-[11px] font-semibold text-stocky-text-sub tracking-wider uppercase whitespace-nowrap">
                    {t('team.colReportsTo')}
                  </th>
                  <th className="stocky-board-table__header-cell px-4 text-start text-[11px] font-semibold text-stocky-text-sub tracking-wider uppercase whitespace-nowrap">
                    {t('tasks.title')}
                  </th>
                  <th className="stocky-board-table__header-cell px-4 text-start text-[11px] font-semibold text-stocky-text-sub tracking-wider uppercase whitespace-nowrap">
                    {t('common.status')}
                  </th>
                  {canReview && (
                    <th className="stocky-board-table__header-cell px-4 text-end text-[11px] font-semibold text-stocky-text-sub tracking-wider uppercase whitespace-nowrap">
                      {t('common.actions')}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-stocky-border-subtle">
                {leaves.map((req) => {
                  const member = memberMap.get(req.companyUserId);
                  const approver = memberMap.get(req.approverCompanyUserId);
                  const memberName = member?.full_name || member?.email?.split('@')[0] || t('team.title');
                  const approverName = approver?.full_name || approver?.email?.split('@')[0] || t('team.colReportsTo');
                  const isPending = req.status === 'pending';

                  return (
                    <tr key={req.id} className="hover:bg-stocky-bg-global/40 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-start">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-stocky-primary/10 text-stocky-primary flex items-center justify-center text-xs font-semibold">
                            {memberName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-stocky-text-main">{memberName}</div>
                            {req.reason && <div className="text-[10px] text-stocky-text-sub truncate max-w-xs">{req.reason}</div>}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-start">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium uppercase tracking-wider stocky-status-muted border">
                          {req.leaveType}
                        </span>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-start">
                        <div className="text-xs font-semibold text-stocky-text-main">
                          {req.startDate} → {req.endDate}
                        </div>
                        <div className="text-[11px] text-stocky-text-sub font-medium">
                          {req.daysCount} {t('timeOff.daysLeft', { count: req.daysCount })}
                        </div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-xs text-stocky-text-sub text-start">
                        {approverName}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-start">
                        {req.taskId ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium stocky-status-success border px-2 py-0.5 rounded-full">
                            <CheckCircleIcon size="xs" />
                            <span>{t('timeOff.taskDispatched')}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-stocky-text-sub">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-start">
                        {isPending ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium stocky-status-warning border">
                            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                            {t('timeOff.pendingReview')}
                          </span>
                        ) : req.status === 'approved' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium stocky-status-success border">
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {t('timeOff.statusApproved')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium stocky-status-critical border">
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {t('timeOff.statusRejected')}
                          </span>
                        )}
                      </td>

                      {canReview && (
                        <td className="px-4 py-3 whitespace-nowrap text-end">
                          {isPending ? (
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                disabled={reviewingId === req.id}
                                onClick={() => handleReview(req.id, true)}
                                className="h-8 px-3 rounded-full bg-stocky-primary text-white text-xs font-medium hover:bg-stocky-primary-hover transition-colors inline-flex items-center gap-1 cursor-pointer"
                              >
                                <CheckIcon size="xs" />
                                <span>{t('timeOff.approve')}</span>
                              </button>
                              <button
                                type="button"
                                disabled={reviewingId === req.id}
                                onClick={() => handleReview(req.id, false)}
                                className="h-8 px-3 rounded-full border border-stocky-border-subtle bg-stocky-bg-widget text-stocky-status-critical-fg hover:bg-stocky-status-critical-bg text-xs font-medium transition-colors inline-flex items-center gap-1 cursor-pointer"
                              >
                                <XIcon size="xs" />
                                <span>{t('timeOff.reject')}</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-stocky-text-sub">{t('timeOff.reviewed')}</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List */}
          <div className="divide-y divide-stocky-border-subtle sm:hidden">
            {leaves.map((req) => {
              const member = memberMap.get(req.companyUserId);
              const approver = memberMap.get(req.approverCompanyUserId);
              const memberName = member?.full_name || member?.email?.split('@')[0] || t('team.title');
              const approverName = approver?.full_name || approver?.email?.split('@')[0] || t('team.colReportsTo');
              const isPending = req.status === 'pending';
              const memberInitials = memberName
                .split(' ')
                .map((n: string) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);

              return (
                <article key={req.id} className="p-3.5 flex items-center justify-between gap-3 bg-white hover:bg-stocky-bg-global/30 transition-colors text-start">
                  {/* Left Anchor + Center Info */}
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-full bg-stocky-primary/10 border border-stocky-primary/20 text-stocky-primary flex items-center justify-center text-xs font-semibold shrink-0">
                      {memberInitials}
                    </div>
                    <div className="min-w-0 flex-1 text-start">
                      <h4 className="text-xs font-semibold text-stocky-text-main leading-tight truncate">
                        {memberName}
                      </h4>
                      <p className="mt-0.5 text-[11px] text-stocky-text-sub flex items-center gap-1.5 truncate">
                        <span className="uppercase font-medium text-stocky-text-main">{req.leaveType}</span>
                        <span>·</span>
                        <span>{req.startDate} → {req.endDate}</span>
                        <span>·</span>
                        <span>{req.daysCount}d</span>
                      </p>
                    </div>
                  </div>

                  {/* Right Status & Actions */}
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    {isPending ? (
                      canReview ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={reviewingId === req.id}
                            onClick={() => handleReview(req.id, true)}
                            className="h-7 px-2.5 rounded-full bg-stocky-primary text-white text-xs font-medium hover:bg-stocky-primary-hover transition-colors inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                          >
                            <CheckIcon size="xs" />
                            <span>{t('timeOff.approve')}</span>
                          </button>
                          <button
                            type="button"
                            disabled={reviewingId === req.id}
                            onClick={() => handleReview(req.id, false)}
                            className="h-7 px-2 rounded-full border border-stocky-border-subtle bg-white text-stocky-text-sub hover:text-stocky-status-critical-fg text-xs font-medium transition-colors inline-flex items-center cursor-pointer"
                          >
                            <XIcon size="xs" />
                          </button>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium stocky-status-warning border">
                          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                          {t('timeOff.pendingReview')}
                        </span>
                      )
                    ) : req.status === 'approved' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium stocky-status-success border">
                        {t('timeOff.statusApproved')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium stocky-status-critical border">
                        {t('timeOff.statusRejected')}
                      </span>
                    )}
                    <span className="text-[10px] text-stocky-text-sub">
                      {approverName.split(' ')[0]}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
