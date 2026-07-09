'use client';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from '@/i18n/navigation';

export default function LogoutButton() {
  const t = useTranslations('nav');
  const router = useRouter();
  const supabase = createClient();
  return (
    <button
      className="text-sm text-mut hover:text-ink"
      onClick={async () => {
        await supabase.auth.signOut();
        router.push('/');
        router.refresh();
      }}
    >
      {t('logout')}
    </button>
  );
}
