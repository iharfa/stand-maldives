// Data layer: Neon Postgres when DATABASE_URL is set, JSON file fallback for local dev (same pattern as zwm-site).
import { neon } from "@neondatabase/serverless";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const PROJECT_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;

// ---------------------------------------------------------------------------
// Postgres schema (idempotent, run lazily once per cold start)
// ---------------------------------------------------------------------------
let schemaReady = null;
function ensureSchema() {
  if (!sql) return;
  schemaReady ||= (async () => {
    await sql`CREATE TABLE IF NOT EXISTS resorts (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      atoll TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now()
    )`;
    // One published figure per resort per month.
    await sql`CREATE TABLE IF NOT EXISTS figures (
      id SERIAL PRIMARY KEY,
      resort_id INT NOT NULL REFERENCES resorts(id) ON DELETE CASCADE,
      year INT NOT NULL,
      month INT NOT NULL,
      amount DOUBLE PRECISION NOT NULL,
      currency TEXT NOT NULL,
      tier TEXT NOT NULL,
      corroborations INT NOT NULL DEFAULT 1,
      payout TEXT DEFAULT '',
      submission_id INT,
      updated_at TIMESTAMPTZ DEFAULT now(),
      UNIQUE (resort_id, year, month)
    )`;
    await sql`CREATE TABLE IF NOT EXISTS submissions (
      id SERIAL PRIMARY KEY,
      resort_id INT REFERENCES resorts(id) ON DELETE SET NULL,
      year INT NOT NULL,
      month INT NOT NULL,
      amount DOUBLE PRECISION NOT NULL,
      currency TEXT NOT NULL,
      payout TEXT DEFAULT '',
      evidence JSONB DEFAULT '[]',
      email TEXT DEFAULT '',
      status TEXT DEFAULT 'pending',
      flagged BOOLEAN DEFAULT false,
      tier TEXT DEFAULT 'unverified',
      corroborations INT DEFAULT 1,
      note TEXT DEFAULT '',
      log JSONB DEFAULT '[]',
      created_at TIMESTAMPTZ DEFAULT now()
    )`;
    await sql`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value JSONB NOT NULL)`;
  })();
  return schemaReady;
}

// ---------------------------------------------------------------------------
// JSON fallback (local dev only; in-memory if the filesystem is read-only)
// ---------------------------------------------------------------------------
const FILE = path.join(PROJECT_ROOT, "data", "local-db.json");
let mem = null;
function load() {
  if (mem) return mem;
  mem = existsSync(FILE) ? JSON.parse(readFileSync(FILE, "utf8")) : { resorts: [], figures: [], submissions: [], settings: {}, nextId: 1 };
  return mem;
}
function save() {
  try {
    mkdirSync(path.dirname(FILE), { recursive: true });
    writeFileSync(FILE, JSON.stringify(mem, null, 2));
  } catch {}
}
const nextId = (db) => db.nextId++;
const now = () => new Date().toISOString();

// ---------------------------------------------------------------------------
// Resorts
// ---------------------------------------------------------------------------
export const Resorts = {
  list: async () => {
    await ensureSchema();
    if (sql) return sql`SELECT id, name, atoll FROM resorts ORDER BY name`;
    return [...load().resorts].sort((a, b) => a.name.localeCompare(b.name));
  },
  get: async (id) => {
    await ensureSchema();
    if (sql) return (await sql`SELECT id, name, atoll FROM resorts WHERE id = ${id}`)[0] || null;
    return load().resorts.find((r) => r.id === Number(id)) || null;
  },
  create: async ({ name, atoll }) => {
    await ensureSchema();
    if (sql) return (await sql`INSERT INTO resorts (name, atoll) VALUES (${name}, ${atoll}) RETURNING id, name, atoll`)[0];
    const db = load();
    if (db.resorts.some((r) => r.name.toLowerCase() === name.toLowerCase())) throw new Error("duplicate key: resort name");
    const row = { id: nextId(db), name, atoll };
    db.resorts.push(row);
    save();
    return row;
  },
  update: async (id, { name, atoll }) => {
    await ensureSchema();
    if (sql) return (await sql`UPDATE resorts SET name = ${name}, atoll = ${atoll} WHERE id = ${id} RETURNING id, name, atoll`)[0];
    const row = load().resorts.find((r) => r.id === Number(id));
    if (row) Object.assign(row, { name, atoll }), save();
    return row;
  },
  // Also deletes the resort's published figures; its submissions are kept with no resort.
  remove: async (id) => {
    await ensureSchema();
    if (sql) return void (await sql`DELETE FROM resorts WHERE id = ${id}`);
    const db = load();
    id = Number(id);
    db.resorts = db.resorts.filter((r) => r.id !== id);
    db.figures = db.figures.filter((f) => f.resort_id !== id);
    for (const s of db.submissions) if (s.resort_id === id) s.resort_id = null;
    save();
  },
};

// ---------------------------------------------------------------------------
// Published figures
// ---------------------------------------------------------------------------
export const Figures = {
  list: async () => {
    await ensureSchema();
    if (sql) return sql`SELECT * FROM figures ORDER BY year DESC, month DESC`;
    return [...load().figures].sort((a, b) => b.year - a.year || b.month - a.month);
  },
  forMonth: async (resort_id, year, month) => {
    await ensureSchema();
    if (sql) return (await sql`SELECT * FROM figures WHERE resort_id = ${resort_id} AND year = ${year} AND month = ${month}`)[0] || null;
    return load().figures.find((f) => f.resort_id === resort_id && f.year === year && f.month === month) || null;
  },
  // Insert, or replace the figure already published for that resort and month.
  upsert: async (f) => {
    await ensureSchema();
    const row = { payout: "", submission_id: null, corroborations: 1, ...f };
    if (sql) {
      return (await sql`INSERT INTO figures (resort_id, year, month, amount, currency, tier, corroborations, payout, submission_id, updated_at)
        VALUES (${row.resort_id}, ${row.year}, ${row.month}, ${row.amount}, ${row.currency}, ${row.tier}, ${row.corroborations}, ${row.payout}, ${row.submission_id}, now())
        ON CONFLICT (resort_id, year, month) DO UPDATE SET amount = EXCLUDED.amount, currency = EXCLUDED.currency, tier = EXCLUDED.tier,
          corroborations = EXCLUDED.corroborations, payout = EXCLUDED.payout, submission_id = EXCLUDED.submission_id, updated_at = now()
        RETURNING *`)[0];
    }
    const db = load();
    const existing = db.figures.find((x) => x.resort_id === row.resort_id && x.year === row.year && x.month === row.month);
    if (existing) Object.assign(existing, row, { id: existing.id, updated_at: now() });
    else db.figures.push({ ...row, id: nextId(db), updated_at: now() });
    save();
    return existing || db.figures.at(-1);
  },
  update: async (id, { amount, currency, tier, corroborations }) => {
    await ensureSchema();
    if (sql) {
      return (await sql`UPDATE figures SET amount = ${amount}, currency = ${currency}, tier = ${tier}, corroborations = ${corroborations},
        updated_at = now() WHERE id = ${id} RETURNING *`)[0];
    }
    const row = load().figures.find((f) => f.id === Number(id));
    if (row) Object.assign(row, { amount, currency, tier, corroborations, updated_at: now() }), save();
    return row;
  },
  remove: async (id) => {
    await ensureSchema();
    if (sql) return void (await sql`DELETE FROM figures WHERE id = ${id}`);
    const db = load();
    db.figures = db.figures.filter((f) => f.id !== Number(id));
    save();
  },
};

// ---------------------------------------------------------------------------
// Submissions (the review queue)
// ---------------------------------------------------------------------------
export const Submissions = {
  list: async () => {
    await ensureSchema();
    if (sql) return sql`SELECT * FROM submissions ORDER BY created_at DESC`;
    return [...load().submissions].sort((a, b) => b.id - a.id);
  },
  get: async (id) => {
    await ensureSchema();
    if (sql) return (await sql`SELECT * FROM submissions WHERE id = ${id}`)[0] || null;
    return load().submissions.find((s) => s.id === Number(id)) || null;
  },
  create: async (d) => {
    await ensureSchema();
    const log = JSON.stringify([{ time: now(), text: d.evidence.length ? "Received with evidence" : "Received without evidence" }]);
    if (sql) {
      return (await sql`INSERT INTO submissions (resort_id, year, month, amount, currency, payout, evidence, email, tier, log)
        VALUES (${d.resort_id}, ${d.year}, ${d.month}, ${d.amount}, ${d.currency}, ${d.payout}, ${JSON.stringify(d.evidence)}, ${d.email}, ${d.tier}, ${log})
        RETURNING *`)[0];
    }
    const db = load();
    const row = { id: nextId(db), ...d, status: "pending", flagged: false, corroborations: 1, note: "", log: JSON.parse(log), created_at: now() };
    db.submissions.push(row);
    save();
    return row;
  },
  // Writes the mutable fields of a full row (read it with get, change it, save it back).
  save: async (s) => {
    await ensureSchema();
    if (sql) {
      return (await sql`UPDATE submissions SET resort_id = ${s.resort_id}, year = ${s.year}, month = ${s.month}, amount = ${s.amount}, currency = ${s.currency},
        payout = ${s.payout}, email = ${s.email}, status = ${s.status}, flagged = ${s.flagged}, tier = ${s.tier}, corroborations = ${s.corroborations},
        note = ${s.note}, log = ${JSON.stringify(s.log)} WHERE id = ${s.id} RETURNING *`)[0];
    }
    const db = load();
    const i = db.submissions.findIndex((x) => x.id === Number(s.id));
    if (i === -1) return null;
    db.submissions[i] = { ...db.submissions[i], ...s };
    save();
    return db.submissions[i];
  },
};

// ---------------------------------------------------------------------------
// Settings (site content, see lib/content.js)
// ---------------------------------------------------------------------------
export const Settings = {
  all: async () => {
    await ensureSchema();
    if (sql) return Object.fromEntries((await sql`SELECT key, value FROM settings`).map((r) => [r.key, r.value]));
    return load().settings;
  },
  set: async (key, value) => {
    await ensureSchema();
    if (sql) {
      await sql`INSERT INTO settings (key, value) VALUES (${key}, ${JSON.stringify(value)}) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`;
      return value;
    }
    load().settings[key] = value;
    save();
    return value;
  },
};

// Public reference shown to contributors and moderators.
export const ref = (id) => `S-${20000 + Number(id)}`;
