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

/* ─── Sections ────────────────────────────────────────────────── */
const SECTIONS = { hero: 0.00, events: 0.35, media: 0.65, contact: 0.88 };
const HW = { hero: 0.14, events: 0.12, media: 0.12, contact: 0.12 };

function sectionOpacity(scroll: number, peak: number, halfW: number): number {
  return Math.max(0, 1 - Math.abs(scroll - peak) / halfW);
}

function orbitLabel(s: number): { dir: string; desc: string } {
  if (s < 0.12) return { dir:"W",  desc:"WEST · SLC VALLEY" };
  if (s < 0.28) return { dir:"SW", desc:"SOUTH FLANK"       };
  if (s < 0.55) return { dir:"E",  desc:"BACK OF RANGE"     };
  if (s < 0.78) return { dir:"N",  desc:"NORTH FLANK"       };
  return              { dir:"W",  desc:"RETURN"             };
}

/* ─── Data ────────────────────────────────────────────────────── */
const EVENTS = [
  { date:"MAR 20", title:"AI Agents & Crypto Infrastructure", type:"Meetup"      },
  { date:"APR 10", title:"DeFi × AI: The New Stack",          type:"Panel"       },
  { date:"APR 24", title:"Founders Roundtable",               type:"Invite Only" },
  { date:"MAY 08", title:"Builder Demo Night",                 type:"Open"        },
];
const ARTICLES = [
  { tag:"GUIDE",     date:"MAR 2026", title:"OpenClaw Setup Best Practices",                        href:"/articles/openclaw-setup" },
  { tag:"DEEP DIVE", date:"MAR 2026", title:"AI Agents in the Wasatch: Why SLC Is Quietly Winning", href:"#"                        },
  { tag:"OPS",       date:"FEB 2026", title:"Running Agents Locally Without Losing Your Mind",       href:"#"                        },
];

/* ─── Compass Rose SVG ────────────────────────────────────────── */
function CompassRose() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{opacity:0.35}}>
      <circle cx="24" cy="24" r="22" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5"/>
      <circle cx="24" cy="24" r="16" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5"/>
      {/* Cardinal lines */}
      <line x1="24" y1="2" x2="24" y2="10" stroke="rgba(255,255,255,0.3)" strokeWidth="0.75"/>
      <line x1="24" y1="38" x2="24" y2="46" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5"/>
      <line x1="2" y1="24" x2="10" y2="24" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5"/>
      <line x1="38" y1="24" x2="46" y2="24" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5"/>
      {/* North indicator */}
      <polygon points="24,4 22,12 26,12" fill="rgba(255,255,255,0.25)"/>
      {/* Labels */}
      <text x="24" y="17" textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="5" fontFamily="'JetBrains Mono',monospace" letterSpacing="0.5">N</text>
      <text x="24" y="36" textAnchor="middle" fill="rgba(255,255,255,0.20)" fontSize="4" fontFamily="'JetBrains Mono',monospace">S</text>
      <text x="14" y="26" textAnchor="middle" fill="rgba(255,255,255,0.20)" fontSize="4" fontFamily="'JetBrains Mono',monospace">W</text>
      <text x="34" y="26" textAnchor="middle" fill="rgba(255,255,255,0.20)" fontSize="4" fontFamily="'JetBrains Mono',monospace">E</text>
    </svg>
  );
}

/* ─── Page ────────────────────────────────────────────────────── */
export default function Home() {
  const [scroll,   setScroll]   = useState(0);
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

  const handleCameraUpdate = useCallback((info: CameraInfo) => { cameraRef.current = info; }, []);
  const getCameraInfo      = useCallback(() => cameraRef.current, []);

  const goTo = (frac: number) => {
    window.scrollTo({ top: (document.body.scrollHeight - window.innerHeight) * frac, behavior:"smooth" });
    setMenuOpen(false);
  };

  const heroOp    = sectionOpacity(scroll, SECTIONS.hero,    HW.hero);
  const eventsOp  = sectionOpacity(scroll, SECTIONS.events,  HW.events);
  const mediaOp   = sectionOpacity(scroll, SECTIONS.media,   HW.media);
  const contactOp = sectionOpacity(scroll, SECTIONS.contact, HW.contact);
  const ghostOp   = 1 - Math.min(1, Math.max(eventsOp, mediaOp, contactOp) * 1.4);

  const { dir, desc } = orbitLabel(scroll);

  return (
    <>
      {/* ── 3D mountain — fixed background ── */}
      <MountainGL onCameraUpdate={handleCameraUpdate} />
      <PeakLabels getCameraInfo={getCameraInfo} />

      {/* ═══════════════════════════════════════════════════════
          OPENCLAW SLC — THE FOCAL POINT
          Massive wordmark, clearly readable, layered over mountain.
          This IS the hero. The mountain is the texture beneath it.
      ═══════════════════════════════════════════════════════ */}
      <div aria-hidden style={{
        position:"fixed", top:"50%", left:0, right:0,
        transform:"translateY(-55%)", zIndex:3,
        overflow:"hidden", pointerEvents:"none", userSelect:"none",
        textAlign:"center",
        padding:"0 clamp(4px,1vw,12px)",
        opacity: ghostOp,
        transition:"opacity 0.5s ease",
      }}>
        {/* Main wordmark — fills viewport width */}
        <div style={{
          ...BEBAS,
          fontSize:"min(24vw, 22rem)",
          lineHeight:0.85,
          letterSpacing:"-0.02em",
          whiteSpace:"nowrap",
        }}>
          <span style={{
            color:"rgba(255,255,255,0.28)",
            textShadow:"0 0 80px rgba(255,255,255,0.06)",
          }}>OPEN</span>
          <span style={{
            color:"rgba(37,99,235,0.55)",
            textShadow:"0 0 80px rgba(37,99,235,0.12)",
          }}>CLAW</span>
        </div>
        {/* SLC — stacked below, wide letter-spacing */}
        <div style={{
          ...BEBAS,
          fontSize:"min(10vw, 9rem)",
          letterSpacing:"0.55em",
          color:"rgba(255,255,255,0.16)",
          marginTop:"-0.08em",
          textShadow:"0 0 60px rgba(255,255,255,0.04)",
        }}>SLC</div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          CARTOGRAPHIC OVERLAY — architectural drafting elements
          Compass rose, coordinates, elevation scale, border frame
      ═══════════════════════════════════════════════════════ */}

      {/* Architectural border frame — thin inset rectangle */}
      <div style={{
        position:"fixed", inset:"10px", zIndex:2,
        border:"1px solid rgba(255,255,255,0.04)",
        pointerEvents:"none",
        opacity: ghostOp,
        transition:"opacity 0.5s ease",
      }}/>

      {/* Compass rose — upper left, below nav */}
      <div style={{
        position:"fixed", top:64, left:"clamp(16px,3vw,40px)", zIndex:2,
        pointerEvents:"none",
        opacity: ghostOp * 0.9,
        transition:"opacity 0.5s ease",
      }}>
        <CompassRose />
      </div>

      {/* Elevation scale — left edge, vertical */}
      <div style={{
        position:"fixed", left:"clamp(16px,3vw,36px)", top:"50%",
        transform:"translateY(-50%)", zIndex:2,
        pointerEvents:"none",
        display:"flex", flexDirection:"column", alignItems:"flex-start", gap:0,
        opacity: ghostOp * 0.6,
        transition:"opacity 0.5s ease",
      }}>
        {["11,330′","10,000′","9,000′","8,000′"].map((elev, i) => (
          <div key={elev} style={{display:"flex",alignItems:"center",gap:4,
            marginBottom: i < 3 ? "clamp(16px,3vh,28px)" : 0}}>
            <div style={{width:8,height:"0.5px",background:"rgba(255,255,255,0.12)"}}/>
            <span style={{...MONO,fontSize:"0.32rem",letterSpacing:"0.08em",
              color:"rgba(255,255,255,0.14)",whiteSpace:"nowrap"}}>{elev}</span>
          </div>
        ))}
      </div>

      {/* Right edge — range label (vertical text) */}
      <div style={{
        position:"fixed", right:14, top:"50%",
        transform:"translateY(-50%) rotate(90deg)", zIndex:2,
        pointerEvents:"none",
        opacity: ghostOp * 0.5,
        transition:"opacity 0.5s ease",
      }}>
        <span style={{...MONO,fontSize:"0.32rem",letterSpacing:"0.3em",
          textTransform:"uppercase",color:"rgba(255,255,255,0.10)",whiteSpace:"nowrap"}}>
          WASATCH NATIONAL FOREST · CENTRAL RANGE
        </span>
      </div>

      {/* Bottom coordinates bar */}
      <div style={{
        position:"fixed", bottom:14, left:0, right:0, zIndex:2,
        display:"flex", justifyContent:"center", gap:"clamp(12px,4vw,32px)",
        pointerEvents:"none",
        opacity: ghostOp * 0.7,
        transition:"opacity 0.5s ease",
      }}>
        <span style={{...MONO,fontSize:"0.34rem",letterSpacing:"0.18em",color:"rgba(255,255,255,0.12)"}}>
          40°45′N
        </span>
        <span style={{...MONO,fontSize:"0.34rem",letterSpacing:"0.18em",color:"rgba(37,99,235,0.18)"}}>
          ◆
        </span>
        <span style={{...MONO,fontSize:"0.34rem",letterSpacing:"0.18em",color:"rgba(255,255,255,0.12)"}}>
          111°53′W
        </span>
        <span style={{...MONO,fontSize:"0.34rem",letterSpacing:"0.18em",color:"rgba(37,99,235,0.18)"}}>
          ◆
        </span>
        <span style={{...MONO,fontSize:"0.34rem",letterSpacing:"0.18em",color:"rgba(255,255,255,0.12)"}}>
          UTAH, USA
        </span>
      </div>

      {/* ── Orbit compass — top-right ── */}
      <div style={{
        position:"fixed", top:62, right:"clamp(16px,3vw,40px)", zIndex:10,
        pointerEvents:"none",
        display:"flex", flexDirection:"column", alignItems:"flex-end", gap:3,
      }}>
        <span style={{...BEBAS, fontSize:"clamp(1.6rem,4vw,2.4rem)",
          color:"rgba(255,255,255,0.50)", lineHeight:1}}>{dir}</span>
        <span style={{...MONO, fontSize:"0.38rem", letterSpacing:"0.22em",
          textTransform:"uppercase", color:"rgba(255,255,255,0.22)"}}>{desc}</span>
        <div style={{width:"clamp(44px,8vw,80px)", height:1.5,
          background:"rgba(255,255,255,0.08)", marginTop:4, position:"relative"}}>
          <div style={{position:"absolute",top:0,left:0,bottom:0,
            width:`${scroll*100}%`,background:"#2563EB",transition:"width 0.1s linear"}}/>
        </div>
      </div>

      {/* ── Full-screen nav menu ── */}
      <div onClick={() => setMenuOpen(false)} style={{
        position:"fixed", inset:0, zIndex:300,
        background:"rgba(0,0,0,0.97)", backdropFilter:"blur(16px)",
        display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
        gap:"1.25rem",
        opacity:menuOpen?1:0, pointerEvents:menuOpen?"all":"none",
        transition:"opacity 0.25s ease",
      }}>
        <button onClick={e=>{e.stopPropagation();setMenuOpen(false);}}
          style={{position:"absolute",top:20,right:"clamp(20px,4vw,52px)",background:"none",
            border:"none",cursor:"pointer",...MONO,fontSize:"0.55rem",letterSpacing:"0.22em",
            textTransform:"uppercase",color:"rgba(255,255,255,0.25)"}}>ESC / CLOSE</button>

        {([["Events",SECTIONS.events],["Media",SECTIONS.media],["Contact",SECTIONS.contact]] as [string,number][]).map(([l,f])=>(
          <button key={l} onClick={()=>goTo(f)}
            style={{...BEBAS,fontSize:"clamp(2.8rem,9vw,6.5rem)",color:"#fff",
              background:"none",border:"none",cursor:"pointer",transition:"color 0.15s"}}
            onMouseEnter={e=>(e.currentTarget.style.color="#2563EB")}
            onMouseLeave={e=>(e.currentTarget.style.color="#fff")}>{l}</button>
        ))}

        <a href={TELEGRAM} target="_blank" rel="noopener noreferrer" onClick={()=>setMenuOpen(false)}
          style={{marginTop:"0.75rem",padding:"13px 28px",background:"#2563EB",color:"#fff",
            ...MONO,fontSize:"0.62rem",letterSpacing:"0.18em",textTransform:"uppercase",
            fontWeight:700,textDecoration:"none"}}>Join on Telegram →</a>
        <div style={{display:"flex",gap:"2rem",marginTop:"0.5rem"}}>
          {([["X",X_URL],["Instagram",INSTAGRAM]] as [string,string][]).map(([l,h])=>(
            <a key={l} href={h} target="_blank" rel="noopener noreferrer"
              style={{...MONO,fontSize:"0.52rem",letterSpacing:"0.16em",textTransform:"uppercase",
                color:"rgba(255,255,255,0.2)",textDecoration:"none"}}
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
        background:"rgba(0,0,0,0.78)",backdropFilter:"blur(20px)",
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

      {/* ═══════════════════════════════════════════════════════
          SCROLL DRIVER  500vh
      ═══════════════════════════════════════════════════════ */}
      <div style={{height:"500vh"}}>
        <div style={{position:"sticky",top:0,height:"100vh",overflow:"hidden"}}>

          {/* HERO — bottom text */}
          <div style={{
            position:"absolute",bottom:0,left:0,right:0,zIndex:5,
            padding:"0 clamp(20px,5vw,60px) clamp(32px,6vh,68px)",
            opacity:heroOp, transition:"opacity 0.4s ease",
            pointerEvents:heroOp>0.05?"auto":"none",
          }}>
            <div style={{position:"absolute",bottom:0,left:0,right:0,height:"75%",
              background:"linear-gradient(to top,rgba(0,0,0,1) 0%,rgba(0,0,0,0.92) 32%,rgba(0,0,0,0.50) 62%,transparent 100%)",
              pointerEvents:"none"}}/>
            <div style={{position:"relative"}}>
              <p style={{...MONO,fontSize:"clamp(0.88rem,2.0vw,1.08rem)",
                color:"rgba(255,255,255,0.92)",maxWidth:380,lineHeight:1.85,
                marginBottom:"1.5rem",fontWeight:500}}>
                Salt Lake City&apos;s AI and crypto builder community.
              </p>
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                <button onClick={()=>goTo(SECTIONS.events)}
                  style={{padding:"13px 26px",background:"#2563EB",color:"#fff",...MONO,
                    fontSize:"0.62rem",letterSpacing:"0.18em",textTransform:"uppercase",
                    fontWeight:700,border:"none",cursor:"pointer"}}>SEE EVENTS →</button>
                <a href={TELEGRAM} target="_blank" rel="noopener noreferrer"
                  style={{padding:"13px 26px",background:"rgba(255,255,255,0.06)",
                    color:"rgba(255,255,255,0.80)",...MONO,fontSize:"0.62rem",
                    letterSpacing:"0.18em",textTransform:"uppercase",fontWeight:600,
                    textDecoration:"none",border:"1px solid rgba(255,255,255,0.22)"}}>JOIN</a>
              </div>
            </div>
          </div>

          {/* Scroll hint */}
          <div style={{
            position:"absolute",bottom:"clamp(18px,3vh,28px)",left:"50%",
            transform:"translateX(-50%)",zIndex:5,
            opacity:heroOp*0.55, transition:"opacity 0.4s ease", pointerEvents:"none",
            display:"flex",flexDirection:"column",alignItems:"center",gap:6,
          }}>
            <span style={{...MONO,fontSize:"0.38rem",letterSpacing:"0.22em",
              textTransform:"uppercase",color:"rgba(255,255,255,0.18)"}}>SCROLL</span>
            <div style={{width:1,height:24,background:"linear-gradient(to bottom,rgba(255,255,255,0.18),transparent)"}}/>
          </div>

          {/* EVENTS — scroll 0.35 */}
          <div style={{
            position:"absolute",inset:0,zIndex:5,
            display:"flex",alignItems:"center",justifyContent:"center",
            padding:"clamp(60px,9vh,88px) clamp(16px,4vw,48px)",
            opacity:eventsOp, transition:"opacity 0.4s ease",
            pointerEvents:eventsOp>0.05?"auto":"none",
          }}>
            <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.93)",pointerEvents:"none"}}/>
            <div style={{position:"relative",width:"100%",maxWidth:560}}>
              <div style={{...MONO,fontSize:"0.42rem",letterSpacing:"0.28em",
                textTransform:"uppercase",color:"#2563EB",marginBottom:"0.6rem"}}>UPCOMING</div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",
                marginBottom:"1.5rem",flexWrap:"wrap",gap:"0.5rem"}}>
                <span style={{...BEBAS,fontSize:"clamp(2.4rem,6vw,4.5rem)",color:"#fff",lineHeight:1}}>Events</span>
                <a href={LUMA} target="_blank" rel="noopener noreferrer"
                  style={{...MONO,fontSize:"0.48rem",letterSpacing:"0.2em",
                    textTransform:"uppercase",color:"#60A5FA",textDecoration:"none"}}>Luma →</a>
              </div>
              {EVENTS.map((ev,i)=>(
                <div key={i} style={{display:"grid",
                  gridTemplateColumns:isMobile?"3.5rem 1fr":"4.5rem 1fr auto",
                  gap:"clamp(8px,2vw,20px)",alignItems:"center",
                  padding:"1rem 0",borderTop:"1px solid rgba(255,255,255,0.12)"}}>
                  <span style={{...MONO,fontSize:"0.48rem",color:"rgba(255,255,255,0.55)",
                    letterSpacing:"0.08em"}}>{ev.date}</span>
                  <span style={{fontSize:"clamp(0.88rem,2vw,1.1rem)",fontWeight:700,
                    color:"#fff",lineHeight:1.3}}>{ev.title}</span>
                  {!isMobile && <span style={{...MONO,fontSize:"0.42rem",letterSpacing:"0.14em",
                    textTransform:"uppercase",color:"#93C5FD",whiteSpace:"nowrap"}}>{ev.type}</span>}
                </div>
              ))}
              <div style={{borderTop:"1px solid rgba(255,255,255,0.06)",marginTop:"0.1rem",paddingTop:"1.2rem"}}>
                <a href={LUMA} target="_blank" rel="noopener noreferrer"
                  style={{display:"inline-block",padding:"12px 24px",background:"#2563EB",
                    color:"#fff",...MONO,fontSize:"0.60rem",letterSpacing:"0.18em",
                    textTransform:"uppercase",fontWeight:700,textDecoration:"none"}}>RSVP on Luma →</a>
              </div>
            </div>
          </div>

          {/* MEDIA — scroll 0.65 */}
          <div style={{
            position:"absolute",inset:0,zIndex:5,
            display:"flex",alignItems:"center",justifyContent:"center",
            padding:"clamp(60px,9vh,88px) clamp(16px,4vw,48px)",
            opacity:mediaOp, transition:"opacity 0.4s ease",
            pointerEvents:mediaOp>0.05?"auto":"none",
          }}>
            <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.93)",pointerEvents:"none"}}/>
            <div style={{position:"relative",width:"100%",maxWidth:560}}>
              <div style={{...MONO,fontSize:"0.42rem",letterSpacing:"0.28em",
                textTransform:"uppercase",color:"#2563EB",marginBottom:"0.6rem"}}>MEDIA &amp; WRITING</div>
              <span style={{...BEBAS,fontSize:"clamp(2.4rem,6vw,4.5rem)",
                color:"#fff",lineHeight:1,display:"block",marginBottom:"1.5rem"}}>Articles</span>
              {ARTICLES.map((a,i)=>(
                <a key={i} href={a.href}
                  style={{display:"block",padding:"0.9rem 0",
                    borderTop:"1px solid rgba(255,255,255,0.08)",textDecoration:"none"}}
                  onMouseEnter={e=>{const t=e.currentTarget.querySelector(".t") as HTMLElement;if(t)t.style.color="#60A5FA";}}
                  onMouseLeave={e=>{const t=e.currentTarget.querySelector(".t") as HTMLElement;if(t)t.style.color="#fff";}}>
                  <div style={{display:"flex",gap:"0.6rem",alignItems:"center",marginBottom:"0.3rem"}}>
                    <span style={{...MONO,fontSize:"0.40rem",letterSpacing:"0.2em",
                      textTransform:"uppercase",color:"#60A5FA"}}>{a.tag}</span>
                    <span style={{...MONO,fontSize:"0.40rem",color:"rgba(255,255,255,0.25)"}}>{a.date}</span>
                  </div>
                  <div className="t" style={{fontSize:"clamp(0.90rem,2vw,1.08rem)",fontWeight:700,
                    color:"#fff",lineHeight:1.3,transition:"color 0.18s"}}>{a.title}</div>
                  <span style={{...MONO,fontSize:"0.42rem",letterSpacing:"0.14em",textTransform:"uppercase",
                    color:a.href==="#"?"rgba(255,255,255,0.20)":"#60A5FA",
                    display:"block",marginTop:"0.35rem"}}>{a.href==="#"?"Coming soon":"Read →"}</span>
                </a>
              ))}
            </div>
          </div>

          {/* CONTACT — scroll 0.88 */}
          <div style={{
            position:"absolute",inset:0,zIndex:5,
            display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
            padding:"clamp(20px,5vw,60px)",
            opacity:contactOp, transition:"opacity 0.4s ease",
            pointerEvents:contactOp>0.05?"auto":"none",
          }}>
            <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.93)",pointerEvents:"none"}}/>
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
                  style={{padding:"13px 26px",background:"#2563EB",color:"#fff",...MONO,
                    fontSize:"0.62rem",letterSpacing:"0.18em",textTransform:"uppercase",
                    fontWeight:700,textDecoration:"none"}}>Join on Telegram →</a>
                <a href={INSTAGRAM} target="_blank" rel="noopener noreferrer"
                  style={{padding:"13px 26px",background:"rgba(255,255,255,0.06)",
                    color:"rgba(255,255,255,0.72)",...MONO,fontSize:"0.62rem",
                    letterSpacing:"0.18em",textTransform:"uppercase",fontWeight:600,
                    textDecoration:"none",border:"1px solid rgba(255,255,255,0.20)"}}>Instagram</a>
                <a href={X_URL} target="_blank" rel="noopener noreferrer"
                  style={{padding:"13px 26px",background:"rgba(255,255,255,0.06)",
                    color:"rgba(255,255,255,0.72)",...MONO,fontSize:"0.62rem",
                    letterSpacing:"0.18em",textTransform:"uppercase",fontWeight:600,
                    textDecoration:"none",border:"1px solid rgba(255,255,255,0.20)"}}>X / Twitter</a>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer style={{
        position:"relative",zIndex:2,background:"rgba(0,0,0,0.99)",
        borderTop:"1px solid rgba(255,255,255,0.06)",
        padding:"22px clamp(20px,4vw,52px)",
        display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"1rem",
      }}>
        <span style={{...BEBAS,fontSize:"0.8rem",color:"rgba(255,255,255,0.16)"}}>
          OPENCLAW <span style={{color:"#2563EB"}}>SLC</span>
        </span>
        <div style={{display:"flex",gap:"2rem",flexWrap:"wrap"}}>
          {([["Telegram",TELEGRAM],["Instagram",INSTAGRAM],["X",X_URL]] as [string,string][]).map(([l,h])=>(
            <a key={l} href={h} target="_blank" rel="noopener noreferrer"
              style={{...MONO,fontSize:"0.48rem",letterSpacing:"0.16em",textTransform:"uppercase",
                color:"rgba(255,255,255,0.20)",textDecoration:"none"}}
              onMouseEnter={e=>(e.currentTarget.style.color="#2563EB")}
              onMouseLeave={e=>(e.currentTarget.style.color="rgba(255,255,255,0.20)")}>{l}</a>
          ))}
        </div>
        <span style={{...MONO,fontSize:"0.42rem",color:"rgba(255,255,255,0.06)",
          letterSpacing:"0.12em"}}>40°45′N · 111°53′W</span>
      </footer>
    </>
  );
}
