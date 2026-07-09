'use client';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';

function MapLoading() {
  const t = useTranslations('common');
  return (
    <div className="flex h-full w-full items-center justify-center bg-route-light text-sm text-mut">
      {t('loading')}
    </div>
  );
}

const MapView = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: MapLoading,
});

export default MapView;
