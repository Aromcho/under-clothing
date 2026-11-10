import type { Metadata } from 'next';
import { AdminApp } from '@/components/admin/Shell';

export const metadata: Metadata = { title: { default: 'Panel', template: '%s — Panel Under' }, robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminApp>{children}</AdminApp>;
}
