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
      <body className="bg-slate-50 text-slate-900 min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col items-center gap-4 text-center">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center text-xl font-bold">
            !
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Application Error</h2>
            <p className="text-xs text-slate-600 mt-1">
              {error?.message || 'A critical error occurred while rendering the page.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => reset()}
            className="h-9 px-4 rounded-full bg-blue-600 text-white text-xs font-medium cursor-pointer hover:bg-blue-700 transition-colors"
          >
            Reload application
          </button>
        </div>
      </body>
    </html>
  );
}
