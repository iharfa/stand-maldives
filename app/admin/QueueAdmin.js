"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { TIERS, TIER_KEYS, CURRENCIES, fmt } from "../../lib/figures";
import { MONTHS, MON } from "../../lib/months";
import { duplicatesOf, isOpen } from "../../lib/rules";
import { api, useToast } from "./api";

const STATUS = {
  pending: ["Pending", "#B06A1F"], info: ["Awaiting info", "#6B7479"], approved: ["Published", "#C9401D"],
  rejected: ["Rejected", "#8A2F2A"], merged: ["Merged", "#6B7479"], deleted: ["Deleted", "#8A2F2A"],
};
const when = (iso) => { const d = new Date(iso); return `${d.getDate()} ${MON[d.getMonth()]} · ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; };
const PAYOUT_LABEL = { "": "Not given", other: "Other" };

export default function QueueAdmin({ submissions, resorts, rate }) {
  const router = useRouter();
  const [toast, Toast] = useToast();
  const [tab, setTab] = useState("pending");
  const [selId, setSelId] = useState(null);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const byId = Object.fromEntries(resorts.map((r) => [r.id, r]));

  const list = submissions.filter((s) => (tab === "pending" ? isOpen(s) : !isOpen(s)));
  const nPending = submissions.filter(isOpen).length;
  const sel = list.find((s) => s.id === selId) || list[0];
  const resort = sel && byId[sel.resort_id];
  const dupes = sel && isOpen(sel) ? duplicatesOf(sel, submissions) : [];
  const status = (s) => (s.flagged ? ["Flagged · " + STATUS[s.status][0], "#8A2F2A"] : STATUS[s.status]);

  async function act(action, body = {}, done) {
    setBusy(true);
    try {
      await api(`/api/admin/submissions/${sel.id}`, "PATCH", { action, ...body });
      if (done) toast(done);
      setEditing(null);
      router.refresh();
    } catch (e) {
      toast(e);
    } finally {
      setBusy(false);
    }
  }

  // Opens the admin's own mail app; the server only records that contact was made.
  function mailto() {
    const subject = encodeURIComponent(`Your Stand Maldives submission ${sel.ref}`);
    const body = encodeURIComponent(`Hello,\n\nThank you for reporting the service charge for ${resort?.name || "your resort"} (${MONTHS[sel.month]} ${sel.year}). `);
    window.open(`mailto:${sel.email}?subject=${subject}&body=${body}`);
  }

  return (
    <div>
      <div className="admin-top">
        <div>
          <div className="eyebrow">Admin · not publicly accessible</div>
          <h1 className="admin-h1">Review queue</h1>
        </div>
        <div className="seg" role="group" aria-label="Show">
          <button type="button" aria-pressed={tab === "pending"} onClick={() => setTab("pending")}>Pending · {nPending}</button>
          <button type="button" aria-pressed={tab === "reviewed"} onClick={() => setTab("reviewed")}>Reviewed · {submissions.length - nPending}</button>
        </div>
      </div>

      <div className="queue">
        <ul className="queue-list">
          {list.map((s) => {
            const [label, color] = status(s);
            return (
              <li key={s.id}>
                <button type="button" className="queue-item" aria-current={s.id === sel?.id} onClick={() => { setSelId(s.id); setEditing(null); }}>
                  <span className="muted" style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 12 }}><span>{s.ref}</span><span>{when(s.created_at)}</span></span>
                  <span style={{ fontFamily: "var(--serif)", fontSize: 18 }}>{byId[s.resort_id]?.name || "Resort removed"}</span>
                  <span style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 13 }}>
                    <span style={{ color: "var(--body)" }}>{MONTHS[s.month]} {s.year} · {fmt(s.amount, s.currency)}</span>
                    <span style={{ color, fontWeight: 500 }}>{label}</span>
                  </span>
                </button>
              </li>
            );
          })}
          {list.length === 0 && <li className="muted" style={{ padding: "48px 20px", fontSize: 14, textAlign: "center" }}>Nothing here.</li>}
        </ul>

        {sel && (
          <div className="queue-detail">
            <div className="row-between" style={{ alignItems: "flex-start" }}>
              <div className="stack" style={{ gap: 8 }}>
                <span className="muted" style={{ fontSize: 13 }}>{sel.ref} · received {when(sel.created_at)}</span>
                <h2 style={{ fontFamily: "var(--serif)", fontWeight: 400, fontSize: 32, lineHeight: 1.1, margin: 0 }}>{resort?.name || "Resort removed"}</h2>
                <span style={{ fontSize: 14, color: "var(--body)" }}>{resort?.atoll}</span>
              </div>
              <span className="pill" style={{ color: status(sel)[1] }}>{status(sel)[0]}</span>
            </div>

            {dupes.length > 0 && (
              <div className="dupe">
                <span>Matches {dupes.length} other open submission{dupes.length > 1 ? "s" : ""} for the same resort, month and amount ({dupes.map((d) => d.ref).join(", ")}).</span>
                <button type="button" className="btn btn-accent btn-xs" disabled={busy} onClick={() => act("merge", {}, "Merged as corroborated")}>Merge as corroborated</button>
              </div>
            )}

            {editing ? (
              <EditForm s={editing} setS={setEditing} resorts={resorts} busy={busy} onCancel={() => setEditing(null)} onSave={() => act("edit", editing, "Saved")} />
            ) : (
              <div className="q-meta">
                <div><span className="small-caps">Month</span>{MONTHS[sel.month]} {sel.year}</div>
                <div>
                  <span className="small-caps">Amount</span>
                  <strong className="tnum" style={{ fontWeight: 500 }}>{fmt(sel.amount, sel.currency)}</strong>
                  {sel.currency === "MVR" && <span className="muted" style={{ fontSize: 12 }}>≈ {fmt(sel.amount / rate, "USD")}</span>}
                </div>
                <div><span className="small-caps">Payout period</span>{PAYOUT_LABEL[sel.payout] ?? sel.payout}</div>
                <div>
                  <span className="small-caps">Contributor</span>Anonymous
                  <span className="muted" style={{ fontSize: 12, wordBreak: "break-all" }}>{sel.email ? `Left a contact email: ${sel.email}` : "No contact details left"}</span>
                </div>
                {sel.corroborations > 1 && <div><span className="small-caps">Corroborations</span>{sel.corroborations}</div>}
              </div>
            )}

            <div className="stack" style={{ gap: 12 }}>
              <span className="small-caps">Evidence</span>
              {sel.evidence.map((e) => {
                const href = `/api/admin/evidence?k=${encodeURIComponent(e.key)}`;
                const isImg = !e.key.endsWith(".pdf");
                return (
                  <div key={e.key} className="evidence">
                    <a className="evidence-thumb" href={href} target="_blank" rel="noreferrer" aria-label={`Open ${e.name}`}>
                      {isImg ? <img src={href} alt="" /> : "PDF"}
                    </a>
                    <div className="stack" style={{ gap: 6 }}>
                      <span style={{ fontSize: 15, wordBreak: "break-all" }}>{e.name}</span>
                      <span className="muted" style={{ fontSize: 13 }}>Private storage · admins only</span>
                      <a href={href} target="_blank" rel="noreferrer" style={{ fontSize: 13 }}>Open document</a>
                    </div>
                  </div>
                );
              })}
              {!sel.evidence.length && <span style={{ fontSize: 14, color: "var(--body)" }}>No evidence attached. This figure can only be published as Unverified, or as Admin verified if you confirm it yourself.</span>}
            </div>

            {isOpen(sel) && !editing && (
              <div className="publish-box">
                <span id="label-choice" style={{ fontSize: 14, fontWeight: 500 }}>Publish with label</span>
                <div role="group" aria-labelledby="label-choice" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {TIER_KEYS.map((t) => {
                    const disabled = t === "verified" && !sel.evidence.length;
                    const on = sel.tier === t;
                    return (
                      <button key={t} type="button" className="chip" disabled={disabled || busy} aria-pressed={on} onClick={() => act("tier", { tier: t })}
                        style={{ height: 36, opacity: disabled ? 0.4 : 1, ...(on ? { background: TIERS[t].color, borderColor: TIERS[t].color, color: "#fff" } : {}) }}>
                        {TIERS[t].label}
                      </button>
                    );
                  })}
                </div>
                <div className="btn-row" style={{ marginTop: 6 }}>
                  <button type="button" className="btn btn-ink btn-sm" disabled={busy} onClick={() => act("approve", {}, "Published to the database")}>Approve and publish</button>
                  <button type="button" className="btn btn-danger btn-sm" disabled={busy} onClick={() => act("reject", {}, "Submission rejected")}>Reject</button>
                  <button type="button" className="btn btn-line btn-sm" disabled={busy || sel.status === "info"} onClick={() => { if (sel.email) mailto(); act("info", {}, sel.email ? "Marked as awaiting information" : "Held · no contact details to notify"); }}>Request more information</button>
                </div>
              </div>
            )}

            <div className="q-links">
              {isOpen(sel) && !editing && <button type="button" onClick={() => setEditing({ resort_id: sel.resort_id ?? "", year: sel.year, month: sel.month, amount: sel.amount, currency: sel.currency, payout: sel.payout || "" })}>Edit</button>}
              {!isOpen(sel) && sel.status !== "merged" && <button type="button" onClick={() => act("reopen", {}, "Reopened")}>Reopen</button>}
              <button type="button" onClick={() => act("flag")}>{sel.flagged ? "Remove flag" : "Flag for second review"}</button>
              {sel.email ? <button type="button" onClick={() => { mailto(); act("contacted"); }}>Contact contributor</button> : <span className="muted" style={{ fontSize: 13 }}>Anonymous · no contact details</span>}
              {sel.status !== "deleted" && <button type="button" className="danger" onClick={() => confirm(`Delete ${sel.ref}? It moves to Reviewed and can be reopened.`) && act("delete", {}, "Submission deleted")}>Delete</button>}
            </div>

            <div className="q-bottom">
              <div className="stack" style={{ gap: 10 }}>
                <label className="small-caps" htmlFor="note">Admin notes · internal</label>
                <textarea id="note" key={sel.id} className="field" rows={5} placeholder="Visible to admins only" defaultValue={sel.note}
                  onBlur={(e) => e.target.value !== (sel.note || "") && act("note", { note: e.target.value }, "Note saved")} />
              </div>
              <div className="stack" style={{ gap: 10 }}>
                <span className="small-caps">Audit trail</span>
                <div>
                  {[...sel.log].reverse().map((l, i) => (
                    <div key={i} className="log-row"><span className="muted">{when(l.time)}</span><span>{l.text}</span></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <Toast />
    </div>
  );
}

function EditForm({ s, setS, resorts, busy, onSave, onCancel }) {
  const set = (k) => (e) => setS({ ...s, [k]: e.target.value });
  return (
    <form className="panel stack" style={{ gap: 16 }} onSubmit={(e) => { e.preventDefault(); onSave(); }}>
      <div className="form-row">
        <label style={{ flex: 2, minWidth: 220 }}>Resort
          <select className="field" value={s.resort_id} onChange={set("resort_id")} required>
            <option value="">Choose…</option>
            {resorts.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </label>
        <label>Month
          <select className="field" value={s.month} onChange={set("month")}>{MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}</select>
        </label>
        <label>Year<input className="field" type="number" value={s.year} onChange={set("year")} /></label>
      </div>
      <div className="form-row">
        <label>Amount<input className="field" inputMode="decimal" value={s.amount} onChange={set("amount")} /></label>
        <label>Currency
          <select className="field" value={s.currency} onChange={set("currency")}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</select>
        </label>
        <label>Payout period
          <select className="field" value={s.payout} onChange={set("payout")}>
            <option value="">Not given</option><option value="1st–31st">1st – 31st</option><option value="20th–20th">20th – 20th</option><option value="other">Other</option>
          </select>
        </label>
      </div>
      <div className="btn-row">
        <button type="submit" className="btn btn-ink btn-sm" disabled={busy}>Save changes</button>
        <button type="button" className="btn btn-line btn-sm" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
