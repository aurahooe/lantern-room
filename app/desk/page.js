"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabase } from "../../lib/supabase";

export default function Desk() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [mine, setMine] = useState([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    sb.auth.getSession().then(({ data }) => {
      if (!data.session) router.push("/enter");
      else {
        setSession(data.session);
        load(sb, data.session.user.id);
      }
    });
  }, [router]);

  async function load(sb, uid) {
    const { data } = await sb.from("lantern_slips").select("*").eq("author_id", uid).order("created_at", { ascending: false });
    setMine(data || []);
  }

  async function save(e) {
    e.preventDefault();
    setErr("");
    const sb = getSupabase();
    const { error } = await sb.from("lantern_slips").insert({
      author_id: session.user.id,
      title,
      body,
      is_public: isPublic,
    });
    if (error) setErr(error.message);
    else {
      setTitle("");
      setBody("");
      load(sb, session.user.id);
    }
  }

  async function toggle(slip) {
    const sb = getSupabase();
    await sb.from("lantern_slips").update({ is_public: !slip.is_public }).eq("id", slip.id);
    load(sb, session.user.id);
  }

  async function remove(id) {
    const sb = getSupabase();
    await sb.from("lantern_slips").delete().eq("id", id);
    load(sb, session.user.id);
  }

  if (!session) return null;

  return (
    <div className="wrap">
      <header className="top">
        <Link className="mark" href="/">
          Lantern Room
          <small>your desk</small>
        </Link>
        <nav className="topnav">
          <Link className="btn" href="/">Room</Link>
        </nav>
      </header>
      <section className="hero">
        <div className="kicker">write it down</div>
        <h1>Leave a slip.</h1>
      </section>
      <form className="stack panel" onSubmit={save}>
        <input required maxLength={140} placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea required maxLength={8000} placeholder="What is it." value={body} onChange={(e) => setBody(e.target.value)} />
        <label className="chk">
          <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
          Show this to the public
        </label>
        <button className="btn ember" type="submit">File it</button>
        {err && <div className="err">{err}</div>}
      </form>
      <section style={{ marginTop: 40 }}>
        <div className="kicker">your drawer</div>
        {mine.map((s) => (
          <article className="slip" key={s.id}>
            <div className="who">{s.is_public ? "public" : "private"} {" · "} {new Date(s.created_at).toLocaleString()}</div>
            <h3>{s.title}</h3>
            <p>{s.body}</p>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button className="btn" onClick={() => toggle(s)}>{s.is_public ? "Make private" : "Make public"}</button>
              <button className="btn" onClick={() => remove(s.id)}>Tear up</button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
