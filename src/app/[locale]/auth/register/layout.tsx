import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Registrarse',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}