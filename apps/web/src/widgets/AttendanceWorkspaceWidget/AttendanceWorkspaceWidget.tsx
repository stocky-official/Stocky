'use client';

import React, { useState, useMemo } from 'react';
import type {
  AttendanceShift,
  LeaveRequest,
  LeaveBalance,
  Location,
  LeaveType,
  PunchMethod,
} from '@stocky/types';
import { AttendanceToolbarWidget, type AttendanceTab } from './AttendanceToolbarWidget';
import { TimesheetsTableWidget } from './TimesheetsTableWidget';
import { AttendanceCalendarWidget } from './AttendanceCalendarWidget';
import { TimeOffWidget } from './TimeOffWidget';
import { AttendanceKioskWidget } from './AttendanceKioskWidget';
import { RequestTimeOffDrawerWidget } from './RequestTimeOffDrawerWidget';
import { ShiftDetailsDrawerWidget } from './ShiftDetailsDrawerWidget';
import { TimesheetsExportModalWidget } from './TimesheetsExportModalWidget';
import { LogAttendanceDrawerWidget } from './LogAttendanceDrawerWidget';

export interface AttendanceWorkspaceWidgetProps {
  shifts: AttendanceShift[];
  leaves: LeaveRequest[];
  balances: LeaveBalance[];
  locations: Location[];
  members: any[];
  userRole: string;
  currentUserId?: string | null;
  activeTab?: AttendanceTab;
  onTabChange?: (tab: AttendanceTab) => void;
  onPunchAttendance: (input: {
    locationId: string;
    method?: PunchMethod;
    qrToken?: string;
    notes?: string;
  }) => Promise<AttendanceShift>;
  onSubmitLeave: (input: {
    leaveType: LeaveType;
    startDate: string;
    endDate: string;
    daysCount: number;
    managerUserId: string;
    reason?: string;
  }) => Promise<void>;
  onReviewLeave: (requestId: string, approve: boolean, note?: string) => Promise<void>;
  canManageAttendance?: boolean;
  onRecordManualAttendance?: (input: {
    companyUserId: string;
    locationId: string;
    shiftDate: string;
    clockInAt: string;
    clockOutAt?: string | null;
    status?: string;
    notes?: string;
  }) => Promise<AttendanceShift>;
}

export function AttendanceWorkspaceWidget({
  shifts,
  leaves,
  balances,
  locations,
  members,
  userRole,
  currentUserId,
  canManageAttendance,
  activeTab: controlledTab,
  onTabChange: onControlledTabChange,
  onPunchAttendance,
  onSubmitLeave,
  onReviewLeave,
  onRecordManualAttendance,
}: AttendanceWorkspaceWidgetProps) {
  const [internalTab, setInternalTab] = useState<AttendanceTab>(controlledTab ?? 'timesheets');
  const activeTab = controlledTab ?? internalTab;
  const setActiveTab = React.useCallback((tab: AttendanceTab) => {
    setInternalTab(tab);
    onControlledTabChange?.(tab);
  }, [onControlledTabChange]);
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLeaveDrawerOpen, setIsLeaveDrawerOpen] = useState(false);
  const [isLogAttendanceOpen, setIsLogAttendanceOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<AttendanceShift | null>(null);

  const locationMap = useMemo(() => new Map(locations.map((l) => [l.id, l.name])), [locations]);
  const memberMap = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);

  // Filtering shifts
  const filteredShifts = useMemo(() => {
    return shifts.filter((shift) => {
      // 1. Location filter
      if (locationFilter !== 'all' && shift.locationId !== locationFilter) {
        return false;
      }
      // 2. Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'active' && shift.clockOutAt) return false;
        if (statusFilter === 'on_time' && shift.status !== 'present') return false;
        if (statusFilter === 'late' && shift.status !== 'late') return false;
        if (statusFilter === 'overtime' && shift.status !== 'overtime') return false;
      }
      // 3. Search query
      if (search.trim()) {
        const query = search.toLowerCase();
        const member = memberMap.get(shift.companyUserId);
        const locName = locationMap.get(shift.locationId) || '';
        const match =
          member?.full_name?.toLowerCase().includes(query) ||
          member?.email?.toLowerCase().includes(query) ||
          locName.toLowerCase().includes(query) ||
          shift.status?.toLowerCase().includes(query) ||
          shift.shiftDate?.includes(query);
        if (!match) return false;
      }
      return true;
    });
  }, [shifts, search, locationFilter, statusFilter, memberMap, locationMap]);

  return (
    <div className="w-full space-y-4">
      {/* Unified Card Container */}
      <div className="stocky-stock-unified-card rounded-card bg-stocky-bg-widget border border-stocky-border-subtle shadow-sm flex flex-col relative z-20 overflow-visible">
        {/* Integrated Toolbar (Timesheets Only) */}
        {activeTab === 'timesheets' && (
          <div className="p-3 sm:p-3.5 border-b border-stocky-border-subtle relative z-30">
            <AttendanceToolbarWidget
              search={search}
              onSearchChange={setSearch}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onExportExcel={() => setIsExportModalOpen(true)}
              onLogAttendance={() => setIsLogAttendanceOpen(true)}
              onRequestLeave={() => setIsLeaveDrawerOpen(true)}
              userRole={userRole}
              locationFilter={locationFilter}
              onLocationFilterChange={setLocationFilter}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              locations={locations}
            />
          </div>
        )}

        {/* Tab Views */}
        <div className="w-full">
          {activeTab === 'timesheets' && (
            <TimesheetsTableWidget
              shifts={filteredShifts}
              locations={locations}
              members={members}
              currentUserId={currentUserId}
              onPunchAttendance={onPunchAttendance}
              onSelectShift={(shift) => setSelectedShift(shift)}
              onRequestLeave={() => setIsLeaveDrawerOpen(true)}
            />
          )}

          {(activeTab === 'calendar' || activeTab === 'leaves') && (
            <AttendanceCalendarWidget
              shifts={filteredShifts}
              leaves={leaves}
              balances={balances}
              locations={locations}
              members={members}
              currentUserId={currentUserId}
              userRole={userRole}
              canManageAttendance={canManageAttendance}
              onSelectShift={(shift) => setSelectedShift(shift)}
              onRequestLeave={() => setIsLeaveDrawerOpen(true)}
              onReviewLeave={onReviewLeave}
            />
          )}

          {activeTab === 'kiosk' && (
            <AttendanceKioskWidget
              locations={locations}
              onPunchAttendance={onPunchAttendance}
            />
          )}
        </div>
      </div>

      {/* Drawers */}
      <LogAttendanceDrawerWidget
        isOpen={isLogAttendanceOpen}
        onClose={() => setIsLogAttendanceOpen(false)}
        members={members}
        locations={locations}
        currentUserId={currentUserId}
        userRole={userRole}
        canManageAttendance={canManageAttendance}
        onSubmit={async (input) => {
          if (onRecordManualAttendance) {
            await onRecordManualAttendance(input);
          }
        }}
      />

      <RequestTimeOffDrawerWidget
        isOpen={isLeaveDrawerOpen}
        onClose={() => setIsLeaveDrawerOpen(false)}
        members={members}
        onSubmit={onSubmitLeave}
      />

      <ShiftDetailsDrawerWidget
        isOpen={Boolean(selectedShift)}
        onClose={() => setSelectedShift(null)}
        shift={selectedShift}
        locations={locations}
        members={members}
      />

      {/* Export Timesheets Modal */}
      <TimesheetsExportModalWidget
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        shifts={shifts}
        locations={locations}
        members={members}
      />
    </div>
  );
}
