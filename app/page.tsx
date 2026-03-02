"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

const TopoCanvas = dynamic(() => import("@/components/TopoCanvas"), { ssr: false });

/* ─── Data ────────────────────────────────────────────────────── */
const EVENTS = [
  { n: "01", title: "AI Agents & Crypto Infrastructure", type: "Meetup",       date: "MAR 20", loc: "SLC, UT" },
  { n: "02", title: "DeFi × AI: The New Stack",          type: "Panel",        date: "APR 10", loc: "SLC, UT" },
  { n: "03", title: "Founders Roundtable",               type: "Invite Only",  date: "APR 24", loc: "SLC, UT" },
  { n: "04", title: "Builder Demo Night",                type: "Open Event",   date: "MAY 08", loc: "SLC, UT" },
];

const BUILDERS = [
  "Anchorage Digital","Coinbase","Alchemy","Circle","Solana Labs","Base","Kraken","Avalanche",
  "TaxBit","MoonTax","tZERO","Jito","Helius","Noves","Backpack","Paxos",
  "SphereOne","Panoptic","Ranger Finance","Chainalysis","Amberdata","CoinTracker","Metallicus","mtndao",
  "Offchain Labs","DataHaven","Redstone","Toniq Labs","DeFi Kingdoms","Azura","Tally","HIFI Bridge",
  "Canton Network","Bracket","WolvesDAO","TapTools","Exponential","CoinTracker","PrimeVault","Nomyx",
];

const COMMUNITIES = [
  { name: "Utah Crypto Club",         url: "https://utahcrypto.xyz",                         desc: "Utah's largest crypto community. Monthly events, SLC + Utah County." },
  { name: "Salt Lake Bitcoin",        url: "https://meetup.com/meetup-group-zuyvgaos",        desc: "Monthly Bitcoin & Lightning meetup. Bitcoin Brunch. All levels." },
  { name: "mtndao",                   url: "https://x.com/mtndao",                            desc: "Elite Solana builder residency. Semi-annual summits in SLC." },
  { name: "Utah Blockchain Coalition",url: "https://utahblockchain.org",                      desc: "Establishing Utah as a leader in blockchain policy and legislation." },
];

/* ─── FadeIn hook ─────────────────────────────────────────────── */
function useFade(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVis(true); o.disconnect(); } }, { threshold });
    if (ref.current) o.observe(ref.current);
    return () => o.disconnect();
  }, [threshold]);
  return { ref, vis };
}

/* ─── Animated counter ────────────────────────────────────────── */
function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const { ref, vis } = useFade(0.5);
  useEffect(() => {
    if (!vis) return;
    let start: number;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 1200, 1);
      setVal(Math.round(p * to));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [vis, to]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

/* ─── Page ────────────────────────────────────────────────────── */
export default function Home() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString("en-US", { hour12: false, timeZone: "America/Denver" }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <main style={{ background: "#04080F" }}>

      {/* ══════════════════════════════════════════
          NAV
      ══════════════════════════════════════════ */}
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 clamp(24px,4vw,60px)", height: 56,
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        background: "rgba(4,8,15,0.82)",
        backdropFilter: "blur(20px)",
      }}>
        <a href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M2,20 L7,9 L11,14 L15,6 L20,16 L22,20" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <path d="M9,20 Q11,14 13,20" stroke="#60A5FA" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
            <path d="M12,20 Q14,13 16,20" stroke="#93C5FD" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
          </svg>
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1rem", letterSpacing: "0.18em", color: "#fff" }}>
            OpenClaw <span style={{ color: "#3B82F6" }}>SLC</span>
          </span>
        </a>
        <nav style={{ display: "flex", gap: "2.5rem", alignItems: "center" }}>
          {["Events","Builders","Community"].map(l => (
            <a key={l} href={`#${l.toLowerCase()}`} className="link-ul" style={{ fontSize: "0.65rem", letterSpacing: "0.18em", textTransform: "uppercase" }}>
              {l}
            </a>
          ))}
          <a href="#join" style={{
            fontSize: "0.62rem", letterSpacing: "0.18em", textTransform: "uppercase",
            fontWeight: 600, padding: "7px 18px",
            background: "#1D4ED8", color: "#fff", textDecoration: "none",
            transition: "background 0.2s",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "#2563EB")}
          onMouseLeave={e => (e.currentTarget.style.background = "#1D4ED8")}
          >Join →</a>
        </nav>
      </header>

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section style={{
        position: "relative", height: "100vh", minHeight: 700,
        overflow: "hidden", display: "flex", flexDirection: "column",
        justifyContent: "flex-end",
      }}>
        <TopoCanvas />

        {/* Telemetry overlay — top-left */}
        <div style={{
          position: "absolute", top: 80, left: "clamp(24px,4vw,60px)",
          zIndex: 10, display: "flex", flexDirection: "column", gap: 4,
          animation: "reveal 1s ease 1.2s both",
        }}>
          {[
            ["LAT", "40°45′36″ N"],
            ["LON", "111°53′28″ W"],
            ["ELEV", "4,226 FT"],
            ["MST", time],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span className="mono" style={{ color: "rgba(59,130,246,0.55)", minWidth: 36 }}>{k}</span>
              <span className="mono" style={{ color: "rgba(255,255,255,0.38)" }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Main hero type — bottom-anchored */}
        <div style={{
          position: "relative", zIndex: 10,
          padding: "0 clamp(24px,4vw,60px) 60px",
        }}>
          {/* Small label */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            marginBottom: "1rem",
            animation: "reveal 0.9s ease 0.3s both",
          }}>
            <span style={{ width: 22, height: 1, background: "#3B82F6", display: "block" }} />
            <span className="label" style={{ color: "#3B82F6" }}>Salt Lake City · Wasatch Front · Founded 2026</span>
          </div>

          {/* MEGA headline */}
          <h1
            className="display"
            style={{
              fontSize: "clamp(5rem, 17vw, 18rem)",
              color: "#FFFFFF",
              animation: "reveal 0.9s ease 0.5s both",
              lineHeight: 0.88,
              maxWidth: "90vw",
            }}
          >
            Open<br />
            <span style={{ color: "#3B82F6", WebkitTextStroke: "0px" }}>Claw</span>
            <span style={{ color: "rgba(255,255,255,0.12)", WebkitTextStroke: "1px rgba(59,130,246,0.4)" }}> SLC</span>
          </h1>

          {/* Sub row */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "flex-end",
            marginTop: "2rem", flexWrap: "wrap", gap: "1.5rem",
            animation: "reveal 0.9s ease 0.8s both",
          }}>
            <p style={{
              fontSize: "clamp(0.9rem,1.8vw,1.15rem)",
              color: "rgba(255,255,255,0.48)",
              maxWidth: 440, lineHeight: 1.6,
            }}>
              The community for AI agent builders, crypto founders,
              and the people shipping the next wave. Wasatch Front.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <a href="#events" style={{
                padding: "13px 28px", background: "#1D4ED8", color: "#fff",
                fontSize: "0.68rem", letterSpacing: "0.18em", textTransform: "uppercase",
                fontWeight: 700, textDecoration: "none",
              }}
              onMouseEnter={e => (e.currentTarget.style.background="#2563EB")}
              onMouseLeave={e => (e.currentTarget.style.background="#1D4ED8")}
              >Events →</a>
              <a href="#join" style={{
                padding: "13px 28px", background: "transparent", color: "#93C5FD",
                fontSize: "0.68rem", letterSpacing: "0.18em", textTransform: "uppercase",
                fontWeight: 600, textDecoration: "none",
                border: "1px solid rgba(59,130,246,0.3)",
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor="rgba(96,165,250,0.6)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor="rgba(59,130,246,0.3)")}
              >Join Community</a>
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div style={{
          position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)",
          zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
          opacity: 0.3,
        }}>
          <span className="label" style={{ fontSize: "0.48rem" }}>Scroll</span>
          <div style={{ width: 1, height: 32, background: "rgba(59,130,246,0.8)" }} />
        </div>
      </section>

      {/* ══════════════════════════════════════════
          STATS STRIP
      ══════════════════════════════════════════ */}
      <div style={{
        borderTop: "1px solid rgba(255,255,255,0.07)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
      }}>
        {[
          { n: <Counter to={40} suffix="+" />,  l: "Companies" },
          { n: <Counter to={500} suffix="+" />, l: "Builders" },
          { n: <Counter to={12} />,             l: "Monthly Events" },
          { n: <Counter to={2026} />,           l: "Founded" },
        ].map(({ n, l }, i) => (
          <div key={i} style={{
            padding: "2.5rem clamp(16px,3vw,40px)",
            borderRight: i < 3 ? "1px solid rgba(255,255,255,0.07)" : "none",
          }}>
            <div className="display" style={{ fontSize: "clamp(2.5rem,5vw,4.5rem)", color: "#fff", marginBottom: "0.3rem" }}>{n}</div>
            <div className="label" style={{ color: "rgba(255,255,255,0.3)" }}>{l}</div>
          </div>
        ))}
      </div>

      {/* ══════════════════════════════════════════
          EVENTS — editorial list
      ══════════════════════════════════════════ */}
      <section id="events" style={{ padding: "120px clamp(24px,6vw,80px)" }}>
        <div style={{ display: "flex", gap: "4vw", alignItems: "flex-start", marginBottom: "4rem", flexWrap: "wrap" }}>
          <div style={{ flex: "0 0 auto" }}>
            <span className="label" style={{ color: "#3B82F6" }}>↓ Events</span>
          </div>
          <div style={{ flex: 1, minWidth: 260 }}>
            <h2 className="display" style={{
              fontSize: "clamp(3rem,7vw,7rem)",
              color: "#fff", lineHeight: 0.92, marginBottom: "1rem",
            }}>
              What's<br />happening
            </h2>
            <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.38)", maxWidth: 380, lineHeight: 1.7 }}>
              Monthly meetups, panels, and roundtables for the SLC crypto and AI community.
              Everything ends up on Luma.
            </p>
          </div>
          <div>
            <a href="https://lu.ma/openclawslc" target="_blank" rel="noopener noreferrer"
              style={{ fontSize: "0.62rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "#3B82F6", textDecoration: "none", borderBottom: "1px solid rgba(59,130,246,0.3)", paddingBottom: 3 }}>
              Subscribe on Luma →
            </a>
          </div>
        </div>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          {EVENTS.map(ev => (
            <div key={ev.n} style={{
              display: "grid",
              gridTemplateColumns: "48px 1fr auto",
              gap: "clamp(16px,3vw,40px)",
              alignItems: "center",
              padding: "2rem 0",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              cursor: "pointer",
              transition: "opacity 0.2s",
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity="0.75")}
            onMouseLeave={e => (e.currentTarget.style.opacity="1")}
            >
              <span className="mono" style={{ color: "rgba(59,130,246,0.45)" }}>{ev.n}</span>
              <div>
                <div style={{ fontSize: "clamp(1.1rem,2.5vw,1.6rem)", fontWeight: 700, color: "#fff", marginBottom: "0.3rem", letterSpacing: "-0.02em" }}>{ev.title}</div>
                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  <span style={{
                    fontSize: "0.55rem", letterSpacing: "0.18em", textTransform: "uppercase",
                    color: "#3B82F6", border: "1px solid rgba(59,130,246,0.3)", padding: "2px 8px",
                  }}>{ev.type}</span>
                  <span className="mono" style={{ color: "rgba(255,255,255,0.28)" }}>{ev.loc}</span>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="display" style={{ fontSize: "clamp(1.5rem,3vw,2.5rem)", color: "rgba(255,255,255,0.25)", lineHeight: 1 }}>{ev.date}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          BUILDERS — running type
      ══════════════════════════════════════════ */}
      <section id="builders" style={{
        borderTop: "1px solid rgba(255,255,255,0.07)",
        padding: "120px clamp(24px,6vw,80px)",
      }}>
        <div style={{ marginBottom: "4rem", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "2rem" }}>
          <div>
            <span className="label" style={{ color: "#3B82F6", display: "block", marginBottom: "1rem" }}>↓ Builders</span>
            <h2 className="display" style={{ fontSize: "clamp(3rem,7vw,7rem)", color: "#fff", lineHeight: 0.92 }}>
              Built<br />here.
            </h2>
          </div>
          <p style={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.35)", maxWidth: 360, lineHeight: 1.7 }}>
            SLC is home to some of the most consequential crypto and AI infrastructure companies on earth.
          </p>
        </div>

        {/* Flowing company names — large type grid */}
        <div style={{
          display: "flex", flexWrap: "wrap", gap: "0",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}>
          {BUILDERS.map((name, i) => (
            <span key={i} style={{
              padding: "0.9rem 0",
              marginRight: "clamp(24px,4vw,56px)",
              fontSize: "clamp(0.95rem,1.8vw,1.2rem)",
              fontWeight: 500,
              color: i % 7 === 0 ? "#60A5FA" : "rgba(255,255,255,0.45)",
              letterSpacing: "-0.01em",
              transition: "color 0.2s",
              cursor: "default",
              borderBottom: "1px solid rgba(255,255,255,0.04)",
              width: "calc(25% - clamp(18px,3vw,42px))",
            }}
            onMouseEnter={e => (e.currentTarget.style.color="#fff")}
            onMouseLeave={e => (e.currentTarget.style.color = i % 7 === 0 ? "#60A5FA" : "rgba(255,255,255,0.45)")}
            >{name}</span>
          ))}
        </div>

        <p style={{ marginTop: "2.5rem", fontSize: "0.72rem", color: "rgba(255,255,255,0.2)" }}>
          Building in SLC? <a href="#join" style={{ color: "#3B82F6", textDecoration: "none", borderBottom: "1px solid rgba(59,130,246,0.3)" }}>Get listed →</a>
        </p>
      </section>

      {/* ══════════════════════════════════════════
          TEAM
      ══════════════════════════════════════════ */}
      <section id="team" style={{
        borderTop: "1px solid rgba(255,255,255,0.07)",
        padding: "120px clamp(24px,6vw,80px)",
      }}>
        <span className="label" style={{ color: "#3B82F6", display: "block", marginBottom: "3rem" }}>↓ Organizers</span>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1px", background: "rgba(255,255,255,0.07)" }}>
          {[
            {
              name: "Grant Stellmacher",
              handle: "@grantstell",
              role: "Finance Architect · Anchorage Digital",
              bio: "CPA, Finance Architect at Anchorage Digital. Building Clawford — the credentialed marketplace for agent labor.",
              url: "https://x.com/grantstell",
            },
            {
              name: "You?",
              handle: "—",
              role: "Co-Organizer · Open",
              bio: "Interested in co-organizing OpenClaw SLC? We're looking for builders who live in the work.",
              url: "#join",
            },
          ].map((m) => (
            <a key={m.name} href={m.url} target={m.url.startsWith("http") ? "_blank" : "_self"} rel="noopener noreferrer"
              style={{
                display: "block", padding: "3rem", background: "#04080F",
                textDecoration: "none",
                transition: "background 0.2s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background="#060d1a")}
              onMouseLeave={e => (e.currentTarget.style.background="#04080F")}
            >
              <div className="display" style={{ fontSize: "clamp(2rem,4vw,3.5rem)", color: "#fff", marginBottom: "0.5rem" }}>{m.name}</div>
              <div className="mono" style={{ color: "#3B82F6", marginBottom: "0.25rem" }}>{m.handle}</div>
              <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.3)", marginBottom: "1.5rem" }}>{m.role}</div>
              <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.7, maxWidth: 380 }}>{m.bio}</p>
            </a>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          COMMUNITY
      ══════════════════════════════════════════ */}
      <section id="community" style={{
        borderTop: "1px solid rgba(255,255,255,0.07)",
        padding: "120px clamp(24px,6vw,80px)",
      }}>
        <div style={{ display: "flex", gap: "4vw", alignItems: "flex-start", marginBottom: "4rem", flexWrap: "wrap" }}>
          <div style={{ flex: "0 0 auto", paddingTop: "0.5rem" }}>
            <span className="label" style={{ color: "#3B82F6" }}>↓ Community</span>
          </div>
          <h2 className="display" style={{ fontSize: "clamp(2.5rem,5vw,5.5rem)", color: "#fff", lineHeight: 0.92 }}>
            Utah's<br />ecosystem.
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 0, borderTop: "1px solid rgba(255,255,255,0.07)", borderLeft: "1px solid rgba(255,255,255,0.07)" }}>
          {COMMUNITIES.map((c, i) => (
            <a key={i} href={c.url} target="_blank" rel="noopener noreferrer"
              style={{
                display: "block", padding: "2.5rem",
                borderRight: "1px solid rgba(255,255,255,0.07)",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
                textDecoration: "none",
                transition: "background 0.2s",
                background: "transparent",
              }}
              onMouseEnter={e => (e.currentTarget.style.background="rgba(59,130,246,0.04)")}
              onMouseLeave={e => (e.currentTarget.style.background="transparent")}
            >
              <div style={{ fontSize: "1rem", fontWeight: 700, color: "#fff", marginBottom: "0.75rem", letterSpacing: "-0.01em" }}>{c.name}</div>
              <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.38)", lineHeight: 1.7 }}>{c.desc}</p>
              <div style={{ marginTop: "1.25rem", fontSize: "0.62rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#3B82F6" }}>Visit →</div>
            </a>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          JOIN CTA — full-width, typographic
      ══════════════════════════════════════════ */}
      <section id="join" style={{
        borderTop: "1px solid rgba(255,255,255,0.07)",
        padding: "120px clamp(24px,6vw,80px) 160px",
        position: "relative", overflow: "hidden",
      }}>
        {/* Background glow */}
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%,-50%)",
          width: "60vw", height: "60vh",
          background: "radial-gradient(ellipse, rgba(29,78,216,0.10) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <span className="label" style={{ color: "#3B82F6", display: "block", marginBottom: "2rem" }}>↓ Join</span>
          <h2 className="display" style={{
            fontSize: "clamp(4rem,14vw,14rem)",
            color: "#fff",
            lineHeight: 0.90,
            marginBottom: "3rem",
          }}>
            Get in<br />
            <span style={{ color: "#3B82F6" }}>the room.</span>
          </h2>
          <p style={{
            fontSize: "clamp(0.9rem,1.8vw,1.1rem)",
            color: "rgba(255,255,255,0.42)",
            maxWidth: 460, lineHeight: 1.7,
            marginBottom: "3rem",
          }}>
            Monthly meetups, builders roundtables, and the SLC network for people actually building.
            No hype. No noise. Just the work.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <a href="https://t.me/openclawslc" target="_blank" rel="noopener noreferrer"
              style={{
                padding: "16px 36px", background: "#1D4ED8", color: "#fff",
                fontSize: "0.68rem", letterSpacing: "0.18em", textTransform: "uppercase",
                fontWeight: 700, textDecoration: "none", transition: "background 0.2s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background="#2563EB")}
              onMouseLeave={e => (e.currentTarget.style.background="#1D4ED8")}
            >Join on Telegram →</a>
            <a href="https://x.com/openclawslc" target="_blank" rel="noopener noreferrer"
              style={{
                padding: "16px 36px", background: "transparent", color: "#93C5FD",
                fontSize: "0.68rem", letterSpacing: "0.18em", textTransform: "uppercase",
                fontWeight: 600, textDecoration: "none",
                border: "1px solid rgba(59,130,246,0.3)", transition: "border-color 0.2s",
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor="rgba(96,165,250,0.6)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor="rgba(59,130,246,0.3)")}
            >Follow on X</a>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════ */}
      <footer style={{
        borderTop: "1px solid rgba(255,255,255,0.07)",
        padding: "32px clamp(24px,4vw,60px)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: "1rem",
      }}>
        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "0.9rem", letterSpacing: "0.18em", color: "rgba(255,255,255,0.25)" }}>
          OPENCLAW <span style={{ color: "#1D4ED8" }}>SLC</span>
        </span>
        <div style={{ display: "flex", gap: "2rem" }}>
          {[
            { l: "X",        h: "https://x.com/openclawslc" },
            { l: "Telegram", h: "https://t.me/openclawslc" },
            { l: "Events",   h: "#events" },
          ].map(({ l, h }) => (
            <a key={l} href={h} target="_blank" rel="noopener noreferrer" className="link-ul"
              style={{ fontSize: "0.6rem", letterSpacing: "0.18em", textTransform: "uppercase" }}>
              {l}
            </a>
          ))}
        </div>
        <span className="mono" style={{ color: "rgba(255,255,255,0.15)" }}>
          40°45′N · 111°53′W
        </span>
      </footer>
    </main>
  );
}
