"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { TIERS, TIER_KEYS, CURRENCIES, fmtDate } from "../../../lib/figures";
import { MONTHS } from "../../../lib/months";
import { api, useToast } from "../api";

const now = new Date();
const blank = { resort_id: "", year: now.getFullYear(), month: now.getMonth(), amount: "", currency: "USD", tier: "admin", corroborations: 1, payout: "" };

export default function FiguresAdmin({ resorts, figures }) {
  const router = useRouter();
  const [toast, Toast] = useToast();
  const [add, setAdd] = useState(blank);
  const [edit, setEdit] = useState(null);
  const [q, setQ] = useState("");
  const [year, setYear] = useState("all");
  const [busy, setBusy] = useState(false);
  const byId = Object.fromEntries(resorts.map((r) => [r.id, r]));
  const years = [...new Set(figures.map((f) => f.year))].sort((a, b) => b - a);
  const needle = q.trim().toLowerCase();
  const list = figures.filter((f) => (year === "all" || f.year === +year) && (!needle || byId[f.resort_id]?.name.toLowerCase().includes(needle)));
  const clash = add.resort_id && figures.find((f) => f.resort_id === +add.resort_id && f.year === +add.year && f.month === +add.month);

  async function run(fn, msg) {
    setBusy(true);
    try {
      await fn();
      toast(msg);
      router.refresh();
      return true;
    } catch (e) {
      toast(e);
    } finally {
      setBusy(false);
    }
  }

  const setA = (k) => (e) => setAdd({ ...add, [k]: e.target.value });
  const setE = (k) => (e) => setEdit({ ...edit, [k]: e.target.value });

  return (
    <div>
      <div className="admin-top">
        <div>
          <div className="eyebrow">Admin</div>
          <h1 className="admin-h1">Published figures</h1>
        </div>
      </div>

      <form className="panel stack" style={{ gap: 14, marginBottom: 32 }} onSubmit={async (e) => {
        e.preventDefault();
        if (clash && !confirm("A figure is already published for this resort and month. Replace it?")) return;
        if (await run(() => api("/api/admin/figures", "POST", add), "Figure published")) setAdd({ ...blank, resort_id: add.resort_id });
      }}>
        <h2 className="h2" style={{ fontSize: 22 }}>Add a figure</h2>
        <p className="muted" style={{ margin: 0, fontSize: 13 }}>Publishes straight to the site. Use Admin verified for figures you entered or confirmed yourself.</p>
        <div className="form-row">
          <label style={{ flex: 2, minWidth: 220 }}>Resort
            <select className="field" value={add.resort_id} onChange={setA("resort_id")} required>
              <option value="">Choose…</option>
              {resorts.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </label>
          <label>Month<select className="field" value={add.month} onChange={setA("month")}>{MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}</select></label>
          <label>Year<input className="field" type="number" value={add.year} onChange={setA("year")} /></label>
        </div>
        <div className="form-row">
          <label>Amount<input className="field" inputMode="decimal" value={add.amount} onChange={setA("amount")} required /></label>
          <label>Currency<select className="field" value={add.currency} onChange={setA("currency")}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</select></label>
          <label>Label<select className="field" value={add.tier} onChange={setA("tier")}>{TIER_KEYS.map((t) => <option key={t} value={t}>{TIERS[t].label}</option>)}</select></label>
          <label>Corroborations<input className="field" type="number" min={1} value={add.corroborations} onChange={setA("corroborations")} /></label>
        </div>
        {clash && <p className="danger" style={{ margin: 0, fontSize: 13 }}>This will replace the figure already published for that month.</p>}
        <div><button type="submit" className="btn btn-ink btn-sm" disabled={busy}>Publish figure</button></div>
      </form>

      <div className="form-row" style={{ marginBottom: 12 }}>
        <label style={{ flex: 2 }}><span className="sr-only">Search resorts</span><input className="field" type="search" placeholder="Search resorts" value={q} onChange={(e) => setQ(e.target.value)} /></label>
        <label style={{ flex: "0 0 160px" }}><span className="sr-only">Year</span>
          <select className="field" value={year} onChange={(e) => setYear(e.target.value)}>
            <option value="all">All years</option>
            {years.map((y) => <option key={y}>{y}</option>)}
          </select>
        </label>
        <span className="muted" style={{ fontSize: 13, paddingBottom: 12 }}>{list.length} figure{list.length === 1 ? "" : "s"}</span>
      </div>

      <div className="panel table-scroll" style={{ padding: 0 }}>
        <table className="admin-table">
          <thead><tr><th>Resort</th><th>Month</th><th>Amount</th><th>Label</th><th>Corrob.</th><th>Updated</th><th><span className="sr-only">Actions</span></th></tr></thead>
          <tbody>
            {list.map((f) => edit?.id === f.id ? (
              <tr key={f.id}>
                <td>{byId[f.resort_id]?.name}</td>
                <td>{MONTHS[f.month]} {f.year}</td>
                <td style={{ minWidth: 190 }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <input className="field" aria-label="Amount" inputMode="decimal" value={edit.amount} onChange={setE("amount")} />
                    <select className="field" aria-label="Currency" style={{ width: 80 }} value={edit.currency} onChange={setE("currency")}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</select>
                  </div>
                </td>
                <td><select className="field" aria-label="Label" value={edit.tier} onChange={setE("tier")}>{TIER_KEYS.map((t) => <option key={t} value={t}>{TIERS[t].label}</option>)}</select></td>
                <td><input className="field" aria-label="Corroborations" type="number" min={1} style={{ width: 70 }} value={edit.corroborations} onChange={setE("corroborations")} /></td>
                <td />
                <td style={{ whiteSpace: "nowrap" }}>
                  <button type="button" className="btn btn-ink btn-xs" disabled={busy} onClick={async () => (await run(() => api(`/api/admin/figures/${f.id}`, "PUT", edit), "Saved")) && setEdit(null)}>Save</button>{" "}
                  <button type="button" className="btn btn-line btn-xs" onClick={() => setEdit(null)}>Cancel</button>
                </td>
              </tr>
            ) : (
              <tr key={f.id}>
                <td>{byId[f.resort_id]?.name}</td>
                <td style={{ whiteSpace: "nowrap" }}>{MONTHS[f.month]} {f.year}</td>
                <td className="tnum" style={{ whiteSpace: "nowrap" }}>{f.currency === "USD" ? "$" : "MVR "}{f.amount.toLocaleString("en-US")}</td>
                <td style={{ color: TIERS[f.tier].color, whiteSpace: "nowrap" }}>{TIERS[f.tier].label}</td>
                <td className="tnum">{f.corroborations}</td>
                <td className="muted" style={{ whiteSpace: "nowrap" }}>{fmtDate(f.updated_at)}</td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <button type="button" className="btn btn-line btn-xs" onClick={() => setEdit({ ...f })}>Edit</button>{" "}
                  <button type="button" className="btn btn-danger btn-xs" disabled={busy} onClick={() => confirm(`Remove ${byId[f.resort_id]?.name}, ${MONTHS[f.month]} ${f.year} from the site?`) && run(() => api(`/api/admin/figures/${f.id}`, "DELETE"), "Figure removed")}>Remove</button>
                </td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={7} className="muted" style={{ padding: 32, textAlign: "center" }}>No published figures yet. Approve submissions in the review queue, or add one above.</td></tr>}
          </tbody>
        </table>
      </div>
      <Toast />
    </div>
  );
}
