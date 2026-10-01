"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabase } from "../../lib/supabase";

export default function Enter() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [handle, setHandle] = useState("");
  const [mode, setMode] = useState("in");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function ensureProfile(sb, user) {
    const name = handle.trim() || email.split("@")[0];
    await sb.from("profiles").upsert({
      id: user.id,
      handle: name.replace(/[^a-z0-9_]+/gi, "").slice(0, 24) || "reader",
      display_name: name,
    });
  }

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setMsg("");
    setBusy(true);
    const sb = getSupabase();
    try {
      if (mode === "up") {
        const { data, error } = await sb.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user) await ensureProfile(sb, data.user);
        if (data.session) {
          router.push("/desk");
        } else {
          setMsg("If the room asks for confirmation, check your mail. Then come back in.");
        }
      } else {
        const { data, error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) await ensureProfile(sb, data.user);
        router.push("/desk");
      }
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="wrap">
      <header className="top">
        <Link className="mark" href="/">
          Lantern Room
          <small>the door</small>
        </Link>
      </header>
      <section className="hero">
        <div className="kicker">membership is just an email</div>
        <h1>{mode === "up" ? "Take a chair." : "Come back in."}</h1>
        <p className="lede">Nothing here is sold. Accounts keep your slips and the public wall honest.</p>
      </section>
      <form className="stack panel" onSubmit={submit} style={{ maxWidth: 420 }}>
        <input type="email" required placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" required minLength={6} placeholder="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {mode === "up" && (
          <input placeholder="a short name" value={handle} onChange={(e) => setHandle(e.target.value)} />
        )}
        <button className="btn ember" type="submit" disabled={busy}>
          {busy ? "…" : mode === "up" ? "Create account" : "Sign in"}
        </button>
        <button type="button" className="btn" onClick={() => setMode(mode === "up" ? "in" : "up")}>
          {mode === "up" ? "I already have a key" : "I need an account"}
        </button>
        {err && <div className="err">{err}</div>}
        {msg && <div className="ok">{msg}</div>}
      </form>
    </div>
  );
}
