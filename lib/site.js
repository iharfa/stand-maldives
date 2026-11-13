// Server-side loaders for the public pages. cache() dedupes calls within one render.
import { cache } from "react";
import { Resorts, Figures, Settings } from "./db.js";
import { withDefaults } from "./content.js";

export const getContent = cache(async () => withDefaults(await Settings.all()));

// Plain JSON-safe rows for client components.
export const getSiteData = cache(async () => {
  const [resorts, figures, content] = await Promise.all([Resorts.list(), Figures.list(), getContent()]);
  return {
    content,
    resorts: resorts.map((r) => ({ id: r.id, name: r.name, atoll: r.atoll })),
    figures: figures.map((f) => ({
      id: f.id, resort_id: f.resort_id, year: f.year, month: f.month, amount: Number(f.amount), currency: f.currency,
      tier: f.tier, corroborations: f.corroborations, updated_at: new Date(f.updated_at).toISOString(),
    })),
  };
});
