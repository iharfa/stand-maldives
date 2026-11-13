"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, useToast } from "../api";

export default function ResortsAdmin({ resorts }) {
  const router = useRouter();
  const [toast, Toast] = useToast();
  const [add, setAdd] = useState({ name: "", atoll: "" });
  const [edit, setEdit] = useState(null);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const atolls = [...new Set(resorts.map((r) => r.atoll))].sort();
  const needle = q.trim().toLowerCase();
  const list = resorts.filter((r) => !needle || r.name.toLowerCase().includes(needle) || r.atoll.toLowerCase().includes(needle));

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

  return (
    <div>
      <div className="admin-top">
        <div>
          <div className="eyebrow">Admin</div>
          <h1 className="admin-h1">Resorts</h1>
        </div>
      </div>

      <datalist id="atolls">{atolls.map((a) => <option key={a} value={a} />)}</datalist>
      <form className="panel form-row" style={{ marginBottom: 32 }} onSubmit={async (e) => {
        e.preventDefault();
        if (await run(() => api("/api/admin/resorts", "POST", add), "Resort added")) setAdd({ name: "", atoll: "" });
      }}>
        <label style={{ flex: 2 }}>Resort name<input className="field" value={add.name} onChange={(e) => setAdd({ ...add, name: e.target.value })} required /></label>
        <label>Atoll<input className="field" list="atolls" value={add.atoll} onChange={(e) => setAdd({ ...add, atoll: e.target.value })} required /></label>
        <button type="submit" className="btn btn-ink btn-sm" disabled={busy}>Add resort</button>
      </form>

      <div className="form-row" style={{ marginBottom: 12 }}>
        <label style={{ flex: 1 }}><span className="sr-only">Search</span><input className="field" type="search" placeholder="Search resorts or atolls" value={q} onChange={(e) => setQ(e.target.value)} /></label>
        <span className="muted" style={{ fontSize: 13, paddingBottom: 12 }}>{list.length} of {resorts.length}</span>
      </div>

      <div className="panel table-scroll" style={{ padding: 0 }}>
        <table className="admin-table">
          <thead><tr><th>Resort</th><th>Atoll</th><th>Published figures</th><th><span className="sr-only">Actions</span></th></tr></thead>
          <tbody>
            {list.map((r) => edit?.id === r.id ? (
              <tr key={r.id}>
                <td><input className="field" aria-label="Resort name" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></td>
                <td><input className="field" aria-label="Atoll" list="atolls" value={edit.atoll} onChange={(e) => setEdit({ ...edit, atoll: e.target.value })} /></td>
                <td className="tnum">{r.figures}</td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <button type="button" className="btn btn-ink btn-xs" disabled={busy} onClick={async () => (await run(() => api(`/api/admin/resorts/${r.id}`, "PUT", edit), "Saved")) && setEdit(null)}>Save</button>{" "}
                  <button type="button" className="btn btn-line btn-xs" onClick={() => setEdit(null)}>Cancel</button>
                </td>
              </tr>
            ) : (
              <tr key={r.id}>
                <td><a href={`/resorts/${r.id}`} target="_blank" rel="noreferrer">{r.name}</a></td>
                <td>{r.atoll}</td>
                <td className="tnum">{r.figures}</td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <button type="button" className="btn btn-line btn-xs" onClick={() => setEdit(r)}>Edit</button>{" "}
                  <button type="button" className="btn btn-danger btn-xs" disabled={busy}
                    onClick={() => confirm(`Delete ${r.name}?${r.figures ? ` Its ${r.figures} published figure${r.figures > 1 ? "s" : ""} will be removed from the site.` : ""} This cannot be undone.`) && run(() => api(`/api/admin/resorts/${r.id}`, "DELETE"), "Resort deleted")}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Toast />
    </div>
  );
}
