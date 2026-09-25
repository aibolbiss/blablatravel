import { getTranslations } from 'next-intl/server';
import SkeletonCard from '@/components/SkeletonCard';

export default async function Loading() {
  const t = await getTranslations('common');
  return (
    <div role="status" aria-label={t('loading')} className="py-8">
      <div className="mb-8 h-10 w-2/3 animate-pulse rounded-lg bg-route-light motion-reduce:animate-none" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => <SkeletonCard key={index} />)}
      </div>
    </div>
  );
}
