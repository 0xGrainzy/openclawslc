"use client";
import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";

const MountainGL = dynamic(() => import("@/components/MountainGL"), { ssr: false });

/* ─── Social links ────────────────────────────────────────────── */
const TELEGRAM  = "https://t.me/+AJ4r6fjsQdRhMWEx";
const INSTAGRAM = "https://www.instagram.com/openclawslc?igsh=b3RjdmVhd2hlY3p3&utm_source=qr";
const X_URL     = "https://x.com/openclawslc";
const LUMA      = "https://lu.ma/openclawslc";

/* ─── Shared styles ───────────────────────────────────────────── */
const BEBAS: React.CSSProperties = { fontFamily:"'Bebas Neue',sans-serif", letterSpacing:"0.02em" };
const MONO: React.CSSProperties  = { fontFamily:"'JetBrains Mono','Fira Code','Courier New',monospace" };

/* ─── Types ───────────────────────────────────────────────────── */
interface Event {
  id: string;
  title: string;
  date: string;
  description: string;
  lumaUrl: string;
  createdAt: string;
}

const ARTICLES = [
  { tag:"GUIDE",     date:"MAR 2026", title:"OpenClaw Setup Best Practices",                        href:"/articles/openclaw-setup" },
  { tag:"DEEP DIVE", date:"MAR 2026", title:"AI Agents in the Wasatch: Why SLC Is Quietly Winning", href:"/articles/ai-agents-wasatch"        },
  { tag:"OPS",       date:"FEB 2026", title:"Running Agents Locally Without Losing Your Mind",       href:"/articles/running-agents-locally"  },
];

function orbitLabel(s: number): { dir: string; desc: string } {
  if (s < 0.12) return { dir:"W",  desc:"WEST · SLC VALLEY" };
  if (s < 0.28) return { dir:"SW", desc:"SOUTH FLANK"       };
  if (s < 0.55) return { dir:"E",  desc:"BACK OF RANGE"     };
  if (s < 0.78) return { dir:"N",  desc:"NORTH FLANK"       };
  return              { dir:"W",  desc:"RETURN"             };
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scroll, setScroll]     = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [events, setEvents]     = useState<Event[]>([]);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/events");
      if (!res.ok) return;
      const data = await res.json();
      setEvents(data.events ?? []);
    } catch {
      // Silently fail — site still works without events
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

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

  const goTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  const { dir, desc } = orbitLabel(scroll);

  return (
    <>
      <MountainGL />

      {/* Orbit compass */}
      <div style={{position:"fixed", top:62, right:"clamp(16px,3vw,40px)", zIndex:10, pointerEvents:"none",
        display:"flex", flexDirection:"column", alignItems:"flex-end", gap:3}}>
        <span style={{...BEBAS, fontSize:"clamp(1.6rem,4vw,2.4rem)", color:"rgba(255,255,255,0.50)", lineHeight:1}}>{dir}</span>
        <span style={{...MONO, fontSize:"0.38rem", letterSpacing:"0.22em", textTransform:"uppercase", color:"rgba(255,255,255,0.22)"}}>{desc}</span>
        <div style={{width:"clamp(44px,8vw,80px)", height:1.5, background:"rgba(255,255,255,0.08)", marginTop:4, position:"relative"}}>
          <div style={{position:"absolute",top:0,left:0,bottom:0, width:`${scroll*100}%`,background:"#2563EB",transition:"width 0.1s linear"}}/>
        </div>
      </div>

      {/* Full-screen menu */}
      <div onClick={()=>setMenuOpen(false)} style={{
        position:"fixed", inset:0, zIndex:300, background:"rgba(0,0,0,0.97)", backdropFilter:"blur(16px)",
        display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"1.25rem",
        opacity:menuOpen?1:0, pointerEvents:menuOpen?"all":"none", transition:"opacity 0.25s ease",
      }}>
        <button onClick={e=>{e.stopPropagation();setMenuOpen(false);}}
          style={{position:"absolute",top:20,right:"clamp(20px,4vw,52px)",background:"none",border:"none",cursor:"pointer",
            ...MONO,fontSize:"0.55rem",letterSpacing:"0.22em",textTransform:"uppercase",color:"rgba(255,255,255,0.25)"}}>CLOSE</button>
        {(["events","media","contact"] as const).map(id=>(
          <button key={id} onClick={()=>goTo(id)}
            style={{...BEBAS,fontSize:"clamp(2.8rem,9vw,6.5rem)",color:"#fff",background:"none",border:"none",cursor:"pointer",transition:"color 0.15s",textTransform:"capitalize"}}
            onMouseEnter={e=>(e.currentTarget.style.color="#2563EB")}
            onMouseLeave={e=>(e.currentTarget.style.color="#fff")}>{id}</button>
        ))}
        <a href={TELEGRAM} target="_blank" rel="noopener noreferrer"
          style={{marginTop:"0.75rem",padding:"13px 28px",background:"#2563EB",color:"#fff",
            ...MONO,fontSize:"0.62rem",letterSpacing:"0.18em",textTransform:"uppercase",fontWeight:700,textDecoration:"none"}}>Join on Telegram →</a>
      </div>

      {/* Nav */}
      <nav style={{
        position:"fixed",top:0,left:0,right:0,zIndex:100,
        display:"flex",alignItems:"center",justifyContent:"space-between",
        padding:"0 clamp(20px,4vw,52px)",height:52,
        borderBottom:"1px solid rgba(255,255,255,0.07)",
        background:"rgba(0,0,0,0.78)",backdropFilter:"blur(20px)",
      }}>
        <button onClick={()=>goTo("hero")} style={{...BEBAS,background:"none",border:"none",cursor:"pointer",fontSize:"0.9rem",letterSpacing:"0.2em",color:"#fff",padding:0}}>
          OPENCLAW <span style={{color:"#2563EB"}}>SLC</span>
        </button>
        <button onClick={()=>setMenuOpen(o=>!o)} aria-label="Menu"
          style={{background:"none",border:"none",cursor:"pointer",padding:"8px 0",display:"flex",flexDirection:"column",gap:5,alignItems:"flex-end"}}>
          <span style={{display:"block",width:22,height:1.5,background:"rgba(255,255,255,0.85)"}}/>
          <span style={{display:"block",width:15,height:1.5,background:"rgba(255,255,255,0.85)"}}/>
          <span style={{display:"block",width:22,height:1.5,background:"rgba(255,255,255,0.85)"}}/>
        </button>
      </nav>

      {/* ═══ SECTION: HERO ═══ */}
      <section id="hero" className="snap-section" style={{
        height:"100vh", position:"relative",
        display:"flex", flexDirection:"column", justifyContent:"flex-end",
        padding:"0 clamp(20px,5vw,60px) clamp(32px,6vh,68px)",
      }}>
        <div aria-hidden style={{
          position:"absolute", top:"38%", left:0, right:0, transform:"translateY(-50%)",
          zIndex:1, textAlign:"center", pointerEvents:"none", userSelect:"none",
        }}>
          <div style={{...BEBAS, fontSize:"min(24vw, 22rem)", lineHeight:0.85, letterSpacing:"-0.02em", whiteSpace:"nowrap"}}>
            <span style={{color:"rgba(255,255,255,0.22)"}}>OPEN</span>
            <span style={{color:"rgba(37,99,235,0.45)"}}>CLAW</span>
          </div>
          <div style={{...BEBAS, fontSize:"min(10vw, 9rem)", letterSpacing:"0.55em", color:"rgba(255,255,255,0.12)", marginTop:"-0.08em"}}>SLC</div>
        </div>
        <div style={{position:"absolute",bottom:0,left:0,right:0,height:"60%",
          background:"linear-gradient(to top,rgba(0,0,0,0.95) 0%,rgba(0,0,0,0.7) 40%,transparent 100%)",
          pointerEvents:"none",zIndex:2}}/>
        <div style={{position:"relative",zIndex:3}}>
          <p style={{...MONO,fontSize:"clamp(0.88rem,2.0vw,1.08rem)",color:"rgba(255,255,255,0.92)",maxWidth:380,lineHeight:1.85,marginBottom:"1.5rem",fontWeight:500}}>
            Salt Lake City&apos;s AI community.
          </p>
          <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
            <button onClick={()=>goTo("events")}
              style={{padding:"13px 26px",background:"#2563EB",color:"#fff",...MONO,fontSize:"0.62rem",letterSpacing:"0.18em",textTransform:"uppercase",fontWeight:700,border:"none",cursor:"pointer"}}>SEE EVENTS →</button>
            <a href={TELEGRAM} target="_blank" rel="noopener noreferrer"
              style={{padding:"13px 26px",background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.80)",...MONO,fontSize:"0.62rem",letterSpacing:"0.18em",textTransform:"uppercase",fontWeight:600,textDecoration:"none",border:"1px solid rgba(255,255,255,0.22)"}}>JOIN</a>
          </div>
        </div>
        <div style={{position:"absolute",bottom:"clamp(18px,3vh,28px)",left:"50%",transform:"translateX(-50%)",zIndex:3,
          display:"flex",flexDirection:"column",alignItems:"center",gap:6,pointerEvents:"none"}}>
          <span style={{...MONO,fontSize:"0.38rem",letterSpacing:"0.22em",textTransform:"uppercase",color:"rgba(255,255,255,0.18)"}}>SCROLL</span>
          <div style={{width:1,height:24,background:"linear-gradient(to bottom,rgba(255,255,255,0.18),transparent)"}}/>
        </div>
      </section>

      {/* ═══ SECTION: EVENTS ═══ */}
      <section id="events" className="snap-section" style={{
        height:"100vh", position:"relative",
        display:"flex", alignItems:"center", justifyContent:"center",
        padding:"clamp(60px,9vh,88px) clamp(16px,4vw,48px)",
      }}>
        <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.72)",zIndex:1}}/>
        <div style={{position:"relative",width:"100%",maxWidth:560,zIndex:2}}>
          <div style={{...MONO,fontSize:"0.42rem",letterSpacing:"0.28em",textTransform:"uppercase",color:"#2563EB",marginBottom:"0.6rem"}}>UPCOMING</div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:"1.5rem",flexWrap:"wrap",gap:"0.5rem"}}>
            <span style={{...BEBAS,fontSize:"clamp(2.4rem,6vw,4.5rem)",color:"#fff",lineHeight:1}}>Events</span>
            <a href={LUMA} target="_blank" rel="noopener noreferrer"
              style={{...MONO,fontSize:"0.48rem",letterSpacing:"0.2em",textTransform:"uppercase",color:"#60A5FA",textDecoration:"none"}}>Luma →</a>
          </div>
          {events.length === 0 ? (
            <div style={{padding:"1.5rem 0",borderTop:"1px solid rgba(255,255,255,0.12)"}}>
              <span style={{...MONO,fontSize:"0.58rem",color:"rgba(255,255,255,0.35)",letterSpacing:"0.08em"}}>
                No upcoming events scheduled. Check back soon.
              </span>
            </div>
          ) : (
            (() => {
              const now = new Date();
              const sorted = [...events].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
              return sorted.map((ev) => {
                const evDate = new Date(ev.date);
                const isPast = evDate < now;
                const monthDay = evDate.toLocaleDateString("en-US",{month:"short",day:"numeric"}).toUpperCase();
                return (
                  <div key={ev.id} style={{
                    padding:"1rem 0",borderTop:"1px solid rgba(255,255,255,0.12)",
                    opacity: isPast ? 0.45 : 1,
                    transition:"opacity 0.2s",
                  }}>
                    <div style={{display:"grid",gridTemplateColumns:isMobile?"3.5rem 1fr":"4.5rem 1fr",
                      gap:"clamp(8px,2vw,20px)",alignItems:"flex-start"}}>
                      <div style={{paddingTop:"0.15rem"}}>
                        <span style={{...MONO,fontSize:"0.45rem",color:isPast?"rgba(255,255,255,0.35)":"rgba(255,255,255,0.55)",letterSpacing:"0.08em",display:"block"}}>{monthDay}</span>
                        {isPast && <span style={{...MONO,fontSize:"0.38rem",letterSpacing:"0.12em",textTransform:"uppercase",color:"rgba(255,255,255,0.25)"}}>PAST</span>}
                      </div>
                      <div>
                        <span style={{fontSize:"clamp(0.88rem,2vw,1.05rem)",fontWeight:700,color:isPast?"rgba(255,255,255,0.45)":"#fff",lineHeight:1.35,display:"block",marginBottom:"0.3rem"}}>{ev.title}</span>
                        {ev.description && !isMobile && (
                          <span style={{fontSize:"0.78rem",color:"rgba(255,255,255,0.45)",lineHeight:1.6,display:"block",marginBottom:"0.4rem"}}>{ev.description}</span>
                        )}
                        <a href={ev.lumaUrl} target="_blank" rel="noopener noreferrer"
                          style={{...MONO,fontSize:"0.42rem",letterSpacing:"0.14em",textTransform:"uppercase",
                            color:isPast?"rgba(255,255,255,0.25)":"#60A5FA",textDecoration:"none",
                            display:"inline-flex",alignItems:"center",gap:"0.3rem",pointerEvents:isPast?"none":"auto"}}>
                          RSVP on Luma →
                        </a>
                      </div>
                    </div>
                  </div>
                );
              });
            })()
          )}
          <div style={{borderTop:"1px solid rgba(255,255,255,0.06)",marginTop:"0.1rem",paddingTop:"1.2rem"}}>
            <a href={LUMA} target="_blank" rel="noopener noreferrer"
              style={{display:"inline-block",padding:"12px 24px",background:"#2563EB",color:"#fff",...MONO,fontSize:"0.60rem",letterSpacing:"0.18em",textTransform:"uppercase",fontWeight:700,textDecoration:"none"}}>VIEW ALL ON LUMA →</a>
          </div>
        </div>
      </section>

      {/* ═══ SECTION: MEDIA ═══ */}
      <section id="media" className="snap-section" style={{
        height:"100vh", position:"relative",
        display:"flex", alignItems:"center", justifyContent:"center",
        padding:"clamp(60px,9vh,88px) clamp(16px,4vw,48px)",
      }}>
        <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.72)",zIndex:1}}/>
        <div style={{position:"relative",width:"100%",maxWidth:560,zIndex:2}}>
          <div style={{...MONO,fontSize:"0.42rem",letterSpacing:"0.28em",textTransform:"uppercase",color:"#2563EB",marginBottom:"0.6rem"}}>MEDIA &amp; WRITING</div>
          <span style={{...BEBAS,fontSize:"clamp(2.4rem,6vw,4.5rem)",color:"#fff",lineHeight:1,display:"block",marginBottom:"1.5rem"}}>Articles</span>
          {ARTICLES.map((a,i)=>(
            <a key={i} href={a.href}
              style={{display:"block",padding:"0.9rem 0",borderTop:"1px solid rgba(255,255,255,0.08)",textDecoration:"none"}}
              onMouseEnter={e=>{const t=e.currentTarget.querySelector(".t") as HTMLElement;if(t)t.style.color="#60A5FA";}}
              onMouseLeave={e=>{const t=e.currentTarget.querySelector(".t") as HTMLElement;if(t)t.style.color="#fff";}}>
              <div style={{display:"flex",gap:"0.6rem",alignItems:"center",marginBottom:"0.3rem"}}>
                <span style={{...MONO,fontSize:"0.40rem",letterSpacing:"0.2em",textTransform:"uppercase",color:"#60A5FA"}}>{a.tag}</span>
                <span style={{...MONO,fontSize:"0.40rem",color:"rgba(255,255,255,0.25)"}}>{a.date}</span>
              </div>
              <div className="t" style={{fontSize:"clamp(0.90rem,2vw,1.08rem)",fontWeight:700,color:"#fff",lineHeight:1.3,transition:"color 0.18s"}}>{a.title}</div>
              <span style={{...MONO,fontSize:"0.42rem",letterSpacing:"0.14em",textTransform:"uppercase",color:"#60A5FA",display:"block",marginTop:"0.35rem"}}>Read →</span>
            </a>
          ))}
        </div>
      </section>

      {/* ═══ SECTION: CONTACT ═══ */}
      <section id="contact" className="snap-section" style={{
        height:"100vh", position:"relative",
        display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
        padding:"clamp(20px,5vw,60px)",
      }}>
        <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.72)",zIndex:1}}/>
        <div style={{position:"relative",textAlign:"center",maxWidth:540,zIndex:2}}>
          <h2 style={{...BEBAS,fontSize:"clamp(3rem,12vw,9.5rem)",lineHeight:0.88,color:"#fff",marginBottom:"1.5rem"}}>
            Get in<br/><span style={{color:"#2563EB"}}>the room.</span>
          </h2>
          <p style={{...MONO,fontSize:"clamp(0.78rem,1.7vw,0.94rem)",color:"rgba(255,255,255,0.88)",lineHeight:2,marginBottom:"2rem"}}>
            Monthly meetups. Builder roundtables.<br/>No hype. Just the work.
          </p>
          <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
            <a href={TELEGRAM} target="_blank" rel="noopener noreferrer"
              style={{padding:"13px 26px",background:"#2563EB",color:"#fff",...MONO,fontSize:"0.62rem",letterSpacing:"0.18em",textTransform:"uppercase",fontWeight:700,textDecoration:"none"}}>Join on Telegram →</a>
            <a href={INSTAGRAM} target="_blank" rel="noopener noreferrer"
              style={{padding:"13px 26px",background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.72)",...MONO,fontSize:"0.62rem",letterSpacing:"0.18em",textTransform:"uppercase",fontWeight:600,textDecoration:"none",border:"1px solid rgba(255,255,255,0.20)"}}>Instagram</a>
            <a href={X_URL} target="_blank" rel="noopener noreferrer"
              style={{padding:"13px 26px",background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.72)",...MONO,fontSize:"0.62rem",letterSpacing:"0.18em",textTransform:"uppercase",fontWeight:600,textDecoration:"none",border:"1px solid rgba(255,255,255,0.20)"}}>X / Twitter</a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        position:"relative",zIndex:2,background:"rgba(0,0,0,0.99)",
        borderTop:"1px solid rgba(255,255,255,0.06)",
        padding:"22px clamp(20px,4vw,52px)",
        display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"1rem",
      }}>
        <span style={{...BEBAS,fontSize:"0.8rem",color:"rgba(255,255,255,0.16)"}}>OPENCLAW <span style={{color:"#2563EB"}}>SLC</span></span>
        <div style={{display:"flex",gap:"2rem",flexWrap:"wrap"}}>
          {([["Telegram",TELEGRAM],["Instagram",INSTAGRAM],["X",X_URL]] as [string,string][]).map(([l,h])=>(
            <a key={l} href={h} target="_blank" rel="noopener noreferrer"
              style={{...MONO,fontSize:"0.48rem",letterSpacing:"0.16em",textTransform:"uppercase",color:"rgba(255,255,255,0.20)",textDecoration:"none"}}
              onMouseEnter={e=>(e.currentTarget.style.color="#2563EB")}
              onMouseLeave={e=>(e.currentTarget.style.color="rgba(255,255,255,0.20)")}>{l}</a>
          ))}
        </div>
        <span style={{...MONO,fontSize:"0.42rem",color:"rgba(255,255,255,0.06)",letterSpacing:"0.12em"}}>40°45′N · 111°53′W</span>
      </footer>
    </>
  );
}
