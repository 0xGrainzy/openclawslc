"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";

/*
  ═══════════════════════════════════════════════════════════════
  CENTRAL WASATCH — Wide Horizontal Backdrop
  ═══════════════════════════════════════════════════════════════

  Reference: Photo from Capitol Hill looking SE.
  Range is a wide horizontal band in the upper ~35% of frame.
  Valley grid fills the lower portion. Low camera angle.
  Organic rolling profile, not spiky.
*/

const MAX_H = 22;
const Z_STRETCH = 3.0; // wide horizontal spread

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

/* ─── Canyons ────────────────────────────────────────────────── */
const CANYONS = [
  { z: +14, depth: 0.22, width: 2.2, x0: -4, x1: 18 },
  { z: +9,  depth: 0.20, width: 1.8, x0: -2, x1: 16 },
  { z: +3,  depth: 0.30, width: 2.8, x0: -6, x1: 20 },
  { z: -5,  depth: 0.30, width: 2.8, x0: -6, x1: 22 },
  { z: -12, depth: 0.20, width: 2.0, x0: -2, x1: 18 },
  { z: -18, depth: 0.16, width: 1.8, x0:  0, x1: 16 },
];

/* ─── Peak bumps ─────────────────────────────────────────────── */
const BUMPS = [
  { x:  6, z:+20, h:0.08, r:4.0 },  // Grandeur
  { x: 10, z: +7, h:0.16, r:3.5 },  // Olympus — prominent left peak
  { x: 14, z: +6, h:0.18, r:3.0 },  // Gobblers Knob
  { x: 15, z: +5, h:0.19, r:3.0 },  // Raymond
  { x: 16, z: +1, h:0.20, r:3.0 },  // Kessler
  { x: 18, z: -2, h:0.28, r:3.2 },  // Superior
  { x: 20, z: -3, h:0.35, r:3.5 },  // Broads Fork Twins — highest
  { x: 21, z: -6, h:0.25, r:3.0 },  // Hidden Peak
  { x: 22, z: -8, h:0.32, r:3.2 },  // Pfeifferhorn
  { x: 21, z:-10, h:0.28, r:3.0 },  // White Baldy
  { x: 20, z:-15, h:0.24, r:3.5 },  // Lone Peak
  { x: 18, z:-24, h:0.14, r:4.5 },  // Box Elder
];

/* ─── Terrain ────────────────────────────────────────────────── */
const RIDGE_X = 16;

function terrainH(wx: number, wz: number): number {
  const dx = wx - RIDGE_X;
  const westHW = 16, eastHW = 28;
  const hw = dx < 0 ? westHW : eastHW;
  const xNorm = dx / hw;
  const zNorm = (wz - (-2)) / 30;
  const r2 = xNorm * xNorm + zNorm * zNorm;
  if (r2 >= 1) return 0;

  // Softer dome for rolling profile
  const dome = Math.pow(1 - r2, 1.1);

  // Ridge crest
  const ridgeDx = (wx - RIDGE_X) / 7;
  const ridge = Math.exp(-ridgeDx * ridgeDx) * dome * 0.22;

  // West face boost
  const wbArg = (dx + 4) / 9;
  const westBoost = dx < 0 ? Math.exp(-(wbArg * wbArg)) * dome * 0.10 : 0;

  // Canyon cuts
  let cut = 0;
  for (const c of CANYONS) {
    const dzC = (wz - c.z) / c.width;
    cut += c.depth * Math.exp(-dzC * dzC) *
      sstep(c.x0, c.x0 + 6, wx) * (1 - sstep(c.x1 - 5, c.x1, wx));
  }

  // Noise
  const n = fbm(wx * 0.10 + 5.3, wz * 0.07 + 3.7, 6);
  const noise = n * dome * dome * 0.18;
  const detail = fbm(wx * 0.25 + 11.1, wz * 0.20 + 7.9, 4) * dome * dome * 0.06;

  // Peaks
  let peaks = 0;
  for (const p of BUMPS) {
    const pdx = (wx - p.x) / p.r, pdz = (wz - p.z) / p.r;
    peaks += p.h * Math.exp(-(pdx * pdx + pdz * pdz));
  }

  const raw = dome * 0.48 + ridge + westBoost + noise + detail + peaks - cut;
  const edgeFade = Math.pow(Math.max(0, 1 - r2), 0.35);
  return Math.max(0, Math.min(1, raw)) * edgeFade;
}

/* ─── Color ──────────────────────────────────────────────────── */
function altColor(t: number): [number, number, number] {
  return [0.02 + t * 0.42, 0.04 + t * 0.60, 0.18 + t * 0.82];
}

/* ─── Camera ─────────────────────────────────────────────────── */
// Target slightly above ground, center of range
const TARGET = new THREE.Vector3(8, MAX_H * 0.25, -2 * Z_STRETCH);

/*
  LOW camera angle (phi ~0.12-0.18) — nearly eye-level from the valley.
  Range sits as a wide horizontal band across the upper portion.
  Camera is to the WEST (theta~π), positioned in the valley.
*/
const KF_MOB = [
  { theta: Math.PI - 0.10, phi: 0.14, r: 110 },  // Valley view — range as backdrop
  { theta: Math.PI * 0.60, phi: 0.30, r: 130 },  // Swing north
  { theta: Math.PI * 0.00, phi: 0.40, r: 140 },  // East — behind range
  { theta: Math.PI * 1.40, phi: 0.30, r: 130 },  // South
  { theta: Math.PI * 1.90, phi: 0.14, r: 110 },  // Return to valley
];
const KF_DESK = [
  { theta: Math.PI - 0.10, phi: 0.12, r: 130 },
  { theta: Math.PI * 0.60, phi: 0.28, r: 155 },
  { theta: Math.PI * 0.00, phi: 0.38, r: 170 },
  { theta: Math.PI * 1.40, phi: 0.28, r: 155 },
  { theta: Math.PI * 1.90, phi: 0.12, r: 130 },
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
    const FOV = mobile ? 58 : 44;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 1);
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.0032);
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.5, 1200);

    /* ─── Mountain terrain ──────────────────────────────────── */
    const COLS = mobile ? 180 : 300;
    const ROWS = mobile ? 140 : 220;
    const XMIN = -4, XMAX = 48;
    const ZMIN = -32, ZMAX = 28;

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

    // Horizontal contour lines
    for (let zi = 0; zi < ROWS; zi++) {
      const wz = ZMIN + (zi / (ROWS - 1)) * (ZMAX - ZMIN);
      const dz = wz * Z_STRETCH;
      for (let xi = 0; xi < COLS - 1; xi++) {
        const wx0 = XMIN + (xi / (COLS - 1)) * (XMAX - XMIN);
        const wx1 = XMIN + ((xi + 1) / (COLS - 1)) * (XMAX - XMIN);
        const h0 = H[zi][xi], h1 = H[zi][xi + 1];
        if (h0 > 0.05 || h1 > 0.05) {
          seg(wx0, h0, dz, wx1, h1, dz);
        }
      }
    }

    /* ─── Skirt lines — mountain meets ground ────────────────── */
    const skirtVerts: number[] = [], skirtCols: number[] = [];
    const SKIRT_THRESH = 0.2;
    const skirtStep = mobile ? 3 : 2;

    for (let zi = 0; zi < ROWS; zi += skirtStep) {
      const wz = ZMIN + (zi / (ROWS - 1)) * (ZMAX - ZMIN);
      const dz = wz * Z_STRETCH;
      // West edge
      for (let xi = 0; xi < COLS; xi++) {
        if (H[zi][xi] > SKIRT_THRESH) {
          const wx = XMIN + (xi / (COLS - 1)) * (XMAX - XMIN);
          skirtVerts.push(wx, H[zi][xi], dz, wx, 0, dz);
          const t = H[zi][xi] / MAX_H;
          skirtCols.push(0.02+t*0.18, 0.04+t*0.25, 0.14+t*0.35, 0.01, 0.02, 0.06);
          break;
        }
      }
      // East edge
      for (let xi = COLS - 1; xi >= 0; xi--) {
        if (H[zi][xi] > SKIRT_THRESH) {
          const wx = XMIN + (xi / (COLS - 1)) * (XMAX - XMIN);
          skirtVerts.push(wx, H[zi][xi], dz, wx, 0, dz);
          const t = H[zi][xi] / MAX_H;
          skirtCols.push(0.02+t*0.10, 0.03+t*0.15, 0.10+t*0.22, 0.01, 0.02, 0.05);
          break;
        }
      }
    }

    // Connect west base outline
    const westBase: Array<[number, number]> = [];
    for (let zi = 0; zi < ROWS; zi++) {
      const wz = ZMIN + (zi / (ROWS - 1)) * (ZMAX - ZMIN);
      for (let xi = 0; xi < COLS; xi++) {
        if (H[zi][xi] > SKIRT_THRESH) {
          westBase.push([XMIN + (xi / (COLS - 1)) * (XMAX - XMIN), wz * Z_STRETCH]);
          break;
        }
      }
    }
    for (let i = 0; i < westBase.length - 1; i++) {
      skirtVerts.push(westBase[i][0], 0, westBase[i][1], westBase[i+1][0], 0, westBase[i+1][1]);
      skirtCols.push(0.02, 0.04, 0.12, 0.02, 0.04, 0.12);
    }

    const skirtGeo = new THREE.BufferGeometry();
    skirtGeo.setAttribute("position", new THREE.Float32BufferAttribute(skirtVerts, 3));
    skirtGeo.setAttribute("color", new THREE.Float32BufferAttribute(skirtCols, 3));
    const skirtMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.55 });
    scene.add(new THREE.LineSegments(skirtGeo, skirtMat));

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    geo.setAttribute("color", new THREE.Float32BufferAttribute(colA, 3));
    const mat = new THREE.LineBasicMaterial({ vertexColors: true, opacity: 0.90, transparent: true });
    scene.add(new THREE.LineSegments(geo, mat));

    /* ─── Infinite ground grid ───────────────────────────────── */
    const gridVerts: number[] = [], gridCols: number[] = [];
    const GE = 350; // extent
    const GSP = 3.0;
    const gOp = 0.09;

    for (let z = -GE; z <= GE; z += GSP) {
      gridVerts.push(-GE, 0, z, GE, 0, z);
      gridCols.push(0.06*gOp, 0.12*gOp, 0.35*gOp, 0.06*gOp, 0.12*gOp, 0.35*gOp);
    }
    for (let x = -GE; x <= GE; x += GSP) {
      gridVerts.push(x, 0, -GE, x, 0, GE);
      gridCols.push(0.06*gOp, 0.12*gOp, 0.35*gOp, 0.06*gOp, 0.12*gOp, 0.35*gOp);
    }

    const gridGeo = new THREE.BufferGeometry();
    gridGeo.setAttribute("position", new THREE.Float32BufferAttribute(gridVerts, 3));
    gridGeo.setAttribute("color", new THREE.Float32BufferAttribute(gridCols, 3));
    const gridMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 1 });
    scene.add(new THREE.LineSegments(gridGeo, gridMat));

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
      const dst = orbitPos(kf.theta + mouse.x * 0.03, kf.phi - mouse.y * 0.008, kf.r);
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
      skirtGeo.dispose(); skirtMat.dispose();
      gridGeo.dispose(); gridMat.dispose();
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [onCameraUpdate]);

  return (
    <div ref={mountRef} style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }} />
  );
}
