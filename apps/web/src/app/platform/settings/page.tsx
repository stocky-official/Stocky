'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePlatform } from '@/views/platform/PlatformContext';
import { PlatformWorkspaceSkeleton } from '@/widgets';

export default function SettingsRoutePage() {
  const router = useRouter();
  const platform = usePlatform();

  useEffect(() => {
    const target = platform.tenantPrefix === '/platform'
      ? '/platform/locations'
      : `${platform.tenantPrefix}/locations`;
    router.replace(target);
  }, [router, platform.tenantPrefix]);

  return <PlatformWorkspaceSkeleton variant="stock" />;
}

