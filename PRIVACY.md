# Privacy Policy – Azan Tab

*Last updated: 10 November 2026*

Azan Tab shows prayer times, the azan, the Hijri date, Qibla direction and weather. It has no account, no analytics, no ads and no tracking. The developer runs no server and receives none of your data.

## What the extension stores

All data stays in your browser:

| Data | Where | Why |
|---|---|---|
| Your location (latitude/longitude rounded to about 10 m, city name, country, timezone) and your settings | Browser sync storage (`chrome.storage.sync`) | To calculate prayer times. If you have browser sync turned on, your browser (Google or Microsoft) syncs it between your own devices, as it does for other extension settings. |
| Weather for your location, cached for 30 minutes | Local browser storage | To avoid repeated requests |
| Azan audio or a background image you upload | The extension's IndexedDB, on this device only | To play or show them. They are never uploaded anywhere. |

Prayer times, the Hijri date, the Qibla direction and the Quran, hadith and adhkar texts are calculated or bundled inside the extension, and work offline.

## What is sent to other services

The extension contacts only these three services, and only for the reasons listed:

| Service | What is sent | When |
|---|---|---|
| [Open-Meteo](https://open-meteo.com/en/terms) weather API | Your saved coordinates and temperature unit | When the weather is shown (at most every 30 minutes). You can turn weather off in Settings. |
| [Open-Meteo](https://open-meteo.com/en/terms) geocoding API | The city name you type and the interface language | Only when you search for a city |
| [BigDataCloud](https://www.bigdatacloud.com/privacy) reverse geocoding | Your coordinates and the interface language | Only when you press "Detect my location", to turn the coordinates into a city name |

These requests are made directly from your browser, so the services also see your IP address, as with any web request. No identifiers, cookies or other personal data are sent.

"Detect my location" uses the browser's geolocation permission, and asks for it only when you press that button. You can instead search for your city.

## Permissions

- **storage**: saves your settings and location.
- **alarms**: schedules prayer-time notifications and the azan.
- **notifications**: shows prayer-time reminders.
- **offscreen**: plays the azan audio in the background.
- **geolocation**: "Detect my location" (optional; city search works without it).
- **Access to api.open-meteo.com, geocoding-api.open-meteo.com and api.bigdatacloud.net**: weather, city search and city name, as described above.

## Deleting your data

Remove the extension to delete everything it stored. You can also remove an uploaded azan or background with its **Remove** button in Settings, or change your location there at any time. ("Reset all settings" restores the default options but keeps your location and uploads.)

## Changes and contact

Changes to this policy are published in this file, with the date above updated. Questions: [open an issue on GitHub](https://github.com/MrADAM02/azan-extension/issues).

---

# سياسة الخصوصية – Azan Tab

*آخر تحديث: ١٠ نوفمبر ٢٠٢٦*

تعرض الإضافة مواقيت الصلاة والأذان والتاريخ الهجري واتجاه القبلة والطقس. لا تحتاج إلى حساب، ولا تحتوي على تحليلات أو إعلانات أو تتبّع. لا يملك المطوّر أي خادم، ولا تصله أي بيانات منك.

## ما تحفظه الإضافة

تبقى كل البيانات في متصفحك:

- **موقعك** (الإحداثيات مقرّبة إلى نحو ١٠ أمتار، واسم المدينة والدولة والمنطقة الزمنية) **وإعداداتك**: في تخزين المزامنة الخاص بالمتصفح، لحساب مواقيت الصلاة. إذا كانت المزامنة مفعّلة في متصفحك، يزامنها المتصفح (Google أو Microsoft) بين أجهزتك كما يفعل مع إعدادات الإضافات الأخرى.
- **حالة الطقس**: تُحفظ مؤقتًا لمدة ٣٠ دقيقة على جهازك.
- **ملف الأذان أو صورة الخلفية التي ترفعها**: على هذا الجهاز فقط، ولا تُرفع إلى أي مكان.

مواقيت الصلاة والتاريخ الهجري واتجاه القبلة تُحسب داخل الإضافة، ونصوص القرآن والحديث والأذكار مضمّنة فيها، وكلها تعمل دون اتصال بالإنترنت.

## ما يُرسل إلى خدمات أخرى

- **Open-Meteo (الطقس)**: إحداثياتك المحفوظة ووحدة الحرارة، عند عرض الطقس (مرة كل ٣٠ دقيقة على الأكثر). يمكنك إيقاف الطقس من الإعدادات.
- **Open-Meteo (البحث عن المدن)**: اسم المدينة الذي تكتبه ولغة الواجهة، عند البحث فقط.
- **BigDataCloud**: إحداثياتك ولغة الواجهة، عند الضغط على "تحديد موقعي" فقط، لمعرفة اسم المدينة.

تُرسل هذه الطلبات من متصفحك مباشرة، لذلك ترى هذه الخدمات عنوان IP الخاص بك كما في أي طلب على الإنترنت. لا تُرسل أي معرّفات أو ملفات تعريف ارتباط أو بيانات شخصية أخرى.

## حذف بياناتك

احذف الإضافة لحذف كل ما حفظته على جهازك. ويمكنك أيضًا حذف ملف الأذان أو الخلفية التي رفعتها بزر **إزالة** في الإعدادات، أو تغيير موقعك من هناك في أي وقت. (زر "إعادة ضبط جميع الإعدادات" يعيد الخيارات الافتراضية لكنه يبقي موقعك وملفاتك.)

## التواصل

للأسئلة: [افتح مشكلة على GitHub](https://github.com/MrADAM02/azan-extension/issues).
