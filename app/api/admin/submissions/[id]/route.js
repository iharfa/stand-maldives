import { adminRoute, idParam, readJson } from "../../../../../lib/adminApi";
import { moderate } from "../../../../../lib/moderation";

// One endpoint for every review-queue action: { action, ...fields }. See lib/moderation.js.
export const PATCH = adminRoute(async (req, ctx) => {
  const { action, ...body } = await readJson(req);
  return moderate(await idParam(ctx), action, body);
});
