"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

const TopoCanvas = dynamic(() => import("@/components/TopoCanvas"), { ssr: false });

/* ─── Shared styles ───────────────────────────────────────────── */
const primaryBtn: React.CSSProperties = {
  padding: "12px 26px", background: "#1D4ED8", color: "#fff",
  fontSize: "0.65rem", letterSpacing: "0.18em", textTransform: "uppercase",
  fontWeight: 700, textDecoration: "none",
};
const ghostBtn: React.CSSProperties = {
  padding: "12px 26px", background: "transparent", color: "rgba(255,255,255,0.55)",
  fontSize: "0.65rem", letterSpacing: "0.18em", textTransform: "uppercase",
  fontWeight: 600, textDecoration: "none", border: "1px solid rgba(255,255,255,0.14)",
};
const navLink: React.CSSProperties = {
  fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase",
  color: "rgba(255,255,255,0.45)", textDecoration: "none",
};
const joinBtn: React.CSSProperties = {
  fontSize: "0.6rem", letterSpacing: "0.18em", textTransform: "uppercase",
  fontWeight: 700, padding: "6px 16px", background: "#1D4ED8", color: "#fff", textDecoration: "none",
};
const BEBAS: React.CSSProperties = { fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.02em" };

/* ─── FadeIn hook ─────────────────────────────────────────────── */
function useFade() {
  const ref = useRef<HTMLElement>(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const o = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setV(true); o.disconnect(); } },
      { threshold: 0.08 }
    );
    if (ref.current) o.observe(ref.current);
    return () => o.disconnect();
  }, []);
  const fadeStyle: React.CSSProperties = {
    opacity: v ? 1 : 0,
    transform: v ? "translateY(0)" : "translateY(24px)",
    transition: "opacity 0.9s ease, transform 0.9s ease",
  };
  return { ref, fadeStyle };
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

/* ─── Page ────────────────────────────────────────────────────── */
export default function Home() {
  const delay = (d: number): React.CSSProperties => ({ animation: `reveal 1s ease ${d}s both` });

  return (
    <main style={{ background: "#000000", color: "#fff" }}>

      {/* ─── NAV ─────────────────────────────────────────────── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 clamp(20px,4vw,56px)", height: 52,
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(0,0,0,0.8)", backdropFilter: "blur(18px)",
      }}>
        <a href="/" style={{ ...BEBAS, textDecoration: "none", fontSize: "0.95rem", letterSpacing: "0.2em", color: "#fff" }}>
          OpenClaw <span style={{ color: "#2563EB" }}>SLC</span>
        </a>
        <div style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
          <a href="#events"   style={navLink}>Events</a>
          <a href="#builders" style={navLink}>Builders</a>
          <a href="#join"     style={joinBtn}>Join →</a>
        </div>
      </nav>

      {/* ─── HERO ─────────────────────────────────────────────── */}
      <section style={{ position: "relative", height: "100vh", minHeight: 680, overflow: "hidden" }}>
        <TopoCanvas />

        {/* Vignette — makes field darken at edges for text legibility */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse 90% 90% at 50% 50%, transparent 35%, rgba(0,0,0,0.6) 100%)",
        }} />
        {/* Bottom gradient — type sits on solid black */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "42%",
          pointerEvents: "none",
          background: "linear-gradient(to top, #000 0%, rgba(0,0,0,0.85) 50%, transparent 100%)",
        }} />

        {/* Headline — bottom-left */}
        <div style={{
          position: "absolute", left: "clamp(20px,4vw,56px)", bottom: "clamp(28px,5vh,64px)", zIndex: 10,
        }}>
          <p style={{ ...delay(0.2), fontFamily: "monospace", fontSize: "0.58rem", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: "1rem" }}>
            40°45′N · 111°53′W · Wasatch Front
          </p>
          <h1 style={{
            ...delay(0.4), ...BEBAS,
            fontSize: "clamp(5rem, 17vw, 19rem)",
            lineHeight: 0.86, color: "#fff", marginBottom: "2rem",
          }}>
            Open<br />
            <span style={{ color: "#2563EB" }}>Claw</span><br />
            <span style={{ WebkitTextStroke: "1px rgba(255,255,255,0.15)", color: "transparent" }}>SLC</span>
          </h1>
          <div style={{ ...delay(0.7), display: "flex", gap: 10 }}>
            <a href="#events" style={primaryBtn}>See Events →</a>
            <a href="#join"   style={ghostBtn}>Join</a>
          </div>
        </div>

        {/* Descriptor — bottom-right */}
        <p style={{
          ...delay(0.9),
          position: "absolute", right: "clamp(20px,4vw,56px)", bottom: "clamp(28px,5vh,64px)",
          zIndex: 10, textAlign: "right",
          fontSize: "0.78rem", color: "rgba(255,255,255,0.28)", lineHeight: 1.8, maxWidth: 200,
        }}>
          SLC's community for AI builders and crypto founders.
        </p>
      </section>

      {/* ─── EVENTS ───────────────────────────────────────────── */}
      <EventsSection />

      {/* ─── BUILDERS ─────────────────────────────────────────── */}
      <BuildersSection />

      {/* ─── JOIN ─────────────────────────────────────────────── */}
      <JoinSection />

      {/* ─── FOOTER ───────────────────────────────────────────── */}
      <div style={{ height: 1, background: "rgba(255,255,255,0.07)" }} />
      <footer style={{
        padding: "28px clamp(20px,4vw,56px)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: "1rem",
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
        <span style={{ fontFamily: "monospace", fontSize: "0.55rem", color: "rgba(255,255,255,0.12)", letterSpacing: "0.1em" }}>
          40°45′N · 111°53′W
        </span>
      </footer>
    </main>
  );
}

/* ─── Events ──────────────────────────────────────────────────── */
function EventsSection() {
  const { ref, fadeStyle } = useFade();
  return (
    <section
      id="events"
      ref={ref as React.Ref<HTMLElement>}
      style={{ ...fadeStyle, padding: "120px clamp(20px,6vw,80px)", borderTop: "1px solid rgba(255,255,255,0.07)" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4rem", flexWrap: "wrap", gap: "1rem" }}>
        <span style={{ ...BEBAS, fontSize: "clamp(2.5rem,6vw,5.5rem)", color: "#fff" }}>Events</span>
        <a href="https://lu.ma/openclawslc" target="_blank" rel="noopener noreferrer"
          style={{ fontSize: "0.58rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#2563EB", textDecoration: "none" }}>
          Luma →
        </a>
      </div>

      {EVENTS.map((ev, i) => (
        <EventRow key={i} ev={ev} />
      ))}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }} />
    </section>
  );
}

function EventRow({ ev }: { ev: { date: string; title: string; type: string } }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "grid",
        gridTemplateColumns: "6rem 1fr auto",
        gap: "clamp(12px,3vw,40px)",
        alignItems: "center",
        padding: "1.75rem 0",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        opacity: hov ? 0.55 : 1,
        transition: "opacity 0.2s",
        cursor: "default",
      }}
    >
      <span style={{ fontFamily: "monospace", fontSize: "0.62rem", color: "rgba(255,255,255,0.28)", letterSpacing: "0.1em" }}>{ev.date}</span>
      <span style={{ fontSize: "clamp(1rem,2.2vw,1.4rem)", fontWeight: 600, letterSpacing: "-0.02em" }}>{ev.title}</span>
      <span style={{ fontSize: "0.52rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "#2563EB", whiteSpace: "nowrap" }}>{ev.type}</span>
    </div>
  );
}

/* ─── Builders ────────────────────────────────────────────────── */
function BuildersSection() {
  const { ref, fadeStyle } = useFade();
  return (
    <section
      id="builders"
      ref={ref as React.Ref<HTMLElement>}
      style={{ ...fadeStyle, padding: "120px clamp(20px,6vw,80px)", borderTop: "1px solid rgba(255,255,255,0.07)" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4rem", flexWrap: "wrap", gap: "1rem" }}>
        <span style={{ ...BEBAS, fontSize: "clamp(2.5rem,6vw,5.5rem)", color: "#fff" }}>Built here.</span>
        <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.28)", maxWidth: 260, lineHeight: 1.8 }}>
          SLC is home to some of the most important crypto and AI infrastructure on earth.
        </p>
      </div>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
        rowGap: "1.5rem", columnGap: "2rem",
      }}>
        {BUILDERS.map((name, i) => (
          <BuilderName key={i} name={name} />
        ))}
      </div>
    </section>
  );
}

function BuilderName({ name }: { name: string }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        fontSize: "clamp(0.88rem,1.5vw,1rem)",
        fontWeight: 500,
        color: hov ? "#fff" : "rgba(255,255,255,0.32)",
        letterSpacing: "-0.01em",
        paddingBottom: "1.5rem",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        transition: "color 0.2s",
        cursor: "default",
      }}
    >
      {name}
    </div>
  );
}

/* ─── Join ────────────────────────────────────────────────────── */
function JoinSection() {
  const { ref, fadeStyle } = useFade();
  return (
    <section
      id="join"
      ref={ref as React.Ref<HTMLElement>}
      style={{ ...fadeStyle, padding: "160px clamp(20px,6vw,80px)", borderTop: "1px solid rgba(255,255,255,0.07)", position: "relative", overflow: "hidden" }}
    >
      <div style={{
        position: "absolute", top: "50%", left: "35%",
        transform: "translate(-50%,-50%)",
        width: "50vw", height: "50vw", maxWidth: 560,
        background: "radial-gradient(circle, rgba(37,99,235,0.06) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{ position: "relative" }}>
        <h2 style={{
          ...BEBAS,
          fontSize: "clamp(4rem,13vw,13rem)",
          lineHeight: 0.88, color: "#fff", marginBottom: "2.5rem",
        }}>
          Get in<br /><span style={{ color: "#2563EB" }}>the room.</span>
        </h2>
        <p style={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.32)", maxWidth: 340, lineHeight: 1.85, marginBottom: "2.5rem" }}>
          Monthly meetups and builder roundtables. No hype. Just the people doing the work.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <a href="https://t.me/openclawslc" target="_blank" rel="noopener noreferrer" style={primaryBtn}>
            Join on Telegram →
          </a>
          <a href="https://x.com/openclawslc" target="_blank" rel="noopener noreferrer" style={ghostBtn}>
            Follow on X
          </a>
        </div>
      </div>
    </section>
  );
}
