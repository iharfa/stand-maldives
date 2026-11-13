import { NextResponse } from "next/server";
import { Resorts, Submissions, ref } from "../../../lib/db";
import { isSubmittable } from "../../../lib/months";
import { CURRENCIES } from "../../../lib/figures";
import { captchaOk } from "../../../lib/turnstile";
import { saveEvidence, PUBLIC_MAX_BYTES, UploadError } from "../../../lib/upload";

const PAYOUTS = ["", "1st–31st", "20th–20th", "other"];
const MAX_FILES = 5;
const bad = (error, status = 400) => NextResponse.json({ error }, { status });

// Public: a worker reports a figure. It goes into the review queue, never straight onto the site.
export async function POST(req) {
  const form = await req.formData().catch(() => null);
  if (!form) return bad("Invalid form");
  const get = (k) => String(form.get(k) ?? "").trim();

  if (!(await captchaOk(get("captcha"), req))) return bad("Please wait a few minutes and try again.", 429);
  if (get("human") !== "yes") return bad("Please tick the confirmation box.");

  const resort = await Resorts.get(Number(get("resort_id")) || 0);
  if (!resort) return bad("Choose a resort from the list.");
  const year = Number(get("year")), month = Number(get("month"));
  if (!isSubmittable(year, month)) return bad("Choose a month that has already started.");
  const amount = Number(get("amount"));
  if (!(amount > 0 && amount < 1_000_000)) return bad("Enter the amount you received.");
  const currency = get("currency");
  if (!CURRENCIES.includes(currency)) return bad("Choose USD or MVR.");
  const payout = get("payout");
  if (!PAYOUTS.includes(payout)) return bad("Choose a payout period.");
  const email = get("email").slice(0, 200);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad("Enter a valid email, or leave it blank.");

  const files = form.getAll("evidence").filter((f) => typeof f === "object" && f.size > 0);
  if (files.length > MAX_FILES) return bad(`Attach up to ${MAX_FILES} files.`);
  if (files.reduce((a, f) => a + f.size, 0) > PUBLIC_MAX_BYTES) return bad("Evidence files are too large (4 MB in total).", 413);
  const evidence = [];
  try {
    for (const f of files) evidence.push({ key: await saveEvidence(f), name: String(f.name || "file").slice(0, 120) });
  } catch (e) {
    if (e instanceof UploadError) return bad(e.message);
    throw e;
  }

  const row = await Submissions.create({
    resort_id: resort.id, year, month, amount: Math.round(amount * 100) / 100, currency, payout, email, evidence,
    tier: evidence.length ? "verified" : "unverified",
  });
  return NextResponse.json({ ref: ref(row.id) });
}
