import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Panel de Administración',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}