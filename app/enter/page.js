"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabase } from "../../lib/supabase";

export default function Enter() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("in");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setMsg("");
    const sb = getSupabase();
    if (!sb) {
      setErr("The room is missing its keys.");
      return;
    }
    if (mode === "up") {
      const { error } = await sb.auth.signUp({ email, password });
      if (error) setErr(error.message);
      else {
        setMsg("Check your email if confirmation is on. Otherwise you are in.");
        router.push("/desk");
      }
    } else {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) setErr(error.message);
      else router.push("/desk");
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
      </section>
      <form className="stack panel" onSubmit={submit} style={{ maxWidth: 420 }}>
        <input type="email" required placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" required minLength={6} placeholder="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="btn ember" type="submit">{mode === "up" ? "Create account" : "Sign in"}</button>
        <button type="button" className="btn" onClick={() => setMode(mode === "up" ? "in" : "up")}>
          {mode === "up" ? "I already have a key" : "I need an account"}
        </button>
        {err && <div className="err">{err}</div>}
        {msg && <div className="ok">{msg}</div>}
      </form>
    </div>
  );
}
