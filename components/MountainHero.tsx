"use client";
import { useEffect, useRef } from "react";

/* ─────────────────────────────────────────────────────────────────────────────
   Wasatch Mountain Hero
   Five SVG mountain layers with depth, aurora bands, star field, ridge glow.
   All hand-drawn paths inspired by the SLC-facing Wasatch Front.
──────────────────────────────────────────────────────────────────────────── */

const STARS = [
  [72,38],[145,22],[218,55],[310,18],[402,42],[488,12],[561,30],
  [640,52],[718,8],[800,34],[872,16],[948,44],[1030,25],[1112,38],
  [1195,10],[1270,28],[1358,50],[88,78],[190,62],[285,88],[375,68],
  [465,95],[552,72],[648,85],[740,60],[830,90],[920,70],[1010,82],
  [1105,65],[1200,88],[1310,74],[1400,55],[50,105],[160,95],[265,118],
  [360,100],[455,125],[548,108],[642,135],[738,115],[832,130],[928,105],
  [1025,120],[1118,100],[1212,135],[1308,115],[1402,95],[180,148],
  [295,138],[420,162],[535,145],[660,158],[775,140],[900,155],[1020,142],
  [1140,158],[1280,145],
];

export default function MountainHero() {
  const parallaxRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const onScroll = () => {
      if (!parallaxRef.current) return;
      const y = window.scrollY;
      parallaxRef.current.style.transform = `translateY(${y * 0.08}px)`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        zIndex: 0,
      }}
    >
      {/* ── Sky gradient ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, #010916 0%, #020d22 30%, #051535 60%, #0a2050 80%, #0d2860 100%)",
        }}
      />

      {/* ── Aurora band 1 (wide, slow) ── */}
      <div
        style={{
          position: "absolute",
          left: "-10%",
          top: "5%",
          width: "120%",
          height: "45%",
          background:
            "radial-gradient(ellipse 80% 60% at 35% 50%, rgba(6,182,212,0.18) 0%, transparent 65%)," +
            "radial-gradient(ellipse 60% 50% at 72% 45%, rgba(59,130,246,0.14) 0%, transparent 60%)",
          filter: "blur(28px)",
          animation: "aurora-drift 11s ease-in-out infinite alternate",
          pointerEvents: "none",
        }}
      />
      {/* ── Aurora band 2 (narrower, offset) ── */}
      <div
        style={{
          position: "absolute",
          left: "-5%",
          top: "12%",
          width: "110%",
          height: "35%",
          background:
            "radial-gradient(ellipse 70% 55% at 60% 55%, rgba(99,102,241,0.12) 0%, transparent 60%)," +
            "radial-gradient(ellipse 55% 45% at 20% 40%, rgba(34,211,238,0.10) 0%, transparent 55%)",
          filter: "blur(32px)",
          animation: "aurora-drift-2 14s ease-in-out infinite alternate",
          pointerEvents: "none",
        }}
      />
      {/* ── Aurora band 3 (accent shimmer) ── */}
      <div
        style={{
          position: "absolute",
          left: "10%",
          top: "8%",
          width: "80%",
          height: "30%",
          background:
            "radial-gradient(ellipse 90% 50% at 50% 50%, rgba(96,165,250,0.09) 0%, transparent 70%)",
          filter: "blur(20px)",
          animation: "aurora-drift-3 9s ease-in-out infinite alternate",
          pointerEvents: "none",
        }}
      />

      {/* ── Mountain SVG ── */}
      <svg
        viewBox="0 0 1440 560"
        preserveAspectRatio="xMidYMax slice"
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "100%",
          height: "85%",
          overflow: "visible",
        }}
      >
        <defs>
          {/* Ridge glow gradient */}
          <radialGradient id="ridgeGlow" cx="50%" cy="0%" r="70%">
            <stop offset="0%"  stopColor="#60A5FA" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#60A5FA" stopOpacity="0" />
          </radialGradient>
          {/* Snow cap gradient */}
          <linearGradient id="snowGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor="#EFF6FF" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#BFDBFE" stopOpacity="0.5" />
          </linearGradient>
          {/* Layer gradients for depth illusion */}
          <linearGradient id="layer5Grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0C2040" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#051535" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="layer4Grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0F2D58" stopOpacity="0.70" />
            <stop offset="100%" stopColor="#071B44" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="layer3Grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#163A70" stopOpacity="0.80" />
            <stop offset="100%" stopColor="#0A2255" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="layer2Grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1A4585" stopOpacity="0.88" />
            <stop offset="100%" stopColor="#0D2B60" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="layer1Grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1B3F82" stopOpacity="0.92" />
            <stop offset="100%" stopColor="#0F2A5C" stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* Stars */}
        <g ref={parallaxRef}>
          {STARS.map(([x, y], i) => (
            <circle
              key={i}
              cx={x} cy={y}
              r={i % 5 === 0 ? 1.2 : i % 3 === 0 ? 0.9 : 0.6}
              fill="white"
              opacity={0.4 + (i % 6) * 0.1}
              style={{
                animation: `star-twinkle ${2.5 + (i % 7) * 0.4}s ease-in-out infinite`,
                animationDelay: `${(i % 11) * 0.3}s`,
              }}
            />
          ))}
        </g>

        {/* ── Layer 5: Distant ghost range ── */}
        <path
          d="M0,560 L0,428 Q80,412 160,418 Q240,408 320,415 Q400,405 480,412
             Q560,402 640,410 Q720,400 800,408 Q880,398 960,406
             Q1040,398 1120,406 Q1200,400 1280,408 Q1360,402 1440,410
             L1440,560 Z"
          fill="url(#layer5Grad)"
        />

        {/* ── Layer 4: Mid-distance range ── */}
        <path
          d="M0,560 L0,400 Q50,378 100,385 Q150,362 200,350
             Q250,335 300,322 Q340,312 380,305 Q420,298 460,292
             Q490,288 520,295 Q550,300 580,308 Q610,316 650,320
             Q700,325 750,318 Q800,308 850,300 Q890,292 940,302
             Q990,312 1040,322 Q1090,332 1140,342 Q1190,352 1250,365
             Q1330,380 1440,395 L1440,560 Z"
          fill="url(#layer4Grad)"
        />

        {/* ── Layer 3: Main Wasatch silhouette (most dramatic) ── */}
        <path
          d="M0,560 L0,368 Q30,345 65,352 Q100,328 140,312
             Q175,295 215,272 Q255,250 295,228 Q330,208 368,185
             Q400,165 432,148 Q460,132 490,118 Q516,105 540,100
             Q564,108 582,120 Q605,135 640,152 Q672,168 710,178
             Q745,190 778,200 Q810,195 845,175 Q875,155 910,168
             Q945,182 980,195 Q1015,208 1055,222 Q1095,236 1138,252
             Q1180,268 1225,285 Q1275,302 1330,318 Q1380,332 1440,345
             L1440,560 Z"
          fill="url(#layer3Grad)"
        />

        {/* Ridge glow — sits along the top edge of layer 3 */}
        <path
          d="M0,368 Q30,345 65,352 Q100,328 140,312
             Q175,295 215,272 Q255,250 295,228 Q330,208 368,185
             Q400,165 432,148 Q460,132 490,118 Q516,105 540,100
             Q564,108 582,120 Q605,135 640,152 Q672,168 710,178
             Q745,190 778,200 Q810,195 845,175 Q875,155 910,168
             Q945,182 980,195 Q1015,208 1055,222 Q1095,236 1138,252
             Q1180,268 1225,285 Q1275,302 1330,318 Q1380,332 1440,345"
          fill="none"
          stroke="url(#ridgeGlow)"
          strokeWidth="60"
          opacity="0.6"
        />
        {/* Thin bright ridge line */}
        <path
          d="M0,368 Q30,345 65,352 Q100,328 140,312
             Q175,295 215,272 Q255,250 295,228 Q330,208 368,185
             Q400,165 432,148 Q460,132 490,118 Q516,105 540,100
             Q564,108 582,120 Q605,135 640,152 Q672,168 710,178
             Q745,190 778,200 Q810,195 845,175 Q875,155 910,168
             Q945,182 980,195 Q1015,208 1055,222 Q1095,236 1138,252
             Q1180,268 1225,285 Q1275,302 1330,318 Q1380,332 1440,345"
          fill="none"
          stroke="rgba(96,165,250,0.35)"
          strokeWidth="1.2"
        />

        {/* ── Snow caps (layer 3 peaks) ── */}
        {/* Lone Peak — x=540, y=100 */}
        <path
          d="M524,118 Q532,106 540,100 Q548,106 556,118 Q549,112 540,108 Q531,112 524,118 Z"
          fill="url(#snowGrad)"
          opacity="0.9"
        />
        {/* Twin Peaks area — x=490, y=118 */}
        <path
          d="M478,132 Q484,120 492,118 Q500,124 506,135 Q499,128 492,124 Q485,128 478,132 Z"
          fill="url(#snowGrad)"
          opacity="0.75"
        />
        {/* x=432, y=148 */}
        <path
          d="M424,162 Q430,150 438,148 Q445,153 450,165 Q444,156 438,152 Q432,156 424,162 Z"
          fill="url(#snowGrad)"
          opacity="0.65"
        />
        {/* x=845, y=175 */}
        <path
          d="M838,188 Q843,177 849,175 Q855,180 860,192 Q854,184 849,181 Q843,184 838,188 Z"
          fill="url(#snowGrad)"
          opacity="0.60"
        />

        {/* ── Layer 2: Closer range, softer ── */}
        <path
          d="M0,560 L0,440 Q60,422 120,428 Q185,412 245,402
             Q305,390 365,380 Q415,370 460,362 Q500,355 535,360
             Q565,366 598,372 Q635,378 675,382 Q715,386 755,378
             Q798,368 842,358 Q885,348 928,358 Q972,368 1018,378
             Q1065,388 1112,400 Q1162,412 1218,428 Q1285,445 1440,462
             L1440,560 Z"
          fill="url(#layer2Grad)"
        />

        {/* ── Layer 1: Foreground foothills ── */}
        <path
          d="M0,560 L0,490 Q90,472 180,478 Q270,465 360,472
             Q450,460 540,468 Q630,456 720,464 Q810,452 900,462
             Q990,470 1080,460 Q1170,450 1260,462 Q1350,472 1440,468
             L1440,560 Z"
          fill="url(#layer1Grad)"
        />

        {/* ── Horizon glow (very subtle cyan line at mountain top) ── */}
        <ellipse
          cx="720" cy="100" rx="480" ry="18"
          fill="none"
          stroke="rgba(34,211,238,0.12)"
          strokeWidth="36"
          filter="url(#blur)"
        />
      </svg>

      {/* ── Vignette edges ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 100% 100% at 50% 50%, transparent 50%, rgba(2,11,30,0.7) 100%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
