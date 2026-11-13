import { test } from "node:test";
import assert from "node:assert/strict";
import { combine, duplicatesOf } from "./rules.js";
import { sanitizeSection } from "./content.js";

const sub = { id: 1, resort_id: 3, year: 2026, month: 7, amount: 900, currency: "USD", corroborations: 2, status: "pending" };

test("first figure for a month is published as is", () => {
  assert.deepEqual(combine(null, sub, "verified"), { tier: "verified", corroborations: 2, note: "" });
});

test("matching figure adds corroboration and keeps the stronger label", () => {
  const out = combine({ ...sub, tier: "admin", corroborations: 1 }, sub, "unverified");
  assert.equal(out.tier, "admin");
  assert.equal(out.corroborations, 3);
});

test("different amount replaces the published figure", () => {
  const out = combine({ ...sub, amount: 800, tier: "admin", corroborations: 4 }, sub, "verified");
  assert.equal(out.tier, "verified");
  assert.equal(out.corroborations, 2);
  assert.match(out.note, /Replaced the published figure of \$800/);
});

test("duplicates are open submissions with the same resort, month and amount", () => {
  const all = [sub, { ...sub, id: 2 }, { ...sub, id: 3, status: "rejected" }, { ...sub, id: 4, amount: 901 }, { ...sub, id: 5, currency: "MVR" }];
  assert.deepEqual(duplicatesOf(sub, all).map((d) => d.id), [2]);
});

test("content sanitizer keeps only known fields with the right types", () => {
  const out = sanitizeSection("site", { name: "X", rate: "16.5", showCorroboration: "yes", evil: "<script>", displayCurrency: "EUR" });
  assert.equal(out.name, "X");
  assert.equal(out.rate, 16.5);
  assert.equal(out.showCorroboration, true);
  assert.equal(out.displayCurrency, "Original");
  assert.equal("evil" in out, false);
  const home = sanitizeSection("home", { pillars: [{ title: "A", desc: "B", x: 1 }, "junk"], tiers: [{ label: "U" }] });
  assert.deepEqual(home.pillars, [{ title: "A", desc: "B" }]);
  assert.equal(home.tiers.length, 3);
});
