"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { fmt } from "../../../lib/figures";
import { MONTHS, submittableMonths, submittableYears } from "../../../lib/months";
import Captcha from "../../components/Captcha";

const MAX_BYTES = 4 * 1024 * 1024;
const now = new Date();
const blank = { resortQuery: "", resortId: null, year: String(now.getFullYear()), month: String(now.getMonth()), amount: "", currency: "USD", payout: "", email: "", human: false };

export default function SubmitForm({ resorts, text }) {
  const [form, setForm] = useState(blank);
  const [files, setFiles] = useState([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(null);
  const [captcha, setCaptcha] = useState("");
  const [captchaKey, setCaptchaKey] = useState(0);
  const fileRef = useRef(null);
  const set = (p) => setForm((f) => ({ ...f, ...p }));

  // /submit?resort=<id> (from a resort page) preselects that resort.
  useEffect(() => {
    const r = resorts.find((x) => x.id === Number(new URLSearchParams(location.search).get("resort")));
    if (r) set({ resortId: r.id, resortQuery: r.name });
  }, [resorts]);

  const q = form.resortQuery.trim().toLowerCase();
  const matches = resorts.filter((r) => !q || r.name.toLowerCase().includes(q)).slice(0, 8);
  const picked = resorts.find((r) => r.id === form.resortId);
  const pick = (r) => { set({ resortId: r.id, resortQuery: r.name }); setOpen(false); };
  const showList = open && !picked && matches.length > 0;
  const months = submittableMonths(form.year);
  const total = files.reduce((a, f) => a + f.size, 0);

  const problem = !picked ? "Choose a resort to continue"
    : !(+form.amount > 0) ? "Enter the amount you received"
    : total > MAX_BYTES ? "Evidence files are over 4 MB in total"
    : !form.human ? "Tick the confirmation box"
    : "";
  const hint = problem || (files.length ? "Eligible for Verified after review" : "Will be reviewed as Unverified");

  function onKey(e) {
    if (!showList) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, matches.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    if (e.key === "Enter") { e.preventDefault(); pick(matches[active]); }
    if (e.key === "Escape") setOpen(false);
  }

  async function submit(e) {
    e.preventDefault();
    if (problem || busy) return;
    setBusy(true);
    setError("");
    const fd = new FormData();
    fd.set("resort_id", form.resortId);
    for (const k of ["year", "month", "amount", "currency", "payout", "email"]) fd.set(k, form[k]);
    fd.set("human", form.human ? "yes" : "");
    fd.set("captcha", captcha);
    files.forEach((f) => fd.append("evidence", f));
    try {
      const res = await fetch("/api/submit", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
      setDone({ ref: data.ref, resort: picked.name, month: `${MONTHS[+form.month]} ${form.year}`, amount: fmt(+form.amount, form.currency), evidence: files.length ? files.map((f) => f.name).join(", ") : "None", email: form.email, hadEvidence: files.length > 0 });
      scrollTo(0, 0);
    } catch (err) {
      setError(err.message);
      setCaptchaKey((k) => k + 1);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="stack" style={{ gap: 20, paddingTop: 24 }}>
        <div className="eyebrow">Received · {done.ref}</div>
        <h1 className="display" style={{ fontSize: 52, margin: 0 }}>{text.thanksTitle}</h1>
        <p className="body">{text.thanksBody} {done.hadEvidence ? "Because you attached evidence, it can be published as Verified." : "Without evidence it can be published as Unverified."}</p>
        <div className="receipt">
          <span className="muted">Resort</span><span>{done.resort}</span>
          <span className="muted">Month</span><span>{done.month}</span>
          <span className="muted">Amount</span><span className="tnum">{done.amount}</span>
          <span className="muted">Evidence</span><span style={{ wordBreak: "break-all" }}>{done.evidence}</span>
          <span className="muted">Submitted as</span><span>{done.email ? "Anonymous, with contact email" : "Anonymous"}</span>
        </div>
        <div className="btn-row" style={{ marginTop: 8 }}>
          <button type="button" className="btn btn-ink btn-sm" onClick={() => { setDone(null); setFiles([]); set({ amount: "", human: false }); }}>Submit another month</button>
          <Link href="/" className="btn btn-ghost btn-sm">Back to the database</Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="eyebrow">{text.eyebrow}</div>
      <h1 className="display" style={{ fontSize: 52, margin: "18px 0" }}>{text.title}</h1>
      <p className="body" style={{ margin: "0 0 48px", maxWidth: 520 }}>{text.intro}</p>

      <div className="form">
        <div className="form-field">
          <label htmlFor="resort">Resort</label>
          <input
            id="resort" className="field field-lg" autoComplete="off" placeholder="Start typing a resort name"
            role="combobox" aria-expanded={showList} aria-controls="resort-list" aria-autocomplete="list"
            aria-activedescendant={showList ? `resort-opt-${active}` : undefined} aria-describedby="resort-hint"
            value={form.resortQuery}
            onChange={(e) => { set({ resortQuery: e.target.value, resortId: null }); setOpen(true); setActive(0); }}
            onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 120)} onKeyDown={onKey}
          />
          {showList && (
            <ul className="combo" id="resort-list" role="listbox" aria-label="Resorts">
              {matches.map((r, i) => (
                <li key={r.id} id={`resort-opt-${i}`} role="option" aria-selected={i === active} onMouseDown={() => pick(r)}>
                  <span>{r.name}</span><span className="muted" style={{ fontSize: 13 }}>{r.atoll}</span>
                </li>
              ))}
            </ul>
          )}
          <span className="hint" id="resort-hint">{picked ? picked.atoll : "Choose from the list of Maldives resorts"}</span>
        </div>

        <div className="two">
          <div className="form-field">
            <label htmlFor="month">Month</label>
            <select id="month" className="field field-lg" value={form.month} onChange={(e) => set({ month: e.target.value })}>
              {months.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="year">Year</label>
            <select id="year" className="field field-lg" value={form.year} onChange={(e) => { const y = e.target.value; set({ year: y, month: String(Math.min(+form.month, submittableMonths(y).length - 1)) }); }}>
              {submittableYears().map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="amount">Service charge received</label>
          <div style={{ display: "flex", gap: 12 }}>
            <input id="amount" className="field field-lg tnum" inputMode="decimal" placeholder="0" style={{ flex: 1, fontSize: 18 }} value={form.amount} onChange={(e) => set({ amount: e.target.value.replace(/[^0-9.]/g, "") })} />
            <div className="seg" role="group" aria-label="Currency">
              {["USD", "MVR"].map((c) => <button key={c} type="button" style={{ width: 72, fontSize: 14, fontWeight: 500 }} aria-pressed={form.currency === c} onClick={() => set({ currency: c })}>{c}</button>)}
            </div>
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="payout">Payout period <span className="muted">· optional</span></label>
          <select id="payout" className="field field-lg" value={form.payout} onChange={(e) => set({ payout: e.target.value })} aria-describedby="payout-hint">
            <option value="">Not sure</option>
            <option value="1st–31st">1st – 31st of the month</option>
            <option value="20th–20th">20th – 20th</option>
            <option value="other">Other</option>
          </select>
          <span className="hint" id="payout-hint">Helps us compare resorts that pay on different cycles. Not shown publicly.</span>
        </div>

        <div className="form-field">
          <span className="form-label" id="evidence-label">Evidence <span className="muted">· optional, required for Verified</span></span>
          <button type="button" className="drop" aria-describedby="evidence-label" onClick={() => fileRef.current?.click()}>
            <span style={{ fontSize: 15, fontWeight: 500 }}>{text.evidenceTitle}</span>
            <span className="hint">{text.evidenceHint}</span>
          </button>
          <input ref={fileRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp" hidden
            onChange={(e) => { const add = [...e.target.files]; setFiles((fs) => [...fs, ...add].slice(0, 5)); e.target.value = ""; }} />
          {files.map((f, i) => (
            <div key={i} className="file-row">
              <span>{f.name}</span>
              <button type="button" className="linkish" onClick={() => setFiles((fs) => fs.filter((_, j) => j !== i))} aria-label={`Remove ${f.name}`}>Remove</button>
            </div>
          ))}
        </div>

        <div className="form-field">
          <label htmlFor="email">{text.emailLabel}</label>
          <input id="email" type="email" className="field field-lg" placeholder="you@example.com" value={form.email} onChange={(e) => set({ email: e.target.value })} aria-describedby="email-hint" />
          <span className="hint" id="email-hint">{text.emailHint}</span>
        </div>

        <label className="check">
          <input type="checkbox" checked={form.human} onChange={(e) => set({ human: e.target.checked })} />
          {text.humanLabel}
        </label>
        <Captcha onToken={setCaptcha} resetKey={captchaKey} />

        {error && <p className="form-error" role="alert">{error}</p>}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 20, paddingTop: 8 }}>
          <button type="submit" className="btn btn-ink" disabled={!!problem || busy}>{busy ? "Sending…" : "Send for review"}</button>
          <span className="hint" aria-live="polite">{hint}</span>
        </div>
      </div>
    </form>
  );
}
