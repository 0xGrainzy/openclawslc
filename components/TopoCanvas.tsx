"use client";
import { useEffect, useRef, useCallback } from "react";

/* ─────────────────────────────────────────────────────────────────
   Field-warp mountain.
   Parallel lines bend around terrain — like spacetime curving.
   Mouse creates a local pressure wave.
   No scan. No stars. Just the field.
───────────────────────────────────────────────────────────────── */

const PEAKS = [
  { pos: 0.08, h: 0.30, w: 0.055 },
  { pos: 0.18, h: 0.44, w: 0.058 },
  { pos: 0.28, h: 0.60, w: 0.050 },
  { pos: 0.37, h: 0.74, w: 0.044 },
  { pos: 0.44, h: 0.86, w: 0.038 },
  { pos: 0.51, h: 0.96, w: 0.032 }, // Twin Peaks
  { pos: 0.57, h: 1.00, w: 0.028 }, // Lone Peak — summit
  { pos: 0.63, h: 0.88, w: 0.036 },
  { pos: 0.70, h: 0.76, w: 0.044 },
  { pos: 0.78, h: 0.62, w: 0.052 },
  { pos: 0.87, h: 0.46, w: 0.058 },
  { pos: 0.94, h: 0.30, w: 0.052 },
];

function terrain(nx: number): number {
  let h = 0;
  for (const p of PEAKS) {
    h += p.h * Math.exp(-((nx - p.pos) ** 2) / (2 * p.w * p.w));
  }
  return Math.min(1, Math.max(0, h));
}

interface Mouse { x: number; y: number }

export default function TopoCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);
  const startRef  = useRef<number>(0);
  const mouseRef  = useRef<Mouse>({ x: -9999, y: -9999 });

  const draw = useCallback((ts: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (!startRef.current) startRef.current = ts;
    const t = (ts - startRef.current) / 1000;

    const dpr = window.devicePixelRatio || 1;
    const W = canvas.width  / dpr;
    const H = canvas.height / dpr;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    // Background — pure black
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, W, H);

    const NUM_LINES  = 22;
    const FIELD_TOP  = H * 0.08;   // first line at 8% from top
    const FIELD_BOT  = H * 0.90;   // last line at 90%
    const MAX_LIFT   = H * 0.52;   // how high the peak lifts lines
    // slow breath: ±2% amplitude over 9s
    const breathe = 1 + 0.022 * Math.sin((t * Math.PI * 2) / 9);

    const { x: mx, y: my } = mouseRef.current;
    const MOUSE_R = Math.min(W, H) * 0.28; // influence radius

    for (let li = 0; li < NUM_LINES; li++) {
      const frac   = li / (NUM_LINES - 1);     // 0 = top, 1 = bottom
      const baseY  = FIELD_TOP + frac * (FIELD_BOT - FIELD_TOP);

      // Lines in lower half are displaced more (mountain base effect)
      const dispWeight = Math.pow(Math.sin(frac * Math.PI), 0.7);

      // Opacity: subtle gradient, peak lines slightly brighter
      const alpha = 0.12 + frac * 0.28 - Math.abs(frac - 0.65) * 0.08;

      // Color: deep navy → electric blue at peaks
      const blue  = Math.round(160 + frac * 86);
      const green = Math.round(20  + frac * 80);

      ctx.strokeStyle = `rgba(20,${green},${blue},${alpha})`;
      ctx.lineWidth   = 0.55 + frac * 0.45;
      ctx.lineCap     = "round";

      ctx.beginPath();
      const STEP = 3;
      for (let xi = 0; xi <= W; xi += STEP) {
        const nx   = xi / W;
        const lift = terrain(nx) * MAX_LIFT * dispWeight * breathe;
        let   y    = baseY - lift;

        // Mouse warp — lines bend away from cursor
        const dx   = xi - mx;
        const dy   = y  - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MOUSE_R && dist > 0) {
          const force = (1 - dist / MOUSE_R) ** 2 * 18;
          y -= (dy / dist) * force;
        }

        if (xi === 0) ctx.moveTo(xi, y);
        else          ctx.lineTo(xi, y);
      }
      ctx.stroke();
    }

    // Summit glow — one soft bloom at Lone Peak
    const peakX = 0.57 * W;
    const peakNx = 0.57;
    const peakLift = terrain(peakNx) * MAX_LIFT * breathe;
    const peakFrac = 0.55; // approx frac where the summit crests
    const baseYPeak = FIELD_TOP + peakFrac * (FIELD_BOT - FIELD_TOP);
    const peakY = baseYPeak - peakLift * Math.pow(Math.sin(peakFrac * Math.PI), 0.7);

    const glow = ctx.createRadialGradient(peakX, peakY, 0, peakX, peakY, 90);
    glow.addColorStop(0,   `rgba(59,130,246,${0.10 + 0.04 * Math.sin(t * 0.7)})`);
    glow.addColorStop(0.5, "rgba(30,80,200,0.04)");
    glow.addColorStop(1,   "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    rafRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width  = canvas.offsetWidth  * dpr;
      canvas.height = canvas.offsetHeight * dpr;
    };

    const onMouse = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const onLeave = () => { mouseRef.current = { x: -9999, y: -9999 }; };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMouse);
    canvas.addEventListener("mouseleave", onLeave);
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouse);
      canvas.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(rafRef.current);
    };
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
    />
  );
}
