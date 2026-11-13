// Display helpers for published figures. Client-safe (no server imports).
import { MON } from "./months.js";

export const TIERS = {
  unverified: { label: "Unverified", color: "#6B7479", dot: "transparent", bar: "#C9CFD3" },
  verified: { label: "Verified", color: "#C9401D", dot: "#C9401D", bar: "#EE5129" },
  admin: { label: "Admin verified", color: "#223B4B", dot: "#223B4B", bar: "#223B4B" },
};
export const TIER_KEYS = Object.keys(TIERS);
export const CURRENCIES = ["USD", "MVR"];

export const fmt = (v, c) => (c === "USD" ? "$" : "MVR ") + Math.round(v).toLocaleString("en-US");
export const fmtDate = (d) => {
  const x = new Date(d);
  return `${x.getDate()} ${MON[x.getMonth()]} ${x.getFullYear()}`;
};

export const toUsd = (f, rate) => (f.currency === "MVR" ? f.amount / rate : f.amount);
const toMvr = (usd, rate) => Math.round((usd * rate) / 10) * 10;

// mode: "Original" | "USD" | "MVR" (Site content → Display currency).
export function display(f, mode, rate) {
  const usd = toUsd(f, rate);
  if (mode === "USD") return { main: fmt(usd, "USD"), sub: f.currency === "MVR" ? "Reported in MVR" : "" };
  if (mode === "MVR") return { main: fmt(f.currency === "MVR" ? f.amount : toMvr(usd, rate), "MVR"), sub: f.currency === "USD" ? "Reported in USD" : "" };
  return { main: fmt(f.amount, f.currency), sub: f.currency === "MVR" ? "≈ " + fmt(usd, "USD") : "" };
}

// Money for averages / leaderboard, which are always computed in USD.
export const money = (usd, mode, rate) => (mode === "MVR" ? fmt(toMvr(usd, rate), "MVR") : fmt(usd, "USD"));
