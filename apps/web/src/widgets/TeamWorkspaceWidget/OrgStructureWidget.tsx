'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
import { useTranslation } from '@/lib/i18n';

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
  const { t } = useTranslation();
  const [zoom, setZoom] = useState(1);
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      setZoom(0.75);
    }
  }, []);

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
          return <span className="inline-flex rounded-full border stocky-status-muted px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">{t('team.roleOwner')}</span>;
        case 'admin':
          return <span className="inline-flex rounded-full border stocky-status-info px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">{t('team.roleAdmin')}</span>;
        case 'manager':
          return <span className="inline-flex rounded-full border stocky-status-hold px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">{t('team.roleManager')}</span>;
        default:
          return <span className="inline-flex rounded-full border stocky-status-muted px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider">{t('team.roleStaff')}</span>;
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
          className="group relative w-60 rounded-2xl bg-stocky-bg-widget border border-stocky-border-subtle p-3.5 shadow-2xs hover:border-stocky-primary hover:shadow-md transition-all text-start cursor-pointer z-10"
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
                <span className="text-stocky-text-sub font-normal italic">{t('team.noTitleAssigned')}</span>
              )}
            </p>
          </div>

          {/* Location & Reports Meta */}
          <div className="mt-2.5 pt-2 border-t border-stocky-border-subtle flex items-center justify-between text-[10px] text-stocky-text-sub">
            <span className="truncate max-w-[120px] inline-flex items-center gap-1">
              <WarehouseIcon size="xs" />
              <span>{primaryLoc ? primaryLoc.name : t('team.allLocations')}</span>
            </span>

            {hasChildren && (
              <span className="inline-flex items-center gap-1 font-semibold text-stocky-text-main">
                <UsersIcon size="xs" />
                <span>{t('team.directCount', { count: node.children.length })}</span>
              </span>
            )}
          </div>

          {/* Collapse / Expand Toggle Button on bottom edge */}
          {hasChildren && (
            <button
              type="button"
              onClick={(e) => toggleCollapse(node.member.id, e)}
              className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex h-6 px-2 items-center justify-center gap-1 rounded-full bg-stocky-bg-widget border border-stocky-border-strong text-[10px] font-bold text-stocky-text-main hover:bg-stocky-bg-global shadow-2xs cursor-pointer z-20"
              title={isCollapsed ? t('team.expandReports') : t('team.collapseReports')}
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-stocky-border-subtle bg-stocky-bg-global/50 px-3 sm:px-4 py-2.5 text-xs">
        <div className="flex items-center justify-between sm:justify-start gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-stocky-text-sub">
            {t('team.hierarchyTree')}
          </span>
          <span className="text-xs font-medium text-stocky-text-main">
            {t('team.treeMembersCount', { members: members.length, branches: treeRoots.length })}
          </span>
        </div>

        {/* Tree controls */}
        <div className="flex items-center gap-2 flex-wrap justify-between sm:justify-end">
          <div className="inline-flex items-center gap-1.5">
            <button
              type="button"
              onClick={expandAll}
              className="h-8 px-3 rounded-full border border-stocky-border-subtle bg-stocky-bg-widget text-[11px] font-medium text-stocky-text-main hover:bg-stocky-bg-global cursor-pointer"
            >
              {t('team.expandAll')}
            </button>
            <button
              type="button"
              onClick={collapseAll}
              className="h-8 px-3 rounded-full border border-stocky-border-subtle bg-stocky-bg-widget text-[11px] font-medium text-stocky-text-main hover:bg-stocky-bg-global cursor-pointer"
            >
              {t('team.collapseAll')}
            </button>
          </div>

          <div className="hidden sm:block h-4 w-px bg-stocky-border-subtle mx-0.5" />

          {/* Zoom buttons */}
          <div className="inline-flex items-center rounded-full border border-stocky-border-subtle bg-stocky-bg-widget p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
              className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-stocky-bg-global text-stocky-text-main disabled:opacity-40 cursor-pointer"
              title={t('team.zoomOut')}
            >
              -
            </button>
            <span className="px-2 text-[11px] font-medium text-stocky-text-sub min-w-[2.5rem] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoom >= 1.5}
              className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-stocky-bg-global text-stocky-text-main disabled:opacity-40 cursor-pointer"
              title={t('team.zoomIn')}
            >
              +
            </button>
            <button
              type="button"
              onClick={handleZoomReset}
              className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-stocky-bg-global text-stocky-text-sub hover:text-stocky-text-main cursor-pointer"
              title={t('team.resetZoom')}
            >
              <RotateCcwIcon size="xs" />
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Tree View Canvas */}
      <div className="overflow-auto min-h-[440px] max-h-[70vh] p-4 sm:p-8 bg-stocky-bg-global/20 text-center overscroll-contain">
        <div
          className="inline-flex transition-transform duration-200 origin-top items-start gap-8 sm:gap-12 justify-center text-start"
          style={{ transform: `scale(${zoom})` }}
        >
          {treeRoots.map((root) => renderTreeNode(root, true))}
        </div>
      </div>
    </div>
  );
}
