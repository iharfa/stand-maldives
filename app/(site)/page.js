import { getSiteData } from "../../lib/site";
import DatabaseView from "./DatabaseView";
import Link from "next/link";
import Tier from "../components/Tier";
import { fmtDate } from "../../lib/figures";

// Public pages are cached for 5 minutes; every admin save revalidates them straight away.
export const revalidate = 300;

const TIER_ORDER = ["unverified", "verified", "admin"];

export default async function Home() {
  const { content, resorts, figures } = await getSiteData();
  const { home, site } = content;
  const withData = new Set(figures.map((f) => f.resort_id)).size;
  const pct = resorts.length ? Math.round((withData / resorts.length) * 100) : 0;
  const months = new Set(figures.map((f) => f.year * 100 + f.month)).size;
  const last = figures.reduce((a, f) => (f.updated_at > a ? f.updated_at : a), "");
  return (
    <>
      <section className="wrap" style={{ paddingTop: 72, paddingBottom: 40 }}>
        <div className="eyebrow">{home.eyebrow}</div>
        <h1 className="display">{home.title}</h1>
        <div className="hero-grid">
          <div className="stack">
            <p className="lead">{home.intro1}</p>
            <p className="body">{home.intro2}</p>
            <div className="btn-row" style={{ marginTop: 8 }}>
              <Link href="/submit" className="btn btn-accent">{home.ctaPrimary}</Link>
              <Link href="/leaderboard" className="btn btn-ghost">{home.ctaSecondary}</Link>
            </div>
          </div>
          <ol className="pillars" style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {home.pillars.map((p, i) => (
              <li key={i} className="pillar">
                <span className="pillar-num">{String(i + 1).padStart(2, "0")}</span>
                <div><span className="pillar-title">{p.title}</span><span className="pillar-desc">{p.desc}</span></div>
              </li>
            ))}
          </ol>
        </div>
        <div className="stat-grid">
          <div className="stat-card">
            <span>Total resorts</span>
            <span className="big-num">{resorts.length}</span>
            <span>Resorts listed in the database</span>
          </div>
          <div className="stat-card">
            <span>Resorts with published figures</span>
            <span style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span className="big-num" style={{ color: "var(--accent-ink)" }}>{withData}</span>
              <span className="tnum" style={{ fontSize: 16 }}>of {resorts.length}</span>
            </span>
            <div className="progress" role="presentation"><div style={{ width: pct + "%" }} /></div>
            <span>{pct}% of resorts have at least one figure</span>
          </div>
          <div className="stat-card">
            <span>Published figures</span>
            <span className="big-num">{figures.length.toLocaleString("en-US")}</span>
            <span>Monthly figures across {months} month{months === 1 ? "" : "s"}</span>
          </div>
        </div>
        {last && <p className="muted" style={{ margin: "14px 0 0", fontSize: 12 }}>Last updated {fmtDate(last)}</p>}
      </section>

      <section className="wrap" style={{ paddingBottom: 80 }}>
        <DatabaseView resorts={resorts} figures={figures} home={home} site={site} />
      </section>

      <section className="verify">
        <div className="wrap verify-inner">
          <div>
            <div className="eyebrow">{home.verifyEyebrow}</div>
            <h2>{home.verifyTitle}</h2>
          </div>
          <div className="verify-grid">
            {home.tiers.slice(0, 3).map((t, i) => (
              <div key={i} className="verify-tier">
                <span style={{ fontSize: 14, fontWeight: 600 }}><Tier tier={TIER_ORDER[i]} label={t.label} /></span>
                <span className="muted" style={{ fontSize: 13 }}>{t.sub}</span>
                <p>{t.desc}</p>
              </div>
            ))}
            <p className="verify-note">{home.verifyNote}</p>
          </div>
        </div>
      </section>
    </>
  );
}
