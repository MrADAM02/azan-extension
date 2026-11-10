// Exports public/icon/*.png from assets/icon/*.svg. Run: node scripts/gen-icons.mjs
// 16 and 32 px use the simplified icon so the shapes stay crisp at small sizes.
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

mkdirSync('public/icon', { recursive: true });
const jobs = [
  [16, 'assets/icon/icon-small.svg'],
  [32, 'assets/icon/icon-small.svg'],
  [48, 'assets/icon/icon.svg'],
  [96, 'assets/icon/icon.svg'],
  [128, 'assets/icon/icon.svg'],
];
for (const [size, src] of jobs) {
  // icon.svg has the 16 px store padding (96 px artwork in 128). Only 96/128 keep it;
  // 48 px is cropped to the artwork so it isn't tiny on the extensions page.
  const crop = size === 48;
  const full = crop ? 64 : size;
  let img = sharp(src, { density: 72 * Math.ceil(full / 32) * 4 }).resize(full, full);
  if (crop) img = sharp(await img.png().toBuffer()).extract({ left: 8, top: 8, width: 48, height: 48 });
  await img
    .png({ compressionLevel: 9 })
    .toFile(`public/icon/${size}.png`);
  console.log(`public/icon/${size}.png`);
}
// Large preview for store assets
await sharp('assets/icon/icon.svg', { density: 1200 }).resize(512, 512).png().toFile('assets/icon/icon-512.png');
console.log('assets/icon/icon-512.png');
