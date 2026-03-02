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

/*
  ─── Orbit-aligned section positions ────────────────────────────
  The camera does a full 360° sweep as scroll goes 0 → 1.

  Scroll 0.00  θ=π       West  — SLC valley, hero
  Scroll 0.25  θ=3π/2    South — Nebo rising into frame
  Scroll 0.38  θ~2π      East  — EVENTS (back of the Wasatch)
  Scroll 0.65  θ~5π/2    North — MEDIA (Nebo far in the back)
  Scroll 0.87              —   CONTACT
  Scroll 1.00  θ=3π=π    West  — full circle
*/
const SECTIONS = {
  hero:    0.00,
  events:  0.38,
  media:   0.65,
  contact: 0.87,
};

/* ─── Fade helper ─────────────────────────────────────────────── */
function sectionOpacity(scroll: number, peak: number, halfW = 0.18): number {
  return Math.max(0, 1 - Math.abs(scroll - peak) / halfW);
}

/* ─── Orbit compass label ─────────────────────────────────────── */
// Maps scroll progress to a cardinal direction + descriptor
function orbitLabel(s: number): { dir: string; desc: string } {
  if (s < 0.12)                    return { dir:"W",  desc:"WEST · SLC VALLEY" };
  if (s < 0.30)                    return { dir:"SW", desc:"SOUTH · NEBO RISING" };
  if (s < 0.55)                    return { dir:"E",  desc:"EAST · BACK OF RANGE" };
  if (s < 0.80)                    return { dir:"N",  desc:"NORTH · NEBO FAR BACK" };
  return                                  { dir:"W",  desc:"WEST · RETURN" };
}

/* ─── Data ────────────────────────────────────────────────────── */
const EVENTS = [
  { date:"MAR 20", title:"AI Agents & Crypto Infrastructure", type:"Meetup"      },
  { date:"APR 10", title:"DeFi × AI: The New Stack",          type:"Panel"       },
  { date:"APR 24", title:"Founders Roundtable",               type:"Invite Only" },
  { date:"MAY 08", title:"Builder Demo Night",                 type:"Open"        },
];
const ARTICLES = [
  {
    tag:"GUIDE",     date:"MAR 2026",
    title:"OpenClaw Setup Best Practices",
    href:"/articles/openclaw-setup",
  },
  {
    tag:"DEEP DIVE", date:"MAR 2026",
    title:"AI Agents in the Wasatch: Why SLC Is Quietly Winning",
    href:"#",
  },
  {
    tag:"OPS",       date:"FEB 2026",
    title:"Running Agents Locally Without Losing Your Mind",
    href:"#",
  },
];

/* ─── Page ────────────────────────────────────────────────────── */
export default function Home() {
  const [scroll, setScroll]     = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const cameraRef               = useRef<CameraInfo | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const fn = () => {
      const max = document.body.scrollHeight - window.innerHeight;
      setScroll(max > 0 ? window.scrollY / max : 0);
    };
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const fn = () => setMenuOpen(false);
    window.addEventListener("scroll", fn, { once: true, passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, [menuOpen]);

  const handleCameraUpdate = useCallback((info: CameraInfo) => {
    cameraRef.current = info;
  }, []);
  const getCameraInfo = useCallback(() => cameraRef.current, []);

  const goTo = (frac: number) => {
    const max = document.body.scrollHeight - window.innerHeight;
    window.scrollTo({ top: max * frac, behavior: "smooth" });
    setMenuOpen(false);
  };

  const heroOp    = sectionOpacity(scroll, SECTIONS.hero,    0.14);
  const eventsOp  = sectionOpacity(scroll, SECTIONS.events,  0.20);
  const mediaOp   = sectionOpacity(scroll, SECTIONS.media,   0.20);
  const contactOp = sectionOpacity(scroll, SECTIONS.contact, 0.14);
  const { dir, desc } = orbitLabel(scroll);

  /* Panel bg — solid on mobile, gradient on desktop */
  const panelBg = isMobile
    ? "rgba(0,0,0,0.94)"
    : "rgba(0,0,0,0.88)";

  return (
    <>
      {/* ── 3D mountain — fixed background ── */}
      <MountainGL onCameraUpdate={handleCameraUpdate} />
      <PeakLabels getCameraInfo={getCameraInfo} />

      {/* ── Ghost wordmark ── */}
      <div aria-hidden style={{
        position:"fixed", top:"36%", left:0, right:0,
        transform:"translateY(-50%)", zIndex:1,
        overflow:"hidden", pointerEvents:"none", userSelect:"none",
        textAlign:"center",
      }}>
        <div style={{...BEBAS, fontSize:"min(19vw, 19rem)", lineHeight:0.88,
          letterSpacing:"-0.01em", whiteSpace:"nowrap"}}>
          <span style={{color:"rgba(255,255,255,0.07)"}}>OPEN</span>
          <span style={{color:"rgba(37,99,235,0.14)"}}>CLAW</span>
        </div>
        <div style={{...BEBAS, fontSize:"min(7vw, 6rem)", letterSpacing:"0.25em",
          color:"rgba(255,255,255,0.04)", marginTop:"-0.1em"}}>SLC</div>
      </div>

      {/* ── Full-screen menu ── */}
      <div onClick={() => setMenuOpen(false)} style={{
        position:"fixed", inset:0, zIndex:300,
        background:"rgba(0,0,0,0.97)", backdropFilter:"blur(16px)",
        display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
        gap:"1.25rem",
        opacity:menuOpen?1:0, pointerEvents:menuOpen?"all":"none",
        transition:"opacity 0.25s ease",
      }}>
        <button onClick={e=>{e.stopPropagation();setMenuOpen(false);}}
          style={{position:"absolute",top:20,right:"clamp(20px,4vw,52px)",
            background:"none",border:"none",cursor:"pointer",
            ...MONO,fontSize:"0.55rem",letterSpacing:"0.22em",
            textTransform:"uppercase",color:"rgba(255,255,255,0.25)"}}>ESC / CLOSE</button>

        {[
          { label:"Events",  frac:SECTIONS.events  },
          { label:"Media",   frac:SECTIONS.media   },
          { label:"Contact", frac:SECTIONS.contact },
        ].map(l=>(
          <button key={l.label} onClick={()=>goTo(l.frac)}
            style={{...BEBAS,fontSize:"clamp(2.8rem,9vw,6.5rem)",
              color:"#fff",background:"none",border:"none",cursor:"pointer",transition:"color 0.15s"}}
            onMouseEnter={e=>(e.currentTarget.style.color="#2563EB")}
            onMouseLeave={e=>(e.currentTarget.style.color="#fff")}>
            {l.label}
          </button>
        ))}

        <a href={TELEGRAM} target="_blank" rel="noopener noreferrer"
          onClick={()=>setMenuOpen(false)}
          style={{marginTop:"0.75rem",padding:"13px 28px",background:"#2563EB",
            color:"#fff",...MONO,fontSize:"0.62rem",letterSpacing:"0.18em",
            textTransform:"uppercase",fontWeight:700,textDecoration:"none"}}>
          Join on Telegram →
        </a>
        <div style={{display:"flex",gap:"2rem",marginTop:"0.5rem"}}>
          {[["X",X_URL],["Instagram",INSTAGRAM]].map(([l,h])=>(
            <a key={l} href={h} target="_blank" rel="noopener noreferrer"
              style={{...MONO,fontSize:"0.52rem",letterSpacing:"0.16em",
                textTransform:"uppercase",color:"rgba(255,255,255,0.2)",textDecoration:"none"}}
              onMouseEnter={e=>(e.currentTarget.style.color="#2563EB")}
              onMouseLeave={e=>(e.currentTarget.style.color="rgba(255,255,255,0.2)")}>{l}</a>
          ))}
        </div>
        <span style={{position:"absolute",bottom:24,...MONO,fontSize:"0.44rem",
          letterSpacing:"0.2em",color:"rgba(255,255,255,0.08)"}}>40°45′N · 111°53′W</span>
      </div>

      {/* ── Fixed nav ── */}
      <nav style={{
        position:"fixed",top:0,left:0,right:0,zIndex:100,
        display:"flex",alignItems:"center",justifyContent:"space-between",
        padding:"0 clamp(20px,4vw,52px)",height:52,
        borderBottom:"1px solid rgba(255,255,255,0.07)",
        background:"rgba(0,0,0,0.75)",backdropFilter:"blur(20px)",
      }}>
        <button onClick={()=>goTo(0)} style={{...BEBAS,background:"none",border:"none",
          cursor:"pointer",fontSize:"0.9rem",letterSpacing:"0.2em",color:"#fff",padding:0}}>
          OPENCLAW <span style={{color:"#2563EB"}}>SLC</span>
        </button>
        <button onClick={()=>setMenuOpen(o=>!o)} aria-label="Menu"
          style={{background:"none",border:"none",cursor:"pointer",
            padding:"8px 0",display:"flex",flexDirection:"column",gap:5,alignItems:"flex-end"}}>
          <span style={{display:"block",width:22,height:1.5,background:"rgba(255,255,255,0.85)"}}/>
          <span style={{display:"block",width:15,height:1.5,background:"rgba(255,255,255,0.85)"}}/>
          <span style={{display:"block",width:22,height:1.5,background:"rgba(255,255,255,0.85)"}}/>
        </button>
      </nav>

      {/* ── Scroll height driver — 500vh for full orbit room ── */}
      <div style={{height:"500vh"}}>

        {/* Sticky viewport */}
        <div style={{position:"sticky",top:0,height:"100vh",overflow:"hidden"}}>

          {/* ── Orbit compass indicator — always visible ── */}
          <div style={{
            position:"absolute", top:62, right:"clamp(16px,3vw,40px)",
            zIndex:10, pointerEvents:"none",
            display:"flex", flexDirection:"column", alignItems:"flex-end", gap:3,
            opacity: 0.85,
            transition:"opacity 0.4s ease",
          }}>
            {/* Direction */}
            <span style={{
              ...BEBAS, fontSize:"clamp(1.6rem,4vw,2.4rem)",
              color:"rgba(255,255,255,0.55)", lineHeight:1,
              letterSpacing:"0.05em",
            }}>{dir}</span>
            {/* Descriptor */}
            <span style={{
              ...MONO, fontSize:"0.38rem",
              letterSpacing:"0.22em", textTransform:"uppercase",
              color:"rgba(255,255,255,0.25)",
            }}>{desc}</span>
            {/* Orbit progress bar */}
            <div style={{width:"clamp(44px,8vw,80px)", height:1.5,
              background:"rgba(255,255,255,0.10)", marginTop:4, position:"relative"}}>
              <div style={{position:"absolute",top:0,left:0,bottom:0,
                width:`${scroll*100}%`, background:"#2563EB",
                transition:"width 0.1s linear"}}/>
            </div>
          </div>

          {/* ════════════════════════════════════
              HERO — scroll 0 — WEST / SLC FACE
              Tagline at bottom-left
          ════════════════════════════════════ */}
          <div style={{
            position:"absolute", bottom:0, left:0, right:0,
            padding:"0 clamp(20px,5vw,60px) clamp(28px,5vh,60px)",
            opacity:heroOp, transition:"opacity 0.4s ease",
            pointerEvents:heroOp>0.05?"auto":"none",
          }}>
            <div style={{position:"absolute",bottom:0,left:0,right:0,height:"80%",
              background:"linear-gradient(to top,rgba(0,0,0,1) 0%,rgba(0,0,0,0.88) 38%,rgba(0,0,0,0.50) 65%,transparent 100%)",
              pointerEvents:"none"}}/>
            <div style={{position:"relative"}}>
              <div style={{...MONO,fontSize:"0.48rem",letterSpacing:"0.26em",
                textTransform:"uppercase",color:"rgba(255,255,255,0.75)",marginBottom:"0.9rem"}}>
                40°45′N · 111°53′W · Wasatch Front
              </div>
              <p style={{...MONO,fontSize:"clamp(0.88rem,2.0vw,1.1rem)",
                color:"rgba(255,255,255,0.95)",maxWidth:360,lineHeight:1.85,
                marginBottom:"1.75rem",fontWeight:500}}>
                Salt Lake City&apos;s AI and crypto<br/>builder community.
              </p>
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                <button onClick={()=>goTo(SECTIONS.events)}
                  style={{padding:"14px 28px",background:"#2563EB",color:"#fff",
                    ...MONO,fontSize:"0.65rem",letterSpacing:"0.18em",
                    textTransform:"uppercase",fontWeight:700,border:"none",cursor:"pointer"}}>
                  SEE EVENTS →
                </button>
                <a href={TELEGRAM} target="_blank" rel="noopener noreferrer"
                  style={{padding:"14px 28px",background:"rgba(255,255,255,0.06)",
                    color:"rgba(255,255,255,0.75)",...MONO,fontSize:"0.65rem",
                    letterSpacing:"0.18em",textTransform:"uppercase",fontWeight:600,
                    textDecoration:"none",border:"1px solid rgba(255,255,255,0.22)"}}>JOIN</a>
              </div>
            </div>
          </div>

          {/* Scroll hint */}
          <div style={{
            position:"absolute",bottom:"clamp(18px,3vh,28px)",left:"50%",
            transform:"translateX(-50%)",
            opacity:heroOp*0.65, transition:"opacity 0.4s ease", pointerEvents:"none",
            display:"flex",flexDirection:"column",alignItems:"center",gap:6,
          }}>
            <span style={{...MONO,fontSize:"0.42rem",letterSpacing:"0.22em",
              textTransform:"uppercase",color:"rgba(255,255,255,0.22)"}}>SCROLL TO ORBIT</span>
            <div style={{width:1,height:28,
              background:"linear-gradient(to bottom,rgba(255,255,255,0.22),transparent)"}}/>
          </div>

          {/* ════════════════════════════════════
              EVENTS — scroll 0.38 — EAST FACE
              Centered panel
          ════════════════════════════════════ */}
          <div style={{
            position:"absolute", inset:0,
            display:"flex", alignItems:"center", justifyContent:"center",
            padding:"clamp(56px,8vh,80px) clamp(16px,4vw,48px) clamp(24px,4vh,48px)",
            opacity:eventsOp, transition:"opacity 0.4s ease",
            pointerEvents:eventsOp>0.05?"auto":"none",
          }}>
            {/* Radial dark backdrop */}
            <div style={{position:"absolute",inset:0,
              background:"radial-gradient(ellipse 90% 80% at 50% 55%, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.80) 50%, rgba(0,0,0,0.25) 80%, transparent 100%)",
              pointerEvents:"none"}}/>
            <div style={{position:"relative",width:"100%",maxWidth:560}}>
              <div style={{...MONO,fontSize:"0.44rem",letterSpacing:"0.28em",
                textTransform:"uppercase",color:"#2563EB",marginBottom:"0.75rem"}}>
                EAST FACE · BACK OF THE WASATCH
              </div>
              <div style={{display:"flex",justifyContent:"space-between",
                alignItems:"baseline",marginBottom:"1.75rem",flexWrap:"wrap",gap:"0.75rem"}}>
                <span style={{...BEBAS,fontSize:"clamp(2.4rem,6vw,4.5rem)",color:"#fff",lineHeight:1}}>
                  Upcoming Events
                </span>
                <a href={LUMA} target="_blank" rel="noopener noreferrer"
                  style={{...MONO,fontSize:"0.50rem",letterSpacing:"0.2em",
                    textTransform:"uppercase",color:"#60A5FA",textDecoration:"none"}}>
                  Luma →
                </a>
              </div>
              {EVENTS.map((ev,i)=>(
                <div key={i} style={{
                  display:"grid",
                  gridTemplateColumns:isMobile?"3.5rem 1fr":"4.5rem 1fr auto",
                  gap:"clamp(8px,2vw,20px)",alignItems:"center",
                  padding:"1.1rem 0",borderTop:"1px solid rgba(255,255,255,0.14)"}}>
                  <span style={{...MONO,fontSize:"0.50rem",
                    color:"rgba(255,255,255,0.60)",letterSpacing:"0.08em"}}>{ev.date}</span>
                  <span style={{fontSize:"clamp(0.88rem,2vw,1.1rem)",fontWeight:700,
                    letterSpacing:"-0.01em",color:"#fff",lineHeight:1.3}}>{ev.title}</span>
                  {!isMobile && (
                    <span style={{...MONO,fontSize:"0.44rem",letterSpacing:"0.14em",
                      textTransform:"uppercase",color:"#93C5FD",whiteSpace:"nowrap"}}>{ev.type}</span>
                  )}
                </div>
              ))}
              <div style={{borderBottom:"1px solid rgba(255,255,255,0.08)",marginTop:"0.25rem"}}/>
              <div style={{marginTop:"1.5rem"}}>
                <a href={LUMA} target="_blank" rel="noopener noreferrer"
                  style={{display:"inline-block",padding:"13px 26px",background:"#2563EB",
                    color:"#fff",...MONO,fontSize:"0.62rem",letterSpacing:"0.18em",
                    textTransform:"uppercase",fontWeight:700,textDecoration:"none"}}>
                  RSVP on Luma →
                </a>
              </div>
            </div>
          </div>

          {/* ════════════════════════════════════
              MEDIA — scroll 0.65 — NORTH / NEBO FAR BACK
              Centered panel
          ════════════════════════════════════ */}
          <div style={{
            position:"absolute", inset:0,
            display:"flex", alignItems:"center", justifyContent:"center",
            padding:"clamp(56px,8vh,80px) clamp(16px,4vw,48px) clamp(24px,4vh,48px)",
            opacity:mediaOp, transition:"opacity 0.4s ease",
            pointerEvents:mediaOp>0.05?"auto":"none",
          }}>
            <div style={{position:"absolute",inset:0,
              background:"radial-gradient(ellipse 90% 80% at 50% 55%, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.80) 50%, rgba(0,0,0,0.25) 80%, transparent 100%)",
              pointerEvents:"none"}}/>
            <div style={{position:"relative",width:"100%",maxWidth:560}}>
              <div style={{...MONO,fontSize:"0.44rem",letterSpacing:"0.28em",
                textTransform:"uppercase",color:"#2563EB",marginBottom:"0.75rem"}}>
                NORTH FACE · MT NEBO IN THE DISTANCE
              </div>
              <span style={{...BEBAS,fontSize:"clamp(2.4rem,6vw,4.5rem)",
                color:"#fff",lineHeight:1,display:"block",marginBottom:"1.75rem"}}>
                Media &amp; Writings
              </span>
              {ARTICLES.map((a,i)=>(
                <a key={i} href={a.href}
                  style={{display:"block",padding:"1rem 0",
                    borderTop:"1px solid rgba(255,255,255,0.10)",textDecoration:"none"}}
                  onMouseEnter={e=>{const t=e.currentTarget.querySelector(".t") as HTMLElement;if(t)t.style.color="#60A5FA";}}
                  onMouseLeave={e=>{const t=e.currentTarget.querySelector(".t") as HTMLElement;if(t)t.style.color="#fff";}}>
                  <div style={{display:"flex",gap:"0.75rem",alignItems:"center",marginBottom:"0.4rem"}}>
                    <span style={{...MONO,fontSize:"0.42rem",letterSpacing:"0.2em",
                      textTransform:"uppercase",color:"#60A5FA"}}>{a.tag}</span>
                    <span style={{...MONO,fontSize:"0.42rem",
                      color:"rgba(255,255,255,0.28)"}}>{a.date}</span>
                  </div>
                  <div className="t" style={{fontSize:"clamp(0.92rem,2vw,1.1rem)",fontWeight:700,
                    letterSpacing:"-0.01em",color:"#fff",lineHeight:1.3,transition:"color 0.18s"}}>
                    {a.title}
                  </div>
                  <span style={{...MONO,fontSize:"0.44rem",letterSpacing:"0.14em",
                    textTransform:"uppercase",
                    color:a.href==="#"?"rgba(255,255,255,0.22)":"#60A5FA",
                    display:"block",marginTop:"0.45rem"}}>
                    {a.href==="#"?"Coming soon":"Read →"}
                  </span>
                </a>
              ))}
              <div style={{borderBottom:"1px solid rgba(255,255,255,0.08)",marginTop:"0.25rem"}}/>
            </div>
          </div>

          {/* ════════════════════════════════════
              CONTACT — scroll 0.87 — RETURN TO WEST
              Dramatic center CTA
          ════════════════════════════════════ */}
          <div style={{
            position:"absolute", inset:0,
            display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
            padding:"clamp(20px,5vw,60px)",
            opacity:contactOp, transition:"opacity 0.4s ease",
            pointerEvents:contactOp>0.05?"auto":"none",
          }}>
            <div style={{position:"absolute",inset:0,
              background:"radial-gradient(ellipse 80% 75% at 50% 55%, rgba(0,0,0,0.96) 0%, rgba(0,0,0,0.82) 50%, rgba(0,0,0,0.38) 80%, transparent 100%)",
              pointerEvents:"none"}}/>
            <div style={{position:"relative",textAlign:"center",maxWidth:540}}>
              <h2 style={{...BEBAS,fontSize:"clamp(3rem,12vw,9.5rem)",
                lineHeight:0.88,color:"#fff",marginBottom:"1.5rem"}}>
                Get in<br/><span style={{color:"#2563EB"}}>the room.</span>
              </h2>
              <p style={{...MONO,fontSize:"clamp(0.78rem,1.7vw,0.94rem)",
                color:"rgba(255,255,255,0.88)",lineHeight:2,marginBottom:"2rem"}}>
                Monthly meetups. Builder roundtables.<br/>No hype. Just the work.
              </p>
              <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
                <a href={TELEGRAM} target="_blank" rel="noopener noreferrer"
                  style={{padding:"14px 28px",background:"#2563EB",color:"#fff",...MONO,
                    fontSize:"0.65rem",letterSpacing:"0.18em",textTransform:"uppercase",
                    fontWeight:700,textDecoration:"none"}}>Join on Telegram →</a>
                <a href={INSTAGRAM} target="_blank" rel="noopener noreferrer"
                  style={{padding:"14px 28px",background:"rgba(255,255,255,0.06)",
                    color:"rgba(255,255,255,0.70)",...MONO,fontSize:"0.65rem",
                    letterSpacing:"0.18em",textTransform:"uppercase",fontWeight:600,
                    textDecoration:"none",border:"1px solid rgba(255,255,255,0.22)"}}>Instagram</a>
                <a href={X_URL} target="_blank" rel="noopener noreferrer"
                  style={{padding:"14px 28px",background:"rgba(255,255,255,0.06)",
                    color:"rgba(255,255,255,0.70)",...MONO,fontSize:"0.65rem",
                    letterSpacing:"0.18em",textTransform:"uppercase",fontWeight:600,
                    textDecoration:"none",border:"1px solid rgba(255,255,255,0.22)"}}>X / Twitter</a>
              </div>
            </div>
          </div>

        </div>{/* /sticky */}
      </div>{/* /scroll driver */}

      {/* ── Footer ── */}
      <footer style={{
        position:"relative",zIndex:2,background:"rgba(0,0,0,0.99)",
        borderTop:"1px solid rgba(255,255,255,0.07)",
        padding:"24px clamp(20px,4vw,52px)",
        display:"flex",alignItems:"center",justifyContent:"space-between",
        flexWrap:"wrap",gap:"1rem",
      }}>
        <span style={{...BEBAS,fontSize:"0.82rem",color:"rgba(255,255,255,0.18)"}}>
          OPENCLAW <span style={{color:"#2563EB"}}>SLC</span>
        </span>
        <div style={{display:"flex",gap:"2rem",flexWrap:"wrap"}}>
          {[["Telegram",TELEGRAM],["Instagram",INSTAGRAM],["X",X_URL]].map(([l,h])=>(
            <a key={l} href={h} target="_blank" rel="noopener noreferrer"
              style={{...MONO,fontSize:"0.5rem",letterSpacing:"0.16em",
                textTransform:"uppercase",color:"rgba(255,255,255,0.22)",textDecoration:"none"}}
              onMouseEnter={e=>(e.currentTarget.style.color="#2563EB")}
              onMouseLeave={e=>(e.currentTarget.style.color="rgba(255,255,255,0.22)")}>{l}</a>
          ))}
        </div>
        <span style={{...MONO,fontSize:"0.44rem",color:"rgba(255,255,255,0.07)",
          letterSpacing:"0.12em"}}>40°45′N · 111°53′W</span>
      </footer>
    </>
  );
}
