'use client';

import React, { useState, useMemo } from 'react';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  PlusIcon,
  RotateCcwIcon,
  UsersIcon,
  WarehouseIcon,
} from '@stocky/icons';
import type { Location } from '@stocky/types';
import { UserAvatar } from '@/components/ui/UserAvatar';
import type { TeamMemberData } from './MemberDetailDrawer';

export interface OrgStructureWidgetProps {
  members: TeamMemberData[];
  locations: Location[];
  assignments: Array<{ id: string; user_id: string; location_id: string }>;
  canManage: boolean;
  onSelectMember: (member: TeamMemberData) => void;
}

interface TreeNode {
  member: TeamMemberData;
  children: TreeNode[];
}

export function OrgStructureWidget({
  members,
  locations,
  assignments,
  canManage,
  onSelectMember,
}: OrgStructureWidgetProps) {
  const [zoom, setZoom] = useState(1);
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

  // Build hierarchical tree representation
  const treeRoots = useMemo(() => {
    if (members.length === 0) return [];

    const memberMap = new Map<string, TreeNode>();
    members.forEach((m) => {
      memberMap.set(m.id, { member: m, children: [] });
    });

    const roots: TreeNode[] = [];
    const childrenSet = new Set<string>();

    // First pass: link by reports_to
    members.forEach((m) => {
      if (m.reports_to && memberMap.has(m.reports_to) && m.reports_to !== m.id) {
        const parent = memberMap.get(m.reports_to)!;
        parent.children.push(memberMap.get(m.id)!);
        childrenSet.add(m.id);
      }
    });

    // Roots are owners, or unparented members
    members.forEach((m) => {
      if (!childrenSet.has(m.id)) {
        roots.push(memberMap.get(m.id)!);
      }
    });

    // If there's an owner, sort owner to first root
    roots.sort((a, b) => {
      if (a.member.role === 'owner') return -1;
      if (b.member.role === 'owner') return 1;
      return 0;
    });

    return roots;
  }, [members]);

  const toggleCollapse = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  };

  const expandAll = () => setCollapsedIds(new Set());
  const collapseAll = () => {
    const allParentIds = new Set<string>();
    const findParents = (nodes: TreeNode[]) => {
      nodes.forEach((n) => {
        if (n.children.length > 0) {
          allParentIds.add(n.member.id);
          findParents(n.children);
        }
      });
    };
    findParents(treeRoots);
    setCollapsedIds(allParentIds);
  };

  const handleZoomIn = () => setZoom((z) => Math.min(1.5, Math.round((z + 0.15) * 100) / 100));
  const handleZoomOut = () => setZoom((z) => Math.max(0.6, Math.round((z - 0.15) * 100) / 100));
  const handleZoomReset = () => setZoom(1);

  // Render recursive Org Tree Node
  const renderTreeNode = (node: TreeNode, isRoot: boolean = false) => {
    const isCollapsed = collapsedIds.has(node.member.id);
    const hasChildren = node.children.length > 0;
    const memberAssignments = assignments.filter((a) => a.user_id === node.member.id);
    const primaryLoc = memberAssignments[0]
      ? locations.find((l) => l.id === memberAssignments[0].location_id)
      : null;

    const roleBadge = () => {
      switch (node.member.role) {
        case 'owner':
          return <span className="inline-flex rounded-full border stocky-status-muted px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">Owner</span>;
        case 'admin':
          return <span className="inline-flex rounded-full border stocky-status-info px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">Admin</span>;
        case 'manager':
          return <span className="inline-flex rounded-full border stocky-status-hold px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">Manager</span>;
        default:
          return <span className="inline-flex rounded-full border stocky-status-muted px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider">Staff</span>;
      }
    };

    return (
      <div key={node.member.id} className="flex flex-col items-center">
        {/* Top vertical branch line (for non-roots) */}
        {!isRoot && (
          <div className="w-0.5 h-6 bg-stocky-border-strong" />
        )}

        {/* Node Card */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onSelectMember(node.member)}
          className="group relative w-60 rounded-2xl bg-white border border-stocky-border-subtle p-3.5 shadow-2xs hover:border-stocky-primary hover:shadow-md transition-all text-left cursor-pointer z-10"
        >
          {/* Top row: Avatar & Role */}
          <div className="flex items-center justify-between gap-2">
            <UserAvatar
              src={node.member.avatar_url}
              name={node.member.full_name}
              email={node.member.email}
              size="sm"
              className="ring-1 ring-stocky-border-subtle shrink-0"
            />
            {roleBadge()}
          </div>

          {/* Name & Job Title */}
          <div className="mt-2.5">
            <h4 className="text-xs font-semibold text-stocky-text-main truncate group-hover:text-stocky-primary transition-colors">
              {node.member.full_name || node.member.email}
            </h4>
            <p className="text-[11px] font-medium text-stocky-primary truncate mt-0.5">
              {node.member.job_title || (
                <span className="text-stocky-text-sub font-normal italic">No title assigned</span>
              )}
            </p>
          </div>

          {/* Location & Reports Meta */}
          <div className="mt-2.5 pt-2 border-t border-stocky-border-subtle flex items-center justify-between text-[10px] text-stocky-text-sub">
            <span className="truncate max-w-[120px] inline-flex items-center gap-1">
              <WarehouseIcon size="xs" />
              <span>{primaryLoc ? primaryLoc.name : 'All Locations'}</span>
            </span>

            {hasChildren && (
              <span className="inline-flex items-center gap-1 font-semibold text-stocky-text-main">
                <UsersIcon size="xs" />
                <span>{node.children.length} direct</span>
              </span>
            )}
          </div>

          {/* Collapse / Expand Toggle Button on bottom edge */}
          {hasChildren && (
            <button
              type="button"
              onClick={(e) => toggleCollapse(node.member.id, e)}
              className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex h-6 px-2 items-center justify-center gap-1 rounded-full bg-white border border-stocky-border-strong text-[10px] font-bold text-stocky-text-main hover:bg-stocky-bg-global shadow-2xs cursor-pointer z-20"
              title={isCollapsed ? 'Expand direct reports' : 'Collapse direct reports'}
            >
              <span>{isCollapsed ? `+${node.children.length}` : '-'}</span>
            </button>
          )}
        </div>

        {/* Children Subtree with horizontal branch connectors */}
        {hasChildren && !isCollapsed && (
          <div className="flex flex-col items-center mt-3">
            {/* Stem line down from node */}
            <div className="w-0.5 h-6 bg-stocky-border-strong" />

            {/* Horizontal branch bar spanning children */}
            {node.children.length > 1 && (
              <div className="relative w-full flex justify-center">
                {/* Horizontal line spanning across children */}
                <div
                  className="h-0.5 bg-stocky-border-strong absolute top-0"
                  style={{
                    left: `calc(100% / ${node.children.length} / 2)`,
                    right: `calc(100% / ${node.children.length} / 2)`,
                  }}
                />
              </div>
            )}

            {/* Render Child Columns */}
            <div className="flex items-start gap-8 justify-center">
              {node.children.map((child) => renderTreeNode(child, false))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col w-full">
      {/* Org Chart Top Toolbar (Zoom & Tree Controls) */}
      <div className="flex items-center justify-between border-b border-stocky-border-subtle bg-stocky-bg-global/50 px-4 py-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-stocky-text-sub">
            Hierarchy Tree:
          </span>
          <span className="text-xs font-medium text-stocky-text-main">
            {members.length} members ({treeRoots.length} reporting branches)
          </span>
        </div>

        {/* Tree controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={expandAll}
            className="h-8 px-3 rounded-full border border-stocky-border-subtle bg-white text-[11px] font-medium text-stocky-text-main hover:bg-stocky-bg-global cursor-pointer"
          >
            Expand all
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="h-8 px-3 rounded-full border border-stocky-border-subtle bg-white text-[11px] font-medium text-stocky-text-main hover:bg-stocky-bg-global cursor-pointer"
          >
            Collapse all
          </button>

          <div className="h-4 w-px bg-stocky-border-subtle mx-1" />

          {/* Zoom buttons */}
          <div className="inline-flex items-center rounded-full border border-stocky-border-subtle bg-white p-0.5">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoom <= 0.6}
              className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-stocky-bg-global text-stocky-text-main disabled:opacity-40 cursor-pointer"
              title="Zoom out"
            >
              -
            </button>
            <span className="px-2 text-[11px] font-medium text-stocky-text-sub">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoom >= 1.5}
              className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-stocky-bg-global text-stocky-text-main disabled:opacity-40 cursor-pointer"
              title="Zoom in"
            >
              +
            </button>
            <button
              type="button"
              onClick={handleZoomReset}
              className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-stocky-bg-global text-stocky-text-sub hover:text-stocky-text-main cursor-pointer"
              title="Reset zoom"
            >
              <RotateCcwIcon size="xs" />
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Tree View Canvas */}
      <div className="overflow-auto min-h-[480px] max-h-[70vh] p-8 flex justify-center bg-stocky-bg-global/20">
        <div
          className="transition-transform duration-200 origin-top flex items-start gap-12 justify-center"
          style={{ transform: `scale(${zoom})` }}
        >
          {treeRoots.map((root) => renderTreeNode(root, true))}
        </div>
      </div>
    </div>
  );
}
