import { adminRoute, idParam, readJson } from "../../../../../lib/adminApi";
import { Figures } from "../../../../../lib/db";
import { cleanFigureMeta, cleanPeriodAmount, ValidationError } from "../../../../../lib/validate";

export const PUT = adminRoute(async (req, ctx) => {
  const b = await readJson(req);
  const { amount, currency } = cleanPeriodAmount(b);
  const row = await Figures.update(await idParam(ctx), { amount, currency, ...cleanFigureMeta(b) });
  if (!row) throw new ValidationError("Figure not found", 404);
  return row;
});

export const DELETE = adminRoute(async (req, ctx) => Figures.remove(await idParam(ctx)));
