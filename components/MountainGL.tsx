"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";

/*
  ═══════════════════════════════════════════════════════════════
  CENTRAL WASATCH — Full 3D Range + SLC Valley Grid
  ═══════════════════════════════════════════════════════════════

  Design: The entire mountain range is visible as a proportional
  3D wireframe object. Below the western face, a flat street grid
  represents the Salt Lake Valley. Camera orbits on scroll,
  always showing the complete range — no clipping.

  Horizontal contour lines only. City grid = separate geometry.
*/

const MAX_H = 32;

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

/* ─── Canyon cuts (E–W canyons through the range) ────────────── */
const CANYONS = [
  { z: +14, depth: 0.22, width: 1.8, x0: -4, x1: 18 },  // Parley's
  { z: +9,  depth: 0.20, width: 1.5, x0: -2, x1: 16 },  // Millcreek
  { z: +3,  depth: 0.30, width: 2.4, x0: -6, x1: 20 },  // Big Cottonwood
  { z: -5,  depth: 0.30, width: 2.4, x0: -6, x1: 22 },  // Little Cottonwood
  { z: -12, depth: 0.18, width: 1.8, x0: -2, x1: 18 },  // Bells
  { z: -18, depth: 0.16, width: 1.6, x0:  0, x1: 16 },  // Dry Creek
];

/* ─── Peak bumps — positioned on the actual terrain ──────────── */
const BUMPS = [
  { x:  6, z:+18, h:0.05, r:3.0 },  // Grandeur Peak (9,299')
  { x:  8, z:+11, h:0.06, r:2.8 },  // Mt Aire
  { x: 10, z: +6, h:0.12, r:3.0 },  // Mt Olympus (9,026')
  { x: 14, z: +6, h:0.14, r:2.5 },  // Gobblers Knob (10,246')
  { x: 15, z: +5, h:0.15, r:2.5 },  // Mt Raymond (10,241')
  { x: 16, z: +1, h:0.16, r:2.5 },  // Kessler Peak (10,403')
  { x: 18, z: -2, h:0.22, r:2.8 },  // Mt Superior (11,032')
  { x: 20, z: -3, h:0.28, r:3.0 },  // Broads Fork Twins (11,330')
  { x: 21, z: -6, h:0.20, r:2.5 },  // Hidden Peak / Snowbird (10,992')
  { x: 22, z: -8, h:0.26, r:2.8 },  // Pfeifferhorn (11,325')
  { x: 21, z:-10, h:0.23, r:2.5 },  // White Baldy (11,321')
  { x: 20, z:-14, h:0.21, r:3.0 },  // Lone Peak (11,253')
  { x: 18, z:-22, h:0.10, r:3.5 },  // Box Elder Peak (11,101')
];

/* ─── Terrain function ───────────────────────────────────────── */
// Range runs roughly N–S (z axis), ridge crest ~x=16
// West face (SLC side): steep drop. East: gentle backcountry.
const RIDGE_X = 16;

function terrainH(wx: number, wz: number): number {
  // Asymmetric cross-section: steep west, gentle east
  const dx = wx - RIDGE_X;
  const westHW = 18;   // half-width west (steep)
  const eastHW = 30;   // half-width east (gentle)
  const hw = dx < 0 ? westHW : eastHW;
  const xNorm = dx / hw;

  // N–S extent — tapers at both ends
  const rangeCz = -2;
  const rangeHW = 28;
  const zNorm = (wz - rangeCz) / rangeHW;

  // Base dome — elliptical, pow for sharper ridgeline
  const r2 = xNorm * xNorm + zNorm * zNorm;
  if (r2 >= 1) return 0;
  const dome = Math.pow(1 - r2, 1.3);

  // Ridge crest emphasis — Gaussian along x=RIDGE_X
  const ridgeDx = (wx - RIDGE_X) / 6;
  const ridge = Math.exp(-ridgeDx * ridgeDx) * dome * 0.25;

  // West face steepness boost
  const wbArg = (dx + 5) / 8;
  const westBoost = dx < 0 ? Math.exp(-(wbArg * wbArg)) * dome * 0.12 : 0;

  // Canyon incisions
  let cut = 0;
  for (const c of CANYONS) {
    const dzC = (wz - c.z) / c.width;
    const canyonProfile = Math.exp(-dzC * dzC);
    // Canyons cut deeper toward the valley (west), shallow near crest
    const xFade = sstep(c.x0, c.x0 + 6, wx) * (1 - sstep(c.x1 - 5, c.x1, wx));
    cut += c.depth * canyonProfile * xFade;
  }

  // Fractal noise — only on elevated terrain
  const n = fbm(wx * 0.11 + 5.3, wz * 0.08 + 3.7, 6);
  const noise = n * dome * dome * 0.20;

  // Fine detail noise
  const detail = fbm(wx * 0.28 + 11.1, wz * 0.22 + 7.9, 4) * dome * dome * 0.08;

  // Named peak bumps
  let peaks = 0;
  for (const p of BUMPS) {
    const pdx = (wx - p.x) / p.r, pdz = (wz - p.z) / p.r;
    peaks += p.h * Math.exp(-(pdx * pdx + pdz * pdz));
  }

  const raw = dome * 0.50 + ridge + westBoost + noise + detail + peaks - cut;

  // Smooth edge fadeout (avoid hard edges)
  const edgeFade = Math.pow(Math.max(0, 1 - r2), 0.4);

  return Math.max(0, Math.min(1, raw)) * edgeFade;
}

/* ─── Color ──────────────────────────────────────────────────── */
function altColor(t: number): [number, number, number] {
  // Dark navy base → bright ice blue peaks
  return [
    0.02 + t * 0.45,
    0.04 + t * 0.65,
    0.18 + t * 0.82,
  ];
}

/* ─── Camera ─────────────────────────────────────────────────── */
// Target = center of the range
const TARGET = new THREE.Vector3(RIDGE_X - 4, MAX_H * 0.22, -2);

/*
  Camera is PULLED BACK — full range visible at all times.
  Hero: SSW angle looking at the SLC face with valley grid below.
  Scroll orbits 360°.
*/
const KF_MOB = [
  { theta: Math.PI + 0.20, phi: 0.38, r: 105 },  // SSW — hero, SLC face
  { theta: Math.PI * 1.50, phi: 0.42, r: 115 },  // South
  { theta: Math.PI * 2.00, phi: 0.48, r: 120 },  // East — backcountry
  { theta: Math.PI * 2.50, phi: 0.42, r: 115 },  // North
  { theta: Math.PI * 3.20, phi: 0.38, r: 105 },  // SSW return
];
const KF_DESK = [
  { theta: Math.PI + 0.20, phi: 0.32, r: 120 },  // SSW
  { theta: Math.PI * 1.50, phi: 0.38, r: 140 },  // South
  { theta: Math.PI * 2.00, phi: 0.44, r: 155 },  // East
  { theta: Math.PI * 2.50, phi: 0.38, r: 140 },  // North
  { theta: Math.PI * 3.20, phi: 0.32, r: 120 },  // SSW return
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
    const KFS = mobile ? KF_MOB : KF_DESK;
    const FOV = mobile ? 65 : 48;
    const FOG = mobile ? 0.0008 : 0.0010;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 1);
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, FOG);
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.5, 600);

    /* ─── Mountain terrain mesh ─────────────────────────────── */
    const COLS = mobile ? 160 : 260;
    const ROWS = mobile ? 120 : 180;
    const XMIN = -8, XMAX = 55;
    const ZMIN = -34, ZMAX = 30;

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

    // Horizontal contour lines — the mountain
    for (let zi = 0; zi < ROWS; zi++) {
      const wz = ZMIN + (zi / (ROWS - 1)) * (ZMAX - ZMIN);
      for (let xi = 0; xi < COLS - 1; xi++) {
        const wx0 = XMIN + (xi / (COLS - 1)) * (XMAX - XMIN);
        const wx1 = XMIN + ((xi + 1) / (COLS - 1)) * (XMAX - XMIN);
        const h0 = H[zi][xi], h1 = H[zi][xi + 1];
        // Only draw segments where terrain has some height
        if (h0 > 0.08 || h1 > 0.08) {
          seg(wx0, h0, wz, wx1, h1, wz);
        }
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    geo.setAttribute("color", new THREE.Float32BufferAttribute(colA, 3));
    const mat = new THREE.LineBasicMaterial({ vertexColors: true, opacity: 0.92, transparent: true });
    scene.add(new THREE.LineSegments(geo, mat));

    /* ─── SLC Valley grid (flat plane, west of range) ────────── */
    const gridVerts: number[] = [], gridCols: number[] = [];
    const GRID_Y = 0;
    const GX0 = -55, GX1 = 0;   // west of the range base
    const GZ0 = -30, GZ1 = 26;
    const GRID_SPACING = 2.8;
    const gridOp = 0.14;

    // N-S lines (streets)
    for (let x = GX0; x <= GX1; x += GRID_SPACING) {
      gridVerts.push(x, GRID_Y, GZ0, x, GRID_Y, GZ1);
      gridCols.push(0.08 * gridOp, 0.15 * gridOp, 0.35 * gridOp,
                     0.08 * gridOp, 0.15 * gridOp, 0.35 * gridOp);
    }
    // E-W lines (avenues)
    for (let z = GZ0; z <= GZ1; z += GRID_SPACING) {
      gridVerts.push(GX0, GRID_Y, z, GX1, GRID_Y, z);
      gridCols.push(0.08 * gridOp, 0.15 * gridOp, 0.35 * gridOp,
                     0.08 * gridOp, 0.15 * gridOp, 0.35 * gridOp);
    }

    // A few brighter "main roads" — State St, 700 E, I-15 equivalent
    const mainRoads = [-45, -30, -15, -5];
    for (const x of mainRoads) {
      gridVerts.push(x, GRID_Y + 0.02, GZ0, x, GRID_Y + 0.02, GZ1);
      const br = 0.22;
      gridCols.push(0.06 * br, 0.12 * br, 0.40 * br,
                     0.06 * br, 0.12 * br, 0.40 * br);
    }
    const mainAves = [-20, -5, 10];
    for (const z of mainAves) {
      gridVerts.push(GX0, GRID_Y + 0.02, z, GX1, GRID_Y + 0.02, z);
      const br = 0.22;
      gridCols.push(0.06 * br, 0.12 * br, 0.40 * br,
                     0.06 * br, 0.12 * br, 0.40 * br);
    }

    const gridGeo = new THREE.BufferGeometry();
    gridGeo.setAttribute("position", new THREE.Float32BufferAttribute(gridVerts, 3));
    gridGeo.setAttribute("color", new THREE.Float32BufferAttribute(gridCols, 3));
    const gridMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 1 });
    scene.add(new THREE.LineSegments(gridGeo, gridMat));

    /* ─── Foothills transition (low rolling terrain west of range) */
    const fhVerts: number[] = [], fhCols: number[] = [];
    const FH_COLS = mobile ? 60 : 100;
    const FH_ROWS = mobile ? 50 : 80;
    const FHX0 = -10, FHX1 = 8;
    const FHZ0 = -28, FHZ1 = 24;

    for (let zi = 0; zi < FH_ROWS; zi++) {
      const wz = FHZ0 + (zi / (FH_ROWS - 1)) * (FHZ1 - FHZ0);
      for (let xi = 0; xi < FH_COLS - 1; xi++) {
        const wx0 = FHX0 + (xi / (FH_COLS - 1)) * (FHX1 - FHX0);
        const wx1 = FHX0 + ((xi + 1) / (FH_COLS - 1)) * (FHX1 - FHX0);
        // Low rolling foothills — just fractal noise, low amplitude
        const fh0 = Math.max(0, fbm(wx0 * 0.15 + 2.1, wz * 0.12 + 1.3, 4) * 2.5 *
          sstep(FHX0, FHX0 + 5, wx0) * (1 - sstep(FHX1 - 4, FHX1, wx0)) *
          sstep(FHZ0, FHZ0 + 6, wz) * (1 - sstep(FHZ1 - 6, FHZ1, wz)));
        const fh1 = Math.max(0, fbm(wx1 * 0.15 + 2.1, wz * 0.12 + 1.3, 4) * 2.5 *
          sstep(FHX0, FHX0 + 5, wx1) * (1 - sstep(FHX1 - 4, FHX1, wx1)) *
          sstep(FHZ0, FHZ0 + 6, wz) * (1 - sstep(FHZ1 - 6, FHZ1, wz)));
        if (fh0 > 0.05 || fh1 > 0.05) {
          fhVerts.push(wx0, fh0, wz, wx1, fh1, wz);
          const t0 = fh0 / 3, t1 = fh1 / 3;
          fhCols.push(0.02 + t0 * 0.15, 0.04 + t0 * 0.22, 0.14 + t0 * 0.30,
                       0.02 + t1 * 0.15, 0.04 + t1 * 0.22, 0.14 + t1 * 0.30);
        }
      }
    }
    const fhGeo = new THREE.BufferGeometry();
    fhGeo.setAttribute("position", new THREE.Float32BufferAttribute(fhVerts, 3));
    fhGeo.setAttribute("color", new THREE.Float32BufferAttribute(fhCols, 3));
    const fhMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.7 });
    scene.add(new THREE.LineSegments(fhGeo, fhMat));

    /* ─── Interaction ────────────────────────────────────────── */
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
      const dst = orbitPos(kf.theta + mouse.x * 0.03, kf.phi - mouse.y * 0.01, kf.r);
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
      geo.dispose(); mat.dispose();
      gridGeo.dispose(); gridMat.dispose();
      fhGeo.dispose(); fhMat.dispose();
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [onCameraUpdate]);

  return (
    <div ref={mountRef} style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }} />
  );
}
