"use client";
import { useEffect, useRef, useCallback } from "react";

/* ─────────────────────────────────────────────────────────────────
   Wasatch topographic contour canvas.
   Gaussian terrain peaks → horizontal line segments per elevation
   band → glowing electric-blue topo lines with slow scan sweep.
───────────────────────────────────────────────────────────────── */

const PEAKS = [
  { pos: 0.07, h: 0.38, w: 0.050 },
  { pos: 0.17, h: 0.52, w: 0.055 },
  { pos: 0.26, h: 0.64, w: 0.052 },
  { pos: 0.34, h: 0.77, w: 0.046 },
  { pos: 0.40, h: 0.84, w: 0.040 },
  { pos: 0.47, h: 0.92, w: 0.036 }, // Twin Peaks
  { pos: 0.54, h: 1.00, w: 0.032 }, // Lone Peak — summit
  { pos: 0.60, h: 0.87, w: 0.038 },
  { pos: 0.67, h: 0.79, w: 0.044 },
  { pos: 0.75, h: 0.68, w: 0.052 },
  { pos: 0.83, h: 0.54, w: 0.058 },
  { pos: 0.91, h: 0.40, w: 0.055 },
  { pos: 0.97, h: 0.28, w: 0.040 },
];

function terrain(nx: number): number {
  // Gaussian sum for each peak
  let h = 0.12 * Math.sin(nx * Math.PI * 0.9 + 0.2); // gentle base
  for (const p of PEAKS) {
    h += p.h * Math.exp(-((nx - p.pos) ** 2) / (2 * p.w * p.w));
  }
  return Math.min(1, Math.max(0, h));
}

export default function TopoCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);
  const startRef  = useRef<number>(0);

  const draw = useCallback((ts: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (!startRef.current) startRef.current = ts;
    const elapsed = (ts - startRef.current) / 1000; // seconds

    const dpr = window.devicePixelRatio || 1;
    const W   = canvas.width  / dpr;
    const H   = canvas.height / dpr;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(dpr, dpr);

    // Sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0,   "#000000");
    sky.addColorStop(0.5, "#010a1a");
    sky.addColorStop(1,   "#041530");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // Star field (static, seeded by position)
    const starCount = Math.floor(W * 0.045);
    for (let i = 0; i < starCount; i++) {
      const sx = ((i * 137.508 + i * 29) % W);
      const sy = ((i * 73.1 + i * 41) % (H * 0.58));
      const sr = i % 7 === 0 ? 1.1 : i % 4 === 0 ? 0.7 : 0.45;
      const twinkle = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(elapsed * (1.2 + (i % 5) * 0.4) + i));
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${twinkle})`;
      ctx.fill();
    }

    // Topo configuration
    const NUM_BANDS   = 48;
    const BASE_Y      = H * 0.94;
    const MAX_HEIGHT  = H * 0.80;
    const STEP        = 2; // px resolution along x axis

    // Scan sweep: a brightness wave that climbs the mountain slowly
    const SWEEP_PERIOD = 6.5; // seconds per sweep
    const sweepFrac    = (elapsed % SWEEP_PERIOD) / SWEEP_PERIOD; // 0→1
    const sweepLevel   = sweepFrac; // which elevation band the sweep is at

    for (let b = 0; b < NUM_BANDS; b++) {
      const level = b / NUM_BANDS;
      const y     = BASE_Y - level * MAX_HEIGHT;

      // Color: deep blue at bottom, bright electric blue → near white at peaks
      const t       = level;                                  // 0 = low, 1 = high
      const r       = Math.round(20  + t * 120);
      const g       = Math.round(40  + t * 150);
      const bl      = Math.round(180 + t * 70);
      const baseAlpha = 0.12 + t * 0.55;

      // Sweep brightens bands near the current sweep elevation
      const sweepDist   = Math.abs(level - sweepLevel);
      const sweepBoost  = Math.max(0, 1 - sweepDist / 0.08) * 0.55;
      const alpha       = Math.min(1, baseAlpha + sweepBoost);
      const lineWidth   = (0.5 + t * 0.7) + sweepBoost * 0.8;

      ctx.strokeStyle = `rgba(${r},${g},${bl},${alpha})`;
      ctx.lineWidth   = lineWidth;
      ctx.lineCap     = "round";

      // Draw segments where terrain >= level
      ctx.beginPath();
      let inSeg = false;
      for (let xi = 0; xi <= W; xi += STEP) {
        const h = terrain(xi / W) * MAX_HEIGHT;
        if (BASE_Y - h <= y) {
          // terrain is at or above this contour band
          if (!inSeg) { ctx.moveTo(xi, y); inSeg = true; }
          else          { ctx.lineTo(xi + STEP, y); }
        } else {
          if (inSeg) { ctx.stroke(); ctx.beginPath(); inSeg = false; }
        }
      }
      if (inSeg) ctx.stroke();
    }

    // Ridge glow — subtle luminous bloom along the ridgeline
    const ridgeGrad = ctx.createLinearGradient(0, 0, W, 0);
    ridgeGrad.addColorStop(0,    "rgba(30,100,255,0)");
    ridgeGrad.addColorStop(0.35, "rgba(59,130,246,0.04)");
    ridgeGrad.addColorStop(0.54, "rgba(96,165,250,0.08)");
    ridgeGrad.addColorStop(0.65, "rgba(59,130,246,0.05)");
    ridgeGrad.addColorStop(1,    "rgba(30,100,255,0)");
    ctx.fillStyle = ridgeGrad;
    ctx.fillRect(0, BASE_Y - MAX_HEIGHT * 0.5, W, MAX_HEIGHT * 0.5);

    // Bottom fill (ground)
    const ground = ctx.createLinearGradient(0, BASE_Y - 10, 0, H);
    ground.addColorStop(0, "rgba(3,20,55,0.9)");
    ground.addColorStop(1, "#000000");
    ctx.fillStyle = ground;
    ctx.fillRect(0, BASE_Y - 2, W, H - BASE_Y + 4);

    ctx.setTransform(1, 0, 0, 1, 0, 0); // reset scale
    rafRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const W   = canvas.offsetWidth;
      const H   = canvas.offsetHeight;
      canvas.width  = W * dpr;
      canvas.height = H * dpr;
    };

    resize();
    window.addEventListener("resize", resize);
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        display: "block",
      }}
    />
  );
}
