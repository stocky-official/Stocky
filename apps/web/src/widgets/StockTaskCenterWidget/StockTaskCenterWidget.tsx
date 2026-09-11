'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIcon, BarcodeIcon, CheckCircleIcon, ChevronRightIcon, ClockIcon, SearchIcon, XIcon } from '@stocky/icons';
import type { CompanyUserRole, Location, Product, StockTask, StockTaskExpected, StockTaskItem } from '@stocky/types';
import { SideDrawer } from '@/components/ui/SideDrawer';

type TeamMember = { id: string; email: string; full_name?: string | null; role: CompanyUserRole; status?: string };
type TaskResult = { countedQuantity: string; observedExpiryDate: string; note: string };
type TaskTab = 'ongoing' | 'completed';

export interface StockTaskCenterWidgetProps {
  tasks: StockTask[];
  taskItems: StockTaskItem[];
  taskExpected: StockTaskExpected[];
  products: Product[];
  locations: Location[];
  members: TeamMember[];
  userRole: CompanyUserRole;
  currentUserId?: string | null;
  scanQuery?: string;
  onStartTask: (taskId: string) => Promise<void>;
  onSubmitTask: (taskId: string, items: Array<{ taskItemId: string; countedQuantity?: number | null; observedExpiryDate?: string | null; note?: string | null }>) => Promise<void>;
  onReviewTask: (taskId: string, approve: boolean, note?: string) => Promise<void>;
  activeTaskTab?: 'ongoing' | 'completed';
  onTaskTabChange?: (tab: 'ongoing' | 'completed') => void;
}

function taskTypeLabel(taskType: StockTask['taskType']) { return taskType === 'count' ? 'Count quantities' : 'Check expiry dates'; }
function statusLabel(status: StockTask['status']) { return status.replace('_', ' '); }
function formatDate(value?: string | null) { return value ? new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value)) : 'Not recorded'; }
function formatDateTime(value?: string | null) { return value ? new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value)) : 'Not scheduled'; }
function elapsedLabel(milliseconds: number) {
  const minutes = Math.max(0, Math.floor(milliseconds / 60000));
  const hours = Math.floor(minutes / 60);
  return hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
}

export function StockTaskCenterWidget(props: StockTaskCenterWidgetProps) {
  const { tasks, taskItems, taskExpected, products, locations, members, userRole, currentUserId, scanQuery = '', onStartTask, onSubmitTask, onReviewTask } = props;
  const [runnerTask, setRunnerTask] = useState<StockTask | null>(null);
  const [reviewTask, setReviewTask] = useState<StockTask | null>(null);
  const [taskDetails, setTaskDetails] = useState<StockTask | null>(null);
  const [results, setResults] = useState<Record<string, TaskResult>>({});
  const [runnerSearch, setRunnerSearch] = useState('');
  const [runnerStatus, setRunnerStatus] = useState<StockTask['status']>('assigned');
  const [runnerStartedAt, setRunnerStartedAt] = useState<string | null>(null);
  const [runnerSaving, setRunnerSaving] = useState(false);
  const [runnerError, setRunnerError] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const [internalActiveTaskTab, setInternalActiveTaskTab] = useState<TaskTab>('ongoing');
  const activeTaskTab = props.activeTaskTab ?? internalActiveTaskTab;
  const setActiveTaskTab = (tab: TaskTab) => {
    setInternalActiveTaskTab(tab);
    props.onTaskTabChange?.(tab);
  };
  const [taskSearch, setTaskSearch] = useState('');
  const autoStartedTaskIds = useRef(new Set<string>());

  const productMap = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const locationMap = useMemo(() => new Map(locations.map((location) => [location.id, location.name])), [locations]);
  const memberMap = useMemo(() => new Map(members.map((member) => [member.id, member])), [members]);
  const expectedMap = useMemo(() => new Map(taskExpected.map((expected) => [expected.taskItemId, expected])), [taskExpected]);
  const visibleTasks = tasks.slice().sort((a, b) => {
    const priority: Record<StockTask['status'], number> = { submitted: 0, in_progress: 1, assigned: 2, rejected: 3, approved: 4, cancelled: 5 };
    return priority[a.status] - priority[b.status] || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  const ongoingTasks = visibleTasks.filter((task) => ['assigned', 'in_progress', 'submitted', 'rejected'].includes(task.status));
  const completedTasks = visibleTasks.filter((task) => ['approved', 'cancelled'].includes(task.status));
  const filteredTasks = (activeTaskTab === 'ongoing' ? ongoingTasks : completedTasks).filter((task) => {
    const query = taskSearch.trim().toLowerCase();
    if (!query) return true;
    const assignee = memberMap.get(task.assignedToCompanyUserId);
    return [task.title, task.taskType, task.status, locationMap.get(task.locationId), assignee?.full_name, assignee?.email]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  });

  useEffect(() => {
    if (!runnerTask) return;
    const next: Record<string, TaskResult> = {};
    taskItems.filter((item) => item.taskId === runnerTask.id).forEach((item) => {
      next[item.id] = { countedQuantity: '', observedExpiryDate: '', note: '' };
    });
    setResults(next);
    setRunnerSearch('');
    setRunnerError(null);
    setRunnerStatus(runnerTask.status);
    // The timer measures the full task lifetime from assignment, not only the
    // moment the assignee pressed Start.
    setRunnerStartedAt(runnerTask.createdAt);
  }, [runnerTask, taskItems]);

  useEffect(() => {
    if (runnerTask && scanQuery.trim()) setRunnerSearch(scanQuery.trim());
  }, [runnerTask, scanQuery]);

  useEffect(() => {
    if (!runnerTask) return;
    const interval = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(interval);
  }, [runnerTask]);

  useEffect(() => {
    const startDueTasks = () => {
      const currentTime = Date.now();
      tasks.filter((task) => task.assignedToCompanyUserId === currentUserId && task.status === 'assigned' && task.scheduledStartAt && new Date(task.scheduledStartAt).getTime() <= currentTime).forEach((task) => {
        if (autoStartedTaskIds.current.has(task.id)) return;
        autoStartedTaskIds.current.add(task.id);
        void onStartTask(task.id).catch(() => autoStartedTaskIds.current.delete(task.id));
      });
    };
    startDueTasks();
    const interval = window.setInterval(startDueTasks, 30000);
    return () => window.clearInterval(interval);
  }, [currentUserId, onStartTask, tasks]);

  const openRunner = (task: StockTask) => {
    setReviewTask(null);
    setTaskDetails(null);
    setRunnerTask(task);
  };
  const startRunner = async () => {
    if (!runnerTask) return;
    setRunnerSaving(true);
    setRunnerError(null);
    try {
      await onStartTask(runnerTask.id);
      setRunnerStatus('in_progress');
      setRunnerStartedAt((current) => current || new Date().toISOString());
    } catch (error: any) {
      setRunnerError(error?.message || 'Could not start this task.');
    } finally {
      setRunnerSaving(false);
    }
  };
  const updateResult = (itemId: string, key: keyof TaskResult, value: string) => setResults((current) => ({ ...current, [itemId]: { ...current[itemId], [key]: value } }));
  const runnerItems = runnerTask ? taskItems.filter((item) => item.taskId === runnerTask.id).filter((item) => {
    const product = productMap.get(item.productId);
    const query = runnerSearch.trim().toLowerCase();
    return !query || [product?.name, product?.barcode, item.stockLotId].filter(Boolean).some((value) => String(value).toLowerCase().includes(query));
  }) : [];
  const submitRunner = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!runnerTask) return;
    const allItems = taskItems.filter((item) => item.taskId === runnerTask.id);
    const payload = allItems.map((item) => {
      const result = results[item.id] || { countedQuantity: '', observedExpiryDate: '', note: '' };
      return runnerTask.taskType === 'count'
        ? { taskItemId: item.id, countedQuantity: result.countedQuantity === '' ? null : Number(result.countedQuantity), note: result.note.trim() || null }
        : { taskItemId: item.id, observedExpiryDate: result.observedExpiryDate || null, note: result.note.trim() || null };
    });
    if (runnerTask.taskType === 'count' && payload.some((item) => item.countedQuantity == null || !Number.isInteger(item.countedQuantity) || (item.countedQuantity as number) < 0)) return setRunnerError('Enter a whole number for every product.');
    if (runnerTask.taskType === 'expiry' && payload.some((item) => !item.observedExpiryDate && !item.note)) return setRunnerError('Enter an expiry date or a note when the date cannot be read.');
    setRunnerSaving(true);
    setRunnerError(null);
    try {
      await onSubmitTask(runnerTask.id, payload);
      setRunnerTask(null);
    } catch (error: any) {
      setRunnerError(error?.message || 'Could not submit this task.');
    } finally {
      setRunnerSaving(false);
    }
  };

  const openReview = (task: StockTask) => {
    setRunnerTask(null);
    setTaskDetails(null);
    setReviewTask(task);
    setReviewNote('');
    setReviewError(null);
  };
  const openTaskDrawer = (task: StockTask) => {
    const canRun = task.assignedToCompanyUserId === currentUserId && ['assigned', 'in_progress', 'rejected'].includes(task.status);
    if (canRun) return openRunner(task);
    if (task.status === 'submitted' && userRole !== 'staff') return openReview(task);
    setTaskDetails(task);
  };
  const submitReview = async (approve: boolean) => {
    if (!reviewTask) return;
    setReviewSaving(true);
    setReviewError(null);
    try {
      await onReviewTask(reviewTask.id, approve, reviewNote.trim() || undefined);
      setReviewTask(null);
    } catch (error: any) {
      setReviewError(error?.message || 'Could not review this task.');
    } finally {
      setReviewSaving(false);
    }
  };
  const reviewCanAct = Boolean(reviewTask && reviewTask.status === 'submitted' && userRole !== 'staff');

  return <>
    <div className="stocky-task-workspace flex flex-col gap-4">
      <nav className="stocky-context-tabs hidden md:flex" aria-label="Task views">
        <div className="stocky-context-tabs__list">
          <button type="button" onClick={() => setActiveTaskTab('ongoing')} aria-current={activeTaskTab === 'ongoing' ? 'page' : undefined} className={`stocky-context-tabs__item ${activeTaskTab === 'ongoing' ? 'stocky-context-tabs__item--active' : ''}`}>Ongoing<span className="ml-1 text-[10px]">{ongoingTasks.length}</span></button>
          <button type="button" onClick={() => setActiveTaskTab('completed')} aria-current={activeTaskTab === 'completed' ? 'page' : undefined} className={`stocky-context-tabs__item ${activeTaskTab === 'completed' ? 'stocky-context-tabs__item--active' : ''}`}>Completed<span className="ml-1 text-[10px]">{completedTasks.length}</span></button>
        </div>
      </nav>
      <section className="stocky-task-table-shell overflow-hidden rounded-2xl border border-stocky-border-subtle bg-white">
        <div className="flex flex-col gap-3 border-b border-stocky-border-subtle px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-xs font-medium text-stocky-text-main">{activeTaskTab === 'ongoing' ? 'Ongoing tasks' : 'Completed tasks'}</p><p className="mt-1 text-[11px] text-stocky-text-sub">Showing {filteredTasks.length} of {(activeTaskTab === 'ongoing' ? ongoingTasks : completedTasks).length}</p></div>
          <div className="relative w-full sm:w-64"><SearchIcon size="xs" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stocky-text-sub" /><input value={taskSearch} onChange={(event) => setTaskSearch(event.target.value)} placeholder="Search tasks..." className="h-8 w-full rounded-lg border border-stocky-border-subtle bg-stocky-bg-global pl-8 pr-3 text-xs focus:border-stocky-primary focus:outline-none" /></div>
        </div>
        {filteredTasks.length === 0 ? <div className="px-5 py-12 text-center"><CheckCircleIcon size="md" className="mx-auto text-emerald-600/60" /><h3 className="mt-3 text-sm font-medium text-stocky-text-main">{taskSearch ? 'No matching tasks' : activeTaskTab === 'ongoing' ? 'No ongoing tasks' : 'No completed tasks'}</h3><p className="mt-1 text-xs text-stocky-text-sub">{taskSearch ? 'Try another task, person, or location.' : userRole === 'staff' && activeTaskTab === 'ongoing' ? 'New count and expiry-check tasks assigned to you will appear here.' : activeTaskTab === 'ongoing' ? 'Open Stock, select products, and assign a count or expiry check.' : 'Completed task history will appear here.'}</p></div> : <div className="overflow-x-auto"><table className="w-full table-fixed text-left text-[11px]"><thead className="border-b border-stocky-border-subtle bg-stocky-bg-global/60 text-[10px] uppercase tracking-wide text-stocky-text-sub"><tr><th className="w-[29%] px-4 py-2.5 font-medium">Task</th><th className="hidden w-[15%] px-3 py-2.5 font-medium md:table-cell">Type</th><th className="hidden w-[14%] px-3 py-2.5 font-medium sm:table-cell">Location</th><th className="hidden w-[16%] px-3 py-2.5 font-medium lg:table-cell">Assigned to</th><th className="w-[10%] px-3 py-2.5 font-medium">Items</th><th className="w-[12%] px-3 py-2.5 font-medium">Status</th><th className="w-[14%] px-4 py-2.5 text-right font-medium">Action</th></tr></thead><tbody className="divide-y divide-stocky-border-subtle">{filteredTasks.map((task) => {
          const items = taskItems.filter((item) => item.taskId === task.id);
          const completed = items.filter((item) => item.status !== 'pending').length;
          const assignee = memberMap.get(task.assignedToCompanyUserId);
          const canRun = task.assignedToCompanyUserId === currentUserId && ['assigned', 'in_progress', 'rejected'].includes(task.status);
          const canReview = userRole !== 'staff' && task.status === 'submitted';
          const canOpen = true;
          return <tr key={task.id} tabIndex={canOpen ? 0 : -1} onClick={() => canOpen && openTaskDrawer(task)} onKeyDown={(event) => { if (canOpen && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); openTaskDrawer(task); } }} className={`align-middle ${canOpen ? 'cursor-pointer hover:bg-stocky-bg-global/50 focus:bg-stocky-bg-global/50 focus:outline-none' : ''}`}>
            <td className="px-4 py-3"><div className="flex min-w-0 items-center gap-2.5"><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${task.taskType === 'count' ? 'stocky-status-info' : 'stocky-status-warning'}`}>{task.taskType === 'count' ? <CheckCircleIcon size="xs" /> : <ClockIcon size="xs" />}</span><div className="min-w-0"><p className="truncate font-medium text-stocky-text-main">{task.title}</p><p className="mt-1 truncate text-[10px] text-stocky-text-sub sm:hidden">{taskTypeLabel(task.taskType)} · {locationMap.get(task.locationId) || 'Location'}</p><p className="mt-1 truncate text-[10px] text-stocky-text-sub">{formatDate(task.createdAt)}</p></div></div></td>
            <td className="hidden px-3 py-3 text-stocky-text-sub md:table-cell">{taskTypeLabel(task.taskType)}</td>
            <td className="hidden px-3 py-3 text-stocky-text-sub sm:table-cell">{locationMap.get(task.locationId) || 'Location'}</td>
            <td className="hidden truncate px-3 py-3 text-stocky-text-sub lg:table-cell">{assignee?.full_name || assignee?.email || 'Team member'}</td>
            <td className="px-3 py-3 text-stocky-text-main">{completed}/{items.length}</td>
            <td className="px-3 py-3"><span className={`inline-flex rounded-full border px-2 py-1 text-[10px] capitalize ${task.status === 'submitted' ? 'stocky-status-info' : task.status === 'in_progress' ? 'stocky-status-warning' : task.status === 'rejected' ? 'stocky-status-critical' : task.status === 'approved' ? 'stocky-status-success' : 'stocky-status-muted'}`}>{statusLabel(task.status)}</span></td>
            <td className="px-4 py-3 text-right"><div className="flex justify-end">{canRun && <button type="button" onClick={(event) => { event.stopPropagation(); openRunner(task); }} className="inline-flex h-7 items-center gap-1 rounded-full bg-stocky-primary px-2.5 text-[10px] font-medium text-white">{task.status === 'assigned' ? 'Start' : task.status === 'rejected' ? 'Correct' : 'Continue'}<ChevronRightIcon size="xs" /></button>}{canReview && <button type="button" onClick={(event) => { event.stopPropagation(); openReview(task); }} className="inline-flex h-7 items-center gap-1 rounded-full bg-stocky-primary px-2.5 text-[10px] font-medium text-white">Review<ChevronRightIcon size="xs" /></button>}{!canRun && !canReview && <button type="button" onClick={(event) => { event.stopPropagation(); openTaskDrawer(task); }} className="inline-flex h-7 items-center gap-1 rounded-full border border-stocky-border-subtle px-2.5 text-[10px] font-medium text-stocky-text-main">View<ChevronRightIcon size="xs" /></button>}</div></td>
          </tr>;
        })}</tbody></table></div>}
      </section>
    </div>

    <SideDrawer isOpen={Boolean(runnerTask)} onClose={() => !runnerSaving && setRunnerTask(null)} ariaLabel="Assigned stock task">
      {runnerTask && <>
        <div className="border-b border-stocky-border-subtle px-5 py-4"><div className="flex items-start justify-between gap-3"><div><p className="stocky-page-eyebrow">Assigned task</p><h2 className="mt-1 text-lg font-medium text-stocky-text-main">{runnerTask.title}</h2><p className="mt-1 text-xs text-stocky-text-sub">{taskItems.filter((item) => item.taskId === runnerTask.id).length} items · Time since assigned {elapsedLabel(now - new Date(runnerStartedAt || runnerTask.createdAt).getTime())}</p></div><button type="button" onClick={() => !runnerSaving && setRunnerTask(null)} className="flex h-8 w-8 items-center justify-center rounded-full text-stocky-text-sub hover:bg-stocky-bg-global" aria-label="Close"><XIcon size="xs" /></button></div>{runnerStatus === 'assigned' && <p className="mt-3 rounded-xl stocky-status-info border px-3 py-2 text-xs">Start when you are ready. Count only what you can physically see, then submit the whole list.</p>}</div>
        {['assigned', 'rejected'].includes(runnerStatus) ? <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center"><ClockIcon size="lg" className="text-stocky-primary" /><h3 className="text-base font-medium text-stocky-text-main">{runnerStatus === 'rejected' ? 'Correction needed' : 'Ready to begin?'}</h3><p className="max-w-sm text-xs text-stocky-text-sub">{runnerStatus === 'rejected' ? 'Your manager sent this task back. Check the list again and resubmit it.' : 'Use the barcode scanner or search each item below. The expected quantity is not shown during the task.'}</p><button type="button" onClick={startRunner} disabled={runnerSaving} className="h-10 rounded-full bg-stocky-primary px-5 text-xs font-medium text-white disabled:opacity-60">{runnerSaving ? 'Starting...' : runnerStatus === 'rejected' ? 'Start correction' : 'Start task'}</button>{runnerError && <p className="rounded-xl stocky-status-critical border px-3 py-2 text-xs">{runnerError}</p>}</div> : <form onSubmit={submitRunner} className="flex min-h-0 flex-1 flex-col"><div className="border-b border-stocky-border-subtle p-5"><div className="relative"><SearchIcon size="xs" className="absolute left-3 top-1/2 -translate-y-1/2 text-stocky-text-sub" /><input value={runnerSearch} onChange={(event) => setRunnerSearch(event.target.value)} placeholder="Search product or barcode..." className="h-10 w-full rounded-xl border border-stocky-border-subtle pl-9 pr-3 text-sm focus:border-stocky-primary focus:outline-none" /></div><p className="mt-2 flex items-center gap-1.5 text-[11px] text-stocky-text-sub"><BarcodeIcon size="xs" />Scan a barcode or type it above. Complete every item before submitting.</p></div><div className="flex-1 overflow-y-auto px-5">{runnerItems.map((item) => { const product = productMap.get(item.productId); const result = results[item.id] || { countedQuantity: '', observedExpiryDate: '', note: '' }; const completed = Boolean(item.completedAt); return <div key={item.id} className="border-b border-stocky-border-subtle py-4"><div className="flex items-start gap-3"><span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${completed ? 'stocky-status-success' : 'stocky-status-muted'}`}>{completed ? <CheckCircleIcon size="xs" /> : <span className="text-[10px] font-medium">•</span>}</span><div className="min-w-0 flex-1"><p className="text-xs font-medium text-stocky-text-main">{product?.name || 'Product'}</p><p className="mt-1 text-[11px] text-stocky-text-sub">{product?.barcode || 'No barcode'}{item.stockLotId ? ` · Batch ${item.stockLotId.slice(0, 8)}` : ''}</p></div></div>{runnerTask.taskType === 'count' ? <div className="mt-3 flex items-center gap-2"><input type="number" min="0" step="1" required aria-label={`Count ${product?.name || 'product'}`} value={result.countedQuantity} onChange={(event) => updateResult(item.id, 'countedQuantity', event.target.value)} className="h-10 w-32 rounded-xl border border-stocky-border-subtle px-3 text-sm focus:border-stocky-primary focus:outline-none" placeholder="Quantity" /><span className="text-xs text-stocky-text-sub">{product?.unitName || 'units'}</span></div> : <div className="mt-3 grid gap-2"><label className="text-[11px] font-medium text-stocky-text-sub">Expiry date<input type="date" required={!result.note} value={result.observedExpiryDate} onChange={(event) => updateResult(item.id, 'observedExpiryDate', event.target.value)} className="mt-1 h-10 w-full rounded-xl border border-stocky-border-subtle px-3 text-sm focus:border-stocky-primary focus:outline-none" /></label><input value={result.note} onChange={(event) => updateResult(item.id, 'note', event.target.value)} placeholder="Note if date is missing or unclear" className="h-9 w-full rounded-xl border border-stocky-border-subtle px-3 text-xs focus:border-stocky-primary focus:outline-none" /></div>}</div>; })}</div>{runnerError && <p className="mx-5 mb-2 rounded-xl stocky-status-critical border px-3 py-2 text-xs">{runnerError}</p>}<div className="flex gap-2 border-t border-stocky-border-subtle p-5"><button type="button" onClick={() => setRunnerTask(null)} className="h-10 flex-1 rounded-full border border-stocky-border-subtle text-xs font-medium">Save for later</button><button type="submit" disabled={runnerSaving} className="h-10 flex-1 rounded-full bg-stocky-primary text-xs font-medium text-white disabled:opacity-60">{runnerSaving ? 'Submitting...' : 'Submit task'}</button></div></form>}
      </>}
    </SideDrawer>

    <SideDrawer isOpen={Boolean(taskDetails)} onClose={() => setTaskDetails(null)} ariaLabel="Task details">
      {taskDetails && <>
        <div className="flex items-start justify-between gap-3 border-b border-stocky-border-subtle px-5 py-4"><div><p className="stocky-page-eyebrow">Task details</p><h2 className="mt-1 text-lg font-medium text-stocky-text-main">{taskDetails.title}</h2><p className="mt-1 text-xs text-stocky-text-sub">{taskTypeLabel(taskDetails.taskType)} · {locationMap.get(taskDetails.locationId) || 'Location'}</p></div><button type="button" onClick={() => setTaskDetails(null)} className="flex h-8 w-8 items-center justify-center rounded-full text-stocky-text-sub hover:bg-stocky-bg-global" aria-label="Close"><XIcon size="xs" /></button></div>
        <div className="flex-1 overflow-y-auto p-5"><div className="grid gap-2 sm:grid-cols-2"><div className="rounded-xl bg-stocky-bg-global p-3"><p className="text-[10px] uppercase tracking-wide text-stocky-text-sub">Time since assigned</p><p className="mt-1 text-lg font-medium text-stocky-text-main">{elapsedLabel(now - new Date(taskDetails.createdAt).getTime())}</p><p className="mt-1 text-[10px] text-stocky-text-sub">{taskDetails.startedAt ? `Started ${formatDateTime(taskDetails.startedAt)}` : 'Not started yet'}</p></div><div className="rounded-xl bg-stocky-bg-global p-3"><p className="text-[10px] uppercase tracking-wide text-stocky-text-sub">Progress</p><p className="mt-1 text-lg font-medium text-stocky-text-main">{taskItems.filter((item) => item.taskId === taskDetails.id && item.status !== 'pending').length} of {taskItems.filter((item) => item.taskId === taskDetails.id).length}</p><p className="mt-1 text-[10px] text-stocky-text-sub">items completed</p></div></div>{taskDetails.scheduledStartAt && <div className="mt-3 rounded-xl stocky-status-info border px-3 py-2 text-[11px]"><span className="font-medium">Work window</span><span className="mt-1 block">{formatDateTime(taskDetails.scheduledStartAt)} – {formatDateTime(taskDetails.scheduledEndAt)}</span></div>}<div className="mt-4 grid grid-cols-2 gap-2"><div className="rounded-xl border border-stocky-border-subtle p-3"><p className="text-[10px] uppercase tracking-wide text-stocky-text-sub">Status</p><p className="mt-1 text-xs font-medium capitalize text-stocky-text-main">{statusLabel(taskDetails.status)}</p></div><div className="rounded-xl border border-stocky-border-subtle p-3"><p className="text-[10px] uppercase tracking-wide text-stocky-text-sub">Assigned to</p><p className="mt-1 truncate text-xs font-medium text-stocky-text-main">{memberMap.get(taskDetails.assignedToCompanyUserId)?.full_name || memberMap.get(taskDetails.assignedToCompanyUserId)?.email || 'Team member'}</p></div></div><div className="mt-4 divide-y divide-stocky-border-subtle rounded-xl border border-stocky-border-subtle">{taskItems.filter((item) => item.taskId === taskDetails.id).map((item) => { const product = productMap.get(item.productId); return <div key={item.id} className="flex items-center gap-3 px-3 py-3"><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${item.status !== 'pending' ? 'stocky-status-success' : 'stocky-status-muted'}`}>{item.status !== 'pending' ? <CheckCircleIcon size="xs" /> : <span className="text-[10px]">•</span>}</span><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium text-stocky-text-main">{product?.name || 'Product'}</p><p className="mt-1 text-[10px] text-stocky-text-sub">{product?.barcode || 'No barcode'} · {item.status === 'pending' ? 'Pending' : 'Completed'}</p></div></div>; })}</div></div>
        <div className="border-t border-stocky-border-subtle p-5"><button type="button" onClick={() => setTaskDetails(null)} className="h-10 w-full rounded-full border border-stocky-border-subtle text-xs font-medium text-stocky-text-main">Close</button></div>
      </>}
    </SideDrawer>

    <SideDrawer isOpen={Boolean(reviewTask)} onClose={() => !reviewSaving && setReviewTask(null)} ariaLabel="Review stock task">
      {reviewTask && <>
        <div className="flex items-start justify-between gap-3 border-b border-stocky-border-subtle px-5 py-4"><div><p className="stocky-page-eyebrow">Manager review</p><h2 className="mt-1 text-lg font-medium text-stocky-text-main">{reviewTask.title}</h2><p className="mt-1 text-xs text-stocky-text-sub">Compare the submitted work with the recorded stock before approving.</p></div><button type="button" onClick={() => !reviewSaving && setReviewTask(null)} className="flex h-8 w-8 items-center justify-center rounded-full text-stocky-text-sub hover:bg-stocky-bg-global" aria-label="Close"><XIcon size="xs" /></button></div><div className="flex-1 overflow-y-auto p-5"><div className="space-y-2">{taskItems.filter((item) => item.taskId === reviewTask.id).map((item) => { const product = productMap.get(item.productId); const expected = expectedMap.get(item.id); const difference = reviewTask.taskType === 'count' ? Number(item.countedQuantity || 0) - Number(expected?.expectedQuantity || 0) : 0; return <div key={item.id} className="rounded-xl border border-stocky-border-subtle p-3"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-medium text-stocky-text-main">{product?.name || 'Product'}</p><p className="mt-1 text-[11px] text-stocky-text-sub">{product?.barcode || 'No barcode'}{item.stockLotId ? ` · Batch ${item.stockLotId.slice(0, 8)}` : ''}</p></div>{reviewTask.taskType === 'count' ? <span className={`text-xs font-medium ${difference === 0 ? 'text-stocky-text-sub' : difference > 0 ? 'stocky-text-success' : 'stocky-text-critical'}`}>Expected {expected?.expectedQuantity ?? 0} · Counted {item.countedQuantity ?? 0}</span> : <span className="text-right text-[11px] text-stocky-text-sub">Recorded {formatDate(expected?.expectedExpiryDate)}<br /><strong className="text-stocky-text-main">Found {formatDate(item.observedExpiryDate)}</strong></span>}</div>{difference !== 0 && <p className="mt-2 text-[11px] text-stocky-text-sub">Difference: {difference > 0 ? '+' : ''}{difference}</p>}{item.note && <p className="mt-2 rounded-lg bg-stocky-bg-global px-2.5 py-2 text-[11px] text-stocky-text-sub">Note: {item.note}</p>}</div>; })}</div><label className="mt-4 block text-xs font-medium text-stocky-text-main">Review note <span className="font-normal text-stocky-text-sub">(optional)</span><textarea value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} rows={3} className="mt-1.5 w-full resize-none rounded-xl border border-stocky-border-subtle px-3 py-2 text-sm focus:border-stocky-primary focus:outline-none" /></label>{reviewError && <p className="mt-3 rounded-xl stocky-status-critical border px-3 py-2 text-xs">{reviewError}</p>}</div><div className="flex gap-2 border-t border-stocky-border-subtle p-5"><button type="button" onClick={() => submitReview(false)} disabled={reviewSaving} className="h-10 flex-1 rounded-full border border-red-200 text-xs font-medium text-red-700 disabled:opacity-60">Send back</button><button type="button" onClick={() => submitReview(true)} disabled={reviewSaving} className="h-10 flex-1 rounded-full bg-stocky-primary text-xs font-medium text-white disabled:opacity-60">{reviewSaving ? 'Saving...' : 'Approve & log'}</button></div>
      </>}
    </SideDrawer>
  </>;
}
