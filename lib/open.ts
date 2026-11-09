/** Open the monthly timetable page in a new tab. */
export function openTimetable() {
  return browser.tabs.create({ url: browser.runtime.getURL('/timetable.html') });
}
