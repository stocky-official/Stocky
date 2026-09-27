'use client';

import React, { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global Root Layout Error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-stocky-bg-subtle text-stocky-text-main min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-stocky-bg-widget border border-stocky-border-subtle rounded-2xl p-6 shadow-sm flex flex-col items-center gap-4 text-center">
          <div className="w-12 h-12 rounded-full bg-stocky-status-critical-bg text-stocky-status-critical-fg flex items-center justify-center text-xl font-bold">
            !
          </div>
          <div>
            <h2 className="text-lg font-semibold text-stocky-text-main">Application Error</h2>
            <p className="text-xs text-stocky-text-sub mt-1">
              {error?.message || 'A critical error occurred while rendering the page.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => reset()}
            className="h-9 px-4 rounded-full bg-stocky-status-info-fg text-stocky-text-inverse text-xs font-medium cursor-pointer hover:bg-stocky-status-info-fg transition-colors"
          >
            Reload application
          </button>
        </div>
      </body>
    </html>
  );
}
