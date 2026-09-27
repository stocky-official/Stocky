import React from 'react';
import { StockyLogoIcon } from '@stocky/icons';

export default function RootLoading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-stocky-accent select-none">
      <div className="flex flex-col items-center gap-4 animate-pulse">
        <div className="w-20 h-20 flex items-center justify-center text-stocky-text-main">
          <StockyLogoIcon size={72} />
        </div>
        <span className="text-sm font-semibold tracking-wider uppercase text-stocky-text-main opacity-80">
          Stocky
        </span>
      </div>
    </div>
  );
}
