"use client";
import { useState } from "react";
import Link from "next/link";
import { TIERS, money, toUsd } from "../../../lib/figures";
import { MONTHS, monthsElapsed } from "../../../lib/months";

export default function LeaderboardView({ resorts, figures, site, text }) {
  const rate = Number(site.rate) || 15.42;
  const mode = site.displayCurrency;
  const years = [...new Set(figures.map((f) => f.year))].sort((a, b) => b - a);
  // Open on the newest year where some resort has the 3 months a yearly average needs.
  const ranked = years.find((y) => resorts.some((r) => figures.filter((f) => f.resort_id === r.id && f.year === y).length >= 3));
  const [year, setYear] = useState(ranked ?? years[0] ?? new Date().getFullYear());
  const [period, setPeriod] = useState("avg");

  const rows = resorts
    .map((r) => {
      const es = figures.filter((f) => f.resort_id === r.id && f.year === year);
      if (period === "avg") {
        if (es.length < 3) return null;
        return { r, v: es.reduce((a, f) => a + toUsd(f, rate), 0) / es.length, meta: `${es.length} months · ${es.filter((f) => f.tier !== "unverified").length} verified` };
      }
      const f = es.find((x) => x.month === +period);
      return f ? { r, v: toUsd(f, rate), meta: TIERS[f.tier].label } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.v - a.v)
    .slice(0, 10);
  const top = rows[0]?.v || 1;

  return (
    <section className="wrap section">
      <div className="eyebrow">{text.eyebrow}</div>
      <h1 className="display">{text.title}</h1>
      <p className="body" style={{ fontSize: 17, maxWidth: 600 }}>
        {period === "avg" ? `Resorts ranked by average monthly service charge across ${year}.` : `Resorts ranked by service charge paid for ${MONTHS[+period]} ${year}.`}
      </p>
      <div className="lb-controls">
        {years.length > 1 && (
          <div className="seg" role="group" aria-label="Year">
            {years.map((y) => <button key={y} type="button" aria-pressed={y === year} onClick={() => { setYear(y); setPeriod("avg"); }}>{y}</button>)}
          </div>
        )}
        <select className="field" value={period} onChange={(e) => setPeriod(e.target.value)} aria-label="Period">
          <option value="avg">Yearly average</option>
          {MONTHS.slice(0, monthsElapsed(year) || 12).map((m, i) => <option key={m} value={i}>{m}</option>)}
        </select>
      </div>
      <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {rows.map((x, n) => (
          <li key={x.r.id}>
            <Link href={`/resorts/${x.r.id}`} className="lb-row">
              <span className="lb-rank">{String(n + 1).padStart(2, "0")}</span>
              <span className="lb-name"><strong>{x.r.name}</strong><span className="muted" style={{ fontSize: 13 }}>{x.r.atoll} · {x.meta}</span></span>
              <span className="progress lb-bar" style={{ marginTop: 0 }} aria-hidden="true"><div style={{ width: `${Math.round((x.v / top) * 100)}%` }} /></span>
              <span className="lb-value">{money(x.v, mode, rate)}</span>
            </Link>
          </li>
        ))}
      </ol>
      {rows.length === 0 && (
        <div className="empty">
          <strong>Not enough published figures yet</strong>
          <span className="muted" style={{ fontSize: 14 }}>Yearly rankings need at least three reported months for a resort.</span>
        </div>
      )}
      <p className="muted" style={{ fontSize: 13, margin: "24px 0 0", lineHeight: 1.6 }}>Figures reported in MVR are converted at MVR {rate} to USD 1. {text.note}</p>
    </section>
  );
}
