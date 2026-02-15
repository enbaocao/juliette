'use client';

import { createClient } from '@/lib/supabase/client';

export default function SignOutButton() {
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="text-sm text-gray-500 hover:text-gray-700 underline"
    >
      Sign out
    </button>
  );
}
