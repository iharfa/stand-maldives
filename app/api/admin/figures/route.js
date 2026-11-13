import { adminRoute, readJson } from "../../../../lib/adminApi";
import { Figures, Resorts } from "../../../../lib/db";
import { cleanFigure, ValidationError } from "../../../../lib/validate";

// Admin enters a figure directly (replaces any figure already published for that resort and month).
export const POST = adminRoute(async (req) => {
  const f = cleanFigure(await readJson(req));
  if (!(await Resorts.get(f.resort_id))) throw new ValidationError("Choose a resort.");
  return Figures.upsert(f);
});
