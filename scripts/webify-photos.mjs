/**
 * Turn a folder of camera-original photos into web-ready assets.
 *
 *   node scripts/webify-photos.mjs <srcDir> <outDirUnderPublic> [maxWidth]
 *
 * Handles JPEG/PNG directly, and Canon RAW (.CR3) by extracting the largest
 * embedded JPEG preview — CR3 is an ISO-BMFF container that carries full
 * preview JPEGs, so no RAW decoder is needed.
 *
 * Each photo is emitted twice: a WebP "slide" (default max 1600px) and a
 * WebP "thumb" (480px) for grid/preview use. Output is deliberately small —
 * these go on a public site, not into an archive.
 */
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const [srcDir, outRel, maxWidthArg] = process.argv.slice(2);
if (!srcDir || !outRel) {
  console.error('usage: node scripts/webify-photos.mjs <srcDir> <outDirUnderPublic> [maxWidth]');
  process.exit(1);
}
const MAX_W = Number(maxWidthArg) || 1600;
const THUMB_W = 480;
const outDir = path.join(process.cwd(), 'public', outRel);
fs.mkdirSync(outDir, { recursive: true });

/** Collect candidate embedded JPEGs from a RAW container by marker scanning. */
function embeddedJpegs(buf) {
  const out = [];
  for (let i = 0; i < buf.length - 3; i++) {
    // SOI followed by a valid marker byte
    if (buf[i] === 0xff && buf[i + 1] === 0xd8 && buf[i + 2] === 0xff) {
      const end = buf.indexOf(Buffer.from([0xff, 0xd9]), i + 2);
      if (end > i) {
        out.push({ start: i, len: end + 2 - i });
        i = end + 1; // don't rescan inside this one
      }
    }
  }
  return out.sort((a, b) => b.len - a.len).slice(0, 6);
}

/** Best decodable image buffer for a source file. */
async function sourceBuffer(file) {
  const buf = fs.readFileSync(file);
  const ext = path.extname(file).toLowerCase();
  if (ext !== '.cr3' && ext !== '.cr2' && ext !== '.nef' && ext !== '.arw') return buf;

  let best = null;
  for (const c of embeddedJpegs(buf)) {
    const slice = buf.subarray(c.start, c.start + c.len);
    try {
      const m = await sharp(slice).metadata();
      const area = (m.width || 0) * (m.height || 0);
      if (m.width >= 800 && (!best || area > best.area)) best = { slice, area, w: m.width, h: m.height };
    } catch {
      /* not a real JPEG — skip */
    }
  }
  return best ? best.slice : null;
}

const files = fs
  .readdirSync(srcDir, { withFileTypes: true })
  .flatMap((d) =>
    d.isDirectory()
      ? fs.readdirSync(path.join(srcDir, d.name)).map((f) => path.join(srcDir, d.name, f))
      : [path.join(srcDir, d.name)],
  )
  .filter((f) => /\.(jpe?g|png|cr3|cr2|nef|arw)$/i.test(f))
  .sort();

const report = [];
for (const file of files) {
  const base = path
    .basename(file, path.extname(file))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  try {
    const buf = await sourceBuffer(file);
    if (!buf) {
      console.log(`SKIP (no decodable preview): ${path.basename(file)}`);
      continue;
    }
    const pipeline = () => sharp(buf).rotate(); // rotate() honours EXIF orientation

    const slidePath = path.join(outDir, `${base}.webp`);
    const info = await pipeline()
      .resize({ width: MAX_W, height: MAX_W, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 74, effort: 5 })
      .toFile(slidePath);

    const thumbPath = path.join(outDir, `${base}-thumb.webp`);
    await pipeline()
      .resize({ width: THUMB_W, height: THUMB_W, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 70, effort: 5 })
      .toFile(thumbPath);

    report.push({
      name: base,
      src: (fs.statSync(file).size / 1048576).toFixed(1) + 'MB',
      out: Math.round(info.size / 1024) + 'KB',
      dim: `${info.width}x${info.height}`,
    });
  } catch (e) {
    console.log(`FAIL ${path.basename(file)}: ${e.message.slice(0, 80)}`);
  }
}

console.table(report);
const total = report.reduce((n, r) => n + parseInt(r.out), 0);
console.log(`${report.length} images -> public/${outRel} (${(total / 1024).toFixed(1)}MB of slides)`);
