import React from 'react';
import { StockyLogoIcon } from '@stocky/icons';

export default function RootLoading() {
  return (
    <div
      style={{ backgroundColor: '#D8FF00' }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center select-none"
    >
      <div className="flex flex-col items-center gap-4 animate-pulse">
        <div className="w-20 h-20 flex items-center justify-center text-[#11120F]">
          <StockyLogoIcon size={72} />
        </div>
        <span className="text-sm font-semibold tracking-wider uppercase text-[#11120F]/80">
          Stocky
        </span>
      </div>
    </div>
  );
}
