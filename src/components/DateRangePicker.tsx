'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import RequiredMark from './RequiredMark';

function toDateStr(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function fromDateStr(s: string) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// Понедельник — первый день недели, единообразно для всех языков сайта.
function getWeekdayLabels(locale: string) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(2023, 0, 2 + i); // 2 января 2023 — понедельник
    return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(d);
  });
}

function getMonthDays(viewMonth: Date) {
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  // 0=вс..6=сб → сдвигаем так, чтобы понедельник был 0
  const leadingBlanks = (firstOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < leadingBlanks; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

type Field = 'from' | 'to';

function MiniCalendar({
  locale,
  viewMonth,
  setViewMonth,
  fromDate,
  toDate,
  minDate,
  onPick,
}: {
  locale: string;
  viewMonth: Date;
  setViewMonth: (d: Date) => void;
  fromDate: Date | null;
  toDate: Date | null;
  minDate: Date | null;
  onPick: (day: Date) => void;
}) {
  const weekdayLabels = useMemo(() => getWeekdayLabels(locale), [locale]);
  const monthLabel = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(viewMonth),
    [locale, viewMonth]
  );
  const cells = useMemo(() => getMonthDays(viewMonth), [viewMonth]);
  const today = useMemo(() => startOfDay(new Date()), []);

  return (
    <div className="absolute left-0 top-full z-20 mt-2 w-full max-w-xs rounded-2xl border border-line bg-surface p-4 shadow-card sm:w-80">
      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label="Previous month"
          className="flex h-8 w-8 items-center justify-center rounded-full text-mut transition hover:bg-route-light hover:text-route"
          onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
        >
          ‹
        </button>
        <span className="text-sm font-semibold capitalize">{monthLabel}</span>
        <button
          type="button"
          aria-label="Next month"
          className="flex h-8 w-8 items-center justify-center rounded-full text-mut transition hover:bg-route-light hover:text-route"
          onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
        >
          ›
        </button>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-y-1 text-center text-xs font-medium text-mut">
        {weekdayLabels.map((w, i) => (
          <span key={i} className="capitalize">{w}</span>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-y-1 text-center text-sm">
        {cells.map((day, i) => {
          if (!day) return <span key={i} />;
          const isFrom = fromDate && isSameDay(day, fromDate);
          const isTo = toDate && isSameDay(day, toDate);
          const isEndpoint = isFrom || isTo;
          const inRange = fromDate && toDate && day > fromDate && day < toDate;
          const isToday = isSameDay(day, today);
          const isDisabled = minDate ? day < minDate : false;

          if (isDisabled) {
            return (
              <span key={i} className="mx-auto flex h-8 w-8 cursor-not-allowed items-center justify-center rounded-full text-mut/30">
                {day.getDate()}
              </span>
            );
          }

          return (
            <button
              key={i}
              type="button"
              onClick={() => onPick(day)}
              className={[
                'mx-auto flex h-8 w-8 items-center justify-center rounded-full transition',
                isEndpoint ? 'bg-route font-semibold text-white' : '',
                !isEndpoint && inRange ? 'bg-route-light text-route' : '',
                !isEndpoint && !inRange ? 'hover:bg-route-light' : '',
                !isEndpoint && isToday ? 'ring-1 ring-inset ring-route' : '',
              ].filter(Boolean).join(' ')}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function DateRangePicker({
  locale,
  dateFrom,
  dateTo,
  onChange,
  fromLabel,
  toLabel,
  showLabels = false,
  required = false,
}: {
  locale: string;
  dateFrom: string;
  dateTo: string;
  onChange: (dateFrom: string, dateTo: string) => void;
  fromLabel: string;
  toLabel: string;
  showLabels?: boolean;
  required?: boolean;
}) {
  const [openField, setOpenField] = useState<Field | null>(null);
  const [viewMonth, setViewMonth] = useState(() => startOfDay(new Date()));
  const rootRef = useRef<HTMLDivElement>(null);

  const fromDate = dateFrom ? fromDateStr(dateFrom) : null;
  const toDate = dateTo ? fromDateStr(dateTo) : null;

  useEffect(() => {
    if (!openField) return;
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpenField(null);
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpenField(null);
    }
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEscape);
    };
  }, [openField]);

  function openFrom() {
    setViewMonth(startOfDay(fromDate ?? new Date()));
    setOpenField('from');
  }

  function openTo() {
    setViewMonth(startOfDay(toDate ?? fromDate ?? new Date()));
    setOpenField('to');
  }

  function pickFrom(day: Date) {
    const newFrom = toDateStr(day);
    // Если уже выбранная "до" стала раньше новой "от" — сбрасываем её,
    // чтобы не остался невалидный диапазон.
    const newTo = toDate && toDate < day ? '' : dateTo;
    onChange(newFrom, newTo);
    setOpenField(null);
  }

  function pickTo(day: Date) {
    onChange(dateFrom, toDateStr(day));
    setOpenField(null);
  }

  const formatLabel = (s: string) => (s ? fromDateStr(s).toLocaleDateString(locale) : '');

  return (
    <div ref={rootRef} className="relative grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="relative min-w-0">
        {showLabels && <label className="label">{fromLabel}<RequiredMark /></label>}
        <button
          type="button"
          className={`input w-full min-w-0 text-left ${required && !dateFrom ? 'border-red-400 ring-1 ring-red-200' : ''}`}
          onClick={() => (openField === 'from' ? setOpenField(null) : openFrom())}
        >
          <span className={dateFrom ? '' : 'text-mut'}>{dateFrom ? formatLabel(dateFrom) : fromLabel}</span>
        </button>
        {openField === 'from' && (
          <MiniCalendar
            locale={locale}
            viewMonth={viewMonth}
            setViewMonth={setViewMonth}
            fromDate={fromDate}
            toDate={toDate}
            minDate={null}
            onPick={pickFrom}
          />
        )}
      </div>
      <div className="relative min-w-0">
        {showLabels && <label className="label">{toLabel}<RequiredMark /></label>}
        <button
          type="button"
          className={`input w-full min-w-0 text-left ${required && !dateTo ? 'border-red-400 ring-1 ring-red-200' : ''}`}
          onClick={() => (openField === 'to' ? setOpenField(null) : openTo())}
        >
          <span className={dateTo ? '' : 'text-mut'}>{dateTo ? formatLabel(dateTo) : toLabel}</span>
        </button>
        {openField === 'to' && (
          <MiniCalendar
            locale={locale}
            viewMonth={viewMonth}
            setViewMonth={setViewMonth}
            fromDate={fromDate}
            toDate={toDate}
            minDate={fromDate}
            onPick={pickTo}
          />
        )}
      </div>
    </div>
  );
}
