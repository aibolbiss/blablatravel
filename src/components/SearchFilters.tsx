'use client';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { companionTypeKeys, companionEmojis, tourismTypeKeys, tourismEmojis, sortedDestinationCountries, destinationCountries, destinationCities } from '@/lib/travel-data';
import { getCountryLabel, getCityLabel } from '@/lib/geo-labels';
import { startNavLoading } from '@/lib/navLoading';

export default function SearchFilters() {
  const t = useTranslations('filters');
  const tTypes = useTranslations('travelTypes');
  const locale = useLocale();
  const router = useRouter();
  const params = useSearchParams();
  const [activeTab, setActiveTab] = useState('companion');
  const [companion, setCompanion] = useState(params.get('companion') ?? '');
  const [country, setCountry] = useState(params.get('country') ?? '');
  const [city, setCity] = useState(params.get('city') ?? '');
  const [toCountry, setToCountry] = useState(params.get('to_country') ?? '');
  const [toCity, setToCity] = useState(params.get('to_city') ?? '');
  const [tourism, setTourism] = useState(params.get('tourism') ?? '');
  const [dateFrom, setDateFrom] = useState(params.get('date_from') ?? '');
  const [dateTo, setDateTo] = useState(params.get('date_to') ?? '');

  const cities = country ? (destinationCities[country] ?? []) : [];
  const toCities = toCountry ? (destinationCities[toCountry] ?? []) : [];

  function apply() {
    const p = new URLSearchParams();
    if (companion) p.set('companion', companion);
    if (country) p.set('country', country);
    if (city) p.set('city', city);
    if (toCountry) p.set('to_country', toCountry);
    if (toCity) p.set('to_city', toCity);
    if (tourism) p.set('tourism', tourism);
    if (dateFrom) p.set('date_from', dateFrom);
    if (dateTo) p.set('date_to', dateTo);
    startNavLoading();
    router.push(`/?${p.toString()}`);
  }

  function clearAll() {
    setCompanion('');
    setCountry('');
    setCity('');
    setToCountry('');
    setToCity('');
    setTourism('');
    setDateFrom('');
    setDateTo('');
    startNavLoading();
    router.push('/');
  }

  return (
    <div className="rounded-2xl border border-line bg-white shadow-card">
      {/* Tabs */}
      <div className="flex border-b border-line">
        <button
          onClick={() => setActiveTab('companion')}
          className={`flex-1 px-4 py-3 font-medium transition text-sm uppercase tracking-wider ${
            activeTab === 'companion'
              ? 'border-b-2 border-route text-route'
              : 'text-mut hover:text-ink'
          }`}
        >
          {t('whoTab')}
        </button>
        <button
          onClick={() => setActiveTab('location')}
          className={`flex-1 px-4 py-3 font-medium transition text-sm uppercase tracking-wider ${
            activeTab === 'location'
              ? 'border-b-2 border-route text-route'
              : 'text-mut hover:text-ink'
          }`}
        >
          {t('whereTab')}
        </button>
        <button
          onClick={() => setActiveTab('dates')}
          className={`flex-1 px-4 py-3 font-medium transition text-sm uppercase tracking-wider ${
            activeTab === 'dates'
              ? 'border-b-2 border-route text-route'
              : 'text-mut hover:text-ink'
          }`}
        >
          {t('datesTab')}
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Companion Tab */}
        {activeTab === 'companion' && (
          <div className="grid gap-3 sm:grid-cols-2">
            <select className="input" value={companion} onChange={(e) => setCompanion(e.target.value)}>
              <option value="">{t('anyCompanion')}</option>
              {companionTypeKeys.map((key) => (
                <option key={key} value={companionEmojis[key]}>{companionEmojis[key]} {tTypes(`companionSearch.${key}`)}</option>
              ))}
            </select>
            <select className="input" value={tourism} onChange={(e) => setTourism(e.target.value)}>
              <option value="">{t('anyTourism')}</option>
              {tourismTypeKeys.map((key) => (
                <option key={key} value={tourismEmojis[key]}>{tourismEmojis[key]} {tTypes(`tourism.${key}`)}</option>
              ))}
            </select>
          </div>
        )}

        {/* Location Tab */}
        {activeTab === 'location' && (
          <div className="grid gap-3 sm:grid-cols-2">
            <select className="input" value={country} onChange={(e) => {
              setCountry(e.target.value);
              setCity('');
            }}>
              <option value="">{t('fromCountry')}</option>
              {sortedDestinationCountries.map((c) => (
                <option key={c} value={c}>{destinationCountries[c].flag} {getCountryLabel(c, locale)}</option>
              ))}
            </select>

            <select className="input" value={city} onChange={(e) => setCity(e.target.value)} disabled={!country}>
              <option value="">{t('fromCity')}</option>
              {cities.map((c) => (
                <option key={c} value={c}>{getCityLabel(c, locale)}</option>
              ))}
            </select>

            <select className="input" value={toCountry} onChange={(e) => {
              setToCountry(e.target.value);
              setToCity('');
            }}>
              <option value="">{t('toCountry')}</option>
              {sortedDestinationCountries.map((c) => (
                <option key={c} value={c}>{destinationCountries[c].flag} {getCountryLabel(c, locale)}</option>
              ))}
            </select>

            <select className="input" value={toCity} onChange={(e) => setToCity(e.target.value)} disabled={!toCountry}>
              <option value="">{t('toCity')}</option>
              {toCities.map((c) => (
                <option key={c} value={c}>{getCityLabel(c, locale)}</option>
              ))}
            </select>
          </div>
        )}

        {/* Dates Tab */}
        {activeTab === 'dates' && (
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="input" type="date" placeholder={t('fromDate')}
              value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            <input className="input" type="date" placeholder={t('toDate')}
              value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              min={dateFrom} />
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="flex gap-3 border-t border-line p-4">
        <button
          className="flex-1 rounded-lg border border-line bg-white px-4 py-2 font-medium text-ink transition hover:bg-route-light"
          onClick={clearAll}
        >
          {t('clear')}
        </button>
        <button className="flex-1 btn-primary" onClick={apply}>
          {t('search')}
        </button>
      </div>
    </div>
  );
}
