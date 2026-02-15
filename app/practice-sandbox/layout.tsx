import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Practice Sandbox',
  description: 'Test the practice problem generator with custom prompts and student interests.',
};

export default function PracticeSandboxLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
