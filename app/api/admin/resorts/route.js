import { adminRoute, readJson } from "../../../../lib/adminApi";
import { Resorts } from "../../../../lib/db";
import { cleanResort } from "../../../../lib/validate";

export const POST = adminRoute(async (req) => Resorts.create(cleanResort(await readJson(req))));
