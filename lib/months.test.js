import { test } from "node:test";
import assert from "node:assert/strict";
import { isSubmittable, submittableMonths, submittableYears } from "./months.js";

const now = new Date(2026, 10, 13); // 13 Nov 2026

test("current year offers months up to this month", () => {
  assert.equal(submittableMonths(2026, now).length, 11);
  assert.equal(submittableMonths(2026, now).at(-1).label, "November");
  assert.equal(submittableMonths(2025, now).length, 12);
});

test("years run from the current year back to 2025", () => {
  assert.deepEqual(submittableYears(now), [2026, 2025]);
});

test("rejects future months, old years and junk", () => {
  assert.equal(isSubmittable(2026, 10, now), true);
  assert.equal(isSubmittable(2026, 11, now), false);
  assert.equal(isSubmittable(2027, 0, now), false);
  assert.equal(isSubmittable(2024, 5, now), false);
  assert.equal(isSubmittable("2026", "x", now), false);
});
