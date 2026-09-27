'use client';

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PlatformWorkspaceSkeleton, type PlatformSkeletonVariant } from '@/widgets/PlatformWorkspaceSkeleton/PlatformWorkspaceSkeleton';
import { HydrationFadeWrapper } from '@/components/ui/Skeleton';

export default function SkeletonPreviewPage() {
  const searchParams = useSearchParams();
  const variantParam = (searchParams.get('variant') || 'inventory') as PlatformSkeletonVariant;
  const [variant, setVariant] = useState<PlatformSkeletonVariant>(variantParam);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    if (variantParam) setVariant(variantParam);
  }, [variantParam]);

  return (
    <div className="p-4 sm:p-6 max-w-[var(--stocky-page-max-width)] mx-auto">
      {/* Dev Switcher Bar */}
      <div className="mb-6 p-3 bg-stocky-bg-widget border border-stocky-border-subtle rounded-2xl shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold uppercase text-stocky-text-sub">Variant:</span>
          {(['dashboard', 'inventory', 'attendance', 'calendar', 'transfers', 'suppliers', 'locations', 'team', 'tasks', 'notifications'] as PlatformSkeletonVariant[]).map((v) => (
            <button
              key={v}
              data-variant={v}
              onClick={() => setVariant(v)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                variant === v
                  ? 'bg-stocky-primary text-stocky-text-inverse border-stocky-primary shadow-xs'
                  : 'bg-stocky-bg-global text-stocky-text-sub border-stocky-border-subtle hover:border-stocky-border-default'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsLoading(!isLoading)}
            className="text-xs font-medium px-3.5 py-1.5 rounded-full bg-stocky-bg-global border border-stocky-border-subtle hover:bg-stocky-border-subtle/50 text-stocky-text-main"
          >
            Toggle Hydration ({isLoading ? 'Loading' : 'Hydrated'})
          </button>
        </div>
      </div>

      {/* Cross-fade wrapper preview */}
      <HydrationFadeWrapper
        isLoading={isLoading}
        skeleton={<PlatformWorkspaceSkeleton variant={variant} />}
      >
        <div className="bg-stocky-bg-widget border border-stocky-border-subtle rounded-2xl p-6 shadow-card flex flex-col gap-4">
          <h2 className="text-lg font-medium text-stocky-text-main">Hydrated Content Resolved</h2>
          <p className="text-sm text-stocky-text-sub">
            The data has loaded smoothly with Framer Motion cross-fade transition and zero layout shift.
          </p>
        </div>
      </HydrationFadeWrapper>
    </div>
  );
}
