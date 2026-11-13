"use client";
import { useEffect, useRef } from "react";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
export const captchaEnabled = !!SITE_KEY;

let scriptReady;
function loadScript() {
  scriptReady ||= new Promise((resolve) => {
    if (window.turnstile) return resolve();
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.async = true;
    s.onload = resolve;
    document.head.appendChild(s);
  });
  return scriptReady;
}

// Cloudflare Turnstile. Almost always invisible; it only shows a box when Cloudflare wants an interaction.
// Renders nothing until NEXT_PUBLIC_TURNSTILE_SITE_KEY is set. Tokens are single use: bump resetKey after a failed submit.
export default function Captcha({ onToken, active = true, resetKey = 0 }) {
  const box = useRef(null);
  const trapped = useRef(false);
  const send = (t) => onToken(trapped.current ? "hp:1" : t);
  useEffect(() => {
    if (!SITE_KEY || !active) return;
    let widget;
    let gone = false;
    loadScript().then(() => {
      if (gone || !box.current) return;
      widget = window.turnstile.render(box.current, {
        sitekey: SITE_KEY,
        appearance: "interaction-only",
        callback: send,
        "expired-callback": () => send(""),
        "error-callback": () => send(""),
      });
    });
    return () => {
      gone = true;
      if (widget !== undefined) window.turnstile.remove(widget);
      onToken("");
    };
  }, [active, resetKey]);
  // Honeypot: invisible to people, bots fill it; the server then rejects the token.
  const trap = (e) => { trapped.current = !!e.target.value; send(""); };
  return SITE_KEY ? (
    <>
      <input name="website" onChange={trap} tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }} />
      <div ref={box} />
    </>
  ) : null;
}
