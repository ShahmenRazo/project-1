// Генерация PWA-иконок (без внешних зависимостей: node zlib + собственный PNG-энкодер)
// Запуск: node scripts/generate-icons.mjs
// Результат: public/icons/{icon-192.png, icon-512.png, maskable-512.png, apple-touch-icon.png}

import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "public", "icons");

// ---------------------------------------------------------------------------
// PNG-энкодер (RGBA, 8 bit)
// ---------------------------------------------------------------------------

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let crc = 0xffffffff;
  for (const byte of buf) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePng(width, height, rgba) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter: None
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------------------
// Рисование: логотип "SS" (побитовый шрифт 5x7), фон индиго
// ---------------------------------------------------------------------------

const BG = [0x4f, 0x46, 0xe5, 0xff]; // indigo-600
const FG = [0xff, 0xff, 0xff, 0xff];

const S_GLYPH = [
  "11111",
  "10001",
  "10000",
  "11111",
  "00001",
  "10001",
  "11111",
];
const GLYPH_W = S_GLYPH[0].length;
const GLYPH_H = S_GLYPH.length;

function drawIcon(size, contentRatio) {
  const img = Buffer.alloc(size * size * 4);
  for (let i = 0; i < img.length; i += 4) {
    img[i] = BG[0];
    img[i + 1] = BG[1];
    img[i + 2] = BG[2];
    img[i + 3] = BG[3];
  }

  const cell = Math.max(1, Math.floor((size * contentRatio) / (GLYPH_W * 2 + 1)));
  const width = cell * (GLYPH_W * 2 + 1);
  const height = cell * GLYPH_H;
  const ox = Math.floor((size - width) / 2);
  const oy = Math.floor((size - height) / 2);

  const put = (gx, gy) => {
    for (let cy = 0; cy < cell; cy++) {
      for (let cx = 0; cx < cell; cx++) {
        const x = ox + gx * cell + cx;
        const y = oy + gy * cell + cy;
        if (x < 0 || x >= size || y < 0 || y >= size) continue;
        const idx = (y * size + x) * 4;
        img[idx] = FG[0];
        img[idx + 1] = FG[1];
        img[idx + 2] = FG[2];
        img[idx + 3] = FG[3];
      }
    }
  };

  for (let glyph = 0; glyph < 2; glyph++) {
    const offset = glyph * (GLYPH_W + 1); // пробел 1 клетка между "S" и "S"
    for (let gy = 0; gy < GLYPH_H; gy++) {
      for (let gx = 0; gx < GLYPH_W; gx++) {
        if (S_GLYPH[gy][gx] === "1") put(offset + gx, gy);
      }
    }
  }

  return encodePng(size, size, img);
}

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(join(OUT_DIR, "icon-192.png"), drawIcon(192, 0.72));
writeFileSync(join(OUT_DIR, "icon-512.png"), drawIcon(512, 0.72));
writeFileSync(join(OUT_DIR, "maskable-512.png"), drawIcon(512, 0.6));
writeFileSync(join(OUT_DIR, "apple-touch-icon.png"), drawIcon(180, 0.72));
console.log("Icons generated in", OUT_DIR);
