// Builds public/content/{quran,hadith,adhkar}.json from verified open sources.
// Text is copied verbatim; nothing is typed by hand. Run: node scripts/build-content.mjs
//
// Sources & licenses
//   Quran (Uthmani) + surah names  Tanzil Project, CC BY 3.0 (verbatim, credit + link to tanzil.net)
//   Saheeh International (en)      via Tanzil, non-commercial use permitted by Tanzil's terms
//   Hadith (Arabic)                fawazahmed0/hadith-api, The Unlicense
//   Morning/evening adhkar (Arabic) Seen-Arabic/Morning-And-Evening-Adhkar-DB, MIT
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const CACHE = '.content-cache';
const OUT = 'public/content';

const SOURCES = {
  quran:
    'https://tanzil.net/pub/download/index.php?marks=true&sajdah=true&rub=false&tatweel=true&quranType=uthmani&outType=txt-2&agree=true',
  sahih: 'https://tanzil.net/trans/?transID=en.sahih&type=txt-2',
  meta: 'https://tanzil.net/res/text/metadata/quran-data.xml',
  nawawi: 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-nawawi.json',
  qudsi: 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-qudsi.json',
  adhkar: 'https://raw.githubusercontent.com/Seen-Arabic/Morning-And-Evening-Adhkar-DB/main/ar.json',
};

/** Curated, self-contained passages: [surah, firstAyah, lastAyah]. */
const SELECTION = [
  [1, 1, 7], [2, 45, 46], [2, 152, 152], [2, 153, 153], [2, 155, 157], [2, 186, 186], [2, 201, 201],
  [2, 255, 255], [2, 285, 286], [3, 8, 9], [3, 26, 27], [3, 31, 31], [3, 139, 139], [3, 159, 159],
  [3, 173, 173], [3, 185, 185], [3, 190, 191], [4, 110, 110], [6, 59, 59], [6, 162, 163], [7, 23, 23],
  [7, 56, 56], [7, 205, 205], [9, 51, 51], [9, 129, 129], [10, 57, 57], [11, 6, 6], [12, 86, 87],
  [13, 28, 28], [14, 7, 7], [14, 40, 41], [16, 97, 97], [16, 128, 128], [17, 9, 9], [17, 23, 24],
  [17, 80, 80], [17, 82, 82], [18, 10, 10], [18, 46, 46], [20, 25, 28], [20, 114, 114], [21, 87, 87],
  [21, 89, 89], [23, 97, 98], [23, 118, 118], [24, 35, 35], [25, 74, 74], [26, 78, 82], [27, 19, 19],
  [29, 69, 69], [31, 17, 17], [33, 41, 42], [33, 56, 56], [35, 15, 15], [39, 53, 53], [40, 60, 60],
  [42, 19, 19], [49, 13, 13], [50, 16, 16], [51, 56, 58], [59, 10, 10], [59, 22, 24], [64, 11, 11],
  [65, 3, 3], [67, 1, 2], [71, 10, 12], [89, 27, 30], [93, 1, 11], [94, 1, 8], [97, 1, 5], [103, 1, 3],
  [108, 1, 3], [110, 1, 3], [112, 1, 4], [113, 1, 5], [114, 1, 6],
];

async function get(name) {
  mkdirSync(CACHE, { recursive: true });
  const file = join(CACHE, name);
  if (!existsSync(file)) {
    console.log(`Downloading ${name} …`);
    const r = await fetch(SOURCES[name]);
    if (!r.ok) throw new Error(`${name}: HTTP ${r.status}`);
    writeFileSync(file, Buffer.from(await r.arrayBuffer()));
  }
  return readFileSync(file, 'utf8');
}

function assert(cond, msg) {
  if (!cond) throw new Error(`Verification failed: ${msg}`);
}

/** Parse Tanzil "sura|aya|text" files; returns the map and the trailing #-comment block. */
function parseTanzil(txt) {
  const map = new Map();
  const notice = [];
  for (const line of txt.split(/\r?\n/)) {
    if (line.startsWith('#')) notice.push(line);
    else if (line.trim()) {
      const [s, a, ...rest] = line.split('|');
      map.set(`${s}:${a}`, rest.join('|'));
    }
  }
  return { map, notice: notice.join('\n').trim() };
}

async function buildQuran() {
  const ar = parseTanzil(await get('quran'));
  const en = parseTanzil(await get('sahih'));
  assert(ar.map.size === 6236, `Arabic ayah count ${ar.map.size}`);
  assert(en.map.size === 6236, `English ayah count ${en.map.size}`);
  assert(ar.notice.includes('Creative Commons Attribution 3.0'), 'Tanzil license block missing');
  assert(en.notice.includes('Saheeh International'), 'translation header missing');

  const meta = await get('meta');
  const surahs = {};
  for (const m of meta.matchAll(/<sura index="(\d+)" ayas="(\d+)"[^>]*? name="([^"]+)" tname="([^"]+)" ename="([^"]+)"/g)) {
    surahs[m[1]] = { ayahs: +m[2], ar: m[3], en: m[4], meaning: m[5] };
  }
  assert(Object.keys(surahs).length === 114, 'surah metadata count');

  const items = SELECTION.map(([s, from, to]) => {
    assert(to >= from && to <= surahs[s].ayahs, `range ${s}:${from}-${to}`);
    const ayahs = [];
    for (let a = from; a <= to; a++) {
      const key = `${s}:${a}`;
      assert(ar.map.has(key) && en.map.has(key), `missing ${key}`);
      ayahs.push({ n: a, ar: ar.map.get(key), en: en.map.get(key) });
    }
    return { s, ayahs };
  });

  return {
    source: 'Tanzil Project — https://tanzil.net',
    notice: ar.notice,
    translation: 'Saheeh International (via Tanzil.net, non-commercial use)',
    translationNotice: en.notice,
    surahs: Object.fromEntries(
      [...new Set(SELECTION.map(([s]) => s))].map((s) => [s, surahs[s]]),
    ),
    items,
  };
}

const cleanHadith = (t) =>
  t
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .trim();

async function buildHadith() {
  const out = [];
  for (const [key, expected] of [['nawawi', 42], ['qudsi', 40]]) {
    const j = JSON.parse(await get(key));
    const hs = j.hadiths.filter((h) => h.text && h.text.trim());
    assert(hs.length === expected, `${key}: ${hs.length} hadith, expected ${expected}`);
    for (const h of hs) {
      assert(!/<(?!br)[a-z]/i.test(h.text), `${key} ${h.hadithnumber}: unexpected HTML`);
      out.push({ c: key, n: h.hadithnumber, text: cleanHadith(h.text) });
    }
  }
  return {
    source: 'fawazahmed0/hadith-api (The Unlicense) — https://github.com/fawazahmed0/hadith-api',
    collections: {
      nawawi: { ar: 'الأربعون النووية', en: "An-Nawawi's Forty Hadith" },
      qudsi: { ar: 'الأحاديث القدسية الأربعون', en: 'Forty Hadith Qudsi' },
    },
    items: out,
  };
}

async function buildAdhkar() {
  const list = JSON.parse(await get('adhkar'));
  assert(Array.isArray(list) && list.length >= 30, `adhkar count ${list.length}`);
  return {
    source:
      'Morning and Evening Adhkar DB (MIT) — https://github.com/Seen-Arabic/Morning-And-Evening-Adhkar-DB',
    // type: 0 = morning & evening, 1 = morning only, 2 = evening only
    items: list.map((d) => {
      assert(d.content && [0, 1, 2].includes(d.type), `adhkar ${d.order}`);
      return { n: d.order, text: d.content.trim(), count: d.count || 1, type: d.type, source: (d.source || '').trim() };
    }),
  };
}

mkdirSync(OUT, { recursive: true });
const results = {
  quran: await buildQuran(),
  hadith: await buildHadith(),
  adhkar: await buildAdhkar(),
};
for (const [name, data] of Object.entries(results)) {
  const file = join(OUT, `${name}.json`);
  writeFileSync(file, JSON.stringify(data));
  console.log(`Wrote ${file}: ${data.items.length} items, ${(JSON.stringify(data).length / 1024).toFixed(0)} KB`);
}
