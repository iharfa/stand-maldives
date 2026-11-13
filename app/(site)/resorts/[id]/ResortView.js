"use client";
import { useState } from "react";
import Link from "next/link";
import { TIERS, display, fmtDate, money, toUsd } from "../../../../lib/figures";
import { MON, MONTHS, monthsElapsed } from "../../../../lib/months";
import Tier from "../../../components/Tier";

export default function ResortView({ resort, figures, site, text }) {
  const rate = Number(site.rate) || 15.42;
  const mode = site.displayCurrency;
  const years = [...new Set(figures.map((f) => f.year))].sort((a, b) => b - a);
  const [year, setYear] = useState(years[0]);
  const latest = figures[0]; // figures arrive newest month first
  const yr = figures.filter((f) => f.year === year);
  const maxUsd = Math.max(1, ...figures.map((f) => toUsd(f, rate)));
  const avg = yr.length ? yr.reduce((a, f) => a + toUsd(f, rate), 0) / yr.length : 0;
  const hi = [...yr].sort((a, b) => toUsd(b, rate) - toUsd(a, rate))[0];
  const showC = (f) => site.showCorroboration && f.corroborations > 1;

  return (
    <section className="wrap" style={{ paddingTop: 40, paddingBottom: 96 }}>
      <Link href="/" style={{ fontSize: 13 }}>{text.backLink}</Link>
      <div className="resort-head">
        <div>
          <span className="eyebrow">{resort.atoll}</span>
          <h1>{resort.name}</h1>
        </div>
        {latest && (
          <div className="resort-latest">
            <span className="muted" style={{ fontSize: 13 }}>Latest · {MONTHS[latest.month]} {latest.year}</span>
            <strong>{display(latest, mode, rate).main}</strong>
            <Tier tier={latest.tier} />
          </div>
        )}
      </div>

      {latest ? (
        <>
          <div className="row-between">
            <h2 className="h2">{year} at a glance</h2>
            {years.length > 1 && (
              <div className="seg" role="group" aria-label="Year">
                {years.map((y) => <button key={y} type="button" aria-pressed={y === year} onClick={() => setYear(y)}>{y}</button>)}
              </div>
            )}
          </div>
          <div className="kpis">
            <div className="kpi">Monthly average<strong>{yr.length ? money(avg, mode, rate) : "None"}</strong></div>
            <div className="kpi">Highest month<strong>{hi ? money(toUsd(hi, rate), mode, rate) : "None"}</strong>{hi && MONTHS[hi.month]}</div>
            <div className="kpi">Months reported<strong>{yr.length} of {monthsElapsed(year) || 12}</strong></div>
            <div className="kpi">Verified or admin verified<strong>{Math.round((yr.filter((f) => f.tier !== "unverified").length / yr.length) * 100)}%</strong></div>
          </div>

          <figure className="chart" style={{ margin: 0 }}>
            <div className="bars" role="img" aria-label={`Monthly service charge in ${year}, USD equivalent. Exact figures are in the table below.`}>
              {MON.map((l, m) => {
                const f = yr.find((x) => x.month === m);
                const usd = f ? toUsd(f, rate) : 0;
                return (
                  <div key={l} className="bar" title={f ? `${MONTHS[m]}: ${money(usd, mode, rate)}` : `${MONTHS[m]}: no figure`}>
                    <span>{f ? money(usd, mode, rate).replace("MVR ", "") : ""}</span>
                    <div style={{ height: `${Math.round((usd / maxUsd) * 82)}%`, background: f ? TIERS[f.tier].bar : "transparent" }} />
                  </div>
                );
              })}
            </div>
            <div className="bar-labels" aria-hidden="true">{MON.map((l) => <span key={l}>{l}</span>)}</div>
            <figcaption className="legend">
              <span><i style={{ background: TIERS.admin.bar }} />Admin verified</span>
              <span><i style={{ background: TIERS.verified.bar }} />Verified</span>
              <span><i style={{ background: TIERS.unverified.bar }} />Unverified</span>
              <span style={{ flex: 1 }} />
              <span>Bars shown in USD equivalent</span>
            </figcaption>
          </figure>

          <div className="rtable-head small-caps" aria-hidden="true">
            <div>Month</div><div className="right">Service charge</div><div>Verification</div><div className="right">Updated</div>
          </div>
          {yr.map((f) => {
            const d = display(f, mode, rate);
            return (
              <div key={f.id} className="rrow">
                <div style={{ fontSize: 15 }}>{MONTHS[f.month]} {f.year}</div>
                <div className="fr-amount"><strong style={{ fontSize: 16 }}>{d.main}</strong>{d.sub && <span className="fr-sub">{d.sub}</span>}</div>
                <div className="fr-tier">
                  <Tier tier={f.tier} />
                  {showC(f) && <span className="fr-sub">Corroborated by {f.corroborations} contributors</span>}
                </div>
                <div className="right muted tnum" style={{ fontSize: 13 }}>{fmtDate(f.updated_at)}</div>
              </div>
            );
          })}
        </>
      ) : (
        <div className="stack" style={{ padding: "72px 0", maxWidth: 560, alignItems: "flex-start" }}>
          <span style={{ fontFamily: "var(--serif)", fontSize: 30, lineHeight: 1.2 }}>{text.emptyTitle}</span>
          <span className="body" style={{ fontSize: 15 }}>{text.emptyBody}</span>
          <Link href={`/submit?resort=${resort.id}`} className="btn btn-ink btn-sm" style={{ marginTop: 8 }}>{text.emptyCta} {resort.name}</Link>
        </div>
      )}
    </section>
  );
}
