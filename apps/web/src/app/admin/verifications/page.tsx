import { redirect } from 'next/navigation';

export default function PlatformVerificationsPage() {
  redirect('/admin/companies?status=pending');
}
