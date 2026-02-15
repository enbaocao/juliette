import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import UserMenu from '@/components/UserMenu';

export default async function Header() {
  let user: { email?: string } | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // Supabase/auth failed - show header without user (logged-out state)
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 lg:px-14 py-4 bg-[#FAFAFC]/95 backdrop-blur-sm border-b border-gray-100">
      <Link href="/" className="flex items-center hover:opacity-90 transition-opacity gap-0">
        <Image src="/logo.png" alt="Juliette" width={56} height={56} className="flex-shrink-0" />
        <span className="font-['Souvenir',sans-serif] text-3xl font-medium text-[#1a1a1a]">
          Juliette
        </span>
      </Link>
      <div className="flex items-center gap-4">
        {user ? (
          <UserMenu email={user.email || ''} />
        ) : (
          <Link
            href="/teacher"
            className="py-2 px-4 rounded-lg text-sm font-medium text-[#1a1a1a] border border-gray-200 bg-white/80 hover:bg-white/90 hover:border-[#ffc2d1] transition-colors"
          >
            Teacher Login
          </Link>
        )}
      </div>
    </header>
  );
}
