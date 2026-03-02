"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";

/*
  ═══════════════════════════════════════════════════════════════
  CENTRAL WASATCH — Andy Earl Reference Accuracy
  ═══════════════════════════════════════════════════════════════

  Terrain layers (in order):
  1. Asymmetric dome — steep west face, gentle east back-slope
  2. Ridge crest line — slight height emphasis along x≈15
  3. Canyon incisions — Millcreek, Big/Little Cottonwood, Dry Creek
     These are the defining feature of the Central Wasatch silhouette.
  4. Fractal noise — organic ridge/valley texture across the mass
  5. Named peak bumps — subtle additions at summit locations

  Rendering: horizontal contour lines only (no Z-columns).
  Camera: elevated oblique, 360° orbit (all phi ≥ 0.40).
*/

const MAX_H = 28;

/* ─── Noise engine ───────────────────────────────────────────── */

function hash2d(ix: number, iz: number): number {
  let n = (ix * 73856093) ^ (iz * 19349663);
  n = (n << 13) ^ n;
  n = (n * (n * n * 15731 + 789221) + 1376312589) & 0x7fffffff;
  return n / 0x7fffffff;
}

function smoothNoise(x: number, z: number): number {
  const ix = Math.floor(x), iz = Math.floor(z);
  const fx = x - ix, fz = z - iz;
  const ux = fx * fx * fx * (fx * (fx * 6 - 15) + 10);
  const uz = fz * fz * fz * (fz * (fz * 6 - 15) + 10);
  const a = hash2d(ix, iz), b = hash2d(ix + 1, iz);
  const c = hash2d(ix, iz + 1), d = hash2d(ix + 1, iz + 1);
  return a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz;
}

function fbm(x: number, z: number, octaves = 6): number {
  let val = 0, amp = 1, freq = 1, maxA = 0;
  for (let i = 0; i < octaves; i++) {
    val += amp * smoothNoise(x * freq, z * freq);
    maxA += amp;
    amp *= 0.46;
    freq *= 2.15;
  }
  return val / maxA;
}

function smoothstep(e0: number, e1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

/* ─── Canyon system ──────────────────────────────────────────── */
// Deep V-cuts running E-W into the western face.
// These define the iconic Wasatch silhouette from SLC.
const CANYONS = [
  { z: +12, depth: 0.16, width: 1.6, x0:  0, x1: 13 }, // Millcreek Canyon
  { z:  +3, depth: 0.24, width: 2.0, x0: -2, x1: 16 }, // Big Cottonwood Canyon
  { z:  -5, depth: 0.24, width: 2.0, x0: -2, x1: 17 }, // Little Cottonwood Canyon
  { z: -16, depth: 0.15, width: 1.6, x0:  1, x1: 15 }, // Dry Creek Canyon
];

/* ─── Named peak bumps (subtle, on top of the mass) ──────────── */
const PEAK_BUMPS = [
  { x:  8, z: +16, h: 0.05, r: 3.5 }, // Grandeur         9,299′
  { x:  6, z:  +8, h: 0.04, r: 3.0 }, // West Slabs        8,806′
  { x:  9, z:  +6, h: 0.08, r: 2.8 }, // Mt Olympus        9,030′
  { x: 13, z:  +6, h: 0.12, r: 2.5 }, // Gobblers Knob    10,246′
  { x: 14, z:  +5, h: 0.13, r: 2.5 }, // Mount Raymond    10,241′
  { x: 15, z:  +1, h: 0.14, r: 2.5 }, // Kessler Peak     10,403′
  { x: 17, z:  -2, h: 0.18, r: 2.8 }, // Mount Superior   11,032′
  { x: 18, z:  -3, h: 0.22, r: 3.0 }, // Broads Fork Twins 11,330′
  { x: 19, z:  -6, h: 0.16, r: 2.5 }, // Hidden Peak      10,992′
  { x: 20, z:  -7, h: 0.20, r: 2.5 }, // Pfeifferhorn     11,325′
  { x: 19, z:  -9, h: 0.19, r: 2.5 }, // White Baldy      11,321′
  { x: 18, z: -12, h: 0.17, r: 3.0 }, // Lone Peak        11,253′
  { x: 17, z: -20, h: 0.10, r: 3.5 }, // Box Elder Peak   11,101′
];

/* ─── Terrain height ─────────────────────────────────────────── */
const XMIN_C = -60, ZMIN_C = -40, ZMAX_C = +36;

function terrainH(wx: number, wz: number): number {
  // ── 1. Asymmetric dome ──────────────────────────────────────
  // Steep west face (SLC side), gentle east back-slope.
  // Center: x=14, z=-2 (high crest area).
  const cx = 14, cz = -2;
  const dxRaw = wx - cx;
  const hwX = dxRaw < 0 ? 13 : 24; // steep west (13), gentle east (24)
  const hwZ = 26;
  const dx = dxRaw / hwX;
  const dz = (wz - cz) / hwZ;
  const dome = Math.max(0, 1 - dx * dx - dz * dz);

  // ── 2. Ridge crest emphasis along x ≈ 15 ───────────────────
  const ridgeDx = (wx - 15) / 5;
  const ridge = Math.exp(-ridgeDx * ridgeDx) * dome * 0.18;

  // ── 3. Canyon incisions ─────────────────────────────────────
  let canyonCut = 0;
  for (const c of CANYONS) {
    const dzC = (wz - c.z) / c.width;
    const profile = Math.exp(-dzC * dzC);
    // Canyon only within its x-extent, smoothly ramped in/out
    const xIn = smoothstep(c.x0, c.x0 + 4, wx);
    const xOut = 1 - smoothstep(c.x1 - 3, c.x1, wx);
    canyonCut += c.depth * profile * xIn * xOut;
  }

  // ── 4. Fractal noise (high-frequency detail) ────────────────
  // More octaves + higher freq for the fine ridge/valley texture.
  // Multiplied by dome² to concentrate detail on the high areas.
  const n = fbm(wx * 0.12 + 5.3, wz * 0.09 + 3.7, 6);
  const noiseContrib = n * dome * dome * 0.22;

  // ── 5. Named peak bumps ─────────────────────────────────────
  let peaks = 0;
  for (const p of PEAK_BUMPS) {
    const pdx = (wx - p.x) / p.r;
    const pdz = (wz - p.z) / p.r;
    peaks += p.h * Math.exp(-(pdx * pdx + pdz * pdz));
  }

  // Combine
  const raw = dome * 0.48 + ridge + noiseContrib + peaks - canyonCut;

  // Edge tapers
  const xEast = 1 - Math.max(0, Math.min(1, (wx - 32) / 16));
  const xWest = Math.max(0, Math.min(1, (wx - XMIN_C) / 20));
  const zS = Math.max(0, Math.min(1, (wz - ZMIN_C) / 14));
  const zN = Math.max(0, Math.min(1, (ZMAX_C - wz) / 14));

  return Math.min(1, Math.max(0, raw)) * xEast * xWest * Math.min(zS, zN);
}

/* ─── Color ──────────────────────────────────────────────────── */
function altColor(t: number): [number, number, number] {
  return [
    0.02 + t * 0.36,
    0.04 + t * 0.56,
    0.18 + t * 0.82,
  ];
}

/* ─── Camera ─────────────────────────────────────────────────── */
const TARGET = new THREE.Vector3(14, MAX_H * 0.30, -2);

// Hero view from SSW (theta = π + 0.25) to match Andy Earl perspective.
// All phi ≥ 0.40 — elevated oblique view, always looking down.
const KF_MOB = [
  { theta: Math.PI + 0.25,  phi: 0.44, r:  74 }, // SSW — hero (Andy Earl angle)
  { theta: Math.PI * 1.50,  phi: 0.50, r:  98 }, // South
  { theta: Math.PI * 2.00,  phi: 0.44, r:  80 }, // East — back face
  { theta: Math.PI * 2.50,  phi: 0.48, r: 100 }, // North
  { theta: Math.PI * 3.25,  phi: 0.44, r:  74 }, // SSW — full circle
];
const KF_DESK = [
  { theta: Math.PI + 0.25,  phi: 0.40, r: 100 }, // SSW
  { theta: Math.PI * 1.50,  phi: 0.46, r: 132 }, // South
  { theta: Math.PI * 2.00,  phi: 0.40, r: 108 }, // East
  { theta: Math.PI * 2.50,  phi: 0.44, r: 134 }, // North
  { theta: Math.PI * 3.25,  phi: 0.40, r: 100 }, // SSW
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
    const FOV    = mobile ? 68 : 48;
    const FOG    = mobile ? 0.0007 : 0.0015;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 1);
    el.appendChild(renderer.domElement);

    const scene  = new THREE.Scene();
    scene.fog    = new THREE.FogExp2(0x000000, FOG);
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.5, 1200);

    // High-resolution grid for detailed terrain
    const COLS = mobile ? 180 : 280;
    const ROWS = mobile ? 140 : 200;
    const XMIN = XMIN_C, XMAX = 48;
    const ZMIN = ZMIN_C, ZMAX = ZMAX_C;

    const H: number[][] = Array.from({ length: ROWS }, (_, zi) =>
      Array.from({ length: COLS }, (_, xi) => {
        const wx = XMIN + (xi / (COLS - 1)) * (XMAX - XMIN);
        const wz = ZMIN + (zi / (ROWS - 1)) * (ZMAX - ZMIN);
        return terrainH(wx, wz) * MAX_H;
      }),
    );

    const verts: number[] = [], colArr: number[] = [];
    function seg(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number) {
      verts.push(x0, y0, z0, x1, y1, z1);
      const [r0, g0, b0] = altColor(y0 / MAX_H);
      const [r1, g1, b1] = altColor(y1 / MAX_H);
      colArr.push(r0, g0, b0, r1, g1, b1);
    }

    // HORIZONTAL CONTOUR LINES ONLY — classic wireframe aesthetic
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
    geo.setAttribute("color", new THREE.Float32BufferAttribute(colArr, 3));
    const mat = new THREE.LineBasicMaterial({ vertexColors: true, opacity: 0.88, transparent: true });
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
