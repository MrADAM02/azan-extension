import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { AdhkarData, HadithData, QuranData } from '@/lib/content';
import { BUILTIN_SOUNDS } from '@/lib/schema';

const root = join(__dirname, '..');
const json = <T>(file: string): T => JSON.parse(readFileSync(join(root, 'public/content', file), 'utf8'));

describe('bundled content', () => {
  it('Quran passages are complete and credit Tanzil', () => {
    const q = json<QuranData & { notice: string }>('quran.json');
    expect(q.items.length).toBeGreaterThanOrEqual(70);
    expect(q.notice).toMatch(/tanzil/i);
    for (const item of q.items) {
      const surah = q.surahs[item.s];
      expect(surah, `surah ${item.s}`).toBeDefined();
      for (const a of item.ayahs) {
        expect(a.n).toBeGreaterThanOrEqual(1);
        expect(a.n).toBeLessThanOrEqual(surah!.ayahs);
        expect(a.ar.length).toBeGreaterThan(0);
        expect(a.en.length).toBeGreaterThan(0);
      }
    }
  });

  it('hadith: 42 Nawawi + 40 Qudsi', () => {
    const h = json<HadithData>('hadith.json');
    const count = (c: string) => h.items.filter((x) => x.c === c).length;
    expect([count('nawawi'), count('qudsi')]).toEqual([42, 40]);
    expect(h.items.every((x) => x.text.trim().length > 0)).toBe(true);
  });

  it('adhkar cover morning and evening', () => {
    const a = json<AdhkarData>('adhkar.json');
    expect(a.items.length).toBeGreaterThanOrEqual(30);
    expect(a.items.some((x) => x.type === 1)).toBe(true);
    expect(a.items.some((x) => x.type === 2)).toBe(true);
  });
});

describe('bundled files', () => {
  it.each(Object.entries(BUILTIN_SOUNDS))('sound %s exists and is under 2 MB', (_id, path) => {
    const file = join(root, 'public', path);
    expect(existsSync(file)).toBe(true);
    expect(statSync(file).size).toBeLessThan(2 * 1024 * 1024);
  });

  it.each([16, 32, 48, 96, 128])('icon %i px is a PNG of the right size', (size) => {
    const buf = readFileSync(join(root, `public/icon/${size}.png`));
    expect(buf.subarray(1, 4).toString()).toBe('PNG');
    expect([buf.readUInt32BE(16), buf.readUInt32BE(20)]).toEqual([size, size]);
  });
});

describe('React handlers', () => {
  // Regression guard: reading e.target inside a deferred settings updater saves the
  // value React has already reset, so the change is silently lost.
  const files = ['entrypoints', 'components'].flatMap((dir) =>
    readdirSync(join(root, dir), { recursive: true, encoding: 'utf8' })
      .filter((f) => f.endsWith('.tsx'))
      .map((f) => join(root, dir, f)),
  );

  it.each(files.map((f) => [f.slice(root.length + 1), f]))('%s reads event values before updating settings', (_name, file) => {
    const src = readFileSync(file, 'utf8');
    const bad: string[] = [];
    // Look at each on*={…} attribute on its own (balanced braces).
    for (const m of src.matchAll(/\bon[A-Z]\w*=\{/g)) {
      let depth = 0;
      let end = m.index + m[0].length - 1;
      for (; end < src.length; end++) {
        if (src[end] === '{') depth++;
        else if (src[end] === '}' && --depth === 0) break;
      }
      const handler = src.slice(m.index, end + 1);
      if (/\(x\)\s*=>[\s\S]*\be\.target\./.test(handler)) bad.push(handler.replace(/\s+/g, ' ').slice(0, 100));
    }
    expect(bad).toEqual([]);
  });
});
