'use client';

import { useEffect, useState } from 'react';
import type { Settings } from '@/lib/types';
import { dayName } from '@/lib/format';

type Hours = Settings['hours'];
const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + (m || 0); };

function nowIn(tz: string) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz || 'America/Argentina/Buenos_Aires', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
  return { day, min: Number(get('hour')) * 60 + Number(get('minute')) };
}

export function openStatus(hours: Hours) {
  const { day, min } = nowIn(hours.timezone);
  const today = hours.days.find((d) => d.day === day);
  const cur = today?.ranges.find(([a, b]) => min >= toMin(a) && min < toMin(b));
  if (cur) return { open: true, day, text: `Abierto ahora · cierra a las ${cur[1]}` };
  const later = today?.ranges.find(([a]) => toMin(a) > min);
  if (later) return { open: false, day, text: `Cerrado · abre hoy a las ${later[0]}` };
  for (let k = 1; k <= 7; k++) {
    const d = hours.days.find((x) => x.day === (day + k) % 7);
    if (d?.ranges.length) return { open: false, day, text: `Cerrado · abre ${k === 1 ? 'mañana' : `el ${dayName(d.day).toLowerCase()}`} a las ${d.ranges[0][0]}` };
  }
  return { open: false, day, text: 'Consultá los horarios' };
}

export function OpenNow({ hours, className = '' }: { hours: Hours; className?: string }) {
  const [s, setS] = useState<ReturnType<typeof openStatus> | null>(null);
  useEffect(() => {
    const tick = () => setS(openStatus(hours));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [hours]);
  if (!hours.days.length) return null;
  return (
    <span className={`inline-flex items-center gap-2 text-sm ${className}`} aria-live="polite">
      <span className="relative flex h-2.5 w-2.5">
        {s?.open && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#3f8f5f] opacity-60" />}
        <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${s ? (s.open ? 'bg-[#3f8f5f]' : 'bg-accent') : 'bg-line'}`} />
      </span>
      {s?.text ?? 'Horarios'}
    </span>
  );
}

export function HoursTable({ hours }: { hours: Hours }) {
  const [today, setToday] = useState(-1);
  useEffect(() => setToday(nowIn(hours.timezone).day), [hours.timezone]);
  const order = [1, 2, 3, 4, 5, 6, 0];
  return (
    <dl className="divide-y divide-line">
      {order.map((d) => {
        const row = hours.days.find((x) => x.day === d);
        return (
          <div key={d} className={`flex items-baseline justify-between gap-4 py-2.5 ${today === d ? 'font-medium' : ''}`}>
            <dt className="flex items-center gap-2">{dayName(d)}{today === d && <span className="label rounded-full bg-pink px-2 py-1 text-[0.55rem]">Hoy</span>}</dt>
            <dd className={`text-right tabular-nums ${row?.ranges.length ? '' : 'text-muted'}`}>{row?.ranges.length ? row.ranges.map((r) => `${r[0]} a ${r[1]}`).join(' · ') : 'Cerrado'}</dd>
          </div>
        );
      })}
    </dl>
  );
}
