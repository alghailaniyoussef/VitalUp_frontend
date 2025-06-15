import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Acerca de',
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}