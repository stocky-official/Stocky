import type { SVGProps } from 'react';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export const ICON_SIZE_MAP: Record<IconSize, number> = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

export interface StockyIconProps extends Omit<SVGProps<SVGSVGElement>, 'size'> {
  size?: IconSize | number;
  className?: string;
  strokeWidth?: number;
}
