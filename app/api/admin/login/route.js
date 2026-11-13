import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { checkPassword, createSessionValue, COOKIE_NAME, SESSION_COOKIE_OPTIONS } from "../../../../lib/auth";
import { clientIp, limited } from "../../../../lib/turnstile";

export async function POST(req) {
  if (limited("login:" + clientIp(req), 10)) return NextResponse.json({ error: "Too many attempts. Try again in 10 minutes." }, { status: 429 });
  const body = await req.json().catch(() => null);
  if (!body?.password || !checkPassword(body.password)) return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  const jar = await cookies();
  jar.set(COOKIE_NAME, createSessionValue(), SESSION_COOKIE_OPTIONS);
  return NextResponse.json({ ok: true });
}
