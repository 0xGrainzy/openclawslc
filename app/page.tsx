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

/* ─── Scroll → section mapping (0–1) ─────────────────────────── */
// Page is 300vh. These are fractional scroll positions where each
// section is fully visible.
const SECTIONS = {
  hero:    0.00,
  events:  0.28,
  media:   0.56,
  contact: 0.84,
};

/* ─── Fade helper ─────────────────────────────────────────────── */
function sectionOpacity(scroll: number, peak: number, halfW = 0.14): number {
  return Math.max(0, 1 - Math.abs(scroll - peak) / halfW);
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
    tag:"GUIDE",   date:"MAR 2026",
    title:"OpenClaw Setup Best Practices",
    href:"/articles/openclaw-setup",
  },
  {
    tag:"DEEP DIVE", date:"MAR 2026",
    title:"AI Agents in the Wasatch: Why SLC Is Quietly Winning",
    href:"#",
  },
  {
    tag:"OPS",     date:"FEB 2026",
    title:"Running Agents Locally Without Losing Your Mind",
    href:"#",
  },
];

/* ─── Page ────────────────────────────────────────────────────── */
export default function Home() {
  const [scroll, setScroll]   = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const cameraRef = useRef<CameraInfo | null>(null);

  /* Scroll progress 0–1 */
  useEffect(() => {
    const fn = () => {
      const max = document.body.scrollHeight - window.innerHeight;
      setScroll(max > 0 ? window.scrollY / max : 0);
    };
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  /* Close menu on scroll */
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

  /* Scroll to a section by fraction */
  const goTo = (frac: number) => {
    const max = document.body.scrollHeight - window.innerHeight;
    window.scrollTo({ top: max * frac, behavior: "smooth" });
    setMenuOpen(false);
  };

  /* Opacity values for each section */
  const heroOp    = sectionOpacity(scroll, SECTIONS.hero,    0.12);
  const eventsOp  = sectionOpacity(scroll, SECTIONS.events,  0.15);
  const mediaOp   = sectionOpacity(scroll, SECTIONS.media,   0.15);
  const contactOp = sectionOpacity(scroll, SECTIONS.contact, 0.13);

  return (
    <>
      {/* ── 3D mountain — fixed background ── */}
      <MountainGL onCameraUpdate={handleCameraUpdate} />
      <PeakLabels getCameraInfo={getCameraInfo} />

      {/* ── Ghost OPENCLAW SLC banner — always visible, behind content ── */}
      <div aria-hidden style={{
        position:"fixed", bottom:0, left:0, right:0, zIndex:1,
        padding:"0 clamp(16px,4vw,48px) clamp(14px,3vh,32px)",
        pointerEvents:"none", userSelect:"none",
      }}>
        <div style={{
          ...BEBAS,
          fontSize:"min(19vw, 18rem)",
          lineHeight:0.82,
          color:"rgba(255,255,255,0.055)",
          letterSpacing:"-0.01em",
          whiteSpace:"nowrap",
          overflow:"hidden",
        }}>
          OPEN<span style={{color:"rgba(37,99,235,0.10)"}}>CLAW</span>{" "}
          <span style={{color:"rgba(255,255,255,0.032)"}}>SLC</span>
        </div>
      </div>

      {/* ── Full-screen menu overlay ── */}
      <div
        onClick={() => setMenuOpen(false)}
        style={{
          position:"fixed", inset:0, zIndex:300,
          background:"rgba(0,0,0,0.96)", backdropFilter:"blur(16px)",
          display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
          gap:"1.25rem",
          opacity:menuOpen?1:0, pointerEvents:menuOpen?"all":"none",
          transition:"opacity 0.25s ease",
        }}
      >
        <button
          onClick={e=>{e.stopPropagation();setMenuOpen(false);}}
          style={{position:"absolute",top:20,right:"clamp(20px,4vw,52px)",background:"none",border:"none",cursor:"pointer",...MONO,fontSize:"0.55rem",letterSpacing:"0.22em",textTransform:"uppercase",color:"rgba(255,255,255,0.25)"}}
        >ESC / CLOSE</button>

        {[
          { label:"Events",  frac: SECTIONS.events  },
          { label:"Media",   frac: SECTIONS.media   },
          { label:"Contact", frac: SECTIONS.contact },
        ].map(l=>(
          <button key={l.label} onClick={()=>goTo(l.frac)}
            style={{...BEBAS,fontSize:"clamp(2.8rem,9vw,6.5rem)",color:"#fff",background:"none",border:"none",cursor:"pointer",transition:"color 0.15s"}}
            onMouseEnter={e=>(e.currentTarget.style.color="#2563EB")}
            onMouseLeave={e=>(e.currentTarget.style.color="#fff")}
          >{l.label}</button>
        ))}

        <a href={TELEGRAM} target="_blank" rel="noopener noreferrer"
          onClick={()=>setMenuOpen(false)}
          style={{marginTop:"0.75rem",padding:"13px 28px",background:"#2563EB",color:"#fff",...MONO,fontSize:"0.62rem",letterSpacing:"0.18em",textTransform:"uppercase",fontWeight:700,textDecoration:"none"}}
        >Join on Telegram →</a>

        <div style={{display:"flex",gap:"2rem",marginTop:"0.5rem"}}>
          {[["X",X_URL],["Instagram",INSTAGRAM]].map(([l,h])=>(
            <a key={l} href={h} target="_blank" rel="noopener noreferrer"
              style={{...MONO,fontSize:"0.52rem",letterSpacing:"0.16em",textTransform:"uppercase",color:"rgba(255,255,255,0.2)",textDecoration:"none"}}
              onMouseEnter={e=>(e.currentTarget.style.color="#2563EB")}
              onMouseLeave={e=>(e.currentTarget.style.color="rgba(255,255,255,0.2)")}
            >{l}</a>
          ))}
        </div>

        <span style={{position:"absolute",bottom:24,...MONO,fontSize:"0.44rem",letterSpacing:"0.2em",color:"rgba(255,255,255,0.08)"}}>
          40°45′N · 111°53′W
        </span>
      </div>

      {/* ── Fixed nav ── */}
      <nav style={{
        position:"fixed",top:0,left:0,right:0,zIndex:100,
        display:"flex",alignItems:"center",justifyContent:"space-between",
        padding:"0 clamp(20px,4vw,52px)",height:52,
        borderBottom:"1px solid rgba(255,255,255,0.05)",
        background:"rgba(0,0,0,0.6)",backdropFilter:"blur(20px)",
      }}>
        <button onClick={()=>goTo(0)} style={{...BEBAS,background:"none",border:"none",cursor:"pointer",fontSize:"0.9rem",letterSpacing:"0.2em",color:"#fff",padding:0}}>
          OPENCLAW <span style={{color:"#2563EB"}}>SLC</span>
        </button>
        <button onClick={()=>setMenuOpen(o=>!o)} aria-label="Menu"
          style={{background:"none",border:"none",cursor:"pointer",padding:"8px 0",display:"flex",flexDirection:"column",gap:5,alignItems:"flex-end"}}
        >
          <span style={{display:"block",width:22,height:1.5,background:"rgba(255,255,255,0.75)"}}/>
          <span style={{display:"block",width:15,height:1.5,background:"rgba(255,255,255,0.75)"}}/>
          <span style={{display:"block",width:22,height:1.5,background:"rgba(255,255,255,0.75)"}}/>
        </button>
      </nav>

      {/* ── Scroll height driver (300vh gives 4 distinct scroll beats) ── */}
      <div style={{height:"300vh"}}>

        {/* Sticky viewport — all section overlays live here */}
        <div style={{position:"sticky",top:0,height:"100vh",overflow:"hidden"}}>

          {/* ═══════════════════════════════════
              HERO — visible at scroll 0
              Bottom-left brand statement
          ═══════════════════════════════════ */}
          <div style={{
            position:"absolute",bottom:0,left:0,right:0,
            padding:"0 clamp(20px,5vw,60px) clamp(28px,5vh,56px)",
            opacity:heroOp,
            transition:"opacity 0.4s ease",
            pointerEvents:heroOp>0.1?"auto":"none",
          }}>
            {/* Bottom gradient */}
            <div style={{position:"absolute",bottom:0,left:0,right:0,height:"65%",background:"linear-gradient(to top,rgba(0,0,0,0.92) 0%,transparent 100%)",pointerEvents:"none"}}/>
            <div style={{position:"relative"}}>
              {/* Section tag */}
              <div style={{...MONO,fontSize:"0.48rem",letterSpacing:"0.26em",textTransform:"uppercase",color:"rgba(255,255,255,0.18)",marginBottom:"0.8rem"}}>
                40°45′N · 111°53′W · Wasatch Front
              </div>
              {/* Tagline */}
              <p style={{...MONO,fontSize:"clamp(0.78rem,1.8vw,1.05rem)",color:"rgba(255,255,255,0.28)",maxWidth:340,lineHeight:1.9,marginBottom:"1.5rem"}}>
                Salt Lake City's AI and crypto builder community.
              </p>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                <button onClick={()=>goTo(SECTIONS.events)}
                  style={{padding:"13px 26px",background:"#2563EB",color:"#fff",...MONO,fontSize:"0.62rem",letterSpacing:"0.18em",textTransform:"uppercase",fontWeight:700,border:"none",cursor:"pointer"}}
                >See Events →</button>
                <a href={TELEGRAM} target="_blank" rel="noopener noreferrer"
                  style={{padding:"13px 26px",background:"transparent",color:"rgba(255,255,255,0.45)",...MONO,fontSize:"0.62rem",letterSpacing:"0.18em",textTransform:"uppercase",fontWeight:600,textDecoration:"none",border:"1px solid rgba(255,255,255,0.14)"}}
                >Join</a>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════
              EVENTS — visible at scroll 0.28
              Left column, mid-screen
          ═══════════════════════════════════ */}
          <div style={{
            position:"absolute",top:"50%",left:0,transform:"translateY(-50%)",
            width:"clamp(280px,55vw,520px)",
            padding:"clamp(24px,4vw,48px)",
            opacity:eventsOp,
            transition:"opacity 0.4s ease",
            pointerEvents:eventsOp>0.1?"auto":"none",
          }}>
            {/* Soft dark background for readability */}
            <div style={{position:"absolute",inset:0,background:"linear-gradient(to right,rgba(0,0,0,0.88) 0%,rgba(0,0,0,0.60) 70%,transparent 100%)",pointerEvents:"none"}}/>
            <div style={{position:"relative"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:"1.75rem",flexWrap:"wrap",gap:"0.75rem"}}>
                <span style={{...BEBAS,fontSize:"clamp(1.8rem,5vw,4rem)",color:"#fff",lineHeight:1}}>Events</span>
                <a href={LUMA} target="_blank" rel="noopener noreferrer"
                  style={{...MONO,fontSize:"0.5rem",letterSpacing:"0.2em",textTransform:"uppercase",color:"#2563EB",textDecoration:"none"}}
                >Luma →</a>
              </div>
              {EVENTS.map((ev,i)=>(
                <div key={i} style={{display:"grid",gridTemplateColumns:"4.5rem 1fr auto",gap:"clamp(8px,2vw,20px)",alignItems:"center",padding:"1rem 0",borderTop:"1px solid rgba(255,255,255,0.07)"}}>
                  <span style={{...MONO,fontSize:"0.52rem",color:"rgba(255,255,255,0.25)",letterSpacing:"0.1em"}}>{ev.date}</span>
                  <span style={{fontSize:"clamp(0.88rem,1.8vw,1.15rem)",fontWeight:600,letterSpacing:"-0.02em",color:"#fff"}}>{ev.title}</span>
                  <span style={{...MONO,fontSize:"0.44rem",letterSpacing:"0.16em",textTransform:"uppercase",color:"#2563EB",whiteSpace:"nowrap"}}>{ev.type}</span>
                </div>
              ))}
              <div style={{borderBottom:"1px solid rgba(255,255,255,0.07)"}}/>
            </div>
          </div>

          {/* ═══════════════════════════════════
              MEDIA & WRITING — visible at 0.56
              Right column, mid-screen
          ═══════════════════════════════════ */}
          <div style={{
            position:"absolute",top:"50%",right:0,transform:"translateY(-50%)",
            width:"clamp(260px,52vw,480px)",
            padding:"clamp(24px,4vw,48px)",
            opacity:mediaOp,
            transition:"opacity 0.4s ease",
            pointerEvents:mediaOp>0.1?"auto":"none",
          }}>
            <div style={{position:"absolute",inset:0,background:"linear-gradient(to left,rgba(0,0,0,0.88) 0%,rgba(0,0,0,0.60) 70%,transparent 100%)",pointerEvents:"none"}}/>
            <div style={{position:"relative"}}>
              <span style={{...BEBAS,fontSize:"clamp(1.8rem,5vw,4rem)",color:"#fff",lineHeight:1,display:"block",marginBottom:"1.75rem"}}>
                Media &amp; Writings
              </span>
              {ARTICLES.map((a,i)=>(
                <a key={i} href={a.href}
                  style={{display:"block",padding:"1rem 0",borderTop:"1px solid rgba(255,255,255,0.07)",textDecoration:"none"}}
                  onMouseEnter={e=>{(e.currentTarget.querySelector(".t") as HTMLElement).style.color="#2563EB";}}
                  onMouseLeave={e=>{(e.currentTarget.querySelector(".t") as HTMLElement).style.color="#fff";}}
                >
                  <div style={{display:"flex",gap:"0.75rem",alignItems:"center",marginBottom:"0.45rem"}}>
                    <span style={{...MONO,fontSize:"0.42rem",letterSpacing:"0.2em",textTransform:"uppercase",color:"rgba(37,99,235,0.8)"}}>{a.tag}</span>
                    <span style={{...MONO,fontSize:"0.42rem",color:"rgba(255,255,255,0.2)"}}>{a.date}</span>
                  </div>
                  <div className="t" style={{fontSize:"clamp(0.9rem,1.8vw,1.1rem)",fontWeight:700,letterSpacing:"-0.02em",color:"#fff",lineHeight:1.25,transition:"color 0.18s"}}>
                    {a.title}
                  </div>
                  {a.href!=="# " && (
                    <span style={{...MONO,fontSize:"0.44rem",letterSpacing:"0.14em",textTransform:"uppercase",color:a.href==="#"?"rgba(255,255,255,0.18)":"#2563EB",display:"block",marginTop:"0.5rem"}}>
                      {a.href==="#"?"Coming soon":"Read →"}
                    </span>
                  )}
                </a>
              ))}
              <div style={{borderBottom:"1px solid rgba(255,255,255,0.07)"}}/>
            </div>
          </div>

          {/* ═══════════════════════════════════
              CONTACT — visible at scroll 0.84
              Center, dramatic
          ═══════════════════════════════════ */}
          <div style={{
            position:"absolute",inset:0,
            display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
            padding:"clamp(20px,5vw,60px)",
            opacity:contactOp,
            transition:"opacity 0.4s ease",
            pointerEvents:contactOp>0.1?"auto":"none",
          }}>
            <div style={{textAlign:"center",maxWidth:520}}>
              <h2 style={{...BEBAS,fontSize:"clamp(3rem,11vw,9rem)",lineHeight:0.88,color:"#fff",marginBottom:"1.5rem"}}>
                Get in<br/><span style={{color:"#2563EB"}}>the room.</span>
              </h2>
              <p style={{...MONO,fontSize:"clamp(0.7rem,1.6vw,0.88rem)",color:"rgba(255,255,255,0.28)",lineHeight:2,marginBottom:"2rem"}}>
                Monthly meetups. Builder roundtables.<br/>No hype. Just the work.
              </p>
              <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
                <a href={TELEGRAM} target="_blank" rel="noopener noreferrer"
                  style={{padding:"13px 26px",background:"#2563EB",color:"#fff",...MONO,fontSize:"0.62rem",letterSpacing:"0.18em",textTransform:"uppercase",fontWeight:700,textDecoration:"none"}}
                >Join on Telegram →</a>
                <a href={INSTAGRAM} target="_blank" rel="noopener noreferrer"
                  style={{padding:"13px 26px",background:"transparent",color:"rgba(255,255,255,0.42)",...MONO,fontSize:"0.62rem",letterSpacing:"0.18em",textTransform:"uppercase",fontWeight:600,textDecoration:"none",border:"1px solid rgba(255,255,255,0.14)"}}
                >Instagram</a>
                <a href={X_URL} target="_blank" rel="noopener noreferrer"
                  style={{padding:"13px 26px",background:"transparent",color:"rgba(255,255,255,0.42)",...MONO,fontSize:"0.62rem",letterSpacing:"0.18em",textTransform:"uppercase",fontWeight:600,textDecoration:"none",border:"1px solid rgba(255,255,255,0.14)"}}
                >X</a>
              </div>
            </div>
          </div>

          {/* ── Scroll indicator (hero only) ── */}
          <div style={{
            position:"absolute",bottom:"clamp(18px,3vh,28px)",left:"50%",transform:"translateX(-50%)",
            opacity:heroOp*0.6,transition:"opacity 0.4s ease",pointerEvents:"none",
            display:"flex",flexDirection:"column",alignItems:"center",gap:6,
          }}>
            <span style={{...MONO,fontSize:"0.42rem",letterSpacing:"0.22em",textTransform:"uppercase",color:"rgba(255,255,255,0.2)"}}>SCROLL</span>
            <div style={{width:1,height:28,background:"linear-gradient(to bottom,rgba(255,255,255,0.18),transparent)"}}/>
          </div>

        </div>{/* /sticky */}
      </div>{/* /scroll driver */}

      {/* ── Footer (below scroll) ── */}
      <footer style={{
        position:"relative",zIndex:2,background:"rgba(0,0,0,0.98)",
        borderTop:"1px solid rgba(255,255,255,0.06)",
        padding:"24px clamp(20px,4vw,52px)",
        display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"1rem",
      }}>
        <span style={{...BEBAS,fontSize:"0.82rem",color:"rgba(255,255,255,0.14)"}}>
          OPENCLAW <span style={{color:"#2563EB"}}>SLC</span>
        </span>
        <div style={{display:"flex",gap:"2rem",flexWrap:"wrap"}}>
          {[["Telegram",TELEGRAM],["Instagram",INSTAGRAM],["X",X_URL]].map(([l,h])=>(
            <a key={l} href={h} target="_blank" rel="noopener noreferrer"
              style={{...MONO,fontSize:"0.5rem",letterSpacing:"0.16em",textTransform:"uppercase",color:"rgba(255,255,255,0.2)",textDecoration:"none"}}
              onMouseEnter={e=>(e.currentTarget.style.color="#2563EB")}
              onMouseLeave={e=>(e.currentTarget.style.color="rgba(255,255,255,0.2)")}
            >{l}</a>
          ))}
        </div>
        <span style={{...MONO,fontSize:"0.44rem",color:"rgba(255,255,255,0.07)",letterSpacing:"0.12em"}}>40°45′N · 111°53′W</span>
      </footer>
    </>
  );
}
