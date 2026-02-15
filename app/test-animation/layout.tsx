import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Animation Test',
  description: 'Test Manim animation generation for educational visualizations.',
};

export default function TestAnimationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
