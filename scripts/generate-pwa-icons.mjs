import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const iconsDir = path.join(root, "public", "icons");

const svg = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#020617"/>
      <stop offset="100%" stop-color="#0e7490"/>
    </linearGradient>
    <linearGradient id="drop" x1="50%" y1="0%" x2="50%" y2="100%">
      <stop offset="0%" stop-color="#a5f3fc"/>
      <stop offset="100%" stop-color="#22d3ee"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#bg)"/>
  <circle cx="256" cy="256" r="168" fill="rgba(103,232,249,0.12)"/>
  <path fill="url(#drop)" d="M256 112c-52 72-96 112-96 168a96 96 0 0 0 192 0c0-56-44-96-96-168z"/>
  <ellipse cx="256" cy="300" rx="56" ry="10" fill="rgba(255,255,255,0.18)"/>
</svg>
`;

const sizes = [
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
  { name: "maskable-512.png", size: 512, maskable: true },
  { name: "apple-touch-icon.png", size: 180 },
  { name: "favicon-32.png", size: 32 },
  { name: "favicon-16.png", size: 16 }
];

await mkdir(iconsDir, { recursive: true });

const base = sharp(Buffer.from(svg));

for (const { name, size, maskable } of sizes) {
  let pipeline = base.clone().resize(size, size, { fit: "contain" });

  if (maskable) {
    pipeline = pipeline.extend({
      top: Math.round(size * 0.08),
      bottom: Math.round(size * 0.08),
      left: Math.round(size * 0.08),
      right: Math.round(size * 0.08),
      background: { r: 2, g: 6, b: 23, alpha: 1 }
    });
  }

  await pipeline.png().toFile(path.join(iconsDir, name));
}

await base.resize(32, 32).png().toFile(path.join(root, "public", "favicon.ico"));

console.log("PWA icons generated in public/icons");
