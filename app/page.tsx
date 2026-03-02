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
const primaryBtn: React.CSSProperties = {
  padding:"12px 24px", background:"#1D4ED8", color:"#fff",
  fontSize:"0.63rem", letterSpacing:"0.18em", textTransform:"uppercase",
  fontWeight:700, textDecoration:"none",
};
const ghostBtn: React.CSSProperties = {
  padding:"12px 24px", background:"transparent", color:"rgba(255,255,255,0.5)",
  fontSize:"0.63rem", letterSpacing:"0.18em", textTransform:"uppercase",
  fontWeight:600, textDecoration:"none", border:"1px solid rgba(255,255,255,0.18)",
};

/* ─── FadeIn ──────────────────────────────────────────────────── */
function useFade() {
  const ref = useRef<HTMLElement>(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const o = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setV(true); o.disconnect(); } },
      { threshold: 0.05 }
    );
    if (ref.current) o.observe(ref.current);
    return () => o.disconnect();
  }, []);
  return { ref, style: { opacity:v?1:0, transform:v?"none":"translateY(18px)", transition:"opacity 0.9s ease, transform 0.9s ease" } as React.CSSProperties };
}

/* ─── Data ────────────────────────────────────────────────────── */
const EVENTS = [
  { date:"MAR 20", title:"AI Agents & Crypto Infrastructure", type:"Meetup"      },
  { date:"APR 10", title:"DeFi × AI: The New Stack",          type:"Panel"       },
  { date:"APR 24", title:"Founders Roundtable",               type:"Invite Only" },
  { date:"MAY 08", title:"Builder Demo Night",                 type:"Open"        },
];
const COMMUNITIES = [
  { name:"Utah Crypto Club",          url:"https://utahcrypto.xyz",                     desc:"Utah's largest crypto community. Monthly events across the state." },
  { name:"Salt Lake Bitcoin",         url:"https://meetup.com/meetup-group-zuyvgaos",    desc:"Monthly Bitcoin & Lightning meetup. Bitcoin Brunch series." },
  { name:"mtndao",                    url:"https://x.com/mtndao",                        desc:"Solana builder residency. Semi-annual summits in SLC." },
  { name:"Utah Blockchain Coalition", url:"https://utahblockchain.org",                  desc:"Blockchain policy and legislation advocacy for Utah." },
];

/* ─── Panel wrapper ───────────────────────────────────────────── */
function Panel({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <div id={id} style={{
      position:"relative", zIndex:1,
      background:"linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.94) 4rem, rgba(0,0,0,0.94) calc(100% - 4rem), transparent 100%)",
    }}>{children}</div>
  );
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

  // Close menu on scroll
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

      {/* ── Full-screen menu overlay — renders at root level, above everything ── */}
      <div
        onClick={() => setMenuOpen(false)}
        style={{
          position:"fixed", inset:0, zIndex:300,
          background:"rgba(0,0,0,0.97)",
          backdropFilter:"blur(16px)",
          display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center",
          gap:"1.5rem",
          opacity: menuOpen ? 1 : 0,
          pointerEvents: menuOpen ? "all" : "none",
          transition:"opacity 0.28s ease",
        }}
      >
        <button
          onClick={e => { e.stopPropagation(); setMenuOpen(false); }}
          style={{ position:"absolute", top:20, right:"clamp(20px,4vw,56px)", background:"none", border:"none", cursor:"pointer", fontFamily:"monospace", fontSize:"0.6rem", letterSpacing:"0.22em", textTransform:"uppercase", color:"rgba(255,255,255,0.3)" }}
        >ESC / CLOSE</button>

        {[
          { label:"Events",    href:"#events"    },
          { label:"Community", href:"#community" },
          { label:"Join",      href:"#join"      },
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
          style={{ ...primaryBtn, marginTop:"0.75rem", fontSize:"0.68rem" }}>
          Join on Telegram →
        </a>

        {/* Social links */}
        <div style={{ display:"flex", gap:"2rem", marginTop:"0.5rem" }}>
          {[["X / Twitter", X_URL],["Instagram", INSTAGRAM]].map(([l,h]) => (
            <a key={l} href={h} target="_blank" rel="noopener noreferrer"
              style={{ fontFamily:"monospace", fontSize:"0.55rem", letterSpacing:"0.18em", textTransform:"uppercase", color:"rgba(255,255,255,0.28)", textDecoration:"none" }}
              onMouseEnter={e => (e.currentTarget.style.color="#2563EB")}
              onMouseLeave={e => (e.currentTarget.style.color="rgba(255,255,255,0.28)")}
            >{l}</a>
          ))}
        </div>

        <span style={{ position:"absolute", bottom:28, fontFamily:"monospace", fontSize:"0.48rem", letterSpacing:"0.22em", color:"rgba(255,255,255,0.12)" }}>
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
          background:"rgba(0,0,0,0.72)", backdropFilter:"blur(20px)",
        }}>
          <a href="/" style={{ ...BEBAS, textDecoration:"none", fontSize:"0.9rem", letterSpacing:"0.2em", color:"#fff" }}>
            OpenClaw <span style={{ color:"#2563EB" }}>SLC</span>
          </a>
          {/* Hamburger button */}
          <button
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Open menu"
            style={{ background:"none", border:"none", cursor:"pointer", padding:"8px 0", display:"flex", flexDirection:"column", gap:5, alignItems:"flex-end" }}
          >
            <span style={{ display:"block", width:22, height:1.5, background:"#fff" }} />
            <span style={{ display:"block", width:15, height:1.5, background:"#fff" }} />
            <span style={{ display:"block", width:22, height:1.5, background:"#fff" }} />
          </button>
        </nav>

        {/* ── HERO ── */}
        <section style={{ height:"100vh", minHeight:620, position:"relative", display:"flex", flexDirection:"column", justifyContent:"flex-end" }}>
          <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"55%", background:"linear-gradient(to top, rgba(0,0,0,0.88) 0%, transparent 100%)", pointerEvents:"none" }} />
          <div style={{ position:"relative", zIndex:2, padding:"0 clamp(20px,4vw,56px) clamp(24px,4vh,60px)" }}>
            <p style={{ ...d(0.2), fontFamily:"monospace", fontSize:"0.52rem", letterSpacing:"0.26em", textTransform:"uppercase", color:"rgba(255,255,255,0.2)", marginBottom:"0.7rem" }}>
              40°45′N · 111°53′W · Wasatch Front
            </p>
            <h1 style={{
              ...d(0.4), ...BEBAS,
              fontSize:"clamp(3.5rem, 12vw, 16rem)",
              lineHeight:0.88, color:"#fff", marginBottom:"1.5rem",
            }}>
              Open<br />
              <span style={{ color:"#2563EB" }}>Claw</span><br />
              <span style={{ WebkitTextStroke:"1px rgba(255,255,255,0.14)", color:"transparent" }}>SLC</span>
            </h1>
            <div style={{ ...d(0.6), display:"flex", alignItems:"center", gap:"1.5rem", flexWrap:"wrap" }}>
              <div style={{ display:"flex", gap:8 }}>
                <a href="#events" style={primaryBtn}>See Events →</a>
                <a href={TELEGRAM} target="_blank" rel="noopener noreferrer" style={ghostBtn}>Join</a>
              </div>
              <p style={{ fontSize:"0.72rem", color:"rgba(255,255,255,0.22)", lineHeight:1.8, maxWidth:200 }}>
                SLC's AI + crypto community.
              </p>
            </div>
          </div>
        </section>

        {/* Spacer — camera rotates as events come into view */}
        <div style={{ height:"12vh" }} />

        {/* ── EVENTS ── */}
        <Panel id="events"><EventsSection /></Panel>

        <div style={{ height:"12vh" }} />

        {/* ── COMMUNITY ── */}
        <Panel id="community"><CommunitySection /></Panel>

        <div style={{ height:"12vh" }} />

        {/* ── JOIN ── */}
        <Panel id="join"><JoinSection /></Panel>

        {/* ── FOOTER ── */}
        <footer style={{
          position:"relative", zIndex:1, background:"#000",
          borderTop:"1px solid rgba(255,255,255,0.07)",
          padding:"24px clamp(20px,4vw,56px)",
          display:"flex", alignItems:"center", justifyContent:"space-between",
          flexWrap:"wrap", gap:"1rem",
        }}>
          <span style={{ ...BEBAS, fontSize:"0.82rem", color:"rgba(255,255,255,0.18)" }}>
            OPENCLAW <span style={{ color:"#1D4ED8" }}>SLC</span>
          </span>
          <div style={{ display:"flex", gap:"1.75rem", flexWrap:"wrap" }}>
            {[["Telegram",TELEGRAM],["Instagram",INSTAGRAM],["X",X_URL]].map(([l,h]) => (
              <a key={l} href={h} target="_blank" rel="noopener noreferrer"
                style={{ fontSize:"0.56rem", letterSpacing:"0.18em", textTransform:"uppercase", color:"rgba(255,255,255,0.22)", textDecoration:"none" }}
                onMouseEnter={e => (e.currentTarget.style.color="#2563EB")}
                onMouseLeave={e => (e.currentTarget.style.color="rgba(255,255,255,0.22)")}
              >{l}</a>
            ))}
          </div>
          <span style={{ fontFamily:"monospace", fontSize:"0.5rem", color:"rgba(255,255,255,0.1)", letterSpacing:"0.1em" }}>
            40°45′N · 111°53′W
          </span>
        </footer>
      </div>
    </>
  );
}

/* ─── Events section ──────────────────────────────────────────── */
function EventsSection() {
  const { ref, style } = useFade();
  return (
    <section ref={ref as React.Ref<HTMLElement>} style={{ ...style, padding:"80px clamp(20px,6vw,80px)" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:"2.5rem", flexWrap:"wrap", gap:"1rem" }}>
        <span style={{ ...BEBAS, fontSize:"clamp(2rem,5vw,4.5rem)", color:"#fff" }}>Events</span>
        <a href={LUMA} target="_blank" rel="noopener noreferrer"
          style={{ fontSize:"0.54rem", letterSpacing:"0.2em", textTransform:"uppercase", color:"#2563EB", textDecoration:"none" }}>
          Luma →
        </a>
      </div>
      {EVENTS.map((ev, i) => <EventRow key={i} ev={ev} />)}
      <div style={{ borderBottom:"1px solid rgba(255,255,255,0.06)" }} />
    </section>
  );
}

function EventRow({ ev }: { ev: { date:string; title:string; type:string } }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display:"grid", gridTemplateColumns:"5rem 1fr auto", gap:"clamp(10px,2.5vw,32px)", alignItems:"center", padding:"1.4rem 0", borderTop:"1px solid rgba(255,255,255,0.06)", opacity:hov?0.5:1, transition:"opacity 0.2s", cursor:"default" }}
    >
      <span style={{ fontFamily:"monospace", fontSize:"0.58rem", color:"rgba(255,255,255,0.28)", letterSpacing:"0.1em" }}>{ev.date}</span>
      <span style={{ fontSize:"clamp(0.95rem,2vw,1.3rem)", fontWeight:600, letterSpacing:"-0.02em" }}>{ev.title}</span>
      <span style={{ fontSize:"0.48rem", letterSpacing:"0.18em", textTransform:"uppercase", color:"#2563EB", whiteSpace:"nowrap" }}>{ev.type}</span>
    </div>
  );
}

/* ─── Community section ───────────────────────────────────────── */
function CommunitySection() {
  const { ref, style } = useFade();
  return (
    <section ref={ref as React.Ref<HTMLElement>} style={{ ...style, padding:"80px clamp(20px,6vw,80px)" }}>
      <div style={{ marginBottom:"2.5rem" }}>
        <span style={{ ...BEBAS, fontSize:"clamp(2rem,5vw,4.5rem)", color:"#fff" }}>Community</span>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(240px,1fr))", gap:0, borderTop:"1px solid rgba(255,255,255,0.07)", borderLeft:"1px solid rgba(255,255,255,0.07)" }}>
        {COMMUNITIES.map((c, i) => <CommunityCard key={i} c={c} />)}
      </div>
    </section>
  );
}

function CommunityCard({ c }: { c:{ name:string; url:string; desc:string } }) {
  const [hov, setHov] = useState(false);
  return (
    <a href={c.url} target="_blank" rel="noopener noreferrer"
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display:"block", padding:"2rem", borderRight:"1px solid rgba(255,255,255,0.07)", borderBottom:"1px solid rgba(255,255,255,0.07)", textDecoration:"none", background:hov?"rgba(37,99,235,0.04)":"transparent", transition:"background 0.2s" }}
    >
      <div style={{ fontSize:"0.95rem", fontWeight:700, color:"#fff", marginBottom:"0.6rem", letterSpacing:"-0.01em" }}>{c.name}</div>
      <p style={{ fontSize:"0.78rem", color:"rgba(255,255,255,0.36)", lineHeight:1.7, marginBottom:"1rem" }}>{c.desc}</p>
      <span style={{ fontSize:"0.52rem", letterSpacing:"0.15em", textTransform:"uppercase", color:"#2563EB" }}>Visit →</span>
    </a>
  );
}

/* ─── Join section ────────────────────────────────────────────── */
function JoinSection() {
  const { ref, style } = useFade();
  return (
    <section ref={ref as React.Ref<HTMLElement>} style={{ ...style, padding:"100px clamp(20px,6vw,80px) 120px", position:"relative" }}>
      <div style={{ position:"absolute", top:"50%", left:"35%", transform:"translate(-50%,-50%)", width:"50vw", height:"50vw", maxWidth:480, background:"radial-gradient(circle, rgba(37,99,235,0.05) 0%, transparent 70%)", pointerEvents:"none" }} />
      <div style={{ position:"relative" }}>
        <h2 style={{ ...BEBAS, fontSize:"clamp(3rem,11vw,11rem)", lineHeight:0.88, color:"#fff", marginBottom:"2rem" }}>
          Get in<br /><span style={{ color:"#2563EB" }}>the room.</span>
        </h2>
        <p style={{ fontSize:"0.84rem", color:"rgba(255,255,255,0.28)", maxWidth:300, lineHeight:1.9, marginBottom:"2rem" }}>
          Monthly meetups and builder roundtables.<br />No hype. Just the work.
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
