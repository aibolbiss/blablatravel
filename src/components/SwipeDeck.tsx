'use client';
import { useRef, useState } from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter, Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';
import { SwipeCandidate } from '@/lib/types';
import { parseListingTitle } from '@/lib/parseListingTitle';
import { tourismEmojis } from '@/lib/travel-data';
import { getCityLabel } from '@/lib/geo-labels';
import { startNavLoading } from '@/lib/navLoading';

const SWIPE_THRESHOLD = 100;
const EXIT_DISTANCE = 700;
const EXIT_DURATION_MS = 420;

type Drag = { x: number; active: boolean };
type Exit = 'left' | 'right' | null;

function SwipeCard({
  candidate, locale, drag, exit, onPointerDown, onPointerMove, onPointerUp,
}: {
  candidate: SwipeCandidate;
  locale: string;
  drag: Drag;
  exit: Exit;
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
}) {
  const { tourismType } = parseListingTitle(candidate.title);
  const p = candidate.profiles;
  const translateX = exit === 'left' ? -EXIT_DISTANCE : exit === 'right' ? EXIT_DISTANCE : drag.x;
  const rotate = translateX / 20;

  // Во время полёта карточки (exit) заливка держится на полной силе весь
  // путь — раньше цвет считался только от drag.x, из-за чего при быстром
  // свайпе (или клике по кнопке ❌/❤️, где drag.x вообще 0) заливку не
  // успевали заметить или она вообще не появлялась.
  const magnitude = exit ? 1 : Math.min(Math.abs(drag.x) / SWIPE_THRESHOLD, 1);
  const direction = exit ?? (drag.x > 0 ? 'right' : drag.x < 0 ? 'left' : null);
  const tintColor = direction === 'right' ? '52 199 89' : direction === 'left' ? '239 68 68' : '0 0 0';

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className="absolute inset-0 touch-none select-none overflow-hidden rounded-3xl shadow-2xl"
      style={{
        transform: `translateX(${translateX}px) rotate(${rotate}deg)`,
        transition: drag.active ? 'none' : `transform ${EXIT_DURATION_MS}ms ease`,
        backgroundImage: candidate.photo_url ? `url('${candidate.photo_url}')` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: '#1a211f',
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `linear-gradient(160deg, rgb(${tintColor} / ${0.75 * magnitude}) 0%, rgb(${tintColor} / ${0.25 * magnitude}) 55%, rgb(${tintColor} / ${0.55 * magnitude}) 100%)`,
        }}
      />

      {direction && (
        <div
          className={`pointer-events-none absolute top-10 rounded-xl border-[5px] px-4 py-1.5 text-3xl font-black uppercase ${
            direction === 'right'
              ? 'right-6 rotate-[14deg] border-white text-white'
              : 'left-6 rotate-[-14deg] border-white text-white'
          }`}
          style={{ opacity: magnitude }}
        >
          {direction === 'right' ? '❤️' : '✕'}
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-5 pt-16 text-white">
        <div className="flex items-center gap-2 text-lg font-bold">
          {p.name}
          {p.gender && <span>{p.gender === 'male' ? '♂️' : p.gender === 'female' ? '♀️' : ''}</span>}
        </div>
        <p className="mt-1 text-sm text-white/90">
          🛫 {getCityLabel(candidate.city, locale)}
          {candidate.to_city ? ` → ${getCityLabel(candidate.to_city, locale)}` : ''}
        </p>
        {tourismType && (
          <p className="mt-1 text-sm text-white/80">{tourismEmojis[tourismType]}</p>
        )}
        {candidate.description && (
          <p className="mt-2 line-clamp-2 text-sm text-white/70">{candidate.description}</p>
        )}
      </div>
    </div>
  );
}

export default function SwipeDeck({
  candidates, hasOwnListing,
}: {
  candidates: SwipeCandidate[];
  hasOwnListing: boolean;
}) {
  const t = useTranslations('love');
  const locale = useLocale();
  const router = useRouter();
  const [queue, setQueue] = useState(candidates);
  const [drag, setDrag] = useState<Drag>({ x: 0, active: false });
  const [exit, setExit] = useState<Exit>(null);
  const [busy, setBusy] = useState(false);
  const [match, setMatch] = useState<SwipeCandidate | null>(null);
  const [startingChat, setStartingChat] = useState(false);
  const startXRef = useRef(0);

  const top = queue[0];
  const next = queue[1];

  async function commit(liked: boolean, dir: 'left' | 'right') {
    if (busy || !top) return;
    setBusy(true);
    setExit(dir);
    const target = top;
    const supabase = createClient();
    const { data: matched, error } = await supabase.rpc('record_swipe', {
      p_to_user_id: target.user_id,
      p_listing_id: target.id,
      p_liked: liked,
    });
    setTimeout(() => {
      setQueue((prev) => prev.slice(1));
      setExit(null);
      setDrag({ x: 0, active: false });
      setBusy(false);
      if (!error && matched) setMatch(target);
    }, EXIT_DURATION_MS);
  }

  function onPointerDown(e: React.PointerEvent) {
    if (busy) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    startXRef.current = e.clientX;
    setDrag({ x: 0, active: true });
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!drag.active) return;
    setDrag({ x: e.clientX - startXRef.current, active: true });
  }
  function onPointerUp() {
    if (!drag.active) return;
    if (drag.x > SWIPE_THRESHOLD) commit(true, 'right');
    else if (drag.x < -SWIPE_THRESHOLD) commit(false, 'left');
    else setDrag({ x: 0, active: false });
  }

  async function messageMatch() {
    if (!match) return;
    setStartingChat(true);
    const supabase = createClient();
    const { data, error } = await supabase.rpc('get_or_create_conversation', { other_user: match.user_id });
    setStartingChat(false);
    if (error) return;
    startNavLoading();
    router.push(`/chat/${data}`);
  }

  return (
    <div className="mx-auto max-w-md">
      {!hasOwnListing && (
        <p className="mb-3 rounded-xl bg-route-light px-4 py-2.5 text-xs text-route">
          {t('noOwnListingHint')}
        </p>
      )}

      <div className="relative h-[68vh] w-full overflow-hidden">
        {!top && (
          <div className="flex h-full flex-col items-center justify-center rounded-3xl border border-dashed border-line bg-surface p-8 text-center">
            <p className="text-3xl">💔</p>
            <p className="mt-3 font-semibold">{t('emptyTitle')}</p>
            <p className="mt-1 text-sm text-mut">{t('emptyText')}</p>
          </div>
        )}
        {next && (
          <div
            className="absolute inset-0 scale-[0.96] overflow-hidden rounded-3xl opacity-70 shadow-xl"
            style={{
              backgroundImage: next.photo_url ? `url('${next.photo_url}')` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundColor: '#1a211f',
            }}
          />
        )}
        {top && (
          <SwipeCard
            candidate={top}
            locale={locale}
            drag={drag}
            exit={exit}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          />
        )}
      </div>

      {top && (
        <div className="mt-5 flex items-center justify-center gap-6">
          <button
            type="button"
            aria-label={t('dislike')}
            disabled={busy}
            onClick={() => commit(false, 'left')}
            className="flex h-14 w-14 items-center justify-center rounded-full border border-line bg-surface text-2xl shadow-card transition hover:scale-105 disabled:opacity-50"
          >
            ✕
          </button>
          <button
            type="button"
            aria-label={t('like')}
            disabled={busy}
            onClick={() => commit(true, 'right')}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-route text-2xl text-white shadow-card transition hover:scale-105 disabled:opacity-50"
          >
            ❤️
          </button>
        </div>
      )}

      {match && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-black/80 p-6 text-center text-white">
          {[...Array(8)].map((_, i) => (
            <span
              key={i}
              className="pointer-events-none absolute bottom-0 animate-float-heart text-3xl"
              style={{ left: `${8 + i * 11}%`, animationDelay: `${i * 0.12}s` }}
            >
              ❤️
            </span>
          ))}

          <div className="relative h-28 w-28 overflow-hidden rounded-full ring-4 ring-white">
            {match.profiles.avatar_url ? (
              <Image src={match.profiles.avatar_url} alt="" fill sizes="112px" className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-route text-4xl">🙂</div>
            )}
          </div>

          <h2 className="mt-6 font-display text-3xl font-bold">{t('matchTitle')}</h2>
          <p className="mt-2 text-white/80">{t('matchSubtitle', { name: match.profiles.name })}</p>

          <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
            <button className="btn-primary" onClick={messageMatch} disabled={startingChat}>
              {startingChat ? t('opening') : t('matchMessage')}
            </button>
            <button
              className="rounded-xl border border-white/30 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              onClick={() => setMatch(null)}
            >
              {t('matchContinue')}
            </button>
          </div>
        </div>
      )}

      {queue.length === 0 && !hasOwnListing && (
        <Link href="/cabinet/listings/new" className="btn-primary mt-4 block text-center">
          {t('createListing')}
        </Link>
      )}
    </div>
  );
}
