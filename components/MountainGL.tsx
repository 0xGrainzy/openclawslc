"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";

/*
  ═══════════════════════════════════════════════════════════════
  CENTRAL WASATCH — Cinematic Hero Visualization
  ═══════════════════════════════════════════════════════════════

  AESTHETIC: Dramatic wireframe mountain filling the viewport.
  Hero view: low camera, mountain towers above, grid floor extends
  toward viewer. Scrolling orbits + elevates to reveal the full
  range from above.

  Not trying to be a topographic map. Trying to be STUNNING.

  Camera hero: phi=0.06 (nearly ground-level), r=45 (close),
  mountain fills ~80% of vertical viewport.
  Peak at MAX_H=50 sits in the upper 10% of frame.

  Horizontal contour lines only — the classic wireframe mountain.
*/

const MAX_H = 50;

/* ─── Noise ──────────────────────────────────────────────────── */

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
    maxA += amp; amp *= 0.46; freq *= 2.15;
  }
  return val / maxA;
}

function sstep(e0: number, e1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

/* ─── Canyon cuts ────────────────────────────────────────────── */
const CANYONS = [
  { z: +12, depth: 0.18, width: 1.6, x0: -2, x1: 13 }, // Millcreek
  { z:  +3, depth: 0.28, width: 2.2, x0: -4, x1: 16 }, // Big Cottonwood
  { z:  -5, depth: 0.28, width: 2.2, x0: -4, x1: 17 }, // Little Cottonwood
  { z: -16, depth: 0.16, width: 1.6, x0:  0, x1: 15 }, // Dry Creek
];

/* ─── Peak bumps ─────────────────────────────────────────────── */
const BUMPS = [
  { x:  8, z:+16, h:0.06, r:3.5 }, // Grandeur
  { x:  9, z: +6, h:0.10, r:3.0 }, // Mt Olympus
  { x: 13, z: +6, h:0.13, r:2.5 }, // Gobblers Knob
  { x: 14, z: +5, h:0.14, r:2.5 }, // Mt Raymond
  { x: 15, z: +1, h:0.15, r:2.5 }, // Kessler
  { x: 17, z: -2, h:0.20, r:2.8 }, // Mt Superior
  { x: 18, z: -3, h:0.26, r:3.0 }, // Broads Fork Twins ← highest
  { x: 19, z: -6, h:0.18, r:2.5 }, // Hidden Peak
  { x: 20, z: -7, h:0.24, r:2.5 }, // Pfeifferhorn
  { x: 19, z: -9, h:0.21, r:2.5 }, // White Baldy
  { x: 18, z:-12, h:0.19, r:3.0 }, // Lone Peak
  { x: 17, z:-20, h:0.12, r:3.5 }, // Box Elder
];

/* ─── Terrain ────────────────────────────────────────────────── */
const XMIN_C = -25, ZMIN_C = -38, ZMAX_C = +34;

function terrainH(wx: number, wz: number): number {
  // Asymmetric dome: steep west, gentle east
  const cx = 14, cz = -2;
  const dxR = wx - cx;
  const hwX = dxR < 0 ? 14 : 26;
  const dx = dxR / hwX;
  const dz = (wz - cz) / 26;
  const dome = Math.max(0, 1 - dx * dx - dz * dz);

  // Ridge crest
  const rDx = (wx - 16) / 5;
  const ridge = Math.exp(-rDx * rDx) * dome * 0.20;

  // Canyon cuts
  let cut = 0;
  for (const c of CANYONS) {
    const dzC = (wz - c.z) / c.width;
    cut += c.depth * Math.exp(-dzC * dzC) * sstep(c.x0, c.x0 + 4, wx) * (1 - sstep(c.x1 - 3, c.x1, wx));
  }

  // Fractal noise — concentrated on high areas (dome²)
  const n = fbm(wx * 0.13 + 5.3, wz * 0.10 + 3.7, 6);
  const noise = n * dome * dome * 0.24;

  // Peak bumps
  let peaks = 0;
  for (const p of BUMPS) {
    const pdx = (wx - p.x) / p.r, pdz = (wz - p.z) / p.r;
    peaks += p.h * Math.exp(-(pdx * pdx + pdz * pdz));
  }

  const raw = dome * 0.46 + ridge + noise + peaks - cut;

  // Soft edge tapers
  const xE = 1 - Math.max(0, Math.min(1, (wx - 34) / 14));
  const xW = Math.max(0, Math.min(1, (wx - XMIN_C) / 15));
  const zS = Math.max(0, Math.min(1, (wz - ZMIN_C) / 12));
  const zN = Math.max(0, Math.min(1, (ZMAX_C - wz) / 12));

  return Math.min(1, Math.max(0, raw)) * xE * xW * Math.min(zS, zN);
}

/* ─── Color: vivid gradient, near-white at peaks ─────────────── */
function altColor(t: number): [number, number, number] {
  return [
    0.01 + t * 0.52,   // peaks → 0.53
    0.03 + t * 0.72,   // peaks → 0.75
    0.16 + t * 0.84,   // peaks → 1.00
  ];
}

/* ─── Camera ─────────────────────────────────────────────────── */
const TARGET = new THREE.Vector3(14, MAX_H * 0.40, -2);

/*
  HERO: phi=0.06, r=45 → camera nearly ground-level, CLOSE.
  Mountain fills ~80% of vertical viewport.
  SCROLL: camera rises + pulls back → reveals full range from above.
  This hero-to-satellite transition IS the scroll experience.
*/
/*
  Hero: elevated panoramic (phi=0.28) — mountain spans width as horizontal
  band, serves as BACKDROP for the OPENCLAW SLC wordmark focal point.
  Scroll: orbits + reveals full range from multiple angles.
*/
const KF_MOB = [
  { theta: Math.PI + 0.15,  phi: 0.28, r:  60 }, // SSW — wide panoramic hero
  { theta: Math.PI * 1.50,  phi: 0.38, r:  78 }, // South — rising
  { theta: Math.PI * 2.00,  phi: 0.48, r:  95 }, // East — elevated back
  { theta: Math.PI * 2.50,  phi: 0.40, r:  82 }, // North
  { theta: Math.PI * 3.15,  phi: 0.28, r:  60 }, // SSW — return
];
const KF_DESK = [
  { theta: Math.PI + 0.15,  phi: 0.24, r:  82 }, // SSW
  { theta: Math.PI * 1.50,  phi: 0.34, r: 105 }, // South
  { theta: Math.PI * 2.00,  phi: 0.44, r: 130 }, // East
  { theta: Math.PI * 2.50,  phi: 0.36, r: 108 }, // North
  { theta: Math.PI * 3.15,  phi: 0.24, r:  82 }, // SSW
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
    const FOV    = mobile ? 72 : 52;
    const FOG    = mobile ? 0.0012 : 0.0020;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 1);
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog   = new THREE.FogExp2(0x000000, FOG);
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.5, 800);

    const COLS = mobile ? 180 : 280;
    const ROWS = mobile ? 140 : 210;
    const XMIN = XMIN_C, XMAX = 48;
    const ZMIN = ZMIN_C, ZMAX = ZMAX_C;

    const H: number[][] = Array.from({ length: ROWS }, (_, zi) =>
      Array.from({ length: COLS }, (_, xi) => {
        const wx = XMIN + (xi / (COLS - 1)) * (XMAX - XMIN);
        const wz = ZMIN + (zi / (ROWS - 1)) * (ZMAX - ZMIN);
        return terrainH(wx, wz) * MAX_H;
      }),
    );

    const verts: number[] = [], colA: number[] = [];
    function seg(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number) {
      verts.push(x0, y0, z0, x1, y1, z1);
      const [r0, g0, b0] = altColor(y0 / MAX_H);
      const [r1, g1, b1] = altColor(y1 / MAX_H);
      colA.push(r0, g0, b0, r1, g1, b1);
    }

    // HORIZONTAL CONTOUR LINES ONLY
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
    geo.setAttribute("color", new THREE.Float32BufferAttribute(colA, 3));
    const mat = new THREE.LineBasicMaterial({ vertexColors: true, opacity: 0.95, transparent: true });
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
    const ro = new ResizeObserver(resize); ro.observe(el);

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
