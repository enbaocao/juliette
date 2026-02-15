import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Juliette in Zoom',
  description:
    'Ask AI questions about your class video during Zoom meetings. Get instant explanations, practice problems, or animated visualizations.',
};

export default function ZoomPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
