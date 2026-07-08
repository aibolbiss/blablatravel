'use client';
import dynamic from 'next/dynamic';

const MapView = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-route-light text-sm text-mut">
      Загружаем карту…
    </div>
  ),
});

export default MapView;
