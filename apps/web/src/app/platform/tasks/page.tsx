'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { canOpenTab, usePlatform } from '@/views/platform/PlatformContext';
import { TasksPlatformView } from '@/views/platform/pages/TasksPlatformView';
import { PlatformWorkspaceSkeleton } from '@/widgets';

export default function TasksRoutePage() {
  const platform = usePlatform();
  const router = useRouter();

  useEffect(() => {
    if (!platform.loading && !canOpenTab(platform.userRole, 'tasks', platform.userPermissions)) {
      router.replace(platform.tenantPrefix || '/platform');
    }
  }, [platform.loading, platform.tenantPrefix, platform.userPermissions, platform.userRole, router]);

  if (platform.loading || !canOpenTab(platform.userRole, 'tasks', platform.userPermissions)) {
    return <PlatformWorkspaceSkeleton variant="tasks" />;
  }

  return (
    <TasksPlatformView
      tasks={platform.tasks}
      taskItems={platform.taskItems}
      taskExpected={platform.taskExpected}
      products={platform.products}
      locations={platform.visibleLocations}
      members={platform.teamMembers}
      assignments={platform.teamAssignments}
      userRole={platform.userRole}
      canManageTasks={platform.canManageTasks}
      currentUserId={platform.companyUserId}
      scanQuery={platform.taskScanQuery}
      onStartTask={platform.startStockTask}
      onSubmitTask={platform.submitStockTask}
      onReviewTask={platform.reviewStockTask}
      onCreateTask={platform.createStockTask}
    />
  );
}
