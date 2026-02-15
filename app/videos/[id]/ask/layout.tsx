import { supabaseAdmin } from '@/lib/supabase-server';
import type { Metadata } from 'next';

interface LayoutProps {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { id } = await params;
  const { data: video } = await supabaseAdmin
    .from('videos')
    .select('title')
    .eq('id', id)
    .single();

  if (!video) return { title: 'Ask Questions' };
  return {
    title: `Ask Questions — ${video.title}`,
    description: `Ask AI questions about "${video.title}". Get simple explanations, personalized practice problems, or animated visualizations.`,
  };
}

export default function AskLayout({ children }: LayoutProps) {
  return children;
}
