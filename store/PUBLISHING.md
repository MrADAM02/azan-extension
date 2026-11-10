# Publishing checklist

## 1. Before every release

1. Set the version in `package.json` (for example `1.0.0` for the first release). WXT copies it into the manifest. Each upload needs a higher version than the last one.
2. Run the checks:
   ```bash
   npm run compile     # type-check
   npm test            # unit tests
   npm run test:e2e    # builds, then drives the extension in Edge/Chrome
   ```
3. Test by hand in your own browser (`npm run build`, then load `.output/chrome-mv3` unpacked):
   - Set a minute adjustment so the next prayer is 1–2 minutes away. Check that the notification appears and the azan plays with no extension page open, and that **Stop** works.
   - Check the toolbar badge countdown, the popup, and the New Tab in English and Arabic.
4. If the UI changed: `npm run screenshots` to refresh `store/screenshots/`.
5. Build the package:
   ```bash
   npm run zip         # creates .output/azan-tab-<version>-chrome.zip
   ```
   The same zip is used for Chrome and Edge.

## 2. Chrome Web Store (first time)

1. Open the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole) with the Google account you want to publish under. Pay the one-time US$5 registration fee and verify your contact email.
2. **New item** → upload the zip.
3. **Store listing** tab: paste the text from [LISTING.md](LISTING.md) (English first; add Arabic under *Add language*), upload the 5 screenshots and the 440×280 promo tile, set the category and language.
4. **Privacy practices** tab: paste the single purpose, the permission justifications and the data-usage answers from [LISTING.md](LISTING.md), and the privacy policy URL.
5. **Distribution**: Public, all regions, free.
6. **Submit for review.** Reviews usually take a few days. Broad permissions or a New Tab override can make it take longer. You get an email when it is approved or if something needs changing.

## 3. Microsoft Edge Add-ons (first time)

1. Register on [Partner Center](https://partner.microsoft.com/dashboard/microsoftedge/overview) for the Microsoft Edge program (free).
2. **Create new extension** → upload the same zip.
3. **Availability**: Public, all markets.
4. **Properties**: category, privacy policy URL (required, because the extension uses location), website URL, and mature content: No.
5. **Store listings**: add English and Arabic; paste the description from [LISTING.md](LISTING.md), upload screenshots (1280×800), the small promo tile and the logo (`assets/icon/icon-512.png`), and add the search terms.
6. **Submit.** Microsoft's review can take up to 7 business days. Add the reviewer notes from LISTING.md in the *Notes for certification* field.

## 4. Updates

Raise the version, run section 1 again, then upload the new zip:
- Chrome: Dashboard → your item → **Package** → *Upload new package* → Submit.
- Edge: Partner Center → your extension → **Update** → upload → Publish.

Users get updates automatically within a few hours of approval.

## 5. Things to keep

- The credits in Settings → *Sources & credits* (Tanzil, the azan recording and Open-Meteo all require attribution) and the Open-Meteo link in the New Tab footer.
- `PRIVACY.md` must stay at the same URL and match what the extension does. If you add a service or a permission, update the policy and the store privacy answers first.
- The Saheeh International translation is licensed for non-commercial use. If the extension ever becomes paid, it needs the publisher's permission (see the README).
