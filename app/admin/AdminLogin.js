"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
    if (res.ok) return router.refresh();
    setError((await res.json().catch(() => ({}))).error || "Incorrect password.");
    setBusy(false);
  }

  return (
    <div className="login">
      <form onSubmit={submit}>
        <img src="/logo.png" alt="" width={56} height={56} style={{ mixBlendMode: "multiply" }} />
        <h1 style={{ fontFamily: "var(--serif)", fontWeight: 400, fontSize: 28, margin: 0 }}>Admin login</h1>
        <p className="muted" style={{ margin: 0, fontSize: 14 }}>Stand Maldives moderation and site content</p>
        <label htmlFor="pw" className="sr-only">Password</label>
        <input id="pw" type="password" className="field field-lg" autoFocus autoComplete="current-password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="submit" className="btn btn-ink" disabled={busy || !password}>{busy ? "Checking…" : "Log in"}</button>
        {error && <p className="form-error" role="alert">{error}</p>}
      </form>
    </div>
  );
}
