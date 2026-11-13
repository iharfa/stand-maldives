"use client";
import { useRef, useState } from "react";

// Fetch helper for the admin screens: JSON in, JSON out, throws with the server's message.
export async function api(url, method = "GET", body) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong");
  return data;
}

// const [toast, Toast] = useToast(); toast("Saved") or toast(error); render <Toast />.
export function useToast() {
  const [msg, setMsg] = useState(null);
  const timer = useRef();
  const toast = (m) => {
    const error = m instanceof Error;
    setMsg({ text: error ? m.message : m, error });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), error ? 5000 : 2400);
  };
  const Toast = () => (msg ? <div className={"toast" + (msg.error ? " error" : "")} role={msg.error ? "alert" : "status"}>{msg.text}</div> : null);
  return [toast, Toast];
}
