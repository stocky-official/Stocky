'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App Router Unhandled Error:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center bg-stocky-bg-global px-4 text-center">
      <div className="max-w-md w-full bg-stocky-bg-widget border border-stocky-border-subtle rounded-2xl p-6 shadow-sm flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-stocky-status-critical-bg text-stocky-status-critical-fg flex items-center justify-center text-xl font-bold">
          !
        </div>
        <div>
          <h2 className="text-lg font-medium text-stocky-text-main">Something went wrong</h2>
          <p className="text-xs text-stocky-text-sub mt-1">
            {error?.message || 'An unexpected error occurred while loading this page.'}
          </p>
        </div>
        <div className="flex items-center gap-2.5 mt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="h-9 px-4 rounded-full bg-stocky-primary text-stocky-text-inverse text-xs font-medium cursor-pointer hover:opacity-90 transition-opacity"
          >
            Try again
          </button>
          <Link
            href="/platform"
            className="h-9 px-4 rounded-full border border-stocky-border-subtle bg-stocky-bg-widget text-stocky-text-main text-xs font-medium inline-flex items-center justify-center hover:bg-stocky-bg-global transition-colors"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
