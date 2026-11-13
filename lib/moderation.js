// Review-queue actions (server only). The pure rules live in rules.js.
import { Submissions, Figures, Resorts } from "./db.js";
import { TIERS, TIER_KEYS, fmt } from "./figures.js";
import { combine, duplicatesOf, isOpen } from "./rules.js";
import { MONTHS } from "./months.js";
import { ValidationError, cleanPeriodAmount } from "./validate.js";

const fail = (m, status) => { throw new ValidationError(m, status); };
const entry = (text) => ({ time: new Date().toISOString(), text });

// Runs one admin action on submission `id`. Returns the saved submission.
export async function moderate(id, action, body = {}) {
  const s = await Submissions.get(id);
  if (!s) fail("Submission not found", 404);
  const log = [...(s.log || [])];
  const next = { ...s, log };
  const add = (t) => log.push(entry(t));
  const mustBeOpen = () => isOpen(s) || fail("This submission has already been reviewed. Reopen it first.");

  switch (action) {
    case "tier":
      if (!TIER_KEYS.includes(body.tier)) fail("Unknown label");
      if (body.tier === "verified" && !s.evidence?.length) fail("Verified needs evidence. Use Admin verified if you confirmed it yourself.");
      next.tier = body.tier;
      break;
    case "approve": {
      mustBeOpen();
      if (!s.resort_id || !(await Resorts.get(s.resort_id))) fail("Choose a resort for this submission first (Edit).");
      if (s.tier === "verified" && !s.evidence?.length) fail("Verified needs evidence.");
      const existing = await Figures.forMonth(s.resort_id, s.year, s.month);
      const out = combine(existing, s, s.tier);
      await Figures.upsert({ resort_id: s.resort_id, year: s.year, month: s.month, amount: s.amount, currency: s.currency, payout: s.payout, submission_id: s.id, tier: out.tier, corroborations: out.corroborations });
      next.status = "approved";
      add(`Approved and published as ${TIERS[out.tier].label}`);
      if (out.note) add(out.note);
      break;
    }
    case "reject":
      mustBeOpen();
      next.status = "rejected";
      add("Rejected");
      break;
    case "info":
      mustBeOpen();
      next.status = "info";
      add("Requested more information");
      break;
    case "reopen":
      if (isOpen(s)) fail("Already open");
      next.status = "pending";
      add("Reopened");
      break;
    case "merge": {
      mustBeOpen();
      const dupes = duplicatesOf(s, await Submissions.list());
      if (!dupes.length) fail("No duplicates to merge");
      for (const d of dupes) await Submissions.save({ ...d, status: "merged", log: [...(d.log || []), entry(`Merged into S-${20000 + s.id}`)] });
      next.corroborations = s.corroborations + dupes.reduce((a, d) => a + d.corroborations, 0);
      add(`Merged ${dupes.length} duplicate${dupes.length > 1 ? "s" : ""} · corroborated by ${next.corroborations}`);
      break;
    }
    case "flag":
      next.flagged = !s.flagged;
      add(next.flagged ? "Flagged for second review" : "Flag removed");
      break;
    case "note":
      next.note = String(body.note ?? "").slice(0, 5000);
      break;
    case "edit": {
      mustBeOpen();
      const resort = await Resorts.get(Number(body.resort_id));
      if (!resort) fail("Choose a resort.");
      const clean = { resort_id: resort.id, ...cleanPeriodAmount(body) };
      const changes = [];
      if (clean.resort_id !== s.resort_id) changes.push(`resort → ${resort.name}`);
      if (clean.year !== s.year || clean.month !== s.month) changes.push(`month → ${MONTHS[clean.month]} ${clean.year}`);
      if (clean.amount !== Number(s.amount) || clean.currency !== s.currency) changes.push(`amount → ${fmt(clean.amount, clean.currency)}`);
      if (clean.payout !== (s.payout || "")) changes.push(`payout → ${clean.payout || "not given"}`);
      Object.assign(next, clean);
      if (changes.length) add("Edited: " + changes.join(", "));
      break;
    }
    case "contacted":
      if (!s.email) fail("No contact email on this submission");
      add("Contacted contributor");
      break;
    case "delete":
      next.status = "deleted";
      add("Deleted");
      break;
    default:
      fail("Unknown action");
  }
  return Submissions.save(next);
}
