import { date, decimal, integer, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { companies } from './companies';
import { companyUsers } from './users';
import { locations } from './locations';
import { stockTasks } from './stockTasks';

export const shiftStatusEnum = pgEnum('shift_status', [
  'present',
  'late',
  'early_departure',
  'overtime',
  'incomplete',
]);

export const punchMethodEnum = pgEnum('punch_method', ['qr_scan', 'kiosk', 'manual']);
export const leaveTypeEnum = pgEnum('leave_type', ['pto', 'sick', 'emergency', 'unpaid']);
export const leaveStatusEnum = pgEnum('leave_status', ['pending', 'approved', 'rejected', 'cancelled']);

export const attendanceShifts = pgTable('attendance_shifts', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  locationId: uuid('location_id').references(() => locations.id, { onDelete: 'restrict' }).notNull(),
  companyUserId: uuid('company_user_id').references(() => companyUsers.id, { onDelete: 'cascade' }).notNull(),
  shiftDate: date('shift_date').notNull(),
  clockInAt: timestamp('clock_in_at', { withTimezone: true }).defaultNow().notNull(),
  clockOutAt: timestamp('clock_out_at', { withTimezone: true }),
  totalMinutes: integer('total_minutes'),
  status: text('status').default('present').notNull(),
  punchInMethod: text('punch_in_method').default('qr_scan').notNull(),
  punchOutMethod: text('punch_out_method'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const leaveRequests = pgTable('leave_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  companyUserId: uuid('company_user_id').references(() => companyUsers.id, { onDelete: 'cascade' }).notNull(),
  approverCompanyUserId: uuid('approver_company_user_id').references(() => companyUsers.id, { onDelete: 'restrict' }).notNull(),
  taskId: uuid('task_id').references(() => stockTasks.id, { onDelete: 'set null' }),
  leaveType: text('leave_type').default('pto').notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  daysCount: decimal('days_count', { precision: 4, scale: 1 }).notNull(),
  reason: text('reason'),
  status: text('status').default('pending').notNull(),
  managerNote: text('manager_note'),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const leaveBalances = pgTable('leave_balances', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  companyUserId: uuid('company_user_id').references(() => companyUsers.id, { onDelete: 'cascade' }).notNull(),
  year: integer('year').notNull(),
  ptoAllowance: integer('pto_allowance').default(21).notNull(),
  ptoUsed: decimal('pto_used', { precision: 4, scale: 1 }).default('0').notNull(),
  sickAllowance: integer('sick_allowance').default(10).notNull(),
  sickUsed: decimal('sick_used', { precision: 4, scale: 1 }).default('0').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});