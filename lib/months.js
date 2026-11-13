// Month helpers shared by the server and the browser. Months are 0-based (0 = January) everywhere.
export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const MON = MONTHS.map((m) => m.slice(0, 3));

// Earliest year the public submit form offers.
export const FIRST_YEAR = 2025;

// Years a worker can report, newest first: FIRST_YEAR through the current year.
export function submittableYears(now = new Date()) {
  const out = [];
  for (let y = now.getFullYear(); y >= FIRST_YEAR; y--) out.push(y);
  return out;
}

// Months a worker can report for `year`: all 12 for past years, up to and including this month for the current year.
export function submittableMonths(year, now = new Date()) {
  const n = Number(year) === now.getFullYear() ? now.getMonth() + 1 : 12;
  return MONTHS.slice(0, n).map((label, value) => ({ value, label }));
}

export function isSubmittable(year, month, now = new Date()) {
  const y = Number(year), m = Number(month);
  if (!Number.isInteger(y) || !Number.isInteger(m) || m < 0 || m > 11) return false;
  if (y < FIRST_YEAR || y > now.getFullYear()) return false;
  return y < now.getFullYear() || m <= now.getMonth();
}

// Months that have happened so far in `year` (for "x of N months reported").
export function monthsElapsed(year, now = new Date()) {
  if (year < now.getFullYear()) return 12;
  if (year > now.getFullYear()) return 0;
  return now.getMonth() + 1;
}

export const monthKey = (year, month) => year * 100 + month;
export const keyLabel = (key) => `${MONTHS[key % 100]} ${Math.floor(key / 100)}`;
