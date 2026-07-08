'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { uploadPhoto } from '@/lib/upload';
import MapView from '@/components/MapViewDynamic';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useRouter } from 'next/navigation';
import { companionTypes, companionTypesSearch, companionEmojis, tourismTypes, sortedDestinationCountries, destinationCountries, destinationCities, type CompanionType, type TourismType } from '@/lib/travel-data';
import { Profile, GENDER_LABEL } from '@/lib/types';

export default function NewListingPage() {
  const supabase = createClient();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [myCompanionType, setMyCompanionType] = useState('');
  const [companionType, setCompanionType] = useState('');
  const [description, setDescription] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [toCountry, setToCountry] = useState('');
  const [toCity, setToCity] = useState('');
  const [tourismType, setTourismType] = useState('');
  const [budget, setBudget] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [showOnMap, setShowOnMap] = useState(false);
  const [coords, setCoords] = useState<[number, number] | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(data);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cities = country ? (destinationCities[country] ?? []) : [];
  const toCities = toCountry ? (destinationCities[toCountry] ?? []) : [];

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Необходимо авторизоваться');
        setUploading(false);
        return;
      }
      const url = await uploadPhoto(file, user.id);
      setPhotoUrl(url);
    } catch (err: any) {
      setError('Ошибка загрузки фото: ' + (err?.message || 'неизвестная ошибка'));
    } finally {
      setUploading(false);
    }
  }

  async function submit() {
    setBusy(true); setError('');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth/login'); return; }

    // Создаем заголовок автоматически
    const myEmoji = myCompanionType ? companionEmojis[myCompanionType as CompanionType] : '';
    const searchEmoji = companionType ? companionEmojis[companionType as CompanionType] : '';
    const tourismLabel = tourismType ? ' → ' + tourismTypes[tourismType as TourismType] : '';
    const title = `Я ${myEmoji} ищу ${searchEmoji}${tourismLabel}`.trim();

    const { data, error } = await supabase.from('listings').insert({
      user_id: user.id,
      title,
      description,
      country,
      city,
      to_country: toCountry,
      to_city: toCity,
      budget: budget ? Number(budget) : null,
      date_from: dateFrom || null,
      date_to: dateTo || null,
      photo_url: photoUrl,
      show_on_map: showOnMap,
      lat: coords?.[0] ?? null,
      lng: coords?.[1] ?? null,
    }).select('id').single();

    setBusy(false);
    if (error) return setError(error.message);
    router.push(`/listing/${data.id}`);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-7xl py-4 md:py-10 px-4">
      <h1 className="font-display text-2xl font-bold">Новое объявление</h1>
      <p className="mt-1 text-sm text-mut">Расскажите о поездке — и попутчики вас найдут.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Левая колонка - форма */}
        <div className="lg:col-span-2 space-y-5 rounded-2xl border border-line bg-white p-6 shadow-card">
          <div>
            <label className="label">Кто я *</label>
            <select className="input" required value={myCompanionType} onChange={(e) => setMyCompanionType(e.target.value)}>
              <option value="">Выберите кто вы</option>
              {Object.entries(companionTypes).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Кого я ищу *</label>
            <select className="input" required value={companionType} onChange={(e) => setCompanionType(e.target.value)}>
              <option value="">Выберите кого ищете</option>
              {Object.entries(companionTypesSearch).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Откуда — страна *</label>
            <select className="input" required value={country} onChange={(e) => {
              setCountry(e.target.value);
              setCity('');
            }}>
              <option value="">Выберите страну</option>
              {sortedDestinationCountries.map((c) => (
                <option key={c} value={c}>{destinationCountries[c].flag} {c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Откуда — город *</label>
            <select className="input" required value={city} onChange={(e) => setCity(e.target.value)} disabled={!country}>
              <option value="">Выберите город</option>
              {cities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Куда — страна *</label>
            <select className="input" required value={toCountry} onChange={(e) => {
              setToCountry(e.target.value);
              setToCity('');
            }}>
              <option value="">Выберите страну</option>
              {sortedDestinationCountries.map((c) => (
                <option key={c} value={c}>{destinationCountries[c].flag} {c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Куда — город *</label>
            <select className="input" required value={toCity} onChange={(e) => setToCity(e.target.value)} disabled={!toCountry}>
              <option value="">Выберите город</option>
              {toCities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Тип отдыха *</label>
            <select className="input" required value={tourismType} onChange={(e) => setTourismType(e.target.value)}>
              <option value="">Выберите тип отдыха</option>
              {Object.entries(tourismTypes).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Бюджет, $ (на человека)</label>
            <input className="input" type="number" min={0} value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="800" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">С даты *</label>
            <input className="input" type="date" required value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div>
            <label className="label">По дату *</label>
            <input className="input" type="date" required min={dateFrom} value={dateTo} onChange={(e) => setDateTo(e.target.value)} disabled={!dateFrom} />
          </div>
        </div>

        <div>
          <label className="label">Описание *</label>
          <textarea className="input min-h-36" required value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="Маршрут, планы, что ожидаете от попутчика…" />
        </div>

        <div>
          <label className="label">Фотография *</label>
          <div className="flex items-center gap-4">
            {photoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl} alt="" className="h-20 w-28 rounded-lg object-cover" />
            )}
            <label className="btn-ghost cursor-pointer">
              {uploading ? 'Загружаем…' : photoUrl ? 'Заменить фото' : 'Загрузить фото'}
              <input type="file" accept="image/*" className="hidden" onChange={onPhoto} disabled={uploading} />
            </label>
          </div>
        </div>

        <label className="flex items-center gap-3 text-sm font-medium">
          <input type="checkbox" className="h-4 w-4 accent-route" checked={showOnMap}
            onChange={(e) => setShowOnMap(e.target.checked)} />
          Отметить локацию где можем встретиться
        </label>
        {showOnMap && coords && (
          <p className="text-sm text-route font-medium">✓ Локация выбрана: {coords[0].toFixed(2)}, {coords[1].toFixed(2)}</p>
        )}

        {showOnMap && (
          <div className="h-64 overflow-hidden rounded-xl border border-line">
            <MapView
              markers={coords ? [{ id: 'pin', lat: coords[0], lng: coords[1], title: companionType ? companionEmojis[companionType as CompanionType] : 'Здесь', href: '#' }] : []}
              center={coords ?? undefined}
              zoom={coords ? 8 : 4}
              onPick={(lat, lng) => setCoords([lat, lng])}
            />
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn-primary w-full text-center" onClick={submit}
          disabled={busy || !companionType || !country || !city || !toCountry || !toCity || !tourismType || !dateFrom || !dateTo || !description || !photoUrl}>
          {busy ? 'Публикуем…' : 'Опубликовать объявление'}
        </button>
        </div>

        {/* Правая колонка - информация профиля */}
        {profile && (
          <div className="rounded-2xl border border-line bg-white p-6 shadow-card h-fit">
            <div className="space-y-4">
              {/* Фото */}
              <div className="overflow-hidden rounded-xl bg-route-light">
                {profile.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.avatar_url} alt={profile.name} className="w-full h-48 object-cover" />
                ) : (
                  <div className="flex h-48 items-center justify-center text-5xl bg-route-light">🙂</div>
                )}
              </div>

              {/* Имя */}
              <div>
                <p className="text-xs text-mut uppercase font-medium">Имя</p>
                <p className="font-semibold text-sm mt-1">{profile.name}</p>
              </div>

              {/* Пол */}
              {profile.gender && (
                <div>
                  <p className="text-xs text-mut uppercase font-medium">Пол</p>
                  <p className="font-semibold text-sm mt-1">{GENDER_LABEL[profile.gender as keyof typeof GENDER_LABEL]}</p>
                </div>
              )}

              {/* Страна */}
              {profile.country && (
                <div>
                  <p className="text-xs text-mut uppercase font-medium">Страна</p>
                  <p className="font-semibold text-sm mt-1">{profile.country}</p>
                </div>
              )}

              {/* Город */}
              {profile.city && (
                <div>
                  <p className="text-xs text-mut uppercase font-medium">Город</p>
                  <p className="font-semibold text-sm mt-1">{profile.city}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {(busy || uploading) && <LoadingSpinner />}
    </div>
  );
}
