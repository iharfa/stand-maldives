import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAdmin } from "./auth";
import { ValidationError } from "./validate";

// Wraps an admin route handler: 401 when logged out, validation errors as JSON 4xx,
// and the public pages revalidated after any write so changes show up straight away.
export function adminRoute(fn) {
  return async (req, ctx) => {
    if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    try {
      const out = await fn(req, ctx);
      if (req.method !== "GET") revalidatePath("/", "layout");
      return out instanceof Response ? out : NextResponse.json(out ?? { ok: true });
    } catch (e) {
      if (e instanceof ValidationError) return NextResponse.json({ error: e.message }, { status: e.status });
      if (/duplicate key|unique/i.test(e.message)) return NextResponse.json({ error: "A resort with that name already exists." }, { status: 409 });
      throw e;
    }
  };
}

export const readJson = (req) => req.json().catch(() => ({}));
export const idParam = async (ctx) => Number((await ctx.params).id);
