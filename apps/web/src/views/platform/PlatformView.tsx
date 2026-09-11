'use client';

import { RedesignedPlatformView } from './RedesignedPlatformView';
import { PageLayout } from '@/components/ui/PageLayout';

/**
 * PlatformView owns the page shell. The workspace controller below owns data
 * loading and delegates each operational area to a widget.
 */
export function PlatformView() {
  return (
    <PageLayout className="stocky-platform-shell">
      <RedesignedPlatformView />
    </PageLayout>
  );
}
