"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { CameraInfo } from "@/components/MountainGL";
import PeakLabels from "@/components/PeakLabels";

const MountainGL = dynamic(() => import("@/components/MountainGL"), { ssr: false });

/* ─── Social links ────────────────────────────────────────────── */
const TELEGRAM  = "https://t.me/+AJ4r6fjsQdRhMWEx";
const INSTAGRAM = "https://www.instagram.com/openclawslc?igsh=b3RjdmVhd2hlY3p3&utm_source=qr";
const X_URL     = "https://x.com/openclawslc";
const LUMA      = "https://lu.ma/openclawslc";

/* ─── Shared styles ───────────────────────────────────────────── */
const BEBAS: React.CSSProperties = { fontFamily:"'Bebas Neue',sans-serif", letterSpacing:"0.02em" };
const MONO: React.CSSProperties  = { fontFamily:"'JetBrains Mono','Fira Code','Courier New',monospace" };
const primaryBtn: React.CSSProperties = {
  padding:"13px 28px", background:"#2563EB", color:"#fff",
  fontSize:"0.62rem", letterSpacing:"0.18em", textTransform:"uppercase",
  fontWeight:700, textDecoration:"none", transition:"background 0.15s",
};
const ghostBtn: React.CSSProperties = {
  padding:"13px 28px", background:"transparent", color:"rgba(255,255,255,0.45)",
  fontSize:"0.62rem", letterSpacing:"0.18em", textTransform:"uppercase",
  fontWeight:600, textDecoration:"none", border:"1px solid rgba(255,255,255,0.14)",
  transition:"border-color 0.15s, color 0.15s",
};

/* ─── Reveal fade ─────────────────────────────────────────────── */
function useFade(delay = 0) {
  const ref = useRef<HTMLElement>(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const o = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setV(true); o.disconnect(); } },
      { threshold: 0.04 }
    );
    if (ref.current) o.observe(ref.current);
    return () => o.disconnect();
  }, []);
  return {
    ref,
    style: {
      opacity: v ? 1 : 0,
      transform: v ? "none" : "translateY(22px)",
      transition: `opacity 0.9s ease ${delay}s, transform 0.9s ease ${delay}s`,
    } as React.CSSProperties,
  };
}

/* ─── Events data ─────────────────────────────────────────────── */
const EVENTS = [
  { date:"MAR 20", title:"AI Agents & Crypto Infrastructure", type:"Meetup"      },
  { date:"APR 10", title:"DeFi × AI: The New Stack",          type:"Panel"       },
  { date:"APR 24", title:"Founders Roundtable",               type:"Invite Only" },
  { date:"MAY 08", title:"Builder Demo Night",                 type:"Open"        },
];

/* ─── Media / Writing data ────────────────────────────────────── */
const ARTICLES = [
  {
    tag:     "GUIDE",
    date:    "MAR 2026",
    title:   "OpenClaw Setup Best Practices",
    excerpt: "A production-grade walkthrough for deploying OpenClaw with security hardening, memory architecture, and multi-device agent continuity.",
    href:    "/articles/openclaw-setup",
    featured: true,
  },
  {
    tag:     "DEEP DIVE",
    date:    "MAR 2026",
    title:   "AI Agents in the Wasatch: Why SLC Is Quietly Winning",
    excerpt: "How Salt Lake City's unusual mix of fintech, defense, and crypto talent is producing some of the most interesting agent infrastructure startups in the country.",
    href:    "#",
    featured: false,
  },
  {
    tag:     "OPS",
    date:    "FEB 2026",
    title:   "Running Agents Locally Without Losing Your Mind",
    excerpt: "Lessons from six months of running persistent AI agents on local hardware: cron discipline, memory hygiene, and why \"just SSH in\" is always the answer.",
    href:    "#",
    featured: false,
  },
];

/* ─── Panel wrapper ───────────────────────────────────────────── */
function Panel({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <div id={id} style={{
      position:"relative", zIndex:1,
      background:"linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.95) 5rem, rgba(0,0,0,0.95) calc(100% - 5rem), transparent 100%)",
    }}>{children}</div>
  );
}

/* ─── Divider line ────────────────────────────────────────────── */
function Rule() {
  return <div style={{ borderBottom:"1px solid rgba(255,255,255,0.06)" }} />;
}

/* ─── Page ────────────────────────────────────────────────────── */
export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const cameraInfoRef = useRef<CameraInfo | null>(null);
  const d = (s: number): React.CSSProperties => ({ animation:`reveal 1s ease ${s}s both` });

  const handleCameraUpdate = useCallback((info: CameraInfo) => {
    cameraInfoRef.current = info;
  }, []);

  const getCameraInfo = useCallback(() => cameraInfoRef.current, []);

  useEffect(() => {
    if (!menuOpen) return;
    const fn = () => setMenuOpen(false);
    window.addEventListener("scroll", fn, { once: true, passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, [menuOpen]);

  return (
    <>
      <MountainGL onCameraUpdate={handleCameraUpdate} />
      <PeakLabels getCameraInfo={getCameraInfo} />

      {/* ── Full-screen menu overlay ── */}
      <div
        onClick={() => setMenuOpen(false)}
        style={{
          position:"fixed", inset:0, zIndex:300,
          background:"rgba(0,0,0,0.97)", backdropFilter:"blur(16px)",
          display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
          gap:"1.5rem",
          opacity: menuOpen ? 1 : 0,
          pointerEvents: menuOpen ? "all" : "none",
          transition:"opacity 0.28s ease",
        }}
      >
        <button
          onClick={e => { e.stopPropagation(); setMenuOpen(false); }}
          style={{ position:"absolute", top:20, right:"clamp(20px,4vw,56px)", background:"none", border:"none", cursor:"pointer", ...MONO, fontSize:"0.58rem", letterSpacing:"0.22em", textTransform:"uppercase", color:"rgba(255,255,255,0.25)" }}
        >ESC / CLOSE</button>

        {[
          { label:"Events",  href:"#events"  },
          { label:"Media",   href:"#media"   },
          { label:"Join",    href:"#join"    },
        ].map(l => (
          <a key={l.label} href={l.href}
            onClick={() => setMenuOpen(false)}
            style={{ ...BEBAS, fontSize:"clamp(2.8rem,9vw,6.5rem)", color:"#fff", textDecoration:"none", transition:"color 0.15s" }}
            onMouseEnter={e => (e.currentTarget.style.color="#2563EB")}
            onMouseLeave={e => (e.currentTarget.style.color="#fff")}
          >{l.label}</a>
        ))}

        <a href={TELEGRAM} target="_blank" rel="noopener noreferrer"
          onClick={() => setMenuOpen(false)}
          style={{ ...primaryBtn, marginTop:"1rem", fontSize:"0.68rem" }}>
          Join on Telegram →
        </a>

        <div style={{ display:"flex", gap:"2rem", marginTop:"0.5rem" }}>
          {[["X / Twitter", X_URL],["Instagram", INSTAGRAM]].map(([l,h]) => (
            <a key={l} href={h} target="_blank" rel="noopener noreferrer"
              style={{ ...MONO, fontSize:"0.54rem", letterSpacing:"0.16em", textTransform:"uppercase", color:"rgba(255,255,255,0.22)", textDecoration:"none" }}
              onMouseEnter={e => (e.currentTarget.style.color="#2563EB")}
              onMouseLeave={e => (e.currentTarget.style.color="rgba(255,255,255,0.22)")}
            >{l}</a>
          ))}
        </div>

        <span style={{ position:"absolute", bottom:28, ...MONO, fontSize:"0.46rem", letterSpacing:"0.22em", color:"rgba(255,255,255,0.1)" }}>
          40°45′N · 111°53′W · WASATCH FRONT
        </span>
      </div>

      <div style={{ position:"relative", zIndex:1 }}>

        {/* ── NAV ── */}
        <nav style={{
          position:"fixed", top:0, left:0, right:0, zIndex:100,
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"0 clamp(20px,4vw,56px)", height:52,
          borderBottom:"1px solid rgba(255,255,255,0.05)",
          background:"rgba(0,0,0,0.75)", backdropFilter:"blur(20px)",
        }}>
          <a href="/" style={{ ...BEBAS, textDecoration:"none", fontSize:"0.9rem", letterSpacing:"0.2em", color:"#fff" }}>
            OpenClaw <span style={{ color:"#2563EB" }}>SLC</span>
          </a>
          <button
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Open menu"
            style={{ background:"none", border:"none", cursor:"pointer", padding:"8px 0", display:"flex", flexDirection:"column", gap:5, alignItems:"flex-end" }}
          >
            <span style={{ display:"block", width:22, height:1.5, background:"rgba(255,255,255,0.8)" }} />
            <span style={{ display:"block", width:15, height:1.5, background:"rgba(255,255,255,0.8)" }} />
            <span style={{ display:"block", width:22, height:1.5, background:"rgba(255,255,255,0.8)" }} />
          </button>
        </nav>

        {/* ── HERO ── */}
        <section style={{ height:"100vh", minHeight:640, position:"relative" }}>
          {/* Bottom gradient to ground the text */}
          <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"52%", background:"linear-gradient(to top, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.5) 55%, transparent 100%)", pointerEvents:"none" }} />

          {/* ── Text block — bottom-anchored ── */}
          <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"0 clamp(20px,5vw,64px) clamp(32px,5vh,64px)", zIndex:2 }}>

            {/* Giant wordmark — fills viewport width */}
            <div style={{ overflow:"hidden", marginBottom:"0.2em" }}>
              <h1 style={{
                ...d(0.1), ...BEBAS,
                fontSize:"min(20vw, 20rem)",
                lineHeight:0.88,
                color:"#fff",
                margin:0,
                letterSpacing:"-0.01em",
              }}>
                OPEN<span style={{ color:"#2563EB" }}>CLAW</span>
              </h1>
            </div>

            {/* Sub-rule row */}
            <div style={{ ...d(0.25), display:"flex", alignItems:"center", gap:"1rem", marginBottom:"1.5rem" }}>
              <span style={{ ...MONO, fontSize:"0.52rem", letterSpacing:"0.24em", textTransform:"uppercase", color:"rgba(255,255,255,0.28)", whiteSpace:"nowrap" }}>
                SLC
              </span>
              <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.1)", maxWidth:160 }} />
              <span style={{ ...MONO, fontSize:"0.46rem", letterSpacing:"0.18em", textTransform:"uppercase", color:"rgba(255,255,255,0.15)", whiteSpace:"nowrap" }}>
                AI · Crypto · Wasatch
              </span>
            </div>

            {/* Tagline + CTA row */}
            <div style={{ ...d(0.4), display:"flex", alignItems:"flex-end", justifyContent:"space-between", flexWrap:"wrap", gap:"1.5rem" }}>
              <p style={{ ...MONO, fontSize:"clamp(0.72rem,1.8vw,0.92rem)", color:"rgba(255,255,255,0.22)", lineHeight:1.9, maxWidth:280, margin:0 }}>
                Salt Lake City's AI and crypto<br />builder community.
              </p>
              <div style={{ display:"flex", gap:8, flexShrink:0 }}>
                <a href="#events" style={{ ...primaryBtn, fontSize:"0.65rem" }}>
                  See Events →
                </a>
                <a href={TELEGRAM} target="_blank" rel="noopener noreferrer" style={{ ...ghostBtn, fontSize:"0.65rem" }}>
                  Join
                </a>
              </div>
            </div>

          </div>
        </section>

        <div style={{ height:"14vh" }} />

        {/* ── EVENTS ── */}
        <Panel id="events"><EventsSection /></Panel>

        <div style={{ height:"14vh" }} />

        {/* ── MEDIA ── */}
        <Panel id="media"><MediaSection /></Panel>

        <div style={{ height:"14vh" }} />

        {/* ── JOIN ── */}
        <Panel id="join"><JoinSection /></Panel>

        {/* ── FOOTER ── */}
        <footer style={{
          position:"relative", zIndex:1, background:"rgba(0,0,0,0.98)",
          borderTop:"1px solid rgba(255,255,255,0.06)",
          padding:"28px clamp(20px,4vw,56px)",
          display:"flex", alignItems:"center", justifyContent:"space-between",
          flexWrap:"wrap", gap:"1rem",
        }}>
          <span style={{ ...BEBAS, fontSize:"0.82rem", color:"rgba(255,255,255,0.16)" }}>
            OPENCLAW <span style={{ color:"#2563EB" }}>SLC</span>
          </span>
          <div style={{ display:"flex", gap:"2rem", flexWrap:"wrap" }}>
            {[["Telegram",TELEGRAM],["Instagram",INSTAGRAM],["X",X_URL]].map(([l,h]) => (
              <a key={l} href={h} target="_blank" rel="noopener noreferrer"
                style={{ ...MONO, fontSize:"0.52rem", letterSpacing:"0.16em", textTransform:"uppercase", color:"rgba(255,255,255,0.2)", textDecoration:"none" }}
                onMouseEnter={e => (e.currentTarget.style.color="#2563EB")}
                onMouseLeave={e => (e.currentTarget.style.color="rgba(255,255,255,0.2)")}
              >{l}</a>
            ))}
          </div>
          <span style={{ ...MONO, fontSize:"0.46rem", color:"rgba(255,255,255,0.08)", letterSpacing:"0.12em" }}>
            40°45′N · 111°53′W
          </span>
        </footer>
      </div>
    </>
  );
}

/* ─── Events ──────────────────────────────────────────────────── */
function EventsSection() {
  const { ref, style } = useFade();
  return (
    <section ref={ref as React.Ref<HTMLElement>} style={{ ...style, padding:"88px clamp(20px,6vw,80px)" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:"3rem", flexWrap:"wrap", gap:"1rem" }}>
        <span style={{ ...BEBAS, fontSize:"clamp(2rem,5vw,4.5rem)", color:"#fff" }}>Events</span>
        <a href={LUMA} target="_blank" rel="noopener noreferrer"
          style={{ ...MONO, fontSize:"0.52rem", letterSpacing:"0.2em", textTransform:"uppercase", color:"#2563EB", textDecoration:"none" }}>
          View all on Luma →
        </a>
      </div>
      {EVENTS.map((ev, i) => <EventRow key={i} ev={ev} />)}
      <Rule />
    </section>
  );
}

function EventRow({ ev }: { ev: { date:string; title:string; type:string } }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display:"grid", gridTemplateColumns:"6rem 1fr auto",
        gap:"clamp(12px,2.5vw,36px)", alignItems:"center",
        padding:"1.5rem 0", borderTop:"1px solid rgba(255,255,255,0.06)",
        cursor:"default", transition:"opacity 0.2s",
        opacity: hov ? 0.45 : 1,
      }}
    >
      <span style={{ ...MONO, fontSize:"0.56rem", color:"rgba(255,255,255,0.25)", letterSpacing:"0.1em" }}>{ev.date}</span>
      <span style={{ fontSize:"clamp(1rem,2vw,1.35rem)", fontWeight:600, letterSpacing:"-0.02em", color:"#fff" }}>{ev.title}</span>
      <span style={{ ...MONO, fontSize:"0.46rem", letterSpacing:"0.18em", textTransform:"uppercase", color:"#2563EB", whiteSpace:"nowrap" }}>{ev.type}</span>
    </div>
  );
}

/* ─── Media / Writings ────────────────────────────────────────── */
function MediaSection() {
  const { ref, style } = useFade();
  const [featured, ...rest] = ARTICLES;
  return (
    <section ref={ref as React.Ref<HTMLElement>} style={{ ...style, padding:"88px clamp(20px,6vw,80px)" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:"3rem", flexWrap:"wrap", gap:"1rem" }}>
        <span style={{ ...BEBAS, fontSize:"clamp(2rem,5vw,4.5rem)", color:"#fff" }}>Media &amp; Writings</span>
      </div>

      {/* Featured article */}
      <a href={featured.href}
        style={{ display:"block", padding:"2.5rem 0", borderTop:"1px solid rgba(255,255,255,0.06)", textDecoration:"none", marginBottom:"0.5rem" }}
        onMouseEnter={e => { (e.currentTarget.querySelector(".feat-title") as HTMLElement).style.color = "#2563EB"; }}
        onMouseLeave={e => { (e.currentTarget.querySelector(".feat-title") as HTMLElement).style.color = "#fff"; }}
      >
        <div style={{ display:"flex", gap:"1rem", alignItems:"center", marginBottom:"1.25rem" }}>
          <span style={{ ...MONO, fontSize:"0.46rem", letterSpacing:"0.2em", textTransform:"uppercase", color:"#2563EB" }}>{featured.tag}</span>
          <span style={{ ...MONO, fontSize:"0.46rem", letterSpacing:"0.1em", color:"rgba(255,255,255,0.2)" }}>{featured.date}</span>
          <span style={{ ...MONO, fontSize:"0.46rem", letterSpacing:"0.16em", textTransform:"uppercase", color:"rgba(37,99,235,0.7)", padding:"2px 8px", border:"1px solid rgba(37,99,235,0.35)" }}>FEATURED</span>
        </div>
        <h3 className="feat-title" style={{ fontSize:"clamp(1.5rem,3.5vw,2.8rem)", fontWeight:700, letterSpacing:"-0.03em", color:"#fff", marginBottom:"1rem", lineHeight:1.1, transition:"color 0.2s" }}>
          {featured.title}
        </h3>
        <p style={{ ...MONO, fontSize:"0.72rem", color:"rgba(255,255,255,0.35)", maxWidth:540, lineHeight:1.8, marginBottom:"1.5rem" }}>
          {featured.excerpt}
        </p>
        <span style={{ ...MONO, fontSize:"0.52rem", letterSpacing:"0.16em", textTransform:"uppercase", color:"#2563EB" }}>Read →</span>
      </a>

      {/* Secondary articles */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:0, borderTop:"1px solid rgba(255,255,255,0.06)" }}>
        {rest.map((a, i) => (
          <a key={i} href={a.href}
            style={{ display:"block", padding:"2rem 2rem 2rem 0", borderBottom:"1px solid rgba(255,255,255,0.06)", textDecoration:"none", paddingRight:"2rem" }}
            onMouseEnter={e => { (e.currentTarget.querySelector(".art-title") as HTMLElement).style.color = "#2563EB"; }}
            onMouseLeave={e => { (e.currentTarget.querySelector(".art-title") as HTMLElement).style.color = "#fff"; }}
          >
            <div style={{ display:"flex", gap:"0.75rem", alignItems:"center", marginBottom:"0.9rem" }}>
              <span style={{ ...MONO, fontSize:"0.43rem", letterSpacing:"0.2em", textTransform:"uppercase", color:"rgba(37,99,235,0.75)" }}>{a.tag}</span>
              <span style={{ ...MONO, fontSize:"0.43rem", color:"rgba(255,255,255,0.18)" }}>{a.date}</span>
            </div>
            <h4 className="art-title" style={{ fontSize:"1.05rem", fontWeight:700, letterSpacing:"-0.02em", color:"#fff", marginBottom:"0.7rem", lineHeight:1.25, transition:"color 0.2s" }}>
              {a.title}
            </h4>
            <p style={{ ...MONO, fontSize:"0.68rem", color:"rgba(255,255,255,0.28)", lineHeight:1.75, marginBottom:"1.25rem" }}>
              {a.excerpt}
            </p>
            <span style={{ ...MONO, fontSize:"0.48rem", letterSpacing:"0.14em", textTransform:"uppercase", color: a.href === "#" ? "rgba(255,255,255,0.2)" : "#2563EB" }}>
              {a.href === "#" ? "Coming Soon" : "Read →"}
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}

/* ─── Join ────────────────────────────────────────────────────── */
function JoinSection() {
  const { ref, style } = useFade();
  return (
    <section ref={ref as React.Ref<HTMLElement>} style={{ ...style, padding:"100px clamp(20px,6vw,80px) 128px", position:"relative" }}>
      <div style={{ position:"absolute", top:"50%", left:"40%", transform:"translate(-50%,-50%)", width:"50vw", height:"50vw", maxWidth:500, background:"radial-gradient(circle, rgba(37,99,235,0.04) 0%, transparent 70%)", pointerEvents:"none" }} />
      <div style={{ position:"relative" }}>
        <h2 style={{ ...BEBAS, fontSize:"clamp(3rem,11vw,11rem)", lineHeight:0.86, color:"#fff", marginBottom:"2rem" }}>
          Get in<br /><span style={{ color:"#2563EB" }}>the room.</span>
        </h2>
        <p style={{ ...MONO, fontSize:"0.78rem", color:"rgba(255,255,255,0.25)", maxWidth:320, lineHeight:2, marginBottom:"2.5rem" }}>
          Monthly meetups. Builder roundtables.<br />No hype. Just the work.
        </p>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          <a href={TELEGRAM}  target="_blank" rel="noopener noreferrer" style={primaryBtn}>Join on Telegram →</a>
          <a href={INSTAGRAM} target="_blank" rel="noopener noreferrer" style={ghostBtn}>Instagram</a>
          <a href={X_URL}     target="_blank" rel="noopener noreferrer" style={ghostBtn}>X</a>
        </div>
      </div>
    </section>
  );
}
