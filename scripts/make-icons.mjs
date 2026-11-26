// Draws the app icons (a check mark in a circle) as PNG files in public/.
// Run with: node scripts/make-icons.mjs
// Uses only what comes with Node, so nothing extra to install.
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';

const BG = [0x0b, 0x0d, 0x12];
const ACCENT = [0x81, 0x8c, 0xf8];
const MARK = [0x0b, 0x0d, 0x12];

/** Distance from point p to the line segment a–b. */
function distToSegment(px, py, [ax, ay], [bx, by]) {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/** The colour at a point, in 0–1 coordinates. `scale` shrinks the artwork towards the centre. */
function colourAt(x, y, scale) {
  const u = 0.5 + (x - 0.5) / scale;
  const v = 0.5 + (y - 0.5) / scale;
  const check = [
    [0.355, 0.515],
    [0.455, 0.615],
    [0.655, 0.405],
  ];
  const d = Math.min(distToSegment(u, v, check[0], check[1]), distToSegment(u, v, check[1], check[2]));
  if (d < 0.042) return MARK;
  if (Math.hypot(u - 0.5, v - 0.5) < 0.3) return ACCENT;
  return BG;
}

function crc32(buf) {
  let c = ~0;
  for (const b of buf) {
    c ^= b;
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}

function png(size, scale) {
  const SS = 4; // 4×4 samples per pixel, for smooth edges
  const rows = Buffer.alloc(size * (size * 3 + 1));
  for (let y = 0; y < size; y++) {
    const row = y * (size * 3 + 1);
    for (let x = 0; x < size; x++) {
      const sum = [0, 0, 0];
      for (let sy = 0; sy < SS; sy++)
        for (let sx = 0; sx < SS; sx++) {
          const c = colourAt((x + (sx + 0.5) / SS) / size, (y + (sy + 0.5) / SS) / size, scale);
          sum[0] += c[0];
          sum[1] += c[1];
          sum[2] += c[2];
        }
      for (let i = 0; i < 3; i++) rows[row + 1 + x * 3 + i] = Math.round(sum[i] / (SS * SS));
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // bit depth
  header[9] = 2; // RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(rows, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync('public', { recursive: true });
const icons = [
  ['pwa-192.png', 192, 1],
  ['pwa-512.png', 512, 1],
  // Phones crop "maskable" icons into their own shapes, so the artwork is shrunk to stay inside.
  ['pwa-maskable-512.png', 512, 0.8],
  ['apple-touch-icon.png', 180, 1],
  ['favicon-32.png', 32, 1.4],
];
for (const [name, size, scale] of icons) {
  writeFileSync(`public/${name}`, png(size, scale));
  console.log(`public/${name}`);
}
