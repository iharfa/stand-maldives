"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { display, fmtDate, toUsd } from "../../lib/figures";
import { MON, MONTHS, keyLabel, monthKey } from "../../lib/months";
import Tier from "../components/Tier";

const LIMIT = 60;
const TIER_CHIPS = [["all", "All"], ["admin", "Admin verified"], ["verified", "Verified"], ["unverified", "Unverified"]];

export default function DatabaseView({ resorts, figures, home, site }) {
  const byId = useMemo(() => Object.fromEntries(resorts.map((r) => [r.id, r])), [resorts]);
  const keys = useMemo(() => [...new Set(figures.map((f) => monthKey(f.year, f.month)))].sort((a, b) => b - a), [figures]);
  const atolls = useMemo(() => [...new Set(resorts.map((r) => r.atoll))].sort(), [resorts]);

  const [month, setMonth] = useState(keys.length ? String(keys[0]) : "all");
  const [q, setQ] = useState("");
  const [atoll, setAtoll] = useState("all");
  const [tier, setTier] = useState("all");
  const [sort, setSort] = useState("amount");

  const rate = Number(site.rate) || 15.42;
  const needle = q.trim().toLowerCase();
  const list = figures
    .filter((f) => byId[f.resort_id])
    .filter((f) => (month === "all" || monthKey(f.year, f.month) === +month) && (atoll === "all" || byId[f.resort_id].atoll === atoll) && (tier === "all" || f.tier === tier) && (!needle || byId[f.resort_id].name.toLowerCase().includes(needle)))
    .sort(
      sort === "name" ? (a, b) => byId[a.resort_id].name.localeCompare(byId[b.resort_id].name) || monthKey(b.year, b.month) - monthKey(a.year, a.month)
      : sort === "recent" ? (a, b) => b.updated_at.localeCompare(a.updated_at)
      : (a, b) => toUsd(b, rate) - toUsd(a, rate)
    );

  const ki = month === "all" ? -1 : keys.indexOf(+month);
  const filtersActive = !!needle || atoll !== "all" || tier !== "all";
  const title = month === "all" ? "All reported months" : keyLabel(+month);
  const tag = month === "all" ? "All months" : ki === 0 ? "Latest month · shown first" : "Showing month";
  const sub = month === "all"
    ? keys.length ? `${keyLabel(keys.at(-1))} – ${keyLabel(keys[0])}` : "No figures published yet"
    : `Service charge paid for this month · ${list.length} resort${list.length === 1 ? "" : "s"}`;

  return (
    <>
      <div className="month-head">
        <div className="stack" style={{ gap: 8 }}>
          <span className="eyebrow eyebrow-dot">{tag}</span>
          <h2 className="month-title" style={{ margin: 0 }} aria-live="polite">{title}</h2>
          <span className="muted" style={{ fontSize: 14 }}>{sub}</span>
        </div>
        <div className="month-nav">
          <button type="button" disabled={ki >= keys.length - 1} onClick={() => setMonth(String(keys[ki < 0 ? 0 : ki + 1]))}>← Previous month</button>
          <button type="button" disabled={ki <= 0} onClick={() => setMonth(String(keys[ki - 1]))}>Next month →</button>
        </div>
      </div>

      <div className="small-caps" style={{ fontWeight: 600, paddingTop: 4 }} id="filters-label">Filter data</div>
      <div className="filters" role="group" aria-labelledby="filters-label">
        <input className="field" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search resorts" aria-label="Search resorts" />
        <select className="field" value={month} onChange={(e) => setMonth(e.target.value)} aria-label="Month">
          <option value="all">All months</option>
          {keys.map((k) => <option key={k} value={k}>{MONTHS[k % 100]} {Math.floor(k / 100)}</option>)}
        </select>
        <select className="field" value={atoll} onChange={(e) => setAtoll(e.target.value)} aria-label="Atoll">
          <option value="all">All atolls</option>
          {atolls.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <select className="field" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
          <option value="amount">Sort: highest amount</option>
          <option value="name">Sort: resort A–Z</option>
          <option value="recent">Sort: recently updated</option>
        </select>
      </div>
      <div className="chips">
        <span id="tier-label" style={{ marginRight: 6 }}>Verification</span>
        <div role="group" aria-labelledby="tier-label" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {TIER_CHIPS.map(([v, l]) => (
            <button key={v} type="button" className="chip" aria-pressed={tier === v} onClick={() => setTier(v)}>{l}</button>
          ))}
        </div>
        {filtersActive && <button type="button" className="linkish" style={{ marginLeft: 8 }} onClick={() => { setQ(""); setAtoll("all"); setTier("all"); }}>Clear filters</button>}
        <span className="spacer" />
        <span>{list.length === 1 ? "1 figure" : `${list.length} figures${list.length > LIMIT ? ` · showing ${LIMIT}` : ""}`}</span>
      </div>

      <div className="ftable-head small-caps" aria-hidden="true">
        <div>Resort</div><div>Month</div><div className="right">Service charge</div><div>Verification</div><div className="right">Updated</div>
      </div>
      {list.slice(0, LIMIT).map((f) => {
        const r = byId[f.resort_id];
        const d = display(f, site.displayCurrency, rate);
        return (
          <Link key={f.id} href={`/resorts/${r.id}`} className="frow">
            <div className="fr-name"><strong>{r.name}</strong><span>{r.atoll}</span></div>
            <div className="fr-month">{MON[f.month]} {f.year}</div>
            <div className="fr-amount"><strong>{d.main}</strong>{d.sub && <span className="fr-sub">{d.sub}</span>}</div>
            <div className="fr-tier">
              <Tier tier={f.tier} />
              {site.showCorroboration && f.corroborations > 1 && <span className="fr-sub">Corroborated by {f.corroborations} contributors</span>}
            </div>
            <div className="fr-updated right tnum"><span className="m-only">Updated </span>{fmtDate(f.updated_at)}</div>
          </Link>
        );
      })}
      {list.length === 0 && (
        <div className="empty">
          <strong>{home.emptyTitle}</strong>
          <span className="muted" style={{ fontSize: 14 }}>{home.emptyBody}</span>
        </div>
      )}
    </>
  );
}
