import { getSettings, settingsItem, type PrayerKey, type Settings } from '@/lib/settings';
import { currentAndNext, getDayTimes, ymdInTz } from '@/lib/prayer';
import { makeT } from '@/lib/i18n';
import { fmtTime } from '@/lib/format';
import { isFriday, zonedTimeToDate } from '@/lib/time';

const REFRESH = 'refresh';
const BADGE = 'badge';
const LATE_LIMIT_MS = 10 * 60_000; // skip alerts if the computer was asleep past the prayer

type AlarmKind = 'prayer' | 'pre' | 'jumuah' | 'kahf';

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(async ({ reason }) => {
    await reschedule();
    if (reason === 'install') browser.tabs.create({}); // opens our New Tab page → onboarding
  });
  browser.runtime.onStartup.addListener(reschedule);
  settingsItem.watch(() => reschedule());
  browser.alarms.onAlarm.addListener(onAlarm);

  browser.notifications.onButtonClicked.addListener((id) => {
    stopAudio();
    browser.notifications.clear(id);
  });
  browser.notifications.onClicked.addListener((id) => browser.notifications.clear(id));

  browser.runtime.onMessage.addListener((msg) => {
    if (msg?.target === 'background' && msg.type === 'reschedule') reschedule();
  });
});

/** Recreate all prayer alarms for the next two days, and the badge timer. */
async function reschedule() {
  const s = await getSettings();
  const alarms = await browser.alarms.getAll();
  await Promise.all(
    alarms
      .filter((a) => a.name !== REFRESH && a.name !== BADGE)
      .map((a) => browser.alarms.clear(a.name)),
  );
  if (!(await browser.alarms.get(REFRESH))) {
    await browser.alarms.create(REFRESH, { periodInMinutes: 360 });
  }
  await setupBadge(s);
  if (!s.location) return;

  const tz = s.location.timezone;
  const now = Date.now();
  const create = (kind: AlarmKind, key: PrayerKey, prayerAt: number, when: number) =>
    when > now ? browser.alarms.create(`${kind}|${key}|${prayerAt}`, { when }) : undefined;

  for (const offset of [0, 1]) {
    for (const e of getDayTimes(s, s.location, offset)) {
      const pp = s.perPrayer[e.key];
      const at = e.time.getTime();
      const jumuah = e.key === 'dhuhr' && isFriday(e.time, tz) && s.jumuah.remindBefore > 0;
      if (pp.notify || pp.azan) await create('prayer', e.key, at, at);
      if (jumuah) await create('jumuah', e.key, at, at - s.jumuah.remindBefore * 60_000);
      else if (s.remindBefore > 0 && pp.notify) await create('pre', e.key, at, at - s.remindBefore * 60_000);
    }

    if (s.jumuah.kahf) {
      const { y, m, d } = ymdInTz(new Date(now), tz);
      const day = new Date(Date.UTC(y, m - 1, d + offset));
      if (day.getUTCDay() === 5) {
        const [h = 10, mi = 0] = s.jumuah.kahfTime.split(':').map(Number);
        const when = zonedTimeToDate(day.getUTCFullYear(), day.getUTCMonth() + 1, day.getUTCDate(), h, mi, tz);
        await create('kahf', 'dhuhr', when.getTime(), when.getTime());
      }
    }
  }
}

async function onAlarm(alarm: { name: string; scheduledTime: number }) {
  if (alarm.name === REFRESH) return reschedule();
  if (alarm.name === BADGE) return updateBadge(await getSettings());
  const [kind, key, ts] = alarm.name.split('|') as [AlarmKind, PrayerKey, string];
  if (Date.now() - alarm.scheduledTime > LATE_LIMIT_MS) return;

  const s = await getSettings();
  if (!s.location) return;
  const t = makeT(s.display.language);
  const prayerAt = new Date(Number(ts));
  const tz = s.location.timezone;
  const name = t.prayerAt(key, prayerAt, tz);
  const time = fmtTime(prayerAt, tz, s);

  switch (kind) {
    case 'kahf':
      return notify('kahf', t('kahfTitle'), t('kahfMsg'), false, s);
    case 'jumuah':
      return notify('jumuah', t('jumuahIn', { n: s.jumuah.remindBefore }), time, false, s);
    case 'pre':
      return notify(`pre-${key}`, t('inMinutes', { p: name, n: s.remindBefore }), time, false, s);
  }

  const pp = s.perPrayer[key];
  const playAudio = pp.azan && !s.audio.muted && key !== 'sunrise';
  if (pp.notify) {
    const title = key === 'sunrise' ? name : t('timeFor', { p: name });
    await notify(`prayer-${key}`, title, `${time} · ${s.location.city}`, playAudio, s);
  }
  if (playAudio) await playAzan(key, s);
  await updateBadge(s);
}

// ---------- Toolbar badge ----------

async function setupBadge(s: Settings) {
  if (!s.badge || !s.location) {
    await browser.alarms.clear(BADGE);
    await browser.action.setBadgeText({ text: '' });
    await browser.action.setTitle({ title: browser.runtime.getManifest().action?.default_title ?? '' });
    return;
  }
  if (!(await browser.alarms.get(BADGE))) {
    // Align ticks to the start of each minute so the countdown changes on time.
    const nextMinute = Math.ceil((Date.now() + 1) / 60_000) * 60_000;
    await browser.alarms.create(BADGE, { when: nextMinute, periodInMinutes: 1 });
  }
  await updateBadge(s);
}

async function updateBadge(s: Settings) {
  if (!s.badge || !s.location) return;
  const now = new Date();
  const { next } = currentAndNext(s, s.location, now);
  if (!next) return browser.action.setBadgeText({ text: '' });

  const mins = Math.ceil((next.time.getTime() - now.getTime()) / 60_000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const text = mins < 60 ? `${mins}m` : `${h}:${String(m).padStart(2, '0')}`;
  const t = makeT(s.display.language);
  const left = h > 0 ? `${h}h ${m}m` : `${m}m`;

  await browser.action.setBadgeText({ text });
  await browser.action.setBadgeBackgroundColor({ color: mins <= 15 ? '#d97706' : '#047857' });
  await browser.action.setBadgeTextColor?.({ color: '#ffffff' });
  await browser.action.setTitle({
    title: t('badgeTitle', {
      p: t.prayerAt(next.key, next.time, s.location.timezone),
      time: fmtTime(next.time, s.location.timezone, s),
      left,
    }),
  });
}

// ---------- Notifications & audio ----------

async function notify(id: string, title: string, message: string, withStop: boolean, s: Settings) {
  const t = makeT(s.display.language);
  await browser.notifications.create(id, {
    type: 'basic',
    iconUrl: browser.runtime.getURL('/icon/128.png'),
    title,
    message,
    priority: 2,
    buttons: withStop ? [{ title: t('stopAzan') }] : undefined,
  });
}

async function ensureOffscreen() {
  const url = browser.runtime.getURL('/offscreen.html');
  const existing = await browser.runtime.getContexts({
    contextTypes: [browser.runtime.ContextType.OFFSCREEN_DOCUMENT],
    documentUrls: [url],
  });
  if (existing.length) return;
  try {
    await browser.offscreen.createDocument({
      url,
      reasons: [browser.offscreen.Reason.AUDIO_PLAYBACK],
      justification: 'Play the azan at prayer time',
    });
  } catch (e) {
    // A concurrent call may have created it already.
    if (!String(e).includes('single offscreen')) throw e;
  }
}

async function playAzan(key: PrayerKey, s: Settings) {
  const sound = key === 'fajr' && s.audio.fajrSound !== 'same' ? s.audio.fajrSound : s.audio.sound;
  await ensureOffscreen();
  await browser.runtime.sendMessage({ target: 'offscreen', type: 'play', sound, volume: s.audio.volume });
}

function stopAudio() {
  browser.runtime.sendMessage({ target: 'offscreen', type: 'stop' }).catch(() => {});
}
