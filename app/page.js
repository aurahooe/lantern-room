"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase } from "../lib/supabase";

export default function Home() {
  const [hour, setHour] = useState(null);
  const [slips, setSlips] = useState([]);
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      setReady(true);
      return;
    }
    sb.auth.getSession().then(({ data }) => {
      setSession(data.session || null);
      setReady(true);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
    sb.from("lantern_hours")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .then(({ data }) => setHour(data?.[0] || null));
    sb.from("lantern_slips")
      .select("id,title,body,created_at,author_id")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(40)
      .then(async ({ data }) => {
        const rows = data || [];
        const ids = [...new Set(rows.map((r) => r.author_id).filter(Boolean))];
        let map = {};
        if (ids.length) {
          const { data: people } = await sb
            .from("profiles")
            .select("id,handle,display_name")
            .in("id", ids);
          (people || []).forEach((p) => {
            map[p.id] = p;
          });
        }
        setSlips(rows.map((r) => ({ ...r, profiles: map[r.author_id] })));
      });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signOut() {
    const sb = getSupabase();
    if (sb) await sb.auth.signOut();
  }

  return (
    <div className="wrap">
      <header className="top">
        <div className="mark">
          Lantern Room
          <small>open all hours</small>
        </div>
        <nav className="topnav">
          {session ? (
            <>
              <Link className="btn ember" href="/desk">
                Write
              </Link>
              <button className="btn" onClick={signOut}>
                Sign out
              </button>
            </>
          ) : (
            <Link className="btn ember" href="/enter">
              Come in
            </Link>
          )}
        </nav>
      </header>

      <section className="hero">
        <div className="kicker">
          <span className="lamp" /> a living page
        </div>
        <h1>Something new lands every hour.</h1>
        <p className="lede">
          Not a feed. A room. The dispatch at the top is written on the hour.
          Anything you mark public sits on the table for anyone who walks in.
        </p>
      </section>

      <article className="hour-card">
        <div className="hour-meta">This hour {hour?.hour_key || "-"}</div>
        <h2>{hour?.title || (ready ? "The lamp is warming up." : "...")}</h2>
        <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{hour?.body || ""}</p>
      </article>

      <div className="grid">
        <section>
          <div className="kicker">On the table</div>
          <h2 style={{ fontFamily: "Fraunces, Georgia, serif", letterSpacing: "-0.03em" }}>
            Public slips
          </h2>
          {slips.length === 0 && (
            <p className="lede" style={{ fontSize: 16 }}>
              Empty for now. Leave a public note from the desk and it will appear here.
            </p>
          )}
          {slips.map((s, i) => (
            <article className="slip" key={s.id} style={{ animationDelay: `${i * 40}ms` }}>
              <div className="who">
                {s.profiles?.display_name || s.profiles?.handle || "a reader"} {" · "}
                {new Date(s.created_at).toLocaleString()}
              </div>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </article>
          ))}
        </section>
        <aside className="panel">
          <div className="kicker">House rules</div>
          <p>
            Sign in. Write. Keep it private if you want. Flip the public switch
            and the room keeps it. No likes. No scores. Just paper.
          </p>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>
            The hourly dispatch is filed automatically. Come back later and the
            heading will have changed.
          </p>
        </aside>
      </div>
    </div>
  );
}
