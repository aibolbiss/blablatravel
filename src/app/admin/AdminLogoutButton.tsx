'use client';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AdminLogoutButton() {
  const router = useRouter();
  const supabase = createClient();
  return (
    <button
      className="text-sm text-white/70 hover:text-white"
      onClick={async () => {
        await supabase.auth.signOut();
        router.push('/admin/login');
        router.refresh();
      }}
    >
      Выйти
    </button>
  );
}
