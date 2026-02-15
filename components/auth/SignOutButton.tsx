'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function SignOutButton() {
  const [signingOut, setSigningOut] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    setSigningOut(true);
    // scope: 'local' = instant, no server round-trip
    await supabase.auth.signOut({ scope: 'local' });
    router.push('/');
    router.refresh();
    setSigningOut(false);
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={signingOut}
      className="text-sm text-gray-500 hover:text-gray-700 underline disabled:opacity-50 disabled:cursor-wait"
    >
      {signingOut ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
