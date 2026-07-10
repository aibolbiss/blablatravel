'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { uploadPhoto } from '@/lib/upload';
import MapView from '@/components/MapViewDynamic';
import DateRangePicker from '@/components/DateRangePicker';
import RequiredMark from '@/components/RequiredMark';
import LoadingSpinner from '@/components/LoadingSpinner';
import { startNavLoading } from '@/lib/navLoading';
import { useRouter } from '@/i18n/navigation';
import { useParams } from 'next/navigation';
import { companionTypeKeys, companionEmojis, tourismTypeKeys, tourismEmojis, sortedDestinationCountries, destinationCountries, destinationCities, type CompanionType, type TourismType } from '@/lib/travel-data';
import { getCountryLabel, getCityLabel } from '@/lib/geo-labels';
import { parseListingTitle } from '@/lib/parseListingTitle';

export default function EditListingPage() {
  const t = useTranslations('listingForm');
  const tMap = useTranslations('map');
  const tTypes = useTranslations('travelTypes');
  const locale = useLocale();
  const supabase = createClient();
  const router = useRouter();
  const params = useParams();
  const listingId = params.id as string;

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
  const [loading, setLoading] = useState(true);

  const cities = country ? (destinationCities[country] ?? []) : [];
  const toCities = toCountry ? (destinationCities[toCountry] ?? []) : [];

  // Load listing data
  useEffect(() => {
    async function loadListing() {
      try {
        const { data, error } = await supabase
          .from('listings')
          .select('*')
          .eq('id', listingId)
          .single();

        if (error) throw error;
        if (!data) throw new Error(t('notFound'));

        setDescription(data.description || '');

        // title — единственный надёжный источник этих трёх полей (эмодзи-
        // формат не зависит от языка интерфейса), DB-колонки companion_type/
        // tourism_type на создании объявления не заполняются.
        const parsed = parseListingTitle(data.title);
        setMyCompanionType(parsed.myType || '');
        setCompanionType(parsed.searchType || data.companion_type || '');
        setCountry(data.country || '');
        setCity(data.city || '');
        setToCountry(data.to_country || '');
        setToCity(data.to_city || '');
        setTourismType(parsed.tourismType || data.tourism_type || '');
        setBudget(data.budget ? String(data.budget) : '');
        setDateFrom(data.date_from || '');
        setDateTo(data.date_to || '');
        setPhotoUrl(data.photo_url);
        setShowOnMap(data.show_on_map || false);
        if (data.lat && data.lng) {
          setCoords([data.lat, data.lng]);
        }
      } catch (err: any) {
        setError(err?.message || t('loadError'));
      } finally {
        setLoading(false);
      }
    }

    loadListing();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId]);

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError(t('authRequired'));
        setUploading(false);
        return;
      }
      const url = await uploadPhoto(file, user.id);
      setPhotoUrl(url);
    } catch (err: any) {
      setError(t('photoUploadError', { error: err?.message || t('unknownError') }));
    } finally {
      setUploading(false);
    }
  }

  async function submit() {
    setBusy(true);
    setError('');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth/login');
      return;
    }

    // Создаем заголовок автоматически
    const myEmoji = myCompanionType ? companionEmojis[myCompanionType as CompanionType] : '';
    const searchEmoji = companionType ? companionEmojis[companionType as CompanionType] : '';
    const tourismLabel = tourismType ? ' → ' + tourismEmojis[tourismType as TourismType] : '';
    const title = `Я ${myEmoji} ищу ${searchEmoji}${tourismLabel}`.trim();

    const { error } = await supabase.from('listings')
      .update({
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
      })
      .eq('id', listingId);

    setBusy(false);
    if (error) return setError(error.message);
    startNavLoading();
    router.push('/cabinet');
    router.refresh();
  }

  if (loading) {
    return <div className="py-4 md:py-10 text-center">{t('loadingListing')}</div>;
  }

  // Подсвечиваем красным незаполненные обязательные поля, чтобы было видно,
  // что именно мешает нажать "Сохранить" — при загрузке существующего
  // объявления пустое поле не всегда очевидно как причина блокировки.
  const errClass = (val: unknown) => (!val ? 'border-red-400 ring-1 ring-red-200' : '');

  return (
    <div className="mx-auto max-w-2xl py-4 md:py-10">
      <h1 className="font-display text-2xl font-bold">{t('editTitle')}</h1>
      <p className="mt-1 text-sm text-mut">{t('editSubtitle')}</p>

      <div className="mt-6 space-y-5 rounded-2xl border border-line bg-surface p-6 shadow-card">
        <div>
          <label className="label">{t('whoAmI')}<RequiredMark /></label>
          <select className={`input ${errClass(myCompanionType)}`} required value={myCompanionType} onChange={(e) => setMyCompanionType(e.target.value)}>
            <option value="">{t('chooseWho')}</option>
            {companionTypeKeys.map((key) => (
              <option key={key} value={key}>{companionEmojis[key]} {tTypes(`companion.${key}`)}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">{t('whoSearch')}<RequiredMark /></label>
          <select className={`input ${errClass(companionType)}`} required value={companionType} onChange={(e) => setCompanionType(e.target.value)}>
            <option value="">{t('chooseWhom')}</option>
            {companionTypeKeys.map((key) => (
              <option key={key} value={key}>{companionEmojis[key]} {tTypes(`companionSearch.${key}`)}</option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">{t('fromCountry')}<RequiredMark /></label>
            <select className={`input ${errClass(country)}`} required value={country} onChange={(e) => {
              setCountry(e.target.value);
              setCity('');
            }}>
              <option value="">{t('chooseCountry')}</option>
              {sortedDestinationCountries.map((c) => (
                <option key={c} value={c}>{destinationCountries[c].flag} {getCountryLabel(c, locale)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">{t('fromCity')}<RequiredMark /></label>
            <select className={`input ${errClass(city)}`} required value={city} onChange={(e) => setCity(e.target.value)} disabled={!country}>
              <option value="">{t('chooseCity')}</option>
              {cities.map((c) => (
                <option key={c} value={c}>{getCityLabel(c, locale)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">{t('toCountry')}<RequiredMark /></label>
            <select className={`input ${errClass(toCountry)}`} required value={toCountry} onChange={(e) => {
              setToCountry(e.target.value);
              setToCity('');
            }}>
              <option value="">{t('chooseCountry')}</option>
              {sortedDestinationCountries.map((c) => (
                <option key={c} value={c}>{destinationCountries[c].flag} {getCountryLabel(c, locale)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">{t('toCity')}<RequiredMark /></label>
            <select className={`input ${errClass(toCity)}`} required value={toCity} onChange={(e) => setToCity(e.target.value)} disabled={!toCountry}>
              <option value="">{t('chooseCity')}</option>
              {toCities.map((c) => (
                <option key={c} value={c}>{getCityLabel(c, locale)}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">{t('tourismType')}<RequiredMark /></label>
            <select className={`input ${errClass(tourismType)}`} required value={tourismType} onChange={(e) => setTourismType(e.target.value)}>
              <option value="">{t('chooseTourism')}</option>
              {[...tourismTypeKeys].sort((a, b) => tTypes(`tourism.${a}`).localeCompare(tTypes(`tourism.${b}`), locale)).map((key) => (
                <option key={key} value={key}>{tourismEmojis[key]} {tTypes(`tourism.${key}`)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">{t('budgetLabel')}</label>
            <input className="input" type="number" min={0} value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="800" />
          </div>
        </div>

        <DateRangePicker
          locale={locale}
          dateFrom={dateFrom}
          dateTo={dateTo}
          fromLabel={t('dateFrom')}
          toLabel={t('dateTo')}
          showLabels
          required
          onChange={(from, to) => {
            setDateFrom(from);
            setDateTo(to);
          }}
        />

        <div>
          <label className="label">{t('description')}<RequiredMark /></label>
          <textarea className={`input min-h-36 ${errClass(description)}`} required value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder={t('descriptionPlaceholder')} />
        </div>

        <div>
          <label className="label">{t('photo')}<RequiredMark /></label>
          <div className="flex items-center gap-4">
            {photoUrl && (
              <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg">
                <Image src={photoUrl} alt="" fill sizes="112px" className="object-cover" />
              </div>
            )}
            <label className={`btn-ghost cursor-pointer ${errClass(photoUrl)}`}>
              {uploading ? t('uploading') : photoUrl ? t('replacePhoto') : t('uploadPhoto')}
              <input type="file" accept="image/*" className="hidden" onChange={onPhoto} disabled={uploading} />
            </label>
          </div>
        </div>

        <label className="flex items-center gap-3 text-sm font-medium">
          <input type="checkbox" className="h-4 w-4 accent-route" checked={showOnMap}
            onChange={(e) => setShowOnMap(e.target.checked)} />
          {t('markLocation')}
        </label>
        {showOnMap && coords && (
          <p className="text-sm text-route font-medium">{t('locationSelected', { lat: coords[0].toFixed(2), lng: coords[1].toFixed(2) })}</p>
        )}

        {showOnMap && (
          <div className="h-64 overflow-hidden rounded-xl border border-line">
            <MapView
              markers={coords ? [{ id: 'pin', lat: coords[0], lng: coords[1], title: companionType ? companionEmojis[companionType as CompanionType] : tMap('here'), href: '#' }] : []}
              center={coords ?? undefined}
              zoom={coords ? 8 : 4}
              onPick={(lat, lng) => setCoords([lat, lng])}
            />
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn-primary w-full text-center" onClick={submit}
          disabled={busy || !myCompanionType || !companionType || !country || !city || !toCountry || !toCity || !tourismType || !dateFrom || !dateTo || !description || !photoUrl}>
          {busy ? t('saving') : t('saveChanges')}
        </button>
      </div>
      {(busy || uploading) && <LoadingSpinner />}
    </div>
  );
}
