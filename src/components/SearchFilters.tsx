'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { companionTypesSearch, companionEmojis, tourismTypes, tourismEmojis, sortedDestinationCountries, destinationCountries, destinationCities, type CompanionType, type TourismType } from '@/lib/travel-data';

export default function SearchFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const [activeTab, setActiveTab] = useState('companion');
  const [companion, setCompanion] = useState(params.get('companion') ?? '');
  const [country, setCountry] = useState(params.get('country') ?? '');
  const [city, setCity] = useState(params.get('city') ?? '');
  const [toCountry, setToCountry] = useState(params.get('to_country') ?? '');
  const [toCity, setToCity] = useState(params.get('to_city') ?? '');
  const [tourism, setTourism] = useState(params.get('tourism') ?? '');
  const [budgetMax, setBudgetMax] = useState(params.get('budget_max') ?? '');
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
    if (budgetMax) p.set('budget_max', budgetMax);
    if (dateFrom) p.set('date_from', dateFrom);
    if (dateTo) p.set('date_to', dateTo);
    router.push(`/?${p.toString()}`);
  }

  function clearAll() {
    setCompanion('');
    setCountry('');
    setCity('');
    setToCountry('');
    setToCity('');
    setTourism('');
    setBudgetMax('');
    setDateFrom('');
    setDateTo('');
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
          Кого вы ищете?
        </button>
        <button
          onClick={() => setActiveTab('location')}
          className={`flex-1 px-4 py-3 font-medium transition text-sm uppercase tracking-wider ${
            activeTab === 'location'
              ? 'border-b-2 border-route text-route'
              : 'text-mut hover:text-ink'
          }`}
        >
          Откуда - Куда
        </button>
        <button
          onClick={() => setActiveTab('dates')}
          className={`flex-1 px-4 py-3 font-medium transition text-sm uppercase tracking-wider ${
            activeTab === 'dates'
              ? 'border-b-2 border-route text-route'
              : 'text-mut hover:text-ink'
          }`}
        >
          Даты путешествия
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Companion Tab */}
        {activeTab === 'companion' && (
          <div className="space-y-3">
            <div>
              <select className="input" value={companion} onChange={(e) => setCompanion(e.target.value)}>
                <option value="">Любого попутчика</option>
                {Object.entries(companionTypesSearch).map(([key, label]) => {
                  const emoji = companionEmojis[key as CompanionType] || '';
                  return <option key={key} value={emoji}>{label}</option>;
                })}
              </select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <select className="input" value={tourism} onChange={(e) => setTourism(e.target.value)}>
                <option value="">Любой тип отдыха</option>
                {Object.entries(tourismTypes).map(([key, label]) => {
                  const emoji = tourismEmojis[key as TourismType] || '';
                  return <option key={key} value={emoji}>{label}</option>;
                })}
              </select>
              <input className="input" type="number" min={0} placeholder="Бюджет до, $"
                value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} />
            </div>
          </div>
        )}

        {/* Location Tab */}
        {activeTab === 'location' && (
          <div className="grid gap-3 sm:grid-cols-2">
            <select className="input" value={country} onChange={(e) => {
              setCountry(e.target.value);
              setCity('');
            }}>
              <option value="">Откуда - Страна</option>
              {sortedDestinationCountries.map((c) => (
                <option key={c} value={c}>{destinationCountries[c].flag} {c}</option>
              ))}
            </select>
            
            <select className="input" value={city} onChange={(e) => setCity(e.target.value)} disabled={!country}>
              <option value="">Откуда - Город</option>
              {cities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select className="input" value={toCountry} onChange={(e) => {
              setToCountry(e.target.value);
              setToCity('');
            }}>
              <option value="">Куда - Страна</option>
              {sortedDestinationCountries.map((c) => (
                <option key={c} value={c}>{destinationCountries[c].flag} {c}</option>
              ))}
            </select>
            
            <select className="input" value={toCity} onChange={(e) => setToCity(e.target.value)} disabled={!toCountry}>
              <option value="">Куда - Город</option>
              {toCities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        )}

        {/* Dates Tab */}
        {activeTab === 'dates' && (
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="input" type="date" placeholder="От даты"
              value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            <input className="input" type="date" placeholder="До даты"
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
          Очистить
        </button>
        <button className="flex-1 btn-primary" onClick={apply}>
          Найти попутчиков
        </button>
      </div>
    </div>
  );
}
