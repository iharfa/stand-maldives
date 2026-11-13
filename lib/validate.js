// Validation for admin-entered figures and submission edits. Throws ValidationError with a message for the admin.
import { CURRENCIES, TIER_KEYS } from "./figures.js";

export class ValidationError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

const fail = (m) => { throw new ValidationError(m); };

// Year/month/amount/currency/payout shared by figures and submissions. Admins may enter any month up to next year.
export function cleanPeriodAmount(b) {
  const year = Number(b.year), month = Number(b.month), amount = Number(b.amount);
  if (!Number.isInteger(year) || year < 2000 || year > new Date().getFullYear() + 1) fail("Enter a valid year.");
  if (!Number.isInteger(month) || month < 0 || month > 11) fail("Choose a month.");
  if (!(amount > 0 && amount < 1_000_000)) fail("Enter an amount above zero.");
  if (!CURRENCIES.includes(b.currency)) fail("Currency must be USD or MVR.");
  return { year, month, amount: Math.round(amount * 100) / 100, currency: b.currency, payout: String(b.payout ?? "").slice(0, 40) };
}

export function cleanFigure(b) {
  const resort_id = Number(b.resort_id);
  if (!Number.isInteger(resort_id) || resort_id <= 0) fail("Choose a resort.");
  return { resort_id, ...cleanPeriodAmount(b), ...cleanFigureMeta(b) };
}

export function cleanFigureMeta(b) {
  if (!TIER_KEYS.includes(b.tier)) fail("Choose a verification label.");
  const corroborations = Number(b.corroborations ?? 1);
  if (!Number.isInteger(corroborations) || corroborations < 1 || corroborations > 999) fail("Corroborations must be a whole number from 1.");
  return { tier: b.tier, corroborations };
}

export function cleanResort(b) {
  const name = String(b.name ?? "").trim().slice(0, 120);
  const atoll = String(b.atoll ?? "").trim().slice(0, 80);
  if (!name) fail("Enter the resort name.");
  if (!atoll) fail("Enter the atoll.");
  return { name, atoll };
}
