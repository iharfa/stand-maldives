// Uploads. Evidence is PRIVATE: only moderators can open it, through /api/admin/evidence.
// Site images (the logo) are served publicly through /api/image/<name>.
// Files go to a private Vercel Blob store when BLOB_READ_WRITE_TOKEN is set, local data/ folders otherwise.
import { writeFile, readFile, mkdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const PROJECT_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const LOCAL_DIR = path.join(PROJECT_ROOT, "data", "files");

// Public forms stay under Vercel's ~4.5 MB request-body limit so people see our message, not a 413.
export const PUBLIC_MAX_BYTES = 4 * 1024 * 1024;

export class UploadError extends Error {}

const ascii = (b, from, to) => b.subarray(from, to).toString("latin1");
// The type is read from the file's own bytes, never its name or the browser's claim. No SVG/HTML: both can carry script.
export const TYPES = [
  { mime: "image/jpeg", ext: "jpg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: "image/png", ext: "png", test: (b) => ascii(b, 0, 8) === "\x89PNG\r\n\x1a\n" },
  { mime: "image/webp", ext: "webp", test: (b) => ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 12) === "WEBP" },
  { mime: "application/pdf", ext: "pdf", test: (b) => ascii(b, 0, 5) === "%PDF-" },
];
const sniff = (buf) => TYPES.find((t) => t.test(buf));
const newName = (ext) => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
const KEY = /^[\w-]+\.(jpg|png|webp|pdf)$/;
const mimeOf = (key) => TYPES.find((t) => t.ext === key.split(".").pop()).mime;

async function store(pathname, buf, mime) {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    await put(pathname, buf, { access: "private", contentType: mime, addRandomSuffix: false });
  } else {
    const file = path.join(LOCAL_DIR, pathname);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, buf);
  }
}

// Returns the file body (stream or buffer) or null. Callers must validate the name first.
async function load(pathname) {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { get } = await import("@vercel/blob");
    const res = await get(pathname, { access: "private" }).catch(() => null);
    return res?.statusCode === 200 ? res.stream : null;
  }
  return readFile(path.join(LOCAL_DIR, pathname)).catch(() => null);
}

// Private evidence. Returns the stored key ("<name>.<ext>"), which is what goes in the database.
export async function saveEvidence(file) {
  const buf = Buffer.from(await file.arrayBuffer());
  const type = sniff(buf);
  if (!type) throw new UploadError("Evidence must be a PDF, JPG, PNG or WebP file");
  const key = newName(type.ext);
  await store(`evidence/${key}`, buf, type.mime);
  return key;
}

// Returns { body, type } for a stored evidence key, or null.
export async function readEvidence(key) {
  if (!KEY.test(key)) return null;
  const body = await load(`evidence/${key}`);
  return body ? { body, type: mimeOf(key) } : null;
}

// Public site image (admin only). Returns the URL the site uses.
export async function saveImage(file) {
  if (file.size > PUBLIC_MAX_BYTES) throw new UploadError("Image is too large (max 4 MB)");
  const buf = Buffer.from(await file.arrayBuffer());
  const type = sniff(buf);
  if (!type || type.ext === "pdf") throw new UploadError("Only JPG, PNG or WebP images are allowed");
  const name = newName(type.ext);
  await store(`images/${name}`, buf, type.mime);
  return `/api/image/${name}`;
}

// Public read of a site image; never reaches the evidence folder.
export async function readImage(name) {
  if (!KEY.test(name) || name.endsWith(".pdf")) return null;
  const body = await load(`images/${name}`);
  return body ? { body, type: mimeOf(name) } : null;
}
