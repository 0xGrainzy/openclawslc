"use client";
import { useEffect, useRef, useState } from "react";
import Nav from "@/components/Nav";
import MountainHero from "@/components/MountainHero";

/* ─── Data ────────────────────────────────────────────────────── */

const EVENTS = [
  {
    month: "MAR",
    day: "20",
    title: "AI Agents & Crypto Infrastructure",
    type: "Meetup",
    location: "Salt Lake City, UT",
    desc: "Monthly builders meetup — agents, protocols, and the people shipping them.",
  },
  {
    month: "APR",
    day: "10",
    title: "DeFi x AI: The New Stack",
    type: "Panel",
    location: "SLC",
    desc: "How AI agent economics are reshaping DeFi liquidity and autonomous finance.",
  },
  {
    month: "APR",
    day: "24",
    title: "Founders Roundtable",
    type: "Invite Only",
    location: "Salt Lake City",
    desc: "Small group, real conversations. Founders working at the frontier of AI + crypto.",
  },
];

const TEAM = [
  {
    name: "Grant Stellmacher",
    handle: "@grantstell",
    role: "Finance Architect",
    co: "Anchorage Digital",
    coUrl: "https://anchorage.com",
    bio: "CPA, Finance Architect at Anchorage Digital. Building Clawford — the credentialed agent marketplace.",
    xUrl: "https://x.com/grantstell",
    tag: "Organizer",
  },
  {
    name: "TBD",
    handle: "—",
    role: "Co-Organizer",
    co: "",
    coUrl: "",
    bio: "Interested in co-organizing? Reach out.",
    xUrl: "#join",
    tag: "Open",
  },
];

const BUILDERS: { name: string; url: string }[][] = [
  [
    { name: "Anchorage Digital", url: "https://anchorage.com" },
    { name: "Coinbase", url: "https://coinbase.com" },
    { name: "Alchemy", url: "https://alchemy.com" },
    { name: "Circle", url: "https://circle.com" },
    { name: "Solana Labs", url: "https://solanalabs.com" },
    { name: "Base", url: "https://base.org" },
    { name: "Kraken", url: "https://kraken.com" },
    { name: "Avalanche", url: "https://avax.network" },
  ],
  [
    { name: "TaxBit", url: "https://taxbit.com" },
    { name: "MoonTax", url: "https://moontax.com" },
    { name: "tZERO", url: "https://tzero.com" },
    { name: "Jito", url: "https://jito.network" },
    { name: "Helius", url: "https://helius.dev" },
    { name: "Noves", url: "https://noves.fi" },
    { name: "Backpack", url: "https://backpack.app" },
    { name: "Paxos", url: "https://paxos.com" },
  ],
  [
    { name: "SphereOne", url: "https://sphereone.xyz" },
    { name: "Panoptic", url: "https://panoptic.xyz" },
    { name: "Ranger Finance", url: "https://ranger.finance" },
    { name: "Chainalysis", url: "https://chainalysis.com" },
    { name: "Amberdata", url: "https://amberdata.io" },
    { name: "CoinTracker", url: "https://cointracker.com" },
    { name: "Metallicus", url: "https://metallicus.com" },
    { name: "mtndao", url: "https://x.com/mtndao" },
  ],
];

const COMMUNITIES = [
  {
    name: "Utah Crypto Club",
    url: "https://utahcrypto.xyz",
    desc: "Utah's largest crypto community. Monthly events and meetups in SLC and Utah County.",
    tags: ["Crypto", "Meetups", "All Levels"],
  },
  {
    name: "Salt Lake Bitcoin",
    url: "https://meetup.com/meetup-group-zuyvgaos",
    desc: "Monthly Bitcoin and Lightning meetup. Bitcoin Brunch series. Open to all levels.",
    tags: ["Bitcoin", "Lightning", "Monthly"],
  },
  {
    name: "mtndao",
    url: "https://x.com/mtndao",
    desc: "World-class hacker residency for Solana builders, held in Salt Lake City.",
    tags: ["Solana", "Builders", "Residency"],
  },
  {
    name: "Utah Blockchain Coalition",
    url: "https://utahblockchain.org",
    desc: "Working to establish Utah as a leader in blockchain tech and crypto policy.",
    tags: ["Policy", "Advocacy", "Legislation"],
  },
];

/* ─── Fade-in hook ────────────────────────────────────────────── */
function useFadeIn(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

/* ─── Section wrapper ─────────────────────────────────────────── */
function Section({ id, children, style }: { id?: string; children: React.ReactNode; style?: React.CSSProperties }) {
  const { ref, visible } = useFadeIn();
  return (
    <section
      id={id}
      ref={ref}
      style={{
        padding: "120px clamp(20px,6vw,80px)",
        maxWidth: 1200,
        margin: "0 auto",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(32px)",
        transition: "opacity 0.75s ease, transform 0.75s ease",
        ...style,
      }}
    >
      {children}
    </section>
  );
}

/* ─── Main Page ───────────────────────────────────────────────── */
export default function Home() {
  return (
    <main style={{ background: "#020B1E", minHeight: "100vh" }}>
      <Nav />

      {/* ════════════════ HERO ════════════════ */}
      <div
        style={{
          position: "relative",
          height: "100vh",
          minHeight: 700,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <MountainHero />

        {/* Hero content */}
        <div
          style={{
            position: "relative",
            zIndex: 10,
            textAlign: "center",
            padding: "0 clamp(20px,5vw,60px)",
            maxWidth: 880,
            animation: "fade-up 1s ease 0.2s both",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontSize: "0.6rem",
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: "#60A5FA",
              border: "1px solid rgba(96,165,250,0.28)",
              padding: "5px 14px",
              marginBottom: "2rem",
              backdropFilter: "blur(8px)",
              background: "rgba(5,27,63,0.3)",
            }}
          >
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#60A5FA", display: "inline-block", boxShadow: "0 0 6px #60A5FA" }} />
            Salt Lake City · Wasatch Front
          </div>

          <h1
            style={{
              fontSize: "clamp(3rem, 9vw, 7.5rem)",
              fontWeight: 900,
              letterSpacing: "-0.04em",
              lineHeight: 0.95,
              marginBottom: "1.5rem",
              color: "#EFF6FF",
            }}
          >
            <span className="text-gradient">Build</span>{" "}
            <span style={{ color: "rgba(239,246,255,0.85)" }}>at the</span>
            <br />
            <span className="text-gradient-blue">frontier</span>
            <span style={{ color: "rgba(239,246,255,0.85)" }}>.</span>
          </h1>

          <p
            style={{
              fontSize: "clamp(1rem, 2vw, 1.2rem)",
              color: "rgba(239,246,255,0.60)",
              maxWidth: 580,
              margin: "0 auto 2.5rem",
              lineHeight: 1.65,
              animation: "fade-up 1s ease 0.45s both",
            }}
          >
            Salt Lake City's community for AI agent builders, crypto founders,
            and the people shipping the next wave. Monthly events across the Wasatch.
          </p>

          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              flexWrap: "wrap",
              animation: "fade-up 1s ease 0.65s both",
            }}
          >
            <a
              href="#events"
              style={{
                padding: "14px 32px",
                background: "#1D4ED8",
                color: "#EFF6FF",
                fontSize: "0.72rem",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                fontWeight: 700,
                textDecoration: "none",
                transition: "background 0.2s, transform 0.2s",
                border: "1px solid transparent",
              }}
              onMouseEnter={e => { (e.target as HTMLElement).style.background = "#2563EB"; (e.target as HTMLElement).style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { (e.target as HTMLElement).style.background = "#1D4ED8"; (e.target as HTMLElement).style.transform = ""; }}
            >
              See Events →
            </a>
            <a
              href="#join"
              style={{
                padding: "14px 32px",
                background: "rgba(5,27,63,0.5)",
                color: "#BAE6FD",
                fontSize: "0.72rem",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                fontWeight: 600,
                textDecoration: "none",
                border: "1px solid rgba(96,165,250,0.3)",
                backdropFilter: "blur(8px)",
                transition: "border-color 0.2s, background 0.2s",
              }}
              onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = "rgba(96,165,250,0.6)"; }}
              onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = "rgba(96,165,250,0.3)"; }}
            >
              Join Community
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
            opacity: 0.45,
          }}
        >
          <span style={{ fontSize: "0.55rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "#60A5FA" }}>Scroll</span>
          <div style={{ width: 1, height: 40, background: "linear-gradient(to bottom, rgba(96,165,250,0.6), transparent)", animation: "scroll-indicator 2s ease-in-out infinite" }} />
        </div>
      </div>

      {/* ── Divider line ── */}
      <div style={{ height: 1, background: "linear-gradient(to right, transparent, rgba(96,165,250,0.15), transparent)", margin: "0 clamp(20px,6vw,80px)" }} />

      {/* ════════════════ EVENTS ════════════════ */}
      <Section id="events">
        <div className="section-label">Events Calendar</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "3rem", flexWrap: "wrap", gap: "1rem" }}>
          <h2 className="section-title">
            What's happening<br />
            <span className="text-gradient-blue">in the Wasatch</span>
          </h2>
          <a
            href="https://luma.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: "0.65rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "#60A5FA", textDecoration: "none", border: "1px solid rgba(96,165,250,0.25)", padding: "8px 16px", whiteSpace: "nowrap" }}
          >
            View All on Luma →
          </a>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1px", background: "rgba(96,165,250,0.08)" }}>
          {EVENTS.map((ev) => (
            <div
              key={ev.title}
              className="glass glass-hover"
              style={{ padding: "2rem", cursor: "pointer" }}
            >
              <div style={{ display: "flex", gap: "1.25rem", alignItems: "flex-start" }}>
                {/* Date block */}
                <div style={{ textAlign: "center", minWidth: 52, flexShrink: 0 }}>
                  <div style={{ fontSize: "0.55rem", letterSpacing: "0.2em", color: "#60A5FA", textTransform: "uppercase" }}>{ev.month}</div>
                  <div style={{ fontSize: "2.2rem", fontWeight: 800, lineHeight: 1, color: "#EFF6FF", fontVariantNumeric: "tabular-nums" }}>{ev.day}</div>
                </div>
                {/* Content */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 8, marginBottom: "0.6rem", alignItems: "center" }}>
                    <span style={{ fontSize: "0.55rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#60A5FA", border: "1px solid rgba(96,165,250,0.3)", padding: "2px 8px" }}>{ev.type}</span>
                    <span style={{ fontSize: "0.62rem", color: "rgba(239,246,255,0.35)" }}>{ev.location}</span>
                  </div>
                  <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#EFF6FF", marginBottom: "0.4rem", lineHeight: 1.3 }}>{ev.title}</h3>
                  <p style={{ fontSize: "0.8rem", color: "rgba(239,246,255,0.5)", lineHeight: 1.6 }}>{ev.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p style={{ marginTop: "1.5rem", fontSize: "0.78rem", color: "rgba(239,246,255,0.3)", textAlign: "center" }}>
          Hosting something?{" "}
          <a href="https://luma.com" target="_blank" rel="noopener noreferrer" style={{ color: "#60A5FA" }}>Add it to the calendar →</a>
        </p>
      </Section>

      {/* ── Divider ── */}
      <div style={{ height: 1, background: "linear-gradient(to right, transparent, rgba(96,165,250,0.12), transparent)", margin: "0 clamp(20px,6vw,80px)" }} />

      {/* ════════════════ TEAM ════════════════ */}
      <Section id="team">
        <div className="section-label">Organizers</div>
        <h2 className="section-title" style={{ marginBottom: "0.5rem" }}>Our Team</h2>
        <p className="section-sub" style={{ marginBottom: "3rem" }}>
          We're not enthusiasts. We work in this every day — building, shipping, in the trenches.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem" }}>
          {TEAM.map((m) => (
            <a
              key={m.name}
              href={m.xUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="glass glass-hover"
              style={{ padding: "2rem", textDecoration: "none", display: "block" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
                <div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#EFF6FF", marginBottom: "0.2rem" }}>{m.name}</div>
                  <div style={{ fontSize: "0.72rem", color: "#60A5FA", letterSpacing: "0.05em" }}>{m.handle}</div>
                </div>
                <span style={{ fontSize: "0.52rem", letterSpacing: "0.18em", textTransform: "uppercase", color: m.tag === "Open" ? "rgba(239,246,255,0.3)" : "#60A5FA", border: `1px solid ${m.tag === "Open" ? "rgba(239,246,255,0.12)" : "rgba(96,165,250,0.3)"}`, padding: "3px 8px" }}>{m.tag}</span>
              </div>
              <div style={{ fontSize: "0.8rem", color: "rgba(239,246,255,0.35)", marginBottom: "0.3rem" }}>{m.role}</div>
              {m.co && (
                <div style={{ fontSize: "0.78rem", color: "rgba(239,246,255,0.25)", marginBottom: "1rem" }}>@ {m.co}</div>
              )}
              <p style={{ fontSize: "0.82rem", color: "rgba(239,246,255,0.5)", lineHeight: 1.65 }}>{m.bio}</p>
            </a>
          ))}
        </div>
      </Section>

      {/* ── Divider ── */}
      <div style={{ height: 1, background: "linear-gradient(to right, transparent, rgba(96,165,250,0.12), transparent)", margin: "0 clamp(20px,6vw,80px)" }} />

      {/* ════════════════ BUILDERS ════════════════ */}
      <Section id="builders">
        <div className="section-label">SLC Builders</div>
        <h2 className="section-title" style={{ marginBottom: "0.5rem" }}>
          Built in the<br />
          <span className="text-gradient-blue">Wasatch</span>
        </h2>
        <p className="section-sub" style={{ marginBottom: "3.5rem" }}>
          SLC is home to some of the most consequential crypto and AI infrastructure companies on earth.
          This is our community.
        </p>

        {BUILDERS.map((row, ri) => (
          <div
            key={ri}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "1px",
              background: "rgba(96,165,250,0.07)",
              marginBottom: "1px",
            }}
          >
            {row.map((b) => (
              <a
                key={b.name}
                href={b.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: "1.4rem 1.2rem",
                  background: "rgba(5,27,63,0.35)",
                  color: "rgba(239,246,255,0.55)",
                  fontSize: "0.78rem",
                  fontWeight: 500,
                  letterSpacing: "0.04em",
                  textDecoration: "none",
                  textAlign: "center",
                  transition: "background 0.2s, color 0.2s",
                  backdropFilter: "blur(8px)",
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget;
                  el.style.background = "rgba(29,78,216,0.2)";
                  el.style.color = "#BAE6FD";
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget;
                  el.style.background = "rgba(5,27,63,0.35)";
                  el.style.color = "rgba(239,246,255,0.55)";
                }}
              >
                {b.name}
              </a>
            ))}
          </div>
        ))}

        <p style={{ marginTop: "1.5rem", fontSize: "0.75rem", color: "rgba(239,246,255,0.2)", textAlign: "center" }}>
          Building something in SLC?{" "}
          <a href="#join" style={{ color: "#60A5FA" }}>Get listed →</a>
        </p>
      </Section>

      {/* ── Divider ── */}
      <div style={{ height: 1, background: "linear-gradient(to right, transparent, rgba(96,165,250,0.12), transparent)", margin: "0 clamp(20px,6vw,80px)" }} />

      {/* ════════════════ COMMUNITY ════════════════ */}
      <Section id="community">
        <div className="section-label">Community</div>
        <h2 className="section-title" style={{ marginBottom: "0.5rem" }}>
          Utah's crypto<br />
          <span className="text-gradient-blue">ecosystem</span>
        </h2>
        <p className="section-sub" style={{ marginBottom: "3rem" }}>
          All of Utah's crypto and blockchain communities in one place. Whatever your level, there's a home for you here.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem" }}>
          {COMMUNITIES.map((c) => (
            <a
              key={c.name}
              href={c.url}
              target="_blank"
              rel="noopener noreferrer"
              className="glass glass-hover"
              style={{ padding: "1.75rem", textDecoration: "none", display: "block" }}
            >
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#EFF6FF", marginBottom: "0.75rem" }}>{c.name}</h3>
              <p style={{ fontSize: "0.82rem", color: "rgba(239,246,255,0.5)", lineHeight: 1.65, marginBottom: "1.25rem" }}>{c.desc}</p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {c.tags.map(t => (
                  <span key={t} style={{ fontSize: "0.55rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(96,165,250,0.7)", border: "1px solid rgba(96,165,250,0.18)", padding: "2px 8px" }}>{t}</span>
                ))}
              </div>
            </a>
          ))}
        </div>
      </Section>

      {/* ════════════════ JOIN CTA ════════════════ */}
      <div id="join" style={{ padding: "140px clamp(20px,6vw,80px)", position: "relative", overflow: "hidden" }}>
        {/* BG glow */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(29,78,216,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center", position: "relative" }}>
          <div className="section-label">Join Us</div>
          <h2 style={{ fontSize: "clamp(2.5rem,6vw,5rem)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1, color: "#EFF6FF", marginBottom: "1.25rem" }}>
            Get in the room<br />
            <span className="text-gradient-blue">before everyone else does.</span>
          </h2>
          <p style={{ fontSize: "1.05rem", color: "rgba(239,246,255,0.5)", lineHeight: 1.7, marginBottom: "2.5rem", maxWidth: 520, margin: "0 auto 2.5rem" }}>
            Monthly meetups, builders roundtables, and the SLC network for people working at the frontier. No noise, no hype — just the people actually building.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a
              href="https://t.me/openclawslc"
              target="_blank"
              rel="noopener noreferrer"
              style={{ padding: "15px 36px", background: "#1D4ED8", color: "#EFF6FF", fontSize: "0.72rem", letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 700, textDecoration: "none", border: "1px solid rgba(96,165,250,0.3)", transition: "background 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#2563EB")}
              onMouseLeave={e => (e.currentTarget.style.background = "#1D4ED8")}
            >
              Join Telegram →
            </a>
            <a
              href="https://x.com/openclawslc"
              target="_blank"
              rel="noopener noreferrer"
              className="glass"
              style={{ padding: "15px 36px", color: "#BAE6FD", fontSize: "0.72rem", letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 600, textDecoration: "none", border: "1px solid rgba(96,165,250,0.25)", transition: "border-color 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(96,165,250,0.5)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(96,165,250,0.25)")}
            >
              Follow on X
            </a>
          </div>
        </div>
      </div>

      {/* ════════════════ FOOTER ════════════════ */}
      <footer style={{ borderTop: "1px solid rgba(96,165,250,0.08)", padding: "40px clamp(20px,6vw,80px)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="18" height="18" viewBox="0 0 28 28" fill="none">
            <path d="M2,22 L8,10 L12,16 L16,8 L22,18 L26,22 Z" fill="none" stroke="rgba(96,165,250,0.5)" strokeWidth="1.4" strokeLinejoin="round"/>
            <path d="M10,22 Q12,16 14,22" fill="none" stroke="#60A5FA" strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M13,22 Q15,15 17,22" fill="none" stroke="#93C5FD" strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M16,22 Q18,17 20,22" fill="none" stroke="#BAE6FD" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          <span style={{ fontSize: "0.72rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(239,246,255,0.4)" }}>
            OpenClaw <span style={{ color: "#60A5FA" }}>SLC</span>
          </span>
        </div>
        <div style={{ display: "flex", gap: "2rem" }}>
          {[
            { label: "X", href: "https://x.com/openclawslc" },
            { label: "Telegram", href: "https://t.me/openclawslc" },
            { label: "Events", href: "#events" },
          ].map(l => (
            <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: "0.62rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(239,246,255,0.3)", textDecoration: "none", transition: "color 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#60A5FA")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(239,246,255,0.3)")}
            >
              {l.label}
            </a>
          ))}
        </div>
        <p style={{ fontSize: "0.62rem", color: "rgba(239,246,255,0.2)" }}>
          Salt Lake City, Utah
        </p>
      </footer>
    </main>
  );
}
