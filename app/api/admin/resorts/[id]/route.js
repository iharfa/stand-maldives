import { adminRoute, idParam, readJson } from "../../../../../lib/adminApi";
import { Resorts } from "../../../../../lib/db";
import { cleanResort, ValidationError } from "../../../../../lib/validate";

export const PUT = adminRoute(async (req, ctx) => {
  const row = await Resorts.update(await idParam(ctx), cleanResort(await readJson(req)));
  if (!row) throw new ValidationError("Resort not found", 404);
  return row;
});

// Also removes the resort's published figures (see Resorts.remove).
export const DELETE = adminRoute(async (req, ctx) => Resorts.remove(await idParam(ctx)));
