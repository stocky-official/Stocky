'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  UsersIcon,
  ShieldIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  XIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  WarehouseIcon,
  ClockIcon,
} from '@stocky/icons';
import { supabase } from '@/lib/supabase/client';
import type { Branch, CompanyUser, CompanyUserRole } from '@stocky/types';

export interface TeamManagementWidgetProps {
  branches: Branch[];
  currentCompanyId?: string;
  currentUserEmail?: string | null;
  currentUserRole?: CompanyUserRole;
}

interface TeamMemberWithBranches extends CompanyUser {
  assignedBranchNames?: string[];
  assignedBranchIds?: string[];
}

/**
 * TeamManagementWidget (v0.1.0 Design System)
 * Full Multi-Tenant Team & Access Management:
 * - Email-based user pre-authorization
 * - Hierarchical RBAC: Owner, Admin, Branch Manager, Staff
 * - Branch assignment scoping
 * - Slide-over drawer portaled to document.body
 */
export function TeamManagementWidget({
  branches,
  currentCompanyId,
  currentUserEmail,
  currentUserRole = 'owner',
}: TeamManagementWidgetProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMemberWithBranches[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Drawer state for Invite / Edit
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMemberWithBranches | null>(null);

  // Multiple Selection State
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());

  // Only non-owner members can be selected for bulk removal
  const selectableMembers = useMemo(() => {
    return teamMembers.filter((m: TeamMemberWithBranches) => m.role !== 'owner');
  }, [teamMembers]);

  const isAllSelected = useMemo(() => {
    return (
      selectableMembers.length > 0 &&
      selectableMembers.every((m: TeamMemberWithBranches) => selectedUserIds.has(m.id))
    );
  }, [selectableMembers, selectedUserIds]);

  const isIndeterminate = useMemo(() => {
    const count = selectableMembers.filter((m: TeamMemberWithBranches) => selectedUserIds.has(m.id)).length;
    return count > 0 && count < selectableMembers.length;
  }, [selectableMembers, selectedUserIds]);

  const toggleSelectUser = (id: string) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(selectableMembers.map((m: TeamMemberWithBranches) => m.id)));
    }
  };

  const clearSelection = () => {
    setSelectedUserIds(new Set());
  };

  const handleBulkRemove = async () => {
    const count = selectedUserIds.size;
    if (count === 0) return;
    if (
      !confirm(
        `Are you sure you want to revoke access for ${count} selected team member${
          count > 1 ? 's' : ''
        }?`
      )
    ) {
      return;
    }
    try {
      const ids = Array.from(selectedUserIds);
      const { error } = await supabase.from('company_users').delete().in('id', ids);
      if (error) throw error;
      setTeamMembers((prev) => prev.filter((m) => !selectedUserIds.has(m.id)));
      clearSelection();
    } catch (err: any) {
      alert(`Failed to remove team members: ${err.message}`);
    }
  };

  // Form inputs
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [roleInput, setRoleInput] = useState<CompanyUserRole>('staff');
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);
  const [canEditInput, setCanEditInput] = useState(true);
  const [canDeleteInput, setCanDeleteInput] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    fetchTeamMembers();
  }, [currentCompanyId]);

  const fetchTeamMembers = async () => {
    setLoading(true);
    try {
      // 1. Fetch company_users
      let query = supabase.from('company_users').select('*').order('created_at', { ascending: true });
      if (currentCompanyId) {
        query = query.eq('company_id', currentCompanyId);
      }
      const { data: usersData, error: usersErr } = await query;
      if (usersErr) throw usersErr;

      // 2. Fetch user_branches assignments
      const { data: branchesData, error: branchesErr } = await supabase
        .from('user_branches')
        .select('*');
      if (branchesErr) console.warn('Could not fetch user branches:', branchesErr);

      const branchMap = new Map(branches.map((b) => [b.id, b.name]));

      const formatted: TeamMemberWithBranches[] = (usersData || []).map((u: any) => {
        const userAssignedBranchIds = (branchesData || [])
          .filter((ub: any) => ub.user_id === u.id)
          .map((ub: any) => ub.branch_id);

        const assignedNames = userAssignedBranchIds
          .map((bId: string) => branchMap.get(bId))
          .filter(Boolean) as string[];

        return {
          id: u.id,
          authUserId: u.auth_user_id,
          companyId: u.company_id,
          email: u.email,
          fullName: u.full_name,
          avatarUrl: u.avatar_url,
          role: u.role,
          canEdit: u.can_edit,
          canDelete: u.can_delete,
          status: u.status || 'active',
          assignedBranchIds: userAssignedBranchIds,
          assignedBranchNames: assignedNames,
          createdAt: u.created_at,
          updatedAt: u.updated_at,
        };
      });

      setTeamMembers(formatted);
    } catch (err) {
      console.error('Failed to fetch team members:', err);
    } finally {
      setLoading(false);
    }
  };

  const openInviteDrawer = () => {
    setEditingMember(null);
    setEmailInput('');
    setNameInput('');
    setRoleInput('staff');
    setSelectedBranchIds(branches.length > 0 ? [branches[0].id] : []);
    setCanEditInput(true);
    setCanDeleteInput(false);
    setFormError(null);
    setFormSuccess(null);
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (member: TeamMemberWithBranches) => {
    setEditingMember(member);
    setEmailInput(member.email);
    setNameInput(member.fullName || '');
    setRoleInput(member.role);
    setSelectedBranchIds(member.assignedBranchIds || []);
    setCanEditInput(member.canEdit);
    setCanDeleteInput(member.canDelete);
    setFormError(null);
    setFormSuccess(null);
    setIsDrawerOpen(true);
  };

  const toggleBranchSelection = (branchId: string) => {
    setSelectedBranchIds((prev) =>
      prev.includes(branchId) ? prev.filter((id) => id !== branchId) : [...prev, branchId]
    );
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      setFormError('Valid email address is required.');
      return;
    }

    setSaving(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      // Determine company ID
      const targetCompanyId = currentCompanyId || teamMembers[0]?.companyId;
      if (!targetCompanyId) throw new Error('No company ID found for team assignment.');

      let userId = editingMember?.id;

      if (editingMember) {
        // Update existing company_user
        const { error: updateErr } = await supabase
          .from('company_users')
          .update({
            full_name: nameInput.trim() || null,
            role: roleInput,
            can_edit: canEditInput,
            can_delete: canDeleteInput,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingMember.id);

        if (updateErr) throw updateErr;

        // Sync branch assignments
        await supabase.from('user_branches').delete().eq('user_id', editingMember.id);
      } else {
        // Pre-authorize new member via email invitation
        const { data: insertedUser, error: insertErr } = await supabase
          .from('company_users')
          .insert({
            company_id: targetCompanyId,
            email: emailInput.trim().toLowerCase(),
            full_name: nameInput.trim() || null,
            role: roleInput,
            can_edit: canEditInput,
            can_delete: canDeleteInput,
            status: 'invited',
          })
          .select()
          .single();

        if (insertErr) throw insertErr;
        userId = insertedUser.id;
      }

      // If manager or staff, record assigned branches
      if (userId && (roleInput === 'manager' || roleInput === 'staff') && selectedBranchIds.length > 0) {
        const branchRows = selectedBranchIds.map((bId) => ({
          user_id: userId,
          branch_id: bId,
        }));
        const { error: branchInsertErr } = await supabase.from('user_branches').insert(branchRows);
        if (branchInsertErr) console.warn('Branch assignment insert note:', branchInsertErr);
      }

      setFormSuccess(
        editingMember
          ? 'Permissions updated successfully!'
          : `Pre-authorized ${emailInput.trim()}! When they sign in, their permissions will be automatically active.`
      );

      // Refresh list
      await fetchTeamMembers();

      setTimeout(() => {
        setIsDrawerOpen(false);
      }, 700);
    } catch (err: any) {
      console.error('Failed to save team member:', err);
      setFormError(err.message || 'Failed to save member permissions.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveMember = async (member: TeamMemberWithBranches) => {
    if (member.role === 'owner') {
      alert('The Company Owner account cannot be removed.');
      return;
    }

    if (!confirm(`Are you sure you want to revoke access for ${member.email}?`)) {
      return;
    }

    try {
      const { error } = await supabase.from('company_users').delete().eq('id', member.id);
      if (error) throw error;
      setTeamMembers((prev) => prev.filter((u) => u.id !== member.id));
    } catch (err: any) {
      alert(`Failed to remove user: ${err.message}`);
    }
  };

  const getRoleBadge = (role: CompanyUserRole) => {
    switch (role) {
      case 'owner':
        return <Badge className="bg-purple-50 text-purple-700 border-purple-200">Owner (Full)</Badge>;
      case 'admin':
        return <Badge className="bg-stocky-primary/10 text-stocky-primary border-stocky-primary/20">Admin (All Branches)</Badge>;
      case 'manager':
        return <Badge className="bg-teal-50 text-teal-700 border-teal-200">Branch Manager</Badge>;
      case 'staff':
        return <Badge className="bg-gray-100 text-gray-700 border-gray-300">Staff (Quantity Only)</Badge>;
    }
  };

  return (
    <Card className="p-5 bg-stocky-bg-widget border border-stocky-border-subtle rounded-widget space-y-4">
      {/* Header & Invite Button */}
      <div className="border-b border-stocky-border-subtle pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <UsersIcon size="sm" className="text-stocky-primary" />
            <h2 className="text-base font-medium text-stocky-text-main">
              Team & Role-Based Access Control ({teamMembers.length})
            </h2>
          </div>
          <p className="text-xs font-normal text-stocky-text-sub mt-0.5">
            Pre-authorize user emails, assign branch scopes, and configure operational permissions
          </p>
        </div>

        {(currentUserRole === 'owner' || currentUserRole === 'admin') && (
          <Button
            variant="primary"
            size="sm"
            onClick={openInviteDrawer}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs self-start sm:self-auto cursor-pointer"
          >
            <PlusIcon size="xs" />
            <span>Add Team Member</span>
          </Button>
        )}
      </div>

      {/* Team Directory Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-stocky-bg-global text-stocky-text-sub border-b border-stocky-border-subtle select-none">
              {/* 0. Select Box */}
              <th className="py-2.5 px-3 w-10 min-w-[40px] text-center">
                <input
                  type="checkbox"
                  ref={(el) => {
                    if (el) el.indeterminate = isIndeterminate;
                  }}
                  checked={isAllSelected}
                  onChange={toggleSelectAll}
                  aria-label="Select all team members"
                  className="w-4 h-4 rounded border-stocky-border-subtle text-stocky-primary focus:ring-stocky-primary/20 accent-stocky-primary cursor-pointer align-middle"
                />
              </th>
              <th className="py-2.5 px-4 font-medium min-w-[200px]">User / Email</th>
              <th className="py-2.5 px-4 font-medium w-40">Role Hierarchy</th>
              <th className="py-2.5 px-4 font-medium min-w-[200px]">Branch Scope</th>
              <th className="py-2.5 px-4 font-medium w-36">Permissions</th>
              <th className="py-2.5 px-4 font-medium w-28">Status</th>
              <th className="py-2.5 px-4 font-medium w-24 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stocky-border-subtle">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-stocky-text-sub">
                  Loading authorized team members...
                </td>
              </tr>
            ) : teamMembers.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-stocky-text-sub">
                  No team members added yet. Click &quot;Add Team Member&quot; to invite users.
                </td>
              </tr>
            ) : (
              teamMembers.map((member) => {
                const isSelected = selectedUserIds.has(member.id);
                const isOwner = member.role === 'owner';
                return (
                  <tr
                    key={member.id}
                    className={`transition-colors ${
                      isSelected
                        ? 'bg-stocky-primary/10 hover:bg-stocky-primary/15'
                        : 'hover:bg-stocky-bg-global/40'
                    }`}
                  >
                    {/* 0. Select Box */}
                    <td
                      className="py-3 px-3 w-10 min-w-[40px] text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        disabled={isOwner}
                        checked={isSelected}
                        onChange={() => toggleSelectUser(member.id)}
                        aria-label={`Select member ${member.email}`}
                        className="w-4 h-4 rounded border-stocky-border-subtle text-stocky-primary focus:ring-stocky-primary/20 accent-stocky-primary cursor-pointer align-middle disabled:opacity-30 disabled:cursor-not-allowed"
                      />
                    </td>

                    {/* User / Email */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-stocky-primary/10 text-stocky-primary flex items-center justify-center font-medium text-xs shrink-0">
                        {member.fullName
                          ? member.fullName.charAt(0).toUpperCase()
                          : member.email.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <span className="font-medium text-stocky-text-main block truncate">
                          {member.fullName || member.email.split('@')[0]}
                        </span>
                        <span className="text-[11px] text-stocky-text-sub block truncate">
                          {member.email}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="py-3 px-4">{getRoleBadge(member.role)}</td>

                  {/* Branch Scope */}
                  <td className="py-3 px-4">
                    {member.role === 'owner' || member.role === 'admin' ? (
                      <span className="text-[11px] text-stocky-text-sub italic">
                        All Branches (Company-wide)
                      </span>
                    ) : member.assignedBranchNames && member.assignedBranchNames.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {member.assignedBranchNames.map((bName) => (
                          <span
                            key={bName}
                            className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-widget bg-stocky-bg-global border border-stocky-border-subtle text-stocky-text-main"
                          >
                            <WarehouseIcon size="xs" className="shrink-0 text-stocky-accent" />
                            <span className="truncate max-w-[120px]">{bName}</span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[11px] text-red-500">No branch assigned</span>
                    )}
                  </td>

                  {/* Permissions */}
                  <td className="py-3 px-4">
                    <div className="flex flex-col gap-0.5 text-[11px]">
                      <span className={member.canEdit ? 'text-green-700' : 'text-stocky-text-sub'}>
                        {member.role === 'staff' ? '• Quantity adjustments' : member.canEdit ? '• Edit: Allowed' : '• Read-only'}
                      </span>
                      <span className={member.canDelete ? 'text-green-700' : 'text-stocky-text-sub'}>
                        {member.canDelete ? '• Delete: Allowed' : '• Delete: Blocked'}
                      </span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4">
                    {member.status === 'active' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-widget bg-green-50 text-green-700 border border-green-200">
                        <CheckCircleIcon size="xs" />
                        <span>Active</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-widget bg-amber-50 text-amber-700 border border-amber-200">
                        <ClockIcon size="xs" />
                        <span>Pre-authorized</span>
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEditDrawer(member)}
                        className="w-7 h-7 rounded-widget bg-stocky-bg-global border border-stocky-border-subtle flex items-center justify-center text-stocky-text-sub hover:text-stocky-text-main transition-colors cursor-pointer"
                        title="Edit permissions"
                      >
                        <EditIcon size="xs" />
                      </button>

                      {member.role !== 'owner' && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(member)}
                          className="w-7 h-7 rounded-widget bg-stocky-bg-global border border-stocky-border-subtle flex items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Revoke access"
                        >
                          <TrashIcon size="xs" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Floating Bulk Action Bar */}
      <AnimatePresence>
        {selectedUserIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-stocky-bg-widget/95 backdrop-blur-md border border-stocky-border-subtle shadow-2xl rounded-widget px-4 py-2.5 flex items-center gap-3"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-stocky-primary animate-pulse" />
              <span className="text-xs font-medium text-stocky-text-main">
                <span className="font-semibold">{selectedUserIds.size}</span> member
                {selectedUserIds.size > 1 ? 's' : ''} selected
              </span>
            </div>

            <div className="h-4 w-px bg-stocky-border-subtle" />

            <button
              type="button"
              onClick={handleBulkRemove}
              className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1.5 font-medium transition-colors cursor-pointer py-1 px-2 rounded-widget hover:bg-red-50"
              title="Revoke access for selected team members"
            >
              <TrashIcon size="xs" />
              <span>Revoke Selected</span>
            </button>

            <div className="h-4 w-px bg-stocky-border-subtle" />

            <button
              type="button"
              onClick={clearSelection}
              className="text-xs text-stocky-text-sub hover:text-stocky-text-main flex items-center gap-1 transition-colors cursor-pointer py-1 px-2 rounded-widget hover:bg-stocky-bg-global"
              title="Deselect all"
            >
              <XIcon size="xs" />
              <span>Deselect</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slide-over Drawer for Inviting / Editing Team Members (Portaled) */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {isDrawerOpen && (
              <div
                key="team-drawer"
                className="fixed inset-0 z-[100] overflow-hidden"
                style={{ top: 0, left: 0, right: 0, bottom: 0, margin: 0, padding: 0 }}
              >
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsDrawerOpen(false)}
                  className="fixed inset-0 bg-black/35 backdrop-blur-[2px]"
                  style={{ top: 0, left: 0, right: 0, bottom: 0, margin: 0 }}
                />

                {/* Panel */}
                <div
                  className="fixed inset-y-0 right-0 max-w-full flex pl-10 z-[101] pointer-events-none"
                  style={{ top: 0, bottom: 0, right: 0, margin: 0 }}
                >
                  <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', stiffness: 350, damping: 32 }}
                    className="w-screen max-w-md h-screen bg-stocky-bg-widget border-l border-stocky-border-subtle flex flex-col justify-between select-none pointer-events-auto"
                    style={{ height: '100vh', top: 0, margin: 0 }}
                  >
                    {/* Drawer Header */}
                    <div className="p-5 border-b border-stocky-border-subtle flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <ShieldIcon size="sm" className="text-stocky-primary" />
                          <span className="text-base font-medium text-stocky-text-main">
                            {editingMember ? 'Edit User Permissions' : 'Add Team Member'}
                          </span>
                        </div>
                        <p className="text-xs font-normal text-stocky-text-sub mt-0.5">
                          {editingMember
                            ? `Configure access for ${editingMember.email}`
                            : 'Set email address, role, and branch boundaries'}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsDrawerOpen(false)}
                        className="w-7 h-7 rounded-widget text-stocky-text-sub hover:text-stocky-text-main hover:bg-stocky-bg-global flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <XIcon size="xs" />
                      </button>
                    </div>

                    {/* Drawer Form Body */}
                    <form onSubmit={handleSaveMember} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
                      {formError && (
                        <div className="p-3 rounded-widget bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
                          <AlertCircleIcon size="xs" className="shrink-0" />
                          <span>{formError}</span>
                        </div>
                      )}

                      {formSuccess && (
                        <div className="p-3 rounded-widget bg-green-50 border border-green-200 text-green-700 flex items-center gap-2">
                          <CheckCircleIcon size="xs" className="shrink-0" />
                          <span>{formSuccess}</span>
                        </div>
                      )}

                      {/* Email Address */}
                      <div className="space-y-1.5">
                        <label className="font-medium text-stocky-text-main block">
                          Email Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          disabled={!!editingMember}
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          placeholder="e.g. maadi.manager@circlek.com"
                          className="w-full bg-stocky-bg-global border border-stocky-border-subtle rounded-widget px-3 py-2 text-xs text-stocky-text-main focus:outline-none focus:border-stocky-primary transition-colors disabled:opacity-60"
                        />
                        <p className="text-[11px] text-stocky-text-sub">
                          When this user signs in with Google or email, Stocky automatically assigns these permissions.
                        </p>
                      </div>

                      {/* Full Name */}
                      <div className="space-y-1.5">
                        <label className="font-medium text-stocky-text-main block">
                          Full Name / Display Title
                        </label>
                        <input
                          type="text"
                          value={nameInput}
                          onChange={(e) => setNameInput(e.target.value)}
                          placeholder="e.g. Ahmed Mostafa"
                          className="w-full bg-stocky-bg-global border border-stocky-border-subtle rounded-widget px-3 py-2 text-xs text-stocky-text-main focus:outline-none focus:border-stocky-primary transition-colors"
                        />
                      </div>

                      {/* Role Selection */}
                      <div className="space-y-1.5">
                        <label className="font-medium text-stocky-text-main block">
                          Role Hierarchy <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={roleInput}
                          onChange={(e) => {
                            const newRole = e.target.value as CompanyUserRole;
                            setRoleInput(newRole);
                            if (newRole === 'staff') {
                              setCanDeleteInput(false);
                            } else if (newRole === 'admin' || newRole === 'owner') {
                              setCanDeleteInput(true);
                            }
                          }}
                          className="w-full bg-stocky-bg-global border border-stocky-border-subtle rounded-widget px-3 py-2 text-xs text-stocky-text-main focus:outline-none focus:border-stocky-primary transition-colors cursor-pointer"
                        >
                          <option value="admin">Company Admin (Full company & all branches)</option>
                          <option value="manager">Branch Manager (Scoped to assigned branch)</option>
                          <option value="staff">Staff / Associate (Quantity adjustments only)</option>
                        </select>
                      </div>

                      {/* Branch Selection (Only if Manager or Staff) */}
                      {(roleInput === 'manager' || roleInput === 'staff') && (
                        <div className="space-y-2 p-3 rounded-widget bg-stocky-bg-global border border-stocky-border-subtle">
                          <label className="font-medium text-stocky-text-main block">
                            Assigned Branch Boundaries <span className="text-red-500">*</span>
                          </label>
                          <p className="text-[11px] text-stocky-text-sub mb-2">
                            Select the branches this user is authorized to access:
                          </p>

                          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                            {branches.map((b) => {
                              const isChecked = selectedBranchIds.includes(b.id);
                              return (
                                <label
                                  key={b.id}
                                  className="flex items-center gap-2 cursor-pointer text-xs text-stocky-text-main hover:text-stocky-primary"
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => toggleBranchSelection(b.id)}
                                    className="rounded text-stocky-primary focus:ring-stocky-primary cursor-pointer"
                                  />
                                  <span>{b.name}</span>
                                  <span className="text-[10px] text-stocky-text-sub font-normal">
                                    ({b.code || 'N/A'})
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Operational Authorizations */}
                      <div className="space-y-2 pt-2 border-t border-stocky-border-subtle">
                        <span className="font-medium text-stocky-text-main block">
                          Operational Permissions
                        </span>

                        <label className="flex items-center gap-2 cursor-pointer text-xs text-stocky-text-main">
                          <input
                            type="checkbox"
                            checked={canEditInput}
                            onChange={(e) => setCanEditInput(e.target.checked)}
                            className="rounded text-stocky-primary focus:ring-stocky-primary cursor-pointer"
                          />
                          <span>
                            {roleInput === 'staff'
                              ? 'Can adjust stock quantities'
                              : 'Can edit inventory and branch records'}
                          </span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer text-xs text-stocky-text-main">
                          <input
                            type="checkbox"
                            disabled={roleInput === 'staff'}
                            checked={canDeleteInput}
                            onChange={(e) => setCanDeleteInput(e.target.checked)}
                            className="rounded text-stocky-primary focus:ring-stocky-primary cursor-pointer disabled:opacity-40"
                          />
                          <span className={roleInput === 'staff' ? 'text-stocky-text-sub' : ''}>
                            Can delete inventory items / records
                          </span>
                        </label>
                      </div>
                    </form>

                    {/* Drawer Footer */}
                    <div className="p-4 sm:p-5 border-t border-stocky-border-subtle flex items-center justify-end gap-3 bg-stocky-bg-widget">
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        onClick={() => setIsDrawerOpen(false)}
                        disabled={saving}
                        className="px-4 py-2 text-xs cursor-pointer"
                      >
                        Cancel
                      </Button>

                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleSaveMember}
                        disabled={saving}
                        className="px-5 py-2 text-xs cursor-pointer"
                      >
                        {saving ? 'Saving...' : editingMember ? 'Update Permissions' : 'Authorize Email'}
                      </Button>
                    </div>
                  </motion.div>
                </div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </Card>
  );
}
