'use client';

import { usePlatform } from '@/views/platform/PlatformContext';
import { TasksPlatformView } from '@/views/platform/pages/TasksPlatformView';
import { PlatformWorkspaceSkeleton } from '@/widgets';

export default function TasksRoutePage() {
  const platform = usePlatform();

  if (platform.loading) {
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
      userRole={platform.userRole}
      currentUserId={platform.companyUserId}
      scanQuery={platform.taskScanQuery}
      onStartTask={platform.startStockTask}
      onSubmitTask={platform.submitStockTask}
      onReviewTask={platform.reviewStockTask}
    />
  );
}
