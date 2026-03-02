"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

const MountainGL = dynamic(() => import("@/components/MountainGL"), { ssr: false });

/* ─── Shared ──────────────────────────────────────────────────── */
const BEBAS: React.CSSProperties = { fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.02em" };
const primaryBtn: React.CSSProperties = {
  padding: "13px 28px", background: "#1D4ED8", color: "#fff",
  fontSize: "0.65rem", letterSpacing: "0.18em", textTransform: "uppercase",
  fontWeight: 700, textDecoration: "none",
};
const ghostBtn: React.CSSProperties = {
  padding: "13px 28px", background: "transparent", color: "rgba(255,255,255,0.5)",
  fontSize: "0.65rem", letterSpacing: "0.18em", textTransform: "uppercase",
  fontWeight: 600, textDecoration: "none", border: "1px solid rgba(255,255,255,0.14)",
};

/* ─── FadeIn ──────────────────────────────────────────────────── */
function useFade() {
  const ref = useRef<HTMLElement>(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const o = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setV(true); o.disconnect(); } },
      { threshold: 0.06 }
    );
    if (ref.current) o.observe(ref.current);
    return () => o.disconnect();
  }, []);
  return {
    ref,
    style: {
      opacity: v ? 1 : 0,
      transform: v ? "none" : "translateY(20px)",
      transition: "opacity 1s ease, transform 1s ease",
    } as React.CSSProperties,
  };
}

/* ─── Data ────────────────────────────────────────────────────── */
const EVENTS = [
  { date: "MAR 20", title: "AI Agents & Crypto Infrastructure", type: "Meetup"      },
  { date: "APR 10", title: "DeFi × AI: The New Stack",          type: "Panel"       },
  { date: "APR 24", title: "Founders Roundtable",               type: "Invite Only" },
  { date: "MAY 08", title: "Builder Demo Night",                 type: "Open"        },
];
const BUILDERS = [
  "Anchorage Digital","Coinbase","Alchemy","Circle","Kraken","Solana Labs","Base",
  "TaxBit","Helius","Jito","Backpack","Noves","tZERO","MoonTax","Paxos","Chainalysis",
  "SphereOne","Ranger Finance","Amberdata","Metallicus","mtndao","CoinTracker","Panoptic","Avalanche",
];

/* ─── Section wrapper with transparent top/bottom edges ───────── */
function SectionPanel({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <div id={id} style={{
      position: "relative", zIndex: 1,
      background: "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.93) 5rem, rgba(0,0,0,0.93) calc(100% - 5rem), transparent 100%)",
    }}>
      {children}
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────── */
export default function Home() {
  const d = (s: number): React.CSSProperties => ({ animation: `reveal 1s ease ${s}s both` });

  return (
    <>
      {/* 3D mountain — fixed, behind everything */}
      <MountainGL />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* ── NAV ──────────────────────────────────────────────── */}
        <nav style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 clamp(20px,4vw,56px)", height: 52,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(0,0,0,0.72)", backdropFilter: "blur(20px)",
        }}>
          <a href="/" style={{ ...BEBAS, textDecoration: "none", fontSize: "0.95rem", letterSpacing: "0.2em", color: "#fff" }}>
            OpenClaw <span style={{ color: "#2563EB" }}>SLC</span>
          </a>
          <div style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
            {["events","builders","join"].map(s => (
              <a key={s} href={`#${s}`} style={{
                fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "capitalize",
                color: "rgba(255,255,255,0.4)", textDecoration: "none",
              }}>{s}</a>
            ))}
            <a href="#join" style={{ ...primaryBtn, padding: "6px 16px", fontSize: "0.58rem" }}>Join →</a>
          </div>
        </nav>

        {/* ── HERO — fully transparent, mountain shows through ─── */}
        <section style={{ height: "100vh", minHeight: 680, position: "relative", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          {/* Bottom fade so type is legible */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "55%", background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, transparent 100%)", pointerEvents: "none" }} />

          <div style={{ position: "relative", zIndex: 2, padding: "0 clamp(20px,4vw,56px) clamp(28px,5vh,64px)" }}>
            <p style={{ ...d(0.2), fontFamily: "monospace", fontSize: "0.55rem", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)", marginBottom: "0.9rem" }}>
              40°45′N · 111°53′W · Wasatch Front
            </p>

            <h1 style={{
              ...d(0.4), ...BEBAS,
              fontSize: "clamp(4.5rem, 15vw, 18rem)",
              lineHeight: 0.87, color: "#fff", marginBottom: "1.8rem",
            }}>
              Open<br />
              <span style={{ color: "#2563EB" }}>Claw</span><br />
              <span style={{ WebkitTextStroke: "1px rgba(255,255,255,0.18)", color: "transparent" }}>SLC</span>
            </h1>

            <div style={{ ...d(0.65), display: "flex", alignItems: "center", gap: "2rem", flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: 10 }}>
                <a href="#events" style={primaryBtn}>See Events →</a>
                <a href="#join"   style={ghostBtn}>Join</a>
              </div>
              <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.25)", lineHeight: 1.8, maxWidth: 220 }}>
                SLC's community for AI builders<br />and crypto founders.
              </p>
            </div>
          </div>
        </section>

        {/* ── SPACER — mountain visible as camera ascends ─────── */}
        <div style={{ height: "30vh", position: "relative" }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.88) 0%, transparent 40%, transparent 60%, rgba(0,0,0,0.88) 100%)" }} />
        </div>

        {/* ── EVENTS — camera: tilted above ───────────────────── */}
        <SectionPanel id="events">
          <EventsSection />
        </SectionPanel>

        {/* ── SPACER — mountain transitions ───────────────────── */}
        <div style={{ height: "30vh" }} />

        {/* ── BUILDERS — camera: near the ridgeline ───────────── */}
        <SectionPanel id="builders">
          <BuildersSection />
        </SectionPanel>

        {/* ── SPACER — camera climbs to overhead ──────────────── */}
        <div style={{ height: "30vh" }} />

        {/* ── JOIN — camera: overhead abstract ────────────────── */}
        <SectionPanel id="join">
          <JoinSection />
        </SectionPanel>

        {/* ── FOOTER ───────────────────────────────────────────── */}
        <footer style={{
          position: "relative", zIndex: 1,
          background: "#000",
          borderTop: "1px solid rgba(255,255,255,0.07)",
          padding: "28px clamp(20px,4vw,56px)",
          display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem",
        }}>
          <span style={{ ...BEBAS, fontSize: "0.85rem", color: "rgba(255,255,255,0.18)" }}>
            OPENCLAW <span style={{ color: "#1D4ED8" }}>SLC</span>
          </span>
          <div style={{ display: "flex", gap: "2rem" }}>
            {[["X","https://x.com/openclawslc"],["Telegram","https://t.me/openclawslc"]].map(([l,h]) => (
              <a key={l} href={h} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: "0.58rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)", textDecoration: "none" }}
                onMouseEnter={e => (e.currentTarget.style.color="#2563EB")}
                onMouseLeave={e => (e.currentTarget.style.color="rgba(255,255,255,0.22)")}
              >{l}</a>
            ))}
          </div>
          <span style={{ fontFamily: "monospace", fontSize: "0.52rem", color: "rgba(255,255,255,0.1)", letterSpacing: "0.1em" }}>
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
    <section ref={ref as React.Ref<HTMLElement>} style={{ ...style, padding: "100px clamp(20px,6vw,80px)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "3.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <span style={{ ...BEBAS, fontSize: "clamp(2.5rem,6vw,5.5rem)", color: "#fff" }}>Events</span>
        <a href="https://lu.ma/openclawslc" target="_blank" rel="noopener noreferrer"
          style={{ fontSize: "0.56rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#2563EB", textDecoration: "none" }}>
          Luma →
        </a>
      </div>
      {EVENTS.map((ev, i) => <EventRow key={i} ev={ev} />)}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }} />
    </section>
  );
}

function EventRow({ ev }: { ev: { date: string; title: string; type: string } }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: "grid", gridTemplateColumns: "5.5rem 1fr auto",
        gap: "clamp(12px,3vw,40px)", alignItems: "center",
        padding: "1.6rem 0", borderTop: "1px solid rgba(255,255,255,0.06)",
        opacity: hov ? 0.5 : 1, transition: "opacity 0.2s", cursor: "default",
      }}
    >
      <span style={{ fontFamily: "monospace", fontSize: "0.6rem", color: "rgba(255,255,255,0.28)", letterSpacing: "0.1em" }}>{ev.date}</span>
      <span style={{ fontSize: "clamp(1rem,2.2vw,1.35rem)", fontWeight: 600, letterSpacing: "-0.02em" }}>{ev.title}</span>
      <span style={{ fontSize: "0.5rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "#2563EB", whiteSpace: "nowrap" }}>{ev.type}</span>
    </div>
  );
}

/* ─── Builders ────────────────────────────────────────────────── */
function BuildersSection() {
  const { ref, style } = useFade();
  return (
    <section ref={ref as React.Ref<HTMLElement>} style={{ ...style, padding: "100px clamp(20px,6vw,80px)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "3.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <span style={{ ...BEBAS, fontSize: "clamp(2.5rem,6vw,5.5rem)", color: "#fff" }}>Built here.</span>
        <p style={{ fontSize: "0.76rem", color: "rgba(255,255,255,0.26)", maxWidth: 240, lineHeight: 1.85 }}>
          SLC's crypto and AI infrastructure companies.
        </p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px,1fr))", rowGap: "1.4rem", columnGap: "2rem" }}>
        {BUILDERS.map((name, i) => <BuilderName key={i} name={name} />)}
      </div>
    </section>
  );
}

function BuilderName({ name }: { name: string }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ fontSize: "0.95rem", fontWeight: 500, letterSpacing: "-0.01em",
        color: hov ? "#fff" : "rgba(255,255,255,0.3)",
        paddingBottom: "1.4rem", borderBottom: "1px solid rgba(255,255,255,0.05)",
        transition: "color 0.2s", cursor: "default" }}>
      {name}
    </div>
  );
}

/* ─── Join ────────────────────────────────────────────────────── */
function JoinSection() {
  const { ref, style } = useFade();
  return (
    <section ref={ref as React.Ref<HTMLElement>} style={{ ...style, padding: "120px clamp(20px,6vw,80px) 140px", position: "relative" }}>
      <div style={{ position: "absolute", top: "50%", left: "35%", transform: "translate(-50%,-50%)", width: "50vw", height: "50vw", maxWidth: 500, background: "radial-gradient(circle, rgba(37,99,235,0.05) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "relative" }}>
        <h2 style={{ ...BEBAS, fontSize: "clamp(3.5rem,12vw,12rem)", lineHeight: 0.88, color: "#fff", marginBottom: "2.5rem" }}>
          Get in<br /><span style={{ color: "#2563EB" }}>the room.</span>
        </h2>
        <p style={{ fontSize: "0.86rem", color: "rgba(255,255,255,0.3)", maxWidth: 320, lineHeight: 1.9, marginBottom: "2.5rem" }}>
          Monthly meetups and builder roundtables.<br />No hype. Just the work.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <a href="https://t.me/openclawslc" target="_blank" rel="noopener noreferrer" style={primaryBtn}>Join on Telegram →</a>
          <a href="https://x.com/openclawslc"  target="_blank" rel="noopener noreferrer" style={ghostBtn}>Follow on X</a>
        </div>
      </div>
    </section>
  );
}
