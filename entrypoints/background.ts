import { getSettings, settingsItem, type PrayerKey, type Settings } from '@/lib/settings';
import { getDayTimes } from '@/lib/prayer';
import { makeT } from '@/lib/i18n';
import { fmtTime } from '@/lib/format';

const REFRESH = 'refresh';
const LATE_LIMIT_MS = 10 * 60_000; // skip alerts if the computer was asleep past the prayer

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

/** Recreate all prayer alarms for the next two days. */
async function reschedule() {
  const s = await getSettings();
  const alarms = await browser.alarms.getAll();
  await Promise.all(
    alarms.filter((a) => a.name !== REFRESH).map((a) => browser.alarms.clear(a.name)),
  );
  if (!(await browser.alarms.get(REFRESH))) {
    await browser.alarms.create(REFRESH, { periodInMinutes: 360 });
  }
  if (!s.location) return;

  const now = Date.now();
  for (const offset of [0, 1]) {
    for (const e of getDayTimes(s, s.location, offset)) {
      const pp = s.perPrayer[e.key];
      const at = e.time.getTime();
      if ((pp.notify || pp.azan) && at > now) {
        await browser.alarms.create(`prayer|${e.key}|${at}`, { when: at });
      }
      const pre = at - s.remindBefore * 60_000;
      if (s.remindBefore > 0 && pp.notify && pre > now) {
        await browser.alarms.create(`pre|${e.key}|${at}`, { when: pre });
      }
    }
  }
}

async function onAlarm(alarm: { name: string; scheduledTime: number }) {
  if (alarm.name === REFRESH) return reschedule();
  const [kind, key, ts] = alarm.name.split('|') as ['prayer' | 'pre', PrayerKey, string];
  if (Date.now() - alarm.scheduledTime > LATE_LIMIT_MS) return;

  const s = await getSettings();
  if (!s.location) return;
  const t = makeT(s.display.language);
  const pp = s.perPrayer[key];
  const time = fmtTime(new Date(Number(ts)), s.location.timezone, s);

  if (kind === 'pre') {
    await notify(`pre-${key}`, t('inMinutes', { p: t.prayer(key), n: s.remindBefore }), time, false, s);
    return;
  }

  const playAudio = pp.azan && !s.audio.muted && key !== 'sunrise';
  if (pp.notify) {
    const title = key === 'sunrise' ? t.prayer('sunrise') : t('timeFor', { p: t.prayer(key) });
    await notify(`prayer-${key}`, title, `${time} · ${s.location.city}`, playAudio, s);
  }
  if (playAudio) await playAzan(key, s);
}

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
