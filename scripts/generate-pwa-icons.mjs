/**
 * Genera PNG nítidos para PWA / iOS (Add to Home Screen).
 * Ejecutar tras cambiar public/favicon.svg: `node scripts/generate-pwa-icons.mjs`
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const publicDir = join(root, 'public');
const svgPath = join(publicDir, 'favicon.svg');
const svg = readFileSync(svgPath);

const mk = (size, out) =>
  sharp(svg)
    .resize(size, size, { fit: 'contain', background: { r: 27, g: 67, b: 50, alpha: 1 } })
    .png()
    .toFile(join(publicDir, out));

await mk(180, 'apple-touch-icon.png');
await mk(192, 'pwa-192.png');
await mk(512, 'pwa-512.png');

/** Icono maskable: contenido ~80% dentro del lienzo 512 (zona segura). */
const inner = 410;
const pad = Math.floor((512 - inner) / 2);
await sharp(svg)
  .resize(inner, inner, { fit: 'contain', background: { r: 27, g: 67, b: 50, alpha: 1 } })
  .extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 27, g: 67, b: 50, alpha: 1 } })
  .png()
  .toFile(join(publicDir, 'pwa-512-maskable.png'));

console.log('OK: apple-touch-icon.png, pwa-192.png, pwa-512.png, pwa-512-maskable.png');
