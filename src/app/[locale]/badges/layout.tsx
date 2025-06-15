import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Insignias',
};

export default function BadgesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}