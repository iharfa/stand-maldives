// Adds the starting list of resorts. Safe to re-run: existing names are skipped.
// Usage: npm run seed   (uses DATABASE_URL if set, otherwise data/local-db.json)
import { Resorts } from "../lib/db.js";

const RESORTS = [
  ["Soneva Fushi", "Baa Atoll"], ["Soneva Jani", "Noonu Atoll"], ["Four Seasons Landaa Giraavaru", "Baa Atoll"],
  ["Four Seasons Kuda Huraa", "North Malé Atoll"], ["Gili Lankanfushi", "North Malé Atoll"], ["One&Only Reethi Rah", "North Malé Atoll"],
  ["Cheval Blanc Randheli", "Noonu Atoll"], ["Waldorf Astoria Ithaafushi", "South Malé Atoll"], ["Conrad Maldives Rangali Island", "South Ari Atoll"],
  ["Kurumba Maldives", "North Malé Atoll"], ["Baros Maldives", "North Malé Atoll"], ["Anantara Kihavah", "Baa Atoll"],
  ["Six Senses Laamu", "Laamu Atoll"], ["Velaa Private Island", "Noonu Atoll"], ["Patina Maldives", "North Malé Atoll"],
  ["The Ritz-Carlton Maldives, Fari Islands", "North Malé Atoll"], ["Joali Maldives", "Raa Atoll"], ["Kudadoo Maldives", "Lhaviyani Atoll"],
  ["Hurawalhi Island Resort", "Lhaviyani Atoll"], ["Kuredu Island Resort", "Lhaviyani Atoll"], ["Komandoo Island Resort", "Lhaviyani Atoll"],
  ["Milaidhoo Maldives", "Baa Atoll"], ["Vakkaru Maldives", "Baa Atoll"], ["Amilla Maldives", "Baa Atoll"],
  ["Coco Bodu Hithi", "North Malé Atoll"], ["Taj Exotica", "South Malé Atoll"], ["Jumeirah Maldives Olhahali", "North Malé Atoll"],
  ["LUX* South Ari Atoll", "South Ari Atoll"], ["Constance Halaveli", "North Ari Atoll"], ["Velassaru Maldives", "South Malé Atoll"],
  ["Angsana Velavaru", "Dhaalu Atoll"], ["Niyama Private Islands", "Dhaalu Atoll"], ["Park Hyatt Hadahaa", "Gaafu Alifu Atoll"],
  ["Shangri-La Villingili", "Addu Atoll"], ["Kandima Maldives", "Dhaalu Atoll"], ["Sun Siyam Iru Fushi", "Noonu Atoll"],
  ["The St. Regis Vommuli", "Dhaalu Atoll"], ["Emerald Maldives", "Raa Atoll"], ["Bandos Maldives", "North Malé Atoll"],
  ["Centara Grand Island", "South Ari Atoll"], ["W Maldives", "North Ari Atoll"], ["Vilamendhoo Island Resort", "South Ari Atoll"],
  ["Hideaway Beach Resort", "Haa Alifu Atoll"], ["JW Marriott Maldives", "Shaviyani Atoll"],
];

const have = new Set((await Resorts.list()).map((r) => r.name));
let added = 0;
for (const [name, atoll] of RESORTS) if (!have.has(name)) await Resorts.create({ name, atoll }), added++;
console.log(`Resorts: ${added} added, ${have.size} already there.`);
