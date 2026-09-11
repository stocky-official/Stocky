'use client';

import React, { useEffect } from 'react';

export default function PlatformError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Platform Workspace Error:', error);
  }, [error]);

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="max-w-md w-full bg-white border border-stocky-border-subtle rounded-2xl p-6 shadow-sm flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center text-xl font-bold">
          !
        </div>
        <div>
          <h2 className="text-base font-medium text-stocky-text-main">Unable to load this workspace</h2>
          <p className="text-xs text-stocky-text-sub mt-1">
            {error?.message || 'We encountered an error while loading your data.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => reset()}
          className="h-9 px-4 rounded-full bg-stocky-primary text-white text-xs font-medium cursor-pointer hover:opacity-90 transition-opacity"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
