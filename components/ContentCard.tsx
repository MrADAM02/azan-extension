import { useCallback, useEffect, useState } from 'react';
import {
  adhkarFor,
  loadAdhkar,
  loadHadith,
  loadQuran,
  pickRandom,
  type AdhkarData,
  type ContentKind,
  type DhikrPeriod,
  type HadithData,
  type QuranData,
} from '@/lib/content';
import { fmtNumber } from '@/lib/format';
import type { Settings } from '@/lib/settings';
import type { T } from '@/lib/i18n';

type Shown =
  | { kind: 'quran'; item: QuranData['items'][number]; surah: QuranData['surahs'][string] }
  | { kind: 'dhikr'; item: AdhkarData['items'][number] }
  | { kind: 'hadith'; item: HadithData['items'][number]; collection: HadithData['collections'][string] };

interface Props {
  settings: Settings;
  t: T;
  period: DhikrPeriod;
}

const arNum = (n: number) => new Intl.NumberFormat('ar').format(n);

export function ContentCard({ settings: s, t, period }: Props) {
  const kinds = (Object.keys(s.content) as ContentKind[]).filter((k) => s.content[k]);
  const [shown, setShown] = useState<Shown | null>(null);
  const kindsKey = kinds.join(',');

  const pick = useCallback(
    async (prev?: Shown | null) => {
      if (!kinds.length) return setShown(null);
      const kind = pickRandom(kinds, kinds.length > 1 ? prev?.kind : undefined);
      try {
        if (kind === 'quran') {
          const q = await loadQuran();
          const item = pickRandom(q.items, prev?.kind === 'quran' ? prev.item : undefined);
          setShown({ kind, item, surah: q.surahs[item.s]! });
        } else if (kind === 'hadith') {
          const h = await loadHadith();
          const item = pickRandom(h.items, prev?.kind === 'hadith' ? prev.item : undefined);
          setShown({ kind, item, collection: h.collections[item.c]! });
        } else {
          const a = await loadAdhkar();
          const item = pickRandom(adhkarFor(a, period), prev?.kind === 'dhikr' ? prev.item : undefined);
          setShown({ kind, item });
        }
      } catch (e) {
        console.error(e);
      }
    },
    [kindsKey, period],
  );

  useEffect(() => void pick(), [pick]);
  if (!shown) return null;

  const en = s.display.language === 'en';
  let label: string;
  let body: React.ReactNode;
  let footer: React.ReactNode = null;

  if (shown.kind === 'quran') {
    const { item, surah } = shown;
    const first = item.ayahs[0]!.n;
    const last = item.ayahs[item.ayahs.length - 1]!.n;
    const range = first === last ? `${first}` : `${first}–${last}`;
    label = en ? `${surah.en} · ${item.s}:${range}` : `سورة ${surah.ar} · ${fmtNumber(first, s)}${first === last ? '' : `–${fmtNumber(last, s)}`}`;
    body = (
      <>
        <p dir="rtl" lang="ar" className="font-quran text-2xl leading-[2.4]">
          {item.ayahs.map((a) => (
            <span key={a.n}>
              {a.ar} <span className="text-amber-200">﴿{arNum(a.n)}﴾</span>{' '}
            </span>
          ))}
        </p>
        {en && (
          <p dir="ltr" lang="en" className="mt-3 text-sm leading-relaxed opacity-85">
            {item.ayahs.map((a) => (
              <span key={a.n}>
                <sup className="opacity-60">{a.n}</sup> {a.en}{' '}
              </span>
            ))}
          </p>
        )}
      </>
    );
    footer = (
      <a href="https://tanzil.net" target="_blank" rel="noreferrer" className="hover:underline">
        Tanzil.net{en ? ' · Saheeh International' : ''}
      </a>
    );
  } else if (shown.kind === 'hadith') {
    const { item, collection } = shown;
    label = `${en ? collection.en : collection.ar} · ${fmtNumber(item.n, s)}`;
    body = (
      <p dir="rtl" lang="ar" className="whitespace-pre-line text-lg leading-loose">
        {item.text}
      </p>
    );
  } else {
    const { item } = shown;
    label = period === 'morning' ? t('morningAdhkar') : period === 'evening' ? t('eveningAdhkar') : t('dhikr');
    body = (
      <>
        <p dir="rtl" lang="ar" className="text-xl leading-loose">
          {item.text}
        </p>
        {item.source && (
          <details className="mt-2 text-sm opacity-80">
            <summary className="cursor-pointer select-none opacity-80">{t('source')}</summary>
            <p dir="rtl" lang="ar" className="mt-1 leading-relaxed">
              {item.source}
            </p>
          </details>
        )}
      </>
    );
    if (item.count > 1) footer = <span>{t('repeat', { n: fmtNumber(item.count, s) })}</span>;
  }

  const icon = shown.kind === 'quran' ? '📖' : shown.kind === 'hadith' ? '📜' : '📿';
  return (
    <section className="w-full max-w-3xl rounded-2xl bg-black/20 px-6 py-4 ring-1 ring-white/15 backdrop-blur-md">
      <header className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="font-medium opacity-90">
          {icon} {label}
        </span>
        <button
          onClick={() => pick(shown)}
          title={t('showAnother')}
          className="rounded-full px-2 py-1 opacity-70 hover:bg-white/15 hover:opacity-100"
        >
          🔄
        </button>
      </header>
      <div className="max-h-64 overflow-y-auto pe-1">{body}</div>
      {footer && <footer className="mt-2 text-xs opacity-60">{footer}</footer>}
    </section>
  );
}
