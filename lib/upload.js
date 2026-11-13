// Uploads (ported from zwm-site). Evidence is PRIVATE: only moderators can open it, through /api/admin/evidence.
// Site images (the logo) are public. DO Spaces when configured, local folders otherwise.
import { writeFile, readFile, mkdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const PROJECT_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const LOCAL_EVIDENCE_DIR = path.join(PROJECT_ROOT, "data", "evidence");

// Public forms stay under Vercel's ~4.5 MB request-body limit so people see our message, not a 413.
export const PUBLIC_MAX_BYTES = 4 * 1024 * 1024;

export class UploadError extends Error {}

async function spaces() {
  if (!process.env.DO_SPACES_KEY) return null;
  const { S3Client } = await import("@aws-sdk/client-s3");
  const { DO_SPACES_REGION: region = "sgp1", DO_SPACES_BUCKET: bucket } = process.env;
  const s3 = new S3Client({
    endpoint: `https://${region}.digitaloceanspaces.com`, region: "us-east-1",
    credentials: { accessKeyId: process.env.DO_SPACES_KEY, secretAccessKey: process.env.DO_SPACES_SECRET },
  });
  return { s3, bucket, cdn: process.env.DO_SPACES_CDN_URL || `https://${bucket}.${region}.cdn.digitaloceanspaces.com` };
}

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

// Private evidence. Returns the stored key ("<name>.<ext>"), which is what goes in the database.
export async function saveEvidence(file) {
  const buf = Buffer.from(await file.arrayBuffer());
  const type = sniff(buf);
  if (!type) throw new UploadError("Evidence must be a PDF, JPG, PNG or WebP file");
  const key = newName(type.ext);
  const sp = await spaces();
  if (sp) {
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    // No ACL = private; readable only with our credentials.
    await sp.s3.send(new PutObjectCommand({ Bucket: sp.bucket, Key: `stand/private/evidence/${key}`, Body: buf, ContentType: type.mime }));
  } else {
    await mkdir(LOCAL_EVIDENCE_DIR, { recursive: true });
    await writeFile(path.join(LOCAL_EVIDENCE_DIR, key), buf);
  }
  return key;
}

// Returns { body, type } for a stored evidence key, or null.
export async function readEvidence(key) {
  if (!/^[\w-]+\.(jpg|png|webp|pdf)$/.test(key)) return null;
  const type = TYPES.find((t) => t.ext === key.split(".").pop()).mime;
  const sp = await spaces();
  if (sp) {
    const { GetObjectCommand } = await import("@aws-sdk/client-s3");
    const res = await sp.s3.send(new GetObjectCommand({ Bucket: sp.bucket, Key: `stand/private/evidence/${key}` })).catch(() => null);
    return res ? { body: res.Body.transformToWebStream(), type } : null;
  }
  const body = await readFile(path.join(LOCAL_EVIDENCE_DIR, key)).catch(() => null);
  return body ? { body, type } : null;
}

// Public site image (admin only). Returns a URL.
export async function saveImage(file) {
  if (file.size > PUBLIC_MAX_BYTES) throw new UploadError("Image is too large (max 4 MB)");
  const buf = Buffer.from(await file.arrayBuffer());
  const type = sniff(buf);
  if (!type || type.ext === "pdf") throw new UploadError("Only JPG, PNG or WebP images are allowed");
  const name = newName(type.ext);
  const sp = await spaces();
  if (sp) {
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    await sp.s3.send(new PutObjectCommand({ Bucket: sp.bucket, Key: `stand/uploads/${name}`, Body: buf, ContentType: type.mime, ACL: "public-read" }));
    return `${sp.cdn}/stand/uploads/${name}`;
  }
  const dir = path.join(PROJECT_ROOT, "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), buf);
  return `/uploads/${name}`;
}
