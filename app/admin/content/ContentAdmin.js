"use client";
import { useState } from "react";
import { DEFAULTS, SECTIONS } from "../../../lib/content";
import { api, useToast } from "../api";

// Where each section shows up on the public site, for the "View page" link.
const PAGE = { site: "/", home: "/", resort: "/", leaderboard: "/leaderboard", submit: "/submit", terms: "/terms", moderation: "/moderation-policy", privacy: "/privacy" };

export default function ContentAdmin({ initial }) {
  const [tab, setTab] = useState("site");
  const [data, setData] = useState(initial);
  const [dirty, setDirty] = useState({});
  const [busy, setBusy] = useState(false);
  const [toast, Toast] = useToast();
  const section = SECTIONS[tab];
  const value = data[tab];
  const set = (key, v) => { setData((d) => ({ ...d, [tab]: { ...d[tab], [key]: v } })); setDirty((x) => ({ ...x, [tab]: true })); };

  async function save() {
    setBusy(true);
    try {
      const out = await api("/api/admin/settings", "POST", { key: tab, value });
      setData((d) => ({ ...d, [tab]: out.value }));
      setDirty((x) => ({ ...x, [tab]: false }));
      toast("Saved. The public site is updated.");
    } catch (e) {
      toast(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="admin-top">
        <div>
          <div className="eyebrow">Admin</div>
          <h1 className="admin-h1">Site content</h1>
        </div>
      </div>
      <div role="tablist" aria-label="Sections" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
        {Object.entries(SECTIONS).map(([k, s]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} className="chip" aria-pressed={tab === k} onClick={() => setTab(k)}>
            {s.label}{dirty[k] ? " •" : ""}
          </button>
        ))}
      </div>

      <div className="panel" role="tabpanel">
        {section.fields.map((f) => <FieldEditor key={tab + f.key} f={f} id={`${tab}-${f.key}`} value={value[f.key]} onChange={(v) => set(f.key, v)} toast={toast} />)}
        <div className="save-bar">
          <button type="button" className="btn btn-ink btn-sm" disabled={busy || !dirty[tab]} onClick={save}>{busy ? "Saving…" : `Save ${section.label}`}</button>
          <button type="button" className="btn btn-line btn-sm" onClick={() => { if (confirm(`Reset ${section.label} to the original text? You still need to save.`)) { setData((d) => ({ ...d, [tab]: DEFAULTS[tab] })); setDirty((x) => ({ ...x, [tab]: true })); } }}>Reset to defaults</button>
          <a href={PAGE[tab]} target="_blank" rel="noreferrer" style={{ fontSize: 13 }}>View page ↗</a>
          {dirty[tab] && <span className="muted" style={{ fontSize: 13 }}>Unsaved changes</span>}
        </div>
      </div>
      <Toast />
    </div>
  );
}

function FieldEditor({ f, id, value, onChange, toast }) {
  if (f.type === "checkbox") {
    return (
      <label className="check" style={{ marginBottom: 18 }}>
        <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />{f.label}
      </label>
    );
  }
  if (f.type === "list") return <ListEditor f={f} items={value || []} onChange={onChange} />;
  return (
    <div className="content-field">
      <label htmlFor={id}>{f.label}</label>
      {f.type === "textarea" ? <textarea id={id} className="field" rows={f.rows} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
        : f.type === "select" ? <select id={id} className="field" value={value} onChange={(e) => onChange(e.target.value)}>{f.options.map((o) => <option key={o}>{o}</option>)}</select>
        : f.type === "number" ? <input id={id} className="field" type="number" step={f.step} value={value ?? ""} onChange={(e) => onChange(e.target.value)} style={{ maxWidth: 200 }} />
        : f.type === "image" ? <ImageField id={id} value={value} onChange={onChange} toast={toast} />
        : <input id={id} className="field" value={value ?? ""} onChange={(e) => onChange(e.target.value)} />}
    </div>
  );
}

function ListEditor({ f, items, onChange }) {
  const update = (i, k, v) => onChange(items.map((it, j) => (j === i ? { ...it, [k]: v } : it)));
  const move = (i, d) => { const next = [...items]; [next[i], next[i + d]] = [next[i + d], next[i]]; onChange(next); };
  return (
    <fieldset className="content-field" style={{ border: 0, padding: 0, margin: "0 0 18px" }}>
      <legend className="form-label" style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>{f.label}</legend>
      {items.map((it, i) => (
        <div key={i} className="list-item">
          {f.fields.map((sf) => (
            <label key={sf.key} style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "var(--muted)" }}>
              {sf.label}
              {sf.type === "textarea"
                ? <textarea className="field" rows={sf.rows} value={it[sf.key] ?? ""} onChange={(e) => update(i, sf.key, e.target.value)} />
                : <input className="field" value={it[sf.key] ?? ""} onChange={(e) => update(i, sf.key, e.target.value)} />}
            </label>
          ))}
          {!f.fixed && (
            <div className="q-links">
              {i > 0 && <button type="button" onClick={() => move(i, -1)}>Move up</button>}
              {i < items.length - 1 && <button type="button" onClick={() => move(i, 1)}>Move down</button>}
              <button type="button" className="danger" onClick={() => onChange(items.filter((_, j) => j !== i))}>Remove</button>
            </div>
          )}
        </div>
      ))}
      {!f.fixed && <div><button type="button" className="btn btn-line btn-xs" onClick={() => onChange([...items, { ...f.blank }])}>+ Add item</button></div>}
    </fieldset>
  );
}

function ImageField({ id, value, onChange, toast }) {
  const [busy, setBusy] = useState(false);
  async function upload(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Upload failed");
      onChange(data.url);
    } catch (err) {
      toast(err);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
      <img src={value || "/logo.png"} alt="Current logo" width={56} height={56} style={{ objectFit: "contain", border: "1px solid var(--line)", background: "#fff" }} />
      <label className="btn btn-line btn-xs" style={{ cursor: "pointer" }}>
        {busy ? "Uploading…" : "Upload image"}
        <input id={id} type="file" accept="image/png,image/jpeg,image/webp" hidden disabled={busy} onChange={upload} />
      </label>
      {value && <button type="button" className="linkish" onClick={() => onChange("")}>Use default</button>}
    </div>
  );
}
