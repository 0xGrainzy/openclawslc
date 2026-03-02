"use client";
import { useState, useEffect } from "react";

const LINKS = [
  { label: "Events",    href: "#events" },
  { label: "Team",      href: "#team" },
  { label: "Builders",  href: "#builders" },
  { label: "Community", href: "#community" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open,     setOpen]     = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <header
        style={{
          position: "fixed",
          top: 0, left: 0, right: 0,
          zIndex: 100,
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 clamp(20px,4vw,56px)",
          background: scrolled && !open
            ? "rgba(3,15,36,0.88)"
            : "transparent",
          backdropFilter: scrolled && !open ? "blur(20px) saturate(160%)" : "none",
          borderBottom: scrolled && !open
            ? "1px solid rgba(96,165,250,0.08)"
            : "none",
          transition: "background 0.4s, backdrop-filter 0.4s, border 0.4s",
        }}
      >
        {/* Logo */}
        <a
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
            zIndex: 201,
          }}
        >
          {/* Claw + mountain micro-icon */}
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none"
            style={{ animation: "logo-glow 4s ease-in-out infinite" }}>
            {/* Mountain silhouette */}
            <path d="M2,22 L8,10 L12,16 L16,8 L22,18 L26,22 Z"
              fill="none" stroke="rgba(96,165,250,0.5)" strokeWidth="1.2"
              strokeLinejoin="round"/>
            {/* Claw marks */}
            <path d="M10,22 Q12,16 14,22" fill="none" stroke="#60A5FA" strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M13,22 Q15,15 17,22" fill="none" stroke="#93C5FD" strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M16,22 Q18,17 20,22" fill="none" stroke="#BAE6FD" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          <span style={{
            fontWeight: 700,
            fontSize: "0.85rem",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "#EFF6FF",
          }}>
            OpenClaw <span style={{ color: "#60A5FA" }}>SLC</span>
          </span>
        </a>

        {/* Desktop nav */}
        <nav style={{ display: "flex", gap: "2.5rem", alignItems: "center" }}>
          {LINKS.map(l => (
            <a key={l.label} href={l.href} className="nav-link-hover"
              style={{ display: open ? "none" : undefined }}>
              {l.label}
            </a>
          ))}
          <a
            href="#join"
            style={{
              fontSize: "0.65rem",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              fontWeight: 600,
              padding: "8px 18px",
              background: "rgba(29,78,216,0.25)",
              border: "1px solid rgba(96,165,250,0.35)",
              color: "#BAE6FD",
              textDecoration: "none",
              transition: "background 0.2s, border-color 0.2s",
            }}
            onMouseEnter={e => {
              (e.target as HTMLElement).style.background = "rgba(59,130,246,0.35)";
              (e.target as HTMLElement).style.borderColor = "rgba(96,165,250,0.6)";
            }}
            onMouseLeave={e => {
              (e.target as HTMLElement).style.background = "rgba(29,78,216,0.25)";
              (e.target as HTMLElement).style.borderColor = "rgba(96,165,250,0.35)";
            }}
          >
            Join →
          </a>
        </nav>
      </header>
    </>
  );
}
