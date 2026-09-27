import type {
  AttendanceShift,
  InventoryTransfer,
  InventoryTransferLine,
  LeaveBalance,
  LeaveRequest,
  Location,
  NotificationTask,
  Product,
  StockActivityLog,
  StockLot,
  StockMovement,
  StockTask,
  StockTaskExpected,
  StockTaskItem,
  Supplier,
  SupplierContact,
  SupplierProduct,
  SupplierRequest,
} from '@stocky/types';

type DatabaseRow = Record<string, any>;

export function mapLocation(row: DatabaseRow): Location {
  return {
    id: row.id,
    companyId: row.company_id,
    name: row.name,
    code: row.code,
    type: row.type,
    address: row.address,
    phone: row.phone,
    managerUserId: row.manager_user_id,
    imageUrl: row.image_url || null,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapProduct(row: DatabaseRow): Product {
  return {
    id: row.id,
    companyId: row.company_id,
    name: row.name,
    barcode: row.barcode,
    categoryId: row.category_id,
    categoryName: row.category_name || 'General',
    unitName: row.unit_name || 'unit',
    reorderPoint: Number(row.reorder_point || 0),
    defaultExpiryNotificationDays: row.default_expiry_notification_days == null
      ? null
      : Number(row.default_expiry_notification_days),
    defaultSupplierId: row.default_supplier_id,
    unitCost: Number(row.unit_cost || 0),
    imageUrl: row.image_url || null,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapLot(row: DatabaseRow): StockLot {
  return {
    id: row.id,
    companyId: row.company_id,
    productId: row.product_id,
    locationId: row.location_id,
    supplierId: row.supplier_id,
    lotNumber: row.lot_number,
    receivedAt: row.received_at,
    manufacturedAt: row.manufactured_at,
    expiryDate: row.expiry_date,
    expiryNotificationDays: row.expiry_notification_days == null
      ? null
      : Number(row.expiry_notification_days),
    quantityOnHand: Number(row.quantity_on_hand || 0),
    unitCost: Number(row.unit_cost || 0),
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapSupplier(row: DatabaseRow): Supplier {
  return {
    id: row.id,
    companyId: row.company_id,
    name: row.name,
    address: row.address,
    contactName: row.contact_name || '',
    contactPhone: row.contact_phone || '',
    contactEmail: row.contact_email,
    itemsSupplied: row.items_supplied || [],
    itemCount: Number(row.item_count || 0),
    imageUrl: row.image_url || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapSupplierContact(row: DatabaseRow): SupplierContact {
  return {
    id: row.id,
    companyId: row.company_id,
    supplierId: row.supplier_id,
    name: row.name,
    role: row.role,
    phone: row.phone,
    email: row.email,
    isPrimary: Boolean(row.is_primary),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapRequest(row: DatabaseRow): SupplierRequest {
  return {
    id: row.id,
    companyId: row.company_id,
    locationId: row.location_id,
    supplierId: row.supplier_id,
    productId: row.product_id,
    requestType: row.request_type,
    status: row.status,
    quantityRequested: row.quantity_requested,
    reason: row.reason,
    notes: row.notes,
    createdByCompanyUserId: row.created_by_company_user_id,
    lastContactedAt: row.last_contacted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapSupplierProduct(row: DatabaseRow): SupplierProduct {
  return {
    id: row.id,
    companyId: row.company_id,
    supplierId: row.supplier_id,
    productId: row.product_id,
    supplierSku: row.supplier_sku,
    unitCost: row.unit_cost == null ? null : Number(row.unit_cost),
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapNotification(row: DatabaseRow): NotificationTask {
  return {
    id: row.id,
    companyId: row.company_id,
    recipientCompanyUserId: row.recipient_company_user_id,
    notificationType: row.notification_type,
    severity: row.severity,
    title: row.title,
    message: row.message,
    referenceType: row.reference_type,
    referenceId: row.reference_id,
    isRead: Boolean(row.is_read),
    isResolved: Boolean(row.is_resolved),
    createdAt: row.created_at,
    resolvedAt: row.resolved_at,
  };
}

export function mapTransfer(row: DatabaseRow): InventoryTransfer {
  return {
    id: row.id,
    companyId: row.company_id,
    sourceLocationId: row.source_location_id,
    destinationLocationId: row.destination_location_id,
    status: row.status,
    requestedByCompanyUserId: row.requested_by_company_user_id,
    reviewedByCompanyUserId: row.reviewed_by_company_user_id,
    receivedByCompanyUserId: row.received_by_company_user_id,
    note: row.note,
    decisionNote: row.decision_note,
    requestedAt: row.requested_at,
    approvedAt: row.approved_at,
    receivedAt: row.received_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapTransferLine(row: DatabaseRow): InventoryTransferLine {
  return {
    id: row.id,
    transferId: row.transfer_id,
    productId: row.product_id,
    sourceLotId: row.source_lot_id,
    quantityRequested: Number(row.quantity_requested || 0),
    quantityApproved: row.quantity_approved == null ? null : Number(row.quantity_approved),
    quantityReceived: Number(row.quantity_received || 0),
    createdAt: row.created_at,
  };
}

export function mapMovement(row: DatabaseRow): StockMovement {
  return {
    id: row.id,
    companyId: row.company_id,
    productId: row.product_id,
    stockLotId: row.stock_lot_id,
    locationId: row.location_id,
    movementType: row.movement_type,
    quantityDelta: Number(row.quantity_delta || 0),
    referenceType: row.reference_type,
    referenceId: row.reference_id,
    reason: row.reason,
    createdByAuthUserId: row.created_by_auth_user_id,
    createdAt: row.created_at,
  };
}

export function mapTask(row: DatabaseRow): StockTask {
  return {
    id: row.id,
    companyId: row.company_id,
    locationId: row.location_id,
    taskType: row.task_type,
    title: row.title,
    status: row.status,
    assignedToCompanyUserId: row.assigned_to_company_user_id,
    createdByCompanyUserId: row.created_by_company_user_id,
    notes: row.notes,
    reviewNote: row.review_note,
    scheduledStartAt: row.scheduled_start_at,
    scheduledEndAt: row.scheduled_end_at,
    startedAt: row.started_at,
    submittedAt: row.submitted_at,
    reviewedAt: row.reviewed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapTaskItem(row: DatabaseRow): StockTaskItem {
  return {
    id: row.id,
    taskId: row.task_id,
    productId: row.product_id,
    stockLotId: row.stock_lot_id,
    countedQuantity: row.counted_quantity == null ? null : Number(row.counted_quantity),
    observedExpiryDate: row.observed_expiry_date,
    note: row.note,
    status: row.status,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapTaskExpected(row: DatabaseRow): StockTaskExpected {
  return {
    taskItemId: row.task_item_id,
    expectedQuantity: row.expected_quantity == null ? null : Number(row.expected_quantity),
    expectedExpiryDate: row.expected_expiry_date,
  };
}

export function mapActivityLog(row: DatabaseRow): StockActivityLog {
  return {
    id: row.id,
    companyId: row.company_id,
    locationId: row.location_id,
    actorCompanyUserId: row.actor_company_user_id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    action: row.action,
    summary: row.summary,
    metadata: row.metadata,
    createdAt: row.created_at,
  };
}

export function mapAttendanceShift(row: DatabaseRow): AttendanceShift {
  return {
    id: row.id,
    companyId: row.company_id,
    locationId: row.location_id,
    companyUserId: row.company_user_id,
    shiftDate: row.shift_date,
    clockInAt: row.clock_in_at,
    clockOutAt: row.clock_out_at,
    totalMinutes: row.total_minutes == null ? null : Number(row.total_minutes),
    status: row.status,
    punchInMethod: row.punch_in_method,
    punchOutMethod: row.punch_out_method,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapLeaveRequest(row: DatabaseRow): LeaveRequest {
  return {
    id: row.id,
    companyId: row.company_id,
    companyUserId: row.company_user_id,
    approverCompanyUserId: row.approver_company_user_id,
    taskId: row.task_id,
    leaveType: row.leave_type,
    startDate: row.start_date,
    endDate: row.end_date,
    daysCount: Number(row.days_count || 0),
    reason: row.reason,
    status: row.status,
    managerNote: row.manager_note,
    reviewedAt: row.reviewed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapLeaveBalance(row: DatabaseRow): LeaveBalance {
  return {
    id: row.id,
    companyId: row.company_id,
    companyUserId: row.company_user_id,
    year: Number(row.year || new Date().getFullYear()),
    ptoAllowance: Number(row.pto_allowance || 0),
    ptoUsed: Number(row.pto_used || 0),
    sickAllowance: Number(row.sick_allowance || 0),
    sickUsed: Number(row.sick_used || 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
