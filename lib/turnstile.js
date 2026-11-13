// Spam protection for public forms and the admin login (ported from zwm-site).
// ponytail: in-memory per-instance limiter; move to the DB if bots rotate across instances.
const hits = new Map();
export function limited(ip, max = 5, windowMs = 600_000) {
  if (!ip) return false;
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (now - v[v.length - 1] > windowMs) hits.delete(k);
  return recent.length > max;
}

export const clientIp = (req) => req.headers.get("x-forwarded-for")?.split(",")[0].trim();

// Rate limit (5 posts / 10 min / IP), honeypot, then Cloudflare Turnstile when TURNSTILE_SECRET_KEY is set.
export async function captchaOk(token, req) {
  const ip = clientIp(req);
  if (limited(ip)) return false;
  if (typeof token === "string" && token.startsWith("hp:")) return false; // honeypot field was filled
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token || typeof token !== "string") return false;
  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set("remoteip", ip);
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body });
    return (await res.json()).success === true;
  } catch {
    return false;
  }
}
