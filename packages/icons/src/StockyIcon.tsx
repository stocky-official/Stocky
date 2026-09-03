import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { ICON_SIZE_MAP, type StockyIconProps } from './types';

export interface BaseIconWrapperProps extends StockyIconProps {
  icon: any;
}

export function StockyIcon({
  icon: IconComponent,
  size = 'md',
  className = '',
  strokeWidth = 2,
  ...rest
}: BaseIconWrapperProps) {
  const pixelSize = typeof size === 'number' ? size : ICON_SIZE_MAP[size] || 20;

  return (
    <IconComponent
      size={pixelSize}
      strokeWidth={strokeWidth}
      className={`shrink-0 inline-block align-middle ${className}`}
      {...rest}
    />
  );
};
