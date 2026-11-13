// Pure review-queue rules, safe to import in the browser (tested in moderation.test.js).
import { TIER_KEYS, fmt } from "./figures.js";

export const OPEN = ["pending", "info"];
export const isOpen = (s) => OPEN.includes(s.status);

// Same resort, month and amount: an independent report of the same figure.
export const sameFigure = (a, b) =>
  a.resort_id === b.resort_id && a.year === b.year && a.month === b.month && Number(a.amount) === Number(b.amount) && a.currency === b.currency;

export const duplicatesOf = (s, all) => all.filter((o) => o.id !== s.id && isOpen(o) && sameFigure(o, s));

// What gets published when approving `sub` and `existing` is already published for that resort and month (or null).
// A matching figure is corroborated and keeps the stronger label; a different figure is replaced.
export function combine(existing, sub, tier) {
  if (existing && sameFigure(existing, sub)) {
    const stronger = TIER_KEYS.indexOf(existing.tier) > TIER_KEYS.indexOf(tier) ? existing.tier : tier;
    const corroborations = existing.corroborations + sub.corroborations;
    return { tier: stronger, corroborations, note: `Matched the published figure · corroborated by ${corroborations}` };
  }
  return {
    tier,
    corroborations: sub.corroborations,
    note: existing ? `Replaced the published figure of ${fmt(existing.amount, existing.currency)}` : "",
  };
}
