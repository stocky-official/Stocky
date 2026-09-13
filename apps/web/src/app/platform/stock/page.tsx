'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Legacy route redirect: /platform/stock -> /platform/inventory
 */
export default function StockRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/platform/inventory');
  }, [router]);

  return null;
}
