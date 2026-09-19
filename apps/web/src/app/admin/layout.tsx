import React from 'react';
import { AdminShellLayout } from '@/views/admin/AdminShellLayout';

export const metadata = {
  title: 'Stocky Admin Portal',
  description: 'Stocky Platform Administration and Multi-Tenant Management',
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <AdminShellLayout>{children}</AdminShellLayout>;
}
