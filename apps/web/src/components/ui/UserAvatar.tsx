'use client';

import React, { useState, useEffect } from 'react';

export interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  email?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'subtle' | 'solid' | 'amber';
  className?: string;
  imgClassName?: string;
  fallbackClassName?: string;
  alt?: string;
}

const SIZE_STYLES: Record<string, { container: string; img: string }> = {
  xs: {
    container: 'h-6 w-6 text-[9px]',
    img: 'h-6 w-6',
  },
  sm: {
    container: 'h-7 w-7 text-[10px]',
    img: 'h-7 w-7',
  },
  md: {
    container: 'h-8 w-8 text-xs',
    img: 'h-8 w-8',
  },
  lg: {
    container: 'h-9 w-9 text-xs',
    img: 'h-9 w-9',
  },
  xl: {
    container: 'h-10 w-10 text-sm',
    img: 'h-10 w-10',
  },
};

const VARIANT_STYLES: Record<string, string> = {
  subtle: 'bg-stocky-primary/10 text-stocky-primary font-semibold',
  solid: 'bg-stocky-primary text-stocky-text-inverse font-semibold',
  amber: 'bg-stocky-status-warning-bg text-stocky-status-warning-fg border border-stocky-status-warning-border font-semibold',
};

/**
 * Extracts 1-2 uppercase initials from a name or email address.
 */
export function getInitials(name?: string | null, email?: string | null): string {
  const raw = (name && name.trim()) || (email && email.trim()) || '';
  if (!raw) return '?';

  // If email without an explicit name, strip domain
  const text = raw.includes('@') && !name ? raw.split('@')[0] : raw;
  const parts = text.split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/**
 * Checks if a string is a potentially valid image URL.
 */
function isValidImageUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined' || trimmed === '""' || trimmed === "''") {
    return false;
  }
  return true;
}

/**
 * Robust UserAvatar component that:
 * 1. Sets `referrerPolicy="no-referrer"` to prevent Google OAuth / CDN blocking.
 * 2. Catches image load failures with `onError` and seamlessly falls back to stylized initials.
 * 3. Sanitizes empty, null, or malformed URLs.
 */
export function UserAvatar({
  src,
  name,
  email,
  size = 'md',
  variant = 'subtle',
  className = '',
  imgClassName = '',
  fallbackClassName = '',
  alt,
}: UserAvatarProps) {
  const [hasError, setHasError] = useState(false);

  // Reset error whenever the image source changes
  useEffect(() => {
    setHasError(false);
  }, [src]);

  const validSrc = isValidImageUrl(src);
  const shouldRenderImage = validSrc && !hasError;
  const initials = getInitials(name, email);
  const sizeConfig = SIZE_STYLES[size] || SIZE_STYLES.md;
  const variantClass = VARIANT_STYLES[variant] || VARIANT_STYLES.subtle;
  const accessibleAlt = alt || name || email || 'User avatar';

  if (shouldRenderImage && src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src.trim()}
        alt={accessibleAlt}
        referrerPolicy="no-referrer"
        loading="lazy"
        onError={() => setHasError(true)}
        className={`rounded-full object-cover shrink-0 ${sizeConfig.img} ${imgClassName} ${className}`}
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-full select-none shrink-0 ${sizeConfig.container} ${variantClass} ${fallbackClassName} ${className}`}
      aria-label={accessibleAlt}
      title={name || email || undefined}
    >
      {initials}
    </div>
  );
}
