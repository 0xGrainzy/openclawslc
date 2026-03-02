"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";

/*
  ═══════════════════════════════════════════════════════════════
  CENTRAL WASATCH — Organic Terrain, 360° Orbital Camera
  ═══════════════════════════════════════════════════════════════

  APPROACH: Elliptical dome + fractal noise + named peak bumps.
  No Gaussian stacking (caused plateau/wall/spike artifacts).

  RENDERING: Horizontal contour lines ONLY — zero Z-columns.
  Classic wireframe mountain aesthetic (Unknown Pleasures style).
  Each row is an elevation profile slice; they stack in perspective
  to create the 3D mountain effect.

  COORDINATE SYSTEM
  ─────────────────
  X : West → East    (positive = deeper into range)
  Z : South → North  (positive = north)
  Y : elevation      (MAX_H = 30)

  CAMERA
  ──────
  All views: phi ≥ 0.40 (elevated oblique, looking down).
  360° orbit: West → South → East → North → West.
*/

const MAX_H = 30;

/* ── Pseudo-random hash for noise ────────────────────────────── */
function hash2d(ix: number, iz: number): number {
  let n = (ix * 73856093) ^ (iz * 19349663);
  n = (n << 13) ^ n;
  n = (n * (n * n * 15731 + 789221) + 1376312589) & 0x7fffffff;
  return n / 0x7fffffff;
}

/* ── Smooth value noise with quintic interpolation ───────────── */
function smoothNoise(x: number, z: number): number {
  const ix = Math.floor(x), iz = Math.floor(z);
  const fx = x - ix, fz = z - iz;
  const ux = fx * fx * fx * (fx * (fx * 6 - 15) + 10);
  const uz = fz * fz * fz * (fz * (fz * 6 - 15) + 10);
  const a = hash2d(ix, iz), b = hash2d(ix + 1, iz);
  const c = hash2d(ix, iz + 1), d = hash2d(ix + 1, iz + 1);
  return a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz;
}

/* ── Fractal Brownian motion — organic terrain detail ────────── */
function fbm(x: number, z: number, octaves = 5): number {
  let val = 0, amp = 1, freq = 1, maxA = 0;
  for (let i = 0; i < octaves; i++) {
    val += amp * smoothNoise(x * freq, z * freq);
    maxA += amp;
    amp *= 0.48;
    freq *= 2.1;
  }
  return val / maxA; // normalized [0, 1]
}

/* ── Named peak bumps (small, on top of dome+noise) ──────────── */
const PEAK_BUMPS = [
  { x:  8, z: +16, h: 0.06, r: 3.5 }, // Grandeur        9,299′
  { x: 10, z: +10, h: 0.12, r: 3.0 }, // Mt Olympus      9,030′
  { x: 13, z:  +5, h: 0.14, r: 2.5 }, // Mount Raymond  10,241′
  { x: 14, z:  +1, h: 0.15, r: 2.5 }, // Kessler Peak   10,403′
  { x: 16, z:  -3, h: 0.20, r: 2.5 }, // Mount Superior 11,032′
  { x: 17, z:  -7, h: 0.24, r: 2.8 }, // Broads Fork    11,330′ ← highest
  { x: 18, z: -11, h: 0.22, r: 2.5 }, // Pfeifferhorn   11,325′
  { x: 16, z: -17, h: 0.18, r: 3.0 }, // Lone Peak      11,253′
  { x: 15, z: -23, h: 0.12, r: 3.5 }, // Box Elder      11,101′
];

/* ── Terrain height ──────────────────────────────────────────── */
const XMIN_C = -80, ZMIN_C = -48, ZMAX_C = +40;

function terrainH(wx: number, wz: number): number {
  // 1. Elliptical dome — overall mountain mass (whale shape)
  //    Center: x=14, z=-2 (high crest area)
  //    Half-widths: E-W=15, N-S=24
  const dx = (wx - 14) / 15;
  const dz = (wz + 2) / 24;
  const dome = Math.max(0, 1 - dx * dx - dz * dz);

  // 2. Ridge crest line along x ≈ 16 (eastern side of dome)
  const ridgeDx = (wx - 16) / 5;
  const ridge = Math.exp(-ridgeDx * ridgeDx) * dome;

  // 3. Fractal noise — organic texture (only where dome exists)
  const n = fbm(wx * 0.07 + 5.3, wz * 0.05 + 3.7, 5);

  // 4. Named peak bumps
  let peaks = 0;
  for (const p of PEAK_BUMPS) {
    const pdx = (wx - p.x) / p.r;
    const pdz = (wz - p.z) / p.r;
    peaks += p.h * Math.exp(-(pdx * pdx + pdz * pdz));
  }

  // Combine: dome drives shape, ridge adds crest, noise adds texture, peaks add summits
  const raw = dome * 0.42 + ridge * 0.22 + n * dome * 0.18 + peaks;

  // Edge tapers — smooth boundaries, no hard cuts
  const xEast = 1 - Math.max(0, Math.min(1, (wx - 30) / 18));
  const xWest = Math.max(0, Math.min(1, (wx - XMIN_C) / 25));
  const zS = Math.max(0, Math.min(1, (wz - ZMIN_C) / 18));
  const zN = Math.max(0, Math.min(1, (ZMAX_C - wz) / 18));

  return Math.min(1, Math.max(0, raw)) * xEast * xWest * Math.min(zS, zN);
}

/* ── Color: dark navy → bright ice-blue at peaks ─────────────── */
function altColor(t: number): [number, number, number] {
  return [
    0.02 + t * 0.35,
    0.04 + t * 0.55,
    0.18 + t * 0.82,
  ];
}

/* ── Camera ──────────────────────────────────────────────────── */
const TARGET = new THREE.Vector3(14, MAX_H * 0.35, -2);

// ALL views elevated (phi ≥ 0.40). No more vertical spikes.
const KF_MOB = [
  { theta: Math.PI,        phi: 0.46, r:  76 }, // West  — SLC valley hero
  { theta: Math.PI * 1.50, phi: 0.50, r: 100 }, // South — range stretches away
  { theta: Math.PI * 2.00, phi: 0.44, r:  82 }, // East  — back face
  { theta: Math.PI * 2.50, phi: 0.48, r: 102 }, // North — range stretches away
  { theta: Math.PI * 3.00, phi: 0.46, r:  76 }, // West  — full circle
];
const KF_DESK = [
  { theta: Math.PI,        phi: 0.42, r: 105 }, // West
  { theta: Math.PI * 1.50, phi: 0.46, r: 136 }, // South
  { theta: Math.PI * 2.00, phi: 0.40, r: 112 }, // East
  { theta: Math.PI * 2.50, phi: 0.44, r: 138 }, // North
  { theta: Math.PI * 3.00, phi: 0.42, r: 105 }, // West
];

function orbitPos(theta: number, phi: number, r: number): THREE.Vector3 {
  return new THREE.Vector3(
    TARGET.x + r * Math.cos(phi) * Math.cos(theta),
    TARGET.y + r * Math.sin(phi),
    TARGET.z + r * Math.cos(phi) * Math.sin(theta),
  );
}
function lerpKf(s: number, kfs: typeof KF_DESK) {
  const idx = s * (kfs.length - 1);
  const a = Math.floor(idx), b = Math.min(a + 1, kfs.length - 1);
  const t = idx - a, e = t * t * (3 - 2 * t);
  return {
    theta: kfs[a].theta + (kfs[b].theta - kfs[a].theta) * e,
    phi:   kfs[a].phi   + (kfs[b].phi   - kfs[a].phi)   * e,
    r:     kfs[a].r     + (kfs[b].r     - kfs[a].r)     * e,
  };
}

export interface CameraInfo {
  camera: THREE.PerspectiveCamera;
  width:  number;
  height: number;
}
interface Props { onCameraUpdate?: (info: CameraInfo) => void }

export default function MountainGL({ onCameraUpdate }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const mobile = window.innerWidth < 768;
    const KFS    = mobile ? KF_MOB : KF_DESK;
    const FOV    = mobile ? 70 : 50;
    const FOG    = mobile ? 0.0008 : 0.0018;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 1);
    el.appendChild(renderer.domElement);

    const scene  = new THREE.Scene();
    scene.fog    = new THREE.FogExp2(0x000000, FOG);
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.5, 1200);

    // Grid resolution
    const COLS = mobile ? 160 : 240;
    const ROWS = mobile ? 120 : 180;
    const XMIN = XMIN_C, XMAX = 50;
    const ZMIN = ZMIN_C, ZMAX = ZMAX_C;

    // Pre-compute heights
    const H: number[][] = Array.from({ length: ROWS }, (_, zi) =>
      Array.from({ length: COLS }, (_, xi) => {
        const wx = XMIN + (xi / (COLS - 1)) * (XMAX - XMIN);
        const wz = ZMIN + (zi / (ROWS - 1)) * (ZMAX - ZMIN);
        return terrainH(wx, wz) * MAX_H;
      }),
    );

    const verts: number[] = [], cols: number[] = [];
    function seg(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number) {
      verts.push(x0, y0, z0, x1, y1, z1);
      const [r0, g0, b0] = altColor(y0 / MAX_H);
      const [r1, g1, b1] = altColor(y1 / MAX_H);
      cols.push(r0, g0, b0, r1, g1, b1);
    }

    // ═══════════════════════════════════════════════════════════
    // HORIZONTAL CONTOUR LINES ONLY — no Z-direction columns.
    // Each row = elevation profile at a fixed Z position.
    // Stacked rows create depth through perspective + fog.
    // This is the classic wireframe mountain aesthetic.
    // ═══════════════════════════════════════════════════════════
    for (let zi = 0; zi < ROWS; zi++) {
      const wz = ZMIN + (zi / (ROWS - 1)) * (ZMAX - ZMIN);
      for (let xi = 0; xi < COLS - 1; xi++) {
        const wx0 = XMIN + (xi / (COLS - 1)) * (XMAX - XMIN);
        const wx1 = XMIN + ((xi + 1) / (COLS - 1)) * (XMAX - XMIN);
        seg(wx0, H[zi][xi], wz, wx1, H[zi][xi + 1], wz);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    geo.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
    const mat = new THREE.LineBasicMaterial({ vertexColors: true, opacity: 0.92, transparent: true });
    scene.add(new THREE.LineSegments(geo, mat));

    const mouse = new THREE.Vector2();
    let scroll = 0;
    const camPos = new THREE.Vector3();
    camPos.copy(orbitPos(KFS[0].theta, KFS[0].phi, KFS[0].r));

    function resize() {
      if (!el) return;
      renderer.setSize(el.clientWidth, el.clientHeight);
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    const onScroll = () => {
      const max = document.body.scrollHeight - window.innerHeight;
      scroll = max > 0 ? window.scrollY / max : 0;
    };
    const onMouse = (e: MouseEvent) => {
      mouse.set((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("mousemove", onMouse, { passive: true });

    let raf = 0;
    function animate() {
      raf = requestAnimationFrame(animate);
      const kf = lerpKf(scroll, KFS);
      const dst = orbitPos(kf.theta + mouse.x * 0.04, kf.phi - mouse.y * 0.012, kf.r);
      camPos.lerp(dst, 0.035);
      camera.position.copy(camPos);
      camera.lookAt(TARGET);
      renderer.render(scene, camera);
      if (el) onCameraUpdate?.({ camera, width: el.clientWidth, height: el.clientHeight });
    }
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("mousemove", onMouse);
      ro.disconnect();
      geo.dispose(); mat.dispose(); renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [onCameraUpdate]);

  return (
    <div ref={mountRef} style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }} />
  );
}
