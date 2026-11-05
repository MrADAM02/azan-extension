// Generates public/audio/chime.wav — a soft three-note bell used as the built-in alert sound.
// Run: node scripts/gen-chime.mjs
import { writeFileSync, mkdirSync } from 'node:fs';

const rate = 22050;
const seconds = 4.5;
const n = Math.floor(rate * seconds);
const out = new Float32Array(n);

// Notes: (start sec, freq Hz)
const notes = [
  [0.0, 659.25], // E5
  [0.45, 523.25], // C5
  [0.9, 783.99], // G5
];
for (const [start, f] of notes) {
  const s0 = Math.floor(start * rate);
  for (let i = s0; i < n; i++) {
    const t = (i - s0) / rate;
    const env = Math.exp(-t * 1.6) * Math.min(1, t * 200);
    // Bell-like partials
    out[i] +=
      env *
      (0.6 * Math.sin(2 * Math.PI * f * t) +
        0.25 * Math.sin(2 * Math.PI * f * 2.01 * t) * Math.exp(-t * 2) +
        0.12 * Math.sin(2 * Math.PI * f * 3.02 * t) * Math.exp(-t * 3));
  }
}

const peak = out.reduce((m, v) => Math.max(m, Math.abs(v)), 0) || 1;
const buf = Buffer.alloc(44 + n * 2);
buf.write('RIFF', 0);
buf.writeUInt32LE(36 + n * 2, 4);
buf.write('WAVE', 8);
buf.write('fmt ', 12);
buf.writeUInt32LE(16, 16);
buf.writeUInt16LE(1, 20); // PCM
buf.writeUInt16LE(1, 22); // mono
buf.writeUInt32LE(rate, 24);
buf.writeUInt32LE(rate * 2, 28);
buf.writeUInt16LE(2, 32);
buf.writeUInt16LE(16, 34);
buf.write('data', 36);
buf.writeUInt32LE(n * 2, 40);
for (let i = 0; i < n; i++) buf.writeInt16LE(Math.round((out[i] / peak) * 0.8 * 32767), 44 + i * 2);

mkdirSync('public/audio', { recursive: true });
writeFileSync('public/audio/chime.wav', buf);
console.log(`Wrote public/audio/chime.wav (${(buf.length / 1024).toFixed(0)} KB)`);
