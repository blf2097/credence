import { unstable_setRequestLocale } from 'next-intl/server';
import { AdminPanel } from '@/components/admin-panel';

export default function AdminPage({
  params,
}: {
  params: { locale: string };
}) {
  unstable_setRequestLocale(params.locale);
  return <AdminPanel />;
}
