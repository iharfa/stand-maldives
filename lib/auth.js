import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const COOKIE_NAME = "stand_admin_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 14; // 14 days

// On a deployed host the dev defaults would leave admin open, so fail closed instead.
const DEPLOYED = !!process.env.VERCEL;

function secret() {
  return process.env.SESSION_SECRET || (DEPLOYED ? null : "dev-only-secret-change-me");
}

function sign(payload) {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

export function createSessionValue() {
  const exp = Date.now() + MAX_AGE_SECONDS * 1000;
  const payload = String(exp);
  return `${payload}.${sign(payload)}`;
}

export function isValidSessionValue(value) {
  if (!secret() || !value || typeof value !== "string" || !value.includes(".")) return false;
  const [payload, mac] = value.split(".");
  const expected = sign(payload);
  const a = Buffer.from(mac || "");
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  return Number(payload) > Date.now();
}

export function checkPassword(candidate) {
  const expected = process.env.ADMIN_PASSWORD || (DEPLOYED ? null : "changeme");
  if (!expected || !secret()) return false;
  const a = Buffer.from(String(candidate || ""));
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

// Server component / route handler helper — reads the cookie via next/headers.
export async function isAdmin() {
  const jar = await cookies();
  return isValidSessionValue(jar.get(COOKIE_NAME)?.value);
}

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: MAX_AGE_SECONDS,
};
