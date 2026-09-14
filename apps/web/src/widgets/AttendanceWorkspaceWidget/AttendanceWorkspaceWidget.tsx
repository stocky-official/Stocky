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
}

export function AttendanceWorkspaceWidget({
  shifts,
  leaves,
  balances,
  locations,
  members,
  userRole,
  currentUserId,
  activeTab: controlledTab,
  onTabChange: onControlledTabChange,
  onPunchAttendance,
  onSubmitLeave,
  onReviewLeave,
}: AttendanceWorkspaceWidgetProps) {
  const [internalTab, setInternalTab] = useState<AttendanceTab>('timesheets');
  const activeTab = controlledTab ?? internalTab;
  const setActiveTab = onControlledTabChange ?? setInternalTab;
  const [search, setSearch] = useState('');
  const [isLeaveDrawerOpen, setIsLeaveDrawerOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<AttendanceShift | null>(null);

  const locationMap = useMemo(() => new Map(locations.map((l) => [l.id, l.name])), [locations]);
  const memberMap = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);

  // Search filtering
  const filteredShifts = useMemo(() => {
    if (!search.trim()) return shifts;
    const query = search.toLowerCase();
    return shifts.filter((shift) => {
      const member = memberMap.get(shift.companyUserId);
      const locName = locationMap.get(shift.locationId) || '';
      return (
        member?.full_name?.toLowerCase().includes(query) ||
        member?.email?.toLowerCase().includes(query) ||
        locName.toLowerCase().includes(query) ||
        shift.status?.toLowerCase().includes(query) ||
        shift.shiftDate?.includes(query)
      );
    });
  }, [shifts, search, memberMap, locationMap]);

  return (
    <div className="w-full space-y-4">
      {/* Unified Card Container */}
      <div className="stocky-stock-unified-card rounded-2xl bg-white border border-stocky-border-subtle shadow-sm flex flex-col relative z-20 overflow-visible">
        {/* Integrated Toolbar */}
        <div className="p-3 sm:p-3.5 border-b border-stocky-border-subtle relative z-30">
          <AttendanceToolbarWidget
            search={search}
            onSearchChange={setSearch}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onExportExcel={() => setIsExportModalOpen(true)}
            onRequestLeave={() => setIsLeaveDrawerOpen(true)}
            userRole={userRole}
          />
        </div>

        {/* Tab Views */}
        <div className="w-full">
          {activeTab === 'timesheets' && (
            <TimesheetsTableWidget
              shifts={filteredShifts}
              locations={locations}
              members={members}
              onSelectShift={(shift) => setSelectedShift(shift)}
              onRequestLeave={() => setIsLeaveDrawerOpen(true)}
            />
          )}

          {activeTab === 'calendar' && (
            <AttendanceCalendarWidget
              shifts={filteredShifts}
              leaves={leaves}
              locations={locations}
              members={members}
              onSelectShift={(shift) => setSelectedShift(shift)}
            />
          )}

          {activeTab === 'leaves' && (
            <TimeOffWidget
              leaves={leaves}
              balances={balances}
              members={members}
              currentUserId={currentUserId}
              userRole={userRole}
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
