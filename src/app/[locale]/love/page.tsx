import { createClient } from '@/lib/supabase/server';
import { getUserId } from '@/lib/auth';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import SwipeDeck from '@/components/SwipeDeck';
import { SwipeCandidate } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function LovePage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  const t = await getTranslations('love');
  const userId = getUserId();

  if (!userId) {
    return (
      <div className="py-4 md:py-10">
        <h1 className="font-display text-2xl font-bold">{t('heading')}</h1>
        <div className="mt-6 rounded-2xl border border-dashed border-line bg-surface p-12 text-center">
          <p className="font-semibold">{t('needLogin')}</p>
          <Link href="/auth/login" className="btn-primary mt-5">{t('login')}</Link>
        </div>
      </div>
    );
  }

  const supabase = createClient();

  const [{ data: myListings }, { data: swiped }, { data: candidates }] = await Promise.all([
    supabase.from('listings').select('id').eq('user_id', userId).eq('is_active', true).limit(1),
    supabase.from('swipes').select('to_user_id').eq('from_user_id', userId),
    supabase
      .from('listings')
      .select('id, title, description, city, to_city, budget, date_from, date_to, photo_url, user_id, profiles!listings_user_id_fkey(name, avatar_url, gender)')
      .eq('is_active', true)
      .neq('user_id', userId)
      .not('photo_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(60),
  ]);

  const excluded = new Set((swiped ?? []).map((s) => s.to_user_id));
  const seen = new Set<string>();
  const deck: SwipeCandidate[] = [];
  for (const c of (candidates ?? []) as unknown as SwipeCandidate[]) {
    if (excluded.has(c.user_id) || seen.has(c.user_id) || !c.profiles) continue;
    seen.add(c.user_id);
    deck.push(c);
  }

  return (
    <div className="py-4 md:py-6">
      <div className="hidden items-center justify-center rounded-2xl border border-dashed border-line bg-surface p-16 text-center md:flex md:flex-col">
        <p className="text-3xl">📱</p>
        <p className="mt-3 font-semibold">{t('mobileOnly')}</p>
      </div>

      <div className="md:hidden">
        <SwipeDeck candidates={deck} hasOwnListing={!!myListings?.length} />
      </div>
    </div>
  );
}
