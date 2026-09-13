'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePlatform } from '@/views/platform/PlatformContext';

export default function ExpiringRoutePage() {
  const router = useRouter();
  const platform = usePlatform();

  useEffect(() => {
    platform.navigateToTab('stock');
  }, [platform]);

  return null;
}
